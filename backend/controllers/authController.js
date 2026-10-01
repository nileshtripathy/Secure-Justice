const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');
const { removeFile, resolveUpload } = require('../middleware/upload');
const { generateOtp, hashOtp, safeEqual } = require('../utils/otp');
const { isString, cleanString, isEmail, normalizeEmail, isStrongPassword, isObjectId } = require('../utils/validate');
const { SELF_REGISTER_ROLES, APPROVAL_ROLES } = require('../config/constants');
const { logError } = require('../utils/logger');

const MAX_OTP_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 12;

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

/**
 * Checks a submitted OTP. Counts failed attempts and burns the OTP after too many,
 * so a 6-digit code cannot be brute-forced.
 * Returns the OTP record on success, otherwise null.
 */
const consumeOtp = async (email, purpose, otp) => {
  if (!isString(otp) || !/^\d{6}$/.test(otp)) return null;
  const record = await OTP.findOne({ email, purpose });
  if (!record) return null;
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await OTP.deleteMany({ email, purpose });
    return null;
  }
  if (!safeEqual(record.otpHash, hashOtp(email, otp))) {
    record.attempts += 1;
    await record.save();
    return null;
  }
  return record;
};

// POST /api/auth/send-otp  (multipart: name, email, password, role, idCard?)
exports.sendOTP = async (req, res) => {
  const uploaded = req.file ? req.file.path : null;
  try {
    const name = cleanString(req.body.name, 100);
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const role = req.body.role || 'citizen';

    if (!name) throw Object.assign(new Error('Name is required'), { status: 400 });
    if (!isEmail(email)) throw Object.assign(new Error('A valid email is required'), { status: 400 });
    if (!isStrongPassword(password)) {
      throw Object.assign(new Error('Password must be at least 8 characters and contain a letter and a number'), { status: 400 });
    }
    if (!isString(role) || !SELF_REGISTER_ROLES.includes(role)) {
      throw Object.assign(new Error('This role cannot be self-registered'), { status: 400 });
    }
    const needsApproval = APPROVAL_ROLES.includes(role);
    if (needsApproval && !uploaded) {
      throw Object.assign(new Error('An ID card / badge is required for this role'), { status: 400 });
    }

    if (await User.findOne({ email })) {
      throw Object.assign(new Error('User already exists'), { status: 400 });
    }

    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Replace any earlier pending registration (and its stale ID card file)
    const previous = await OTP.find({ email, purpose: 'register' });
    previous.forEach((p) => removeFile(resolveUpload(p.idCardPath)));
    await OTP.deleteMany({ email, purpose: 'register' });

    await OTP.create({
      email,
      purpose: 'register',
      otpHash: hashOtp(email, otp),
      name,
      password: hashedPassword,
      role,
      idCardPath: needsApproval && req.file ? req.file.filename : undefined,
    });
    if (!needsApproval) removeFile(uploaded); // ID card is only kept for roles that need approval

    let result;
    try {
      result = await sendEmail(email, 'Secure Justice - Registration OTP', `Your OTP for registration is: ${otp}. It expires in 5 minutes. Do not share it with anyone.`);
    } catch (mailErr) {
      await OTP.deleteMany({ email, purpose: 'register' });
      removeFile(uploaded);
      logError('sendOTP:mail', mailErr);
      return res.status(502).json({ message: 'Could not send the OTP email. Please try again later.' });
    }

    return res.status(200).json({ message: 'OTP sent to your email.', devMode: result.devMode });
  } catch (error) {
    removeFile(uploaded);
    if (error.status) return res.status(error.status).json({ message: error.message });
    logError('sendOTP', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/verify-otp
exports.verifyOTPAndRegister = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const record = await consumeOtp(email, 'register', req.body.otp);
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const needsApproval = APPROVAL_ROLES.includes(record.role);
    let user;
    try {
      user = await User.create({
        name: record.name,
        email: record.email,
        password: record.password,
        role: record.role,
        idCardPath: record.idCardPath,
        status: needsApproval ? 'pending' : 'active',
      });
    } catch (err) {
      if (err && err.code === 11000) return res.status(400).json({ message: 'User already exists' });
      throw err;
    }

    await OTP.deleteMany({ email, purpose: 'register' });

    if (needsApproval) {
      return res.status(201).json({
        pendingApproval: true,
        message: 'Email verified. Your account is waiting for admin approval before you can log in.',
      });
    }
    return res.status(201).json({ ...userPayload(user), token: generateToken(user._id, user.role) });
  } catch (error) {
    logError('verifyOTPAndRegister', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
exports.authUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!isEmail(email) || !isString(password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is awaiting admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration was not approved.' });
    }
    return res.json({ ...userPayload(user), token: generateToken(user._id, user.role) });
  } catch (error) {
    logError('authUser', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -idCardPath');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    logError('getUserProfile', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/forgot-password/verify-email
// Always answers the same way so the endpoint cannot be used to discover registered emails.
exports.verifyEmailForReset = async (req, res) => {
  const generic = { message: 'If this email is registered, an OTP has been sent.' };
  try {
    const email = normalizeEmail(req.body.email);
    if (!isEmail(email)) return res.json(generic);

    const user = await User.findOne({ email });
    if (!user || user.status !== 'active') return res.json(generic);

    const otp = generateOtp();
    await OTP.deleteMany({ email, purpose: 'reset' });
    await OTP.create({ email, purpose: 'reset', otpHash: hashOtp(email, otp) });

    try {
      const result = await sendEmail(email, 'Secure Justice - Password Reset OTP', `Your OTP for password reset is: ${otp}. It expires in 5 minutes. Do not share it with anyone.`);
      return res.json({ ...generic, devMode: result.devMode });
    } catch (mailErr) {
      await OTP.deleteMany({ email, purpose: 'reset' });
      logError('verifyEmailForReset:mail', mailErr);
      return res.status(502).json({ message: 'Could not send the OTP email. Please try again later.' });
    }
  } catch (error) {
    logError('verifyEmailForReset', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/reset-password  { email, otp, newPassword }
exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, newPassword } = req.body;
    if (!isEmail(email)) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and contain a letter and a number' });
    }

    const record = await consumeOtp(email, 'reset', otp);
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();
    await OTP.deleteMany({ email, purpose: 'reset' });
    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    logError('resetPassword', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ───────────── Admin: approve privileged accounts ─────────────

// GET /api/auth/admin/pending
exports.listPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' }).select('name email role createdAt idCardPath').sort('createdAt');
    return res.json(users.map((u) => ({
      _id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, hasIdCard: Boolean(u.idCardPath),
    })));
  } catch (error) {
    logError('listPendingUsers', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/auth/admin/users/:id  { action: 'approve' | 'reject' }
exports.reviewUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!isObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Action must be approve or reject' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.status !== 'pending') return res.status(400).json({ message: 'User is not awaiting approval' });

    user.status = action === 'approve' ? 'active' : 'rejected';
    await user.save();
    return res.json({ _id: user._id, status: user.status });
  } catch (error) {
    logError('reviewUser', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/admin/users/:id/id-card  (admin only; ID cards are never public)
exports.getIdCard = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    const user = await User.findById(req.params.id).select('idCardPath');
    const abs = user && resolveUpload(user.idCardPath);
    if (!abs) return res.status(404).json({ message: 'ID card not found' });
    return res.sendFile(abs, (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: 'ID card not found' });
    });
  } catch (error) {
    logError('getIdCard', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
