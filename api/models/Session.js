// models/Session.js
// Defines the schema for a StudySync study session
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    // Title of the study session
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true
    },

    // The group this session belongs to
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },

    // The user who created the session
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Date and time of the study session
    date: {
      type: Date,
      required: [true, 'Session date is required']
    },

    // Optional description or meeting link
    description: {
      type: String,
      trim: true
    }
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

module.exports = mongoose.model('Session', sessionSchema);