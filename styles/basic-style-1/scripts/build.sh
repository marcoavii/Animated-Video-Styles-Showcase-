#!/bin/sh
# film.js = engine.js + story.js (satu modul). Usage: build.sh <folder-kerja>
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
cat "$SKILL/engine/engine.js" "$1/story.js" > "$1/film.js"
wc -l "$1/film.js"
