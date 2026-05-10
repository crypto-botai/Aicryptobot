-- =============================================================================
-- AICryptoBot Database Schema — PostgreSQL + TimescaleDB
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- =============================================================================
-- USERS & AUTH
-- =============================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50)  UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'admin', 'superadmin')),
    is_active       BOOLEAN NOT NULL DEFAULT false,
    two_factor_enabled  BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret   TEXT,
    avatar          VARCHAR(500),
    telegram_chat_id    VARCHAR(50),
    telegram_username   VARCHAR(100),
    preferences     JSONB,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- =============================================================================
-- LICENSES
-- =============================================================================

CREATE TABLE licenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key             VARCHAR(50) UNIQUE NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_email  VARCHAR(255),
    plan            VARCHAR(20) NOT NULL
                        CHECK (plan IN ('monthly', 'quarterly', 'biannual', 'annual', 'enterprise')),
    status          VARCHAR(20) NOT NULL DEFAULT 'unused'
                        CHECK (status IN ('active', 'expired', 'suspended', 'trial', 'unused')),
    activated_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    max_devices     INT NOT NULL DEFAULT 1,
    active_devices  INT NOT NULL DEFAULT 0,
    features        JSONB,
    notes           TEXT,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_status  ON licenses(status);
CREATE INDEX idx_licenses_key     ON licenses(key);

CREATE TABLE license_activations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id          UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint  VARCHAR(64) NOT NULL,
    device_name         VARCHAR(200),
    ip_address          INET,
    user_agent          TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    last_seen_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(license_id, device_fingerprint)
);

-- =============================================================================
-- EXCHANGE CONNECTIONS (encrypted credentials)
-- =============================================================================

CREATE TABLE exchange_connections (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange_id             VARCHAR(30) NOT NULL,
    label                   VARCHAR(100),
    api_key_encrypted       TEXT NOT NULL,
    api_secret_encrypted    TEXT NOT NULL,
    passphrase_encrypted    TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    is_verified             BOOLEAN NOT NULL DEFAULT false,
    permissions             JSONB,
    last_verified_at        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exchange_conn_user ON exchange_connections(user_id, exchange_id);

-- =============================================================================
-- TRADING BOTS
-- =============================================================================

CREATE TABLE bots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    exchange_id VARCHAR(30) NOT NULL,
    symbol      VARCHAR(20) NOT NULL,
    market_type VARCHAR(10) NOT NULL CHECK (market_type IN ('spot', 'futures', 'margin')),
    strategy    VARCHAR(20) NOT NULL
                    CHECK (strategy IN ('scalping', 'swing', 'dca', 'grid', 'sniper', 'arbitrage')),
    mode        VARCHAR(10) NOT NULL DEFAULT 'paper' CHECK (mode IN ('live', 'paper')),
    is_running  BOOLEAN NOT NULL DEFAULT false,
    config      JSONB NOT NULL DEFAULT '{}',
    stats       JSONB NOT NULL DEFAULT '{}',
    started_at  TIMESTAMPTZ,
    stopped_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bots_user_id    ON bots(user_id);
CREATE INDEX idx_bots_is_running ON bots(is_running);

-- =============================================================================
-- ORDERS
-- =============================================================================

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_order_id     VARCHAR(50) UNIQUE NOT NULL,
    exchange_order_id   VARCHAR(100),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bot_id              UUID REFERENCES bots(id) ON DELETE SET NULL,
    exchange_id         VARCHAR(30) NOT NULL,
    symbol              VARCHAR(20) NOT NULL,
    side                VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
    type                VARCHAR(15) NOT NULL
                            CHECK (type IN ('market', 'limit', 'stop_market', 'stop_limit')),
    status              VARCHAR(20) NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'filled', 'partially_filled', 'cancelled', 'rejected')),
    price               NUMERIC(20, 8) NOT NULL DEFAULT 0,
    quantity            NUMERIC(20, 8) NOT NULL,
    filled_quantity     NUMERIC(20, 8) NOT NULL DEFAULT 0,
    avg_fill_price      NUMERIC(20, 8),
    fee                 NUMERIC(20, 8) NOT NULL DEFAULT 0,
    fee_currency        VARCHAR(10),
    mode                VARCHAR(10) NOT NULL DEFAULT 'paper' CHECK (mode IN ('live', 'paper')),
    ai_validation       JSONB,
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id  ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_symbol   ON orders(symbol, status);
CREATE INDEX idx_orders_bot_id   ON orders(bot_id);

-- =============================================================================
-- POSITIONS
-- =============================================================================

CREATE TABLE positions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bot_id              UUID REFERENCES bots(id) ON DELETE SET NULL,
    exchange_id         VARCHAR(30) NOT NULL,
    symbol              VARCHAR(20) NOT NULL,
    side                VARCHAR(5) NOT NULL CHECK (side IN ('long', 'short', 'both')),
    market_type         VARCHAR(10) NOT NULL CHECK (market_type IN ('spot', 'futures', 'margin')),
    size                NUMERIC(20, 8) NOT NULL,
    entry_price         NUMERIC(20, 8) NOT NULL,
    mark_price          NUMERIC(20, 8),
    pnl                 NUMERIC(20, 8) NOT NULL DEFAULT 0,
    pnl_percent         NUMERIC(10, 4) NOT NULL DEFAULT 0,
    leverage            NUMERIC(5, 2),
    liquidation_price   NUMERIC(20, 8),
    stop_loss           NUMERIC(20, 8),
    take_profit         NUMERIC(20, 8),
    trailing_stop       NUMERIC(10, 4),
    mode                VARCHAR(10) NOT NULL DEFAULT 'paper' CHECK (mode IN ('live', 'paper')),
    status              VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_at           TIMESTAMPTZ,
    closed_pnl          NUMERIC(20, 8),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_positions_user_id ON positions(user_id, status);
CREATE INDEX idx_positions_symbol  ON positions(symbol, exchange_id);

-- =============================================================================
-- AI VALIDATIONS (for learning)
-- =============================================================================

CREATE TABLE trade_validations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    bot_id              UUID REFERENCES bots(id) ON DELETE SET NULL,
    symbol              VARCHAR(20) NOT NULL,
    side                VARCHAR(4) NOT NULL,
    result              JSONB NOT NULL,
    approved            BOOLEAN NOT NULL DEFAULT false,
    overall_confidence  NUMERIC(5, 4) NOT NULL,
    trade_outcome       VARCHAR(10) CHECK (trade_outcome IN ('win', 'loss', 'breakeven')),
    outcome_pnl         NUMERIC(20, 8),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_validations_symbol ON trade_validations(symbol, created_at DESC);
CREATE INDEX idx_validations_user   ON trade_validations(user_id);

-- Convert to TimescaleDB hypertable for time-series queries
SELECT create_hypertable('trade_validations', 'created_at', if_not_exists => TRUE);

-- =============================================================================
-- AI INSIGHTS
-- =============================================================================

CREATE TABLE ai_insights (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL
                    CHECK (type IN ('market_analysis', 'trade_suggestion', 'risk_alert', 'learning_update')),
    symbol      VARCHAR(20),
    content     TEXT NOT NULL,
    confidence  NUMERIC(5, 4) NOT NULL DEFAULT 0.5,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insights_user_id ON ai_insights(user_id, created_at DESC);

-- =============================================================================
-- ALERTS
-- =============================================================================

CREATE TABLE alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL
                    CHECK (type IN ('price', 'indicator', 'trade', 'risk', 'system', 'ai')),
    severity    VARCHAR(10) NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info', 'warning', 'critical')),
    title       VARCHAR(200) NOT NULL,
    message     TEXT NOT NULL,
    symbol      VARCHAR(20),
    is_read     BOOLEAN NOT NULL DEFAULT false,
    channels    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id  ON alerts(user_id, is_read);
CREATE INDEX idx_alerts_severity ON alerts(severity, created_at DESC);

-- =============================================================================
-- RISK SETTINGS
-- =============================================================================

CREATE TABLE risk_settings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_daily_loss_percent  NUMERIC(5, 2) NOT NULL DEFAULT 5,
    max_position_size_pct   NUMERIC(5, 2) NOT NULL DEFAULT 10,
    max_drawdown_percent    NUMERIC(5, 2) NOT NULL DEFAULT 20,
    max_open_positions      INT NOT NULL DEFAULT 10,
    max_leverage            NUMERIC(5, 1) NOT NULL DEFAULT 10,
    emergency_stop          BOOLEAN NOT NULL DEFAULT false,
    pause_on_volatility     BOOLEAN NOT NULL DEFAULT true,
    volatility_threshold    NUMERIC(5, 2) NOT NULL DEFAULT 15,
    daily_pnl               NUMERIC(20, 8) NOT NULL DEFAULT 0,
    daily_reset_at          TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- BACKTESTS
-- =============================================================================

CREATE TABLE backtests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    config      JSONB NOT NULL,
    status      VARCHAR(10) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    progress    NUMERIC(5, 2),
    metrics     JSONB,
    trades      JSONB,
    equity_curve JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_backtests_user_id ON backtests(user_id, created_at DESC);

-- =============================================================================
-- MARKET DATA (TimescaleDB hypertable)
-- =============================================================================

CREATE TABLE market_candles (
    time        TIMESTAMPTZ NOT NULL,
    symbol      VARCHAR(20) NOT NULL,
    exchange_id VARCHAR(30) NOT NULL,
    interval    VARCHAR(5) NOT NULL,
    open        NUMERIC(20, 8) NOT NULL,
    high        NUMERIC(20, 8) NOT NULL,
    low         NUMERIC(20, 8) NOT NULL,
    close       NUMERIC(20, 8) NOT NULL,
    volume      NUMERIC(30, 8) NOT NULL,
    PRIMARY KEY (time, symbol, exchange_id, interval)
);

SELECT create_hypertable('market_candles', 'time', if_not_exists => TRUE);
SELECT add_retention_policy('market_candles', INTERVAL '2 years', if_not_exists => TRUE);

-- =============================================================================
-- AUDIT LOGS (compliance)
-- =============================================================================

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id   ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity    ON audit_logs(entity_type, entity_id);

SELECT create_hypertable('audit_logs', 'created_at', if_not_exists => TRUE);

-- =============================================================================
-- TRIGGERS: auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','licenses','exchange_connections','bots','orders','positions','risk_settings','backtests']
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        ', t, t);
    END LOOP;
END
$$;

-- =============================================================================
-- SEED: default superadmin (password: ChangeMe123!)
-- =============================================================================

INSERT INTO users (email, username, password_hash, role, is_active)
VALUES (
    'admin@aicryptobot.com',
    'superadmin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeOLwHZjAz3iUqhVm',
    'superadmin',
    true
) ON CONFLICT DO NOTHING;

-- Grant superadmin a trial license
INSERT INTO licenses (key, assigned_email, plan, status, features, max_devices)
SELECT
    'ENT-ADMN-FREE-0001-MASTER',
    'admin@aicryptobot.com',
    'enterprise',
    'active',
    '{"liveTrading":true,"aiModels":["claude","gpt","gemini","deepseek"],"maxExchanges":9,"maxBots":-1,"backtesting":true,"advancedAnalytics":true,"copyTrading":true,"apiAccess":true}'::jsonb,
    99
WHERE NOT EXISTS (SELECT 1 FROM licenses WHERE key = 'ENT-ADMN-FREE-0001-MASTER');
