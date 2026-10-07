# tools/ — kit de détection (fourni)

Configs et règles prêtes à l'emploi pour lancer les scanners **en local** pendant les TP,
sans attendre d'avoir construit la pipeline. Ce sont les mêmes fichiers que ceux déployés
à la racine dans les corrigés (branches `solution/tpN`) pour la CI.

| Fichier | Rôle | TP |
|---|---|---|
| `.gitleaks.toml` | Règles de secret-scanning | TP2 |
| `.pre-commit-config.yaml` | Hook pre-commit (gitleaks) | TP2 |
| `semgrep-rules/` | Règles SAST maison | TP3, 5, 6, 7 |
| `.zap/rules.tsv` | Seuils ZAP baseline (DAST) | TP4 |

## Exemples

```bash
# Secrets (TP2) — détecte les secrets du dépôt, y compris dans l'historique
gitleaks detect --source . --config tools/.gitleaks.toml -v

# SAST (TP3/5/6/7) — motifs dangereux dans le code
semgrep scan --config tools/semgrep-rules --config p/javascript src/

# Hook pre-commit (TP2) — test sans installer le hook à la racine
pre-commit run --all-files -c tools/.pre-commit-config.yaml
```

Le dossier `wordlists/` (à la racine) fournit `rockyou-top1000.txt` pour le brute force (TP3) :

```bash
ffuf -X POST -u http://localhost:3000/login \
  -d "username=alice&password=FUZZ" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -w wordlists/rockyou-top1000.txt -mc 302
```
