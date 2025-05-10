const User = require('../models/User');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Profile response:', user); // Debug
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { username, birthDate, interests, password } = req.body;
  const profileImage = req.file;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (birthDate) user.birthDate = new Date(birthDate);
    if (interests) user.interests = interests.split(',').map(i => i.trim());
    if (password) user.password = await bcrypt.hash(password, 10);

    if (profileImage) {
      const result = await cloudinary.uploader.upload(profileImage.path);
      user.profileImage = result.secure_url;
    }

    await user.save();
    res.json({ message: 'Profile updated', user: { username: user.username, email: user.email, profileImage: user.profileImage } });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};