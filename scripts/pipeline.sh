#!/usr/bin/env bash
# scripts/pipeline.sh - lance la "pipeline" de securite EN LOCAL (equivalent CI, sans GitHub Actions).
# Enchaine les memes controles que la CI et ECHOUE (exit 1) si un controle BLOQUANT echoue = le "gate".
# Tout en Docker : seul Docker est requis. L'app n'a PAS besoin de tourner (sauf --with-dast).
#
#   ./scripts/pipeline.sh              # lint, tests, secrets, SAST, SCA, conteneur
#   ./scripts/pipeline.sh --with-dast  # + DAST (ZAP) : demarre l'app via scan.sh
#
# Au depart (code vulnerable) beaucoup de controles sont ROUGES : c'est le point de depart.
# Chaque TP en corrige un ; a la fin, la pipeline est verte.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/.." && pwd)"; cd "$ROOT"
WITH_DAST=0; [ "${1:-}" = "--with-dast" ] && WITH_DAST=1
FAIL=0
pass(){ printf '  \033[1;32mPASS\033[0m  %s\n' "$*"; }
fail(){ printf '  \033[1;31mFAIL\033[0m  %s\n' "$*"; FAIL=1; }
skip(){ printf '  \033[1;33m----\033[0m  %s\n' "$*"; }
step(){ printf '\n\033[1;36m== %s ==\033[0m\n' "$*"; }

# Git Bash / MSYS : chemin Windows pour les bind-mounts docker
MP="$ROOT"; PC=""
case "$(uname -s 2>/dev/null)" in MINGW*|MSYS*) MP="$(pwd -W)"; PC=1;; esac
dr(){ if [ -n "$PC" ]; then MSYS_NO_PATHCONV=1 docker "$@"; else docker "$@"; fi; }

step "1/6  Lint (informatif, ne bloque pas)"
if docker compose run --rm --no-deps app npm run lint >/dev/null 2>&1; then pass "lint"; else skip "lint remonte des avertissements (non bloquant)"; fi

step "2/6  Tests (abuse-cases)"
if docker compose run --rm --no-deps app npm test >/dev/null 2>&1; then pass "tests au vert"; else fail "tests en echec"; fi

step "3/6  Secrets (gitleaks, historique inclus)"
if dr run --rm -v "$MP:/repo" zricethezav/gitleaks:latest detect --source /repo --config /repo/tools/.gitleaks.toml --no-banner >/dev/null 2>&1; then
  pass "aucun secret"; else fail "secrets detectes - cf. gitleaks detect --config tools/.gitleaks.toml -v"; fi

step "4/6  SAST (semgrep, regles maison)"
if dr run --rm -v "$MP:/src" -w /src semgrep/semgrep semgrep scan --error --config tools/semgrep-rules src/ >/dev/null 2>&1; then
  pass "aucun motif dangereux"; else fail "motifs dangereux - cf. semgrep scan --config tools/semgrep-rules src/"; fi

step "5/6  SCA (npm audit >= high)"
# npm audit exige un lockfile : on le genere a la volee dans le conteneur (le projet
# n'en versionne pas), sans rien ecrire dans le depot (mount en lecture seule).
if dr run --rm -v "$MP:/src:ro" node:20 sh -c "cp /src/package.json /tmp/ && cd /tmp && npm install --package-lock-only --no-audit --no-fund >/dev/null 2>&1 && npm audit --audit-level=high" >/dev/null 2>&1; then
  pass "dependances OK"; else fail "dependances vulnerables - cf. npm audit"; fi

step "6/6  Conteneur (hadolint ; trivy informatif)"
# mount du depot pour que hadolint lise .hadolint.yaml (regles ignorees du lab)
if dr run --rm -v "$MP:/repo" -w /repo hadolint/hadolint hadolint Dockerfile >/dev/null 2>&1; then
  pass "Dockerfile propre (hadolint)"; else fail "Dockerfile - cf. hadolint Dockerfile"; fi
if docker build -q -t devsecshop:ci . >/dev/null 2>&1 \
   && dr run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image -q --severity HIGH,CRITICAL --ignore-unfixed --exit-code 0 devsecshop:ci >/dev/null 2>&1; then
  skip "trivy execute (informatif - CVE de l'image de base)"; else skip "trivy non execute (informatif)"; fi

if [ "$WITH_DAST" -eq 1 ]; then
  step "DAST (ZAP baseline authentifie) via scan.sh"
  if bash "$HERE/scan.sh" >/dev/null 2>&1; then pass "DAST execute - rapport dans reports/zap.html"; else skip "DAST informatif - voir reports/zap.html"; fi
fi

step "RESULTAT"
if [ "$FAIL" -eq 0 ]; then
  printf '  \033[1;42m PIPELINE VERTE \033[0m  tous les controles bloquants passent.\n'; exit 0
else
  printf '  \033[1;41m PIPELINE ROUGE \033[0m  corrige les points FAIL ci-dessus, puis relance.\n'; exit 1
fi
