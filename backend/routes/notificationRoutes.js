const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const { isObjectId } = require('../utils/validate');
const { logError } = require('../utils/logger');

// GET my notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('firId', 'caseNumber crimeType')
      .sort('-createdAt')
      .limit(50);
    return res.json(notifications);
  } catch (err) {
    logError('notifications:list', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    return res.json({ count });
  } catch (err) {
    logError('notifications:count', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PATCH mark all as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    logError('notifications:read-all', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PATCH mark one as read - scoped to the owner so nobody can touch another user's notifications
router.patch('/:id/read', protect, async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid notification id' });
    const result = await Notification.updateOne({ _id: req.params.id, userId: req.user.id }, { isRead: true });
    if (!result.matchedCount) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    logError('notifications:read', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
