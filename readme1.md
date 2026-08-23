# 🐍 PyGit — Full-Stack Version Control Platform

[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**PyGit** is a lightweight, full-stack version control platform featuring a **Python Git Engine**, a **FastAPI REST API**, and a modern **React + Vite Web Dashboard**. It implements Git core mechanisms (object hashing, staging index, commit trees, branching, merging, rebasing, and remote push) completely from scratch using SHA-256 and zlib compression.

---

## 🏗️ Architecture & Project Structure

The codebase is organized as a clean full-stack repository:

```text
gitclone/                                ← Project Root
│
├── pygitbackend/                        ← 🐍 Python Backend (FastAPI + Core Engine)
│   ├── main.py                          ← CLI entry point (`python main.py`)
│   ├── cli.py                           ← Argparse command dispatcher
│   ├── server.py                        ← FastAPI REST API server (`python server.py`)
│   ├── repository.py                    ← Core Git engine (`Repository` class)
│   ├── models.py                        ← Git objects (`Blob`, `Tree`, `Gitobject`)
│   ├── pyproject.toml                   ← Package build configuration
│   ├── requirements.txt                 ← Python dependencies
│   ├── repos/                           ← Managed repositories directory
│   └── tests/                           ← Pytest test suite
│       ├── test_repository.py           ← Engine & storage tests
│       ├── test_branch_workflow.py      ← Branching & merge workflow tests
│       └── exceptions.py                ← Domain exception hierarchy
│
├── pygit-frontend/                      ← ⚛️ React Frontend (Vite + Tailwind CSS)
│   ├── index.html                       ← Single-Page App HTML entry
│   ├── package.json                     ← Dependencies & scripts
│   ├── vite.config.js                   ← Vite configuration & dev proxy
│   ├── tailwind.config.js               ← Tailwind CSS design system
│   ├── postcss.config.js                ← PostCSS pipeline
│   └── src/
│       ├── main.jsx                     ← Application bootstrap
│       ├── App.jsx                      ← App routing setup
│       ├── index.css                    ← Tailwind directives & custom CSS
│       ├── pages/                       ← App views (Dashboard, Repository, Commits, Branches)
│       ├── components/                  ← Modular UI components (FileExplorer, ReadmeViewer, CommitModal)
│       ├── layouts/                     ← Dashboard layout shell
│       ├── services/                    ← Axios API service & fallback handlers
│       ├── hooks/                       ← Custom React hooks (`useRepository`, `useCommits`)
│       └── utils/                       ← Helper functions & formatters
│
├── .env.example                         ← Environment variables template
├── .gitignore                           ← Workspace Git ignore rules
├── README.md                            ← Original PyGit Core Documentation
└── readme1.md                           ← Full-Stack Setup & Architecture Guide
```

---

## ✨ Key Features

### 🚀 Core Git Engine (CLI & Python Library)
- **Zero External Runtime Dependencies** for core Git commands.
- **SHA-256 Hashing**: Enhanced security replacement for standard SHA-1.
- **zlib Compression**: Identical object store structure (`objects/xx/xxxx...`).
- **Human-Readable Staging Area**: Stored as JSON in `.pygit/index`.
- **Atomic Operations**: Safe disk writes using temporary `.tmp` files.

### 🌐 FastAPI REST API
- 17 REST endpoints for full repository lifecycle management.
- Dynamic repository initialization, commit inspection, tree navigation, and file retrieval.
- Integrated CORS middleware allowing full web client interactions.

### 💻 Modern Web Dashboard
- **Repository Overview**: Search repos, view README previews, browse code files with formatted size & type icons.
- **Commit History**: Visual log with SHA copying and relative timestamps.
- **Branch Management**: Create, switch, rename, and delete branches dynamically.
- **Staging & Commit Modal**: Stage files (`pygit add`) and make commits (`pygit commit`) directly from the UI.
- **Dark Mode UI**: GitHub-inspired dark interface powered by Tailwind CSS.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | React 18 | Declarative component UI |
| | Vite 5 | Lightning-fast dev server & bundler |
| | Tailwind CSS 3 | Utility-first styling with GitHub dark theme |
| | React Router 6 | SPA routing |
| | Axios | HTTP API communications |
| | Lucide React | Icon library |
| **Backend** | Python 3.9+ | High-performance backend language |
| | FastAPI | Modern, fast REST API framework |
| | Uvicorn | ASGI server implementation |
| | Pydantic v2 | Data validation and API contracts |
| **Storage** | File System | Raw `.pygit/` directory storage (no SQL database needed) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.9 or higher
- **Node.js**: 18.0 or higher
- **npm** or **yarn** or **pnpm**

---

### 1. Backend Setup (FastAPI Server)

```bash
# Navigate to the backend directory
cd pygitbackend

# Create a Python virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
python server.py
```
> The API server will launch at: **`http://localhost:8000`**  
> Interactive API Documentation (Swagger): **`http://localhost:8000/docs`**

---

### 2. Frontend Setup (React Dashboard)

Open a new terminal window:

```bash
# Navigate to the frontend directory
cd pygit-frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
> The web application will launch at: **`http://localhost:3000`**

---

## 🔐 Environment Variables

The project uses `.env.example` as a template for configuration.

Create a `.env` file in the root directory:

```bash
# Copy template to .env
cp .env.example .env
```

### `.env.example` contents:

```env
# ==========================================
# PyGit Environment Configuration Template
# ==========================================

# Backend Configuration (FastAPI)
HOST=0.0.0.0
PORT=8000
REPOS_DIR=repos

# Frontend Configuration (Vite)
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📡 API Reference Overview

| HTTP Method | Endpoint | Description |
|-------------|----------|-------------|
| `GET` | `/api/repositories` | List all PyGit repositories |
| `POST` | `/api/repositories` | Create a new repository |
| `GET` | `/api/repositories/{name}` | Get repo summary statistics |
| `GET` | `/api/repositories/{name}/files` | File explorer (supports sub-paths) |
| `GET` | `/api/repositories/{name}/blob/{branch}/{path}` | View file contents & commit info |
| `GET` | `/api/repositories/{name}/readme` | Fetch README content |
| `GET` | `/api/repositories/{name}/commits` | Fetch commit history |
| `GET` | `/api/repositories/{name}/branches` | List all local branches |
| `POST` | `/api/repositories/{name}/branches` | Create a branch |
| `POST` | `/api/repositories/{name}/checkout` | Switch active branch |
| `DELETE` | `/api/repositories/{name}/branches/{branch}` | Delete a branch |
| `POST` | `/api/repositories/{name}/branches/rename` | Rename branch |
| `GET` | `/api/repositories/{name}/status` | Check staged & untracked files |
| `POST` | `/api/repositories/{name}/add` | Stage files (`pygit add`) |
| `POST` | `/api/repositories/{name}/commit` | Commit staged files (`pygit commit`) |
| `GET` | `/api/repositories/{name}/remotes` | Get configured remotes |
| `POST` | `/api/repositories/{name}/push` | Push branch to remote |

---

## 🧪 Running Backend Unit Tests

```bash
cd pygitbackend

# Run tests with Python unittest
python -m unittest discover -s tests

# Or run with Pytest (if dev dependencies are installed)
pytest
```

---

## 🔮 Future Improvements

- [ ] **3-Way Merge Engine**: Enhance `pygit merge` to support automatic 3-way merging with common ancestor detection.
- [ ] **Diff Viewer Component**: Integrated side-by-side visual diff viewer in the React frontend.
- [ ] **Authentication & JWT**: Add user login, multi-user workspace access, and token authentication.
- [ ] **WebSockets**: Real-time push and commit notifications across active dashboard sessions.
- [ ] **Dockerization**: Complete `docker-compose.yml` for single-command full-stack container deployment.

---

<p align="center">
  Crafted for education and clean version control architecture 🚀
</p>
