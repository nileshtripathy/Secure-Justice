const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

exports.sendOTP = async (req, res) => {
  console.log("Received sendOTP request:", req.body);
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const idCardPath = req.file ? req.file.path : undefined;

    // Delete existing OTP for this email if any
    await OTP.deleteMany({ email });
    
    await OTP.create({
      email,
      otp,
      name,
      password: hashedPassword,
      role: role || 'citizen',
      idCardPath
    });

    const mailOptions = {
      from: `"Secure Justice" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Secure Justice - Registration OTP',
      text: `Your OTP for registration is: ${otp}. Do not share this with anyone.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent to your email.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyOTPAndRegister = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.create({
      name: otpRecord.name,
      email: otpRecord.email,
      password: otpRecord.password,
      role: otpRecord.role,
      idCardPath: otpRecord.idCardPath,
      status: otpRecord.role === 'citizen' ? 'active' : 'pending'
    });

    await OTP.deleteMany({ email });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
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

exports.verifyEmailForReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });
    
    const mailOptions = {
      from: `"Secure Justice" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Secure Justice - Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. Do not share this with anyone.`
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    await OTP.deleteMany({ email });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
