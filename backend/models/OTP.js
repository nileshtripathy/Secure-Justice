const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  // pending registration data stored alongside OTP
  name: { type: String },
  password: { type: String },
  role: { type: String },
  idCardPath: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-delete after 5 minutes
});

module.exports = mongoose.model('OTP', otpSchema);
