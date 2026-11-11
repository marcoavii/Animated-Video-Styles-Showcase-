#!/bin/sh
# usage: new-video.sh <nama-video> <9:16|16:9> "<path-vo>"
# Makes <VIDEO_ROOT>/basic-style-5/<nama-video> (D:/basic-style-5 on a PC with drive D:) as its own copy of the kit.
set -e
NAME="$1"; RATIO="$2"; VO="$3"
[ -z "$NAME" ] || [ -z "$RATIO" ] && { echo "usage: new-video.sh <nama-video> <9:16|16:9> <path-vo>"; exit 2; }
case "$RATIO" in 9:16|16:9) ;; *) echo "rasio harus 9:16 atau 16:9"; exit 2;; esac
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
if [ -z "$VIDEO_ROOT" ]; then if [ -d /d ]; then VIDEO_ROOT=/d; else VIDEO_ROOT="$HOME/Videos"; fi; fi
HOME_DIR="$VIDEO_ROOT/basic-style-5"
mkdir -p "$HOME_DIR"
P="$HOME_DIR/$NAME"
[ -e "$P" ] && { echo "$P sudah ada"; exit 1; }
mkdir -p "$P"
cp -r "$SKILL/kit/." "$P/"
mkdir -p "$P/vo" "$P/out/qc" "$P/audio/out"
cp "$SKILL/templates/story.js" "$P/scenes/js/"
cp "$SKILL/templates/script.json" "$P/vo/script.json"
cp "$SKILL/templates/custom_sfx.py" "$P/audio/custom_sfx.py"
for f in "$SKILL/templates/"*.js; do [ "$(basename "$f")" = story.js ] || cp "$f" "$P/scenes/js/"; done
if [ -n "$VO" ]; then EXT="${VO##*.}"; cp "$VO" "$P/vo/vo_source.$EXT"; fi
printf '{"name":"%s","ratio":"%s","fps":30}\n' "$NAME" "$RATIO" > "$P/project.json"
if [ ! -d "$HOME_DIR/node_modules/three" ] || [ ! -d "$HOME_DIR/node_modules/puppeteer-core" ]; then
  cd "$HOME_DIR"; [ -f package.json ] || npm init -y >/dev/null
  npm install three@0.170.0 puppeteer-core@23.11.1 --no-audit --no-fund
fi
echo "OK: $P"
