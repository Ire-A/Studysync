// This file mounts all route files for the StudySync API
const express = require('express');
const router = express.Router();
const userRoutes = require('./users');
const groupRoutes = require('./groups');
const sessionRoutes = require('./sessions');
const taskRoutes = require('./tasks');
const resourceRoutes = require('./resources');

// User routes - register, login, logout, profile
router.use('/users', userRoutes);

// Group routes - create, read, update, delete study groups
router.use('/groups', groupRoutes);

// Session routes - create, read, update, delete study sessions
router.use('/sessions', sessionRoutes);

// Task routes - create, read, update, delete tasks
router.use('/tasks', taskRoutes);

// Resource routes - create, read, update, delete shared resources
router.use('/resources', resourceRoutes);

module.exports = router;