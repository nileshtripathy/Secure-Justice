const crypto = require('crypto');
const FIR = require('../models/FIR');
const CaseLog = require('../models/CaseLog');

exports.createFIR = async (req, res) => {
  const { complaintText, crimeType, location, isAnonymous } = req.body;

  try {
    const caseNumber = 'FIR-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
    const fir = await FIR.create({
      userId: req.user.id,
      caseNumber,
      complaintText,
      crimeType,
      location,
      isAnonymous: isAnonymous || false,
    });

    // Create log
    await CaseLog.create({
      firId: fir._id,
      action: 'FIR Filed',
      performedBy: req.user.id
    });

    res.status(201).json(fir);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFIRs = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') {
      query.userId = req.user.id;
    }
    // Police see all, or assigned
    const firs = await FIR.find(query).populate('userId', 'name email').sort('-date');
    res.json(firs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFIRById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const id = req.params.id;
    let query;

    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { caseNumber: id }] };
    } else {
      query = { caseNumber: id };
    }

    const fir = await FIR.findOne(query)
      .populate('userId', 'name email')
      .populate('assignedPoliceId', 'name');
      
    if (!fir) {
      return res.status(404).json({ message: 'FIR not found' });
    }
    
    // Add role based access check here if needed
    res.json(fir);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFIRStatus = async (req, res) => {
  const { status, assignedPoliceId } = req.body;
  
  try {
    const fir = await FIR.findById(req.params.id);
    
    if (!fir) {
      return res.status(404).json({ message: 'FIR not found' });
    }
    
    if (status) fir.status = status;
    if (assignedPoliceId) fir.assignedPoliceId = assignedPoliceId;
    
    await fir.save();
    
    await CaseLog.create({
      firId: fir._id,
      action: `Status updated to ${status}`,
      performedBy: req.user.id
    });
    
    res.json(fir);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalFIRs = await FIR.countDocuments();
    const pendingFIRs = await FIR.countDocuments({ status: 'pending' });
    const verifiedFIRs = await FIR.countDocuments({ status: 'verified' });
    
    const crimeTypes = await FIR.aggregate([
      { $group: { _id: '$crimeType', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalFIRs,
      pendingFIRs,
      verifiedFIRs,
      crimeTypes
    });
  } catch (error) {
     res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFIR = async (req, res) => {
  try {
    const fir = await FIR.findById(req.params.id);
    if (!fir) {
      return res.status(404).json({ message: 'FIR not found' });
    }
    
    await FIR.deleteOne({ _id: req.params.id });
    
    await CaseLog.create({
      firId: req.params.id,
      action: 'FIR Deleted',
      performedBy: req.user.id
    });
    
    res.json({ message: 'FIR removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
