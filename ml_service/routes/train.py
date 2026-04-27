"""
/ml/train    — manually trigger model retraining
/ml/status   — model metadata
"""

from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
import os

router = APIRouter()
security = HTTPBearer(auto_error=False)

ML_API_KEY = os.getenv("ML_API_KEY", "internal_ml_secret")


def verify_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials or credentials.credentials != ML_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── POST /ml/train ─────────────────────────────────────────────────────────────

@router.post("/train", dependencies=[Depends(verify_key)])
async def trigger_training(request: Request, background_tasks: BackgroundTasks):
    """
    Manually trigger model retraining.
    Protected by ML_API_KEY — only called by Node backend admin routes.
    """
    recommender = request.app.state.recommender
    background_tasks.add_task(recommender.train)
    return {
        "success": True,
        "message": "Model retraining started in background",
    }


# ── GET /ml/status ─────────────────────────────────────────────────────────────

@router.get("/status")
async def model_status(request: Request):
    recommender = request.app.state.recommender
    return {
        "isTrained": recommender.is_trained,
        "trainedAt": recommender.trained_at.isoformat() if recommender.trained_at else None,
        "totalUsers": recommender.n_users,
        "totalInteractions": recommender.n_interactions,
        "popularProducts": len(recommender.popular_products),
    }
