const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Todo text is required'],
        trim: true,
        maxlength: [200, 'Todo text cannot exceed 200 characters']
    },
    completed: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    isDaily: {
        type: Boolean,
        default: false
    },
    reminderTime: {
        type: Date,
        default: null
    },
    category: {
        type: String,
        trim: true,
        maxlength: [50, 'Category cannot exceed 50 characters'],
        default: 'general'
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completedAt: {
        type: Date,
        default: null
    },
    dueDate: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        default: ''
    }
}, {
    timestamps: true
});

// Indexes for better query performance
todoSchema.index({ user: 1, createdAt: -1 });
todoSchema.index({ user: 1, completed: 1 });
todoSchema.index({ user: 1, priority: 1 });
todoSchema.index({ user: 1, isDaily: 1 });
todoSchema.index({ reminderTime: 1 });

// Update completedAt when todo is marked as completed
todoSchema.pre('save', function(next) {
    if (this.isModified('completed')) {
        if (this.completed) {
            this.completedAt = new Date();
        } else {
            this.completedAt = null;
        }
    }
    next();
});

// Virtual for overdue status
todoSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate || this.completed) return false;
    return new Date() > this.dueDate;
});

// Static method to get user's todos with filters
todoSchema.statics.getUserTodos = function(userId, filters = {}) {
    const query = { user: userId };
    
    if (filters.completed !== undefined) {
        query.completed = filters.completed;
    }
    
    if (filters.priority) {
        query.priority = filters.priority;
    }
    
    if (filters.isDaily !== undefined) {
        query.isDaily = filters.isDaily;
    }
    
    if (filters.category) {
        query.category = filters.category;
    }
    
    return this.find(query).sort({ createdAt: -1 });
};

// Method to reset daily todos
todoSchema.statics.resetDailyTodos = async function(userId) {
    return this.updateMany(
        { user: userId, isDaily: true, completed: true },
        { completed: false, completedAt: null }
    );
};

module.exports = mongoose.model('Todo', todoSchema);
