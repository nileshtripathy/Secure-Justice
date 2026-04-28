const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadEvidence, getEvidenceByFIR, verifyEvidence } = require('../controllers/evidenceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({ storage: storage })

router.post('/upload', protect, upload.single('file'), uploadEvidence);
router.get('/fir/:firId', protect, getEvidenceByFIR);
router.get('/verify/:id', protect, authorize('forensic', 'judge', 'police'), verifyEvidence);

module.exports = router;
