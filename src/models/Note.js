const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
    },
    tags: {
      type: [String],
      default: [],
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
// 1. Compound index for user note list view (filtering by userId and sorting by createdAt DESC with pagination)
noteSchema.index({ userId: 1, createdAt: -1 });

// 2. Index for admin note list view (sorting all users' notes by createdAt DESC with pagination)
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
