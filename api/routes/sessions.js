// routes/sessions.js
// Handles CRUD operations for study sessions
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const express = require('express');
const router = express.Router();
const StudySession = require('../models/Session');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// ─── Get All Sessions ─────────────────────────────────────────────────────────

// GET /api/sessions
// Returns all study sessions for a specific group
router.get('/', auth, async (req, res) => {
  try {
    const { groupId } = req.query;

    // Validate that groupId is provided
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    // Check if the user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    // Fetch all sessions for the group, sorted by date
    const sessions = await StudySession.find({ group: groupId })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.status(200).json({ sessions });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Get Single Session ───────────────────────────────────────────────────────

// GET /api/sessions/:id
// Returns a single study session by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('group', 'name');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if the user is a member of the group
    const group = await Group.findById(session.group);
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    res.status(200).json({ session });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Create Session ───────────────────────────────────────────────────────────

// POST /api/sessions
// Creates a new study session for a group
router.post('/', auth, async (req, res) => {
  try {
    const { title, groupId, date, description } = req.body;

    // Validate that all required fields are provided
    if (!title || !groupId || !date) {
      return res.status(400).json({ message: 'Title, group ID and date are required' });
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

    // Validate that the date is not in the past
    if (new Date(date) < new Date()) {
      return res.status(400).json({ message: 'Session date cannot be in the past' });
    }

    const session = await StudySession.create({
      title,
      group: groupId,
      createdBy: req.user.id,
      date,
      description
    });

    res.status(201).json({
      message: 'Study session created successfully',
      session
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Update Session ───────────────────────────────────────────────────────────

// PUT /api/sessions/:id
// Updates a study session - only the creator can do this
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, date, description } = req.body;

    // Validate that at least one field is provided
    if (!title && !date && !description) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }

    const session = await StudySession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only the creator can update the session
    if (!session.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the session creator can update this session' });
    }

    // Validate that the new date is not in the past
    if (date && new Date(date) < new Date()) {
      return res.status(400).json({ message: 'Session date cannot be in the past' });
    }

    // Build update object with only provided fields
    const updates = {};
    if (title) updates.title = title;
    if (date) updates.date = date;
    if (description) updates.description = description;

    const updatedSession = await StudySession.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Study session updated successfully',
      session: updatedSession
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Delete Session ───────────────────────────────────────────────────────────

// DELETE /api/sessions/:id
// Deletes a study session - only the creator can do this
router.delete('/:id', auth, async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only the creator can delete the session
    if (!session.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the session creator can delete this session' });
    }

    await StudySession.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Study session deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;