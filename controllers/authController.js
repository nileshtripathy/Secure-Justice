const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── Generate a 6-digit OTP ───────────────────────────────────────────────────
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// @desc  Send OTP to email for registration verification
// @route POST /api/auth/send-otp
exports.sendOTP = async (req, res) => {
  const { email, name, password, role } = req.body;

  try {
    // Ensure user doesn't already exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password before storing with OTP record
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Remove any previous OTP records for this email
    await OTP.deleteMany({ email });

    const otp = generateOTP();
    
    let idCardPath = '';
    if (req.file) {
      idCardPath = req.file.path.replace(/\\/g, '/');
    }

    await OTP.create({
      email,
      otp,
      name,
      password: hashedPassword,
      role: role || 'citizen',
      idCardPath
    });

    // ── Check if email credentials are configured ──────────────────────────────
    const emailConfigured =
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_USER !== 'your_gmail@gmail.com' &&
      process.env.EMAIL_PASS !== 'your_gmail_app_password';

    if (!emailConfigured) {
      // DEV fallback: print OTP to console so it can be used without email setup
      console.log('\n========================================');
      console.log(`  📧  OTP for ${email}`);
      console.log(`  🔑  OTP CODE: ${otp}`);
      console.log('  ⏰  Expires in 5 minutes');
      console.log('========================================\n');
      return res.json({
        message: `[DEV MODE] OTP printed to backend console. Configure EMAIL_USER & EMAIL_PASS in .env for real emails.`,
        devMode: true,
      });
    }

    // ── Send real email ────────────────────────────────────────────────────────
    const transporter = createTransporter();

    // Verify SMTP connection first
    await transporter.verify();

    await transporter.sendMail({
      from: `"SecureJustice" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your SecureJustice Registration OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid #1e40af;">
          <h2 style="color: #3b82f6; margin-bottom: 8px;">SecureJustice</h2>
          <h3 style="color: #f1f5f9; margin-bottom: 16px;">Email Verification</h3>
          <p style="color: #94a3b8;">Hello <strong style="color:#e2e8f0;">${name}</strong>,</p>
          <p style="color: #94a3b8;">Use the OTP below to complete your registration. It expires in <strong style="color:#e2e8f0;">5 minutes</strong>.</p>
          <div style="background: #1e293b; border: 1px solid #3b82f6; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #60a5fa;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 13px;">If you did not request this, please ignore this email.</p>
          <hr style="border-color: #1e40af; margin: 24px 0;" />
          <p style="color: #475569; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} SecureJustice Platform</p>
        </div>
      `,
    });

    res.json({ message: `OTP sent successfully to ${email}. Please check your inbox.` });
  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    res.status(500).json({
      message: 'Failed to send OTP email. ' + (error.message.includes('Invalid login') || error.message.includes('auth')
        ? 'Gmail authentication failed — check EMAIL_USER and EMAIL_PASS (use an App Password, not your regular password).'
        : error.message),
    });
  }
};

// @desc  Verify OTP and complete registration
// @route POST /api/auth/verify-otp
exports.verifyOTPAndRegister = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const record = await OTP.findOne({ email });

    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP matched — create the user
    const user = await User.create({
      name: record.name,
      email: record.email,
      password: record.password,
      role: record.role,
      idCardPath: record.idCardPath || '',
    });

    // Clean up OTP record
    await OTP.deleteMany({ email });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Verify email exists before allowing reset
// @route POST /api/auth/forgot-password/verify-email
exports.verifyEmailForReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }
    res.json({ message: 'Email verified. You may now reset your password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc  Reset password directly (no email token — local app)
// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
