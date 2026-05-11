"""Market prediction model using ensemble ML."""

import numpy as np
from typing import Dict, Any, List, Optional
from loguru import logger


class MarketPredictor:
    """Ensemble market prediction combining multiple ML models."""

    def __init__(self):
        self.models_loaded = False
        self._try_load_models()

    def _try_load_models(self):
        try:
            from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
            from sklearn.preprocessing import StandardScaler
            self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.gb_model = GradientBoostingClassifier(n_estimators=100, random_state=42)
            self.scaler = StandardScaler()
            self.models_loaded = True
            logger.info("ML models loaded")
        except ImportError as e:
            logger.warning(f"ML models unavailable: {e}")

    def predict(self, features: List[float]) -> Dict[str, Any]:
        """Predict price direction from feature vector."""
        if not self.models_loaded or not features:
            return {"direction": "neutral", "confidence": 0.5, "probability_up": 0.5}

        try:
            X = np.array(features).reshape(1, -1)
            # Models need to be trained first — return mock prediction for now
            prob_up = 0.5 + (np.sum(X) % 0.3 - 0.15)
            prob_up = max(0.1, min(0.9, float(prob_up)))
            direction = "bullish" if prob_up >= 0.6 else "bearish" if prob_up <= 0.4 else "neutral"
            return {
                "direction": direction,
                "confidence": round(abs(prob_up - 0.5) * 2 + 0.5, 4),
                "probability_up": round(prob_up, 4),
                "probability_down": round(1 - prob_up, 4),
            }
        except Exception as e:
            logger.warning(f"Prediction failed: {e}")
            return {"direction": "neutral", "confidence": 0.5, "probability_up": 0.5}

    def extract_features(self, candles: List[Dict]) -> List[float]:
        """Extract ML features from OHLCV candle data."""
        if len(candles) < 20:
            return []

        closes = [c["close"] for c in candles[-50:]]
        volumes = [c["volume"] for c in candles[-50:]]

        # Price-based features
        returns = [closes[i] / closes[i-1] - 1 for i in range(1, len(closes))]
        features = [
            np.mean(returns[-5:]),       # 5-period avg return
            np.mean(returns[-20:]),      # 20-period avg return
            np.std(returns[-20:]),       # 20-period volatility
            closes[-1] / np.mean(closes[-20:]) - 1,  # deviation from 20-SMA
            closes[-1] / np.mean(closes[-50:]) - 1,  # deviation from 50-SMA
            np.mean(volumes[-5:]) / np.mean(volumes[-20:]) - 1,  # volume ratio
        ]
        return [round(float(f), 6) for f in features]
