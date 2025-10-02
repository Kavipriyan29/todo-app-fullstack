// Local Todo App with Monthly Planner and Notifications

// App State
let todos = [];
let currentFilter = 'all';
let todoIdCounter = 1;
let monthlyNotes = {};
let currentMonth = new Date();
let reminderTimeouts = new Map(); // Store active reminder timeouts
let notificationsEnabled = false;

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

// Initialize app when page loads
window.addEventListener('load', function() {
    window.lastResetDate = new Date().toDateString();
    
    // Load dark mode preference
    loadDarkModePreference();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Load sample todos for demonstration
    todos = [
        { id: 1, text: "Complete the todo app project", completed: false, createdAt: new Date(), priority: 'high', isDaily: false },
        { id: 2, text: "Morning workout", completed: false, createdAt: new Date(), priority: 'high', isDaily: true },
        { id: 3, text: "Read for 30 minutes", completed: true, createdAt: new Date(), priority: 'medium', isDaily: true },
        { id: 4, text: "Check emails", completed: false, createdAt: new Date(), priority: 'medium', isDaily: true }
    ];
    todoIdCounter = 5;

    initializeMonthlyNotes(currentMonth);
    checkDailyReset();
    renderTodos();
    updateStats();
    setupEventListeners();
    setupReminderNotifications();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('todoInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTodo();
    });
    
    // Reminder checkbox toggle
    document.getElementById('setReminder').addEventListener('change', function(e) {
        const reminderTime = document.getElementById('reminderTime');
        if (e.target.checked) {
            reminderTime.style.display = 'inline-block';
            // Set default to 1 hour from now
            const now = new Date();
            now.setHours(now.getHours() + 1);
            reminderTime.value = now.toISOString().slice(0, 16);
        } else {
            reminderTime.style.display = 'none';
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

// Notification Functions
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationsEnabled = permission === 'granted';
        if (notificationsEnabled) {
            showNotification('🔔 Notifications enabled! You\'ll get reminders for your tasks.', 'success');
        }
    }
}

function scheduleReminder(todoId, reminderTime, todoText) {
    const now = new Date().getTime();
    const reminderTimestamp = new Date(reminderTime).getTime();
    const delay = reminderTimestamp - now;
    
    if (delay > 0) {
        const timeoutId = setTimeout(() => {
            showTaskReminder(todoText);
            reminderTimeouts.delete(todoId);
        }, delay);
        
        reminderTimeouts.set(todoId, timeoutId);
        
        const timeStr = new Date(reminderTime).toLocaleString();
        showNotification(`⏰ Reminder set for ${timeStr}`, 'info');
    }
}

function showTaskReminder(todoText) {
    // Browser notification
    if (notificationsEnabled) {
        new Notification('📋 Todo Reminder', {
            body: todoText,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>'
        });
    }
    
    // In-app notification
    showNotification(`🔔 Reminder: ${todoText}`, 'info');
    
    // Play notification sound (optional)
    playNotificationSound();
}

function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio notification not available');
    }
}

function cancelReminder(todoId) {
    if (reminderTimeouts.has(todoId)) {
        clearTimeout(reminderTimeouts.get(todoId));
        reminderTimeouts.delete(todoId);
    }
}

function setupReminderNotifications() {
    // Setup reminders for existing todos with reminder times
    todos.forEach(todo => {
        if (todo.reminderTime && !todo.completed) {
            scheduleReminder(todo.id, todo.reminderTime, todo.text);
        }
    });
}

// Monthly Planner Helpers
function monthKey(date) { 
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; 
}

function daysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayOfMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return d.getDay(); // 0=Sun .. 6=Sat
}

function monthLabel(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function initializeMonthlyNotes(date) {
    const key = monthKey(date);
    if (!monthlyNotes[key]) {
        monthlyNotes[key] = {};
        const dim = daysInMonth(date);
        for (let day = 1; day <= dim; day++) {
            monthlyNotes[key][day] = '';
        }
    }
}

function setDayNote(date, day, note) {
    const key = monthKey(date);
    initializeMonthlyNotes(date);
    monthlyNotes[key][day] = note;
}

function getDayNote(date, day) {
    const key = monthKey(date);
    initializeMonthlyNotes(date);
    return monthlyNotes[key][day] || '';
}

function clearDayNote(day) {
    setDayNote(currentMonth, day, '');
    const ta = document.getElementById(`day-note-${day}`);
    if (ta) ta.value = '';
    showNotification(`Cleared note for day ${day} ✨`, 'info');
    updateStats();
}

function clearAllMonthNotes() {
    if (!confirm('Clear all notes for this month?')) return;
    const key = monthKey(currentMonth);
    const dim = daysInMonth(currentMonth);
    monthlyNotes[key] = {};
    for (let d = 1; d <= dim; d++) monthlyNotes[key][d] = '';
    if (currentFilter === 'monthly') renderMonthlyPlanner();
    showNotification('All month notes cleared 🗑️', 'info');
    updateStats();
}

function goPrevMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    initializeMonthlyNotes(currentMonth);
    if (currentFilter === 'monthly') renderMonthlyPlanner();
    updateStats();
}

function goNextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    initializeMonthlyNotes(currentMonth);
    if (currentFilter === 'monthly') renderMonthlyPlanner();
    updateStats();
}

// Render Monthly Planner
function renderMonthlyPlanner() {
    const container = document.getElementById('todosContainer');
    initializeMonthlyNotes(currentMonth);

    const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dim = daysInMonth(currentMonth);
    const firstWd = firstWeekdayOfMonth(currentMonth); // leading blanks

    let html = `
        <div class="planner-header">
            <div class="planner-controls">
                <button class="planner-btn" onclick="goPrevMonth()">◀ Prev</button>
                <div class="planner-date">📅 ${monthLabel(currentMonth)}</div>
                <button class="planner-btn" onclick="goNextMonth()">Next ▶</button>
            </div>
            <button class="planner-btn" style="background:#e53e3e" onclick="clearAllMonthNotes()">Clear All</button>
        </div>
        <div class="monthly-planner">
            <div class="weekday-row">${weekdays.map(w=>`<div>${w}</div>`).join('')}</div>
            <div class="calendar-grid">
    `;

    // Leading inactive days
    for (let i = 0; i < firstWd; i++) {
        html += `<div class="day-cell inactive"></div>`;
    }

    // Days
    for (let day = 1; day <= dim; day++) {
        const note = getDayNote(currentMonth, day);
        html += `
            <div class="day-cell" id="day-${day}">
                <div class="day-header">
                    <div class="day-number">${day}</div>
                    <div class="note-indicator">${note.trim() ? '📝' : ''}</div>
                </div>
                <textarea 
                    class="day-textarea" 
                    id="day-note-${day}"
                    placeholder="Add note..."
                    rows="3"
                    oninput="setDayNote(currentMonth, ${day}, this.value);updateStats();"
                >${note}</textarea>
                <div class="day-actions">
                    <button class="clear-day-btn" onclick="clearDayNote(${day})" title="Clear note">Clear</button>
                </div>
            </div>
        `;
    }

    // Trailing to fill grid to complete weeks (optional)
    const totalCells = firstWd + dim;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < trailing; i++) {
        html += `<div class="day-cell inactive"></div>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;
}

// Todo Logic
function checkDailyReset() {
    const today = new Date().toDateString();
    if (!window.lastResetDate) { window.lastResetDate = today; return; }
    if (window.lastResetDate !== today) {
        const resetCount = todos.filter(todo => todo.isDaily && todo.completed).length;
        todos = todos.map(todo => todo.isDaily ? { ...todo, completed: false } : todo);
        window.lastResetDate = today;
        if (resetCount > 0) showNotification(`🌅 New day! ${resetCount} daily tasks reset and ready to go!`, 'info');
    }
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const isDailyCheckbox = document.getElementById('isDailyTask');
    const setReminderCheckbox = document.getElementById('setReminder');
    const reminderTimeInput = document.getElementById('reminderTime');
    
    const text = input.value.trim();
    if (text === '') { showNotification('Please enter a todo task!', 'error'); input.focus(); return; }
    if (text.length > 200) { showNotification('Todo text is too long! Maximum 200 characters.', 'error'); return; }
    
    const isDailyTask = isDailyCheckbox.checked;
    const hasReminder = setReminderCheckbox.checked;
    const reminderTime = hasReminder ? reminderTimeInput.value : null;
    
    // Validate reminder time
    if (hasReminder && reminderTime) {
        const reminderDate = new Date(reminderTime);
        const now = new Date();
        if (reminderDate <= now) {
            showNotification('⏰ Reminder time must be in the future!', 'error');
            return;
        }
    }
    
    const newTodo = { 
        id: todoIdCounter++, 
        text, 
        completed: false, 
        createdAt: new Date(), 
        priority: getRandomPriority(), 
        isDaily: isDailyTask,
        reminderTime: reminderTime
    };
    
    todos.unshift(newTodo);
    
    // Schedule reminder if set
    if (hasReminder && reminderTime) {
        scheduleReminder(newTodo.id, reminderTime, text);
    }
    
    // Reset form
    input.value = '';
    isDailyCheckbox.checked = false;
    setReminderCheckbox.checked = false;
    reminderTimeInput.style.display = 'none';
    reminderTimeInput.value = '';
    
    renderTodos();
    updateStats();
    
    let message = 'Todo added successfully! 🎉';
    if (isDailyTask) message = '📅 Daily task added! This will reset every day automatically!';
    if (hasReminder) message += ' Reminder set! 🔔';
    
    showNotification(message, 'success');
}

function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            const updated = { ...todo, completed: !todo.completed };
            
            // Cancel reminder if task is completed
            if (updated.completed) {
                cancelReminder(id);
            } else if (updated.reminderTime) {
                // Reschedule reminder if task is uncompleted and has reminder
                scheduleReminder(id, updated.reminderTime, updated.text);
            }
            
            showNotification(updated.completed ? (updated.isDaily ? 'Daily task completed! Great habit! ✅' : 'Great job! Task completed! ✅') : 'Task marked as active', updated.completed ? 'success' : 'info');
            return updated;
        }
        return todo;
    });
    renderTodos();
    updateStats();
}

function deleteTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo && confirm(`Are you sure you want to delete "${todo.text}"?`)) {
        // Cancel any active reminder
        cancelReminder(id);
        
        todos = todos.filter(t => t.id !== id);
        renderTodos();
        updateStats();
        showNotification('Todo deleted successfully', 'info');
    }
}

function filterTodos(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    renderTodos();
}

function getFilteredTodos() {
    switch(currentFilter) {
        case 'active': return todos.filter(todo => !todo.completed);
        case 'completed': return todos.filter(todo => todo.completed);
        case 'monthly': return []; // monthly planner view
        default: return todos;
    }
}

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
                <div class="todo-checkbox ${todo.completed ? 'completed' : ''}" onclick="toggleTodo(${todo.id})" title="Click to ${todo.completed ? 'mark as active' : 'complete'}"></div>
                <div class="todo-text ${todo.completed ? 'completed' : ''} ${dailyClass}">
                    ${dailyIndicator}${reminderIndicator}${escapeHtml(todo.text)}
                    ${todo.isDaily ? '<small style="color: #718096; display: block; font-size: 12px;">↻ Resets daily</small>' : ''}
                    ${reminderText}
                </div>
                <div class="priority-badge priority-${todo.priority}">${todo.priority}</div>
                <div class="todo-actions">
                    <button class="edit-btn" onclick="editTodo(${todo.id})" title="Edit todo">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteTodo(${todo.id})" title="Delete todo">🗑️ Delete</button>
                </div>
            `;
            container.appendChild(el);
        });
    }
}

function updateStats() {
    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.completed).length;
    const activeTodos = totalTodos - completedTodos;
    const dailyTodos = todos.filter(t => t.isDaily).length;

    const stats = document.getElementById('stats');
    if (currentFilter === 'monthly') {
        const key = monthKey(currentMonth);
        const dim = daysInMonth(currentMonth);
        const plannedDays = monthlyNotes[key] ? Object.values(monthlyNotes[key]).filter(v => (v || '').trim() !== '').length : 0;
        stats.innerHTML = `
            <div class="stats-item"><span class="stats-number">${plannedDays}</span> Days Planned</div>
            <div class="stats-item"><span class="stats-number">${dim - plannedDays}</span> Days Free</div>
            <div class="stats-item"><span class="stats-number">${Math.round((plannedDays/dim)*100)}%</span> Month Planned</div>
        `;
    } else {
        stats.innerHTML = `
            <div class="stats-item"><span class="stats-number">${totalTodos}</span> Total</div>
            <div class="stats-item"><span class="stats-number">${activeTodos}</span> Active</div>
            <div class="stats-item"><span class="stats-number">${completedTodos}</span> Completed</div>
            <div class="stats-item"><span class="stats-number">${dailyTodos}</span> Daily</div>
        `;
    }
}

// Utilities
function escapeHtml(text) { 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
}

function getRandomPriority() { 
    const p = ['low','medium','high']; 
    return p[Math.floor(Math.random()*p.length)]; 
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 8px; color: white; font-weight: 600; z-index: 1000; animation: slideInRight 0.3s ease; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);`;
    switch(type) {
        case 'success': notification.style.background = 'linear-gradient(135deg, #00b894, #00a085)'; break;
        case 'error': notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)'; break;
        default: notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => { if (document.body.contains(notification)) document.body.removeChild(notification); }, 300);
    }, 3000);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkBtn = document.querySelector('.dark-mode-toggle');
    const isDarkMode = document.body.classList.contains('dark-mode');
    darkBtn.innerHTML = isDarkMode ? '☀️' : '🌙';
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
}

// Load dark mode preference on page load
function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const darkBtn = document.querySelector('.dark-mode-toggle');
        if (darkBtn) darkBtn.innerHTML = '☀️';
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
            <button class="save-btn" onclick="saveTodoEdit(${id})" title="Save changes">✓ Save</button>
            <button class="cancel-btn" onclick="cancelTodoEdit(${id})" title="Cancel editing">✕ Cancel</button>
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

function saveTodoEdit(id) {
    const input = document.getElementById(`edit-input-${id}`);
    const newText = input.value.trim();
    
    if (newText === '') {
        showNotification('Todo text cannot be empty!', 'error');
        input.focus();
        return;
    }
    
    // Update the todo
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
}

function cancelTodoEdit(id) {
    // Simply re-render to exit edit mode without saving
    renderTodos();
}
