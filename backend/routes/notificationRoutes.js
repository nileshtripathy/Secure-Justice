const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// GET my notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('firId', 'caseNumber crimeType')
      .sort('-createdAt')
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH mark all as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH mark one as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
