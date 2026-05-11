#!/usr/bin/env bash
# =============================================================================
# AICryptoBot Deployment Script
# Usage: ./infrastructure/scripts/deploy.sh [dev|staging|prod]
# =============================================================================

set -euo pipefail

ENV="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
error() { echo "[ERROR] $*" >&2; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "docker not found"
command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 || error "docker compose not found"

[ -f "$ROOT_DIR/.env" ] || error ".env file not found. Copy .env.example to .env and fill in values."

# ── Load env ──────────────────────────────────────────────────────────────────
set -a
source "$ROOT_DIR/.env"
set +a

# ── Environment-specific config ───────────────────────────────────────────────
case "$ENV" in
  dev)
    log "Deploying in DEVELOPMENT mode"
    COMPOSE_ARGS="-f docker-compose.yml -f docker-compose.dev.yml"
    ;;
  staging)
    log "Deploying in STAGING mode"
    COMPOSE_ARGS="-f docker-compose.yml -f docker-compose.staging.yml"
    ;;
  prod)
    log "Deploying in PRODUCTION mode"
    COMPOSE_ARGS="-f docker-compose.yml"
    ;;
  *)
    error "Unknown environment: $ENV (use dev|staging|prod)"
    ;;
esac

cd "$ROOT_DIR"

# ── Build images ──────────────────────────────────────────────────────────────
log "Building Docker images..."
docker compose $COMPOSE_ARGS build --parallel

# ── Database migration ────────────────────────────────────────────────────────
log "Running database migrations..."
docker compose $COMPOSE_ARGS up -d postgres redis
sleep 5
docker compose $COMPOSE_ARGS exec -T postgres psql -U "${DATABASE_USER}" -d "${DATABASE_NAME}" \
  -f /docker-entrypoint-initdb.d/001_init.sql 2>/dev/null || true

# ── Start services ────────────────────────────────────────────────────────────
log "Starting services..."
docker compose $COMPOSE_ARGS up -d

# ── Health checks ─────────────────────────────────────────────────────────────
log "Waiting for services to be healthy..."
timeout 120 bash -c 'until curl -sf http://localhost:3001/api/v1/health >/dev/null 2>&1; do sleep 2; done'
log "Backend: OK"

timeout 60 bash -c 'until curl -sf http://localhost:3000 >/dev/null 2>&1; do sleep 2; done'
log "Frontend: OK"

timeout 90 bash -c 'until curl -sf http://localhost:8000/health >/dev/null 2>&1; do sleep 2; done'
log "AI Engine: OK"

log "Deployment complete!"
log "Frontend: http://localhost:3000"
log "Backend:  http://localhost:3001/api/docs"
log "AI Docs:  http://localhost:8000/docs"
