# 🏆 Advanced Student Task Management System
### Relational B.Tech Course Mini-Project | React.js, Python Flask & SQLite3

A premium, glassmorphic, and role-based Full Stack task coordination platform built to streamline curriculum distribution, task progression, and student performance tracking.

---

## ✨ Features

### 👤 Student Workspace
- **Personalized Checklist**: Tick off assigned tasks immediately with fluid micro-animations.
- **Dynamic Checklist Subtasks**: Interactive sub-checklists inside each task with animated progress percentage bars.
- **Dynamic Gamification Rank**: Performance levels calculated in real-time based on completion rates:
  - 🏆 **Gold Rank**: Productivity Champion ($\ge 90\%$ completion) with neon gold profile glows.
  - ⚡ **Silver Rank**: Task Crusader ($50\%$ to $89\%$ completion).
  - 🌱 **Bronze Rank**: Active Competitor ($< 50\%$ completion).
- **Advanced Sort & Filters**: Query checklists by category tags, sorting rules (priority, due dates), and text search.
- **Threaded Commenting Log**: Collaborative feedback threads inside each card to converse directly with instructors.

### 👑 Instructor Command Center
- **Classroom Workload Balance Grid**: A central dashboard monitoring student indices, completion ratios, progress bars, and ranks in real-time.
- **Task Assignment Engine**: Fill out task details and select any registered student from a dynamic SQLite-backed dropdown list.
- **Advanced Admin Controls**: Edit or delete inappropriate student tasks or accounts with automatic database cascades.

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite), Axios, Lucide Icons | Component-driven interface, HTTP API client, and vector iconography. |
| **Styling** | Vanilla CSS3 (Glassmorphism) | Sleek modern aesthetics, glow indicators, and layout grids. |
| **Backend** | Python, Flask, Flask-CORS | REST API routing, request validation, and CORS middleware. |
| **Database** | SQLite3 (Hybrid JSON Model) | Serialized subtasks/comments lists inside relational columns. |

---

## 📂 Project Structure
```text
├── backend/
│   ├── app.py                # Flask main application & SQLite controller
│   ├── requirements.txt      # Python package dependencies
│   └── tasks.db              # Auto-generated SQLite relational database
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # React core dashboard & gamification code
│   │   ├── App.css           # Premium glassmorphism design styles
│   │   └── main.jsx          # Vite React mounting point
│   ├── index.html            # Core client document
│   ├── vite.config.js        # Vite port configurations
│   └── package.json          # Node dependencies & run scripts
├── project_documentation.md  # Detailed university-grade technical report
└── README.md                 # This quick start guide
```

---

## 🚀 Execution & Quick Start

### 1. Run Python REST API Backend
```bash
# Navigate to project root, install Python modules
pip install -r backend/requirements.txt

# Fire up Flask application
python backend/app.py
```
- Server launches on: **`http://127.0.0.1:5000`**
- Auto-generates and seeds database `tasks.db` on startup.

### 2. Run React client
```bash
# Navigate to frontend, install Node packages
cd frontend
npm install

# Start Vite server
npm run dev
```
- Client mounts on: **`http://localhost:5173/`**

---

## 🔑 Seeding Credentials

The local database comes pre-seeded with default presentation accounts:

*   **Instructor (Admin Account)**:
    - Username: `admin` | Password: `admin123`
*   **Demo Student Account**:
    - Username: `student` | Password: `student123`
*   **Student B Account**:
    - Username: `student_b` | Password: `student123`

---
> **Prepared as a course mini-project. All rights reserved. 2026.**
