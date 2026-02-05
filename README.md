# Scuttlebox 📦

A web interface for interacting with your OpenClaw agent.

## Features

- **Status Dashboard**: See when your agent is busy or idle
- **Direct Commands**: Issue commands to your agent
- **Soul Editor**: View and modify SOUL.md (agent personality)
- **User Profile**: View and modify USER.md (your context)
- **Memory Management**: Browse and edit memory files
- **Context Files**: Add/edit additional context files
- **Settings**: Configure OpenClaw gateway settings
- **Server Admin**: Restart, update, and manage the gateway

## Quick Start

### Prerequisites

- **Node.js 18+** - [nodejs.org](https://nodejs.org/) or `brew install node`
- **Python 3.11+** - [python.org](https://python.org/) or `brew install python@3.11`
- **OpenClaw** - `npm install -g openclaw` (must be configured and running)

### Setup

Run the interactive setup script:

```bash
./setup.sh
```

This will:
1. ✓ Check all prerequisites
2. ✓ Verify OpenClaw gateway is running
3. ✓ Configure required gateway settings (Chat Completions API)
4. ✓ Create your `.env` file with proper credentials
5. ✓ Install all dependencies (Python + Node.js)
6. ✓ Verify the setup is complete

#### Quick Setup (Non-Interactive)

For automated setups or if you've already configured OpenClaw:

```bash
./setup.sh --quick
```

### Running

After setup, start both servers:

```bash
./start-dev.sh
```

Then open: **http://localhost:5173**

## OpenClaw Gateway Requirements

Scuttlebox requires the following gateway settings:

### 1. Chat Completions API (Required)

Enable the OpenAI-compatible chat endpoint in `~/.openclaw/openclaw.json`:

```json5
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

Or via CLI:
```bash
openclaw config set gateway.http.endpoints.chatCompletions.enabled true
openclaw gateway restart
```

### 2. Gateway Auth Token (Required)

Set a gateway authentication token:

```json5
{
  "gateway": {
    "auth": {
      "token": "your-secure-token-here"
    }
  }
}
```

Or via environment:
```bash
export OPENCLAW_GATEWAY_TOKEN="your-secure-token-here"
```

The setup script will help configure both of these automatically.

## Environment Variables

The `.env` file (created by setup.sh) contains:

```env
# OpenClaw Gateway URL (default: http://localhost:18789)
OPENCLAW_GATEWAY_URL=http://localhost:18789

# Gateway authentication token (must match gateway config)
OPENCLAW_GATEWAY_TOKEN=your-token-here

# Path to your OpenClaw workspace
OPENCLAW_WORKSPACE=/Users/yourname/.openclaw/workspace

# CORS origins for the backend API
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Manual Setup

If you prefer to set up manually:

### Backend (Python FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

## Architecture

```
scuttlebox/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── api/
│   └── ...
├── backend/           # Python FastAPI
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   └── models/
│   └── ...
├── setup.sh           # Interactive setup script
└── start-dev.sh       # Development server launcher
```

## Security Considerations

Scuttlebox is designed for **local development use**. Before deploying or exposing to a network, review these considerations:

### Default Security Posture (Safe)

- ✅ OpenClaw gateway binds to `localhost:18789` only (not network-accessible)
- ✅ Backend API runs on `localhost:8000` only
- ✅ Frontend dev server runs on `localhost:5173` only
- ✅ Gateway API requires bearer token authentication
- ✅ CORS restricts requests to localhost origins

### What to Watch

| Risk | Description | Mitigation |
|------|-------------|------------|
| **`.env` contains token** | Gateway token stored in plaintext | Don't commit to git, don't share |
| **Backend has no auth** | Anyone who can reach port 8000 can control your agent | Keep localhost-only, or add auth before exposing |
| **Workspace file access** | Portal can read/write all workspace files | Don't store secrets in workspace |
| **Gateway bind mode** | If changed to `lan`/`tailnet`, APIs become network-accessible | Keep `loopback` unless you understand the implications |

### Don't Do

- ❌ Expose the backend (port 8000) to the network without adding authentication
- ❌ Change `gateway.bind` to `lan` or public without reviewing [gateway security docs](https://docs.openclaw.ai/gateway/security)
- ❌ Store sensitive credentials in workspace files
- ❌ Commit `.env` to version control

### Production Use

If you want to expose Scuttlebox beyond localhost:

1. Add authentication to the FastAPI backend (OAuth, API keys, etc.)
2. Use HTTPS (reverse proxy with TLS)
3. Restrict CORS origins to your domain
4. Consider running in an isolated environment

## Troubleshooting

### Gateway not running

```bash
# Check status
openclaw gateway status

# Start the gateway
openclaw gateway start

# Or run in foreground for debugging
openclaw gateway run --verbose
```

### Connection refused

1. Verify the gateway is running: `openclaw gateway status`
2. Check your `.env` has the correct `OPENCLAW_GATEWAY_URL`
3. Ensure the `OPENCLAW_GATEWAY_TOKEN` matches your gateway config

### Chat Completions not working

Ensure the endpoint is enabled:
```bash
openclaw config get gateway.http.endpoints.chatCompletions.enabled
# Should return: true
```

If not:
```bash
openclaw config set gateway.http.endpoints.chatCompletions.enabled true
openclaw gateway restart
```

## API Reference

The backend proxies requests to OpenClaw's HTTP APIs:

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Agent status (busy/idle) |
| `GET /api/sessions` | List sessions |
| `POST /api/command` | Send command to agent |
| `GET /api/files/{path}` | Read workspace file |
| `PUT /api/files/{path}` | Write workspace file |
| `GET /api/config` | Get gateway config |
| `PATCH /api/config` | Update gateway config |
| `GET /api/cron` | List scheduled jobs |
| `POST /api/cron` | Create scheduled job |

## License

MIT
