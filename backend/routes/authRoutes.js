const express = require('express');
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'idcard-' + Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const {
  sendOTP,
  verifyOTPAndRegister,
  authUser,
  getUserProfile,
  verifyEmailForReset,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', upload.single('idCard'), sendOTP);
router.post('/verify-otp', verifyOTPAndRegister);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgot-password/verify-email', verifyEmailForReset);
router.post('/reset-password', resetPassword);

module.exports = router;
