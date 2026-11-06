#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v git >/dev/null; then echo 'Git non trovato: installa gli Xcode Command Line Tools (xcode-select --install).'; read -r; exit 1; fi
if [ ! -d CosaRegalo_Guide_Prezzi ]; then echo 'Manca la cartella CosaRegalo_Guide_Prezzi: estrai il pacchetto ZIP prima di avviare.'; read -r; exit 1; fi
if command -v gh >/dev/null 2>&1; then
  gh auth status >/dev/null 2>&1 || gh auth login
  gh auth setup-git >/dev/null 2>&1 || true
fi
REPO='https://github.com/panoramic23/cosaregalo.git'
WORKDIR="$(mktemp -d)"
echo 'Clono il repository privato GitHub (potrebbe essere richiesta autenticazione)...'
if ! git clone "$REPO" "$WORKDIR/repo"; then
  echo 'Accesso GitHub fallito. Configura GitHub CLI con: gh auth login (https://cli.github.com/) e riprova.'
  read -r; exit 1
fi
echo 'Copio i file V6 preservando gli altri file esistenti nel repository...'
rsync -a --exclude='.git' --exclude='.DS_Store' CosaRegalo_Guide_Prezzi/ "$WORKDIR/repo/"
cd "$WORKDIR/repo"
git add -A
if git diff --cached --quiet; then echo 'Tutto già aggiornato.'; else git commit -m 'Import CosaRegalo V6 complete HTML site and admin'; git push origin main; fi
printf '\nVerifica il repository: https://github.com/panoramic23/cosaregalo\n'
read -r -p 'Premi Invio per chiudere...'
