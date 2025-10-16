// DOM Elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const tasksList = document.getElementById('tasksList');
const storedTasksList = document.getElementById('storedTasksList');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompleted');
const completeSelectedBtn = document.getElementById('completeSelected');
const deleteSelectedBtn = document.getElementById('deleteSelected');
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const completedTasksEl = document.getElementById('completedTasks');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let selectedTaskId = null;

// Initialize the app
function init() {
    renderTasks();
    renderStoredTasks();
    updateStats();
    
    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    completeSelectedBtn.addEventListener('click', completeSelectedTask);
    deleteSelectedBtn.addEventListener('click', deleteSelectedTask);
    
    // Event delegation for task actions
    tasksList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            deleteTask(taskId);
        } else if (e.target.classList.contains('task-checkbox')) {
            toggleTaskCompletion(taskId);
        }
    });
    
    // Event delegation for stored tasks selection
    storedTasksList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.stored-task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        selectStoredTask(taskId);
    });
}

// Add a new task
function addTask() {
    const text = taskInput.value.trim();
    
    if (text === '') {
        taskInput.classList.add('shake');
        setTimeout(() => taskInput.classList.remove('shake'), 500);
        return;
    }
    
    const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    renderStoredTasks();
    updateStats();
    
    // Reset input
    taskInput.value = '';
    taskInput.focus();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    if (selectedTaskId === id) selectedTaskId = null;
    saveTasks();
    renderTasks();
    renderStoredTasks();
    updateStats();
}

// Toggle task completion
function toggleTaskCompletion(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    renderStoredTasks();
    updateStats();
}

// Clear completed tasks
function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    if (selectedTaskId && tasks.find(t => t.id === selectedTaskId)?.completed) {
        selectedTaskId = null;
    }
    saveTasks();
    renderTasks();
    renderStoredTasks();
    updateStats();
}

// Select a stored task
function selectStoredTask(id) {
    selectedTaskId = id;
    renderStoredTasks();
}

// Complete selected task
function completeSelectedTask() {
    if (!selectedTaskId) {
        alert('Please select a task first!');
        return;
    }
    
    toggleTaskCompletion(selectedTaskId);
    selectedTaskId = null;
    renderStoredTasks();
}

// Delete selected task
function deleteSelectedTask() {
    if (!selectedTaskId) {
        alert('Please select a task first!');
        return;
    }
    
    deleteTask(selectedTaskId);
}

// Filter tasks based on current filter
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// Render tasks to the DOM
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3>No ${currentFilter !== 'all' ? currentFilter : ''} tasks</h3>
                <p>${currentFilter === 'completed' ? 'Complete some tasks to see them here!' : 'Add a task to get started!'}</p>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-date">Created: ${task.createdAt}</div>
            </div>
            <div class="task-actions">
                <button class="action-btn delete-btn" title="Delete task">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Render stored tasks to the DOM
function renderStoredTasks() {
    if (tasks.length === 0) {
        storedTasksList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-archive"></i>
                </div>
                <h3>No stored tasks</h3>
                <p>Tasks you add will appear here</p>
            </div>
        `;
        return;
    }
    
    storedTasksList.innerHTML = tasks.map(task => `
        <div class="stored-task-item ${selectedTaskId === task.id ? 'selected' : ''} ${task.completed ? 'task-completed' : ''}" data-id="${task.id}">
            <div class="stored-task-text">${task.text}</div>
            <div class="stored-task-date">${task.createdAt}</div>
            <div class="stored-task-actions">
                <div class="action-icon" style="color: ${task.completed ? 'var(--success)' : 'var(--warning)'};">
                    <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-clock'}"></i>
                </div>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;
    
    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;
}

// Save tasks to localStorage
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error('Failed to save tasks to localStorage:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Storage limit exceeded. Some tasks may not be saved.');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);