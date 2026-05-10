# API Reference

Base URL: `https://api.aicryptobot.com/api/v1`

Interactive Swagger docs available at `/api/docs` (non-production environments).

## Authentication

All endpoints except `/auth/login` and `/auth/register` require Bearer JWT.

```http
Authorization: Bearer <access_token>
```

Tokens expire after 15 minutes. Use `/auth/refresh` to obtain a new token.

## Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new account |
| POST | `/auth/login` | Login and receive JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate session |
| POST | `/auth/2fa/enable` | Enable 2FA |
| POST | `/auth/2fa/confirm` | Confirm 2FA setup |

### Trading
| Method | Path | Description |
|--------|------|-------------|
| POST | `/trading/orders` | Place order (AI-validated) |
| GET | `/trading/orders` | List orders |
| GET | `/trading/positions` | Open positions |
| POST | `/trading/positions/:id/close` | Close position |
| GET | `/trading/bots` | List bots |
| POST | `/trading/bots` | Create bot |
| PATCH | `/trading/bots/:id/start` | Start bot |
| PATCH | `/trading/bots/:id/stop` | Stop bot |

### AI
| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/validate-trade` | Multi-model trade validation |
| GET | `/ai/insights` | Get AI insights |
| GET | `/ai/market-sentiment` | Market sentiment analysis |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/performance` | Performance metrics |
| GET | `/analytics/equity-curve` | Portfolio equity curve |

### Portfolio
| Method | Path | Description |
|--------|------|-------------|
| GET | `/portfolio/snapshot` | Current portfolio snapshot |

### Exchange
| Method | Path | Description |
|--------|------|-------------|
| GET | `/exchange/connections` | List connections |
| POST | `/exchange/connections` | Add exchange credentials |
| GET | `/exchange/connections/:id/balances` | Account balances |

### Admin (admin role required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/users` | User list |
| POST | `/admin/licenses` | Generate license key |
| PATCH | `/admin/licenses/:id/revoke` | Revoke license |

## WebSocket Events

Connect to `wss://api.aicryptobot.com` with `auth.token` in handshake.

### Subscribe to tickers
```json
{ "event": "subscribe.tickers", "data": { "symbols": ["BTC/USDT", "ETH/USDT"] } }
```

### Incoming events
| Event | Description |
|-------|-------------|
| `ticker.update` | Real-time price update |
| `order.update` | Order status change |
| `position.update` | Position PnL update |
| `trade.executed` | Trade confirmed |
| `ai.signal` | New AI market signal |
| `alert.new` | New alert notification |
