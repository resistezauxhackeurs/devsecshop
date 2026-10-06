#!/usr/bin/env bash
# scripts/scan.sh - auto-test securite de l'app (DAST).
# Lance OWASP ZAP (baseline) + une decouverte de contenu (ffuf), en mode authentifie admin.
# Prerequis : Docker, et l'app qui tourne (docker compose up -d). ffuf est optionnel
# (utilise s'il est installe, sinon repli sur curl). Rien d'autre a installer.
#
#   Usage : ./scripts/scan.sh          # scan complet (ZAP + decouverte)
#           PORT=3001 ./scripts/scan.sh  # si l'app ecoute sur un autre port
set -e

PORT="${PORT:-3000}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
REPORTS="$ROOT/reports"; mkdir -p "$REPORTS"
LOCAL="http://localhost:$PORT"                 # cible pour les outils de l'hote (ffuf/curl)
INDOCKER="http://host.docker.internal:$PORT"   # cible pour ZAP (qui tourne en conteneur)
ADDHOST="--add-host=host.docker.internal:host-gateway"

# Git Bash / MSYS (Windows) : Docker exige un chemin Windows pour le bind-mount, et il
# faut desactiver la conversion de chemins MSYS sur l'appel docker (sinon /zap/wrk est
# mange). On NE l'applique PAS a tout le script (curl perdrait son cookie-jar).
IS_MINGW=""
case "$(uname -s 2>/dev/null)" in
  MINGW*|MSYS*) REPORTS="$(cd "$ROOT" && pwd -W)/reports"; IS_MINGW=1;;
esac

say(){ printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# 0) l'app repond-elle ?
if ! curl -fsS -o /dev/null "$LOCAL/"; then
  echo "L'app ne repond pas sur $LOCAL - lance d'abord :  docker compose up -d"; exit 1
fi

# 1) session admin par login legitime (fonctionne quel que soit l'etat de durcissement).
#    Surchargeable : SCAN_COOKIE="session=..." ./scripts/scan.sh
say "Authentification admin"
COOKIE="${SCAN_COOKIE:-}"
if [ -z "$COOKIE" ]; then
  CJ="$(mktemp)"
  curl -fsS -o /dev/null -c "$CJ" \
    --data-urlencode 'username=admin' --data-urlencode 'password=S3cur3P@ss' \
    "$LOCAL/login" 2>/dev/null || true
  JWT="$(awk '$6=="session"{print $7}' "$CJ" 2>/dev/null | tail -1)"
  rm -f "$CJ"
  [ -n "$JWT" ] && COOKIE="session=$JWT"
fi
if [ -n "$COOKIE" ]; then echo "    session admin obtenue (scan authentifie)"
else echo "    login admin impossible - scan NON authentifie (surface publique seulement)"; fi

# 2) ZAP baseline (DAST) : spider + regles passives/actives legeres, non destructif.
say "ZAP baseline (DAST) - peut prendre 1 a 3 min (telechargement de l'image au 1er run)"
# l'option -z doit recevoir TOUTE la config en UN seul argument -> tableau bash.
ZAP_OPTS=()
if [ -n "$COOKIE" ]; then
  ZAP_OPTS=(-z "-config replacer.full_list(0).description=auth -config replacer.full_list(0).enabled=true -config replacer.full_list(0).matchtype=REQ_HEADER -config replacer.full_list(0).matchstr=Cookie -config replacer.full_list(0).regex=false -config replacer.full_list(0).replacement=$COOKIE")
fi
if [ -n "$IS_MINGW" ]; then
  # prefixe LITTERAL (une affectation issue d'une expansion n'est pas honoree par bash)
  MSYS_NO_PATHCONV=1 docker run --rm $ADDHOST -v "$REPORTS:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py -t "$INDOCKER" -r zap.html -I "${ZAP_OPTS[@]}" || true
else
  docker run --rm $ADDHOST -v "$REPORTS:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py -t "$INDOCKER" -r zap.html -I "${ZAP_OPTS[@]}" || true
fi
echo "    rapport : reports/zap.html"

# 3) decouverte de contenu : ffuf si present, sinon repli curl.
say "Decouverte de routes/fichiers"
WL="$HERE/wordlist-scan.txt"
OUT="$REPORTS/ffuf.txt"
if command -v ffuf >/dev/null 2>&1; then
  ffuf -s -u "$LOCAL/FUZZ" -w "$WL" -mc 200,204,301,302,307,401,403 \
    ${COOKIE:+-b "$COOKIE"} -of simple -o "$OUT" || true
  echo "--- trouves (code / chemin) ---"; cat "$OUT" 2>/dev/null || true
else
  echo "    (ffuf non installe - repli sur curl)"
  : > "$OUT"
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    code="$(curl -s -o /dev/null -w '%{http_code}' ${COOKIE:+-b "$COOKIE"} "$LOCAL/$p")"
    case "$code" in 200|204|301|302|307|401|403)
      printf '%s\t/%s\n' "$code" "$p" | tee -a "$OUT";;
    esac
  done < "$WL"
fi

say "Termine. Rapports dans reports/ : zap.html (ouvrir dans un navigateur), ffuf.txt"
