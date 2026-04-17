// This file handles CRUD operations for study sessions
const express = require('express'); // Import Express to create route handlers
const router = express.Router(); // Create a new router object for session routes
const StudySession = require('../models/Session'); // Import the Session model for database operations
const Group = require('../models/Group'); // Import the Group model to verify membership
const auth = require('../middleware/auth'); // Import authentication middleware to protect routes

// This method returns all study sessions for a specific group
router.get('/', auth, async (req, res) => { // Handle GET requests, require auth, use async for DB calls
  try { // Wrap in try/catch for error handling
    const { groupId } = req.query; // Extract groupId from the query string

    // Validate that groupId is provided
    if (!groupId) { // Check if groupId exists
      return res.status(400).json({ message: 'Group ID is required' }); // Return 400 if missing
    }

    // Check if the user is a member of the group
    const group = await Group.findById(groupId); // Find the group by ID
    if (!group) { // If group doesn't exist
      return res.status(404).json({ message: 'Group not found' }); // Return 404 error
    }
    if (!group.members.includes(req.user.id)) { // Check if user's ID is in members array
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // Deny access if not a member
    }
    // Fetch all sessions for the group, sorted by date
    const sessions = await StudySession.find({ group: groupId }) // Find sessions belonging to the group
      .populate('createdBy', 'name email') // Populate creator's name and email (no password)
      .sort({ date: 1 }); // Sort by date ascending (earliest first)

    res.status(200).json({ sessions }); // Send 200 response with sessions array

  } catch (err) { // If an error occurs
    res.status(500).json({ message: 'Server error', error: err.message }); // Return 500 server error
  }
});

// This method returns a single study session by ID
router.get('/:id', auth, async (req, res) => { // GET with session ID parameter, requires auth
  try {
    const session = await StudySession.findById(req.params.id) // Find session by ID from URL
      .populate('createdBy', 'name email') // Populate creator details
      .populate('group', 'name'); // Populate just the group name

    if (!session) { // If session not found
      return res.status(404).json({ message: 'Session not found' }); // Return 404
    }

    // Check if the user is a member of the group
    const group = await Group.findById(session.group); // Find the group this session belongs to
    if (!group.members.includes(req.user.id)) { // Check membership
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // Deny access
    }

    res.status(200).json({ session }); // Send the session back

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method creates a new study session for a group
router.post('/', auth, async (req, res) => { // POST request to create a session, requires auth
  try {
    const { title, groupId, date, description } = req.body; // Destructure fields from request body

    // Validate that all required fields are provided
    if (!title || !groupId || !date) { // Check for missing required fields
      return res.status(400).json({ message: 'Title, group ID and date are required' }); // Return 400 if any missing
    }

    // Check if the group exists
    const group = await Group.findById(groupId); // Find the group by ID
    if (!group) { // If group doesn't exist
      return res.status(404).json({ message: 'Group not found' }); // Return 404
    }

    // Check if the user is a member of the group
    if (!group.members.includes(req.user.id)) { // Verify membership
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // Deny if not a member
    }

    // Validate that the date is not in the past
    if (new Date(date) < new Date()) { // Compare session date with current date
      return res.status(400).json({ message: 'Session date cannot be in the past' }); // Reject past dates
    }

    const session = await StudySession.create({ // Create new session document
      title, // Set title
      group: groupId, // Link to group
      createdBy: req.user.id, // Set creator to logged-in user
      date, // Set session date
      description // Set optional description
    });

    res.status(201).json({ 
      message: 'Study session created successfully',
      session 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method updates a study session - only the creator can do this
router.put('/:id', auth, async (req, res) => { // PUT request to update, auth required
  try {
    const { title, date, description } = req.body; // Get fields to update

    // Validate that at least one field is provided
    if (!title && !date && !description) { // If all are empty/missing
      return res.status(400).json({ message: 'Please provide at least one field to update' }); 
    }

    const session = await StudySession.findById(req.params.id); // Find session by ID
    if (!session) { // If session doesn't exist
      return res.status(404).json({ message: 'Session not found' }); // Return 404
    }

    // Only the creator can update the session
    if (!session.createdBy.equals(req.user.id)) { // Compare creator ID with logged-in user ID
      return res.status(403).json({ message: 'Forbidden - only the session creator can update this session' }); // Deny if not creator
    }

    // Validate that the new date is not in the past
    if (date && new Date(date) < new Date()) { // Check if date is being updated and is in the past
      return res.status(400).json({ message: 'Session date cannot be in the past' }); // Reject past dates
    }

    // Build update object with only provided fields
    const updates = {}; // Start with empty object
    if (title) updates.title = title; // Add title if provided
    if (date) updates.date = date; // Add date if provided
    if (description) updates.description = description; // Add description if provided

    const updatedSession = await StudySession.findByIdAndUpdate( // Update in one operation
      req.params.id, // Session ID
      updates, // Fields to update
      { new: true, runValidators: true } // Return updated document and run validators
    );

    res.status(200).json({
      message: 'Study session updated successfully',
      session: updatedSession
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method deletes a study session - only the creator can do this
router.delete('/:id', auth, async (req, res) => { // DELETE request, auth required
  try {
    const session = await StudySession.findById(req.params.id); // Find session by ID

    if (!session) { // If session doesn't exist
      return res.status(404).json({ message: 'Session not found' }); // Return 404
    }

    // Only the creator can delete the session
    if (!session.createdBy.equals(req.user.id)) { // Check if logged-in user is the creator
      return res.status(403).json({ message: 'Forbidden - only the session creator can delete this session' }); // Deny if not creator
    }

    await StudySession.findByIdAndDelete(req.params.id); // Delete session from database

    res.status(200).json({ message: 'Study session deleted successfully' }); // Send success response

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;