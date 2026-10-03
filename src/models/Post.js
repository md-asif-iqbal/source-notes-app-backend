const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicit schema indexes (strictly optimized per requirements)
// 1. Foreign key index supporting Scenario 2 ($lookup aggregation joining posts by userId)
postSchema.index({ userId: 1, createdAt: -1 });

// 2. Index for public post feed view (sorting all posts by createdAt DESC with pagination)
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
