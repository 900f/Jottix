const Post = require('../models/Post');
   const User = require('../models/User');
   const cloudinary = require('../config/cloudinary');
   const fs = require('fs').promises;
   const jwt = require('jsonwebtoken');

   exports.createPost = async (req, res) => {
     const { title, content, category, tags } = req.body;
     const image = req.file;

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

       let imageUrl = '';
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
    const userId = req.user.id;
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
    console.log('Fetching post with ID:', id);  // ← Debugging line
  
    try {
      const post = await Post.findById(id).populate('user', 'username profileImage');
      if (!post) {
        console.log('Post not found:', id);     // ← Debugging line
        return res.status(404).json({ message: 'Post not found' });
      }
  
      res.json(post);
    } catch (error) {
      console.error('Error fetching post by ID:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  