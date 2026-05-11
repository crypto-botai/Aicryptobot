from fastapi import APIRouter, Request
from typing import List, Dict, Any
router = APIRouter()

@router.post("/update")
async def update_learning(data: Dict[str, Any], request: Request):
    service = request.app.state.learning_service
    return await service.update(data.get("validations", []))
