# AICryptoBot Architecture

## System Overview

```
                    ┌─────────────────────────────────────────────────┐
                    │                   NGINX Proxy                   │
                    │         (SSL termination, rate limiting)        │
                    └──────────┬─────────────────┬────────────────────┘
                               │                 │
              ┌────────────────▼──┐          ┌───▼────────────────────┐
              │   Next.js 14      │          │    NestJS Backend       │
              │   Frontend        │◄────────►│    REST + WebSocket     │
              │   (React, TS,     │          │    API                  │
              │   TailwindCSS,    │          └─────┬──────────┬────────┘
              │   Framer Motion)  │                │          │
              └───────────────────┘           ┌───▼──┐  ┌────▼────────┐
                                              │ Redis │  │ PostgreSQL  │
                                              │ Cache │  │ TimescaleDB │
                                              └───────┘  └─────────────┘
                                                              │
                                           ┌──────────────────▼───────────┐
                                           │    Python FastAPI AI Engine  │
                                           │                              │
                                           │  ┌──────┐ ┌──────┐ ┌──────┐ │
                                           │  │Claude│ │ GPT  │ │Gemini│ │
                                           │  └──────┘ └──────┘ └──────┘ │
                                           │  ┌──────────────────────────┐ │
                                           │  │ Technical + Risk + News  │ │
                                           │  │       Validators         │ │
                                           │  └──────────────────────────┘ │
                                           │  ┌──────────────────────────┐ │
                                           │  │   Self-Learning Engine   │ │
                                           │  └──────────────────────────┘ │
                                           └──────────────────────────────┘
```

## Module Architecture

### Frontend (Next.js 14)
- **App Router** with server/client components
- **Zustand** for global state (auth, tickers, alerts)
- **TanStack Query** for server state and caching
- **Socket.IO client** for real-time updates
- **Lightweight Charts** for TradingView-grade charting
- **Framer Motion** for premium animations

### Backend (NestJS)
| Module | Responsibility |
|--------|---------------|
| `auth` | JWT + 2FA authentication |
| `trading` | Order placement, bot management, position tracking |
| `exchange` | CCXT multi-exchange integration with encrypted credentials |
| `ai` | Multi-model validation orchestration |
| `licensing` | Commercial license key generation and validation |
| `analytics` | Performance metrics, equity curves |
| `risk` | Pre-trade risk checks, daily loss limits, emergency stop |
| `alerts` | Real-time alert dispatch |
| `admin` | Platform management, user control |
| `websocket` | Socket.IO gateway for real-time events |
| `backtesting` | Strategy backtesting engine |

### AI Engine (FastAPI)
| Service | Responsibility |
|---------|---------------|
| `TechnicalValidator` | RSI, MACD, EMA, Bollinger Band analysis |
| `RiskValidator` | Position sizing and exposure risk scoring |
| `NewsValidator` | Real-time news sentiment analysis |
| `SentimentService` | Multi-source market sentiment aggregation |
| `LearningService` | Self-learning from trade outcomes |
| `MarketPredictor` | ML ensemble price direction prediction |
| `AgentCoordinator` | Multi-agent consensus coordination |

## Security Architecture

1. **API Keys**: AES-256-CBC encrypted at rest, never returned in API responses
2. **JWT**: Short-lived access tokens (15m) + refresh tokens (7d)
3. **2FA**: TOTP-based (speakeasy) with QR code enrollment
4. **Rate Limiting**: Per-endpoint throttling (NestJS Throttler + NGINX)
5. **Input Validation**: Class-validator whitelist on all DTOs
6. **Audit Logs**: All sensitive actions logged to TimescaleDB
7. **License Enforcement**: HMAC-signed license keys with device fingerprinting

## Data Flow: Trade Execution

```
User places order
    │
    ▼
1. LicenseGuard    — verify active license
    │
    ▼
2. RiskService     — check daily loss, max positions, leverage
    │
    ▼
3. AiService       — parallel multi-model validation:
    │                  Claude API (30% weight)
    │                  GPT-4o (25% weight)
    │                  Technical AI (20% weight)
    │                  Risk AI (15% weight)
    │                  News AI (10% weight)
    │
    ▼
4. Confidence >= threshold? ──No──► Reject with reasoning
    │ Yes
    ▼
5. Bull Queue      — async order execution
    │
    ▼
6. Exchange (CCXT) — paper trade or live order
    │
    ▼
7. WebSocket       — real-time update to frontend
    │
    ▼
8. AI Learning     — record outcome for model improvement
```
