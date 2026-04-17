// Thsi defines the schema for a StudySync study session

const mongoose = require('mongoose'); // Import Mongoose for schema definition
const sessionSchema = new mongoose.Schema( // We use this to define the structure for study sessions in MongoDB
  {
    title: {
      type: String, // Text field
      required: [true, 'Session title is required'], // We make this mandatory so sessions have clear names
      trim: true // We remove extra whitespace to keep data clean
    },
    // The group this session belongs to – sessions are always part of a group
    group: {
      type: mongoose.Schema.Types.ObjectId, // This references a Group document by ID
      ref: 'Group', // Links to the Group model
      required: true // We ensure every session is linked to an existing group
    },
    // The user who created the session – for ownership and permissions
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // References a User document
      ref: 'User', // Links to the User model
      required: true // We track who scheduled the session
    },
    // Date and time of the study session
    date: {
      type: Date, 
      required: [true, 'Session date is required'] // Sessions need a planned date/time
    },
    // Optional description or meeting link – users can add extra info if they want incase of zoom meetings.
    description: {
      type: String, // Text field
      trim: true // We trim whitespace for consistency
    }
  },
  {
    timestamps: true
  }
);
module.exports = mongoose.model('Session', sessionSchema);