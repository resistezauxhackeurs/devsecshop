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

Comptes de démo : `admin`, `alice` (mot de passe `password`), `bob`.

## TP 0 - intro : « comment une appli se fait compromettre »

Avant DevSecShop, un petit lab PHP **séparé** (dossier `intro/`) : SQLi → récup admin →
upload d'un webshell → exécution de commandes. Énoncé : `enonces/tp0.html`.

```bash
cd intro
docker compose -f docker-compose.local.yml up -d --build   # -> http://localhost:8080
```

## Les TP (DevSecShop)

Ouvre **`enonces/index.html`** (la page TP) : récupérer, lancer, et pour chaque TP
l'astuce, le résultat attendu et le « corrige puis reteste ». Les énoncés complets
sont dans `enonces/` (`tp1.html` … `tp8.html`). Chaque TP : **Partie A** tu exploites
la faille sur l'app qui tourne ; **Partie B** tu corriges le code et tu ajoutes le
contrôle CI/CD correspondant.

## Lancer les tests (abuse-cases)

```bash
# Linux / macOS / Git Bash
./scripts/test.sh
# Windows
scripts\test.bat
```

## Voir / récupérer le correctif officiel d'un TP

Chaque TP a une branche solution **cumulative** (socle + correctifs jusqu'à ce TP) :

```bash
git fetch origin
git diff main origin/solution/tp3     # comparer ta tentative au corrigé du TP3
git checkout solution/tp3             # ou basculer sur l'état corrigé du TP3
```

`solution/tp8` = état « capstone » (tout corrigé, pipeline complète).

## Pipeline CI/CD

Un workflow GitHub Actions est à la racine (`.github/workflows/`). Au fork, il
tourne à l'état TP1 (build + lint + test). À chaque TP tu ajoutes un job de
sécurité (secret scanning, SAST, SCA, DAST, gate) - les branches solution le montrent.

> Le fichier `.env` versionné contient de **faux** secrets (c'est la matière du TP2).
> GitHub peut bloquer le push (push protection) : autorise l'exception, ce ne sont pas de vrais secrets.
