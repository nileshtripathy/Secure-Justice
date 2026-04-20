const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const CaseLog = require('../models/CaseLog');

// GET /api/caselogs/:firId
router.get('/:firId', protect, async (req, res) => {
  try {
    const logs = await CaseLog.find({ firId: req.params.firId })
      .populate('performedBy', 'name role')
      .sort('timestamp');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
