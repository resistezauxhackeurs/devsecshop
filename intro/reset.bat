@echo off
rem app_intro-compromission\reset.bat - remet le lab a l'etat initial (Windows).
cd /d "%~dp0"
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d --build
echo Lab reinitialise -^> http://localhost:8080
