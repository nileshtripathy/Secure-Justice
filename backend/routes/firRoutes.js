const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/rateLimit');
const { createFIR, getFIRs, getFIRById, trackFIR, updateFIRStatus, deleteFIR, getAnalytics } = require('../controllers/firController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public case tracking is rate limited so case numbers cannot be enumerated.
const trackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });

router.route('/')
  .post(protect, authorize('citizen', 'police', 'admin'), createFIR)
  .get(protect, getFIRs);

// Static routes must be declared before '/:id'
router.get('/track/:caseNumber', trackLimiter, trackFIR);
router.get('/analytics', protect, authorize('admin', 'police'), getAnalytics);

router.route('/:id')
  .get(protect, getFIRById)
  .put(protect, authorize('police', 'admin', 'judge', 'forensic'), updateFIRStatus)
  .delete(protect, authorize('citizen', 'admin'), deleteFIR);

module.exports = router;
