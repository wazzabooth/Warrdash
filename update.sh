#!/bin/bash
# WarrDash Update Script
# Pulls latest from git, rebuilds frontend, restarts backend
# Usage: bash update.sh
#        bash update.sh --skip-frontend   (backend only)
#        bash update.sh --skip-backend    (frontend only)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/opt/warrdash"
DATA_DIR="/data"
SKIP_FRONTEND=false
SKIP_BACKEND=false

for arg in "$@"; do
  case $arg in
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-backend)  SKIP_BACKEND=true  ;;
    --help)
      echo "Usage: bash update.sh [--skip-frontend] [--skip-backend]"
      exit 0 ;;
  esac
done

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${CYAN}──── $1 ────${NC}"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          WarrDash Update                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Root check ─────────────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  error "Please run as root: sudo bash update.sh"
fi

if [ ! -d "$INSTALL_DIR" ]; then
  error "WarrDash not found at $INSTALL_DIR. Run install.sh first."
fi

# ── Backup config ──────────────────────────────────────────────────────────────
step "Backing up config"
BACKUP_FILE="${DATA_DIR}/config.backup.$(date +%Y%m%d-%H%M%S).json"
if [ -f "${DATA_DIR}/config.json" ]; then
  cp "${DATA_DIR}/config.json" "$BACKUP_FILE"
  success "Config backed up to $BACKUP_FILE"
else
  warn "No config.json found — nothing to back up"
fi

# ── Git pull ───────────────────────────────────────────────────────────────────
step "Pulling latest from git"
cd "$INSTALL_DIR"
if git rev-parse --git-dir &>/dev/null; then
  BEFORE=$(git rev-parse --short HEAD)
  git pull
  AFTER=$(git rev-parse --short HEAD)
  if [ "$BEFORE" = "$AFTER" ]; then
    warn "Already up to date ($AFTER) — continuing anyway"
  else
    success "Updated $BEFORE → $AFTER"
    git log --oneline "$BEFORE".."$AFTER" | sed 's/^/  /'
  fi
else
  warn "Not a git repo — skipping pull. Copy files manually then run again."
fi

# ── Save current backend from container before overwriting ─────────────────────
step "Saving current backend state"
if docker ps -q -f name=warrdash-backend | grep -q .; then
  docker cp warrdash-backend:/app/server.js "$INSTALL_DIR/backend/server.js.container-backup" 2>/dev/null || true
  info "Container server.js backed up to server.js.container-backup"
fi

# ── Backend update ─────────────────────────────────────────────────────────────
if [ "$SKIP_BACKEND" = false ]; then
  step "Updating backend"
  cd "$INSTALL_DIR/backend"

  # Install any new npm packages
  npm install
  # Ensure email packages are present
  npm list imapflow &>/dev/null || npm install imapflow mailparser nodemailer
  success "Backend packages up to date"

  # Copy updated server.js into running container
  if docker ps -q -f name=warrdash-backend | grep -q .; then
    docker cp "$INSTALL_DIR/backend/server.js" warrdash-backend:/app/server.js
    docker restart warrdash-backend
    success "Backend container restarted"

    # Wait for backend
    info "Waiting for backend..."
    for i in $(seq 1 15); do
      if curl -s http://localhost:3001/api/health &>/dev/null 2>&1; then
        success "Backend is responding"
        break
      fi
      sleep 1
      if [ "$i" = "15" ]; then
        warn "Backend health check timed out — check: docker logs warrdash-backend"
      fi
    done
  else
    warn "warrdash-backend container not running. Start it with:"
    warn "  docker start warrdash-backend"
  fi
else
  info "Skipping backend update (--skip-backend)"
fi

# ── Frontend build & deploy ────────────────────────────────────────────────────
if [ "$SKIP_FRONTEND" = false ]; then
  step "Building and deploying frontend"
  cd "$INSTALL_DIR/frontend"

  # Install any new npm packages
  npm install
  success "Frontend packages up to date"

  # Build
  npm run build
  success "Frontend built"

  # Deploy to container
  if docker ps -q -f name=warrdash-frontend | grep -q .; then
    docker cp dist/. warrdash-frontend:/usr/share/nginx/html/
    success "Frontend deployed to container"
  else
    warn "warrdash-frontend container not running. Start it with:"
    warn "  docker start warrdash-frontend"
  fi
else
  info "Skipping frontend update (--skip-frontend)"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Update complete!                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

LAN_IP=$(hostname -I | awk '{print $1}')
echo -e "  Dashboard:  ${CYAN}http://${LAN_IP}:3000${NC}"
echo -e "  Config:     ${CYAN}${DATA_DIR}/config.json${NC}"
echo -e "  Backup:     ${CYAN}${BACKUP_FILE}${NC}"
echo ""
echo -e "  ${YELLOW}Tip:${NC} Hard refresh browser with Ctrl+Shift+R to clear cache"
echo ""
