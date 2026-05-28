import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Award,
  Edit2,
  X,
  RefreshCw,
  FolderOpen,
  User,
  Shield,
  Users,
  LogOut,
  UserPlus,
  LogIn,
  BookOpen
} from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

function App() {
  // --- AUTHENTICATION STATE ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('task_manager_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Auth Inputs
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('student');

  // --- APPLICATION STATES ---
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]); // List of students for Admin dropdown
  
  // Form fields for Task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('student'); // Assigned student username

  // Editing State
  const [editTaskId, setEditTaskId] = useState(null);

  // Admin Student Management State
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'students'
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentUsernameInput, setStudentUsernameInput] = useState('');
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [editStudentId, setEditStudentId] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Task Category, Subtasks, and Comments states
  const [categoryInput, setCategoryInput] = useState('General');
  const [tempSubtasks, setTempSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [expandedCommentsTaskId, setExpandedCommentsTaskId] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  
  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [sortOption, setSortOption] = useState('newest'); 
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Fetch student accounts (Admin only)
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/students`);
      setStudents(res.data);
      // Default task assignment to first student if available
      if (res.data.length > 0 && assignedTo === 'student') {
        setAssignedTo(res.data[0].username);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  // Fetch tasks filtered by role
  const fetchTasks = async (showToast = false) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/tasks?username=${currentUser.username}&role=${currentUser.role}`
      );
      setTasks(res.data);
      if (showToast) {
        showToastNotification('Data updated in real-time!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToastNotification('Failed to fetch tasks from SQLite.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load context on login / state refresh
  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      if (currentUser.role === 'admin') {
        fetchStudents();
      } else {
        setAssignedTo(currentUser.username); // Student tasks assign to themselves
      }
    }
  }, [currentUser]);

  // Toast notifier utility
  const showToastNotification = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // --- STUDENT CRUD ACTIONS ---
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentNameInput.trim() || !studentUsernameInput.trim()) {
      showToastNotification('Name and Username are required!', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: studentNameInput.trim(),
        username: studentUsernameInput.trim().toLowerCase(),
      };

      if (editStudentId) {
        // Edit student
        if (studentPasswordInput) {
          payload.password = studentPasswordInput;
        }
        await axios.put(`${API_BASE_URL}/students/${editStudentId}`, payload);
        showToastNotification('Student details updated successfully!', 'success');
        setEditStudentId(null);
      } else {
        // Add student (uses register endpoint with role = 'student')
        if (!studentPasswordInput) {
          showToastNotification('Password is required for new students!', 'error');
          setLoading(false);
          return;
        }
        payload.password = studentPasswordInput;
        payload.role = 'student';
        await axios.post(`${API_BASE_URL}/register`, payload);
        showToastNotification(`Student account @${payload.username} created!`, 'success');
      }

      // Reset fields
      setStudentNameInput('');
      setStudentUsernameInput('');
      setStudentPasswordInput('');
      
      // Refresh students list and task listings
      await fetchStudents();
      await fetchTasks();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to process student account.';
      showToastNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startStudentEdit = (student) => {
    setEditStudentId(student.id);
    setStudentNameInput(student.name);
    setStudentUsernameInput(student.username);
    setStudentPasswordInput(''); // Keep blank unless updating password
    showToastNotification(`Editing details for @${student.username}`, 'success');
  };

  const cancelStudentEdit = () => {
    setEditStudentId(null);
    setStudentNameInput('');
    setStudentUsernameInput('');
    setStudentPasswordInput('');
    showToastNotification('Student edit cancelled', 'success');
  };

  const deleteStudent = async (studentId, username) => {
    if (!window.confirm(`Are you sure you want to delete student @${username}? This will also permanently delete all tasks assigned to them.`)) return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/students/${studentId}`);
      showToastNotification(`Student @${username} deleted successfully.`, 'success');
      
      if (editStudentId === studentId) {
        cancelStudentEdit();
      }
      
      // Refresh database records
      await fetchStudents();
      await fetchTasks();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to delete student.';
      showToastNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- AUTH ACTIONS ---
  
  // Click handler to auto fill demo logins (great for viva examiners)
  const handleQuickFill = (role) => {
    if (role === 'admin') {
      setUsernameInput('admin');
      setPasswordInput('admin123');
      setAuthMode('login');
      showToastNotification('Autofilled Instructor Credentials', 'success');
    } else {
      setUsernameInput('student');
      setPasswordInput('student123');
      setAuthMode('login');
      showToastNotification('Autofilled Student Credentials', 'success');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput) {
      showToastNotification('Username and Password are required!', 'error');
      return;
    }

    try {
      setLoading(true);
      if (authMode === 'login') {
        // Login API Call
        const res = await axios.post(`${API_BASE_URL}/login`, {
          username: usernameInput.trim(),
          password: passwordInput
        });
        
        const user = res.data.user;
        localStorage.setItem('task_manager_user', JSON.stringify(user));
        setCurrentUser(user);
        showToastNotification(`Welcome back, ${user.name}! 👋`, 'success');
        
        // Reset forms
        setUsernameInput('');
        setPasswordInput('');
      } else {
        // Register Student API Call
        if (!nameInput.trim()) {
          showToastNotification('Name is required for registration!', 'error');
          return;
        }
        
        await axios.post(`${API_BASE_URL}/register`, {
          username: usernameInput.trim().toLowerCase(),
          password: passwordInput,
          name: nameInput.trim(),
          role: roleInput
        });
        
        showToastNotification('Account created successfully! Please Login.', 'success');
        setAuthMode('login');
        setNameInput('');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Authentication failed. Please try again.';
      showToastNotification(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('task_manager_user');
    setCurrentUser(null);
    setTasks([]);
    setStudents([]);
    setEditTaskId(null);
    setActiveTab('tasks');
    setStudentNameInput('');
    setStudentUsernameInput('');
    setStudentPasswordInput('');
    setEditStudentId(null);
    setStudentSearchQuery('');
    showToastNotification('Logged out successfully. See you soon!', 'success');
  };

  // --- CRUD ACTIONS ---

  // State to hold comments during edit
  const [editingTaskComments, setEditingTaskComments] = useState([]);

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToastNotification('Task title is required!', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate,
        assigned_to: currentUser.role === 'admin' ? assignedTo : currentUser.username,
        created_by: currentUser.username,
        category: categoryInput,
        subtasks: JSON.stringify(tempSubtasks),
        comments: JSON.stringify(editTaskId ? editingTaskComments : [])
      };

      if (editTaskId) {
        // Edit existing
        await axios.put(`${API_BASE_URL}/tasks/${editTaskId}`, payload);
        showToastNotification('Task details modified!', 'success');
        setEditTaskId(null);
        setEditingTaskComments([]);
      } else {
        // Add new
        await axios.post(`${API_BASE_URL}/tasks`, payload);
        showToastNotification(`Task created and assigned successfully!`, 'success');
      }

      // Reset fields
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setCategoryInput('General');
      setTempSubtasks([]);
      setNewSubtaskText('');
      
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToastNotification('Failed to process task.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (task) => {
    setEditTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setDueDate(task.due_date || '');
    setAssignedTo(task.assigned_to || 'student');
    setCategoryInput(task.category || 'General');
    setTempSubtasks(JSON.parse(task.subtasks || '[]'));
    setEditingTaskComments(JSON.parse(task.comments || '[]'));
    showToastNotification('Loading details into edit mode...', 'success');
  };

  const cancelEdit = () => {
    setEditTaskId(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setCategoryInput('General');
    setTempSubtasks([]);
    setEditingTaskComments([]);
    if (currentUser.role === 'admin' && students.length > 0) {
      setAssignedTo(students[0].username);
    } else {
      setAssignedTo(currentUser.username);
    }
    showToastNotification('Editing cancelled', 'success');
  };

  // --- SUBTASKS AND COMMENTS DYNAMIC HANDLERS ---
  const handleToggleSubtask = async (task, subtaskId) => {
    try {
      const parsedSubtasks = JSON.parse(task.subtasks || '[]');
      const updatedSubtasks = parsedSubtasks.map(st => {
        if (st.id === subtaskId) {
          return { ...st, completed: !st.completed };
        }
        return st;
      });

      const payload = {
        ...task,
        subtasks: JSON.stringify(updatedSubtasks)
      };

      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, payload);
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToastNotification('Failed to update subtask.', 'error');
    }
  };

  const handleAddComment = async (task) => {
    if (!commentInput.trim()) return;

    try {
      const parsedComments = JSON.parse(task.comments || '[]');
      const newComment = {
        id: Date.now(),
        name: currentUser.name,
        username: currentUser.username,
        role: currentUser.role,
        text: commentInput.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
      };

      const updatedComments = [...parsedComments, newComment];
      const payload = {
        ...task,
        comments: JSON.stringify(updatedComments)
      };

      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, payload);
      setCommentInput('');
      fetchTasks();
      showToastNotification('Comment posted successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToastNotification('Failed to post comment.', 'error');
    }
  };

  const addTempSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSub = {
      id: Date.now() + Math.random(),
      text: newSubtaskText.trim(),
      completed: false
    };
    setTempSubtasks(prev => [...prev, newSub]);
    setNewSubtaskText('');
  };

  const removeTempSubtask = (id) => {
    setTempSubtasks(prev => prev.filter(item => item.id !== id));
  };

  const toggleTaskStatus = async (task) => {
    try {
      const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
      const payload = {
        ...task,
        status: updatedStatus
      };
      
      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, payload);
      
      if (updatedStatus === 'completed') {
        showToastNotification('Task marked as Completed! 🎉', 'success');
      } else {
        showToastNotification('Task status set back to Pending.', 'success');
      }
      
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToastNotification('Failed to toggle status.', 'error');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/tasks/${id}`);
      showToastNotification('Task deleted successfully.', 'success');
      
      if (editTaskId === id) {
        cancelEdit();
      }
      
      fetchTasks();
    } catch (err) {
      console.error(err);
      showToastNotification('Failed to delete task.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- STATS COMPUTATION ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  // --- FILTERING AND SORTING ---
  const processedTasks = tasks
    .filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.assigned_to && task.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'completed' && task.status === 'completed') ||
        (statusFilter === 'pending' && task.status === 'pending');
        
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === 'newest') return b.id - a.id;
      if (sortOption === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortOption === 'priority') {
        const pWeight = { 'high': 3, 'medium': 2, 'low': 1 };
        return pWeight[b.priority] - pWeight[a.priority];
      }
      return 0;
    });

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  // --- RENDERING LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="login-screen-wrapper">
        <div className="login-card">
          <div className="login-logo">
            <CheckSquare size={32} color="#6366f1" />
            <h1>Task Command</h1>
          </div>
          <p className="login-header-text">B.Tech CSE Role-Based Task Platform</p>
          
          {/* LOGIN / REGISTER TOGGLES */}
          <div className="login-toggle-area">
            <button 
              className={`login-toggle-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Sign In
            </button>
            <button 
              className={`login-toggle-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Register Student
            </button>
          </div>

          {/* QUICK DEMO SHORTCUTS */}
          <div className="demo-accounts-box">
            <span className="demo-title">🔑 Quick Demo Logins</span>
            <div className="demo-buttons-row">
              <button className="demo-pill" onClick={() => handleQuickFill('admin')}>
                <span className="demo-role">Instructor (Admin)</span>
                <span className="demo-user">User: admin | Pass: admin123</span>
              </button>
              <button className="demo-pill" onClick={() => handleQuickFill('student')}>
                <span className="demo-role">Student Account</span>
                <span className="demo-user">User: student | Pass: student123</span>
              </button>
            </div>
          </div>

          {/* MAIN AUTH FORM */}
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Akash Sharma"
                  className="form-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                placeholder="Enter username"
                className="form-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder="Enter password"
                className="form-input"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-role">Account Type</label>
                <select
                  id="auth-role"
                  className="form-select"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                >
                  <option value="student">Student User</option>
                  <option value="admin">Instructor / Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              {authMode === 'login' ? (
                <>
                  <LogIn size={18} />
                  Login to Workspace
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Student Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* TOASTS ON LOGIN */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <span className="toast-message">{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- RENDERING SECURE APP DASHBOARD ---
  return (
    <div className="app-container">
      
      {/* HEADER W/ USER PROFILE */}
      <header className="app-header">
        <div className="header-title-area">
          <h1>
            <CheckSquare size={36} color="#6366f1" />
            Student Task Manager
          </h1>
          <p className="header-subtitle">
            {currentUser.role === 'admin' 
              ? "Admin Command Center | Global Assignment Controls" 
              : "Student Workspace | Personal Tasks Checklist"}
          </p>
        </div>
        
        {/* User Info and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="user-profile-header">
            <div className="user-avatar-circle">
              {currentUser.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
            </div>
            <div className="user-info-text">
              <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {currentUser.name}
                {currentUser.role === 'student' && (() => {
                  const studentTasks = tasks.filter(t => t.assigned_to === currentUser.username);
                  const completed = studentTasks.filter(t => t.status === 'completed').length;
                  const total = studentTasks.length;
                  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                  
                  if (rate >= 90) return <span className="rank-badge-header gold" title="Gold Rank: Productivity Champion!">🏆</span>;
                  if (rate >= 50) return <span className="rank-badge-header silver" title="Silver Rank: Task Crusader!">⚡</span>;
                  return <span className="rank-badge-header bronze" title="Bronze Rank: Active Competitor!">🌱</span>;
                })()}
              </span>
              <span className="user-role-badge">
                {currentUser.role === 'admin' ? 'Class Instructor' : `@${currentUser.username}`}
              </span>
            </div>
          </div>
          
          <button 
            className="action-btn delete-btn" 
            onClick={handleLogout} 
            title="Log Out Session"
            style={{ border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem', height: '2.5rem', width: '2.5rem' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* STATS WIDGETS */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FolderOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalTasks}</span>
            <span className="stat-label">
              {currentUser.role === 'admin' ? 'Global Active Tasks' : 'My Tasks'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{pendingTasks}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedTasks}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completionRate}%</span>
            <span className="stat-label">
              {currentUser.role === 'admin' ? 'Class Completion' : 'Personal Completion'}
            </span>
          </div>
        </div>
      </section>

      {/* ADMIN NAVIGATION TABS */}
      {currentUser.role === 'admin' && (
        <div className="admin-nav-tabs">
          <button 
            className={`admin-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckSquare size={16} />
            <span>Tasks Board</span>
          </button>
          <button 
            className={`admin-nav-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); fetchStudents(); }}
          >
            <Users size={16} />
            <span>Student Directory</span>
          </button>
        </div>
      )}

      {/* DASHBOARD CORE CONTENT */}
      <main className="dashboard-content">
        {currentUser.role === 'admin' && activeTab === 'students' ? (
          <>
            {/* STUDENT MANAGEMENT VIEW */}
            {/* LEFT COLUMN: STUDENT CREATION/EDIT PANEL */}
            <section className="form-column">
              <div className="panel-card">
                <h2 className="panel-title">
                  {editStudentId ? (
                    <>
                      <Edit2 size={20} color="#fbbf24" />
                      Edit Student Details
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} color="#6366f1" />
                      Add New Student
                    </>
                  )}
                </h2>
                
                <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="student-name">Full Name</label>
                    <input
                      id="student-name"
                      type="text"
                      placeholder="e.g. Akash Sharma"
                      className="form-input"
                      value={studentNameInput}
                      onChange={(e) => setStudentNameInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="student-username">Username</label>
                    <input
                      id="student-username"
                      type="text"
                      placeholder="e.g. student_c"
                      className="form-input"
                      value={studentUsernameInput}
                      onChange={(e) => setStudentUsernameInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="student-password">
                      {editStudentId ? 'New Password (Optional)' : 'Password'}
                    </label>
                    <input
                      id="student-password"
                      type="password"
                      placeholder={editStudentId ? 'Leave blank to keep current' : 'Enter password'}
                      className="form-input"
                      value={studentPasswordInput}
                      onChange={(e) => setStudentPasswordInput(e.target.value)}
                      required={!editStudentId}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {editStudentId ? 'Update Student' : 'Create Student'}
                    </button>
                    {editStudentId && (
                      <button type="button" className="btn btn-secondary" onClick={cancelStudentEdit} title="Cancel Edit">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </section>

            {/* RIGHT COLUMN: STUDENT DIRECTORY GRID */}
            <section className="list-column">
              
              {/* STUDENT FILTERS/SEARCH BAR */}
              <div className="filters-bar">
                <div className="search-wrapper" style={{ maxWidth: '100%' }}>
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by student name or username..."
                    className="form-input search-input"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                  {studentSearchQuery && (
                    <button 
                      onClick={() => setStudentSearchQuery('')}
                      style={{ 
                        position: 'absolute', 
                        right: '0.85rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--text-secondary))'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* STUDENT DIRECTORY LIST */}
              <div className="student-grid">
                {students.filter(student => 
                  student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                  student.username.toLowerCase().includes(studentSearchQuery.toLowerCase())
                ).length > 0 ? (
                  students.filter(student => 
                    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    student.username.toLowerCase().includes(studentSearchQuery.toLowerCase())
                  ).map(student => {
                    const studentPendingTasks = tasks.filter(
                      t => t.assigned_to === student.username && t.status !== 'completed'
                    ).length;

                    // Compute initials for the avatar
                    const initials = student.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <article key={student.id} className="student-card">
                        <div className="student-card-body">
                          
                          {/* Student Info Left */}
                          <div className="student-profile-main">
                            <div className="student-avatar">
                              {initials}
                            </div>
                            <div className="student-details">
                              <h3 className="student-name-text">{student.name}</h3>
                              <span className="student-username-tag">@{student.username}</span>
                            </div>
                          </div>

                          {/* Task Burden Badge Middle */}
                          <div className="student-stats">
                            <span className={`student-tasks-badge ${studentPendingTasks > 2 ? 'high-load' : studentPendingTasks > 0 ? 'medium-load' : 'empty-load'}`}>
                              {studentPendingTasks} Pending Task{studentPendingTasks !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Actions Right */}
                          <div className="student-actions">
                            <button 
                              className="action-btn"
                              onClick={() => startStudentEdit(student)}
                              title="Edit student"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => deleteStudent(student.id, student.username)}
                              title="Delete student"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Users size={48} />
                    </div>
                    <h3>No students found</h3>
                    <p>
                      {studentSearchQuery 
                        ? "Try adjusting your search query." 
                        : "No students registered yet. Add one on the left panel!"}
                    </p>
                  </div>
                )}
              </div>

            </section>
          </>
        ) : (
          <>
            {/* LEFT COLUMN: CREATION PANEL */}
            <section className="form-column">
              <div className="panel-card">
                <h2 className="panel-title">
                  {editTaskId ? (
                    <>
                      <Edit2 size={20} color="#fbbf24" />
                      Edit Task Details
                    </>
                  ) : (
                    <>
                      <Plus size={20} color="#6366f1" />
                      {currentUser.role === 'admin' ? 'Assign New Task' : 'Add Personal Task'}
                    </>
                  )}
                </h2>
                
                <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-title">Task Title</label>
                    <input
                      id="task-title"
                      type="text"
                      placeholder="e.g. Prepare CSE Viva slides"
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="task-desc">Description</label>
                    <textarea
                      id="task-desc"
                      placeholder="e.g. Covers syllabus modules 1-3, check API examples"
                      className="form-textarea"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="task-category">Category / Tag</label>
                    <select
                      id="task-category"
                      className="form-select"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                    >
                      <option value="General">General ⚙️</option>
                      <option value="Assignment">Assignment 📝</option>
                      <option value="Project">Project 💻</option>
                      <option value="Lab Exam">Lab Exam 🧪</option>
                      <option value="Viva-Voce">Viva-Voce 🎤</option>
                      <option value="Study Guide">Study Guide 📖</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Checklist Subtasks ({tempSubtasks.length})</label>
                    
                    {/* List of currently added subtasks */}
                    {tempSubtasks.length > 0 && (
                      <div className="form-temp-subtasks-list" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.4rem', 
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}>
                        {tempSubtasks.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: 'hsl(var(--text-secondary))' }}>• {item.text}</span>
                            <button 
                              type="button" 
                              onClick={() => removeTempSubtask(item.id)}
                              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input to add new subtask */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        placeholder="Add subtask step..."
                        className="form-input"
                        style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                        value={newSubtaskText}
                        onChange={(e) => setNewSubtaskText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTempSubtask(); } }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={addTempSubtask}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* ADMIN ASSIGNMENT DROPDOWN */}
                  {currentUser.role === 'admin' && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="task-assignment">Assign Task To</label>
                      <select
                        id="task-assignment"
                        className="form-select"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                      >
                        {students.map(s => (
                          <option key={s.id} value={s.username}>
                            {s.name} (@{s.username})
                          </option>
                        ))}
                        {students.length === 0 && (
                          <option value="student">Demo Student (@student)</option>
                        )}
                      </select>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="task-priority">Priority</label>
                      <select
                        id="task-priority"
                        className="form-select"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="task-date">Due Date</label>
                      <input
                        id="task-date"
                        type="date"
                        className="form-input"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {editTaskId ? 'Update Task' : (currentUser.role === 'admin' ? 'Assign Task' : 'Add Task')}
                    </button>
                    {editTaskId && (
                      <button type="button" className="btn btn-secondary" onClick={cancelEdit} title="Cancel Edit">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>

                {highPriorityTasks > 0 && (
                  <div style={{ 
                    background: 'rgba(239, 68, 68, 0.08)', 
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#fca5a5',
                    fontSize: '0.85rem'
                  }}>
                    <AlertCircle size={16} />
                    <span>
                      {currentUser.role === 'admin' 
                        ? `Instructors: There are ${highPriorityTasks} high-priority tasks pending!` 
                        : `You have ${highPriorityTasks} urgent pending task(s)! Check details.`}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: TASK CHECKLIST */}
            <section className="list-column">
              
              {/* CLASSROOM ANALYTICS & WORKLOAD BALANCE */}
              {currentUser.role === 'admin' && (
                <div className="panel-card analytics-panel" style={{ marginBottom: '1.5rem' }}>
                  <h2 className="panel-title" style={{ border: 'none', padding: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={20} color="#a5b4fc" />
                      Classroom Workload Balance
                    </span>
                    <span className="badge-tag" style={{ fontSize: '0.7rem' }}>Live SQLite Metrics</span>
                  </h2>
                  
                  <div className="student-workload-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                    {students.map(student => {
                      const studentTasks = tasks.filter(t => t.assigned_to === student.username);
                      const studentCompleted = studentTasks.filter(t => t.status === 'completed').length;
                      const studentTotal = studentTasks.length;
                      const studentRate = studentTotal > 0 ? Math.round((studentCompleted / studentTotal) * 100) : 0;
                      
                      // Dynamic color for workload completion progress meter
                      let meterColor = 'linear-gradient(90deg, #f87171 0%, #fb923c 100%)'; // Red/Orange for low completion
                      if (studentRate >= 80) {
                        meterColor = 'linear-gradient(90deg, #34d399 0%, #059669 100%)'; // Green for high
                      } else if (studentRate >= 40) {
                        meterColor = 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'; // Yellow for medium
                      }

                      // Gamified Rank inside admin workload grid
                      let rankBadge = '🌱 Bronze';
                      if (studentRate >= 90) rankBadge = '🏆 Gold Champion';
                      else if (studentRate >= 50) rankBadge = '⚡ Silver Finisher';

                      return (
                        <div key={student.id} className="workload-item" style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.05)', 
                          borderRadius: '0.75rem', 
                          padding: '0.75rem 1rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                            <span>
                              <strong>{student.name}</strong> <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>@{student.username}</span>
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: studentRate >= 80 ? '#6ee7b7' : studentRate >= 40 ? '#fde047' : '#fca5a5' }}>
                              {rankBadge} • {studentCompleted}/{studentTotal} completed ({studentRate}%)
                            </span>
                          </div>
                          
                          {/* Completion Meter Bar */}
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${studentRate}%`, height: '100%', background: meterColor, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {students.length === 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '0.5rem' }}>
                        No registered student accounts yet to analyze workload indicators.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SEARCH, FILTERS & SORTS */}
              <div className="filters-bar">
                
                {/* Live Search */}
                <div className="search-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder={currentUser.role === 'admin' 
                      ? "Search by title, desc, student username..." 
                      : "Search your checklist..."}
                    className="form-input search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      style={{ 
                        position: 'absolute', 
                        right: '0.85rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--text-secondary))'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Actions: Pills and Selects */}
                <div className="filter-actions">
                  
                  <div className="filter-group">
                    <button 
                      className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All ({totalTasks})
                    </button>
                    <button 
                      className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('pending')}
                    >
                      Pending ({pendingTasks})
                    </button>
                    <button 
                      className={`filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('completed')}
                    >
                      Completed ({completedTasks})
                    </button>
                  </div>

                  <select
                    className="form-select sort-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    title="Sort Tasks"
                  >
                    <option value="newest">Sort by Newest</option>
                    <option value="due_date">Sort by Due Date</option>
                    <option value="priority">Sort by Priority</option>
                  </select>

                </div>
              </div>

              {/* TASK LIST AREA */}
              <div className="tasks-grid">
                {processedTasks.length > 0 ? (
                  processedTasks.map(task => {
                    const overdue = isOverdue(task.due_date, task.status);
                    return (
                      <article key={task.id} className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                        
                        {/* Checkbox Trigger */}
                        <label className="task-checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={task.status === 'completed'}
                            onChange={() => toggleTaskStatus(task)}
                          />
                          <span className="checkmark"></span>
                        </label>

                        {/* Details body */}
                        <div className="task-body">
                          <div className="task-header-row">
                            <h3 className="task-title">{task.title}</h3>
                            <div className="task-actions">
                              <button 
                                className={`action-btn ${expandedCommentsTaskId === task.id ? 'active' : ''}`}
                                onClick={() => setExpandedCommentsTaskId(expandedCommentsTaskId === task.id ? null : task.id)}
                                title="View comments & feedback"
                                style={{ position: 'relative' }}
                              >
                                <BookOpen size={16} />
                                {JSON.parse(task.comments || '[]').length > 0 && (
                                  <span style={{ 
                                    position: 'absolute', 
                                    top: '-4px', 
                                    right: '-4px', 
                                    background: 'hsl(var(--primary))', 
                                    color: 'white', 
                                    fontSize: '0.65rem', 
                                    width: '14px', 
                                    height: '14px', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontWeight: '700',
                                    boxShadow: '0 0 6px var(--primary-glow)'
                                  }}>
                                    {JSON.parse(task.comments || '[]').length}
                                  </span>
                                )}
                              </button>
                              <button 
                                className="action-btn" 
                                onClick={() => startEdit(task)}
                                title="Edit details"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                onClick={() => deleteTask(task.id)}
                                title="Delete task"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}

                          {/* Subtask Checklist and Progress Bar */}
                          {(() => {
                            const parsedSubtasks = JSON.parse(task.subtasks || '[]');
                            const completedSubtasksCount = parsedSubtasks.filter(st => st.completed).length;
                            const totalSubtasksCount = parsedSubtasks.length;
                            const subtaskPercent = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

                            if (totalSubtasksCount === 0) return null;

                            return (
                              <div className="task-subtasks-section" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="subtask-progress-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginBottom: '0.25rem', fontWeight: 600 }}>
                                  <span>Subtask Checklist</span>
                                  <span>{completedSubtasksCount}/{totalSubtasksCount} ({subtaskPercent}%)</span>
                                </div>
                                <div className="subtask-progress-container" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                                  <div className="subtask-progress-bar" style={{ width: `${subtaskPercent}%`, height: '100%', background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--success)) 100%)', transition: 'width 0.3s ease' }}></div>
                                </div>
                                <div className="subtask-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.25rem' }}>
                                  {parsedSubtasks.map(st => (
                                    <label key={st.id} className="subtask-item-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: st.completed ? 'hsl(var(--text-muted))' : 'hsl(var(--text-secondary))', cursor: 'pointer', textDecoration: st.completed ? 'line-through' : 'none', transition: 'all 0.2s ease' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={st.completed}
                                        onChange={() => handleToggleSubtask(task, st.id)}
                                        style={{ width: '14px', height: '14px', accentColor: 'hsl(var(--success))', cursor: 'pointer' }}
                                      />
                                      <span>{st.text}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="task-meta-row">
                            {/* Category Badge Tag */}
                            <span className={`category-tag-badge category-${task.category?.toLowerCase().replace(' ', '-')}`}>
                              {task.category || 'General'}
                            </span>

                            {/* Priority level */}
                            <span className={`priority-badge ${task.priority}`}>
                              <span style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                background: 'currentColor',
                                display: 'inline-block'
                              }}></span>
                              {task.priority}
                            </span>

                            {/* Due dates */}
                            {task.due_date && (
                              <span className={`task-due-date ${overdue ? 'overdue' : ''}`}>
                                <Calendar size={13} style={{ marginRight: '2px' }} />
                                <span>
                                  {overdue ? `Overdue: ${task.due_date}` : `Due: ${task.due_date}`}
                                </span>
                              </span>
                            )}

                            {/* Assigned To Badge (visible to Admins, or Students verifying details) */}
                            {currentUser.role === 'admin' && (
                              <span className="assigned-student-tag">
                                <User size={11} />
                                <span>Assigned to: <strong>@{task.assigned_to}</strong></span>
                              </span>
                            )}
                          </div>

                          {/* Expandable Collaborative Comments activity feed */}
                          {expandedCommentsTaskId === task.id && (
                            <div className="task-comments-feed" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.6rem', color: '#a5b4fc' }}>
                                💬 Activity Feed & Feedback
                              </h4>
                              <div className="comments-bubbles-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '160px', overflowY: 'auto', marginBottom: '0.75rem', paddingRight: '0.25rem' }}>
                                {JSON.parse(task.comments || '[]').length > 0 ? (
                                  JSON.parse(task.comments || '[]').map(comment => (
                                    <div key={comment.id} className={`comment-bubble ${comment.role === 'admin' ? 'instructor-comment' : 'student-comment'}`} style={{ 
                                      background: comment.role === 'admin' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                      border: comment.role === 'admin' ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
                                      borderRadius: '0.6rem',
                                      padding: '0.5rem 0.75rem',
                                      fontSize: '0.825rem'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: 650, color: comment.role === 'admin' ? '#a5b4fc' : '#a7f3d0' }}>
                                          {comment.name} 
                                          <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8, marginLeft: '0.3rem', textTransform: 'uppercase', color: comment.role === 'admin' ? '#cbd5e1' : '#94a3b8' }}>
                                            {comment.role === 'admin' ? '[Instructor]' : `@${comment.username}`}
                                          </span>
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{comment.timestamp}</span>
                                      </div>
                                      <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.3', fontSize: '0.825rem', whiteSpace: 'pre-wrap' }}>{comment.text}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ textAlignment: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.75rem', padding: '0.5rem', textAlign: 'center' }}>
                                    No comments yet. Write a note below!
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <input
                                  type="text"
                                  placeholder="Add note or progress feedback..."
                                  className="form-input"
                                  style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(task); } }}
                                />
                                <button 
                                  type="button" 
                                  className="btn btn-primary" 
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}
                                  onClick={() => handleAddComment(task)}
                                >
                                  Post
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <CheckSquare size={48} />
                    </div>
                    <h3>No tasks here</h3>
                    <p>
                      {searchQuery || statusFilter !== 'all' 
                        ? "Try adjusting your search query or filters." 
                        : "No tasks active. Create a new task to assign work!"}
                    </p>
                  </div>
                )}
              </div>

            </section>
          </>
        )}
      </main>

      {/* FLOATING TOASTS */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
