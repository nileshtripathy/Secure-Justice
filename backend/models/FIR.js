const mongoose = require('mongoose');

const firSchema = new mongoose.Schema({
  caseNumber:     { type: String, unique: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  complaintText:  { type: String, required: true },
  crimeType:      { type: String, required: true },
  location:       { type: String, required: true },
  geoLat:         { type: Number },
  geoLng:         { type: Number },
  isAnonymous:    { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'investigating', 'forensic_review', 'legal_review', 'closed'],
    default: 'pending' 
  },
  date:             { type: Date, default: Date.now },
  assignedPoliceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  judgment:         { type: String, default: '' },
  judgmentDate:     { type: Date },
  judgmentBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('FIR', firSchema);

