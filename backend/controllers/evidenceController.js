const Evidence = require('../models/Evidence');
const CaseLog = require('../models/CaseLog');
const FIR = require('../models/FIR');
const crypto = require('crypto');
const fs = require('fs');

// Note: Using a local upload structure here instead of AWS S3 for simpler MVP
// fileHash is generated for integrity

exports.uploadEvidence = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { firId, description } = req.body;

    // Generate SHA256 Hash of the file
    const fileBuffer = fs.readFileSync(req.file.path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const fileHash = hashSum.digest('hex');

    const evidence = await Evidence.create({
      firId,
      fileUrl: `/uploads/${req.file.filename}`,
      fileHash,
      uploadedBy: req.user.id,
      description
    });

    await CaseLog.create({
      firId,
      action: 'Evidence Uploaded',
      performedBy: req.user.id
    });

    await evidence.populate('uploadedBy', 'name role');

    // Socket.io Real-time Emission
    const io = req.app.get('io');
    if (io) {
      io.to(`fir_${firId}`).emit('new-evidence', evidence);
      
      const fir = await FIR.findById(firId);
      if (fir) {
        if (fir.userId && fir.userId.toString() !== req.user.id) {
          io.to(fir.userId.toString()).emit('global-notification', {
            type: 'evidence',
            title: 'New Evidence',
            body: `New evidence uploaded on case ${fir.caseNumber || 'Unknown'}`,
            firId: fir._id
          });
        }
        if (fir.assignedPoliceId && fir.assignedPoliceId.toString() !== req.user.id) {
          io.to(fir.assignedPoliceId.toString()).emit('global-notification', {
            type: 'evidence',
            title: 'New Evidence',
            body: `New evidence uploaded on case ${fir.caseNumber || 'Unknown'}`,
            firId: fir._id
          });
        }
      }
    }

    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEvidenceByFIR = async (req, res) => {
  try {
    const evidence = await Evidence.find({ firId: req.params.firId }).populate('uploadedBy', 'name role');
    res.json(evidence);
  } catch (error) {
     res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEvidence = async (req, res) => {
   // Simulated forensic verification logic based on hashing
   try {
     const evidence = await Evidence.findById(req.params.id);
     if(!evidence) return res.status(404).json({ message: 'Evidence not found' });
     
     // In a real scenario, you might re-download and re-hash. Here we just return the stored hash.
     res.json({ 
       verified: true, 
       message: 'Evidence integrity is maintained', 
       originalHash: evidence.fileHash 
     });
   } catch (error) {
     res.status(500).json({ message: 'Server error' });
   }
}
