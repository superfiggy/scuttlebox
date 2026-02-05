#!/bin/bash

# Scuttlebox Development Starter
# Starts both backend and frontend in development mode

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🎱 Starting Scuttlebox..."

# Check if Python venv exists
if [ ! -d "$PROJECT_DIR/backend/venv" ]; then
    echo "📦 Setting up Python virtual environment..."
    cd "$PROJECT_DIR/backend"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source "$PROJECT_DIR/backend/venv/bin/activate"
fi

# Check if node_modules exists
if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd "$PROJECT_DIR/frontend"
    npm install
fi

# Start backend in background
echo "🐍 Starting backend on http://localhost:8000..."
cd "$PROJECT_DIR/backend"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Give backend time to start
sleep 2

# Start frontend
echo "⚛️  Starting frontend on http://localhost:5173..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Scuttlebox is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Wait for either process to exit
wait
