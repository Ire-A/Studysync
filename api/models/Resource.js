// This file defines the schema for a StudySync shared resource
const mongoose = require('mongoose'); // Import Mongoose for schema definition
const resourceSchema = new mongoose.Schema( // We use this to define the structure for shared resources (links/notes) in MongoDB
  {
    title: {
      type: String, // Store as text
      required: [true, 'Resource title is required'], // We make title mandatory so users know what the resource is
      trim: true // We trim whitespace to avoid accidental empty strings
    },

    // The group this resource belongs to – each resource is tied to a specific study group
    group: {
      type: mongoose.Schema.Types.ObjectId, // This references a Group document by its ID
      ref: 'Group', // Links to the Group model
      required: true // We enforce that every resource must be in some group
    },

    // The user who shared the resource – for tracking and permissions
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // References a User document
      ref: 'User', // Links to the User model
      required: true // We ensure we know who added the resource
    },

    // Type of resource – either a web link or a text note
    type: {
      type: String, // Store as string
      enum: ['link', 'note'], // We restrict to only these two values to keep data clean
      required: [true, 'Resource type is required'] // Must specify which type
    },

    // The actual content – if type is 'link' this holds a URL, if 'note' it holds plain text
    content: {
      type: String, // Store as text (URLs or notes)
      required: [true, 'Resource content is required'], // We require content so resources aren't empty
      trim: true // We decided to auto-remove whitespace to avoid future errors
    }
  },
  {
    timestamps: true
  }
);
module.exports = mongoose.model('Resource', resourceSchema);