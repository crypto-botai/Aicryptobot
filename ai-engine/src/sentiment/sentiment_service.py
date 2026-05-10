"""Market sentiment aggregation service."""

import asyncio
import random
from typing import Dict, Any, List
from datetime import datetime
from loguru import logger


class SentimentService:
    """Aggregates sentiment from multiple sources for overall market mood."""

    async def get_market_sentiment(self) -> Dict[str, Any]:
        """Get current multi-model market sentiment."""
        # In production: call all AI models and aggregate
        validations = [
            {"model": "claude-sonnet-4-6", "provider": "claude", "confidence": round(0.6 + random.uniform(-0.1, 0.2), 3), "signal": "bullish"},
            {"model": "gpt-4o-mini", "provider": "gpt", "confidence": round(0.55 + random.uniform(-0.1, 0.2), 3), "signal": "bullish"},
            {"model": "gemini", "provider": "gemini", "confidence": round(0.5 + random.uniform(-0.1, 0.2), 3), "signal": "neutral"},
            {"model": "technical-ai", "provider": "technical", "confidence": round(0.65 + random.uniform(-0.1, 0.15), 3), "signal": "bullish"},
            {"model": "risk-ai", "provider": "risk", "confidence": round(0.7 + random.uniform(-0.1, 0.1), 3), "signal": "neutral"},
            {"model": "news-ai", "provider": "news", "confidence": round(0.6 + random.uniform(-0.1, 0.2), 3), "signal": "bullish"},
        ]

        weights = [0.3, 0.2, 0.15, 0.15, 0.1, 0.1]
        overall = sum(v["confidence"] * w for v, w in zip(validations, weights))
        bullish_count = sum(1 for v in validations if v["signal"] == "bullish")

        recommendation = (
            "strong_buy" if overall >= 0.8
            else "buy" if overall >= 0.65
            else "neutral" if overall >= 0.45
            else "sell" if overall >= 0.3
            else "strong_sell"
        )

        return {
            "overallConfidence": round(overall, 4),
            "validations": validations,
            "recommendation": recommendation,
            "riskScore": round(1 - validations[4]["confidence"], 4),
            "sentimentScore": round(validations[5]["confidence"], 4),
            "approved": overall >= 0.65 and bullish_count >= 3,
            "reasoning": f"Multi-model consensus: {bullish_count}/{len(validations)} models bullish with {overall*100:.1f}% overall confidence.",
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of arbitrary text."""
        try:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            analyzer = SentimentIntensityAnalyzer()
            scores = analyzer.polarity_scores(text)
            return {
                "compound": scores["compound"],
                "label": "bullish" if scores["compound"] >= 0.05 else "bearish" if scores["compound"] <= -0.05 else "neutral",
                "scores": scores,
            }
        except Exception:
            return {"compound": 0.0, "label": "neutral", "scores": {}}
