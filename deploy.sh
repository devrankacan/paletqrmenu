#!/bin/bash
# Palet QR Menu — VPS deploy scripti
# İlk kurulum: chmod +x deploy.sh
# Kullanım:    ./deploy.sh

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="paletpastanesi-menu"

echo "→ Dizin: $APP_DIR"
cd "$APP_DIR"

echo "→ Git pull..."
git pull origin "$(git rev-parse --abbrev-ref HEAD)"

echo "→ Bağımlılıklar kuruluyor..."
npm ci --legacy-peer-deps

echo "→ Build alınıyor..."
npm run build

echo "→ PM2 yeniden başlatılıyor..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 reload "$APP_NAME"
else
  pm2 start ecosystem.config.js
  pm2 save
fi

echo "✓ Deploy tamamlandı."
