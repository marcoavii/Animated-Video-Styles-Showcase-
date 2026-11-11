#!/usr/bin/env bash
# One-time setup on Mac (or Linux) for every style in this repo.
#   bash setup/install.sh            (asks once before installing programs)
#   bash setup/install.sh --yes      (installs without asking)
# Any other arguments go to install.py, e.g.  bash setup/install.sh --update
#
# Mac: installs Homebrew if it is missing (macOS asks for your login password once), then Python 3.12,
# Node.js, ffmpeg, Git and Google Chrome. Python packages go into their own environment
# (~/.animated-video-styles/venv) so macOS never refuses the install, and that environment's `python`
# is put first on PATH in ~/.zprofile, ~/.zshrc and ~/.bash_profile, which is the `python` the skills call.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
HOME_ENV="$HOME/.animated-video-styles"
VENV="$HOME_ENV/venv"
YES=0; REST=()
for a in "$@"; do if [ "$a" = "--yes" ]; then YES=1; else REST+=("$a"); fi; done
OS="$(uname)"

say() { printf '\n== %s\n' "$*"; }
ask() {
  [ $YES -eq 1 ] && return 0
  read -r -p "$1 [Y/n] " ans
  case "$ans" in ""|[Yy]*) return 0;; *) echo "Stopped. Nothing else was installed."; exit 1;; esac
}
find_python() {
  for c in python3.12 python3.13 python3.11 python3.10 python3; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)' 2>/dev/null; then
      command -v "$c"; return 0
    fi
  done
  return 1
}
has_chrome() {
  [ -n "$CHROME_PATH" ] && [ -e "$CHROME_PATH" ] && return 0
  for p in "/Applications/Google Chrome.app" "$HOME/Applications/Google Chrome.app" "/Applications/Microsoft Edge.app" \
           /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/microsoft-edge; do
    [ -e "$p" ] && return 0
  done
  return 1
}
node_ok() { command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ]; }
ffmpeg_ok() { command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; }
ffmpeg_has_subs() { ffmpeg -hide_banner -filters 2>/dev/null | grep -q " subtitles "; }
# Lines added to the shell profiles, so every new terminal (and Claude Code) finds the tools.
PROFILE_LINES=()
add_profile_line() { PROFILE_LINES+=("$1"); eval "$1"; }
write_profiles() {
  [ ${#PROFILE_LINES[@]} -eq 0 ] && return 0
  for rc in "$HOME/.zprofile" "$HOME/.zshrc" "$HOME/.bash_profile"; do
    [ "$OS" != "Darwin" ] && [ "$rc" = "$HOME/.zprofile" ] && continue
    touch "$rc"
    for line in "${PROFILE_LINES[@]}"; do
      grep -qxF "$line" "$rc" || printf '%s\n' "$line" >> "$rc"
    done
  done
  [ "$OS" != "Darwin" ] && [ -f "$HOME/.bashrc" ] && for line in "${PROFILE_LINES[@]}"; do
    grep -qxF "$line" "$HOME/.bashrc" || printf '%s\n' "$line" >> "$HOME/.bashrc"
  done
  return 0
}

if [ "$OS" = "Darwin" ]; then
  # Homebrew
  if ! command -v brew >/dev/null 2>&1; then
    for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)"; done
  fi
  NEED=(); CASK=()
  find_python >/dev/null || NEED+=(python@3.12)
  node_ok || NEED+=(node)
  ffmpeg_ok || NEED+=(ffmpeg)
  command -v git >/dev/null 2>&1 || NEED+=(git)
  has_chrome || CASK+=(google-chrome)
  if ! command -v brew >/dev/null 2>&1; then
    say "Homebrew is not installed. It is the Mac package manager used to install everything else."
    echo "Will install: Homebrew ${NEED[*]} ${CASK[*]}"
    ask "Install now? macOS will ask for your login password once."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
      if [ -x "$b" ]; then add_profile_line "eval \"\$($b shellenv)\""; break; fi
    done
  elif [ ${#NEED[@]} -gt 0 ] || [ ${#CASK[@]} -gt 0 ]; then
    say "Missing: ${NEED[*]} ${CASK[*]}"
    ask "Install them with Homebrew?"
  fi
  [ ${#NEED[@]} -gt 0 ] && brew install "${NEED[@]}"
  [ ${#CASK[@]} -gt 0 ] && brew install --cask "${CASK[@]}"
  # The captions are burned in with ffmpeg's subtitles filter (libass). Use ffmpeg-full if the plain build lacks it.
  if ! ffmpeg_has_subs; then
    say "ffmpeg has no subtitles filter, installing ffmpeg-full"
    if brew install ffmpeg-full; then
      add_profile_line "export PATH=\"$(brew --prefix ffmpeg-full)/bin:\$PATH\""
    else
      echo "WARNING: could not install ffmpeg-full; burned-in captions need an ffmpeg built with libass."
    fi
  fi
else
  MISS=()
  find_python >/dev/null || MISS+=(python3 python3-venv python3-pip)
  node_ok || MISS+=(nodejs npm)
  ffmpeg_ok || MISS+=(ffmpeg)
  command -v git >/dev/null 2>&1 || MISS+=(git)
  has_chrome || MISS+=(chromium)
  if [ ${#MISS[@]} -gt 0 ]; then
    if command -v apt-get >/dev/null 2>&1; then
      say "Missing: ${MISS[*]}"
      ask "Install them with apt (asks for your sudo password)?"
      sudo apt-get update && sudo apt-get install -y "${MISS[@]}"
    else
      echo "Install these with your package manager, then run this again: ${MISS[*]} (Node.js 18 or newer)"; exit 1
    fi
  fi
  node_ok || { echo "Node.js is older than 18. Install Node 20 LTS from nodejs.org, then run this again."; exit 1; }
fi

PY="$(find_python)" || { echo "Python 3.10-3.13 not found. Open a new terminal and run this again."; exit 1; }

# Own Python environment: avoids "externally-managed-environment" errors and gives a plain `python` command.
if [ ! -x "$VENV/bin/python" ]; then
  say "Creating the Python environment in $VENV"
  mkdir -p "$HOME_ENV"
  "$PY" -m venv "$VENV" || { echo "Could not create a venv. On Linux: sudo apt install python3-venv"; exit 1; }
fi
add_profile_line "export PATH=\"$VENV/bin:\$PATH\""
write_profiles

"$VENV/bin/python" "$REPO/setup/install.py" "${REST[@]}"
echo
echo "Open a NEW terminal (or restart Claude Code) so the new PATH is used."
