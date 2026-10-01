const Notification = require('../models/Notification');
const { logError } = require('./logger');

// People who care about a case: the complainant and the assigned officer.
const firRecipients = (fir) => [fir.userId, fir.assignedPoliceId];

/**
 * Persists a notification for each recipient (except the actor) and pushes it live over Socket.io.
 * Failures are logged but never break the request that triggered them.
 */
const notify = async (io, { recipients, actorId, firId, title, message, type }) => {
  try {
    const ids = [...new Set(recipients.filter(Boolean).map((r) => String(r._id || r)))].filter(
      (id) => id !== String(actorId)
    );
    if (!ids.length) return;
    await Notification.insertMany(ids.map((userId) => ({ userId, firId, title, message, type })));
    if (io) {
      ids.forEach((id) => io.to(id).emit('global-notification', { type, title, body: message, firId }));
    }
  } catch (err) {
    logError('notify', err);
  }
};

module.exports = { notify, firRecipients };
