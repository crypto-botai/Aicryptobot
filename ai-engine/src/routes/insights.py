from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
router = APIRouter()

class InsightRequest(BaseModel):
    symbol: str
    userId: Optional[str] = None

@router.post("/generate")
async def generate_insights(req: InsightRequest, request: Request):
    service = request.app.state.learning_service
    insights = await service.generate_insights(req.symbol, req.userId)
    return {"insights": insights}
