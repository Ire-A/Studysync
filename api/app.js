// app.js
// Main entry point for the StudySync API
// Authors: Ireoluwatomiwa Awonola, Olimeh Kelvin, Francis Ngonadi

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

// Parse incoming JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies from incoming requests
app.use(cookieParser());

// ─── Session Setup ────────────────────────────────────────────────────────────

// Sessions are stored in MongoDB so they persist across server restarts
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session lasts 1 day
}));

// ─── Database Connection ──────────────────────────────────────────────────────

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  // You can send any response you like
  res.json({ 
    message: 'Welcome to the StudySync API!',
    // endpoints: {
    //   register: 'POST /api/users/register',
    //   login: 'POST /api/users/login',
    //   groups: 'GET /api/groups',
      
    // } commented this out for when the client side is done.
  });
});


const routes = require('./routes/index');
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

// Catches any requests to routes that don't exist
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// Catches any unexpected server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`StudySync server running on port ${PORT}`));
