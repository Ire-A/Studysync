// This file defines the schema for a StudySync study group

const mongoose = require('mongoose'); // Import Mongoose for database schema definition
const groupSchema = new mongoose.Schema( // We used this to define the structure for groups in MongoDB
  {
   
    name: {
      type: String,                                   
      required: [true, 'Group name is required'],     
      trim: true // We decided to auto-remove whitespace to avoid future errors
    },
    description: {
      type: String,                                   
      trim: true                                      
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,           
      ref: 'User',                                    
      required: true // Added a check to ensure every group must have a creator
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,         
        ref: 'User'                                   
      }
    ]
  },
  {
    timestamps: true                                 
  }
);

module.exports = mongoose.model('Group', groupSchema); 