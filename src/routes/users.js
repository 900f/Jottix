const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getProfile, updateProfile, getUserById } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Configure Multer to handle both profileImage and coverImage fields
const upload = multer({ dest: 'uploads/' }).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

router.get('/profile', authMiddleware, getProfile); // Get authenticated user's profile
router.put('/profile', authMiddleware, upload, updateProfile); // Update authenticated user's profile
router.get('/search', userController.searchUsers); // <- ADD THIS LINE
router.get('/:userId', getUserById); // Get any user's profile by ID

module.exports = router;