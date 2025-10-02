// Simple Todo App - Working Version
console.log('🚀 Simple Todo App Loading...');

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Loaded - Initializing app...');
    
    // Initialize dark mode toggle
    initializeDarkMode();
    
    // Initialize authentication check
    checkAuthentication();
    
    // Initialize todo functionality
    initializeTodoApp();
    
    console.log('✅ App initialized successfully!');
});

// Dark Mode Functionality
function initializeDarkMode() {
    console.log('🌙 Initializing dark mode...');
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            console.log('🌙 Dark mode toggle clicked!');
            document.body.classList.toggle('dark-mode');
            
            // Save preference
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            // Update button icon
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            console.log('🌙 Dark mode:', isDark ? 'ON' : 'OFF');
        });
        
        // Load saved preference
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
        }
        
        console.log('✅ Dark mode initialized');
    } else {
        console.log('⚠️ Dark mode toggle not found');
    }
}

// Authentication Check
function checkAuthentication() {
    console.log('🔐 Checking authentication...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        console.log('✅ User is logged in');
        showUserInterface(JSON.parse(user));
        loadTodos();
    } else {
        console.log('❌ User not logged in');
        showLoginPrompt();
    }
}

// Show user interface
function showUserInterface(user) {
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-welcome">
                <span>Welcome, ${user.firstName || user.username}!</span>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
        `;
        userInfo.style.display = 'block';
    }
}

// Show login prompt
function showLoginPrompt() {
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-welcome">
                <a href="/login.html" style="color: #667eea; text-decoration: none;">Login</a>
                <span>|</span>
                <a href="/signup.html" style="color: #667eea; text-decoration: none;">Sign Up</a>
            </div>
        `;
        userInfo.style.display = 'block';
    }
}

// Logout function
function logout() {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// Initialize Todo App
function initializeTodoApp() {
    console.log('📝 Initializing todo functionality...');
    
    // Add todo form
    const addTodoForm = document.getElementById('addTodoForm');
    if (addTodoForm) {
        addTodoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTodo();
        });
    }
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            setFilter(filter);
        });
    });
    
    console.log('✅ Todo app initialized');
}

// Add Todo
async function addTodo() {
    const input = document.getElementById('todoInput');
    const prioritySelect = document.getElementById('prioritySelect');
    
    if (!input || !input.value.trim()) {
        alert('Please enter a todo item');
        return;
    }
    
    const todoData = {
        text: input.value.trim(),
        priority: prioritySelect ? prioritySelect.value : 'medium'
    };
    
    console.log('📝 Adding todo:', todoData);
    
    try {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(todoData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Todo added:', result);
            input.value = '';
            loadTodos();
        } else {
            const error = await response.json();
            console.error('❌ Error adding todo:', error);
            alert('Error adding todo: ' + error.message);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        alert('Network error. Please try again.');
    }
}

// Load Todos
async function loadTodos() {
    console.log('📋 Loading todos...');
    
    try {
        const response = await fetch('/api/todos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Todos loaded:', result);
            displayTodos(result.todos || []);
        } else {
            console.error('❌ Error loading todos');
        }
    } catch (error) {
        console.error('❌ Network error loading todos:', error);
    }
}

// Display Todos
function displayTodos(todos) {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;
    
    console.log('🎨 Displaying', todos.length, 'todos');
    
    if (todos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">No todos yet. Add one above!</div>';
        return;
    }
    
    todoList.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo._id}">
            <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo('${todo._id}')">
            <span class="todo-text">${todo.text}</span>
            <span class="todo-priority priority-${todo.priority}">${todo.priority}</span>
            <button class="delete-btn" onclick="deleteTodo('${todo._id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Toggle Todo
async function toggleTodo(todoId) {
    console.log('🔄 Toggling todo:', todoId);
    
    try {
        const response = await fetch(`/api/todos/${todoId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Todo toggled');
            loadTodos();
        } else {
            console.error('❌ Error toggling todo');
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Delete Todo
async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this todo?')) return;
    
    console.log('🗑️ Deleting todo:', todoId);
    
    try {
        const response = await fetch(`/api/todos/${todoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Todo deleted');
            loadTodos();
        } else {
            console.error('❌ Error deleting todo');
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Set Filter
function setFilter(filter) {
    console.log('🔍 Setting filter:', filter);
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Filter todos (simple client-side filtering for now)
    const todoItems = document.querySelectorAll('.todo-item');
    todoItems.forEach(item => {
        const isCompleted = item.classList.contains('completed');
        let show = true;
        
        if (filter === 'active') show = !isCompleted;
        if (filter === 'completed') show = isCompleted;
        
        item.style.display = show ? 'flex' : 'none';
    });
}

// Global functions for HTML onclick events
window.logout = logout;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.addTodo = addTodo;

console.log('📱 Simple Todo App script loaded successfully!');
