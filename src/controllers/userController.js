const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const User = require('../models/User');

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
  const { profileImage, coverImage } = req.files;

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
      const result = await cloudinary.uploader.upload(profileImage[0].path);
      user.profileImage = result.secure_url;
      fs.unlinkSync(profileImage[0].path); // Remove temp file
    }

    if (coverImage) {
      const result = await cloudinary.uploader.upload(coverImage[0].path);
      user.coverImage = result.secure_url;
      fs.unlinkSync(coverImage[0].path); // Remove temp file
    }

    await user.save();
    res.json({ message: 'Profile updated', user: { username: user.username, email: user.email, profileImage: user.profileImage, coverImage: user.coverImage } });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
