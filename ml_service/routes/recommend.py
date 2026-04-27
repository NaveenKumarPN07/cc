"""
/ml/recommend   — personalized recommendations for a user
/ml/similar/:id — products similar to a given product
"""

from fastapi import APIRouter, Request, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class RecommendRequest(BaseModel):
    userId: str
    topN: Optional[int] = 10
    excludeSeen: Optional[bool] = True


class SimilarRequest(BaseModel):
    productId: str
    topN: Optional[int] = 8


# ── POST /ml/recommend ────────────────────────────────────────────────────────

@router.post("/recommend")
async def get_recommendations(body: RecommendRequest, request: Request):
    """
    Return personalized product recommendations for a user.
    Called by the Node.js backend — NOT directly by the browser.
    """
    recommender = request.app.state.recommender

    try:
        product_ids = recommender.recommend(
            user_id=body.userId,
            top_n=min(body.topN, 20),
            exclude_seen=body.excludeSeen,
        )
        return {
            "success": True,
            "userId": body.userId,
            "recommendations": product_ids,
            "count": len(product_ids),
            "modelTrained": recommender.is_trained,
            "source": "svd" if recommender.is_trained else "popularity",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /ml/similar ──────────────────────────────────────────────────────────

@router.post("/similar")
async def get_similar_products(body: SimilarRequest, request: Request):
    """
    Return products similar to a given product (item-based CF).
    Used for 'You may also like' section on product detail page.
    """
    recommender = request.app.state.recommender

    try:
        similar_ids = recommender.similar_products(
            product_id=body.productId,
            top_n=min(body.topN, 20),
        )
        return {
            "success": True,
            "productId": body.productId,
            "similarProducts": similar_ids,
            "count": len(similar_ids),
            "source": "svd_cosine" if recommender.is_trained else "popularity",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /ml/popular ───────────────────────────────────────────────────────────

@router.get("/popular")
async def get_popular(
    request: Request,
    limit: int = Query(default=10, le=50),
):
    """Return globally popular products (used for homepage / cold start)."""
    recommender = request.app.state.recommender
    popular = recommender.popular_products[:limit]
    return {
        "success": True,
        "popularProducts": popular,
        "count": len(popular),
    }
