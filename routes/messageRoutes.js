const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

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
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
