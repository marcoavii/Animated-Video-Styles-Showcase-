# 2D Vintage Character: setup

Read this when Node.js, Python or ffmpeg are missing, when the user asks to check or repair the setup, or before the first video on a new computer.

`<skill>` is the 2D Vintage Character skill folder. Its tools live in `<skill>/tools`.

## 1. Check
Run `python <skill>/tools/doctor.py` (on Windows try `py` if `python` isn't found). It prints OK / MISSING for Node.js 18+, npm, Python 3.10+, ffmpeg and the Python packages (numpy, scipy, pillow, edge-tts, faster-whisper), plus the command that fixes each one.

If everything is OK, say so in one line and continue with the video.

## 2. Install what's missing
Tell the user in one short list what you're about to install, then install it:
- **Windows** (winget, already on Windows 10/11): `winget install -e --id OpenJS.NodeJS.LTS`, `winget install -e --id Python.Python.3.12`, `winget install -e --id Gyan.FFmpeg`. Add `--accept-source-agreements --accept-package-agreements` only after the user has agreed to install. After winget, refresh PATH in the same PowerShell session:
  `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`
- **Mac** (Homebrew): `brew install node python@3.12 ffmpeg`. If `brew` is missing, ask the user to install it from brew.sh first (it needs their password, so they must run it themselves).
- **Linux:** `sudo apt install nodejs npm python3-pip ffmpeg` (the user runs sudo commands themselves).
- **Python packages:** `python -m pip install -r <skill>/tools/requirements.txt`.

Run `doctor.py` again until everything shows OK.

## 3. Notes
- The browser that renders the cartoon (Playwright Chromium) is installed per project (`npx playwright install chromium`).
- If `npx playwright install chromium` freezes while unpacking on Windows (it can stall on chromium, headless shell or its small ffmpeg download), stop it. For each folder in `%LOCALAPPDATA%\ms-playwright` that is incomplete, extract the matching zip from `%TEMP%\playwright-download-*` with `tar -xf` into it if its files are missing, then create an empty `INSTALLATION_COMPLETE` file in it. Delete the leftover `%LOCALAPPDATA%\ms-playwright\__dirlock` folder.
- Never kill all Chrome processes to clean up (that closes the user's own browser). Only stop processes whose path is under `ms-playwright`.
- The first Whisper run downloads its speech model (about 500 MB for `small.en`), so it takes longer once.
