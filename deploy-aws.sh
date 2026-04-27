#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# AWS Deployment Script for AJIO Clone (EC2 + Docker)
# Run this script on your EC2 instance (Amazon Linux 2023 / Ubuntu 22.04)
# Usage: chmod +x deploy-aws.sh && ./deploy-aws.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit on any error

echo "🚀 AJIO Clone — AWS Deployment Script"
echo "======================================="

# ─── CONFIG — Edit these values ──────────────────────────────────────────────
DOCKER_HUB_USER="${DOCKER_HUB_USER:-your_dockerhub_username}"
APP_NAME="ajio-clone"
DOMAIN="${DOMAIN:-your-ec2-public-ip-or-domain}"

# ─── 1. System update & Docker install ───────────────────────────────────────
echo ""
echo "📦 Step 1: Updating system and installing Docker..."

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
fi

if [ "$OS" = "ubuntu" ]; then
  sudo apt-get update -y
  sudo apt-get install -y docker.io docker-compose-plugin git curl
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker $USER

elif [ "$OS" = "amzn" ]; then
  sudo yum update -y
  sudo yum install -y docker git curl
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker $USER
  # Install Docker Compose v2
  DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
  mkdir -p $DOCKER_CONFIG/cli-plugins
  curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
    -o $DOCKER_CONFIG/cli-plugins/docker-compose
  chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
fi

echo "✅ Docker installed: $(docker --version)"

# ─── 2. Clone repository ─────────────────────────────────────────────────────
echo ""
echo "📂 Step 2: Cloning repository..."

if [ -d "$APP_NAME" ]; then
  echo "Directory exists — pulling latest changes..."
  cd $APP_NAME && git pull origin main && cd ..
else
  git clone https://github.com/NaveenKumarPN07/cc.git
fi

cd $APP_NAME

# ─── 3. Create .env file ─────────────────────────────────────────────────────
echo ""
echo "⚙️  Step 3: Configuring environment..."

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  IMPORTANT: Edit .env with your real values before continuing!"
  echo "   Run: nano .env"
  echo ""
  echo "   Required values:"
  echo "   - MONGO_ROOT_PASS=<strong_password>"
  echo "   - JWT_SECRET=<64_char_random_string>"
  echo "   - FRONTEND_URL=http://$DOMAIN"
  echo "   - Cloudinary credentials (optional)"
  echo ""
  read -p "Press ENTER after editing .env to continue..." _
fi

# ─── 4. Build & start containers ─────────────────────────────────────────────
echo ""
echo "🐳 Step 4: Building and starting Docker containers..."

docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 20

# ─── 5. Seed database ────────────────────────────────────────────────────────
echo ""
echo "🌱 Step 5: Seeding database with sample data..."

docker compose exec backend node utils/seeder.js || echo "⚠️  Seed failed (may already be seeded)"

# ─── 6. Health check ─────────────────────────────────────────────────────────
echo ""
echo "🏥 Step 6: Health check..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ API is healthy (HTTP $HTTP_STATUS)"
else
  echo "⚠️  API health check returned HTTP $HTTP_STATUS"
  echo "   Check logs: docker compose logs backend"
fi

# ─── 7. Print summary ────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "🌐 App URL      : http://$DOMAIN"
echo "🔧 API URL      : http://$DOMAIN/api"
echo "📊 API Health   : http://$DOMAIN/api/health"
echo ""
echo "👤 Test Credentials:"
echo "   Admin : admin@ajio.com / Admin@123"
echo "   User  : user@ajio.com  / User@123"
echo ""
echo "📋 Useful commands:"
echo "   View logs     : docker compose logs -f"
echo "   Restart       : docker compose restart"
echo "   Stop          : docker compose down"
echo "   Shell backend : docker compose exec backend sh"
echo ""
