const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

exports.signup = async (req, res) => {
  const { username, email, password, birthDate, interests } = req.body;
  const profileImage = req.file;

  console.log('Signup request:', { username, email, birthDate, hasFile: !!profileImage });

  try {
    // Validate input
    if (!username || !email || !password || !birthDate) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check for existing user
    let user = await User.findOne({ email });
    if (user) {
      console.log('Validation failed: Email exists');
      return res.status(400).json({ message: 'Email already exists' });
    }

    user = await User.findOne({ username });
    if (user) {
      console.log('Validation failed: Username exists');
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Validate age
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) {
      console.log('Validation failed: Invalid birth date');
      return res.status(400).json({ message: 'Invalid birth date' });
    }
    const age = (new Date() - birth) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 13 || age > 18) {
      console.log('Validation failed: Age out of range');
      return res.status(400).json({ message: 'You must be between 13 and 18 years old' });
    }

    // Create user
    user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      birthDate,
      interests: interests ? interests.split(',').map(i => i.trim()) : [],
    });

    // Handle profile image
    let profileImageUrl = 'https://via.placeholder.com/100';
    if (profileImage) {
      try {
        console.log('Uploading to Cloudinary:', profileImage.path);
        const result = await cloudinary.uploader.upload(profileImage.path, {
          folder: 'jottix_profiles',
          width: 100,
          height: 100,
          crop: 'fill',
        });
        profileImageUrl = result.secure_url;
        console.log('Cloudinary upload successful:', profileImageUrl);
        // Clean up temporary file
        await fs.unlink(profileImage.path).catch(err => console.error('Failed to delete temp file:', err));
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        return res.status(500).json({ message: 'Failed to upload profile image', error: cloudinaryError.message });
      }
    }
    user.profileImage = profileImageUrl;

    try {
      await user.save();
      console.log('User saved:', user);
    } catch (dbError) {
      console.error('Database save error:', dbError);
      return res.status(500).json({ message: 'Failed to save user', error: dbError.message });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Signup successful, token:', token);

    res.json({ token, user: { username, email, profileImage: user.profileImage } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Login attempt:', { email });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: Invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Login successful, token:', token);
    res.json({ token, user: { username: user.username, email, profileImage: user.profileImage } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};