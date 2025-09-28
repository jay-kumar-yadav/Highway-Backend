import express from 'express';
import { body, validationResult } from 'express-validator';
import Note from '../models/Note';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/notes
// @desc    Get all notes for authenticated user
// @access  Private
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notes = await Note.find({ author: req.user!._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notes'
    });
  }
});

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', [
  authenticateToken,
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, content } = req.body;

    const note = new Note({
      title,
      content,
      author: req.user!._id
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating note'
    });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('content').optional().trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters')
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findOne({ _id: id, author: req.user!._id });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    await note.save();

    res.json({
      success: true,
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating note'
    });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, author: req.user!._id });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await Note.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting note'
    });
  }
});

// @route   GET /api/notes/:id
// @desc    Get a single note
// @access  Private
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, author: req.user!._id });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching note'
    });
  }
});

export default router;
