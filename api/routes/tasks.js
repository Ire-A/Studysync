// This file handles CRUD operations for tasks
const express = require('express'); // Import Express to create route handlers
const router = express.Router(); // Create a new router object for task routes
const Task = require('../models/Task'); // Import the Task model for database operations
const Group = require('../models/Group'); // Import the Group model to verify membership
const auth = require('../middleware/auth'); // Import authentication middleware to protect routes

// This method returns all tasks for a specific group
router.get('/', auth, async (req, res) => { // Handle GET requests, require auth, use async for DB calls
  try { // Wrap in try/catch for error handling
    const { groupId } = req.query; // Extract groupId from the query string

    // Validate that groupId is provided
    if (!groupId) { // Check if groupId exists
      return res.status(400).json({ message: 'Group ID is required' }); // Return 400 if missing
    }

    // Check if the group exists
    const group = await Group.findById(groupId); // Find the group by ID
    if (!group) { // If group doesn't exist
      return res.status(404).json({ message: 'Group not found' }); // Return 404
    }

    // Check if the user is a member of the group
    if (!group.members.includes(req.user.id)) { // Check if user's ID is in members array
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // Deny access if not a member
    }

    // Fetch all tasks for the group, sorted by deadline
    const tasks = await Task.find({ group: groupId }) // Find tasks belonging to the group
      .populate('createdBy', 'name email') // Populate creator's name and email
      .populate('assignedTo', 'name email') // Populate assigned user's name and email
      .sort({ deadline: 1 }); // Sort by deadline ascending (earliest first)

    res.status(200).json({ tasks }); // Send 200 response with tasks array

  } catch (err) { // If an error occurs
    res.status(500).json({ message: 'Server error', error: err.message }); // Return 500 server error
  }
});

// This method returns a single task by ID
router.get('/:id', auth, async (req, res) => { // GET with task ID parameter, requires auth
  try {
    const task = await Task.findById(req.params.id) // Find task by ID from URL
      .populate('createdBy', 'name email') // Populate creator details
      .populate('assignedTo', 'name email') // Populate assigned user details
      .populate('group', 'name'); // Populate just the group name

    if (!task) { // If task not found
      return res.status(404).json({ message: 'Task not found' }); // Return 404
    }

    // Check if the user is a member of the group
    const group = await Group.findById(task.group); // Find the group this task belongs to
    if (!group.members.includes(req.user.id)) { // Check membership
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // Deny access
    }

    res.status(200).json({ task }); // Send the task back

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method creates a new task for a group
router.post('/', auth, async (req, res) => { // POST request to create a task, requires auth
  try {
    const { title, groupId, assignedTo, deadline } = req.body; // Destructure fields from request body

    // Validate that all required fields are provided
    if (!title || !groupId) { // Check for missing required fields
      return res.status(400).json({ message: 'Title and group ID are required' }); // Return 400 if missing
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

    // If assignedTo is provided, check that the assigned user is a member of the group
    if (assignedTo && !group.members.includes(assignedTo)) { // Validate assignee belongs to group
      return res.status(400).json({ message: 'Assigned user is not a member of this group' }); // Return 400 if not
    }

    // Validate that the deadline is not in the past
    if (deadline && new Date(deadline) < new Date()) { // Compare deadline with current date
      return res.status(400).json({ message: 'Deadline cannot be in the past' }); // Reject past deadlines
    }

    const task = await Task.create({ // Create new task document
      title, // Set title
      group: groupId, // Link to group
      createdBy: req.user.id, // Set creator to logged-in user
      assignedTo: assignedTo || null, // Set assignedTo (or null if not provided)
      deadline: deadline || null // Set deadline (or null if not provided)
    });

    res.status(201).json({ 
      message: 'Task created successfully',
      task 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method updates a task - only the creator can do this
router.put('/:id', auth, async (req, res) => { // PUT request to update, auth required
  try {
    const { title, assignedTo, deadline, completed } = req.body; // Get fields to update

    // Validate that at least one field is provided
    if (!title && !assignedTo && !deadline && completed === undefined) { // If all are missing
      return res.status(400).json({ message: 'Please provide at least one field to update' }); // Return 400
    }

    const task = await Task.findById(req.params.id); // Find task by ID
    if (!task) { // If task doesn't exist
      return res.status(404).json({ message: 'Task not found' }); // Return 404
    }

    // Only the creator can update the task
    if (!task.createdBy.equals(req.user.id)) { // Compare creator ID with logged-in user ID
      return res.status(403).json({ message: 'Forbidden - only the task creator can update this task' }); // Deny if not creator
    }

    // If assignedTo is provided, check that the assigned user is a member of the group
    if (assignedTo) { // Check if assignee is being updated
      const group = await Group.findById(task.group); // Find the group
      if (!group.members.includes(assignedTo)) { // Validate membership
        return res.status(400).json({ message: 'Assigned user is not a member of this group' }); // Return 400 if invalid
      }
    }

    // Validate that the deadline is not in the past
    if (deadline && new Date(deadline) < new Date()) { // Check if deadline is being updated and is in the past
      return res.status(400).json({ message: 'Deadline cannot be in the past' }); // Reject past deadlines
    }

    // Build update object with only provided fields
    const updates = {}; // Start with empty object
    if (title) updates.title = title; // Add title if provided
    if (assignedTo) updates.assignedTo = assignedTo; // Add assignedTo if provided
    if (deadline) updates.deadline = deadline; // Add deadline if provided
    if (completed !== undefined) updates.completed = completed; // Add completed if provided (even if false)

    const updatedTask = await Task.findByIdAndUpdate( // Update in one operation
      req.params.id, // Task ID
      updates, // Fields to update
      { new: true, runValidators: true } // Return updated document and run validators
    ).populate('assignedTo', 'name email'); // Populate assigned user after update

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method dseletes a task - only the creator can do this
router.delete('/:id', auth, async (req, res) => { // DELETE request, auth required (note typo: "dseletes" but kept as original)
  try {
    const task = await Task.findById(req.params.id); // Find task by ID

    if (!task) { // If task doesn't exist
      return res.status(404).json({ message: 'Task not found' }); // Return 404
    }

    // Only the creator can delete the task
    if (!task.createdBy.equals(req.user.id)) { // Check if logged-in user is the creator
      return res.status(403).json({ message: 'Forbidden - only the task creator can delete this task' }); // Deny if not creator
    }

    await Task.findByIdAndDelete(req.params.id); // Delete task from database

    res.status(200).json({ message: 'Task deleted successfully' }); // Send success response

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 