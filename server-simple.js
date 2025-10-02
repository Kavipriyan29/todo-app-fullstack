const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for demo (replace with database later)
let users = [];
let todos = [];
let userIdCounter = 1;
let todoIdCounter = 1;

// Simple authentication middleware
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    // Simple token validation (in production, use proper JWT)
    const user = users.find(u => u.token === token);
    if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = user;
    next();
};

// Auth routes
app.post('/api/auth/register', (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if user exists
    if (users.find(u => u.email === email || u.username === username)) {
        return res.status(409).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = {
        id: userIdCounter++,
        username,
        email,
        password, // In production, hash this!
        firstName,
        lastName,
        token: `token_${userIdCounter}_${Date.now()}`,
        preferences: { darkMode: false, notifications: true }
    };
    
    users.push(user);
    
    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            preferences: user.preferences
        },
        token: user.token
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            preferences: user.preferences
        },
        token: user.token
    });
});

app.get('/api/auth/verify', authenticateUser, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email
        }
    });
});

app.post('/api/auth/logout', authenticateUser, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Todo routes
app.get('/api/todos', authenticateUser, (req, res) => {
    const userTodos = todos.filter(t => t.userId === req.user.id);
    res.json({ todos: userTodos });
});

app.post('/api/todos', authenticateUser, (req, res) => {
    const { text, priority = 'medium', isDaily = false, reminderTime } = req.body;
    
    const todo = {
        _id: `todo_${todoIdCounter++}`,
        text,
        completed: false,
        priority,
        isDaily,
        reminderTime,
        userId: req.user.id,
        createdAt: new Date().toISOString()
    };
    
    todos.push(todo);
    
    res.status(201).json({
        message: 'Todo created successfully',
        todo
    });
});

app.patch('/api/todos/:id/toggle', authenticateUser, (req, res) => {
    const todo = todos.find(t => t._id === req.params.id && t.userId === req.user.id);
    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    
    todo.completed = !todo.completed;
    
    res.json({
        message: `Todo marked as ${todo.completed ? 'completed' : 'active'}`,
        todo
    });
});

app.put('/api/todos/:id', authenticateUser, (req, res) => {
    const todo = todos.find(t => t._id === req.params.id && t.userId === req.user.id);
    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    
    const { text } = req.body;
    if (text) todo.text = text;
    
    res.json({
        message: 'Todo updated successfully',
        todo
    });
});

app.delete('/api/todos/:id', authenticateUser, (req, res) => {
    const todoIndex = todos.findIndex(t => t._id === req.params.id && t.userId === req.user.id);
    if (todoIndex === -1) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    
    todos.splice(todoIndex, 1);
    
    res.json({ message: 'Todo deleted successfully' });
});

// User preferences
app.put('/api/users/preferences', authenticateUser, (req, res) => {
    const { darkMode, notifications } = req.body;
    
    if (darkMode !== undefined) req.user.preferences.darkMode = darkMode;
    if (notifications !== undefined) req.user.preferences.notifications = notifications;
    
    res.json({
        message: 'Preferences updated successfully',
        preferences: req.user.preferences
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        users: users.length,
        todos: todos.length
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`🔐 Login: http://localhost:${PORT}/login.html`);
    console.log(`📝 Signup: http://localhost:${PORT}/signup.html`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
