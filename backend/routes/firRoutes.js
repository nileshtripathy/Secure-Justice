const express = require('express');
const router = express.Router();
const { createFIR, getFIRs, getFIRById, updateFIRStatus, deleteFIR, getAnalytics } = require('../controllers/firController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('citizen', 'police', 'admin'), createFIR)
  .get(protect, getFIRs);

router.route('/analytics')
  .get(protect, authorize('admin', 'police'), getAnalytics);

router.route('/:id')
  .get(protect, getFIRById)
  .put(protect, authorize('police', 'admin', 'judge'), updateFIRStatus)
  .delete(protect, deleteFIR);

module.exports = router;
