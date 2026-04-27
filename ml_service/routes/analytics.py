"""
/ml/analytics   — aggregated sales & trend data for admin dashboard
Uses MongoDB aggregation — no ML model required, pure data analysis.
"""

from fastapi import APIRouter, Request
from pymongo import MongoClient
import os
from datetime import datetime, timedelta

router = APIRouter()


def get_db():
    client = MongoClient(os.getenv("MONGO_URI", "mongodb://mongo:27017/ajio_clone"))
    return client[os.getenv("MONGO_DB", "ajio_clone")]


@router.get("/analytics/sales")
async def sales_analytics(request: Request):
    """
    Returns 30-day daily revenue, top products, top categories.
    Powers the Admin Analytics dashboard.
    """
    db = get_db()
    since = datetime.utcnow() - timedelta(days=30)

    # Daily revenue — last 30 days
    daily_pipeline = [
        {"$match": {"createdAt": {"$gte": since}, "orderStatus": {"$ne": "Cancelled"}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "revenue": {"$sum": "$totalPrice"},
            "orders": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    daily_revenue = list(db.orders.aggregate(daily_pipeline))

    # Top 10 products by revenue
    top_products_pipeline = [
        {"$match": {"orderStatus": {"$ne": "Cancelled"}}},
        {"$unwind": "$orderItems"},
        {"$group": {
            "_id": "$orderItems.product",
            "name": {"$first": "$orderItems.name"},
            "revenue": {"$sum": {"$multiply": ["$orderItems.price", "$orderItems.quantity"]}},
            "units": {"$sum": "$orderItems.quantity"},
        }},
        {"$sort": {"revenue": -1}},
        {"$limit": 10},
    ]
    top_products = list(db.orders.aggregate(top_products_pipeline))

    # Revenue by category
    cat_pipeline = [
        {"$match": {"orderStatus": {"$ne": "Cancelled"}}},
        {"$unwind": "$orderItems"},
        {"$lookup": {
            "from": "products",
            "localField": "orderItems.product",
            "foreignField": "_id",
            "as": "productInfo",
        }},
        {"$unwind": {"path": "$productInfo", "preserveNullAndEmptyArrays": True}},
        {"$group": {
            "_id": "$productInfo.category",
            "revenue": {"$sum": {"$multiply": ["$orderItems.price", "$orderItems.quantity"]}},
            "units": {"$sum": "$orderItems.quantity"},
        }},
        {"$sort": {"revenue": -1}},
    ]
    by_category = list(db.orders.aggregate(cat_pipeline))

    # Serialize ObjectIds to strings
    for p in top_products:
        p["_id"] = str(p["_id"])
    for c in by_category:
        c["_id"] = c["_id"] or "Unknown"

    return {
        "success": True,
        "dailyRevenue": daily_revenue,
        "topProducts": top_products,
        "byCategory": by_category,
        "period": "last_30_days",
    }


@router.get("/analytics/users")
async def user_analytics(request: Request):
    """New users over time + order distribution."""
    db = get_db()
    since = datetime.utcnow() - timedelta(days=30)

    new_users = list(db.users.aggregate([
        {"$match": {"createdAt": {"$gte": since}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]))

    total_users = db.users.count_documents({})
    total_orders = db.orders.count_documents({})

    return {
        "success": True,
        "newUsers": new_users,
        "totalUsers": total_users,
        "totalOrders": total_orders,
    }
