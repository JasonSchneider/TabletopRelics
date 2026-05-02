#!/usr/bin/env bash
# One-time git initialization for the Tabletop Relics repo.
# Run from the project root:  bash scripts/setup-git.sh
set -euo pipefail

REMOTE_URL="https://github.com/JasonSchneider/TabletopRelics.git"

# Refuse to run from anywhere except the project root.
if [ ! -f "package.json" ]; then
  echo "Error: run this from the Tabletop Relics project root." >&2
  exit 1
fi

# Clean up any prior failed init attempt.
if [ -d ".git" ]; then
  echo "Removing existing .git directory..."
  rm -rf .git
fi

echo "Initializing repo on main branch..."
git init -b main

# Only set local identity if global isn't already configured.
if ! git config --global user.name >/dev/null 2>&1; then
  git config user.name "Jason Schneider"
fi
if ! git config --global user.email >/dev/null 2>&1; then
  git config user.email "jas.schneider@gmail.com"
fi

echo "Staging files..."
git add .

echo "Creating initial commit..."
git commit -m "Initial scaffold: Vite + React + TS PWA with Web Bluetooth layer"

echo "Adding GitHub remote..."
git remote add origin "$REMOTE_URL"

echo
echo "Local repo ready. Now push to GitHub:"
echo "  git push -u origin main"
echo
echo "If push asks for credentials, the cleanest path is GitHub CLI:"
echo "  brew install gh && gh auth login"
