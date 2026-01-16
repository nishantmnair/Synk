#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║      Synk - Starting Everything      ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}\n"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo -e "${GREEN}🚀 Starting Backend Server...${NC}"
LOG_FILE="/tmp/synk_backend.log"
bash "$SCRIPT_DIR/start_backend.sh" > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
echo -e "${YELLOW}   Backend PID: $BACKEND_PID${NC}"
echo -e "${YELLOW}   Logs: tail -f $LOG_FILE${NC}\n"

# Wait for backend to start and check if it's listening on port 8000
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
MAX_WAIT=30
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running on port 8000${NC}\n"
        break
    fi
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend process died. Check logs:${NC}"
        echo -e "${YELLOW}   tail -30 $LOG_FILE${NC}"
        exit 1
    fi
    sleep 1
    WAITED=$((WAITED + 1))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Backend did not start in time. Check logs:${NC}"
    echo -e "${YELLOW}   tail -30 $LOG_FILE${NC}"
    echo -e "${YELLOW}   Trying to continue anyway...${NC}\n"
fi

# Start frontend
echo -e "${GREEN}🎨 Starting Frontend Server...${NC}"
cd "$SCRIPT_DIR/frontend" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}📡 Frontend will be available at: http://localhost:5173${NC}\n"
echo -e "${GREEN}✅ Backend is available at: http://localhost:8000${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Start frontend (this will block)
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
