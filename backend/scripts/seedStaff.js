// Dev helper: creates a judge account (judges cannot self-register).
//   JUDGE_EMAIL=judge@example.com JUDGE_PASSWORD='StrongPass123' npm run seed:judge
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isEmail, isStrongPassword, normalizeEmail } = require('../utils/validate');

(async () => {
  const email = normalizeEmail(process.env.JUDGE_EMAIL);
  const password = process.env.JUDGE_PASSWORD;
  if (!isEmail(email) || !isStrongPassword(password)) {
    console.error('Set JUDGE_EMAIL and JUDGE_PASSWORD (min 8 chars, letters + numbers).');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securejustice');
  const hash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name: process.env.JUDGE_NAME || 'Judge', email, password: hash, role: 'judge', status: 'active' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Judge ready: ${user.email}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
