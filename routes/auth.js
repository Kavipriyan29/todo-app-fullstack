const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters')
];

const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(409).json({
                message: `User with this ${field} already exists`,
                field
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName
        });

        await user.save();

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                preferences: user.preferences
            },
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                preferences: user.preferences,
                lastLogin: user.lastLogin
            },
            token,
            refreshToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                fullName: req.user.fullName,
                preferences: req.user.preferences,
                lastLogin: req.user.lastLogin,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            message: 'Failed to get profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, [
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('preferences.darkMode').optional().isBoolean(),
    body('preferences.notifications').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName, preferences } = req.body;
        const user = req.user;

        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                preferences: user.preferences
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        message: 'Logged out successfully'
    });
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            fullName: req.user.fullName
        }
    });
});

module.exports = router;
