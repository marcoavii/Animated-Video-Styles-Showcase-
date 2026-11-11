"""Create a new video project from one of the kits.

python new_project.py vintage <project_dir>     2D Vintage cartoon (three.js + Playwright)

Copies the kit, the shared tools (tts, words, captions, srt, thumbnails, contact sheets) and the
audio engine (dsp, instruments, mix) into the project, and makes the work/out/thumb/stills folders.
Afterwards run `npm install` inside the project (see the skill for the browser step).
"""
import shutil
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
SKILL = TOOLS.parent
KITS = {
    "vintage": SKILL / "kit",
}
SHARED = ["tts.py", "words.py", "captions.py", "srt.py", "thumbnail.mjs", "sheet.py", "align.py", "paper.py", "textures.py"]
AUDIO = ["dsp.py", "instruments.py", "mix.py"]


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in KITS:
        print(__doc__)
        sys.exit(2)
    kit, dest = KITS[sys.argv[1]], Path(sys.argv[2]).resolve()
    if not kit.is_dir():
        have = [k for k, v in KITS.items() if v.is_dir()]
        print(f"This skill only has the '{', '.join(have)}' kit.")
        sys.exit(1)
    if dest.exists() and any(dest.iterdir()):
        print(f"{dest} already exists and is not empty. Pick a new folder name.")
        sys.exit(1)
    shutil.copytree(kit, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns("node_modules", "__pycache__"))
    (dest / "tools").mkdir(exist_ok=True)
    for f in SHARED:
        shutil.copy2(TOOLS / f, dest / "tools" / f)
    (dest / "audio").mkdir(exist_ok=True)
    for f in AUDIO:
        shutil.copy2(TOOLS / f, dest / "audio" / f)
    for d in ["work", "out", "thumb", "stills"]:
        (dest / d).mkdir(exist_ok=True)
    print(f"Created {sys.argv[1]} project at {dest}")
    print("Next: cd into it and run `npm install`.")


if __name__ == "__main__":
    main()
