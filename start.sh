#!/bin/bash

# ============================================
# AI Home Renovation Project Manager - Startup
# ============================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║   🏠 AI Home Renovation Project Manager     ║"
echo "║        Starting Application...               ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Clean up ports ----
echo -e "${YELLOW}🔧 Cleaning up ports 3000 and 3001...${NC}"
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}✅ Ports cleared${NC}"

# ---- Check PostgreSQL ----
echo -e "${YELLOW}🐘 Checking PostgreSQL...${NC}"
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

if pg_isready -q 2>/dev/null; then
  echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
  echo -e "${RED}❌ PostgreSQL is not running. Please start it manually.${NC}"
  exit 1
fi

# ---- Create database if not exists ----
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'home_renovation'" 2>/dev/null | grep -q 1 || \
  createdb home_renovation 2>/dev/null || true
echo -e "${GREEN}✅ Database ready${NC}"

# ---- Install backend dependencies ----
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# ---- Install frontend dependencies ----
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# ---- Seed database ----
echo -e "${YELLOW}🌱 Seeding database...${NC}"
cd "$PROJECT_DIR/server"
node seed.js
echo -e "${GREEN}✅ Database seeded${NC}"

# ---- Start backend with auto-reload ----
echo -e "${BLUE}🚀 Starting backend (port 3001) with auto-reload...${NC}"
cd "$PROJECT_DIR/server"
npx nodemon index.js &
BACKEND_PID=$!
sleep 2

# ---- Start frontend with auto-reload ----
echo -e "${BLUE}🚀 Starting frontend (port 3000) with auto-reload...${NC}"
cd "$PROJECT_DIR/client"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!

# ---- Cleanup on exit ----
cleanup() {
  echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
  echo -e "${GREEN}✅ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 Application Started Successfully!      ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║   Frontend: ${CYAN}http://localhost:3000${GREEN}             ║${NC}"
echo -e "${GREEN}║   Backend:  ${CYAN}http://localhost:3001${GREEN}             ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║   📧 Demo: john@example.com / password123   ║${NC}"
echo -e "${GREEN}║                                              ║${NC}"
echo -e "${GREEN}║   Press Ctrl+C to stop                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Wait for processes
wait
