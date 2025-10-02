const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Todo = require('../models/Todo');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const validateTodo = [
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Todo text is required')
        .isLength({ max: 200 })
        .withMessage('Todo text cannot exceed 200 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('isDaily')
        .optional()
        .isBoolean()
        .withMessage('isDaily must be a boolean'),
    body('reminderTime')
        .optional()
        .isISO8601()
        .withMessage('Reminder time must be a valid date'),
    body('category')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Category cannot exceed 50 characters'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters')
];

// Get all todos for the authenticated user
router.get('/', [
    query('completed').optional().isBoolean(),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('isDaily').optional().isBoolean(),
    query('category').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { completed, priority, isDaily, category, page = 1, limit = 50 } = req.query;
        
        const filters = {};
        if (completed !== undefined) filters.completed = completed === 'true';
        if (priority) filters.priority = priority;
        if (isDaily !== undefined) filters.isDaily = isDaily === 'true';
        if (category) filters.category = category;

        const skip = (page - 1) * limit;
        
        const todos = await Todo.getUserTodos(req.user._id, filters)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Todo.countDocuments({ user: req.user._id, ...filters });

        res.json({
            todos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get todos error:', error);
        res.status(500).json({
            message: 'Failed to fetch todos',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get todo statistics
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user._id;
        
        const [total, completed, active, high, medium, low, daily, overdue] = await Promise.all([
            Todo.countDocuments({ user: userId }),
            Todo.countDocuments({ user: userId, completed: true }),
            Todo.countDocuments({ user: userId, completed: false }),
            Todo.countDocuments({ user: userId, priority: 'high', completed: false }),
            Todo.countDocuments({ user: userId, priority: 'medium', completed: false }),
            Todo.countDocuments({ user: userId, priority: 'low', completed: false }),
            Todo.countDocuments({ user: userId, isDaily: true }),
            Todo.countDocuments({ 
                user: userId, 
                completed: false, 
                dueDate: { $lt: new Date() } 
            })
        ]);

        res.json({
            total,
            completed,
            active,
            priority: { high, medium, low },
            daily,
            overdue
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            message: 'Failed to fetch statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Create new todo
router.post('/', validateTodo, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const todoData = {
            ...req.body,
            user: req.user._id
        };

        const todo = new Todo(todoData);
        await todo.save();

        res.status(201).json({
            message: 'Todo created successfully',
            todo
        });

    } catch (error) {
        console.error('Create todo error:', error);
        res.status(500).json({
            message: 'Failed to create todo',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get single todo
router.get('/:id', async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!todo) {
            return res.status(404).json({
                message: 'Todo not found'
            });
        }

        res.json({ todo });

    } catch (error) {
        console.error('Get todo error:', error);
        res.status(500).json({
            message: 'Failed to fetch todo',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update todo
router.put('/:id', validateTodo, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const todo = await Todo.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!todo) {
            return res.status(404).json({
                message: 'Todo not found'
            });
        }

        res.json({
            message: 'Todo updated successfully',
            todo
        });

    } catch (error) {
        console.error('Update todo error:', error);
        res.status(500).json({
            message: 'Failed to update todo',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Toggle todo completion
router.patch('/:id/toggle', async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!todo) {
            return res.status(404).json({
                message: 'Todo not found'
            });
        }

        todo.completed = !todo.completed;
        await todo.save();

        res.json({
            message: `Todo marked as ${todo.completed ? 'completed' : 'active'}`,
            todo
        });

    } catch (error) {
        console.error('Toggle todo error:', error);
        res.status(500).json({
            message: 'Failed to toggle todo',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Delete todo
router.delete('/:id', async (req, res) => {
    try {
        const todo = await Todo.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!todo) {
            return res.status(404).json({
                message: 'Todo not found'
            });
        }

        res.json({
            message: 'Todo deleted successfully'
        });

    } catch (error) {
        console.error('Delete todo error:', error);
        res.status(500).json({
            message: 'Failed to delete todo',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Reset daily todos
router.post('/reset-daily', async (req, res) => {
    try {
        const result = await Todo.resetDailyTodos(req.user._id);
        
        res.json({
            message: 'Daily todos reset successfully',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Reset daily todos error:', error);
        res.status(500).json({
            message: 'Failed to reset daily todos',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Bulk operations
router.post('/bulk', [
    body('action').isIn(['delete', 'complete', 'uncomplete']).withMessage('Invalid bulk action'),
    body('ids').isArray({ min: 1 }).withMessage('IDs array is required'),
    body('ids.*').isMongoId().withMessage('Invalid todo ID')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { action, ids } = req.body;
        let result;

        switch (action) {
            case 'delete':
                result = await Todo.deleteMany({
                    _id: { $in: ids },
                    user: req.user._id
                });
                break;
            case 'complete':
                result = await Todo.updateMany(
                    { _id: { $in: ids }, user: req.user._id },
                    { completed: true, completedAt: new Date() }
                );
                break;
            case 'uncomplete':
                result = await Todo.updateMany(
                    { _id: { $in: ids }, user: req.user._id },
                    { completed: false, completedAt: null }
                );
                break;
        }

        res.json({
            message: `Bulk ${action} completed successfully`,
            modifiedCount: result.modifiedCount || result.deletedCount
        });

    } catch (error) {
        console.error('Bulk operation error:', error);
        res.status(500).json({
            message: 'Bulk operation failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
