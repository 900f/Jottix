const express = require('express');
const router = express.Router();
const multer = require('multer');
const { signup, login } = require('../controllers/authController');

const upload = multer({ dest: 'uploads/' });

// Multer error handler
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  }
  next(err);
};

router.post('/signup', upload.single('profileImage'), handleMulterError, signup);
router.post('/login', login);

module.exports = router;