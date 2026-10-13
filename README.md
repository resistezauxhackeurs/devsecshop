# DevSecShop - lab CI/CD DevSecOps (dépôt étudiant)

Boutique Node/Express **volontairement vulnérable**. Tu l'attaques, puis tu la
corriges et tu verrouilles la pipeline CI/CD. Tout tourne en Docker : seul
**Docker Desktop** (ou Docker Engine + Compose v2) est requis, rien d'autre à installer.

> Lab volontairement vulnérable - à lancer en local, jamais sur un serveur public.

## Démarrer

```bash
docker compose up --build -d      # app -> http://localhost:3000
docker compose logs -f app        # logs
docker compose down               # arrêt
```

**Mode CTF** : les ports sont exposés sur `0.0.0.0`. Depuis une autre machine du réseau,
l'app est accessible via l'IP de l'hôte : `http://<IP-de-l-hote>:3000` (et `:8080` pour
l'intro). Trouve l'IP avec `hostname -I` (Linux) ou `ipconfig` (Windows).
À n'utiliser que sur un **réseau de salle isolé / de confiance** (ces apps sont volontairement vulnérables).

Comptes de démo : `admin`, `alice` (mot de passe `password`), `bob`.

## TP 0 - intro : « comment une appli se fait compromettre »

Avant DevSecShop, un petit lab PHP **séparé** (dossier `intro/`) : SQLi → récup admin →
upload d'un webshell → exécution de commandes. Énoncé : `intro/enonce/enonce-etudiant.html`.

```bash
cd intro
docker compose -f docker-compose.local.yml up -d --build   # -> http://localhost:8080
```

## Les TP (DevSecShop)

Les énoncés des TP (TP1 à TP8) sont **fournis séparément** par le formateur. Chaque TP :
**Partie A** tu exploites la faille sur l'app qui tourne ; **Partie B** tu corriges le
code et tu ajoutes le contrôle CI/CD correspondant (le correctif de référence est sur la
branche `solution/tpN`).

## Lancer les tests (abuse-cases)

```bash
# Linux / macOS / Git Bash
./scripts/test.sh
# Windows
scripts\test.bat
```

## Auto-test sécurité (DAST) : ZAP + ffuf

Scanne ton app pendant qu'elle tourne (`docker compose up -d`). Le script récupère une
session admin (login légitime), lance un **ZAP baseline** et une **découverte de contenu**
(`ffuf` si installé, sinon `curl`). Tout en Docker, rien à installer à part Docker.

```bash
# Linux / macOS / Git Bash
./scripts/scan.sh
# Windows
scripts\scan.bat
```

Rapports générés dans `reports/` (non versionné) : `zap.html` (à ouvrir dans un navigateur)
et `ffuf.txt`. Ce même scan (authentifié) devient un **job CI** que tu ajoutes au **TP4**
(DAST). Compare le scan avant / après tes correctifs : les alertes doivent reculer.

## Voir / récupérer le correctif officiel d'un TP

Chaque TP a une branche solution **cumulative** (socle + correctifs jusqu'à ce TP) :

```bash
git fetch origin
git diff main origin/solution/tp3     # comparer ta tentative au corrigé du TP3
git checkout solution/tp3             # ou basculer sur l'état corrigé du TP3
```

`solution/tp8` = état « capstone » (tout corrigé, pipeline complète).

## Pipeline de sécurité - en local (pas besoin de GitHub Actions)

Les contrôles se lancent **sur ta machine**, tout en Docker :

```bash
./scripts/pipeline.sh     # le "gate" : lint, tests, secrets, SAST, SCA, conteneur
scripts\pipeline.bat      # Windows
```

Au départ (code vulnérable) la pipeline est **rouge** ; chaque TP corrige une faille jusqu'à
la rendre **verte**. Automatise-la avant chaque push :

```bash
git config core.hooksPath scripts/githooks   # active le hook pre-push
```

Les fichiers `.github/workflows/` fournis sont l'**équivalent CI** (référence) : à lire pour
voir « à quoi ça ressemble sur un serveur », à pousser seulement si ton compte autorise GitHub
Actions (facultatif).

> Le fichier `.env` versionné contient de **faux** secrets (c'est la matière du TP2).
