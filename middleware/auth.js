const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                message: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ 
                message: 'Invalid token or user not found',
                code: 'INVALID_TOKEN'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            message: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken,
    generateRefreshToken
};
