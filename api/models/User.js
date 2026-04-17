// models/User.js
// Defines the schema for a StudySync user
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    // Email must be unique across all users
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },

    // Password is hashed before saving
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    }
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

// ─── Hash Password Before Saving ─────────────────────────────────────────────

// Runs before every save - only hashes the password if it has been modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ─── Method to Compare Passwords ─────────────────────────────────────────────

// Used during login to compare the entered password with the stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);