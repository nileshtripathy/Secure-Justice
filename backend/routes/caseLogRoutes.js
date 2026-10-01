const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const CaseLog = require('../models/CaseLog');
const { loadAccessibleFIR } = require('../utils/access');
const { logError } = require('../utils/logger');

// GET /api/caselogs/:firId
router.get('/:firId', protect, async (req, res) => {
  try {
    const fir = await loadAccessibleFIR(req.user, req.params.firId);
    if (!fir) return res.status(404).json({ message: 'FIR not found' });
    const logs = await CaseLog.find({ firId: fir._id }).populate('performedBy', 'name role').sort('timestamp');
    return res.json(logs);
  } catch (err) {
    logError('caselogs', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
