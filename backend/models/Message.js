const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  firId:    { type: mongoose.Schema.Types.ObjectId, ref: 'FIR', required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = broadcast to case participants
  content:  { type: String, required: true },
  isSystemMessage: { type: Boolean, default: false },
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
