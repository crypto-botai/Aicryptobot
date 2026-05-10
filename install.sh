#!/usr/bin/env bash
# =============================================================================
#  AICryptoBot — One-Click Installer
#  Run:  chmod +x install.sh && ./install.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()     { echo -e "${GREEN}[✓]${NC} $*"; }
info()    { echo -e "${BLUE}[→]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
error()   { echo -e "${RED}[✗]${NC} $*"; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${NC}"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─────────────────────────────────────────────────────────────────────────────
section "AICryptoBot Installer"
echo -e "  Version  : ${BOLD}1.0.0${NC}"
echo -e "  Directory: ${ROOT_DIR}"
echo -e "  Date     : $(date -u '+%Y-%m-%d %H:%M UTC')"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
section "Checking Prerequisites"

command -v docker >/dev/null 2>&1 || error "Docker not found. Install from https://docs.docker.com/get-docker/"
log "Docker $(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)"

if docker compose version >/dev/null 2>&1; then
  log "Docker Compose $(docker compose version --short 2>/dev/null || echo 'v2')"
elif docker-compose version >/dev/null 2>&1; then
  log "Docker Compose $(docker-compose version --short)"
else
  error "Docker Compose not found. Install from https://docs.docker.com/compose/install/"
fi

command -v curl >/dev/null 2>&1 || error "curl not found"
log "curl $(curl --version | head -1 | awk '{print $2}')"

# ─────────────────────────────────────────────────────────────────────────────
section "Environment Setup"

if [ -f "$ROOT_DIR/.env" ]; then
  log ".env already exists — using existing configuration"
else
  if [ -f "$ROOT_DIR/.env.example" ]; then
    warn ".env not found — copying from .env.example (you must edit it with real API keys)"
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"

    # Auto-generate secrets
    info "Auto-generating cryptographic secrets..."
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    ENCRYPTION_IV=$(openssl rand -hex 8)
    DB_PASSWORD=$(openssl rand -base64 18 | tr -d '=+/' | head -c 20)
    REDIS_PASSWORD=$(openssl rand -base64 18 | tr -d '=+/' | head -c 20)
    API_SECRET=$(openssl rand -hex 24)
    AI_ENGINE_KEY=$(openssl rand -hex 24)
    LICENSE_MASTER=$(openssl rand -hex 32)
    LICENSE_ENC=$(openssl rand -hex 32)

    sed -i "s|CHANGE_ME_JWT_SECRET_64_CHARS_MIN|${JWT_SECRET}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_REFRESH_SECRET|${JWT_REFRESH_SECRET}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_32_BYTE_HEX_KEY|${ENCRYPTION_KEY}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_16_BYTE_IV|${ENCRYPTION_IV}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_DB_PASSWORD|${DB_PASSWORD}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_REDIS_PASSWORD|${REDIS_PASSWORD}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_STRONG_SECRET_32_CHARS_MIN|${API_SECRET}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_INTERNAL_SECRET|${AI_ENGINE_KEY}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_LICENSE_MASTER_KEY|${LICENSE_MASTER}|g" "$ROOT_DIR/.env"
    sed -i "s|CHANGE_ME_LICENSE_ENC|${LICENSE_ENC}|g" "$ROOT_DIR/.env"

    warn "Edit .env and add your ANTHROPIC_API_KEY and OPENAI_API_KEY before continuing!"
    read -p "Press ENTER once you've updated .env, or Ctrl+C to abort..."
  else
    error ".env file missing. Cannot continue."
  fi
fi

# Load and validate required keys
set -a; source "$ROOT_DIR/.env"; set +a

MISSING=0
for VAR in ANTHROPIC_API_KEY OPENAI_API_KEY JWT_SECRET ENCRYPTION_KEY DATABASE_PASSWORD; do
  if [ -z "${!VAR:-}" ] || [[ "${!VAR}" == CHANGE_ME* ]]; then
    warn "Missing or placeholder: $VAR"
    MISSING=$((MISSING+1))
  fi
done
[ $MISSING -gt 0 ] && error "$MISSING required variable(s) not set in .env"
log "All required environment variables present"

# ─────────────────────────────────────────────────────────────────────────────
section "Building Docker Images"

cd "$ROOT_DIR"

info "Building all service images (this takes 3–8 minutes on first run)..."
if docker compose version >/dev/null 2>&1; then
  docker compose build --parallel 2>&1 | grep -E "^(#|\[|\=|Step|Successfully|ERROR)" || true
else
  docker-compose build --parallel 2>&1 | grep -E "^(#|\[|\=|Step|Successfully|ERROR)" || true
fi
log "Images built"

# ─────────────────────────────────────────────────────────────────────────────
section "Starting Database & Cache"

info "Starting PostgreSQL (TimescaleDB) and Redis..."
docker compose up -d postgres redis 2>/dev/null || docker-compose up -d postgres redis

info "Waiting for PostgreSQL to be ready..."
timeout 60 bash -c '
  until docker compose exec -T postgres pg_isready -U "${DATABASE_USER:-aicryptobot}" >/dev/null 2>&1; do
    sleep 2
  done
' 2>/dev/null || \
timeout 60 bash -c '
  until docker-compose exec -T postgres pg_isready -U "${DATABASE_USER:-aicryptobot}" >/dev/null 2>&1; do
    sleep 2
  done
'
log "PostgreSQL ready"

info "Running database schema migrations..."
docker compose exec -T postgres psql \
  -U "${DATABASE_USER:-aicryptobot}" \
  -d "${DATABASE_NAME:-aicryptobot}" \
  -f /docker-entrypoint-initdb.d/001_init.sql 2>/dev/null || \
docker-compose exec -T postgres psql \
  -U "${DATABASE_USER:-aicryptobot}" \
  -d "${DATABASE_NAME:-aicryptobot}" \
  -f /docker-entrypoint-initdb.d/001_init.sql 2>/dev/null || \
warn "Migration already applied or schema file not yet mounted — skipping"
log "Database schema ready"

# ─────────────────────────────────────────────────────────────────────────────
section "Starting All Services"

info "Bringing up backend, AI engine, frontend, and NGINX..."
docker compose up -d 2>/dev/null || docker-compose up -d
log "All containers started"

# ─────────────────────────────────────────────────────────────────────────────
section "Health Checks"

info "Waiting for backend API..."
if timeout 120 bash -c 'until curl -sf http://localhost:3001/api/v1/health >/dev/null 2>&1; do sleep 3; done'; then
  log "Backend API   → http://localhost:3001/api/v1/health"
else
  warn "Backend did not respond in time — check: docker compose logs backend"
fi

info "Waiting for frontend..."
if timeout 90 bash -c 'until curl -sf http://localhost:3000 >/dev/null 2>&1; do sleep 3; done'; then
  log "Frontend      → http://localhost:3000"
else
  warn "Frontend did not respond — check: docker compose logs frontend"
fi

info "Waiting for AI engine..."
if timeout 90 bash -c 'until curl -sf http://localhost:8000/health >/dev/null 2>&1; do sleep 3; done'; then
  log "AI Engine     → http://localhost:8000/docs"
else
  warn "AI engine did not respond — check: docker compose logs ai-engine"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "Telegram Bot Test"

if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  info "Sending Telegram startup notification..."
  MSG="🚀 *AICryptoBot Started*%0A%0A✅ Platform is live%0A📊 Dashboard: http://localhost:3000%0A🤖 API Docs: http://localhost:3001/api/docs%0A⏰ $(date -u '+%Y-%m-%d %H:%M UTC')"
  curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}&text=${MSG}&parse_mode=Markdown" \
    >/dev/null 2>&1 && log "Telegram notification sent" || warn "Telegram notification failed (token may be wrong)"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "Installation Complete!"

echo ""
echo -e "  ${BOLD}${GREEN}🎉 AICryptoBot is running!${NC}"
echo ""
echo -e "  ${BOLD}URLs:${NC}"
echo -e "  ${CYAN}▸ Dashboard   ${NC}→ http://localhost:3000"
echo -e "  ${CYAN}▸ API Docs    ${NC}→ http://localhost:3001/api/docs"
echo -e "  ${CYAN}▸ AI Engine   ${NC}→ http://localhost:8000/docs"
echo -e "  ${CYAN}▸ Preview     ${NC}→ http://localhost:3000/preview"
echo ""
echo -e "  ${BOLD}Default Admin Login:${NC}"
echo -e "  ${CYAN}▸ Email   ${NC}→ admin@aicryptobot.com"
echo -e "  ${CYAN}▸ Password${NC}→ ChangeMe123!"
echo ""
echo -e "  ${YELLOW}⚠  Change the admin password immediately after first login!${NC}"
echo ""
echo -e "  ${BOLD}Useful Commands:${NC}"
echo -e "  ${CYAN}▸ Logs     ${NC}→ docker compose logs -f [backend|frontend|ai-engine]"
echo -e "  ${CYAN}▸ Stop     ${NC}→ docker compose down"
echo -e "  ${CYAN}▸ Restart  ${NC}→ docker compose restart"
echo -e "  ${CYAN}▸ Status   ${NC}→ docker compose ps"
echo ""
