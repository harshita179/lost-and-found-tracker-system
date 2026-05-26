const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {
  sendPasswordResetCode,
  sendSignupVerificationCode
} = require('../utils/emailService');

const SIGNUP_OTP_EXPIRY_MS = 10 * 60 * 1000;

const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

const buildVerificationResponse = (emailResult, message) => ({
  success: true,
  requiresVerification: true,
  message: emailResult.sent
    ? message
    : 'OTP could not be sent to your email. Check Gmail configuration on the server and try again.',
});

// Register route - role is always 'user'; admin is seeded, not registered
router.post('/register', async (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const existingUsernameUser = await User.findOne({ username });
    const existingEmailUser = await User.findOne({ email });

    if (existingUsernameUser && existingUsernameUser.emailVerified) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    if (existingEmailUser && existingEmailUser.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    if (
      existingUsernameUser &&
      existingEmailUser &&
      String(existingUsernameUser._id) !== String(existingEmailUser._id)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Username or email is already pending verification. Use a different one.',
      });
    }

    const signupOtp = generateOtp();
    const hashedSignupOtp = hashCode(signupOtp);

    let user = existingUsernameUser || existingEmailUser;

    if (user) {
      user.username = username;
      user.email = email;
      user.password = password;
      user.phone = phone || null;
      user.role = 'user';
      user.emailVerified = false;
      user.signupVerificationCode = hashedSignupOtp;
      user.signupVerificationExpires = Date.now() + SIGNUP_OTP_EXPIRY_MS;
    } else {
      user = new User({
        username,
        email,
        password,
        phone: phone || null,
        role: 'user',
        emailVerified: false,
        signupVerificationCode: hashedSignupOtp,
        signupVerificationExpires: Date.now() + SIGNUP_OTP_EXPIRY_MS,
      });
    }

    await user.save();

    const emailResult = await sendSignupVerificationCode(user.email, user.username, signupOtp);

    if (!emailResult.sent) {
      return res.status(500).json({
        success: false,
        message: 'OTP could not be sent to your email. Check Gmail configuration on the server and try again.',
      });
    }

    res.status(201).json(buildVerificationResponse(
      emailResult,
      'An OTP has been sent to your email. Enter it to complete signup.'
    ));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/verify-signup-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  try {
    const hashedOtp = hashCode(otp);

    const user = await User.findOne({
      email,
      signupVerificationCode: hashedOtp,
      signupVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.emailVerified = true;
    user.signupVerificationCode = null;
    user.signupVerificationExpires = null;
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Signup completed successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/resend-signup-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user.emailVerified) {
      return res.status(400).json({ success: false, message: 'No pending signup found for this email' });
    }

    const signupOtp = generateOtp();
    user.signupVerificationCode = hashCode(signupOtp);
    user.signupVerificationExpires = Date.now() + SIGNUP_OTP_EXPIRY_MS;
    await user.save({ validateBeforeSave: false });

    const emailResult = await sendSignupVerificationCode(user.email, user.username, signupOtp);

    if (!emailResult.sent) {
      return res.status(500).json({
        success: false,
        message: 'OTP could not be sent to your email. Check Gmail configuration on the server and try again.',
      });
    }

    res.json(buildVerificationResponse(
      emailResult,
      'A new OTP has been sent to your email.'
    ));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Admin users bypass email verification — they are seeded, not registered via OTP
    if (user.role !== 'admin' && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your signup is not complete yet. Verify the OTP from signup first, then sign in.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: 'If that email is registered, a reset code has been sent.',
      });
    }

    const resetCode = generateOtp();
    const hashedResetCode = hashCode(resetCode);

    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const emailResult = await sendPasswordResetCode(user.email, user.username, resetCode);

    if (!emailResult.sent) {
      return res.status(500).json({
        success: false,
        message: 'Reset code could not be sent to your email. Check Gmail configuration on the server and try again.',
      });
    }

    return res.json({
      success: true,
      message: 'A reset code has been sent to your email.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, code, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const hashedResetCode = hashCode(code);

    const user = await User.findOne({
      email,
      passwordResetCode: hashedResetCode,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.passwordResetCode = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can sign in now.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
