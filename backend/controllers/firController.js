const crypto = require('crypto');
const FIR = require('../models/FIR');
const User = require('../models/User');
const CaseLog = require('../models/CaseLog');
const Evidence = require('../models/Evidence');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { removeFile, resolveUpload } = require('../middleware/upload');
const { canAccessFIR, maskFIR, idOf } = require('../utils/access');
const { notify, firRecipients } = require('../utils/notify');
const { cleanString, isObjectId, isString } = require('../utils/validate');
const { logError } = require('../utils/logger');
const { OWN_CASES_ONLY, FIR_STATUSES, STATUS_PERMISSIONS } = require('../config/constants');

const CRIME_TYPES = FIR.schema.path('crimeType').enumValues;
const CASE_NUMBER_RE = /^FIR-\d{4}-\d{4,10}$/;

const makeCaseNumber = () => `FIR-${new Date().getFullYear()}-${crypto.randomInt(10000000, 100000000)}`;

// POST /api/fir
exports.createFIR = async (req, res) => {
  try {
    const complaintText = cleanString(req.body.complaintText, 5000);
    const location = cleanString(req.body.location, 300);
    const { crimeType } = req.body;
    if (!complaintText || !location) return res.status(400).json({ message: 'Complaint text and location are required' });
    if (!isString(crimeType) || !CRIME_TYPES.includes(crimeType)) {
      return res.status(400).json({ message: `Crime type must be one of: ${CRIME_TYPES.join(', ')}` });
    }

    let fir;
    for (let attempt = 0; attempt < 5 && !fir; attempt += 1) {
      try {
        fir = await FIR.create({
          userId: req.user.id,
          caseNumber: makeCaseNumber(),
          complaintText,
          crimeType,
          location,
          isAnonymous: req.body.isAnonymous === true || req.body.isAnonymous === 'true',
        });
      } catch (err) {
        if (!(err && err.code === 11000)) throw err; // retry only on a case-number collision
      }
    }
    if (!fir) return res.status(500).json({ message: 'Could not generate a case number, please retry' });

    await CaseLog.create({ firId: fir._id, action: 'FIR Filed', performedBy: req.user.id });
    return res.status(201).json(fir);
  } catch (error) {
    logError('createFIR', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/fir
exports.getFIRs = async (req, res) => {
  try {
    const query = OWN_CASES_ONLY.includes(req.user.role) ? { userId: req.user.id } : {};
    const firs = await FIR.find(query).populate('userId', 'name email').sort('-date').limit(500);
    return res.json(firs.map((f) => maskFIR(f, req.user)));
  } catch (error) {
    logError('getFIRs', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/fir/:id   (Mongo _id or case number)
exports.getFIRById = async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    if (isObjectId(id)) query = { _id: id };
    else if (CASE_NUMBER_RE.test(id)) query = { caseNumber: id };
    else return res.status(404).json({ message: 'FIR not found' });

    const fir = await FIR.findOne(query);
    // Same answer for "missing" and "not yours" so ids cannot be probed.
    if (!fir || !canAccessFIR(req.user, fir)) return res.status(404).json({ message: 'FIR not found' });

    await fir.populate([
      { path: 'userId', select: 'name email' },
      { path: 'assignedPoliceId', select: 'name' },
    ]);
    return res.json(maskFIR(fir, req.user));
  } catch (error) {
    logError('getFIRById', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/fir/track/:caseNumber   (PUBLIC - deliberately minimal data)
exports.trackFIR = async (req, res) => {
  try {
    const { caseNumber } = req.params;
    if (!CASE_NUMBER_RE.test(caseNumber)) return res.status(404).json({ message: 'Case not found' });

    const fir = await FIR.findOne({ caseNumber }).select('caseNumber crimeType status date');
    if (!fir) return res.status(404).json({ message: 'Case not found' });

    const logs = await CaseLog.find({ firId: fir._id }).select('action timestamp').sort('timestamp');
    return res.json({
      caseNumber: fir.caseNumber,
      crimeType: fir.crimeType,
      status: fir.status,
      date: fir.date,
      logs: logs.map((l) => ({ _id: l._id, action: l.action, timestamp: l.timestamp })),
    });
  } catch (error) {
    logError('trackFIR', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/fir/:id   { status?, assignedPoliceId?, judgment? }
exports.updateFIRStatus = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'FIR not found' });
    const fir = await FIR.findById(req.params.id);
    if (!fir || !canAccessFIR(req.user, fir)) return res.status(404).json({ message: 'FIR not found' });

    const { status, assignedPoliceId, judgment } = req.body;
    const role = req.user.role;
    const io = req.app.get('io');
    const label = fir.caseNumber || 'your case';

    if (fir.status === 'closed' && role !== 'admin') {
      return res.status(400).json({ message: 'This case is closed and can no longer be changed' });
    }
    if (status === undefined && assignedPoliceId === undefined && judgment === undefined) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    // ── Judgment (judge / admin only). Immutable once recorded; closes the case. ──
    if (judgment !== undefined) {
      if (!['judge', 'admin'].includes(role)) return res.status(403).json({ message: 'Only a judge can record a judgment' });
      const text = cleanString(judgment, 5000);
      if (!text) return res.status(400).json({ message: 'Judgment text is required' });
      if (fir.judgment) return res.status(400).json({ message: 'A judgment has already been recorded' });

      fir.judgment = text;
      fir.judgmentDate = new Date();
      fir.judgmentBy = req.user.id;
      fir.status = 'closed';
      await fir.save();
      await CaseLog.create({ firId: fir._id, action: 'Judgment recorded - case closed', performedBy: req.user.id });
      await notify(io, {
        recipients: firRecipients(fir), actorId: req.user.id, firId: fir._id,
        title: 'Judgment Recorded', message: `A judgment was recorded on case ${label}`, type: 'judgment',
      });
      return res.json(fir);
    }

    // ── Assignment (police / admin) ──
    if (assignedPoliceId !== undefined) {
      if (!['police', 'admin'].includes(role)) return res.status(403).json({ message: 'Only police or admin can assign an officer' });
      const targetId = assignedPoliceId === 'me' ? req.user.id : assignedPoliceId;
      if (!isObjectId(targetId)) return res.status(400).json({ message: 'Invalid officer id' });
      const officer = await User.findOne({ _id: targetId, role: 'police', status: 'active' }).select('name');
      if (!officer) return res.status(400).json({ message: 'Assigned user must be an active police officer' });

      if (idOf(fir.assignedPoliceId) !== targetId) {
        fir.assignedPoliceId = targetId;
        await CaseLog.create({ firId: fir._id, action: `Assigned to Officer ${officer.name}`, performedBy: req.user.id });
        await notify(io, {
          recipients: [targetId], actorId: req.user.id, firId: fir._id,
          title: 'Case Assigned', message: `Case ${label} was assigned to you`, type: 'assignment',
        });
      }
    }

    // ── Status change ──
    if (status !== undefined) {
      if (!isString(status) || !FIR_STATUSES.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${FIR_STATUSES.join(', ')}` });
      }
      const allowed = STATUS_PERMISSIONS[role] || [];
      if (!allowed.includes(status)) return res.status(403).json({ message: `Role ${role} cannot set status "${status}"` });

      if (status !== fir.status) {
        fir.status = status;
        await CaseLog.create({ firId: fir._id, action: `Status updated to ${status}`, performedBy: req.user.id });
        await notify(io, {
          recipients: firRecipients(fir), actorId: req.user.id, firId: fir._id,
          title: 'Case Status Updated', message: `Case ${label} is now "${status.replace('_', ' ')}"`, type: 'status_change',
        });
      }
    }

    await fir.save();
    if (io) io.to(`fir_${fir._id}`).emit('fir-updated', { firId: String(fir._id), status: fir.status });
    await fir.populate([{ path: 'userId', select: 'name email' }, { path: 'assignedPoliceId', select: 'name' }]);
    return res.json(maskFIR(fir, req.user));
  } catch (error) {
    logError('updateFIRStatus', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/fir/analytics   (admin, police)
exports.getAnalytics = async (req, res) => {
  try {
    const [totalFIRs, byStatus, crimeTypes] = await Promise.all([
      FIR.countDocuments(),
      FIR.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      FIR.aggregate([{ $group: { _id: '$crimeType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);
    const statusCounts = Object.fromEntries(FIR_STATUSES.map((s) => [s, 0]));
    byStatus.forEach((s) => { statusCounts[s._id] = s.count; });

    return res.json({
      totalFIRs,
      pendingFIRs: statusCounts.pending,
      verifiedFIRs: statusCounts.verified,
      statusCounts,
      crimeTypes,
    });
  } catch (error) {
    logError('getAnalytics', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/fir/:id   (admin: any case; citizen: own case while still pending)
exports.deleteFIR = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'FIR not found' });
    const fir = await FIR.findById(req.params.id);
    if (!fir || !canAccessFIR(req.user, fir)) return res.status(404).json({ message: 'FIR not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwnerPending = OWN_CASES_ONLY.includes(req.user.role) && fir.status === 'pending';
    if (!isAdmin && !isOwnerPending) {
      return res.status(403).json({ message: 'You are not allowed to delete this case' });
    }

    const evidence = await Evidence.find({ firId: fir._id }).select('fileUrl');
    evidence.forEach((e) => removeFile(resolveUpload(e.fileUrl)));
    await Promise.all([
      Evidence.deleteMany({ firId: fir._id }),
      Message.deleteMany({ firId: fir._id }),
      Notification.deleteMany({ firId: fir._id }),
    ]);
    await FIR.deleteOne({ _id: fir._id });

    // Case logs are intentionally kept as the audit trail of the deletion.
    await CaseLog.create({ firId: fir._id, action: `FIR ${fir.caseNumber} deleted`, performedBy: req.user.id });
    return res.json({ message: 'FIR removed' });
  } catch (error) {
    logError('deleteFIR', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
