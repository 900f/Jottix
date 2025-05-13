const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');

exports.createPost = async (req, res) => {
  const { title, content, category, tags } = req.body;
  const image = req.file;
  const defaultImage = 'https://i.imgur.com/U0y5ne8.jpeg';

  console.log('Create post request:', { title, content, category, tags, hasFile: !!image });

  try {
    if (!title || !content || !category) {
      console.log('Validation failed: Missing required fields', { title, content, category });
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('Validation failed: No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT decoded:', decoded);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message, jwtError.stack);
      return res.status(401).json({ message: 'Invalid token', error: jwtError.message });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('Validation failed: User not found', { userId: decoded.userId });
      return res.status(404).json({ message: 'User not found' });
    }

    let imageUrl = image ? image.path : defaultImage;
    if (image) {
      try {
        console.log('Uploading to Cloudinary:', image.path);
        const result = await cloudinary.uploader.upload(image.path, {
          folder: 'jottix_posts',
          width: 500,
          height: 300,
          crop: 'fill',
        });
        imageUrl = result.secure_url;
        console.log('Cloudinary upload successful:', imageUrl);
        await fs.unlink(image.path).catch(err => console.error('Failed to delete temp file:', err));
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError.message, cloudinaryError.stack);
        return res.status(500).json({ message: 'Failed to upload image', error: cloudinaryError.message });
      }
    }

    const tagsArray = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [];

    const post = new Post({
      title,
      content,
      image: imageUrl,
      category,
      tags: tagsArray,
      user: user._id,
    });

    try {
      await post.save();
      console.log('Post saved:', post);
    } catch (dbError) {
      console.error('Database save error:', dbError.message, dbError.stack);
      return res.status(500).json({ message: 'Failed to save post', error: dbError.message });
    }

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Create post error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  const { category, search, tag, sort = 'latest', page = 1, limit = 9 } = req.query;

  try {
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption = sort === 'latest' ? { createdAt: -1 } : { createdAt: 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(query)
      .populate('user', 'username profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    console.log('Posts retrieved:', posts.length, 'Total pages:', totalPages);
    res.json({ posts, totalPages });
  } catch (error) {
    console.error('Get posts error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
      { $sort: { name: 1 } },
    ]);
    console.log('Categories retrieved:', categories);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTags = async (req, res) => {
  try {
    const tags = await Post.distinct('tags');
    console.log('Tags retrieved:', tags.length);
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleLike = async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (error) {
    console.error('Toggle like error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  const { id } = req.params;
  console.log('Fetching post with ID:', id);

  try {
    const post = await Post.findById(id)
      .populate('user', 'username profileImage')
      .populate('comments.user', 'username profileImage');
    if (!post) {
      console.log('Post not found:', id);
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post by ID:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  console.log('Attempting to create comment for post:', id, 'by user:', userId);

  try {
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    post.comments.push({
      user: userId,
      content: content.trim(),
      createdAt: new Date()
    });

    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('comments.user', 'username profileImage');

    res.status(201).json({
      message: 'Comment created successfully',
      comment: updatedPost.comments[updatedPost.comments.length - 1]
    });
  } catch (error) {
    console.error('Create comment error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.userId;

  console.log('Attempting to delete comment:', commentId, 'from post:', postId, 'by user:', userId);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    post.comments = post.comments.filter(c => c._id.toString() !== commentId);
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};