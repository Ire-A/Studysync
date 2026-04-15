// models/Task.js
// Defines the schema for a StudySync task
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // Title of the task
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },

    // The group this task belongs to
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },

    // The user who created the task
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // The user who is assigned to complete the task
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Deadline for the task
    deadline: {
      type: Date,
      default: null
    },

    // Whether the task has been completed
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

module.exports = mongoose.model('Task', taskSchema);