"""
RecommenderModel
================
Primary : Surprise SVD (collaborative filtering)
Fallback : Popularity-based (for cold-start / new users)

Interaction scores built from MongoDB:
  - Completed order  → 5.0  (strongest purchase signal)
  - Wishlist add     → 4.0
  - Review submitted → actual star rating (1–5)
  - Cart add         → 3.0
  - Product view     → 1.0  (weakest signal)
"""

import os
import logging
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

from surprise import SVD, Dataset, Reader
from surprise.model_selection import cross_validate
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger(__name__)

MODEL_PATH = Path(os.getenv("MODEL_PATH", "/app/saved_models/recommender.pkl"))
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

# Interaction weights
WEIGHTS = {
    "order":   5.0,
    "wishlist": 4.0,
    "review":  None,   # use actual rating
    "cart":    3.0,
    "view":    1.0,
}


class RecommenderModel:
    def __init__(self):
        self.model = None
        self.df_interactions = None
        self.popular_products = []      # fallback for cold-start
        self.user_encoder = LabelEncoder()
        self.product_encoder = LabelEncoder()
        self.is_trained = False
        self.n_users = 0
        self.n_interactions = 0
        self.trained_at = None

        self._client = None

    # ── MongoDB connection ────────────────────────────────────────────────────

    def _get_db(self):
        if self._client is None:
            mongo_uri = os.getenv("MONGO_URI", "mongodb://mongo:27017/ajio_clone")
            self._client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        return self._client[os.getenv("MONGO_DB", "ajio_clone")]

    # ── Data extraction ───────────────────────────────────────────────────────

    def _extract_interactions(self) -> pd.DataFrame:
        """
        Pull interaction data from MongoDB and build a unified
        (userId, productId, rating) DataFrame.
        """
        db = self._get_db()
        rows = []

        # 1. Orders → score 5.0
        logger.info("  Extracting orders...")
        for order in db.orders.find({}, {"user": 1, "orderItems": 1}):
            uid = str(order["user"])
            for item in order.get("orderItems", []):
                pid = str(item.get("product", ""))
                if uid and pid:
                    rows.append({"userId": uid, "productId": pid, "score": 5.0, "source": "order"})

        # 2. Wishlist → score 4.0
        logger.info("  Extracting wishlists...")
        for user in db.users.find({"wishlist": {"$exists": True, "$ne": []}}, {"_id": 1, "wishlist": 1}):
            uid = str(user["_id"])
            for pid in user.get("wishlist", []):
                rows.append({"userId": uid, "productId": str(pid), "score": 4.0, "source": "wishlist"})

        # 3. Reviews → actual star rating
        logger.info("  Extracting reviews from products...")
        for product in db.products.find({"reviews": {"$exists": True, "$ne": []}}, {"_id": 1, "reviews": 1}):
            pid = str(product["_id"])
            for review in product.get("reviews", []):
                uid = str(review.get("user", ""))
                rating = float(review.get("rating", 3))
                if uid:
                    rows.append({"userId": uid, "productId": pid, "score": rating, "source": "review"})

        # 4. Cart → score 3.0
        logger.info("  Extracting cart items...")
        for cart in db.carts.find({}, {"user": 1, "items": 1}):
            uid = str(cart["user"])
            for item in cart.get("items", []):
                pid = str(item.get("product", ""))
                if uid and pid:
                    rows.append({"userId": uid, "productId": pid, "score": 3.0, "source": "cart"})

        if not rows:
            logger.warning("  No interaction data found in MongoDB")
            return pd.DataFrame(columns=["userId", "productId", "score"])

        df = pd.DataFrame(rows)

        # If same user-product pair appears multiple times, take the MAX score
        df = df.groupby(["userId", "productId"])["score"].max().reset_index()

        logger.info(f"  Total interactions: {len(df)} from {df['userId'].nunique()} users "
                    f"and {df['productId'].nunique()} products")
        return df

    def _extract_popular_products(self, top_n: int = 50) -> list:
        """Popularity-based fallback: most-ordered products."""
        db = self._get_db()
        pipeline = [
            {"$unwind": "$orderItems"},
            {"$group": {"_id": "$orderItems.product", "count": {"$sum": "$orderItems.quantity"}}},
            {"$sort": {"count": -1}},
            {"$limit": top_n},
        ]
        result = list(db.orders.aggregate(pipeline))

        if not result:
            # Fall back to highest-rated products
            result = list(db.products.find(
                {"isActive": True},
                {"_id": 1}
            ).sort("rating", -1).limit(top_n))
            return [str(r["_id"]) for r in result]

        return [str(r["_id"]) for r in result]

    # ── Training ──────────────────────────────────────────────────────────────

    def train(self):
        """Extract data from MongoDB, train SVD, save model."""
        logger.info("🧠 Starting model training...")

        try:
            df = self._extract_interactions()

            if len(df) < 10:
                logger.warning("Not enough interactions to train (need ≥ 10). "
                               "Using popularity fallback only.")
                self.popular_products = self._extract_popular_products()
                self.is_trained = False
                return

            # Surprise needs ratings in [1, 5] scale
            df["score"] = df["score"].clip(1.0, 5.0)

            reader = Reader(rating_scale=(1, 5))
            data = Dataset.load_from_df(df[["userId", "productId", "score"]], reader)

            # SVD with tuned hyperparameters
            algo = SVD(
                n_factors=50,       # latent dimensions
                n_epochs=20,        # training epochs
                lr_all=0.005,       # learning rate
                reg_all=0.02,       # regularization
                biased=True,        # include user/item bias terms
                random_state=42,
            )

            trainset = data.build_full_trainset()
            algo.fit(trainset)

            self.model = algo
            self.df_interactions = df
            self.n_users = df["userId"].nunique()
            self.n_interactions = len(df)
            self.popular_products = self._extract_popular_products()
            self.is_trained = True
            self.trained_at = datetime.utcnow()

            # Persist to disk
            joblib.dump({
                "model": self.model,
                "df_interactions": self.df_interactions,
                "popular_products": self.popular_products,
                "trained_at": self.trained_at,
                "n_users": self.n_users,
                "n_interactions": self.n_interactions,
            }, MODEL_PATH)

            logger.info(f"✅ Model trained and saved → {MODEL_PATH}")
            logger.info(f"   Users: {self.n_users}  |  Interactions: {self.n_interactions}")

        except Exception as e:
            logger.error(f"❌ Training failed: {e}", exc_info=True)
            raise

    def load_or_train(self):
        """Load persisted model from disk or train fresh."""
        if MODEL_PATH.exists():
            logger.info(f"📂 Loading saved model from {MODEL_PATH}")
            data = joblib.load(MODEL_PATH)
            self.model = data["model"]
            self.df_interactions = data["df_interactions"]
            self.popular_products = data["popular_products"]
            self.trained_at = data.get("trained_at")
            self.n_users = data.get("n_users", 0)
            self.n_interactions = data.get("n_interactions", 0)
            self.is_trained = True
            logger.info(f"✅ Model loaded (trained at {self.trained_at})")
        else:
            logger.info("No saved model found — training from scratch...")
            self.train()

    # ── Prediction ────────────────────────────────────────────────────────────

    def recommend(self, user_id: str, top_n: int = 10, exclude_seen: bool = True) -> list:
        """
        Return top-N recommended product IDs for a given user.
        Falls back to popularity if user is new (cold-start).
        """
        if not self.is_trained or self.model is None:
            logger.info(f"Model not trained — returning popular products for user {user_id}")
            return self.popular_products[:top_n]

        # Check if user exists in training data
        known_users = set(self.df_interactions["userId"].unique())
        if user_id not in known_users:
            logger.info(f"Cold-start user {user_id} — returning popular products")
            return self.popular_products[:top_n]

        # All products in training data
        all_products = set(self.df_interactions["productId"].unique())

        if exclude_seen:
            # Products this user has already interacted with
            seen = set(
                self.df_interactions[self.df_interactions["userId"] == user_id]["productId"]
            )
            candidate_products = all_products - seen
        else:
            candidate_products = all_products

        if not candidate_products:
            return self.popular_products[:top_n]

        # Predict score for every candidate product
        predictions = [
            (pid, self.model.predict(user_id, pid).est)
            for pid in candidate_products
        ]

        # Sort by estimated rating descending
        predictions.sort(key=lambda x: x[1], reverse=True)

        return [pid for pid, _ in predictions[:top_n]]

    def similar_products(self, product_id: str, top_n: int = 8) -> list:
        """
        Find products similar to a given product using item latent vectors.
        Uses cosine similarity on SVD item factors (qi matrix).
        """
        if not self.is_trained or self.model is None:
            return self.popular_products[:top_n]

        trainset = self.model.trainset
        try:
            inner_id = trainset.to_inner_iid(product_id)
        except ValueError:
            # Product not in training data
            return self.popular_products[:top_n]

        # Get item factor vectors
        qi = self.model.qi  # shape: (n_items, n_factors)
        target_vec = qi[inner_id]

        # Cosine similarity with all other items
        norms = np.linalg.norm(qi, axis=1, keepdims=True) + 1e-9
        qi_norm = qi / norms
        target_norm = target_vec / (np.linalg.norm(target_vec) + 1e-9)
        similarities = qi_norm @ target_norm

        # Get top-N (excluding itself)
        top_inner_ids = np.argsort(similarities)[::-1]
        result = []
        for inner in top_inner_ids:
            if inner == inner_id:
                continue
            try:
                raw_id = trainset.to_raw_iid(inner)
                result.append(raw_id)
            except Exception:
                continue
            if len(result) >= top_n:
                break

        return result if result else self.popular_products[:top_n]
