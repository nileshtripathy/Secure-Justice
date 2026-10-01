const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
  'text/plain',
]);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.webm', '.mp3', '.wav', '.txt']);

// Random server-side file name: no user-controlled path/name ever reaches the disk.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) return cb(null, true);
  const err = new Error('Unsupported file type');
  err.status = 400;
  return cb(err);
};

const evidenceUpload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024, files: 1 } });
const idCardUpload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

const removeFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};

// Resolve a stored file name to an absolute path, refusing anything outside UPLOAD_DIR.
const resolveUpload = (stored) => {
  if (!stored) return null;
  const abs = path.resolve(UPLOAD_DIR, path.basename(stored));
  return abs.startsWith(UPLOAD_DIR + path.sep) ? abs : null;
};

module.exports = { evidenceUpload, idCardUpload, removeFile, resolveUpload, UPLOAD_DIR };
