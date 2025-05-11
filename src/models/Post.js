const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['music', 'gaming', 'fashion', 'technology', 'school', 'creativity', 'books', 'mental-health', 'lifestyle']
  },
  tags: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
    default: 'https://i.imgur.com/U0y5ne8.jpeg',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Post', postSchema);