"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Note_1 = __importDefault(require("../models/Note"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// @route   GET /api/notes
// @desc    Get all notes for authenticated user
// @access  Private
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const notes = await Note_1.default.find({ author: req.user._id })
            .sort({ createdAt: -1 })
            .select('-__v');
        res.json({
            success: true,
            count: notes.length,
            notes
        });
    }
    catch (error) {
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
    auth_1.authenticateToken,
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    (0, express_validator_1.body)('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { title, content } = req.body;
        const note = new Note_1.default({
            title,
            content,
            author: req.user._id
        });
        await note.save();
        res.status(201).json({
            success: true,
            message: 'Note created successfully',
            note
        });
    }
    catch (error) {
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
    auth_1.authenticateToken,
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    (0, express_validator_1.body)('content').optional().trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const { title, content } = req.body;
        const note = await Note_1.default.findOne({ _id: id, author: req.user._id });
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }
        if (title !== undefined)
            note.title = title;
        if (content !== undefined)
            note.content = content;
        await note.save();
        res.json({
            success: true,
            message: 'Note updated successfully',
            note
        });
    }
    catch (error) {
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
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note_1.default.findOne({ _id: id, author: req.user._id });
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }
        await Note_1.default.findByIdAndDelete(id);
        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    }
    catch (error) {
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
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note_1.default.findOne({ _id: id, author: req.user._id });
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
    }
    catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching note'
        });
    }
});
exports.default = router;
//# sourceMappingURL=notes.js.map