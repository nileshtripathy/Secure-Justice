const mongoose = require('mongoose');

const caseLogSchema = new mongoose.Schema({
  firId: { type: mongoose.Schema.Types.ObjectId, ref: 'FIR', required: true },
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CaseLog', caseLogSchema);
