#!/usr/bin/env bash
# Rejoue les abuse-cases dans un conteneur Node 20 (l'hôte n'a besoin que de Docker).
set -e
docker compose build app
docker compose run --rm --no-deps app npm test
