#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Push Docker images to AWS ECR (Elastic Container Registry)
# Prerequisites: AWS CLI configured, ECR repos created
# Usage: ./push-to-ecr.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ─── CONFIG ──────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-ap-south-1}"          # Mumbai (closest to India)
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-123456789012}" # Replace with your account ID
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
TAG="${TAG:-latest}"

BACKEND_REPO="ajio-clone-backend"
FRONTEND_REPO="ajio-clone-frontend"

echo "🚀 Pushing images to AWS ECR"
echo "Registry: $ECR_REGISTRY"
echo "Region: $AWS_REGION"
echo ""

# ─── Authenticate with ECR ────────────────────────────────────────────────────
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# ─── Create ECR repos if they don't exist ────────────────────────────────────
for repo in $BACKEND_REPO $FRONTEND_REPO; do
  aws ecr describe-repositories --repository-names $repo --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $repo --region $AWS_REGION
  echo "✅ ECR repo ready: $repo"
done

# ─── Build & push Backend ────────────────────────────────────────────────────
echo ""
echo "🔨 Building backend image..."
docker build -t $BACKEND_REPO:$TAG ./backend

echo "📤 Pushing backend to ECR..."
docker tag $BACKEND_REPO:$TAG $ECR_REGISTRY/$BACKEND_REPO:$TAG
docker push $ECR_REGISTRY/$BACKEND_REPO:$TAG
echo "✅ Backend pushed: $ECR_REGISTRY/$BACKEND_REPO:$TAG"

# ─── Build & push Frontend ───────────────────────────────────────────────────
echo ""
echo "🔨 Building frontend image..."
docker build \
  --build-arg VITE_API_URL=/api \
  -t $FRONTEND_REPO:$TAG ./frontend

echo "📤 Pushing frontend to ECR..."
docker tag $FRONTEND_REPO:$TAG $ECR_REGISTRY/$FRONTEND_REPO:$TAG
docker push $ECR_REGISTRY/$FRONTEND_REPO:$TAG
echo "✅ Frontend pushed: $ECR_REGISTRY/$FRONTEND_REPO:$TAG"

echo ""
echo "═══════════════════════════════════════"
echo "✅ All images pushed to ECR!"
echo ""
echo "Backend : $ECR_REGISTRY/$BACKEND_REPO:$TAG"
echo "Frontend: $ECR_REGISTRY/$FRONTEND_REPO:$TAG"
echo ""
echo "Next: Update docker-compose.yml to use ECR image URIs,"
echo "      then run: ./deploy-aws.sh"
