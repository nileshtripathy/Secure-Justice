const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const { loadAccessibleFIR } = require('../utils/access');
const { notify, firRecipients } = require('../utils/notify');
const { cleanString } = require('../utils/validate');
const { logError } = require('../utils/logger');

// GET messages for a FIR
router.get('/fir/:firId', protect, async (req, res) => {
  try {
    const fir = await loadAccessibleFIR(req.user, req.params.firId);
    if (!fir) return res.status(404).json({ message: 'FIR not found' });
    const messages = await Message.find({ firId: fir._id }).populate('sender', 'name role').sort('createdAt');
    return res.json(messages);
  } catch (err) {
    logError('messages:get', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST send a message on a FIR
router.post('/fir/:firId', protect, async (req, res) => {
  try {
    const content = cleanString(req.body.content, 2000);
    if (!content) return res.status(400).json({ message: 'Message cannot be empty' });

    const fir = await loadAccessibleFIR(req.user, req.params.firId);
    if (!fir) return res.status(404).json({ message: 'FIR not found' });

    const msg = await Message.create({ firId: fir._id, sender: req.user.id, content });
    await msg.populate('sender', 'name role');

    const io = req.app.get('io');
    if (io) io.to(`fir_${fir._id}`).emit('new-message', msg);
    await notify(io, {
      recipients: firRecipients(fir), actorId: req.user.id, firId: fir._id,
      title: 'New Message', message: `New message on case ${fir.caseNumber || 'Unknown'}`, type: 'message',
    });

    return res.status(201).json(msg);
  } catch (err) {
    logError('messages:post', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
