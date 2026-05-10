from fastapi import APIRouter, Request
from typing import Dict, Any
router = APIRouter()

@router.post("/technical")
async def validate_technical(context: Dict[str, Any], request: Request):
    validator = request.app.state.technical_validator
    return await validator.validate(context)

@router.post("/risk")
async def validate_risk(context: Dict[str, Any], request: Request):
    validator = request.app.state.risk_validator
    return await validator.validate(context)

@router.post("/news")
async def validate_news(context: Dict[str, Any], request: Request):
    validator = request.app.state.news_validator
    return await validator.validate(context)
