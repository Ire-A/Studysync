// routes/tasks.js
// Handles CRUD operations for tasks
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// ─── Get All Tasks ────────────────────────────────────────────────────────────

// GET /api/tasks
// Returns all tasks for a specific group
router.get('/', auth, async (req, res) => {
  try {
    const { groupId } = req.query;

    // Validate that groupId is provided
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    // Check if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if the user is a member of the group
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    // Fetch all tasks for the group, sorted by deadline
    const tasks = await Task.find({ group: groupId })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ deadline: 1 });

    res.status(200).json({ tasks });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Get Single Task ──────────────────────────────────────────────────────────

// GET /api/tasks/:id
// Returns a single task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('group', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the user is a member of the group
    const group = await Group.findById(task.group);
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    res.status(200).json({ task });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Create Task ──────────────────────────────────────────────────────────────

// POST /api/tasks
// Creates a new task for a group
router.post('/', auth, async (req, res) => {
  try {
    const { title, groupId, assignedTo, deadline } = req.body;

    // Validate that all required fields are provided
    if (!title || !groupId) {
      return res.status(400).json({ message: 'Title and group ID are required' });
    }

    // Check if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if the user is a member of the group
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    // If assignedTo is provided, check that the assigned user is a member of the group
    if (assignedTo && !group.members.includes(assignedTo)) {
      return res.status(400).json({ message: 'Assigned user is not a member of this group' });
    }

    // Validate that the deadline is not in the past
    if (deadline && new Date(deadline) < new Date()) {
      return res.status(400).json({ message: 'Deadline cannot be in the past' });
    }

    const task = await Task.create({
      title,
      group: groupId,
      createdBy: req.user.id,
      assignedTo: assignedTo || null,
      deadline: deadline || null
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Update Task ──────────────────────────────────────────────────────────────

// PUT /api/tasks/:id
// Updates a task - only the creator can do this
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, assignedTo, deadline, completed } = req.body;

    // Validate that at least one field is provided
    if (!title && !assignedTo && !deadline && completed === undefined) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only the creator can update the task
    if (!task.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the task creator can update this task' });
    }

    // If assignedTo is provided, check that the assigned user is a member of the group
    if (assignedTo) {
      const group = await Group.findById(task.group);
      if (!group.members.includes(assignedTo)) {
        return res.status(400).json({ message: 'Assigned user is not a member of this group' });
      }
    }

    // Validate that the deadline is not in the past
    if (deadline && new Date(deadline) < new Date()) {
      return res.status(400).json({ message: 'Deadline cannot be in the past' });
    }

    // Build update object with only provided fields
    const updates = {};
    if (title) updates.title = title;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (deadline) updates.deadline = deadline;
    if (completed !== undefined) updates.completed = completed;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Delete Task ──────────────────────────────────────────────────────────────

// DELETE /api/tasks/:id
// Deletes a task - only the creator can do this
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only the creator can delete the task
    if (!task.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the task creator can delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;