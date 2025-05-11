const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  birthDate: {
    type: Date,
    required: true,
  },
  profileImage: {
    type: String,
    default: 'https://i.imgur.com/U0y5ne8.jpeg',
  },

  coverImage: {
    type: String,
    default: 'https://i.imgur.com/default-cover.jpg',
  },

  interests: [{ type: String }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  instagram: {
    type: String,
    default: '',
  },
  twitter: {
    type: String,
    default: '',
  },
  tiktok: {
    type: String,
    default: '',
  },
  postsCount: {
    type: Number,
    default: 0,
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('User', userSchema);