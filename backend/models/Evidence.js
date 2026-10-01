const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  firId: { type: mongoose.Schema.Types.ObjectId, ref: 'FIR', required: true, index: true },
  fileUrl: { type: String, required: true }, // stored file name (served only via the authenticated route)
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  fileHash: { type: String, required: true }, // SHA-256 computed at upload time
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Evidence', evidenceSchema);
