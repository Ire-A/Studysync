// This file has the main entry point for the StudySync API
const express = require('express'); // Import Express framework for building the API
const mongoose = require('mongoose'); // Import Mongoose for MongoDB interactions
const session = require('express-session'); // Import session middleware for user sessions
const MongoStore = require('connect-mongo'); // Import MongoDB session store to persist sessions
const cookieParser = require('cookie-parser'); // Import cookie parser to read cookies from requests
require('dotenv').config(); // Load environment variables from .env file

const app = express(); // Create an Express application instance

// Parse incoming JSON and URL-encoded form data
app.use(express.json()); // Automatically parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data 

// Parse cookies from incoming requests
app.use(cookieParser()); // Makes cookies available in req.cookies

// Sessions are stored in MongoDB so they persist across server restarts
app.use(session({ // Configure session handling
  secret: process.env.SESSION_SECRET, // Secret key for signing session IDs (from .env)
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create empty sessions for unauthenticated users
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), // Store sessions in MongoDB (prevents session loss on restart)
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // Session cookie expires after 1 day (milliseconds)
}));

mongoose.connect(process.env.MONGO_URI) // Connect to MongoDB using URI from .env
  .then(() => console.log('Connected to MongoDB')) 
  .catch((err) => console.error('MongoDB connection error:', err)); 

app.get('/', (req, res) => { 
  res.json({ 
    message: 'Welcome to the StudySync',
    // endpoints: {
    //   register: 'POST /api/users/register',
    //   login: 'POST /api/users/login',
    //   groups: 'GET /api/groups',
      
    // } commented this out for when the client side is done.
  });
});

// Mount all API routes under /api prefix
const routes = require('./routes/index'); // Import the main routes index file
app.use('/api', routes); // Forward requests starting with /api to the routes index

// Catches any requests to routes that don't exist 
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' }); 
});

app.use((err, req, res, next) => { 
  console.error(err.stack); // Log the full error stack to the console
  res.status(500).json({ message: 'Internal server error' }); 
});

const PORT = process.env.PORT || 9001; // Use port from environment variable or default which we set to 9001 incase 9000 is already in use
app.listen(PORT, () => console.log(`StudySync server running on port ${PORT}`)); // Start the server