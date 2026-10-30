#!/usr/bin/env bash

set -e

echo "🔍 Prüfe den Git-Status ..."

if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Lokale Änderungen erkannt."
    echo "Bitte committen oder sichern, bevor du aktualisierst."
    exit 1
fi

echo "⬇️ Lade Änderungen von GitHub ..."
git fetch --tags origin

echo "🔄 Aktualisiere main ..."
git pull --rebase --tags origin main

echo "✅ GoalNews wurde aktualisiert."
