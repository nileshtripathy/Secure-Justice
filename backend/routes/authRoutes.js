const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/rateLimit');
const { idCardUpload } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  sendOTP, verifyOTPAndRegister, authUser, getUserProfile,
  verifyEmailForReset, resetPassword, listPendingUsers, reviewUser, getIdCard,
} = require('../controllers/authController');

// Brute-force / abuse protection on the public endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many OTP requests, please try again later.' });

router.post('/send-otp', otpLimiter, idCardUpload.single('idCard'), sendOTP);
router.post('/verify-otp', authLimiter, verifyOTPAndRegister);
router.post('/login', authLimiter, authUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgot-password/verify-email', otpLimiter, verifyEmailForReset);
router.post('/reset-password', authLimiter, resetPassword);

// Admin approval of police / forensic / lawyer accounts
router.get('/admin/pending', protect, authorize('admin'), listPendingUsers);
router.patch('/admin/users/:id', protect, authorize('admin'), reviewUser);
router.get('/admin/users/:id/id-card', protect, authorize('admin'), getIdCard);

module.exports = router;
