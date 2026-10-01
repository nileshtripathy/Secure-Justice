const mongoose = require('mongoose');
const { FIR_STATUSES } = require('../config/constants');

const firSchema = new mongoose.Schema({
  caseNumber:     { type: String, unique: true, required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  complaintText:  { type: String, required: true, maxlength: 5000 },
  crimeType:      { type: String, required: true, enum: ['Theft', 'Cybercrime', 'Fraud', 'Violence', 'Other'] },
  location:       { type: String, required: true, maxlength: 300 },
  geoLat:         { type: Number },
  geoLng:         { type: Number },
  isAnonymous:    { type: Boolean, default: false },
  status:         { type: String, enum: FIR_STATUSES, default: 'pending', index: true },
  date:             { type: Date, default: Date.now },
  assignedPoliceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  judgment:         { type: String, default: '' },
  judgmentDate:     { type: Date },
  judgmentBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('FIR', firSchema);
