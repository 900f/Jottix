const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const User = require('../models/User');
const Post = require('../models/Post');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const postsCount = await Post.countDocuments({ user: user._id });
    console.log('Profile response:', { ...user.toObject(), postsCount });
    res.json({ ...user.toObject(), postsCount });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { username, birthDate, interests, password, bio, instagram, twitter, tiktok } = req.body;
  const { profileImage, coverImage } = req.files || {};

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (birthDate) user.birthDate = new Date(birthDate);
    if (interests) user.interests = interests.split(',').map(i => i.trim());
    if (bio) user.bio = bio;
    if (instagram) user.instagram = instagram;
    if (twitter) user.twitter = twitter;
    if (tiktok) user.tiktok = tiktok;
    if (password) user.password = await bcrypt.hash(password, 10);

    if (profileImage && profileImage[0]) {
      const result = await cloudinary.uploader.upload(profileImage[0].path);
      user.profileImage = result.secure_url;
      fs.unlinkSync(profileImage[0].path);
    }

    if (coverImage && coverImage[0]) {
      const result = await cloudinary.uploader.upload(coverImage[0].path);
      user.coverImage = result.secure_url;
      fs.unlinkSync(coverImage[0].path);
    }

    await user.save();
    const postsCount = await Post.countDocuments({ user: user._id });
    res.json({
      message: 'Profile updated',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        bio: user.bio,
        instagram: user.instagram,
        twitter: user.twitter,
        tiktok: user.tiktok,
        birthDate: user.birthDate,
        interests: user.interests,
        postsCount,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'username email birthDate interests bio profileImage coverImage instagram twitter tiktok followersCount followingCount'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const postsCount = await Post.countDocuments({ user: user._id });
    console.log('User by ID response:', { ...user.toObject(), postsCount });
    res.json({ ...user.toObject(), postsCount });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  const query = req.query.query?.trim();

  if (!query) return res.json([]);

  try {
    const users = await User.find({
      username: { $regex: new RegExp(query, 'i') }
    }).select('_id username bio profileImage');

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getUserCount = async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCountryCount = async (req, res) => {
    try {
        const countries = await User.distinct('country');
        res.json({ count: countries.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
