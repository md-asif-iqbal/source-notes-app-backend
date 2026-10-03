const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private (Authenticated users)
const createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required for a post',
      });
    }

    const post = await Post.create({
      title,
      content,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (Public feed with pagination)
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Supported by index { createdAt: -1 } on Post schema
    const [posts, total] = await Promise.all([
      Post.find()
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// AGGREGATION SCENARIO 2: User Posts ($lookup)
// Context: Users can write posts which are stored in a separate Posts collection.
// Task: Retrieve all posts belonging to a particular user.
// Constraint: Use a single aggregation pipeline with a $lookup stage.
// Supported by index: postSchema.index({ userId: 1, createdAt: -1 })
// ============================================================================
// @desc    Retrieve all posts belonging to a particular user using $lookup aggregation
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPostsAggregation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const targetUserId = new mongoose.Types.ObjectId(userId);

    // Single aggregation pipeline using $lookup
    // Foreign key matching is supported by postSchema.index({ userId: 1, createdAt: -1 })
    const pipeline = [
      // Stage 1: Match the specific user by their ID
      {
        $match: {
          _id: targetUserId,
        },
      },
      // Stage 2: Join posts collection using $lookup
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts',
          pipeline: [
            { $sort: { createdAt: -1 } },
          ],
        },
      },
      // Stage 3: Project desired fields (hide sensitive fields like password)
      {
        $project: {
          password: 0,
          __v: 0,
        },
      },
      // Stage 4: Add total post count field for convenient consumption
      {
        $addFields: {
          postCount: { $size: '$posts' },
        },
      },
    ];

    const results = await User.aggregate(pipeline);

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userWithPosts = results[0];

    res.status(200).json({
      success: true,
      scenario: 'Scenario 2: User Posts ($lookup)',
      user: {
        _id: userWithPosts._id,
        name: userWithPosts.name,
        email: userWithPosts.email,
        role: userWithPosts.role,
        interests: userWithPosts.interests,
        createdAt: userWithPosts.createdAt,
      },
      postCount: userWithPosts.postCount,
      posts: userWithPosts.posts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getUserPostsAggregation,
};
