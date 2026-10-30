#!/bin/bash

PROJECT="$(git rev-parse --show-toplevel)"

while true; do
    echo "[$(date '+%H:%M:%S')] Prüfe GitHub ..."

    git -C "$PROJECT" fetch origin

    if [ $? -eq 0 ]; then
        git -C "$PROJECT" pull --ff-only origin main
    else
        echo "GitHub konnte nicht erreicht werden."
    fi

    sleep 60
done
