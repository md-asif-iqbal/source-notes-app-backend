const User = require('../models/User');

// @desc    List all users with pagination (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // List operation supported by { createdAt: -1 } index on User schema
    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(),
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
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin or Self)
const getUserById = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user profile',
      });
    }

    // Read operation supported by default _id index
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, interests } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with that email already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'DefaultPass123!',
      role: role || 'user',
      interests: Array.isArray(interests) ? interests : [],
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, role, interests, email } = req.body;
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (interests !== undefined) user.interests = Array.isArray(interests) ? interests : [];
    if (email !== undefined && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another user',
        });
      }
      user.email = email;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves accidentally
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// AGGREGATION SCENARIO 1: Group by Interests
// Constraint: Exactly ONE collection.aggregate() call. Supported by index.
// ============================================================================
// @desc    Group users by their interests using MongoDB Aggregation Pipeline
// @route   GET /api/users/group-by-interests
// @access  Private (Authenticated users & Admin)
const getUsersByInterestsAggregation = async (req, res, next) => {
  try {
    // Exactly ONE collection.aggregate() call on the User collection
    // Multi-key index on userSchema.index({ interests: 1 }) supports unwind and grouping operations
    const pipeline = [
      // Stage 1: Deconstruct the interests array so each interest becomes a document
      { $unwind: '$interests' },

      // Stage 2: Group by the normalized interest string
      {
        $group: {
          _id: { $toLower: '$interests' },
          count: { $sum: 1 },
          users: {
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              role: '$role',
            },
          },
        },
      },

      // Stage 3: Sort alphabetically by interest name
      { $sort: { _id: 1 } },

      // Stage 4: Clean up output formatting for client consumption
      {
        $project: {
          _id: 0,
          interest: '$_id',
          count: 1,
          users: 1,
        },
      },
    ];

    const results = await User.aggregate(pipeline);

    res.status(200).json({
      success: true,
      scenario: 'Scenario 1: Group by Interests',
      totalInterests: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByInterestsAggregation,
};
