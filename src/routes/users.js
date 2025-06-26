const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getProfile, updateProfile, getUserById, getUserCount, getCountryCount, searchUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer to handle both profileImage and coverImage fields
const upload = multer({ dest: 'uploads/' }).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

router.get('/profile', authMiddleware, getProfile); // Get authenticated user's profile
router.put('/profile', authMiddleware, upload, updateProfile); // Update authenticated user's profile
router.get('/search', searchUsers); // <-- Use searchUsers here
router.get('/:userId', getUserById); // Get any user's profile by ID
router.get('/count', getUserCount); // Get total user count
router.get('/countries', getCountryCount); // Added route for unique countries count

module.exports = router;