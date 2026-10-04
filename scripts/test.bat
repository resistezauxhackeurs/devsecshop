@echo off
rem Rejoue les abuse-cases dans un conteneur Node 20 (seul Docker est requis).
docker compose build app || exit /b 1
docker compose run --rm --no-deps app npm test
