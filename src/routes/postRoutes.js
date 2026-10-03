const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getUserPostsAggregation,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

// Public endpoints
router.get('/', getAllPosts);
router.get('/user/:userId', getUserPostsAggregation);

// Protected endpoint
router.post('/', protect, createPost);

module.exports = router;
