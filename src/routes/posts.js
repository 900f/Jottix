const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const authMiddleware = require('../middleware/authMiddleware');
const { createPost, getPosts, getPostById, toggleLike, createComment, deleteComment } = require('../controllers/postController');

router.get('/test', (req, res) => res.json({ message: 'Test route works' }));
router.post('/', authMiddleware, upload.single('image'), createPost);
router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/:id/like', authMiddleware, toggleLike);
router.post('/:id/comments', authMiddleware, createComment);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;