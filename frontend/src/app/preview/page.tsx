'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, TrendingUp, TrendingDown, DollarSign, Activity,
  Zap, Shield, Brain, BarChart2, Settings, Play, Pause,
  ChevronUp, ChevronDown, CheckCircle, XCircle, Clock,
  AlertTriangle, Cpu, Globe, Lock, Eye, EyeOff,
} from 'lucide-react';

/* ─── Mock Data ─────────────────────────────────────── */
const BOTS = [
  { id: '1', name: 'Alpha Trend Hunter', symbol: 'BTC/USDT', strategy: 'Trend Following', status: 'running', pnl: 2847.5, pnlPct: 12.4, trades: 142, winRate: 68, exchange: 'Binance', timeframe: '1h', mode: 'live' },
  { id: '2', name: 'ETH Scalper Pro', symbol: 'ETH/USDT', strategy: 'Scalping', status: 'running', pnl: 1234.8, pnlPct: 8.7, trades: 387, winRate: 72, exchange: 'Bybit', timeframe: '5m', mode: 'live' },
  { id: '3', name: 'Mean Rev Bot', symbol: 'SOL/USDT', strategy: 'Mean Reversion', status: 'paused', pnl: -143.2, pnlPct: -2.1, trades: 58, winRate: 52, exchange: 'OKX', timeframe: '15m', mode: 'paper' },
  { id: '4', name: 'Arb Matrix', symbol: 'BNB/USDT', strategy: 'Arbitrage', status: 'running', pnl: 892.3, pnlPct: 5.6, trades: 904, winRate: 81, exchange: 'KuCoin', timeframe: '1m', mode: 'live' },
];

const AI_MODELS = [
  { name: 'Claude 3.5', weight: 30, signal: 'BUY', confidence: 87, icon: '🧠' },
  { name: 'GPT-4o', weight: 25, signal: 'BUY', confidence: 79, icon: '⚡' },
  { name: 'Technical AI', weight: 20, signal: 'BUY', confidence: 91, icon: '📊' },
  { name: 'Risk AI', weight: 15, signal: 'HOLD', confidence: 62, icon: '🛡️' },
  { name: 'News AI', weight: 10, signal: 'BUY', confidence: 74, icon: '📰' },
];

const POSITIONS = [
  { symbol: 'BTC/USDT', side: 'LONG', size: 0.15, entry: 62450, current: 67820, pnl: 805.5, pnlPct: 8.6 },
  { symbol: 'ETH/USDT', side: 'LONG', size: 2.4, entry: 3280, current: 3542, pnl: 628.8, pnlPct: 8.0 },
  { symbol: 'SOL/USDT', side: 'SHORT', size: 12, entry: 185, current: 171, pnl: 168.0, pnlPct: 7.6 },
];

const CHART_POINTS = [42000, 44200, 43100, 46800, 45200, 48900, 47300, 51200, 49800, 53400, 52100, 55600, 54200, 58100, 56800, 60200, 58900, 62450, 61200, 64800, 63500, 67820];

/* ─── Sub-components ─────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, color = 'indigo', positive }: any) {
  const colors: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
  };
  const iconColors: Record<string, string> = {
    indigo: 'text-indigo-400', emerald: 'text-emerald-400', rose: 'text-rose-400', amber: 'text-amber-400',
  };
  return (
    <motion.div whileHover={{ y: -2 }} className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-white/5 ${iconColors[color]}`}><Icon size={18} /></div>
        {positive !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {positive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{positive ? '+' : ''}{sub}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </motion.div>
  );
}

function MiniChart() {
  const max = Math.max(...CHART_POINTS);
  const min = Math.min(...CHART_POINTS);
  const w = 280; const h = 80;
  const pts = CHART_POINTS.map((v, i) => {
    const x = (i / (CHART_POINTS.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#chartGrad)" />
      <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BotCard({ bot }: { bot: typeof BOTS[0] }) {
  const isRunning = bot.status === 'running';
  const isProfit = bot.pnl >= 0;
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 20px 40px rgba(99,102,241,0.15)' }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-white font-semibold text-sm">{bot.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{bot.symbol}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">{bot.strategy}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${bot.mode === 'live' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>{bot.mode}</span>
          </div>
        </div>
        <div className={`text-right ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
          <div className="font-bold text-lg">{isProfit ? '+' : ''}${bot.pnl.toLocaleString()}</div>
          <div className="text-xs">{isProfit ? '+' : ''}{bot.pnlPct}%</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['Exchange', bot.exchange], ['Timeframe', bot.timeframe], ['Trades', bot.trades]].map(([k, v]) => (
          <div key={k} className="text-center bg-white/5 rounded-lg py-2">
            <div className="text-white text-sm font-semibold">{v}</div>
            <div className="text-slate-500 text-xs">{k}</div>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Win Rate</span>
          <span className="text-emerald-400 font-medium">{bot.winRate}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${bot.winRate}%` }} transition={{ delay: 0.3, duration: 0.8 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <button className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
          isRunning ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
        }`}>
          {isRunning ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs font-medium">
          <BarChart2 size={12} /> Stats
        </button>
        <button className="px-3 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-rose-400 transition-colors">
          <Settings size={12} />
        </button>
      </div>
    </motion.div>
  );
}

function AIValidation() {
  const overall = 83;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">AI Multi-Model Validation</h3>
          <p className="text-xs text-slate-400 mt-0.5">BTC/USDT · LONG · $5,000</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{overall}%</div>
          <div className="text-xs text-slate-400">Confidence</div>
        </div>
      </div>
      <div className="space-y-3 mb-4">
        {AI_MODELS.map((m, i) => (
          <motion.div key={m.name} onHoverStart={() => setHovered(i)} onHoverEnd={() => setHovered(null)}
            className="flex items-center gap-3 cursor-default">
            <span className="text-lg w-6">{m.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{m.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    m.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                    m.signal === 'SELL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>{m.signal}</span>
                  <span className="text-white font-medium">{m.confidence}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${m.confidence}%` }}
                  transition={{ delay: i * 0.1, duration: 0.7 }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              </div>
            </div>
            <span className="text-xs text-slate-500 w-8 text-right">{m.weight}%</span>
          </motion.div>
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
        <CheckCircle size={15} /> Execute Trade — 83% Confidence
      </motion.button>
    </div>
  );
}

function ExchangePanel() {
  const [show, setShow] = useState(false);
  const exchanges = [
    { name: 'Binance', color: '#F0B90B', connected: true, balance: '$48,234', status: 'verified' },
    { name: 'Bybit', color: '#F7A600', connected: true, balance: '$12,890', status: 'verified' },
    { name: 'OKX', color: '#000000', connected: false, balance: '—', status: 'disconnected' },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Exchange Connections</h3>
        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">2 Active</span>
      </div>
      <div className="space-y-3 mb-4">
        {exchanges.map(ex => (
          <div key={ex.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: ex.color === '#000000' ? 'linear-gradient(135deg,#333,#555)' : ex.color }}>
                {ex.name[0]}
              </div>
              <div>
                <div className="text-sm text-white font-medium">{ex.name}</div>
                <div className={`text-xs ${ex.connected ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {ex.connected ? '● Connected' : '○ Not connected'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white">{ex.balance}</div>
              {ex.connected && <div className="text-xs text-slate-400 flex items-center gap-1 justify-end"><Lock size={10} /> Encrypted</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="border border-dashed border-white/10 rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5"><Lock size={12} className="text-indigo-400" /> Add API Key — AES-256 Encrypted</div>
        <div className="space-y-2">
          <input placeholder="API Key" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
          <div className="relative">
            <input type={show ? 'text' : 'password'} placeholder="API Secret" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 pr-8" />
            <button onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
              {show ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </div>
        <button className="w-full mt-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors">Connect Exchange</button>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function PreviewPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bots' | 'trading' | 'settings'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">AICryptoBot</span>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">Enterprise</span>
        </div>
        <div className="flex gap-1">
          {(['dashboard', 'bots', 'trading', 'settings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-slate-400">Live</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">JD</div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Welcome back, John. Your portfolio is up 18.4% this month.</p>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatCard icon={DollarSign} label="Portfolio Value" value="$84,231" color="indigo" positive={true} sub="18.4% this month" />
              <StatCard icon={TrendingUp} label="Total P&L" value="+$14,820" color="emerald" positive={true} sub="12.4% ROI" />
              <StatCard icon={Bot} label="Active Bots" value="3 / 5" color="amber" />
              <StatCard icon={Activity} label="Win Rate" value="71.2%" color="indigo" positive={true} sub="7d avg" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Portfolio Performance</h3>
                  <div className="flex gap-2 text-xs">
                    {['1D','1W','1M','3M','All'].map(p => (
                      <button key={p} className={`px-2 py-1 rounded-lg ${p === '1M' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <MiniChart />
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block" /> Portfolio</span>
                  <span className="text-emerald-400 font-medium">+$14,820 (+21.4%)</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Brain size={14} className="text-purple-400" />AI Insights</h3>
                  {[
                    { text: 'BTC breakout above $64K confirmed by 4/5 AI models', type: 'buy' },
                    { text: 'ETH funding rate neutral — good entry window', type: 'info' },
                    { text: 'SOL overbought on 4H — consider reducing position', type: 'warn' },
                  ].map((ins, i) => (
                    <div key={i} className={`flex gap-2 p-2.5 rounded-lg mb-2 text-xs ${
                      ins.type === 'buy' ? 'bg-emerald-500/10 text-emerald-300' :
                      ins.type === 'warn' ? 'bg-amber-500/10 text-amber-300' : 'bg-indigo-500/10 text-indigo-300'
                    }`}>
                      {ins.type === 'buy' ? <CheckCircle size={12} className="mt-0.5 shrink-0" /> :
                       ins.type === 'warn' ? <AlertTriangle size={12} className="mt-0.5 shrink-0" /> :
                       <Zap size={12} className="mt-0.5 shrink-0" />}
                      {ins.text}
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h3 className="text-white font-semibold text-sm mb-3">Open Positions</h3>
                  {POSITIONS.slice(0, 2).map(p => (
                    <div key={p.symbol} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-xs text-white font-medium">{p.symbol}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${p.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{p.side}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-400 font-medium">+${p.pnl}</div>
                        <div className="text-xs text-slate-400">+{p.pnlPct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── BOTS ── */}
        {activeTab === 'bots' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">AI Trading Bots</h1>
                <p className="text-slate-400 text-sm mt-1">3 running · 1 paused · $4,831 combined P&L</p>
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25">
                <Bot size={15} /> Create New Bot
              </motion.button>
            </div>

            {/* Create bot form preview */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="col-span-1 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Bot size={14} className="text-indigo-400" />New Bot Configuration</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Bot Name', value: 'My Alpha Bot', type: 'text' },
                    { label: 'Trading Pair', value: 'BTC/USDT', type: 'select' },
                    { label: 'Exchange', value: 'Binance', type: 'select' },
                    { label: 'Strategy', value: 'Trend Following', type: 'select' },
                    { label: 'Position Size (USDT)', value: '500', type: 'number' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">{f.value}</div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-xs text-amber-300">Paper Trading Mode</span>
                    <div className="w-9 h-5 bg-amber-500 rounded-full relative"><div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full" /></div>
                  </div>
                  <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold">Launch Bot</button>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                {BOTS.map(bot => <BotCard key={bot.id} bot={bot} />)}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TRADING ── */}
        {activeTab === 'trading' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Trading Terminal</h1>
              <p className="text-slate-400 text-sm mt-1">Manual trading with AI validation on every order</p>
            </div>

            {/* Ticker */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
              {[
                { sym: 'BTC/USDT', price: '$67,820', change: '+3.2%', pos: true },
                { sym: 'ETH/USDT', price: '$3,542', change: '+1.8%', pos: true },
                { sym: 'SOL/USDT', price: '$171', change: '-0.4%', pos: false },
                { sym: 'BNB/USDT', price: '$412', change: '+2.1%', pos: true },
              ].map(t => (
                <div key={t.sym} className="shrink-0 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div>
                    <div className="text-xs text-slate-400">{t.sym}</div>
                    <div className="text-white font-semibold text-sm">{t.price}</div>
                  </div>
                  <span className={`text-xs font-medium ${t.pos ? 'text-emerald-400' : 'text-rose-400'}`}>{t.change}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Chart placeholder */}
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">BTC/USDT</span>
                    <span className="text-2xl font-bold text-white">$67,820</span>
                    <span className="text-emerald-400 text-sm font-medium">+3.2%</span>
                  </div>
                  <div className="flex gap-1 text-xs">
                    {['1m','5m','15m','1h','4h','1D'].map(t => (
                      <button key={t} className={`px-2 py-1 rounded ${t === '1h' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="h-64 relative overflow-hidden rounded-xl bg-slate-900/50">
                  <svg viewBox="0 0 400 200" className="w-full h-full">
                    {/* Grid lines */}
                    {[0,1,2,3,4].map(i => (
                      <line key={i} x1="0" y1={i*50} x2="400" y2={i*50} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    ))}
                    {/* Green candles */}
                    {[10,50,90,130,170,210,250,290,330,370].map((x, i) => {
                      const h = 20 + Math.random() * 40;
                      const y = 40 + Math.random() * 80;
                      const isGreen = i % 3 !== 1;
                      return (
                        <g key={x}>
                          <line x1={x+10} y1={y-10} x2={x+10} y2={y+h+10} stroke={isGreen ? '#10b981' : '#f43f5e'} strokeWidth="1.5" />
                          <rect x={x+4} y={y} width="12" height={h} fill={isGreen ? '#10b981' : '#f43f5e'} opacity="0.8" rx="1" />
                        </g>
                      );
                    })}
                    {/* Price line */}
                    <polyline points="0,160 40,140 80,120 120,130 160,100 200,90 240,70 280,80 320,60 360,50 400,40"
                      fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.6" />
                  </svg>
                  <div className="absolute top-3 right-3 text-xs bg-black/50 text-slate-400 px-2 py-1 rounded">TradingView-grade chart</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Order form */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex mb-4">
                    {['Buy / Long', 'Sell / Short'].map((side, i) => (
                      <button key={side} className={`flex-1 py-2 text-sm font-semibold rounded-xl ${
                        i === 0 ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white bg-white/5'
                      }`}>{side}</button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[['Amount (USDT)', '5000'], ['Leverage', '5x'], ['Stop Loss', '$64,000'], ['Take Profit', '$72,000']].map(([l, v]) => (
                      <div key={l}>
                        <label className="text-xs text-slate-400 block mb-1">{l}</label>
                        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">{v}</div>
                      </div>
                    ))}
                    <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2">
                      <Brain size={14} /> Validate with AI
                    </button>
                  </div>
                </div>
                <AIValidation />
              </div>
            </div>

            {/* Positions */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-white font-semibold mb-4">Open Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-slate-400 text-xs border-b border-white/10">
                    {['Symbol','Side','Size','Entry','Current','P&L','P&L%','Action'].map(h => (
                      <th key={h} className="pb-3 text-left font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {POSITIONS.map(p => (
                      <tr key={p.symbol} className="border-b border-white/5 last:border-0">
                        <td className="py-3 text-white font-medium">{p.symbol}</td>
                        <td><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{p.side}</span></td>
                        <td className="text-slate-300">{p.size}</td>
                        <td className="text-slate-300">${p.entry.toLocaleString()}</td>
                        <td className="text-white">${p.current.toLocaleString()}</td>
                        <td className="text-emerald-400 font-medium">+${p.pnl}</td>
                        <td className="text-emerald-400">+{p.pnlPct}%</td>
                        <td><button className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs hover:bg-rose-500/30">Close</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SETTINGS / EXCHANGE ── */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <ExchangePanel />
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Shield size={14} className="text-indigo-400" />Security</h3>
                  <div className="space-y-3">
                    {[
                      { label: '2FA Authentication', status: 'Enabled', ok: true },
                      { label: 'API Key Encryption', status: 'AES-256-CBC', ok: true },
                      { label: 'Login Notifications', status: 'Email alerts on', ok: true },
                      { label: 'Session Timeout', status: '15 min', ok: false },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-sm text-slate-300">{s.label}</span>
                        <span className={`text-xs font-medium ${s.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-white font-semibold mb-4">License</h3>
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-indigo-400 mb-1">Pro</div>
                    <div className="text-xs text-slate-400 mb-3">Valid until Dec 31, 2026</div>
                    <div className="space-y-2 text-xs text-left">
                      {['5 Trading Bots','All 9 Exchanges','AI Multi-Model','Paper + Live Trading','Priority Support'].map(f => (
                        <div key={f} className="flex items-center gap-2 text-slate-300"><CheckCircle size={12} className="text-emerald-400 shrink-0" />{f}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-white font-semibold mb-3 text-sm">Risk Settings</h3>
                  {[['Daily Loss Limit', '5%'], ['Max Positions', '10'], ['Max Leverage', '20x']].map(([l, v]) => (
                    <div key={l} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-xs">
                      <span className="text-slate-400">{l}</span>
                      <span className="text-white font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
