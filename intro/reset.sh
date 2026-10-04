#!/usr/bin/env bash
# app_intro-compromission/reset.sh - remet le lab à l'état initial (Linux/macOS/Git Bash).
set -e
cd "$(dirname "$0")"
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d --build
echo "Lab réinitialisé -> http://localhost:8080"
