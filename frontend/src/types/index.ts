// ─── Core Domain Types ───────────────────────────────────────────────────────

export type ExchangeId =
  | 'binance' | 'bybit' | 'okx' | 'kucoin' | 'kraken'
  | 'coinbase' | 'bitget' | 'mexc' | 'gate';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit';
export type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
export type PositionSide = 'long' | 'short' | 'both';
export type MarketType = 'spot' | 'futures' | 'margin';
export type TradingMode = 'live' | 'paper';
export type StrategyType = 'scalping' | 'swing' | 'dca' | 'grid' | 'sniper' | 'arbitrage';
export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  avatar?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  license?: License;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  defaultExchange: ExchangeId;
  defaultMarket: MarketType;
  tradingMode: TradingMode;
  riskLevel: RiskLevel;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  telegram: boolean;
  discord: boolean;
  push: boolean;
  sms: boolean;
}

// ─── License ─────────────────────────────────────────────────────────────────

export type LicensePlan = 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'trial';

export interface License {
  id: string;
  key: string;
  plan: LicensePlan;
  status: LicenseStatus;
  activatedAt: string;
  expiresAt: string;
  maxDevices: number;
  activeDevices: number;
  features: LicenseFeatures;
}

export interface LicenseFeatures {
  liveTrading: boolean;
  aiModels: string[];
  maxExchanges: number;
  maxBots: number;
  backtesting: boolean;
  advancedAnalytics: boolean;
  copyTrading: boolean;
  apiAccess: boolean;
}

// ─── Exchange ─────────────────────────────────────────────────────────────────

export interface ExchangeConnection {
  id: string;
  exchangeId: ExchangeId;
  label: string;
  isActive: boolean;
  isVerified: boolean;
  permissions: string[];
  balances?: Record<string, AssetBalance>;
  createdAt: string;
}

export interface AssetBalance {
  free: number;
  locked: number;
  total: number;
  usdValue: number;
}

// ─── Trading Bot ──────────────────────────────────────────────────────────────

export interface TradingBot {
  id: string;
  name: string;
  exchangeId: ExchangeId;
  symbol: string;
  marketType: MarketType;
  strategy: StrategyType;
  mode: TradingMode;
  isRunning: boolean;
  config: BotConfig;
  stats: BotStats;
  createdAt: string;
}

export interface BotConfig {
  positionSize: number;
  positionSizeType: 'fixed' | 'percentage';
  maxPositions: number;
  stopLoss: number;
  takeProfit: number;
  trailingStop?: number;
  leverage?: number;
  aiConfidenceThreshold: number;
  aiModels: string[];
  indicators: IndicatorConfig[];
  riskLevel: RiskLevel;
  maxDailyLoss: number;
  maxDrawdown: number;
}

export interface BotStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  runningDays: number;
}

export interface IndicatorConfig {
  name: string;
  params: Record<string, number>;
  enabled: boolean;
}

// ─── Orders & Positions ───────────────────────────────────────────────────────

export interface Order {
  id: string;
  clientOrderId: string;
  exchangeOrderId: string;
  botId?: string;
  exchangeId: ExchangeId;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: number;
  quantity: number;
  filledQuantity: number;
  avgFillPrice?: number;
  fee: number;
  feeCurrency: string;
  mode: TradingMode;
  aiValidation?: AIValidationResult;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  exchangeId: ExchangeId;
  symbol: string;
  side: PositionSide;
  marketType: MarketType;
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage?: number;
  liquidationPrice?: number;
  marginType?: 'isolated' | 'cross';
  mode: TradingMode;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIValidationResult {
  approved: boolean;
  overallConfidence: number;
  validations: ModelValidation[];
  reasoning: string;
  riskScore: number;
  sentimentScore: number;
  recommendation: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  timestamp: string;
}

export interface ModelValidation {
  model: string;
  provider: string;
  confidence: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  latencyMs: number;
  weight?: number;
}

export interface AIInsight {
  id: string;
  type: 'market_analysis' | 'trade_suggestion' | 'risk_alert' | 'learning_update';
  symbol?: string;
  content: string;
  confidence: number;
  timestamp: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PortfolioSnapshot {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  breakdown: ExchangeBalance[];
  timestamp: string;
}

export interface ExchangeBalance {
  exchangeId: ExchangeId;
  totalValue: number;
  assets: AssetBalance[];
}

export interface PerformanceMetrics {
  period: '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
  totalReturn: number;
  winRate: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  totalTrades: number;
  avgTradeReturn: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingTime: number;
}

// ─── Market Data ─────────────────────────────────────────────────────────────

export interface Ticker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeUsd24h: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertType = 'price' | 'indicator' | 'trade' | 'risk' | 'system' | 'ai';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  symbol?: string;
  isRead: boolean;
  channels: string[];
  createdAt: string;
}

// ─── Backtesting ─────────────────────────────────────────────────────────────

export interface BacktestConfig {
  strategy: StrategyType;
  symbol: string;
  exchangeId: ExchangeId;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  botConfig: BotConfig;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  metrics?: PerformanceMetrics;
  trades?: BacktestTrade[];
  equityCurve?: { time: number; value: number }[];
  createdAt: string;
  completedAt?: string;
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  holdingHours: number;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export interface WSMessage<T = unknown> {
  event: string;
  data: T;
  timestamp: number;
}

export type WSEventType =
  | 'ticker.update'
  | 'order.update'
  | 'position.update'
  | 'portfolio.update'
  | 'bot.status'
  | 'ai.signal'
  | 'alert.new'
  | 'trade.executed';
