const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firId:   { type: mongoose.Schema.Types.ObjectId, ref: 'FIR' },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['status_change', 'evidence', 'message', 'assignment', 'judgment'], default: 'status_change' },
  isRead:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
