// routes/users.js
// Handles user registration, login, logout and profile management
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// ─── Register ─────────────────────────────────────────────────────────────────

// POST /api/users/register
// Creates a new user account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate that all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Create and save the new user
    // Password is hashed automatically in the User model pre-save hook
    const user = await User.create({ name, email, password });

    // Store user info in session
    req.session.userId = user._id;
    req.session.userName = user.name;

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

// POST /api/users/login
// Logs in an existing user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate that all fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare entered password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Store user info in session
    req.session.userId = user._id;
    req.session.userName = user.name;

    // Set a cookie with the user's name (covers $COOKIE requirement)
    res.cookie('userName', user.name, {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true
    });

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

// POST /api/users/logout
// Logs out the current user and destroys their session
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out, please try again' });
    }

    // Clear the cookie on logout
    res.clearCookie('userName');
    res.clearCookie('connect.sid');

    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// ─── Get Profile ──────────────────────────────────────────────────────────────

// GET /api/users/profile
// Returns the logged in user's profile - protected route
router.get('/profile', auth, async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────

// PUT /api/users/profile
// Updates the logged in user's name or email - protected route
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate that at least one field is provided
    if (!name && !email) {
      return res.status(400).json({ message: 'Please provide a name or email to update' });
    }

    // Build update object with only provided fields
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    // Find and update the user, return the updated document
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      user
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;