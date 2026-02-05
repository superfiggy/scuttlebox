# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scuttlebox is a web interface for interacting with OpenClaw agents. It consists of a React frontend and Python FastAPI backend that proxies requests to an OpenClaw Gateway.

## Development Commands

### Initial Setup
```bash
./setup.sh      # Interactive setup (checks prereqs, configures gateway, creates .env)
./setup.sh -q   # Quick setup with defaults
```

### Quick Start
```bash
./start-dev.sh  # Starts both backend and frontend concurrently
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev      # Start dev server on port 5173
npm run build    # TypeScript check + production build
npm run lint     # ESLint with TypeScript rules
```

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript (strict), Vite, Tailwind CSS, Zustand, TanStack React Query
- **Backend**: FastAPI, Pydantic, httpx (async HTTP client)

### Directory Structure
```
frontend/src/
├── pages/           # 11 page components (Dashboard, Command, Tasks, Queue, Logs, etc.)
├── components/      # common/ (Button, Modal, Input), layout/ (MainLayout, Header, Sidebar)
├── stores/          # Zustand stores (assistantStore, uiStore, notificationStore)
├── api/             # Centralized API client with 40+ endpoints
├── types/           # TypeScript type definitions
└── styles/          # Custom CSS with glassmorphism effects, custom animations

backend/app/
├── main.py          # FastAPI app setup with CORS, lifespan events
├── config.py        # Pydantic settings from .env
├── routers/         # API routes: status, sessions, commands, files, config, cron, queue, logs
├── services/        # OpenClawClient (gateway proxy), FileService
└── models/          # Pydantic request/response schemas
```

### Key Patterns

**Frontend:**
- Path aliases: `@/` maps to `src/`
- API layer in `api/index.ts` - all backend calls go through named exports
- Zustand for global state, React Query for server state
- Custom Tailwind palette: `figgy-*`, `cyan-*`, `slate-*`

**Backend:**
- All routes prefixed with `/api/`
- `OpenClawClient` service proxies to OpenClaw Gateway on `localhost:18789`
- Async throughout using httpx AsyncClient
- Pydantic models for all request/response validation

### Gateway Integration

The backend is a proxy/adapter for OpenClaw Gateway. Key endpoints:
- `/api/status` - Agent status (busy/idle)
- `/api/command` - Send commands to agent (OpenAI-compatible chat format)
- `/api/files/*` - Workspace file operations (soul, user, memory files)
- `/api/cron/*` - Scheduled task management
- `/api/logs` - Chat history with search/filtering

## Environment Variables

Create `.env` in project root:
```
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your-token-here
OPENCLAW_WORKSPACE=/Users/username/.openclaw/workspace
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- OpenClaw running on `localhost:18789`
