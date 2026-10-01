// Fail fast on missing configuration instead of silently using insecure defaults.
const isProd = process.env.NODE_ENV === 'production';

function validateEnv() {
  const missing = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    missing.push('JWT_SECRET (at least 16 characters)');
  }
  if (isProd && !process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (isProd && !process.env.FRONTEND_URL) missing.push('FRONTEND_URL');
  if (missing.length) {
    throw new Error(`Missing/invalid environment variables: ${missing.join(', ')}`);
  }
}

const emailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

module.exports = { validateEnv, isProd, emailConfigured };
