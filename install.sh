#!/bin/bash
# WarrDash Install Script
# Run this on a fresh Ubuntu/Debian LXC with Docker already installed
# Usage: bash install.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/opt/warrdash"
DATA_DIR="/data"
FRONTEND_PORT="3000"
BACKEND_PORT="3001"

banner() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║          WarrDash Installer              ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${CYAN}──── $1 ────${NC}"; }

banner

# ── Root check ─────────────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  error "Please run as root: sudo bash install.sh"
fi

# ── Dependencies ───────────────────────────────────────────────────────────────
step "Checking dependencies"

if ! command -v docker &>/dev/null; then
  warn "Docker not found. Installing..."
  curl -fsSL https://get.docker.com | sh
  success "Docker installed"
else
  success "Docker found: $(docker --version)"
fi

if ! command -v node &>/dev/null; then
  warn "Node.js not found. Installing..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  success "Node.js installed: $(node --version)"
else
  success "Node.js found: $(node --version)"
fi

if ! command -v git &>/dev/null; then
  apt-get install -y git
fi

# ── Directories ────────────────────────────────────────────────────────────────
step "Creating directories"
mkdir -p "$INSTALL_DIR/frontend"
mkdir -p "$INSTALL_DIR/backend"
mkdir -p "$DATA_DIR"
success "Directories created at $INSTALL_DIR"

# ── Clone / copy source ────────────────────────────────────────────────────────
step "Setting up source"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ]; then
  info "Copying source files to $INSTALL_DIR..."
  cp -r "$SCRIPT_DIR/frontend/." "$INSTALL_DIR/frontend/"
  cp -r "$SCRIPT_DIR/backend/."  "$INSTALL_DIR/backend/"
  success "Source files copied"
fi

# ── Backend ────────────────────────────────────────────────────────────────────
step "Installing backend dependencies"
cd "$INSTALL_DIR/backend"
npm install
npm install imapflow mailparser nodemailer
success "Backend dependencies installed (including email packages)"

# ── Frontend ───────────────────────────────────────────────────────────────────
step "Building frontend"
cd "$INSTALL_DIR/frontend"
npm install
npm run build
success "Frontend built"

# ── Stop existing containers ───────────────────────────────────────────────────
step "Stopping existing containers (if any)"
docker stop warrdash-frontend warrdash-backend 2>/dev/null && info "Stopped existing containers" || true
docker rm   warrdash-frontend warrdash-backend 2>/dev/null || true

# ── Backend container ──────────────────────────────────────────────────────────
step "Starting backend container"
docker run -d \
  --name warrdash-backend \
  --restart unless-stopped \
  -p 127.0.0.1:${BACKEND_PORT}:3001 \
  -v "$INSTALL_DIR/backend:/app" \
  -v "$DATA_DIR:/data" \
  -w /app \
  node:20-alpine \
  node server.js

success "Backend container started"

# Wait for backend to be ready
info "Waiting for backend..."
for i in $(seq 1 15); do
  if curl -s http://localhost:${BACKEND_PORT}/api/health &>/dev/null; then
    success "Backend is responding"
    break
  fi
  sleep 1
done

# ── Frontend container ─────────────────────────────────────────────────────────
step "Starting frontend container"
docker run -d \
  --name warrdash-frontend \
  --restart unless-stopped \
  -p ${FRONTEND_PORT}:80 \
  nginx:alpine

docker cp "$INSTALL_DIR/frontend/dist/." warrdash-frontend:/usr/share/nginx/html/
success "Frontend container started"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        WarrDash installed!               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Detect LAN IP
LAN_IP=$(hostname -I | awk '{print $1}')

echo -e "  Dashboard: ${CYAN}http://${LAN_IP}:${FRONTEND_PORT}${NC}"
echo -e "  Config:    ${CYAN}${DATA_DIR}/config.json${NC}"
echo -e "  Source:    ${CYAN}${INSTALL_DIR}${NC}"
echo ""
echo -e "  ${YELLOW}Note:${NC} Email widget requires packages already installed."
echo -e "  ${YELLOW}Note:${NC} See docs/PBS_SETUP.md for PBS token permissions."
echo ""
