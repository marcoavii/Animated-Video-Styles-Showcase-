"""Check that this computer has everything the video styles in this repo need.

python setup/doctor.py      -> OK / MISSING / NOTE per item with the fix, exit code 1 if something required is missing

Covers Basic style 1-4, Rick Style, 2D Vintage Character and jkson what if style.
"""
import importlib.metadata as md
import importlib.util
import os
import platform
import re
import shutil
import subprocess
import sys
from pathlib import Path

WIN = platform.system() == "Windows"
MAC = platform.system() == "Darwin"
SKILLS = Path(os.environ.get("CLAUDE_SKILLS_DIR") or Path.home() / ".claude" / "skills")


def run(cmd):
    exe = shutil.which(cmd[0])
    if not exe:
        return None
    try:
        r = subprocess.run([exe] + cmd[1:], capture_output=True, text=True, timeout=30)
        return (r.stdout or r.stderr).strip()
    except Exception:
        return None


def fix(win, mac, linux):
    return win if WIN else mac if MAC else linux


def find_chrome():
    la = os.environ.get("LOCALAPPDATA", "")
    for p in [os.environ.get("CHROME_PATH"),
              r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              la and os.path.join(la, r"Google\Chrome\Application\chrome.exe"),
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              os.path.expanduser("~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
              "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
              "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
              "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"]:
        if p and os.path.exists(p):
            return p
    return None


rows, missing = [], 0


def check(name, ok, detail, how, required=True):
    global missing
    status = "OK     " if ok else ("MISSING" if required else "NOTE   ")
    rows.append((status, name, detail if ok else how))
    if not ok and required:
        missing += 1


REQ = "setup/requirements.txt"
PIP = f'"{sys.executable}" -m pip install -r {REQ}'

# Python
v = sys.version_info
check("Python 3.10-3.13", (3, 10) <= v[:2] <= (3, 13), sys.version.split()[0],
      fix("winget install -e --id Python.Python.3.12", "brew install python@3.12", "install Python 3.12")
      + f"   (this is {sys.version.split()[0]})")
for mod, pkg in [("numpy", "numpy"), ("scipy", "scipy"), ("PIL", "pillow"), ("edge_tts", "edge-tts"),
                 ("faster_whisper", "faster-whisper")]:
    check(f"python: {pkg}", importlib.util.find_spec(mod) is not None, "installed", PIP)
try:
    av = md.version("av")
except md.PackageNotFoundError:
    av = None
check("python: av 14.2.0", av == "14.2.0", av or "", f"{PIP}   (found av {av}; newer av breaks faster-whisper)"
      if av else PIP)

# Node
nv = run(["node", "--version"])
m = re.match(r"v(\d+)", nv or "")
check("Node.js 18+", bool(m and int(m.group(1)) >= 18), nv,
      fix("winget install -e --id OpenJS.NodeJS.LTS", "brew install node", "install Node 20+ LTS from nodejs.org"))
npm = run(["npm.cmd" if WIN else "npm", "--version"]) or run(["npm", "--version"])
check("npm", bool(npm), npm, "comes with Node.js; open a new terminal after installing Node")

# ffmpeg
for tool in ["ffmpeg", "ffprobe"]:
    out = run([tool, "-version"])
    check(tool, bool(out), (out or "").splitlines()[0][:60] if out else "",
          fix("winget install -e --id Gyan.FFmpeg", "brew install ffmpeg", "sudo apt install ffmpeg"))

# Burned-in captions (2D Vintage Character) use ffmpeg's subtitles filter, which needs libass
if run(["ffmpeg", "-version"]):
    filters = run(["ffmpeg", "-hide_banner", "-filters"]) or ""
    check("ffmpeg subtitles filter", " subtitles " in filters, "libass",
          fix("winget install -e --id Gyan.FFmpeg", "brew install ffmpeg-full   (then put $(brew --prefix ffmpeg-full)/bin first on PATH)",
              "install an ffmpeg built with libass"))

# Browser for rendering (Basic style 1-4, Rick Style)
ch = find_chrome()
check("Chrome or Edge", bool(ch), ch, fix("winget install -e --id Google.Chrome", "brew install --cask google-chrome",
                                          "install google-chrome-stable") + "   (or set CHROME_PATH)")

# Shell + git (the new-video.sh scripts are POSIX sh; on Windows that is Git Bash)
check("git", bool(run(["git", "--version"])), "found", fix("winget install -e --id Git.Git", "xcode-select --install", "sudo apt install git"))
sh_ok = bool(shutil.which("sh") or shutil.which("bash") or (WIN and Path(r"C:\Program Files\Git\bin\bash.exe").exists()))
check("sh / bash", sh_ok, "found", "install Git for Windows (it brings Git Bash)")

# Playwright Chromium (2D Vintage Character)
pw = Path(os.environ.get("PLAYWRIGHT_BROWSERS_PATH") or (
    Path(os.environ.get("LOCALAPPDATA", "")) / "ms-playwright" if WIN else
    Path.home() / ("Library/Caches/ms-playwright" if MAC else ".cache/ms-playwright")))
has_pw = pw.is_dir() and any(d.name.startswith("chromium") for d in pw.iterdir())
check("Playwright Chromium", has_pw, str(pw), "npx -y playwright@1.56.0 install chromium   (2D Vintage Character)", required=False)

# Whisper speech model cache
hub = Path(os.environ.get("HF_HOME", Path.home() / ".cache" / "huggingface")) / "hub"
has_small = (hub / "models--Systran--faster-whisper-small").is_dir()
check("Whisper model 'small'", has_small, "cached",
      "downloads by itself on the first transcription (about 480 MB)", required=False)

# Installed skills
for name in ["basic-style", "basic-style-1", "basic-style-2", "basic-style-3", "basic-style-4", "basic-style-5",
             "basic-rick-style", "basic-2d-vintage-character", "basic-jkson-what-if-style"]:
    check(f"skill: {name}", (SKILLS / name / "SKILL.md").is_file(), str(SKILLS / name),
          "python setup/install.py   (copies every style into ~/.claude/skills)", required=False)

# ElevenLabs (only jkson what if style makes its own voice with it)
check("ELEVENLABS_API_KEY", bool(os.environ.get("ELEVENLABS_API_KEY")), "set",
      "not needed: every style uses your uploaded VO (only jkson's optional --tts / --engine elevenlabs uses it)", required=False)

w = max(len(r[1]) for r in rows)
for status, name, info in rows:
    print(f"{status}  {name.ljust(w)}  {info}")
if missing:
    print(f"\n{missing} required item(s) missing. Run setup/install.ps1 (Windows) or setup/install.sh (Mac/Linux),")
    print("or install them by hand, then open a NEW terminal so PATH refreshes and run doctor.py again.")
else:
    print("\nAll required tools are installed. NOTE lines are optional or download by themselves.")
sys.exit(1 if missing else 0)
