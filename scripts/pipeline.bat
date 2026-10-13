@echo off
rem scripts/pipeline.bat - pipeline de securite EN LOCAL (equivalent CI), Windows.
rem Seul Docker Desktop est requis. Usage : scripts\pipeline.bat  (ou avec --with-dast)
setlocal enabledelayedexpansion
set ROOT=%~dp0..
pushd "%ROOT%"
set FAIL=0

echo.
echo == 1/6  Lint (informatif) ==
docker compose run --rm --no-deps app npm run lint >NUL 2>&1 && (echo   PASS lint) || (echo   ---- lint : avertissements (non bloquant^))

echo.
echo == 2/6  Tests (abuse-cases) ==
docker compose run --rm --no-deps app npm test >NUL 2>&1 && (echo   PASS tests) || (echo   FAIL tests& set FAIL=1)

echo.
echo == 3/6  Secrets (gitleaks) ==
docker run --rm -v "%ROOT%:/repo" zricethezav/gitleaks:latest detect --source /repo --config /repo/tools/.gitleaks.toml --no-banner >NUL 2>&1 && (echo   PASS aucun secret) || (echo   FAIL secrets detectes& set FAIL=1)

echo.
echo == 4/6  SAST (semgrep) ==
docker run --rm -v "%ROOT%:/src" -w /src semgrep/semgrep semgrep scan --error --config tools/semgrep-rules src/ >NUL 2>&1 && (echo   PASS SAST propre) || (echo   FAIL motifs dangereux& set FAIL=1)

echo.
echo == 5/6  SCA (npm audit ^>= high) ==
docker run --rm -v "%ROOT%:/src:ro" node:20 sh -c "cp /src/package.json /tmp/ && cd /tmp && npm install --package-lock-only --no-audit --no-fund >/dev/null 2>&1 && npm audit --audit-level=high" >NUL 2>&1 && (echo   PASS deps OK) || (echo   FAIL deps vulnerables& set FAIL=1)

echo.
echo == 6/6  Conteneur (hadolint) ==
docker run --rm -v "%ROOT%:/repo" -w /repo hadolint/hadolint hadolint Dockerfile >NUL 2>&1 && (echo   PASS Dockerfile) || (echo   FAIL Dockerfile& set FAIL=1)

echo.
if "%FAIL%"=="0" (echo   PIPELINE VERTE - tous les controles bloquants passent.& popd& exit /b 0) else (echo   PIPELINE ROUGE - corrige les points FAIL ci-dessus.& popd& exit /b 1)
