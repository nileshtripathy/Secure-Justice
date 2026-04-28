const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  firId: { type: mongoose.Schema.Types.ObjectId, ref: 'FIR', required: true },
  fileUrl: { type: String, required: true },
  fileHash: { type: String, required: true }, // SHA256 Hash
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Evidence', evidenceSchema);
