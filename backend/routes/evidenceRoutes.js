const express = require('express');
const router = express.Router();
const { evidenceUpload } = require('../middleware/upload');
const { uploadEvidence, getEvidenceByFIR, downloadEvidence, verifyEvidence } = require('../controllers/evidenceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { EVIDENCE_UPLOAD_ROLES, EVIDENCE_VERIFY_ROLES } = require('../config/constants');

router.post('/upload', protect, authorize(...EVIDENCE_UPLOAD_ROLES), evidenceUpload.single('file'), uploadEvidence);
router.get('/fir/:firId', protect, getEvidenceByFIR);
router.get('/file/:id', protect, downloadEvidence);
router.get('/verify/:id', protect, authorize(...EVIDENCE_VERIFY_ROLES), verifyEvidence);

module.exports = router;
