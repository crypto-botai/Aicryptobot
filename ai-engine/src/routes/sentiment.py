from fastapi import APIRouter, Request
from pydantic import BaseModel
router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/analyze")
async def analyze(req: TextRequest, request: Request):
    service = request.app.state.sentiment_service
    return await service.analyze_text(req.text)
