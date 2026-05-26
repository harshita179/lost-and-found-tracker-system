const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: null }, // Phone number for SMS notifications
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  emailVerified: { type: Boolean, default: false },
  signupVerificationCode: { type: String, default: null },
  signupVerificationExpires: { type: Date, default: null },
  passwordResetCode: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
