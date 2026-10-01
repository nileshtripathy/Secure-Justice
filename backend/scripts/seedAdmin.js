// Creates (or promotes) the first admin account. Admins cannot self-register.
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='StrongPass123' ADMIN_NAME='Admin' npm run seed:admin
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isEmail, isStrongPassword, normalizeEmail } = require('../utils/validate');

(async () => {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!isEmail(email) || !isStrongPassword(password)) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars, letters + numbers).');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securejustice');
  const hash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, password: hash, role: 'admin', status: 'active' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Admin ready: ${user.email}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
