"""
AJIO Clone — ML Recommendation Microservice
FastAPI + Surprise SVD Collaborative Filtering
Port: 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import logging
import os

from routes.recommend import router as recommend_router
from routes.train import router as train_router
from routes.analytics import router as analytics_router
from models.recommender import RecommenderModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Global model instance (loaded once at startup) ────────────────────────────
recommender = RecommenderModel()

# ── Scheduler: retrain every night at 2 AM ────────────────────────────────────
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown."""
    logger.info("🚀 ML Service starting up...")
    try:
        recommender.load_or_train()
        logger.info("✅ Recommender model ready")
    except Exception as e:
        logger.warning(f"⚠️  Model not ready yet: {e}. Will train on first request.")

    # Schedule nightly retraining at 02:00
    scheduler.add_job(
        recommender.train,
        trigger="cron",
        hour=2,
        minute=0,
        id="nightly_retrain",
    )
    scheduler.start()
    logger.info("⏰ Nightly retraining scheduled at 02:00")

    yield  # App is running

    scheduler.shutdown()
    logger.info("🛑 ML Service shut down")


app = FastAPI(
    title="AJIO ML Service",
    description="Product Recommendation API using Collaborative Filtering (SVD)",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (only allow Node backend to call this) ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("NODE_BACKEND_URL", "http://backend:5000"),
        "http://localhost:5000",
        "http://localhost:3000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Attach model to app state so routes can access it ────────────────────────
app.state.recommender = recommender

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(recommend_router, prefix="/ml", tags=["Recommendations"])
app.include_router(train_router,     prefix="/ml", tags=["Training"])
app.include_router(analytics_router, prefix="/ml", tags=["Analytics"])


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_trained": recommender.is_trained,
        "total_users": recommender.n_users,
        "total_interactions": recommender.n_interactions,
    }
