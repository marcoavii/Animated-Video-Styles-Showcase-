#!/bin/sh
# Creates a Basic style 2 project:  sh new-video.sh <name> <9:16|16:9> <vo-file> [example]
# Pass "taman-iblis" as the example to start from the proven demo instead of the blank template.
set -e
NAME="$1"; RATIO="$2"; VO="$3"; EXAMPLE="$4"
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
BASE="/d/basic-style-2"
[ -n "$NAME" ] && [ -n "$RATIO" ] || { echo "usage: new-video.sh <name> <9:16|16:9> <vo-file> [example]"; exit 1; }
case "$RATIO" in "9:16"|"16:9") ;; *) echo "ratio must be 9:16 or 16:9"; exit 1;; esac
PROJ="$BASE/$NAME"
mkdir -p "$PROJ/build" "$PROJ/audio" "$PROJ/out"
cp -r "$SKILL/kit/." "$PROJ/"
if [ -n "$EXAMPLE" ]; then SRC="$SKILL/examples/$EXAMPLE"; else SRC="$SKILL/templates"; fi
# Files that belong to the video are never overwritten if the project already exists.
[ -f "$PROJ/script.json" ] || cp "$SRC/script.json" "$PROJ/script.json"
[ -f "$PROJ/cues.json" ] || cp "$SRC/cues.json" "$PROJ/cues.json"
[ -f "$PROJ/src/scenes.js" ] || cp "$SRC/scenes.js" "$PROJ/src/scenes.js"
[ -f "$PROJ/sound.py" ] || cp "$SRC/sound.py" "$PROJ/sound.py"
printf '{"name":"%s","ratio":"%s"}\n' "$NAME" "$RATIO" > "$PROJ/project.json"
if [ -n "$VO" ]; then cp "$VO" "$PROJ/audio/vo_source.${VO##*.}"; fi
# One shared browser driver for every project.
if [ ! -d "$BASE/node_modules/puppeteer-core" ]; then
  (cd "$BASE" && { [ -f package.json ] || npm init -y >/dev/null; } && npm i --no-audit --no-fund puppeteer-core)
fi
echo "project ready: $PROJ"
