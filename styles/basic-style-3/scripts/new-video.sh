#!/bin/sh
# usage: new-video.sh <nama-video> <9:16|16:9> "<path-vo>" [--example]
# Makes D:/basic-style-3/<nama-video> as its own copy of the kit, so later skill changes cannot alter a finished video.
# --example loads the full Penjaga Mercusuar film instead of the empty template.
set -e
NAME="$1"; RATIO="$2"; VO="$3"; EXAMPLE="$4"
[ -z "$NAME" ] || [ -z "$RATIO" ] && { echo "usage: new-video.sh <nama-video> <9:16|16:9> <path-vo> [--example]"; exit 2; }
case "$RATIO" in 9:16|16:9) ;; *) echo "rasio harus 9:16 atau 16:9"; exit 2;; esac
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
HOME_DIR="/d/basic-style-3"
P="$HOME_DIR/$NAME"
[ -e "$P" ] && { echo "$P sudah ada"; exit 1; }
mkdir -p "$P"
cp -r "$SKILL/kit/." "$P/"
mkdir -p "$P/vo" "$P/out/qc" "$P/audio/out"
if [ "$EXAMPLE" = "--example" ]; then
  cp "$SKILL/examples/penjaga-mercusuar/"*.js "$P/scenes/js/"
  cp "$SKILL/examples/penjaga-mercusuar/script.json" "$P/vo/script.json"
else
  cp "$SKILL/templates/story.js" "$SKILL/templates/cast.js" "$SKILL/templates/set_room.js" "$SKILL/templates/set_outdoor.js" "$P/scenes/js/"
  cp "$SKILL/templates/script.json" "$P/vo/script.json"
  cp "$SKILL/templates/custom_sfx.py" "$P/audio/custom_sfx.py"
fi
if [ -n "$VO" ]; then
  EXT="${VO##*.}"
  cp "$VO" "$P/vo/vo_source.$EXT"
fi
printf '{"name":"%s","ratio":"%s"}\n' "$NAME" "$RATIO" > "$P/project.json"
# one shared install for all videos
if [ ! -d "$HOME_DIR/node_modules/three" ] || [ ! -d "$HOME_DIR/node_modules/puppeteer-core" ]; then
  cd "$HOME_DIR"
  [ -f package.json ] || npm init -y >/dev/null
  npm install three@0.170.0 puppeteer-core@23.11.1 --no-audit --no-fund
fi
echo "OK: $P"
