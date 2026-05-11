"""AICryptoBot AI Engine — FastAPI microservice for ML inference, validation, and learning."""

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import os

from .validators.technical import TechnicalValidator
from .validators.risk import RiskValidator
from .validators.news import NewsValidator
from .sentiment.sentiment_service import SentimentService
from .learning.learning_service import LearningService
from .models.market_predictor import MarketPredictor
from .agents.agent_coordinator import AgentCoordinator
from .utils.config import settings
from .routes import validate, insights, learning, sentiment, market

# ── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Engine starting up...")
    # Initialize services
    app.state.technical_validator = TechnicalValidator()
    app.state.risk_validator = RiskValidator()
    app.state.news_validator = NewsValidator()
    app.state.sentiment_service = SentimentService()
    app.state.learning_service = LearningService()
    app.state.market_predictor = MarketPredictor()
    app.state.agent_coordinator = AgentCoordinator()
    logger.info("All AI services initialized")
    yield
    logger.info("AI Engine shutting down...")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AICryptoBot AI Engine",
    description="Multi-model AI validation, sentiment analysis, and self-learning engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Auth ──────────────────────────────────────────────────────────────────────

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    expected = settings.AI_ENGINE_API_KEY
    if expected and api_key != expected:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(validate.router, prefix="/validate", dependencies=[Depends(verify_api_key)])
app.include_router(insights.router, prefix="/insights", dependencies=[Depends(verify_api_key)])
app.include_router(learning.router, prefix="/learning", dependencies=[Depends(verify_api_key)])
app.include_router(sentiment.router, prefix="/sentiment", dependencies=[Depends(verify_api_key)])
app.include_router(market.router, prefix="/market", dependencies=[Depends(verify_api_key)])


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/market-sentiment", dependencies=[Depends(verify_api_key)])
async def market_sentiment():
    service = app.state.sentiment_service
    return await service.get_market_sentiment()
