"""News AI validator — real-time sentiment analysis from news sources."""

import asyncio
from typing import Dict, Any, List
from loguru import logger

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    VADER_AVAILABLE = True
except ImportError:
    VADER_AVAILABLE = False


class NewsValidator:
    """Validates trades against current news sentiment."""

    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer() if VADER_AVAILABLE else None
        logger.info("NewsValidator initialized")

    async def validate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        symbol = context.get("symbol", "BTC/USDT")
        side = context.get("side", "buy")

        # In production: fetch from NewsAPI, CryptoPanic, etc.
        headlines = await self._fetch_headlines(symbol)
        sentiment = self._analyze_headlines(headlines)

        aligned = (
            (side == "buy" and sentiment["compound"] >= 0) or
            (side == "sell" and sentiment["compound"] < 0)
        )
        confidence = 0.5 + abs(sentiment["compound"]) * 0.4
        if not aligned:
            confidence = 1 - confidence

        return {
            "model": "news-ai",
            "provider": "news",
            "confidence": round(confidence, 4),
            "signal": "bullish" if sentiment["compound"] >= 0 else "bearish",
            "reasoning": f"News sentiment: {sentiment['label']} (score={sentiment['compound']:.2f}). "
                         f"Analyzed {len(headlines)} recent headlines.",
            "sentiment": sentiment,
        }

    async def _fetch_headlines(self, symbol: str) -> List[str]:
        # Placeholder — connect to NewsAPI in production
        coin = symbol.split("/")[0]
        return [
            f"{coin} shows strong momentum as institutional buyers increase positions",
            f"Market analysts remain cautiously optimistic on {coin} short-term outlook",
            f"{coin} trading volume increases amid broader crypto market activity",
        ]

    def _analyze_headlines(self, headlines: List[str]) -> Dict[str, Any]:
        if not self.analyzer or not headlines:
            return {"compound": 0.0, "pos": 0.5, "neg": 0.0, "neu": 0.5, "label": "neutral"}

        scores = [self.analyzer.polarity_scores(h) for h in headlines]
        avg_compound = sum(s["compound"] for s in scores) / len(scores)
        label = "bullish" if avg_compound >= 0.05 else "bearish" if avg_compound <= -0.05 else "neutral"

        return {
            "compound": round(avg_compound, 4),
            "pos": round(sum(s["pos"] for s in scores) / len(scores), 4),
            "neg": round(sum(s["neg"] for s in scores) / len(scores), 4),
            "neu": round(sum(s["neu"] for s in scores) / len(scores), 4),
            "label": label,
        }
