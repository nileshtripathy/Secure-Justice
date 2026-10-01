const multer = require('multer');
const { logError } = require('../utils/logger');

const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : 'Invalid file upload';
    return res.status(400).json({ message });
  }
  if (err && err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  logError('unhandled', err);
  return res.status(500).json({ message: 'Server error' });
};

module.exports = { notFound, errorHandler };
