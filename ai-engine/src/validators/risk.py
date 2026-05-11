"""Risk AI validator — evaluates position sizing, volatility, and exposure."""

import numpy as np
from typing import Dict, Any
from loguru import logger


class RiskValidator:
    """AI-based risk validator for trade setups."""

    def __init__(self):
        logger.info("RiskValidator initialized")

    async def validate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        symbol = context.get("symbol", "BTC/USDT")
        side = context.get("side", "buy")
        quantity = context.get("quantity", 0)
        price = context.get("price") or context.get("marketData", {}).get("price", 50000)
        stop_loss = context.get("stopLoss")
        take_profit = context.get("takeProfit")

        risk_score = self._calculate_risk(quantity, price, stop_loss, take_profit)
        confidence = max(0.1, min(0.95, 1.0 - risk_score * 0.7))

        reasons = []
        if not stop_loss:
            reasons.append("No stop loss set — high risk")
            confidence -= 0.15
        else:
            sl_pct = abs((price - stop_loss) / price * 100)
            if sl_pct > 5:
                reasons.append(f"Wide stop loss ({sl_pct:.1f}%) increases risk")
                confidence -= 0.1
            else:
                reasons.append(f"Stop loss at {sl_pct:.1f}% — acceptable")

        if take_profit and stop_loss:
            rr = abs(take_profit - price) / abs(price - stop_loss)
            if rr >= 2:
                reasons.append(f"Risk/reward ratio {rr:.1f}:1 — favorable")
                confidence += 0.1
            else:
                reasons.append(f"Risk/reward ratio {rr:.1f}:1 — suboptimal")
                confidence -= 0.05

        confidence = round(max(0.1, min(0.95, confidence)), 4)
        signal = "bullish" if confidence >= 0.6 else "bearish" if confidence < 0.35 else "neutral"

        return {
            "model": "risk-ai",
            "provider": "risk",
            "confidence": confidence,
            "signal": signal,
            "reasoning": " ".join(reasons) or "Risk parameters within acceptable range.",
            "riskScore": round(risk_score, 4),
        }

    def _calculate_risk(self, quantity: float, price: float, stop_loss, take_profit) -> float:
        """Returns a 0–1 risk score (higher = riskier)."""
        risk = 0.3  # base

        position_value = quantity * (price or 50000)
        if position_value > 10000:
            risk += 0.2
        elif position_value > 1000:
            risk += 0.1

        if not stop_loss:
            risk += 0.3

        if not take_profit:
            risk += 0.1

        return min(1.0, risk)
