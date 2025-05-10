const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getProfile, updateProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('profileImage'), updateProfile);

module.exports = router;