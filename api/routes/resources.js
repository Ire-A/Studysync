// routes/resources.js
// Handles CRUD operations for shared resources
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// ─── Get All Resources ────────────────────────────────────────────────────────

// GET /api/resources
// Returns all resources for a specific group
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

    // Fetch all resources for the group, sorted by date created
    const resources = await Resource.find({ group: groupId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ resources });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Get Single Resource ──────────────────────────────────────────────────────

// GET /api/resources/:id
// Returns a single resource by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('group', 'name');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Check if the user is a member of the group
    const group = await Group.findById(resource.group);
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    res.status(200).json({ resource });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Create Resource ──────────────────────────────────────────────────────────

// POST /api/resources
// Creates a new shared resource for a group
router.post('/', auth, async (req, res) => {
  try {
    const { title, groupId, type, content } = req.body;

    // Validate that all required fields are provided
    if (!title || !groupId || !type || !content) {
      return res.status(400).json({ message: 'Title, group ID, type and content are required' });
    }

    // Validate that type is either link or note
    if (!['link', 'note'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either link or note' });
    }

    // If type is link, validate that content is a valid URL
    if (type === 'link') {
      try {
        new URL(content);
      } catch {
        return res.status(400).json({ message: 'Content must be a valid URL for link type resources' });
      }
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

    const resource = await Resource.create({
      title,
      group: groupId,
      createdBy: req.user.id,
      type,
      content
    });

    res.status(201).json({
      message: 'Resource shared successfully',
      resource
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Update Resource ──────────────────────────────────────────────────────────

// PUT /api/resources/:id
// Updates a resource - only the creator can do this
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, type, content } = req.body;

    // Validate that at least one field is provided
    if (!title && !type && !content) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Only the creator can update the resource
    if (!resource.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the resource creator can update this resource' });
    }

    // Validate type if provided
    if (type && !['link', 'note'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either link or note' });
    }

    // Determine the type to use for URL validation
    const resolvedType = type || resource.type;

    // If type is link, validate that content is a valid URL
    if (resolvedType === 'link' && content) {
      try {
        new URL(content);
      } catch {
        return res.status(400).json({ message: 'Content must be a valid URL for link type resources' });
      }
    }

    // Build update object with only provided fields
    const updates = {};
    if (title) updates.title = title;
    if (type) updates.type = type;
    if (content) updates.content = content;

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Resource updated successfully',
      resource: updatedResource
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Delete Resource ──────────────────────────────────────────────────────────

// DELETE /api/resources/:id
// Deletes a resource - only the creator can do this
router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Only the creator can delete the resource
    if (!resource.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden - only the resource creator can delete this resource' });
    }

    await Resource.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Resource deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;