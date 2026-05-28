import sqlite3
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS to allow requests from the React frontend
CORS(app)

DATABASE = os.path.join(os.path.dirname(__file__), 'tasks.db')

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # This allows row data to be accessed like dictionaries
    return conn

def init_db():
    """Initializes the database, creates users and tasks tables, and seeds demo accounts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'student'))
        )
    ''')
    
    # 2. Recreate Tasks Table with assigned_to and created_by
    cursor.execute('DROP TABLE IF EXISTS tasks')
    cursor.execute('''
        CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT DEFAULT 'medium',
            due_date TEXT,
            status TEXT DEFAULT 'pending',
            assigned_to TEXT,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            category TEXT DEFAULT 'General',
            subtasks TEXT DEFAULT '[]',
            comments TEXT DEFAULT '[]'
        )
    ''')
    
    # 3. Seed Default Accounts
    # Seed Admin Account
    cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        cursor.execute(
            'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
            ('admin', 'admin123', 'Class Instructor (Admin)', 'admin')
        )
    
    # Seed Student Account A
    cursor.execute('SELECT * FROM users WHERE username = ?', ('student',))
    if not cursor.fetchone():
        cursor.execute(
            'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
            ('student', 'student123', 'Demo Student', 'student')
        )

    # Seed Student Account B
    cursor.execute('SELECT * FROM users WHERE username = ?', ('student_b',))
    if not cursor.fetchone():
        cursor.execute(
            'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
            ('student_b', 'student123', 'Akash Sharma (Student B)', 'student')
        )
        
    # 4. Seed Demo Tasks
    cursor.execute('SELECT COUNT(*) FROM tasks')
    if cursor.fetchone()[0] == 0:
        # Seed task for 'student'
        cursor.execute(
            'INSERT INTO tasks (title, description, priority, due_date, status, assigned_to, created_by, category, subtasks, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ("Submit B.Tech Mini Project Documentation", 
             "Write the project report, requirements checklist, and system walkthrough for external evaluation.", 
             "high", "2026-05-30", "pending", "student", "admin", "Project",
             '[{"id":1,"text":"Draft architecture flow","completed":true},{"id":2,"text":"Outline database schema design","completed":false},{"id":3,"text":"Write local validation steps","completed":false}]',
             '[{"id":1,"name":"Class Instructor (Admin)","username":"admin","role":"admin","text":"Please complete the database section by tonight. Viva evaluators will check it.","timestamp":"2026-05-28 09:00"}]')
        )
        # Seed task for 'student_b'
        cursor.execute(
            'INSERT INTO tasks (title, description, priority, due_date, status, assigned_to, created_by, category, subtasks, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ("Review Python SQLite CRUD API logic", 
             "Double check endpoint validation, SQL query executions, and database connections inside app.py.", 
             "medium", "2026-05-29", "completed", "student_b", "admin", "Lab Exam",
             '[{"id":1,"text":"Verify endpoints returning JSON payloads","completed":true},{"id":2,"text":"Check cross-origin headers are configured","completed":true}]',
             '[{"id":1,"name":"Akash Sharma (Student B)","username":"student_b","role":"student","text":"All Flask routes verified. Relational cascades working successfully!","timestamp":"2026-05-28 08:30"}]')
        )
        
    conn.commit()
    conn.close()

# Initialize/migrate the SQLite database on startup
init_db()

@app.route('/login', methods=['POST'])
def login():
    """Authenticates a user and returns user info."""
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Username and password are required"}), 400
            
        username = data.get('username').strip().lower()
        password = data.get('password')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()

        if not user or user['password'] != password:
            return jsonify({"error": "Invalid username or password"}), 401

        return jsonify({
            "message": "Login Successful",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "name": user['name'],
                "role": user['role']
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    """Registers a new student account."""
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data or 'name' not in data:
            return jsonify({"error": "All fields (username, password, name) are required"}), 400
            
        username = data.get('username').strip().lower()
        password = data.get('password')
        name = data.get('name').strip()
        role = data.get('role', 'student').lower()

        if role not in ['admin', 'student']:
            role = 'student'

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if username already exists
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Username is already taken"}), 400

        cursor.execute(
            'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
            (username, password, name, role)
        )
        conn.commit()
        conn.close()

        return jsonify({"message": f"User {username} registered successfully as {role}!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/students', methods=['GET'])
def get_students():
    """Retrieves all registered students."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, name, role FROM users WHERE role = 'student' ORDER BY name ASC")
        students = cursor.fetchall()
        conn.close()

        students_list = []
        for s in students:
            students_list.append({
                'id': s['id'],
                'username': s['username'],
                'name': s['name']
            })
        return jsonify(students_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/tasks', methods=['GET'])
def get_tasks():
    """Retrieves tasks filtered by user role and username."""
    try:
        username = request.args.get('username', '').strip().lower()
        role = request.args.get('role', '').strip().lower()

        conn = get_db_connection()
        cursor = conn.cursor()
        
        if role == 'student' and username:
            # Students can only view tasks assigned to them
            cursor.execute('SELECT * FROM tasks WHERE LOWER(assigned_to) = ? ORDER BY id DESC', (username,))
        else:
            # Admins view all tasks
            cursor.execute('SELECT * FROM tasks ORDER BY id DESC')
            
        tasks = cursor.fetchall()
        conn.close()
        
        tasks_list = []
        for task in tasks:
            tasks_list.append({
                'id': task['id'],
                'title': task['title'],
                'description': task['description'],
                'priority': task['priority'],
                'due_date': task['due_date'],
                'status': task['status'],
                'assigned_to': task['assigned_to'],
                'created_by': task['created_by'],
                'created_at': task['created_at'],
                'category': task['category'] if 'category' in task.keys() else 'General',
                'subtasks': task['subtasks'] if 'subtasks' in task.keys() else '[]',
                'comments': task['comments'] if 'comments' in task.keys() else '[]'
            })
            
        return jsonify(tasks_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/tasks', methods=['POST'])
def add_task():
    """Adds a new task (optionally assigned to a specific student)."""
    try:
        data = request.get_json()
        if not data or 'title' not in data or not data['title'].strip():
            return jsonify({"error": "Task title is required"}), 400
            
        title = data.get('title').strip()
        description = data.get('description', '').strip()
        priority = data.get('priority', 'medium').lower()
        due_date = data.get('due_date', '').strip()
        status = data.get('status', 'pending').lower()
        assigned_to = data.get('assigned_to', 'student').strip().lower()  
        created_by = data.get('created_by', 'admin').strip().lower()
        category = data.get('category', 'General').strip()
        subtasks = data.get('subtasks', '[]').strip()
        comments = data.get('comments', '[]').strip()

        # Validate priority
        if priority not in ['low', 'medium', 'high']:
            priority = 'medium'

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO tasks (title, description, priority, due_date, status, assigned_to, created_by, category, subtasks, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (title, description, priority, due_date, status, assigned_to, created_by, category, subtasks, comments)
        )
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()

        return jsonify({
            "message": "Task Added Successfully",
            "task": {
                "id": new_id,
                "title": title,
                "description": description,
                "priority": priority,
                "due_date": due_date,
                "status": status,
                "assigned_to": assigned_to,
                "created_by": created_by,
                "category": category,
                "subtasks": subtasks,
                "comments": comments
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Updates an existing task."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body cannot be empty"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if task exists
        cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
        task = cursor.fetchone()
        if not task:
            conn.close()
            return jsonify({"error": "Task not found"}), 404

        # Read updated values or keep current values
        title = data.get('title', task['title']).strip()
        description = data.get('description', task['description']).strip()
        priority = data.get('priority', task['priority']).lower()
        due_date = data.get('due_date', task['due_date']).strip()
        status = data.get('status', task['status']).lower()
        assigned_to = data.get('assigned_to', task['assigned_to']).strip().lower()
        category = data.get('category', task['category'] if 'category' in task.keys() else 'General').strip()
        subtasks = data.get('subtasks', task['subtasks'] if 'subtasks' in task.keys() else '[]').strip()
        comments = data.get('comments', task['comments'] if 'comments' in task.keys() else '[]').strip()

        # Validate priority and status
        if priority not in ['low', 'medium', 'high']:
            priority = task['priority']
        if status not in ['pending', 'completed']:
            status = task['status']

        cursor.execute(
            'UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, status = ?, assigned_to = ?, category = ?, subtasks = ?, comments = ? WHERE id = ?',
            (title, description, priority, due_date, status, assigned_to, category, subtasks, comments, task_id)
        )
        conn.commit()
        conn.close()

        return jsonify({
            "message": "Task Updated Successfully",
            "task": {
                "id": task_id,
                "title": title,
                "description": description,
                "priority": priority,
                "due_date": due_date,
                "status": status,
                "assigned_to": assigned_to,
                "category": category,
                "subtasks": subtasks,
                "comments": comments
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Deletes a task."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if task exists
        cursor.execute('SELECT * FROM tasks WHERE id = ?', (task_id,))
        task = cursor.fetchone()
        if not task:
            conn.close()
            return jsonify({"error": "Task not found"}), 404

        cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
        conn.commit()
        conn.close()

        return jsonify({"message": f"Task {task_id} Deleted Successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/students/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Deletes a student account and all tasks assigned to them."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Verify user exists and is a student
        cursor.execute('SELECT * FROM users WHERE id = ?', (student_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "Student not found"}), 404
            
        if user['role'] != 'student':
            conn.close()
            return jsonify({"error": "Access denied. Cannot delete admin accounts through this endpoint"}), 403
            
        student_username = user['username']
        
        # 2. Delete tasks assigned to this student
        cursor.execute('DELETE FROM tasks WHERE assigned_to = ?', (student_username,))
        
        # 3. Delete the student user
        cursor.execute('DELETE FROM users WHERE id = ?', (student_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": f"Student @{student_username} and all their assigned tasks deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    """Updates student information (name, username, and optionally password)."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body cannot be empty"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Check if student exists
        cursor.execute('SELECT * FROM users WHERE id = ?', (student_id,))
        student = cursor.fetchone()
        if not student:
            conn.close()
            return jsonify({"error": "Student not found"}), 404
            
        if student['role'] != 'student':
            conn.close()
            return jsonify({"error": "Access denied. Cannot modify admin accounts through this endpoint"}), 403
            
        old_username = student['username']
        new_name = data.get('name', student['name']).strip()
        new_username = data.get('username', student['username']).strip().lower()
        new_password = data.get('password', '').strip()
        
        if not new_name or not new_username:
            conn.close()
            return jsonify({"error": "Name and username cannot be empty"}), 400
            
        # 2. Check if username is changing and if the new username is already taken
        if new_username != old_username:
            cursor.execute('SELECT * FROM users WHERE username = ?', (new_username,))
            if cursor.fetchone():
                conn.close()
                return jsonify({"error": "Username is already taken"}), 400
                
        # 3. Update database record
        if new_password:
            cursor.execute(
                'UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?',
                (new_name, new_username, new_password, student_id)
            )
        else:
            cursor.execute(
                'UPDATE users SET name = ?, username = ? WHERE id = ?',
                (new_name, new_username, student_id)
            )
            
        # 4. If username has changed, update all existing tasks assigned to or created by them
        if new_username != old_username:
            cursor.execute('UPDATE tasks SET assigned_to = ? WHERE assigned_to = ?', (new_username, old_username))
            cursor.execute('UPDATE tasks SET created_by = ? WHERE created_by = ?', (new_username, old_username))
            
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "Student updated successfully",
            "student": {
                "id": student_id,
                "name": new_name,
                "username": new_username
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the server on localhost:5000
    app.run(debug=True, port=5000)
