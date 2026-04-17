// This file handles the CRUD operations for study groups
const express = require('express'); // import Express to create route handlers
const router = express.Router(); // create a new router object to define our group routes
const Group = require('../models/Group'); // import the Group model to interact with the database
const auth = require('../middleware/auth'); // import the authentication middleware to protect routes

// This method returns all groups the logged in user is a member of
router.get('/', auth, async (req, res) => { // We use GET, require auth, and use async for database calls
  try { // We wrap in try/catch to handle errors gracefully
    const groups = await Group.find({ members: req.user.id }) // We query for groups where the user's ID is in the members array
      .populate('createdBy', 'name email') // We populate the creator's name and email (no password)
      .populate('members', 'name email'); // We populate all members' names and emails

    res.status(200).json({ groups }); 

  } catch (err) { 
    res.status(500).json({ message: 'Server error', error: err.message }); 
  }
});

// This method returns a single group by ID
router.get('/:id', auth, async (req, res) => { // GET with group ID parameter, requires authentication
  try {
    const group = await Group.findById(req.params.id) // We find the group by the ID from the URL
      .populate('createdBy', 'name email') // We populate creator details
      .populate('members', 'name email'); // We populate member details

    if (!group) { // If no group is found
      return res.status(404).json({ message: 'Group not found' }); // return a 404 not found
    }
    // Check if the logged in user is a member of the group
    if (!group.members.some(member => member._id.equals(req.user.id))) { // We use .some() to see if any member ID matches the logged-in user's ID
      return res.status(403).json({ message: 'Forbidden - you are not a member of this group' }); // We deny access if not a member
    } // We did this to ensure that a user does not log into a group they do not belong.
    res.status(200).json({ group }); 
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method creates a new study group
router.post('/', auth, async (req, res) => { // POST request to create a group, requires auth
  try {
    const { name, description } = req.body; // Destructure name and description from request body

    // Validate that name is provided
    if (!name) { // We check if name exists
      return res.status(400).json({ message: 'Group name is required' }); // We send a 400 error if missing
    }
    // Create the group, adding the creator as the first member
    const group = await Group.create({ // We use Mongoose's create method
      name, // pass the name
      description, // pass the description 
      createdBy: req.user.id, // set the creator to the logged-in user's ID
      members: [req.user.id] // start the members array with the creator
    });
    res.status(201).json({ 
      message: 'Group created successfully',
      group 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method adds the logged in user to a group
router.post('/:id/join', auth, async (req, res) => { // POST to /:id/join, auth required
  try {
    const group = await Group.findById(req.params.id); // We find the group by ID

    if (!group) { // If group doesn't exist
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    if (group.members.includes(req.user.id)) { // We check if the user's ID is already in the members array
      return res.status(400).json({ message: 'You are already a member of this group' }); // We prevent duplicate joining
    }
    // Add the user to the members array
    group.members.push(req.user.id); // push the user ID into the members array
    await group.save(); // save the updated group to the database

    res.status(200).json({
      message: 'Joined group successfully',
      group 
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method updates a group's name or description - only the creator can do this
router.put('/:id', auth, async (req, res) => { // PUT request to update group, auth required
  try {
    const { name, description } = req.body; // get the fields to update

    // Validate that at least one field is provided
    if (!name && !description) { // If neither name nor description is provided
      return res.status(400).json({ message: 'Please provide a name or description to update' }); // return a 400 error
    }

    const group = await Group.findById(req.params.id); // We find the group

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only the creator can update the group
    if (!group.createdBy.equals(req.user.id)) { // We compare the creator's ID with the logged-in user's ID
      return res.status(403).json({ message: 'Forbidden - only the group creator can update this group' }); // We deny update if not creator
    }

    // Build update object with only provided fields
    const updates = {}; // start with an empty object
    if (name) updates.name = name; // add name if provided
    if (description) updates.description = description; // add description if provided

    const updatedGroup = await Group.findByIdAndUpdate( // use findByIdAndUpdate to update in one operation
      req.params.id, // The group ID
      updates, // The fields to update
      { new: true, runValidators: true } // return the updated document and run schema validators
    );

    res.status(200).json({
      message: 'Group updated successfully',
      group: updatedGroup
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// This method deletes a group - only the creator can do this
router.delete('/:id', auth, async (req, res) => { // DELETE request, auth required
  try {
    const group = await Group.findById(req.params.id); // find the group

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only the creator can delete the group
    if (!group.createdBy.equals(req.user.id)) { // check if the logged-in user is the creator
      return res.status(403).json({ message: 'Forbidden - only the group creator can delete this group' });
    }

    await Group.findByIdAndDelete(req.params.id); // delete the group from the database

    res.status(200).json({ message: 'Group deleted successfully' }); //  send success response

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
module.exports = router; 