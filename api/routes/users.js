// This file handles user registration, login, logout and profile management

const express = require('express'); // Import Express to create route handlers
const router = express.Router(); // Create a new router object for user routes
const User = require('../models/User'); // Import the User model for database operations
const auth = require('../middleware/auth'); // Import authentication middleware to protect routes

// This method creates a new user account
router.post('/register', async (req, res) => { // Handle POST to /register, use async for DB calls
  try { // Wrap in try/catch for error handling
    const { name, email, password } = req.body; // Destructure name, email, password from request body

    // Validate that all fields are provided
    if (!name || !email || !password) { // Check if any required field is missing
      return res.status(400).json({ message: 'All fields are required' }); // Return 400 if missing
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email }); // Query the database for existing email
    if (existingUser) { // If a user is found
      return res.status(400).json({ message: 'Email is already registered' }); // Return 400 error
    }

    // Create and save the new user
    // Password is hashed automatically in the User model pre-save hook
    const user = await User.create({ name, email, password }); // Insert new user document

    // Store user info in session
    req.session.userId = user._id; // Save user ID in session for authentication
    req.session.userName = user.name; // Save user name in session for convenience

    res.status(201).json({ // 201 Created status
      message: 'Account created successfully',
      user: { // Return user data (excluding password)
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) { // If any error occurs
    res.status(500).json({ message: 'Server error', error: err.message }); // Return 500 server error
  }
});

// This method logs in an existing user
router.post('/login', async (req, res) => { // Handle POST to /login, async for DB operations
  try {
    const { email, password } = req.body; // Extract email and password from request body

    // Validate that all fields are provided
    if (!email || !password) { // Check if either field is missing
      return res.status(400).json({ message: 'Email and password are required' }); // Return 400
    }

    // Check if user exists
    const user = await User.findOne({ email }); // Find user by email
    if (!user) { // If no user found
      return res.status(400).json({ message: 'Invalid email or password' }); // Return generic error (security)
    }

    // Compare entered password with stored hash
    const isMatch = await user.comparePassword(password); // Use model method to compare
    if (!isMatch) { // If passwords don't match
      return res.status(400).json({ message: 'Invalid email or password' }); // Return same generic error
    }

    // Store user info in session
    req.session.userId = user._id; // Save user ID in session
    req.session.userName = user.name; // Save user name in session

    // Set a cookie with the user's name this covers $COOKIE requirement you(Ellen) gave us in the brief.
    res.cookie('userName', user.name, { // Create a cookie 
      maxAge: 1000 * 60 * 60 * 24, // Expires after 1 day 
      httpOnly: true // Prevent client-side JavaScript access 
    });

    res.status(200).json({ 
      message: 'Logged in successfully',
      user: { // Return user data 
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method logs out the current user and destroys their session
router.post('/logout', (req, res) => { // Handle POST to /logout (no async needed)
  req.session.destroy((err) => { // Destroy the session, callback handles error
    if (err) { // If destruction fails
      return res.status(500).json({ message: 'Could not log out, please try again' }); // Return 500 error
    }

    // Clear the cookie on logout
    res.clearCookie('userName'); // Remove the userName cookie
    res.clearCookie('connect.sid'); // Remove the session cookie (default name)

    res.status(200).json({ message: 'Logged out successfully' }); // Send success response
  });
});

// This method returns the logged in user's profile - protected route
router.get('/profile', auth, async (req, res) => { // GET with auth middleware, async for DB
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id).select('-password'); // Find user by ID, exclude password field
    if (!user) { // If user not found (shouldn't happen if auth passed)
      return res.status(404).json({ message: 'User not found' }); // Return 404
    }

    res.status(200).json({ user }); // Send user profile

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method updates the logged in user's name or email - protected route
router.put('/profile', auth, async (req, res) => { // PUT request to update profile, auth required
  try {
    const { name, email } = req.body; // Extract fields to update

    // Validate that at least one field is provided
    if (!name && !email) { // If neither name nor email is provided
      return res.status(400).json({ message: 'Please provide a name or email to update' }); // Return 400
    }

    // Build update object with only provided fields
    const updates = {}; // Start with empty object
    if (name) updates.name = name; // Add name if provided
    if (email) updates.email = email; // Add email if provided

    // Find and update the user, return the updated document
    const user = await User.findByIdAndUpdate(
      req.user.id, // User ID from auth middleware
      updates, // Fields to update
      { new: true, runValidators: true } // Return updated doc and run schema validators
    ).select('-password'); // Exclude password from returned document

    res.status(200).json({ 
      message: 'Profile updated successfully',
      user // Return updated user
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method deletes the logged in user's account
router.delete('/profile', auth, async (req, res) => { // DELETE request, auth required
  try {
    await User.findByIdAndDelete(req.user.id); // Remove user document from database

    // Destroy the session after deleting the account
    req.session.destroy(); // Destroy session (no callback needed for simplicity)
    res.clearCookie('userName'); // Clear the userName cookie
    res.clearCookie('connect.sid'); // Clear the session cookie

    res.status(200).json({ message: 'Account deleted successfully' }); // Send success response

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;