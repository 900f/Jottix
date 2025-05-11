const Post = require('../models/Post');

exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'Music',
      'Technology',
      'Gaming',
      'Fashion',
      'Lifestyle',
      'School Life',
      'Creativity',
      'Books',
      'Mental-Health',
    ];

    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Post.countDocuments({ category });
        return { name: category, count };
      })
    );

    res.json(categoryCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};