from fastapi import APIRouter, Request, Query
from typing import Optional
router = APIRouter()

@router.get("/predict")
async def predict(symbol: str = Query(...), request: Request = None):
    predictor = request.app.state.market_predictor
    return predictor.predict([])
