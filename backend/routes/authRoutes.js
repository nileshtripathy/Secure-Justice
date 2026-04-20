const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTPAndRegister,
  authUser,
  getUserProfile,
  verifyEmailForReset,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgot-password/verify-email', verifyEmailForReset);
router.post('/reset-password', resetPassword);

module.exports = router;
