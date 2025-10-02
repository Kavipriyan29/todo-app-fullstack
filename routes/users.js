const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user preferences
router.get('/preferences', async (req, res) => {
    try {
        res.json({
            preferences: req.user.preferences
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            message: 'Failed to get preferences',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update user preferences
router.put('/preferences', [
    body('darkMode').optional().isBoolean(),
    body('notifications').optional().isBoolean(),
    body('language').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const user = req.user;
        const { darkMode, notifications, language } = req.body;

        if (darkMode !== undefined) user.preferences.darkMode = darkMode;
        if (notifications !== undefined) user.preferences.notifications = notifications;
        if (language !== undefined) user.preferences.language = language;

        await user.save();

        res.json({
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            message: 'Failed to update preferences',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Change password
router.put('/password', [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Delete account
router.delete('/account', [
    body('password').notEmpty().withMessage('Password is required to delete account')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { password } = req.body;
        const user = await User.findById(req.user._id);

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                message: 'Password is incorrect'
            });
        }

        // Soft delete - deactivate account
        user.isActive = false;
        await user.save();

        // Also delete all user's todos
        const Todo = require('../models/Todo');
        await Todo.deleteMany({ user: user._id });

        res.json({
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            message: 'Failed to delete account',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
