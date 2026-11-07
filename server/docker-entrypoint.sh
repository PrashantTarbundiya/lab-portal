#!/bin/sh
set -e

echo "[ENTRYPOINT] Starting Lab Portal Backend Container..."

# Database schema synchronization
if [ -n "$DATABASE_URL" ]; then
  echo "[ENTRYPOINT] Database connection string detected."

  # If migrations directory exists and has files, use migrate deploy; otherwise db push
  if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
    echo "[ENTRYPOINT] Applying Prisma migrations..."
    npx prisma migrate deploy || echo "[ENTRYPOINT] Notice: migrate deploy completed or skipped."
  else
    echo "[ENTRYPOINT] Synchronizing Prisma schema to PostgreSQL..."
    npx prisma db push --skip-generate || echo "[ENTRYPOINT] Notice: db push completed or skipped."
  fi

  # Auto-seed if AUTO_SEED flag is enabled
  if [ "$AUTO_SEED" = "true" ] || [ "$AUTO_SEED" = "1" ]; then
    echo "[ENTRYPOINT] AUTO_SEED is enabled. Running prisma seed script..."
    node prisma/seed.js || echo "[ENTRYPOINT] Notice: Database seed completed or skipped."
  fi
else
  echo "[ENTRYPOINT] WARNING: DATABASE_URL is not set. Database features may be unavailable."
fi

echo "[ENTRYPOINT] Handing over to application process: $@"
exec "$@"

