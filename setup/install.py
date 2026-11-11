"""Install every style in this repo so it is ready to use.

    python setup/install.py [--update] [--skip-node] [--skip-models] [--skills-dir PATH]

1. Python packages from setup/requirements.txt
2. Copies the skills into ~/.claude/skills:
     basic-style (this whole repo: Basic style 1/2/3 + the picker), basic-style-1/2/3 (shortcuts), basic-style-4,
     basic-rick-style, basic-2d-vintage-character, basic-jkson-what-if-style
   Copies left under the old names (rick-style, 2d-vintage-character, jkson-what-if-style) move to ~/.claude/skills-backup.
   A skill that already exists is left alone; --update pulls it (git) or replaces it (old copy moved to ~/.claude/skills-backup).
3. Node packages the render scripts share (three, puppeteer-core) in the project folders, and Playwright Chromium
4. The Whisper 'small' speech model (about 480 MB), so the first transcription does not stall
5. Runs setup/doctor.py

Run setup/install.ps1 (Windows) or setup/install.sh (Mac/Linux) first if Python, Node, ffmpeg or Chrome are missing:
they install those and then call this script.
"""
import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
WIN = os.name == "nt"
SKILLS = {
    "basic-style": REPO,
    # Thin shortcuts so /basic-style-1, -2, -3 show up in the slash menu; they read the styles inside basic-style.
    "basic-style-1": REPO / "launchers" / "basic-style-1",
    "basic-style-2": REPO / "launchers" / "basic-style-2",
    "basic-style-3": REPO / "launchers" / "basic-style-3",
    "basic-style-4": REPO / "styles" / "basic-style-4",
    # Every skill name starts with "basic" so typing /basic lists all styles together.
    "basic-rick-style": REPO / "styles" / "rick-style",
    "basic-2d-vintage-character": REPO / "styles" / "2d-vintage-character",
    "basic-jkson-what-if-style": REPO / "styles" / "jkson-what-if-style",
}
# Folder names used before the "basic-" prefix; an old copy is moved to skills-backup so it is not loaded twice.
OLD_NAMES = {
    "rick-style": "basic-rick-style",
    "2d-vintage-character": "basic-2d-vintage-character",
    "jkson-what-if-style": "basic-jkson-what-if-style",
}
# Shared node_modules that each style's new-video.sh would otherwise install on its first project.
NODE_SHARED = {
    "basic-style-2": ["puppeteer-core"],
    "basic-style-3": ["three@0.170.0", "puppeteer-core@23.11.1"],
    "basic-style-4": ["three@0.170.0", "puppeteer-core@23.11.1"],
    "rick-style": ["three@0.170.0", "puppeteer-core@23.11.1"],
}
IGNORE = shutil.ignore_patterns("node_modules", "__pycache__", "*.pyc")


def step(msg):
    print(f"\n== {msg}", flush=True)


def sh(cmd, cwd=None):
    exe = shutil.which(cmd[0]) or cmd[0]
    print("  $", " ".join(cmd), flush=True)
    return subprocess.run([exe] + cmd[1:], cwd=cwd).returncode == 0


def video_root():
    if os.environ.get("VIDEO_ROOT"):
        return Path(os.environ["VIDEO_ROOT"])
    if WIN and Path("D:/").exists():
        return Path("D:/")
    return Path.home() / "Videos"


def install_skill(name, src, dst_dir, update):
    dst = dst_dir / name
    if dst.resolve() == src.resolve():
        print(f"  {name}: already running from {dst}")
        return
    if dst.exists():
        if not update:
            print(f"  {name}: already installed at {dst} (use --update to refresh)")
            return
        if (dst / ".git").exists() and shutil.which("git"):
            print(f"  {name}: git pull")
            if sh(["git", "-C", str(dst), "pull", "--ff-only"]):
                return
        # Backups go outside the skills folder, or Claude would load the old copy as a second skill.
        bak = dst_dir.parent / "skills-backup" / f"{name}-{time.strftime('%Y%m%d-%H%M%S')}"
        bak.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(dst), str(bak))
        print(f"  {name}: old copy moved to {bak}")
    shutil.copytree(src, dst, ignore=IGNORE)
    print(f"  {name}: installed at {dst}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--update", action="store_true", help="refresh skills that are already installed")
    ap.add_argument("--skip-node", action="store_true", help="skip npm packages and Playwright Chromium")
    ap.add_argument("--skip-models", action="store_true", help="skip the Whisper model download")
    ap.add_argument("--skills-dir", default=str(Path.home() / ".claude" / "skills"))
    a = ap.parse_args()

    if not ((3, 10) <= sys.version_info[:2] <= (3, 13)):
        print(f"Python {sys.version.split()[0]} found; use Python 3.10-3.13 (3.12 recommended). "
              "On Windows: py -3.12 setup/install.py")
        sys.exit(1)

    step("Python packages")
    if not sh([sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-r",
               str(REPO / "setup" / "requirements.txt")]):
        print("pip failed; fix the error above and run again.")
        sys.exit(1)

    step(f"Skills -> {a.skills_dir}")
    dst_dir = Path(a.skills_dir).expanduser()
    dst_dir.mkdir(parents=True, exist_ok=True)
    for old, new in OLD_NAMES.items():
        if (dst_dir / old / "SKILL.md").is_file():
            bak = dst_dir.parent / "skills-backup" / f"{old}-{time.strftime('%Y%m%d-%H%M%S')}"
            bak.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(dst_dir / old), str(bak))
            print(f"  {old}: renamed to {new}; old copy moved to {bak}")
    for name, src in SKILLS.items():
        install_skill(name, src, dst_dir, a.update)

    if not a.skip_node:
        npm = "npm.cmd" if WIN else "npm"
        npx = "npx.cmd" if WIN else "npx"
        if not shutil.which(npm):
            print("\nnpm not found: install Node.js first (setup/install.ps1 or setup/install.sh), then run again.")
        else:
            root = video_root()
            step(f"Shared Node packages in {root}")
            for style, pkgs in NODE_SHARED.items():
                base = root / style
                names = [p.rsplit("@", 1)[0] if p.count("@") and not p.startswith("@") else p for p in pkgs]
                if all((base / "node_modules" / n).is_dir() for n in names):
                    print(f"  {style}: already there")
                    continue
                base.mkdir(parents=True, exist_ok=True)
                if not (base / "package.json").exists():
                    sh([npm, "init", "-y"], cwd=base)
                sh([npm, "install", "--no-audit", "--no-fund"] + pkgs, cwd=base)
            step("Playwright Chromium (2D Vintage Character)")
            sh([npx, "-y", "playwright@1.56.0", "install", "chromium"])

    if not a.skip_models:
        step("Whisper speech model 'small'")
        code = "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8'); print('  ready')"
        sh([sys.executable, "-c", code])

    step("Check")
    subprocess.run([sys.executable, str(REPO / "setup" / "doctor.py")], env={**os.environ, "CLAUDE_SKILLS_DIR": str(dst_dir)})
    print("\nStart a new Claude Code chat so it picks up the skills, then write e.g. 'Basic style 3 9:16' "
          "and send the VO, script and visual brief.")


if __name__ == "__main__":
    main()
