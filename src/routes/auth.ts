import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User from '../models/User';
import { sendOTPEmail } from '../utils/email';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST /api/auth/register
// @desc    Register user with OTP flow
// @access  Public
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      return true;
    }),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('dateOfBirth')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty values
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('Please provide a valid date of birth')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, name, dateOfBirth } = req.body;

    // Create user without password (OTP-based registration)
    const user = new User({
      email,
      name,
      dateOfBirth: dateOfBirth && dateOfBirth.trim() !== '' ? new Date(dateOfBirth) : undefined,
      isEmailVerified: false
      // No password field - user will authenticate via OTP
    });

    await user.save();

    // Generate and send OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      console.log('⚠️  Email sending failed, but OTP is logged to console');
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for OTP verification.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
// @access  Public
router.post('/verify-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Allow OTP verification for both unverified (signup) and verified (login) users
    // This handles both scenarios: signup verification and login authentication

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Verify user
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: user.isEmailVerified ? 'Login successful' : 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with OTP
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }

    // For OTP-based authentication, we allow unverified users to get OTP
    // This handles both signup verification and login scenarios

    // Generate and send OTP for login
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      console.log('⚠️  Email sending failed, but OTP is logged to console');
    }

    res.json({
      success: true,
      message: 'OTP sent to your email for login verification',
      userId: user._id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/request-otp
// @desc    Request new OTP
// @access  Public
router.post('/request-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Rate limiting: Check if user has requested OTP recently
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    
    if (user.lastOtpRequest && user.lastOtpRequest > oneMinuteAgo) {
      const remainingTime = Math.ceil((user.lastOtpRequest.getTime() + 60 * 1000 - now.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingTime} seconds before requesting another OTP`
      });
    }

    // Check if user has exceeded daily OTP limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.otpRequestCount >= 10 && user.lastOtpRequest && user.lastOtpRequest >= today) {
      return res.status(429).json({
        success: false,
        message: 'Daily OTP limit reached. Please try again tomorrow.'
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.lastOtpRequest = now;
    user.otpRequestCount = (user.otpRequestCount || 0) + 1;
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP request'
    });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${process.env.FRONTEND_URL}/signin?error=google_auth_failed`
}), (req, res) => {
  // Generate JWT token for the authenticated user
  const token = generateToken((req.user as any)._id);
  res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
});

// @route   GET /api/auth/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

// @route   POST /api/auth/test-otp
// @desc    Test OTP sending
// @access  Public
router.post('/test-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    const emailSent = await sendOTPEmail(email, otp);
    
    res.json({
      success: true,
      message: 'OTP test completed',
      otp: otp,
      emailSent: emailSent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OTP test failed'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: {
      id: req.user!._id,
      email: req.user!.email,
      name: req.user!.name,
      dateOfBirth: req.user!.dateOfBirth,
      isEmailVerified: req.user!.isEmailVerified
    }
  });
});

export default router;
