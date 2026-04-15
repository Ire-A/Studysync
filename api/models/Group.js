// models/Group.j
// Defines the schema for a StudySync study group
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    // Name of the study group
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true
    },

    // Brief description of the group's purpose
    description: {
      type: String,
      trim: true
    },

    // The user who created the group
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // List of users who are members of the group
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

module.exports = mongoose.model('Group', groupSchema);