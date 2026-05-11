# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 20+ (for local development)
- Python 3.11+ (for AI engine development)

## Quick Start (Docker Compose)

```bash
# 1. Clone and configure
git clone https://github.com/your-org/aicryptobot.git
cd aicryptobot
cp .env.example .env
# Edit .env with your API keys and secrets

# 2. Start the full stack
./infrastructure/scripts/deploy.sh dev

# 3. Access the app
open http://localhost:3000
# Default admin: admin@aicryptobot.com / ChangeMe123!
```

## Environment Variables

See `.env.example` for the complete list. Required at minimum:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | 64+ character JWT signing secret |
| `ENCRYPTION_KEY` | 32-byte hex key for API credential encryption |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `ANTHROPIC_API_KEY` | Claude API key for AI validation |
| `OPENAI_API_KEY` | OpenAI API key |
| `LICENSE_MASTER_KEY` | Master key for license generation |

## Production Kubernetes Deploy

```bash
# 1. Build and push images
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/your-org/aicryptobot-backend:latest \
  --push ./backend

# 2. Create namespace and secrets
kubectl create namespace aicryptobot
kubectl create secret generic aicryptobot-secrets \
  --from-env-file=.env -n aicryptobot

# 3. Apply manifests
kubectl apply -f infrastructure/kubernetes/configmaps/
kubectl apply -f infrastructure/kubernetes/deployments/
kubectl apply -f infrastructure/kubernetes/services/
kubectl apply -f infrastructure/kubernetes/ingress/

# 4. Monitor
kubectl get pods -n aicryptobot -w
```

## First-Time Setup

1. Login as superadmin: `admin@aicryptobot.com`
2. Change default password immediately
3. Generate license keys in Admin Panel → Licensing
4. Add exchange connections in Settings → Exchanges
5. Create your first bot in AI Bots → Create Bot
6. Start in Paper Trading mode to validate setup

## Backup Strategy

```bash
# Database backup
docker compose exec postgres pg_dump \
  -U $DATABASE_USER $DATABASE_NAME \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore
gunzip -c backup.sql.gz | docker compose exec -T postgres \
  psql -U $DATABASE_USER $DATABASE_NAME
```

## Risk Disclaimer

This software is for educational and informational purposes only. Crypto trading carries significant risk. Always test thoroughly in Paper Trading mode before enabling Live Trading.
