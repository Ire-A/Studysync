// models/Resource.js
// Defines the schema for a StudySync shared resource
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    // Title or name of the resource
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true
    },

    // The group this resource belongs to
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },

    // The user who shared the resource
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Type of resource - link or note
    type: {
      type: String,
      enum: ['link', 'note'],
      required: [true, 'Resource type is required']
    },

    // The actual content - a URL if type is link, text if type is note
    content: {
      type: String,
      required: [true, 'Resource content is required'],
      trim: true
    }
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

module.exports = mongoose.model('Resource', resourceSchema);