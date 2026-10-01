const crypto = require('crypto');
const fs = require('fs');
const Evidence = require('../models/Evidence');
const CaseLog = require('../models/CaseLog');
const hashEvidence = require('../utils/hashEvidence');
const { removeFile, resolveUpload } = require('../middleware/upload');
const { loadAccessibleFIR, canAccessFIR } = require('../utils/access');
const { notify, firRecipients } = require('../utils/notify');
const { cleanString, isObjectId } = require('../utils/validate');
const { logError } = require('../utils/logger');
const FIR = require('../models/FIR');

// POST /api/evidence/upload  (multipart: file, firId, description)
exports.uploadEvidence = async (req, res) => {
  const filePath = req.file ? req.file.path : null;
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { firId } = req.body;
    const fir = await loadAccessibleFIR(req.user, firId);
    if (!fir) { removeFile(filePath); return res.status(404).json({ message: 'FIR not found' }); }
    if (fir.status === 'closed') { removeFile(filePath); return res.status(400).json({ message: 'Cannot add evidence to a closed case' }); }

    // SHA-256 fingerprint computed from the stored file (streamed, non-blocking)
    const fileHash = await hashEvidence(filePath);

    const evidence = await Evidence.create({
      firId: fir._id,
      fileUrl: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileHash,
      uploadedBy: req.user.id,
      description: cleanString(req.body.description, 500),
    });

    await CaseLog.create({ firId: fir._id, action: `Evidence uploaded (SHA-256 ${fileHash.slice(0, 12)}…)`, performedBy: req.user.id });
    await evidence.populate('uploadedBy', 'name role');

    const io = req.app.get('io');
    if (io) io.to(`fir_${fir._id}`).emit('new-evidence', evidence);
    await notify(io, {
      recipients: firRecipients(fir), actorId: req.user.id, firId: fir._id,
      title: 'New Evidence', message: `New evidence uploaded on case ${fir.caseNumber || 'Unknown'}`, type: 'evidence',
    });

    return res.status(201).json(evidence);
  } catch (error) {
    removeFile(filePath); // never leave an orphan file if the DB write failed
    logError('uploadEvidence', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/evidence/fir/:firId
exports.getEvidenceByFIR = async (req, res) => {
  try {
    const fir = await loadAccessibleFIR(req.user, req.params.firId);
    if (!fir) return res.status(404).json({ message: 'FIR not found' });
    const evidence = await Evidence.find({ firId: fir._id }).populate('uploadedBy', 'name role').sort('timestamp');
    return res.json(evidence);
  } catch (error) {
    logError('getEvidenceByFIR', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Shared: load evidence + make sure the caller may see its case.
const loadAccessibleEvidence = async (user, id) => {
  if (!isObjectId(id)) return null;
  const evidence = await Evidence.findById(id);
  if (!evidence) return null;
  const fir = await FIR.findById(evidence.firId).select('userId');
  return fir && canAccessFIR(user, fir) ? evidence : null;
};

// GET /api/evidence/file/:id   (authenticated download - uploads are NOT publicly served)
exports.downloadEvidence = async (req, res) => {
  try {
    const evidence = await loadAccessibleEvidence(req.user, req.params.id);
    const abs = evidence && resolveUpload(evidence.fileUrl);
    if (!abs) return res.status(404).json({ message: 'Evidence not found' });

    res.type(evidence.mimeType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(evidence.originalName || 'evidence')}"`);
    return res.sendFile(abs, (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: 'File missing on server' });
    });
  } catch (error) {
    logError('downloadEvidence', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/evidence/verify/:id
// Re-hashes the stored file and compares it with the SHA-256 recorded at upload time.
exports.verifyEvidence = async (req, res) => {
  try {
    const evidence = await loadAccessibleEvidence(req.user, req.params.id);
    if (!evidence) return res.status(404).json({ message: 'Evidence not found' });

    const abs = resolveUpload(evidence.fileUrl);
    if (!abs || !fs.existsSync(abs)) {
      await CaseLog.create({ firId: evidence.firId, action: 'Evidence verification FAILED - file missing', performedBy: req.user.id });
      return res.json({ verified: false, message: 'The evidence file is missing from storage.', originalHash: evidence.fileHash, currentHash: null });
    }

    const currentHash = await hashEvidence(abs);
    const a = Buffer.from(currentHash);
    const b = Buffer.from(evidence.fileHash);
    const verified = a.length === b.length && crypto.timingSafeEqual(a, b);

    await CaseLog.create({
      firId: evidence.firId,
      action: verified ? 'Evidence integrity verified' : 'Evidence verification FAILED - hash mismatch (possible tampering)',
      performedBy: req.user.id,
    });

    return res.json({
      verified,
      message: verified
        ? 'Evidence integrity is maintained. The file matches its original SHA-256 hash.'
        : 'WARNING: the file does not match its original hash. It may have been altered.',
      originalHash: evidence.fileHash,
      currentHash,
    });
  } catch (error) {
    logError('verifyEvidence', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
