// This defines the schema for a StudySync user

const mongoose = require('mongoose'); // We import Mongoose for schema and model
const bcrypt = require('bcrypt'); // We import bcrypt to hash passwords before storing them

const userSchema = new mongoose.Schema( // We used this to define the structure for user documents in MongoDB
  {
    name: {
      type: String, 
      required: [true, 'Name is required'], // We enforce that every user must have a name
      trim: true // We decided to auto-remove whitespace to avoid future errors
    },
    // Email must be unique across all users – we use this for login and identification
    email: {
      type: String, 
      required: [true, 'Email is required'], // We make email mandatory for authentication
      unique: true, // We ensure no two users can register with the same email
      trim: true, // We decided to auto-remove whitespace to avoid future errors
      lowercase: true // We store emails in lowercase to avoid case-sensitive duplicates
    },
    // Password is hashed before saving – we never store plain text passwords
    password: {
      type: String, // The password will be a string (but we hash it)
      required: [true, 'Password is required'], // We require a password for every account
      minlength: [6, 'Password must be at least 6 characters'] // We enforce a minimum length for security
    }
  },
  {
    timestamps: true
  }
);

// Runs before every save – only hashes the password if it has been modified (e.g., new user or password change)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // We skip hashing if the password hasn't changed
  this.password = await bcrypt.hash(this.password, 10); // We hash the password with salt rounds = 10 for security
});

// Used during login to compare the entered password with the stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // We return true if passwords match, false otherwise
};
module.exports = mongoose.model('User', userSchema);