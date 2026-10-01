const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  purpose: { type: String, enum: ['register', 'reset'], required: true },
  otpHash: { type: String, required: true }, // HMAC of the code, never the plain code
  attempts: { type: Number, default: 0 },
  // pending registration data (password is already bcrypt-hashed)
  name: { type: String },
  password: { type: String },
  role: { type: String },
  idCardPath: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // TTL index: auto-delete after 5 minutes
});

module.exports = mongoose.model('OTP', otpSchema);
