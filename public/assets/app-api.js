// Full-stack Todo App with Authentication and API Integration

// App State
let todos = [];
let currentFilter = 'all';
let todoIdCounter = 1;
let monthlyNotes = {};
let currentMonth = new Date();
let reminderTimeouts = new Map();
let notificationsEnabled = false;
let currentUser = null;
let authToken = null;

// API Configuration
const API_BASE = '/api';

// Authentication utilities
function getAuthToken() {
    return localStorage.getItem('token');
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    authToken = token;
    currentUser = user;
}

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                clearAuthData();
                window.location.href = '/login.html';
                return;
            }
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message || 'Network error occurred', 'error');
        throw error;
    }
}

// Make functions global for HTML onclick handlers
window.addTodo = addTodo;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.filterTodos = filterTodos;
window.setDayNote = setDayNote;
window.clearDayNote = clearDayNote;
window.clearAllMonthNotes = clearAllMonthNotes;
window.goPrevMonth = goPrevMonth;
window.goNextMonth = goNextMonth;
window.toggleDarkMode = toggleDarkMode;
window.editTodo = editTodo;
window.saveTodoEdit = saveTodoEdit;
window.cancelTodoEdit = cancelTodoEdit;
window.logout = logout;

// Initialize app when page loads
window.addEventListener('load', function() {
    // Check authentication
    checkAuthStatus();
    
    // Load dark mode preference
    loadDarkModePreference();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Initialize app
    initializeApp();
});

// Check authentication status
async function checkAuthStatus() {
    const token = getAuthToken();
    const user = getCurrentUser();

    if (!token || !user) {
        window.location.href = '/login.html';
        return false;
    }

    try {
        // Verify token with server
        const response = await apiRequest('/auth/verify');
        if (response.valid) {
            authToken = token;
            currentUser = user;
            updateUserUI();
            return true;
        }
    } catch (error) {
        clearAuthData();
        window.location.href = '/login.html';
        return false;
    }
}

// Initialize the app
async function initializeApp() {
    window.lastResetDate = new Date().toDateString();
    
    // Load todos from server
    await loadTodosFromServer();
    
    // Initialize monthly notes
    initializeMonthlyNotes(currentMonth);
    
    // Check daily reset
    checkDailyReset();
    
    // Render todos and update stats
    renderTodos();
    updateStats();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup reminder notifications
    setupReminderNotifications();
}

// Update user interface with user info
function updateUserUI() {
    if (currentUser) {
        // Add user info to header
        const header = document.querySelector('.app-header');
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <div class="user-welcome">
                <span>Welcome back, ${currentUser.firstName || currentUser.username}!</span>
                <button class="logout-btn" onclick="logout()" title="Logout">🚪 Logout</button>
            </div>
        `;
        header.appendChild(userInfo);
        
        // Apply user preferences
        if (currentUser.preferences && currentUser.preferences.darkMode) {
            document.body.classList.add('dark-mode');
            const darkBtn = document.querySelector('.dark-mode-toggle');
            if (darkBtn) darkBtn.innerHTML = '☀️';
        }
    }
}

// Load todos from server
async function loadTodosFromServer() {
    try {
        const response = await apiRequest('/todos');
        todos = response.todos.map(todo => ({
            id: todo._id,
            text: todo.text,
            completed: todo.completed,
            priority: todo.priority,
            isDaily: todo.isDaily,
            reminderTime: todo.reminderTime,
            createdAt: new Date(todo.createdAt),
            category: todo.category || 'general',
            notes: todo.notes || ''
        }));
        
        // Update counter for new todos
        todoIdCounter = Math.max(...todos.map(t => parseInt(t.id.slice(-6), 16)), 0) + 1;
    } catch (error) {
        console.error('Failed to load todos:', error);
        todos = [];
    }
}

// Add todo to server
async function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (!text) {
        showNotification('Please enter a todo item!', 'error');
        return;
    }

    const isDailyTask = document.getElementById('isDailyTask').checked;
    const setReminder = document.getElementById('setReminder').checked;
    const reminderTime = document.getElementById('reminderTime').value;

    if (setReminder && !reminderTime) {
        showNotification('Please select a reminder time!', 'error');
        return;
    }

    try {
        const todoData = {
            text: text,
            priority: 'medium', // Default priority
            isDaily: isDailyTask,
            reminderTime: setReminder ? new Date(reminderTime).toISOString() : null
        };

        const response = await apiRequest('/todos', {
            method: 'POST',
            body: JSON.stringify(todoData)
        });

        // Add to local todos array
        const newTodo = {
            id: response.todo._id,
            text: response.todo.text,
            completed: false,
            priority: response.todo.priority,
            isDaily: response.todo.isDaily,
            reminderTime: response.todo.reminderTime,
            createdAt: new Date(response.todo.createdAt)
        };

        todos.unshift(newTodo);

        // Clear form
        input.value = '';
        document.getElementById('isDailyTask').checked = false;
        document.getElementById('setReminder').checked = false;
        const reminderTimeInput = document.getElementById('reminderTime');
        reminderTimeInput.style.display = 'none';
        reminderTimeInput.value = '';

        renderTodos();
        updateStats();

        let message = 'Todo added successfully! 🎉';
        if (setReminder) {
            message += ' Reminder set!';
            scheduleReminder(newTodo.id, newTodo.text, new Date(reminderTime));
        }
        showNotification(message, 'success');

    } catch (error) {
        console.error('Failed to add todo:', error);
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    try {
        const response = await apiRequest(`/todos/${id}/toggle`, {
            method: 'PATCH'
        });

        // Update local todo
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: response.todo.completed };
            }
            return todo;
        });

        renderTodos();
        updateStats();
        
        const todo = todos.find(t => t.id === id);
        const message = todo.completed ? 'Todo completed! 🎉' : 'Todo marked as active';
        showNotification(message, 'success');

    } catch (error) {
        console.error('Failed to toggle todo:', error);
    }
}

// Delete todo
async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        await apiRequest(`/todos/${id}`, {
            method: 'DELETE'
        });

        // Cancel reminder if exists
        cancelReminder(id);
        
        // Remove from local array
        todos = todos.filter(t => t.id !== id);
        
        renderTodos();
        updateStats();
        showNotification('Todo deleted successfully', 'info');

    } catch (error) {
        console.error('Failed to delete todo:', error);
    }
}

// Edit todo functionality
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    // Find the todo item element
    const todoItems = document.querySelectorAll('.todo-item');
    let todoElement = null;
    
    todoItems.forEach(item => {
        const editBtn = item.querySelector('.edit-btn');
        if (editBtn && editBtn.getAttribute('onclick').includes(id.toString())) {
            todoElement = item;
        }
    });
    
    if (!todoElement) return;
    
    // Add editing class for highlight effect
    todoElement.classList.add('editing');
    
    // Get current todo text
    const todoTextElement = todoElement.querySelector('.todo-text');
    const currentText = todo.text;
    
    // Replace todo text with input field
    const dailyIndicator = todo.isDaily ? '🔄 ' : '';
    const reminderIndicator = todo.reminderTime && !todo.completed ? '🔔 ' : '';
    const reminderText = todo.reminderTime && !todo.completed ? 
        `<small style="color: #667eea; display: block; font-size: 12px;">🔔 Reminder: ${new Date(todo.reminderTime).toLocaleString()}</small>` : '';
    
    todoTextElement.innerHTML = `
        <input type="text" class="todo-edit-input" value="${escapeHtml(currentText)}" maxlength="200" id="edit-input-${id}">
        ${todo.isDaily ? '<small style="color: #718096; display: block; font-size: 12px;">↻ Resets daily</small>' : ''}
        ${reminderText}
    `;
    
    // Replace action buttons with save/cancel
    const actionsElement = todoElement.querySelector('.todo-actions');
    actionsElement.innerHTML = `
        <div class="edit-actions">
            <button class="save-btn" onclick="saveTodoEdit('${id}')" title="Save changes">✓ Save</button>
            <button class="cancel-btn" onclick="cancelTodoEdit('${id}')" title="Cancel editing">✕ Cancel</button>
        </div>
    `;
    
    // Focus the input and select text
    const input = document.getElementById(`edit-input-${id}`);
    input.focus();
    input.select();
    
    // Handle Enter key to save
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveTodoEdit(id);
        } else if (e.key === 'Escape') {
            cancelTodoEdit(id);
        }
    });
}

// Save todo edit
async function saveTodoEdit(id) {
    const input = document.getElementById(`edit-input-${id}`);
    const newText = input.value.trim();
    
    if (newText === '') {
        showNotification('Todo text cannot be empty!', 'error');
        input.focus();
        return;
    }
    
    try {
        const response = await apiRequest(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ text: newText })
        });

        // Update local todo
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, text: newText };
            }
            return todo;
        });
        
        // Re-render todos to exit edit mode
        renderTodos();
        updateStats();
        showNotification('Todo updated successfully! ✏️', 'success');

    } catch (error) {
        console.error('Failed to update todo:', error);
        // Re-render to exit edit mode even on error
        renderTodos();
    }
}

// Cancel todo edit
function cancelTodoEdit(id) {
    // Simply re-render to exit edit mode without saving
    renderTodos();
}

// Logout function
async function logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error);
    }

    clearAuthData();
    showNotification('Logged out successfully', 'info');
    
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 1000);
}

// Filter todos
function filterTodos(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    renderTodos();
}

// Get filtered todos
function getFilteredTodos() {
    switch(currentFilter) {
        case 'active': return todos.filter(todo => !todo.completed);
        case 'completed': return todos.filter(todo => todo.completed);
        default: return todos;
    }
}

// Render todos (keeping the existing render logic but with API integration)
function renderTodos() {
    const container = document.getElementById('todosContainer');
    if (currentFilter === 'monthly') { renderMonthlyPlanner(); return; }
    const filteredTodos = getFilteredTodos();
    container.innerHTML = '';
    if (filteredTodos.length === 0) {
        let emptyMessage = '';
        let emptyIcon = '📝';
        let emptyTitle = 'No tasks yet';
        switch(currentFilter) {
            case 'active': emptyMessage = 'No active todos! Great job! 🎉'; emptyIcon = '🎉'; emptyTitle = 'All caught up!'; break;
            case 'completed': emptyMessage = 'No completed todos yet. Start checking off some tasks!'; break;
            default: emptyMessage = 'No todos yet. Add one above to get started!';
        }
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${emptyIcon}</div>
                <h3>${emptyTitle}</h3>
                <p>${emptyMessage}</p>
            </div>
        `;
    } else {
        filteredTodos.forEach(todo => {
            const el = document.createElement('div');
            el.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            const dailyIndicator = todo.isDaily ? '🔄 ' : '';
            const dailyClass = todo.isDaily ? 'daily-task' : '';
            const reminderIndicator = todo.reminderTime && !todo.completed ? '🔔 ' : '';
            const reminderText = todo.reminderTime && !todo.completed ? 
                `<small style="color: #667eea; display: block; font-size: 12px;">🔔 Reminder: ${new Date(todo.reminderTime).toLocaleString()}</small>` : '';
            
            el.innerHTML = `
                <div class="todo-checkbox ${todo.completed ? 'completed' : ''}" onclick="toggleTodo('${todo.id}')" title="Click to ${todo.completed ? 'mark as active' : 'complete'}"></div>
                <div class="todo-text ${todo.completed ? 'completed' : ''} ${dailyClass}">
                    ${dailyIndicator}${reminderIndicator}${escapeHtml(todo.text)}
                    ${todo.isDaily ? '<small style="color: #718096; display: block; font-size: 12px;">↻ Resets daily</small>' : ''}
                    ${reminderText}
                </div>
                <div class="priority-badge priority-${todo.priority}">${todo.priority}</div>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="editTodo('${todo.id}')" title="Edit todo">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteTodo('${todo.id}')" title="Delete todo">🗑️ Delete</button>
                </div>
            `;
            container.appendChild(el);
        });
    }
}

// Update statistics
function updateStats() {
    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.completed).length;
    const activeTodos = totalTodos - completedTodos;
    
    const statsElements = document.querySelectorAll('.stats-number');
    if (statsElements.length >= 3) {
        statsElements[0].textContent = totalTodos;
        statsElements[1].textContent = activeTodos;
        statsElements[2].textContent = completedTodos;
    }
}

// Keep all existing utility functions (setupEventListeners, notifications, etc.)
// ... (keeping the rest of the original app.js functionality)

// Setup event listeners
function setupEventListeners() {
    document.getElementById('todoInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTodo();
    });

    document.getElementById('setReminder').addEventListener('change', function(e) {
        const reminderTimeInput = document.getElementById('reminderTime');
        reminderTimeInput.style.display = e.target.checked ? 'inline-block' : 'none';
        if (e.target.checked) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            reminderTimeInput.value = now.toISOString().slice(0, 16);
        }
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            checkDailyReset();
            renderTodos();
            updateStats();
        }
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            notificationsEnabled = permission === 'granted';
        });
    } else {
        notificationsEnabled = Notification.permission === 'granted';
    }
}

function scheduleReminder(todoId, todoText, reminderTime) {
    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    if (timeUntilReminder > 0) {
        const timeoutId = setTimeout(() => {
            if (notificationsEnabled) {
                new Notification('Todo Reminder', {
                    body: todoText,
                    icon: '/favicon.ico'
                });
            }
            showNotification(`Reminder: ${todoText}`, 'info');
            reminderTimeouts.delete(todoId);
        }, timeUntilReminder);
        
        reminderTimeouts.set(todoId, timeoutId);
    }
}

function cancelReminder(todoId) {
    if (reminderTimeouts.has(todoId)) {
        clearTimeout(reminderTimeouts.get(todoId));
        reminderTimeouts.delete(todoId);
    }
}

function setupReminderNotifications() {
    todos.forEach(todo => {
        if (todo.reminderTime && !todo.completed) {
            scheduleReminder(todo.id, todo.text, new Date(todo.reminderTime));
        }
    });
}

function checkDailyReset() {
    const today = new Date().toDateString();
    if (window.lastResetDate !== today) {
        // Reset daily todos would need API call
        window.lastResetDate = today;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        padding: 15px 20px; border-radius: 8px; color: white; font-weight: 500;
        animation: slideInRight 0.3s ease; max-width: 300px;
        background: ${type === 'error' ? '#e53e3e' : type === 'success' ? '#38a169' : '#667eea'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => { if (document.body.contains(notification)) document.body.removeChild(notification); }, 300);
    }, 3000);
}

// Dark mode functions
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkBtn = document.querySelector('.dark-mode-toggle');
    const isDarkMode = document.body.classList.contains('dark-mode');
    darkBtn.innerHTML = isDarkMode ? '☀️' : '🌙';
    
    // Save preference to localStorage and server
    localStorage.setItem('darkMode', isDarkMode);
    
    // Update user preferences on server
    if (currentUser) {
        apiRequest('/users/preferences', {
            method: 'PUT',
            body: JSON.stringify({ darkMode: isDarkMode })
        }).catch(error => console.error('Failed to save dark mode preference:', error));
    }
}

function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const darkBtn = document.querySelector('.dark-mode-toggle');
        if (darkBtn) darkBtn.innerHTML = '☀️';
    }
}

// Monthly planner functions (keeping existing functionality)
function initializeMonthlyNotes(month) {
    const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
    if (!monthlyNotes[monthKey]) {
        monthlyNotes[monthKey] = {};
    }
}

function renderMonthlyPlanner() {
    // Keep existing monthly planner code
    const container = document.getElementById('todosContainer');
    container.innerHTML = `
        <div class="planner-header">
            <div class="planner-controls">
                <button class="planner-btn" onclick="goPrevMonth()">‹ Previous</button>
                <span class="planner-date">${currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button class="planner-btn" onclick="goNextMonth()">Next ›</button>
            </div>
            <button class="planner-btn" onclick="clearAllMonthNotes()" style="background: #e53e3e;">Clear All Notes</button>
        </div>
        <div class="monthly-planner">
            <div class="weekday-row">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div class="calendar-grid" id="calendarGrid"></div>
        </div>
    `;
    
    renderCalendarGrid();
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthKey = `${year}-${month}`;
    
    grid.innerHTML = '';
    
    // Previous month's trailing days
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell inactive';
        grid.appendChild(cell);
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        const dayKey = `${year}-${month}-${day}`;
        const note = monthlyNotes[monthKey] && monthlyNotes[monthKey][day] || '';
        
        cell.innerHTML = `
            <div class="day-header">
                <span class="day-number">${day}</span>
                ${note ? '<span class="note-indicator">📝</span>' : ''}
            </div>
            <textarea class="day-textarea" placeholder="Add note..." onchange="setDayNote(${day}, this.value)">${note}</textarea>
            <div class="day-actions">
                <button class="clear-day-btn" onclick="clearDayNote(${day})" title="Clear note">Clear</button>
            </div>
        `;
        grid.appendChild(cell);
    }
}

function setDayNote(day, note) {
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    if (!monthlyNotes[monthKey]) monthlyNotes[monthKey] = {};
    monthlyNotes[monthKey][day] = note;
    localStorage.setItem('monthlyNotes', JSON.stringify(monthlyNotes));
}

function clearDayNote(day) {
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    if (monthlyNotes[monthKey]) {
        delete monthlyNotes[monthKey][day];
        localStorage.setItem('monthlyNotes', JSON.stringify(monthlyNotes));
        renderCalendarGrid();
    }
}

function clearAllMonthNotes() {
    if (confirm('Clear all notes for this month?')) {
        const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
        monthlyNotes[monthKey] = {};
        localStorage.setItem('monthlyNotes', JSON.stringify(monthlyNotes));
        renderCalendarGrid();
    }
}

function goPrevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    initializeMonthlyNotes(currentMonth);
    renderMonthlyPlanner();
}

function goNextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    initializeMonthlyNotes(currentMonth);
    renderMonthlyPlanner();
}
