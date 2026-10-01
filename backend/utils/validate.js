const mongoose = require('mongoose');

// Guards against NoSQL operator injection (e.g. { "email": { "$ne": null } })
const isString = (v) => typeof v === 'string';
const cleanString = (v, max = 5000) => (isString(v) ? v.trim().slice(0, max) : '');
const isEmail = (v) => isString(v) && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const normalizeEmail = (v) => (isString(v) ? v.trim().toLowerCase() : '');
const isObjectId = (v) => isString(v) && mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === v;

// min 8 chars, at least one letter and one number
const isStrongPassword = (v) => isString(v) && v.length >= 8 && v.length <= 128 && /[A-Za-z]/.test(v) && /\d/.test(v);

module.exports = { isString, cleanString, isEmail, normalizeEmail, isObjectId, isStrongPassword };
