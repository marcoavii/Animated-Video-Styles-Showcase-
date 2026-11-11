#!/bin/sh
# usage: new-video.sh <nama-video> <9:16|16:9> "<path-vo>" [--example]
# Makes <VIDEO_ROOT>/rick-style/<nama-video> (D:/rick-style on a PC with drive D:) as its own copy of the kit, so later skill changes cannot alter a finished video.
set -e
NAME="$1"; RATIO="$2"; VO="$3"; EXAMPLE="$4"
[ -z "$NAME" ] || [ -z "$RATIO" ] && { echo "usage: new-video.sh <nama-video> <9:16|16:9> <path-vo> [--example]"; exit 2; }
case "$RATIO" in 9:16|16:9) ;; *) echo "rasio harus 9:16 atau 16:9"; exit 2;; esac
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
# Project root: $VIDEO_ROOT if set, else drive D: when it exists (Windows), else ~/Videos.
if [ -z "$VIDEO_ROOT" ]; then if [ -d /d ]; then VIDEO_ROOT=/d; else VIDEO_ROOT="$HOME/Videos"; fi; fi
HOME_DIR="$VIDEO_ROOT/rick-style"
mkdir -p "$HOME_DIR"
P="$HOME_DIR/$NAME"
[ -e "$P" ] && { echo "$P sudah ada"; exit 1; }
mkdir -p "$P"
cp -r "$SKILL/kit/." "$P/"
mkdir -p "$P/vo" "$P/out/qc" "$P/audio/out"
if [ "$EXAMPLE" = "--example" ]; then
  cp "$SKILL/examples/smong-sample/"*.js "$P/scenes/js/"
  cp "$SKILL/examples/smong-sample/script.json" "$P/vo/script.json"
  cp "$SKILL/examples/smong-sample/custom_sfx.py" "$P/audio/custom_sfx.py"
else
  cp "$SKILL/templates/story.js" "$SKILL/templates/cast.js" "$P/scenes/js/"
  cp "$SKILL/templates/script.json" "$P/vo/script.json"
  cp "$SKILL/templates/custom_sfx.py" "$P/audio/custom_sfx.py"
fi
if [ -n "$VO" ]; then EXT="${VO##*.}"; cp "$VO" "$P/vo/vo_source.$EXT"; fi
printf '{"name":"%s","ratio":"%s"}\n' "$NAME" "$RATIO" > "$P/project.json"
# one shared install for all videos of this style
if [ ! -d "$HOME_DIR/node_modules/three" ] || [ ! -d "$HOME_DIR/node_modules/puppeteer-core" ]; then
  cd "$HOME_DIR"; [ -f package.json ] || npm init -y >/dev/null
  npm install three@0.170.0 puppeteer-core@23.11.1 --no-audit --no-fund
fi
echo "OK: $P"
