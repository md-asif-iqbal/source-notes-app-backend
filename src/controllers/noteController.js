const Note = require('../models/Note');

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private (User & Admin)
const createNote = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const note = await Note.create({
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notes with pagination
// @route   GET /api/notes
// @access  Private (User views their own; Admin can view all or their own)
const getNotes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    let filter = {};

    // RBAC: Admin can view all notes (or filter by specific user if provided)
    // Regular user is strictly restricted to viewing only their own notes
    if (req.user.role === 'admin') {
      if (req.query.userId) {
        filter.userId = req.query.userId;
      } else if (req.query.scope === 'mine') {
        filter.userId = req.user._id;
      }
      // If scope is not 'mine' and no userId specified, admin views all notes
    } else {
      filter.userId = req.user._id;
    }

    // List operation supported by compound index { userId: 1, createdAt: -1 }
    // or by { createdAt: -1 } when listing all notes as Admin
    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(filter),
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
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single note by ID
// @route   GET /api/notes/:id
// @access  Private (Owner or Admin)
const getNoteById = async (req, res, next) => {
  try {
    // Read operation supported by primary key index (_id)
    const note = await Note.findById(req.params.id).populate('userId', 'name email role');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check authorization: Owner or Admin
    if (note.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this note',
      });
    }

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private (Owner or Admin)
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // RBAC: regular user can only update their own notes
    if (note.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this note',
      });
    }

    const { title, content, tags } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = Array.isArray(tags) ? tags : [];

    const updatedNote = await note.save();

    res.status(200).json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private (Owner or Admin)
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // RBAC: regular user can only delete their own notes
    if (note.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this note',
      });
    }

    await note.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
