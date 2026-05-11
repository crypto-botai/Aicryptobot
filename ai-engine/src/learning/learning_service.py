"""Self-learning AI engine — improves strategy based on past trade outcomes."""

import json
import os
from typing import Dict, Any, List
from datetime import datetime
from loguru import logger
import numpy as np


class LearningService:
    """Records trade outcomes and improves AI models over time."""

    def __init__(self):
        self.model_dir = os.environ.get("MODEL_CACHE_DIR", "/app/data/models")
        os.makedirs(self.model_dir, exist_ok=True)
        self.performance_log: List[Dict] = []
        self.learned_patterns: Dict[str, Any] = {}
        self._load_patterns()
        logger.info("LearningService initialized")

    def _load_patterns(self):
        pattern_file = os.path.join(self.model_dir, "learned_patterns.json")
        if os.path.exists(pattern_file):
            with open(pattern_file) as f:
                self.learned_patterns = json.load(f)
            logger.info(f"Loaded {len(self.learned_patterns)} learned patterns")

    def _save_patterns(self):
        pattern_file = os.path.join(self.model_dir, "learned_patterns.json")
        with open(pattern_file, "w") as f:
            json.dump(self.learned_patterns, f, indent=2, default=str)

    async def update(self, validations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process completed trade validations and update models."""
        processed = 0
        wins = 0
        losses = 0
        total_pnl = 0.0

        for validation in validations:
            outcome = validation.get("tradeOutcome")
            pnl = validation.get("outcomePnl", 0) or 0
            confidence = validation.get("overallConfidence", 0.5)
            symbol = validation.get("symbol", "unknown")
            approved = validation.get("approved", False)

            if outcome in ("win", "loss", "breakeven"):
                self.performance_log.append({
                    "symbol": symbol,
                    "confidence": confidence,
                    "approved": approved,
                    "outcome": outcome,
                    "pnl": pnl,
                    "timestamp": datetime.utcnow().isoformat(),
                })

                if outcome == "win":
                    wins += 1
                    total_pnl += pnl
                    # Learn: high-confidence approvals that won
                    if approved and confidence >= 0.7:
                        key = f"{symbol}:high_conf_win"
                        self.learned_patterns[key] = self.learned_patterns.get(key, 0) + 1
                elif outcome == "loss":
                    losses += 1
                    total_pnl += pnl
                    # Learn: what patterns led to losses
                    if approved and confidence >= 0.7:
                        key = f"{symbol}:high_conf_loss"
                        self.learned_patterns[key] = self.learned_patterns.get(key, 0) + 1
                processed += 1

        if processed > 0:
            self._save_patterns()
            self._update_thresholds()

        return {
            "processed": processed,
            "wins": wins,
            "losses": losses,
            "totalPnl": round(total_pnl, 4),
            "winRate": round(wins / max(processed, 1), 4),
            "patternsLearned": len(self.learned_patterns),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _update_thresholds(self):
        """Dynamically adjust confidence thresholds based on win rate."""
        if len(self.performance_log) < 20:
            return

        recent = self.performance_log[-100:]
        win_rate = sum(1 for r in recent if r["outcome"] == "win") / len(recent)
        avg_confidence = np.mean([r["confidence"] for r in recent])

        # If win rate is below 50%, increase threshold
        if win_rate < 0.5:
            self.learned_patterns["threshold_adjustment"] = min(
                0.9, self.learned_patterns.get("threshold_adjustment", 0.65) + 0.02
            )
            logger.info(f"Threshold increased to {self.learned_patterns['threshold_adjustment']:.2f} (win rate={win_rate:.1%})")
        elif win_rate >= 0.7:
            self.learned_patterns["threshold_adjustment"] = max(
                0.55, self.learned_patterns.get("threshold_adjustment", 0.65) - 0.01
            )
            logger.info(f"Threshold relaxed to {self.learned_patterns['threshold_adjustment']:.2f} (win rate={win_rate:.1%})")

    def get_adjusted_threshold(self, base_threshold: float = 0.65) -> float:
        """Return learned optimal confidence threshold."""
        return self.learned_patterns.get("threshold_adjustment", base_threshold)

    async def generate_insights(self, symbol: str, user_id: str = None) -> List[Dict[str, Any]]:
        """Generate AI insights based on learned patterns."""
        insights = []

        symbol_wins = self.learned_patterns.get(f"{symbol}:high_conf_win", 0)
        symbol_losses = self.learned_patterns.get(f"{symbol}:high_conf_loss", 0)

        if symbol_wins + symbol_losses > 0:
            win_rate = symbol_wins / (symbol_wins + symbol_losses)
            insights.append({
                "type": "learning_update",
                "content": f"Historical AI accuracy on {symbol}: {win_rate*100:.0f}% win rate from {symbol_wins+symbol_losses} validated trades.",
                "confidence": 0.85,
            })

        insights.append({
            "type": "market_analysis",
            "content": f"AI model has processed {len(self.performance_log)} trades. Current optimal confidence threshold: {self.get_adjusted_threshold():.0%}.",
            "confidence": 0.9,
        })

        return insights
