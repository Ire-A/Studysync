// Thsi defines the schema for a StudySync task

const mongoose = require('mongoose'); // We import Mongoose to define the schema and model
const taskSchema = new mongoose.Schema( // We set up the structure for tasks in MongoDB
  {
    title: {
      type: String,
      required: [true, 'Task title is required'], // We enforce that every task must have a title
      trim: true // We trim whitespace to prevent accidental empty strings or leading/trailing spaces
    },
    // The group this task belongs to – tasks are always tied to a study group
    group: {
      type: mongoose.Schema.Types.ObjectId, // This references a Group document by its ID
      ref: 'Group', // We link to the Group model
      required: true // We make sure the task is associated with a valid group
    },
    // The user who created the task – for tracking responsibility
    createdBy: {
      type: mongoose.Schema.Types.ObjectId, // References a User document
      ref: 'User', // Links to the User model
      required: true // We record who made the task
    },
    // The user who is assigned to complete the task – optional because tasks can be unassigned initially
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId, // References a User document
      ref: 'User', // Links to the User model
      default: null // We set default to null meaning no one is assigned yet
    },
    // Deadline for the task – optional because some tasks may not have a strict deadline
    deadline: {
      type: Date, // We store as Date type for easy comparison and sorting
      default: null // We set default to null, meaning no deadline set
    },
    // Whether the task has been completed – we use a boolean flag
    completed: {
      type: Boolean, 
      default: false // By default, new tasks are not completed
    }
  },
  {
    timestamps: true 
  }
);
module.exports = mongoose.model('Task', taskSchema);