require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

async function test() {
  console.log('Testing MongoDB connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection SUCCESSFUL');
    await mongoose.disconnect();
  } catch (err) {
    console.error('MongoDB connection FAILED:', err.message);
  }

  console.log('\nTesting Email Transporter...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('Email configuration SUCCESSFUL');
  } catch (err) {
    console.error('Email configuration FAILED:', err.message);
  }
}

test();
