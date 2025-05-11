const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getProfile, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer to handle both profileImage and coverImage fields
const upload = multer({ dest: 'uploads/' }).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload, updateProfile); // Use `upload` instead of `upload.single()`

module.exports = router;
