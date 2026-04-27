const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'police', 'forensic', 'lawyer', 'victim', 'defendant', 'judge', 'admin'],
    default: 'citizen' 
  },
  idCardPath: { type: String }, // path to uploaded ID card for specific roles
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
