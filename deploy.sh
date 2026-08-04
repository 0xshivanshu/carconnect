#!/usr/bin/env bash
# Build + deploy the app on the EC2 host.
# nginx + certbot run on the HOST; the backend runs in Docker.
set -euo pipefail
cd "$(dirname "$0")"

# Load secrets (GOOGLE/Razorpay/etc) from the repo .env into this shell
set -a
source .env 2>/dev/null || true
set +a

echo "[deploy] Building frontend..."
cd frontend
npm ci --legacy-peer-deps 2>/dev/null || npm install
VITE_API_URL=/ \
VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:-}" \
VITE_RAZORPAY_KEY_ID="${VITE_RAZORPAY_KEY_ID:-}" \
npm run build
cd ..

echo "[deploy] Syncing static site to /var/www/carconnect..."
sudo mkdir -p /var/www/carconnect
sudo rsync -a --delete frontend/dist/ /var/www/carconnect/

echo "[deploy] Rebuilding backend container..."
sudo docker compose up -d --build backend

echo "[deploy] Reloading nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "[deploy] Done."