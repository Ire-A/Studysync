// routes/groups.js
// Handles CRUD operations for study groups
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// ─── Get All Groups ───────────────────────────────────────────────────────────

// GET /api/groups
// Returns all groups the logged in user is a member of
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    res.status(200).json({ groups });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Get Single Group ─────────────────────────────────────────────────────────

// GET /api/groups/:id
// Returns a single group by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if the logged in user is a member of the group
    if (!group.members.some(member => member._id.equals(req.user.id))) {
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    res.status(200).json({ group });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Create Group ─────────────────────────────────────────────────────────────

// POST /api/groups
// Creates a new study group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate that name is provided
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Create the group, adding the creator as the first member
    const group = await Group.create({
      name,
      description,
      createdBy: req.user.id,
      members: [req.user.id]
    });

    res.status(201).json({
      message: 'Group created successfully',
      group
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Join Group ───────────────────────────────────────────────────────────────

// POST /api/groups/:id/join
// Adds the logged in user to a group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add the user to the members array
    group.members.push(req.user.id);
    await group.save();

    res.status(200).json({
      message: 'Joined group successfully',
      group
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Update Group ─────────────────────────────────────────────────────────────

// PUT /api/groups/:id
// Updates a group's name or description - only the creator can do this
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate that at least one field is provided
    if (!name && !description) {
      return res.status(400).json({ message: 'Please provide a name or description to update' });
    }

    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only the creator can update the group
    if (!group.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the group creator can update this group' });
    }

    // Build update object with only provided fields
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Group updated successfully',
      group: updatedGroup
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Delete Group ─────────────────────────────────────────────────────────────

// DELETE /api/groups/:id
// Deletes a group - only the creator can do this
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only the creator can delete the group
    if (!group.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the group creator can delete this group' });
    }

    await Group.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Group deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;