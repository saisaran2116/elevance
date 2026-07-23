const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, postController.createPost);
router.get('/', protect, postController.getPosts);
router.post('/:id/like', protect, postController.likePost);
router.post('/:id/comment', protect, postController.commentPost);

module.exports = router;
