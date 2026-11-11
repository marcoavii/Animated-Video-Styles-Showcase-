#!/usr/bin/env bash
# One-time setup on Mac or Linux for every style in this repo.
#   bash setup/install.sh            (asks before installing programs)
#   bash setup/install.sh --yes      (installs without asking)
# Any other arguments go to install.py, e.g.  bash setup/install.sh --update
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
YES=0; REST=()
for a in "$@"; do if [ "$a" = "--yes" ]; then YES=1; else REST+=("$a"); fi; done

find_python() {
  for c in python3.12 python3.13 python3.11 python3.10 python3 python; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)' 2>/dev/null; then
      command -v "$c"; return 0
    fi
  done
  return 1
}
has_chrome() {
  [ -n "$CHROME_PATH" ] && [ -e "$CHROME_PATH" ] && return 0
  for p in "/Applications/Google Chrome.app" "/Applications/Microsoft Edge.app" /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/microsoft-edge; do
    [ -e "$p" ] && return 0
  done
  return 1
}

NEED_BREW=(); NEED_CASK=(); NEED_APT=()
find_python >/dev/null || { NEED_BREW+=(python@3.12); NEED_APT+=(python3 python3-pip python3-venv); }
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then NEED_BREW+=(node); NEED_APT+=(nodejs npm); fi
{ command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; } || { NEED_BREW+=(ffmpeg); NEED_APT+=(ffmpeg); }
command -v git >/dev/null || { NEED_BREW+=(git); NEED_APT+=(git); }
has_chrome || { NEED_CASK+=(google-chrome); NEED_APT+=(chromium); }

if [ ${#NEED_BREW[@]} -gt 0 ] || [ ${#NEED_CASK[@]} -gt 0 ]; then
  if [ "$(uname)" = "Darwin" ]; then
    command -v brew >/dev/null || { echo "Install Homebrew from https://brew.sh first, then run this again."; exit 1; }
    echo "Missing: ${NEED_BREW[*]} ${NEED_CASK[*]}"
    if [ $YES -eq 0 ]; then read -r -p "Install them with Homebrew? [Y/n] " ans; case "$ans" in ""|[Yy]*) ;; *) echo "Stopped."; exit 1;; esac; fi
    [ ${#NEED_BREW[@]} -gt 0 ] && brew install "${NEED_BREW[@]}"
    [ ${#NEED_CASK[@]} -gt 0 ] && brew install --cask "${NEED_CASK[@]}"
  else
    echo "Missing programs. Install them, then run this script again:"
    echo "  sudo apt install ${NEED_APT[*]}"
    echo "(Node.js must be 18 or newer; Chrome can also be installed from google.com/chrome.)"
    exit 1
  fi
else
  echo "Python, Node.js, ffmpeg, git and Chrome/Edge are already installed."
fi

PY="$(find_python)" || { echo "Python 3.10-3.13 not found. Open a new terminal and run this again."; exit 1; }
exec "$PY" "$REPO/setup/install.py" "${REST[@]}"
