@echo off
rem scripts/scan.bat - auto-test securite (DAST) sous Windows.
rem Lance OWASP ZAP (baseline) authentifie admin. Prerequis : Docker Desktop + l'app qui tourne.
setlocal enabledelayedexpansion
if "%PORT%"=="" set PORT=3000
set ROOT=%~dp0..
set BASE=http://host.docker.internal:%PORT%
if not exist "%ROOT%\reports" mkdir "%ROOT%\reports"

curl -fsS -o NUL http://localhost:%PORT%/ || (echo L'app ne repond pas sur le port %PORT% - lance d'abord : docker compose up -d & exit /b 1)

rem session admin par login legitime
for /f "tokens=7" %%a in ('curl -fsS -o NUL -c - --data-urlencode "username=admin" --data-urlencode "password=S3cur3P@ss" http://localhost:%PORT%/login ^| findstr /C:"session"') do set JWT=%%a
if defined JWT (set COOKIE=session=!JWT!& echo session admin obtenue) else (echo login admin impossible - scan non authentifie)

echo ==^> ZAP baseline (DAST) - peut prendre 1 a 3 min...
if defined COOKIE (
  docker run --rm --add-host=host.docker.internal:host-gateway -v "%ROOT%\reports:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t %BASE% -r zap.html -I -z "-config replacer.full_list(0).description=auth -config replacer.full_list(0).enabled=true -config replacer.full_list(0).matchtype=REQ_HEADER -config replacer.full_list(0).matchstr=Cookie -config replacer.full_list(0).regex=false -config replacer.full_list(0).replacement=!COOKIE!"
) else (
  docker run --rm --add-host=host.docker.internal:host-gateway -v "%ROOT%\reports:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t %BASE% -r zap.html -I
)

echo ==^> Decouverte de contenu
where ffuf >NUL 2>&1 && (
  ffuf -s -u %BASE%/FUZZ -w "%~dp0wordlist-scan.txt" -mc 200,204,301,302,307,401,403 -b "!COOKIE!" -of simple -o "%ROOT%\reports\ffuf.txt"
) || (
  echo ffuf non installe sous Windows - lance plutot scripts/scan.sh sous WSL/Git Bash pour la decouverte.
)

echo Termine. Rapports dans reports\ : zap.html, ffuf.txt
endlocal
