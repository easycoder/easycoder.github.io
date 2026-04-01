#!/bin/bash
# Build code.zip in the repo root from the starter pack files
cd "$(dirname "$0")/.."
zip -j code.zip code/CLAUDE.md code/code.ecs code/edit.html
echo "Built code.zip"
