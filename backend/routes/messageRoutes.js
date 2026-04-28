const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const FIR = require('../models/FIR');

// GET messages for a FIR
router.get('/fir/:firId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ firId: req.params.firId })
      .populate('sender', 'name role')
      .sort('createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST send a message on a FIR
router.post('/fir/:firId', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const msg = await Message.create({
      firId: req.params.firId,
      sender: req.user.id,
      content: content.trim(),
    });

    await msg.populate('sender', 'name role');

    // Socket.io Real-time Emission
    const io = req.app.get('io');
    if (io) {
      io.to(`fir_${req.params.firId}`).emit('new-message', msg);
      
      const fir = await FIR.findById(req.params.firId);
      if (fir) {
        if (fir.userId && fir.userId.toString() !== req.user.id) {
          io.to(fir.userId.toString()).emit('global-notification', {
            type: 'message',
            title: 'New Message',
            body: `You received a new message on case ${fir.caseNumber || 'Unknown'}`,
            firId: fir._id
          });
        }
        if (fir.assignedPoliceId && fir.assignedPoliceId.toString() !== req.user.id) {
          io.to(fir.assignedPoliceId.toString()).emit('global-notification', {
            type: 'message',
            title: 'New Message',
            body: `New message on case ${fir.caseNumber || 'Unknown'}`,
            firId: fir._id
          });
        }
      }
    }

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
