# AICryptoBot — Enterprise AI-Powered Crypto Trading Ecosystem

> Professional SaaS-grade automated crypto trading platform with AI multi-model validation, self-learning engines, and commercial licensing.

---

## Architecture Overview

```
aicryptobot/
├── frontend/          # Next.js 14 + TypeScript + TailwindCSS (UI)
├── backend/           # NestJS REST + WebSocket API
├── ai-engine/         # Python FastAPI AI/ML microservices
├── database/          # PostgreSQL schemas & migrations
├── infrastructure/    # Docker, Kubernetes, NGINX
└── docs/              # Full documentation
```

## Quick Start (Docker Compose)

```bash
cp .env.example .env       # Fill in your secrets
docker compose up -d       # Spin up the full stack
open http://localhost:3000  # Frontend
open http://localhost:3001  # Backend API
open http://localhost:8000  # AI Engine
```

## Documentation

- [Architecture](docs/architecture/README.md)
- [API Reference](docs/api/README.md)
- [Deployment Guide](docs/deployment/README.md)

## Exchange Support

Binance · Bybit · OKX · KuCoin · Kraken · Coinbase · Bitget · MEXC · Gate.io

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion |
| Backend | NestJS, Node.js, WebSocket, JWT, Redis |
| AI Engine | Python, FastAPI, TensorFlow, PyTorch, Claude API |
| Database | PostgreSQL, Redis, TimescaleDB |
| Infrastructure | Docker, Kubernetes, NGINX, GitHub Actions |

---

**Risk Disclaimer:** Crypto trading carries significant financial risk. Past performance does not guarantee future results. This software does not provide financial advice. Always trade responsibly.
