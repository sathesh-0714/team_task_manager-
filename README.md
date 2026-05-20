# AetherFlow // Team Task Orchestrator

AetherFlow is a premium, high-fidelity, full-stack **Team Task Manager** built to streamline collaboration, project organization, and sprint pacing. Designed with an ultra-modern glassmorphic dark theme, custom responsive sidebar navigation, and detailed visual performance indicators.

---

## 🚀 Key Features

- **JWT Authentication**: Secure user signup and login with hashed passwords via `bcryptjs`.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Has full authority to create projects, invite/remove members from team rosters, create and delegate tasks, and edit or delete any task card.
  - **Member**: Accesses personal assigned workspaces. Can view team pipelines and update progress columns (To Do, In Progress, Review, Done) on tasks they are assigned to.
- **Sprint Kanban Board**: Dynamic board columns with filter controllers for Projects, Assignees, and Priority Levels. Includes warning tags for overdue items.
- **Analytics Dashboard**: Interactive completion percentages rendered via custom SVG rings, stats summaries (Total, Sprint size, Completed, Overdue counts), and project-by-project pacing lists.
- **Dual-Database Support**: Operates locally on zero-config **SQLite** file and switches automatically to production-grade **PostgreSQL** in production environments.

---

## ⚙️ Technology Stack

- **Frontend**: React.js (Vite), Lucide Icons, Modern Vanilla CSS Design System ( Outfit & Inter Typography, Glassmorphism, CSS Transitions).
- **Backend**: Node.js, Express.js, Sequelize ORM.
- **Database**: SQLite (Local Dev) / PostgreSQL (Production).

---

## 🛠️ Local Development Setup

To run AetherFlow locally, follow these simple commands:

### Prerequisites
- Node.js (v16.x or higher)
- NPM (v8.x or higher)

### 1. Installation
Clone the repository and install all dependencies (for Root, Server, and Client) with a single command:
```bash
npm run install:all
```
This triggers monorepo-wide installations in server and client directories concurrently.

### 2. Launch Development Servers
Run both backend Express API and Vite React frontend in development mode:
```bash
# In one terminal tab: Start Backend on Port 5000
npm run dev:server

# In another terminal tab: Start Frontend on Port 3000
npm run dev:client
```
The frontend is pre-configured with a Vite server proxy to route all `/api/*` endpoints to the Express port seamlessly, bypassing any CORS bottlenecks.

---

## 🌐 Railway Production Deployment

This monorepo is engineered to deploy to **Railway** as a single service. The backend server automatically builds, packs, and hosts the frontend assets.

### How it Works:
1. **Build Step**: Root `package.json` triggers client compilation (`npm run build:client`) which outputs optimized HTML/JS/CSS into `client/dist`.
2. **Serving**: The Express server automatically serves the built folder as static assets.
3. **Database Autodetect**: If Railway provides a `DATABASE_URL` environment variable, Sequelize automatically spins up a PostgreSQL connection with SSL enabled. Otherwise, it defaults to a local SQLite file database.

### Env Variables Checklist:
When deploying, make sure to set:
- `PORT` (e.g. `5000`, Railway injects this automatically)
- `JWT_SECRET` (A strong random string for signing login sessions)
- `DATABASE_URL` (Provision a **Railway PostgreSQL** service and link it)

---

## 📂 Project Structure

```text
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Dashboard, Projects, Tasks, Auth
│   │   ├── context/        # AuthSession & toast triggers
│   │   ├── App.jsx         # Layout Router
│   │   ├── main.jsx        # DOM Mount
│   │   └── index.css       # Design System tokens & CSS definitions
│   └── vite.config.js      # Proxy router configuration
│
├── server/                 # Express Backend API
│   ├── config/             # DB & Sequelize Switcher
│   ├── controllers/        # Auth, Projects, Tasks logic
│   ├── middleware/         # JWT verification & RBAC locks
│   ├── models/             # Sequelize schemas (User, Project, Task)
│   └── index.js            # Main entrypoint
│
└── package.json            # Orchestrator & Deployment config
```
