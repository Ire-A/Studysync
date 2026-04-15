// middleware/auth.js
// Protects routes by checking if a user is logged in via session
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Check if a session exists with a userId
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorised - please log in' });
    }

    // Find the user in the database using the session userId
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorised - user not found' });
    }

    // Attach the user to the request object so routes can access it
    req.user = user;

    // Move on to the next middleware or route handler
    next();

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = auth;