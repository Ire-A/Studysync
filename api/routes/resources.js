// This file handles CRUD operations for shared resources
const express = require('express'); // import Express to create route handlers
const router = express.Router(); // create a new router object for resource routes
const Resource = require('../models/Resource'); // import the Resource model to interact with the database
const Group = require('../models/Group'); // import the Group model to check group membership
const auth = require('../middleware/auth'); // import the authentication middleware to protect routes

// This method returns all resources for a specific group
router.get('/', auth, async (req, res) => { // We handle GET requests, require auth, and use async for DB calls
  try { // wrap in try/catch to handle errors
    const { groupId } = req.query; // extract groupId from the query string (?groupId=...)

    // Validate that groupId is provided
    if (!groupId) { // check if groupId exists
      return res.status(400).json({ message: 'Group ID is required' }); // send a 400 error if missing
    }
    // Check if the group exists
    const group = await Group.findById(groupId); // find the group by ID
    if (!group) { // If no group is found
      return res.status(404).json({ message: 'Group not found' }); // return a 404 not found
    }

    // Check if the user is a member of the group
    if (!group.members.includes(req.user.id)) { // check if the logged-in user's ID is in the members array
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // deny access if not a member
    }

    // Fetch all resources for the group, sorted by date created
    const resources = await Resource.find({ group: groupId }) // find all resources that belong to this group
      .populate('createdBy', 'name email') // We populate the creator's name and email (no password)
      .sort({ createdAt: -1 }); // sort with newest first (descending order)

    res.status(200).json({ resources }); // send a 200 OK response with the resources array

  } catch (err) { // If anything goes wrong
    res.status(500).json({ message: 'Server error', error: err.message }); // We return a 500 server error
  }
});

// This method returns a single resource by ID
router.get('/:id', auth, async (req, res) => { // GET with resource ID parameter, requires auth
  try {
    const resource = await Resource.findById(req.params.id) // find the resource by the ID from the URL
      .populate('createdBy', 'name email') // populate the creator details
      .populate('group', 'name'); // populate just the group name (not all group fields)

    if (!resource) { // If no resource is found
      return res.status(404).json({ message: 'Resource not found' }); // return a 404
    }

    // Check if the user is a member of the group
    const group = await Group.findById(resource.group); // find the group that this resource belongs to
    if (!group.members.includes(req.user.id)) { // check if the user is a member of that group
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // deny access if not a member
    }

    res.status(200).json({ resource }); // send the resource back

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method creates a new shared resource for a group
router.post('/', auth, async (req, res) => { // POST request to create a resource, requires auth
  try {
    const { title, groupId, type, content } = req.body; // We destructure the required fields from request body

    // Validate that all required fields are provided
    if (!title || !groupId || !type || !content) { // We check if any are missing
      return res.status(400).json({ message: 'Title, group ID, type and content are required' }); // We return a 400 error
    }

    // Validate that type is either link or note
    if (!['link', 'note'].includes(type)) { // We check if type is allowed
      return res.status(400).json({ message: 'Type must be either link or note' }); // We reject invalid types
    }

    // If type is link, validate that content is a valid URL
    if (type === 'link') { // check if the type is a link
      try {
        new URL(content); // try to construct a URL object – this will throw if invalid
      } catch {
        return res.status(400).json({ message: 'Content must be a valid URL for link type resources' }); // reject invalid URLs
      }
    }

    // Check if the group exists
    const group = await Group.findById(groupId); // find the group by ID
    if (!group) { // If group doesn't exist
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if the user is a member of the group
    if (!group.members.includes(req.user.id)) { // We verify membership
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' });
    }

    const resource = await Resource.create({ // We use Mongoose's create method to save the resource
      title, // pass the title
      group: groupId, // link to the group
      createdBy: req.user.id, // set the creator to the logged-in user
      type, // set link or note
      content // store the URL or note text
    });

    res.status(201).json({ 
      message: 'Resource shared successfully',
      resource // return the created resource
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method updates a resource - only the creator can do this
router.put('/:id', auth, async (req, res) => { // PUT request to update, auth required
  try {
    const { title, type, content } = req.body; // get the fields to update

    // Validate that at least one field is provided
    if (!title && !type && !content) { // If all are empty/missing
      return res.status(400).json({ message: 'Please provide at least one field to update' }); // return a 400 error
    }

    const resource = await Resource.findById(req.params.id); // find the resource by ID
    if (!resource) { // If it doesn't exist
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Only the creator can update the resource
    if (!resource.createdBy.equals(req.user.id)) { // compare creator ID with logged-in user ID
      return res.status(403).json({ message: 'Forbidden - only the resource creator can update this resource' }); // deny if not creator
    }

    // Validate type if provided
    if (type && !['link', 'note'].includes(type)) { // If a new type is provided, we check it's valid
      return res.status(400).json({ message: 'Type must be either link or note' });
    }

    // Determine the type to use for URL validation
    const resolvedType = type || resource.type; // use the new type if provided, otherwise the existing type

    // If type is link, validate that content is a valid URL
    if (resolvedType === 'link' && content) { // only validate if the content is being updated
      try {
        new URL(content); // We test URL validity
      } catch {
        return res.status(400).json({ message: 'Content must be a valid URL for link type resources' });
      }
    }

    // Build update object with only provided fields
    const updates = {}; // start empty
    if (title) updates.title = title; // add title if provided
    if (type) updates.type = type; // add type if provided
    if (content) updates.content = content; // add content if provided

    const updatedResource = await Resource.findByIdAndUpdate( 
      req.params.id, 
      updates, 
      { new: true, runValidators: true } // return the updated doc and run schema validators
    );

    res.status(200).json({
      message: 'Resource updated successfully',
      resource: updatedResource
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method deletes a resource - only the creator can do this
router.delete('/:id', auth, async (req, res) => { // DELETE request, auth required
  try {
    const resource = await Resource.findById(req.params.id); // find the resource

    if (!resource) { // If it doesn't exist
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Only the creator can delete the resource
    if (!resource.createdBy.equals(req.user.id)) { // check if the logged-in user is the creator
      return res.status(403).json({ message: 'Forbidden - only the resource creator can delete this resource' });
    }

    await Resource.findByIdAndDelete(req.params.id); // delete the resource from the database

    res.status(200).json({ message: 'Resource deleted successfully' }); // send success response

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 