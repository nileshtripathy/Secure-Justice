const crypto = require('crypto');

// Cryptographically secure 6-digit code (Math.random is predictable)
const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// OTPs are stored hashed; keyed with the server secret so a DB leak alone is not enough.
const hashOtp = (email, otp) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${email}:${otp}`).digest('hex');

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

module.exports = { generateOtp, hashOtp, safeEqual };
