#!/bin/bash

set -e

echo "🚀 AJIO Clone — AWS Deployment Script"
echo "======================================="

# ─── CONFIG ──────────────────────────────────────────────────────────────
APP_NAME="cc"
DOMAIN="${DOMAIN:-54.161.101.28}"

# ─── 1. System update & Docker install ───────────────────────────────────
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
  sudo yum install -y docker git
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

# ─── 2. Clone repository ─────────────────────────────────────────────────
echo ""
echo "📂 Step 2: Setting up repository..."

if [ -d "$APP_NAME" ]; then
  echo "Directory exists — pulling latest changes..."
  cd $APP_NAME && git pull origin main
else
  git clone https://github.com/NaveenKumarPN07/cc.git
  cd $APP_NAME
fi

# ─── 3. Create .env file ─────────────────────────────────────────────────
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
  echo "   - ML_API_KEY=<any_secret>"
  echo ""
  read -p "Press ENTER after editing .env to continue..." _
fi

# ─── 4. Build & start containers ─────────────────────────────────────────
echo ""
echo "🐳 Step 4: Building and starting Docker containers..."

docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 20

# ─── 5. Seed database ────────────────────────────────────────────────────
echo ""
echo "🌱 Step 5: Seeding database..."

docker compose exec backend node utils/seeder.js || echo "⚠️ Seed skipped"

# ─── 6. Health check ─────────────────────────────────────────────────────
echo ""
echo "🏥 Step 6: Health check..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ API is healthy (HTTP $HTTP_STATUS)"
else
  echo "⚠️ API health check returned HTTP $HTTP_STATUS"
  echo "Check logs: docker compose logs backend"
fi

# ─── 7. Summary ──────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "🌐 App URL      : http://$DOMAIN"
echo "🔧 API URL      : http://$DOMAIN/api"
echo "📊 API Health   : http://$DOMAIN/api/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs     : docker compose logs -f"
echo "   Restart       : docker compose restart"
echo "   Stop          : docker compose down"
echo "   Backend shell : docker compose exec backend sh"
echo ""