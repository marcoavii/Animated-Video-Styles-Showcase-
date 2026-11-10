#!/bin/sh
# Siapkan folder kerja video baru. Usage: new-video.sh <folder-kerja> <vo.mp3>
set -e
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$1"; VO="$2"
[ -n "$DIR" ] && [ -f "$VO" ] || { echo "Usage: new-video.sh <folder-kerja> <vo.mp3>"; exit 1; }
mkdir -p "$DIR/frames"
cp "$VO" "$DIR/vo.mp3"
cp "$SKILL/scripts/render.html" "$SKILL/scripts/tr.html" "$DIR/"
[ -f "$DIR/story.js" ] || cp "$SKILL/templates/story-template.js" "$DIR/story.js"
sh "$SKILL/scripts/build.sh" "$DIR"
echo "Siap: $DIR (edit story.js, lalu jalankan build.sh lagi)"
