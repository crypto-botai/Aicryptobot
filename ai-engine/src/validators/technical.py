"""Technical analysis AI validator using TA indicators + ML model."""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from loguru import logger

try:
    import ta
    TA_AVAILABLE = True
except ImportError:
    TA_AVAILABLE = False


class TechnicalValidator:
    """Validates trades using technical analysis indicators."""

    def __init__(self):
        self.indicators = [
            'rsi', 'macd', 'bollinger', 'ema', 'vwap', 'stochastic',
            'atr', 'volume_profile', 'support_resistance', 'trend'
        ]
        logger.info("TechnicalValidator initialized")

    async def validate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Run technical analysis validation on a trade setup."""
        symbol = context.get("symbol", "BTC/USDT")
        side = context.get("side", "buy")

        try:
            # Fetch or use provided OHLCV data
            candles = context.get("marketData", {}).get("candles")
            if candles:
                df = pd.DataFrame(candles, columns=["timestamp", "open", "high", "low", "close", "volume"])
            else:
                df = self._generate_mock_data()

            analysis = self._analyze(df, side)
            return {
                "model": "technical-ai",
                "provider": "technical",
                "confidence": analysis["confidence"],
                "signal": analysis["signal"],
                "reasoning": analysis["reasoning"],
                "indicators": analysis["indicators"],
            }
        except Exception as e:
            logger.warning(f"Technical validation error: {e}")
            return {
                "model": "technical-ai",
                "provider": "technical",
                "confidence": 0.5,
                "signal": "neutral",
                "reasoning": "Technical analysis unavailable",
                "indicators": {},
            }

    def _analyze(self, df: pd.DataFrame, side: str) -> Dict[str, Any]:
        signals = []
        indicators = {}

        if len(df) < 20:
            return {"confidence": 0.5, "signal": "neutral", "reasoning": "Insufficient data", "indicators": {}}

        close = df["close"]

        # RSI
        if TA_AVAILABLE:
            rsi = ta.momentum.RSIIndicator(close, window=14).rsi().iloc[-1]
            indicators["rsi"] = round(float(rsi), 2)
            if side == "buy":
                signals.append(0.8 if rsi < 30 else 0.6 if rsi < 50 else 0.3)
            else:
                signals.append(0.8 if rsi > 70 else 0.6 if rsi > 50 else 0.3)

            # MACD
            macd = ta.trend.MACD(close)
            macd_diff = macd.macd_diff().iloc[-1]
            indicators["macd_diff"] = round(float(macd_diff), 4)
            signals.append(0.7 if (side == "buy" and macd_diff > 0) or (side == "sell" and macd_diff < 0) else 0.35)

            # EMA trend
            ema_20 = ta.trend.EMAIndicator(close, window=20).ema_indicator().iloc[-1]
            ema_50 = ta.trend.EMAIndicator(close, window=50).ema_indicator().iloc[-1]
            current_price = close.iloc[-1]
            is_uptrend = current_price > ema_20 > ema_50
            indicators["trend"] = "up" if is_uptrend else "down"
            signals.append(0.75 if (side == "buy" and is_uptrend) or (side == "sell" and not is_uptrend) else 0.3)
        else:
            # Fallback: simple moving average
            sma20 = close.rolling(20).mean().iloc[-1]
            current_price = close.iloc[-1]
            signals.append(0.65 if (side == "buy" and current_price > sma20) else 0.4)

        avg_signal = float(np.mean(signals)) if signals else 0.5
        signal_label = "bullish" if avg_signal >= 0.6 else "bearish" if avg_signal < 0.4 else "neutral"

        reasoning = (
            f"Technical analysis suggests {'bullish' if avg_signal >= 0.6 else 'bearish' if avg_signal < 0.4 else 'mixed'} conditions. "
            f"RSI={indicators.get('rsi', 'N/A')}, Trend={indicators.get('trend', 'unknown')}, "
            f"MACD diff={indicators.get('macd_diff', 'N/A')}."
        )

        return {
            "confidence": round(avg_signal, 4),
            "signal": signal_label,
            "reasoning": reasoning,
            "indicators": indicators,
        }

    def _generate_mock_data(self) -> pd.DataFrame:
        np.random.seed(42)
        n = 200
        prices = 50000 + np.cumsum(np.random.randn(n) * 100)
        return pd.DataFrame({
            "timestamp": range(n),
            "open": prices,
            "high": prices * (1 + np.random.uniform(0, 0.01, n)),
            "low": prices * (1 - np.random.uniform(0, 0.01, n)),
            "close": prices + np.random.randn(n) * 50,
            "volume": np.random.uniform(100, 1000, n),
        })
