const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ROLES, default: 'citizen' },
  // 'pending' = waiting for admin approval (police/forensic/lawyer). Only 'active' users can log in.
  status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'active' },
  idCardPath: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
