const crypto = require('crypto');
const FIR = require('../models/FIR');
const CaseLog = require('../models/CaseLog');
const Notification = require('../models/Notification');

// Helper: generate FIR-YYYY-NNNNN
const generateCaseNumber = async () => {
  const year = new Date().getFullYear();
  const count = await FIR.countDocuments();
  const seq = String(count + 1).padStart(5, '0');
  return `FIR-${year}-${seq}`;
};

exports.createFIR = async (req, res) => {
  const { complaintText, crimeType, location, isAnonymous, geoLat, geoLng } = req.body;

  try {
    const caseNumber = await generateCaseNumber();
    const fir = await FIR.create({
      caseNumber,
      userId: req.user.id,
      complaintText,
      crimeType,
      location,
      isAnonymous: isAnonymous || false,
      geoLat: geoLat || null,
      geoLng: geoLng || null,
    });

    await CaseLog.create({ firId: fir._id, action: 'FIR Filed', performedBy: req.user.id });
    res.status(201).json(fir);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFIRs = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') {
      query.userId = req.user.id;
    }
    const firs = await FIR.find(query).populate('userId', 'name email').sort('-date');
    res.json(firs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFIRById = async (req, res) => {
  try {
    const param = req.params.id;

    // Support lookup by caseNumber (FIR-YYYY-NNNNN) OR by MongoDB _id
    const fir = await (
      /^FIR-\d{4}-\d+$/i.test(param)
        ? FIR.findOne({ caseNumber: param.toUpperCase() })
        : FIR.findById(param)
    );

    if (fir) {
      await fir.populate('userId', 'name email');
      await fir.populate('assignedPoliceId', 'name');
    }
      
    if (!fir) {
      return res.status(404).json({ message: 'FIR not found' });
    }
    
    res.json(fir);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateFIRStatus = async (req, res) => {
  const { status, assignedPoliceId, judgment } = req.body;
  
  try {
    const fir = await FIR.findById(req.params.id);
    if (!fir) return res.status(404).json({ message: 'FIR not found' });

    const oldStatus = fir.status;
    if (status) fir.status = status;
    if (assignedPoliceId) fir.assignedPoliceId = assignedPoliceId;
    if (judgment !== undefined) {
      fir.judgment = judgment;
      fir.judgmentDate = new Date();
      fir.judgmentBy = req.user.id;
    }

    await fir.save();

    const action = judgment
      ? `Judgment recorded by ${req.user.role}`
      : `Status updated to ${status}`;

    await CaseLog.create({ firId: fir._id, action, performedBy: req.user.id });

    // Notify the case owner
    if (status && status !== oldStatus) {
      await Notification.create({
        userId: fir.userId,
        firId: fir._id,
        title: `Case ${fir.caseNumber || ''} Updated`,
        message: `Your case status changed from "${oldStatus}" to "${status}".`,
        type: 'status_change',
      });
    }

    res.json(fir);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteFIR = async (req, res) => {
  try {
    const fir = await FIR.findById(req.params.id);
    if (!fir) return res.status(404).json({ message: 'FIR not found' });

    const isCitizen = req.user.role === 'citizen';
    const isOwner   = fir.userId.toString() === req.user.id;
    const isAdminOrPolice = ['admin', 'police'].includes(req.user.role);

    // Citizens can only delete their OWN pending cases
    if (isCitizen && (!isOwner || fir.status !== 'pending')) {
      return res.status(403).json({ message: 'You can only delete your own pending cases.' });
    }

    // Other non-admin/police roles cannot delete
    if (!isCitizen && !isAdminOrPolice) {
      return res.status(403).json({ message: 'Not authorized to delete cases.' });
    }

    await FIR.findByIdAndDelete(req.params.id);
    // Also clean up related logs and messages
    await CaseLog.deleteMany({ firId: req.params.id });

    res.json({ message: 'FIR deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalFIRs = await FIR.countDocuments();
    const pendingFIRs = await FIR.countDocuments({ status: 'pending' });
    const verifiedFIRs = await FIR.countDocuments({ status: 'verified' });
    
    const crimeTypes = await FIR.aggregate([
      { $group: { _id: '$crimeType', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalFIRs,
      pendingFIRs,
      verifiedFIRs,
      crimeTypes
    });
  } catch (error) {
     res.status(500).json({ message: 'Server error' });
  }
};
