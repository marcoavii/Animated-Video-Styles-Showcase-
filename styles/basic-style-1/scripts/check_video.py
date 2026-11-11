"""Check the final MP4 (Windows, Mac, Linux). Same output as check_video.ps1.

python check_video.py <video.mp4> [out_dir]

Prints the streams, the loudness / true peak (target: peak below -1 dBTP) and writes contact_sheet.jpg
(24 frames from the real file, not from the renderer) next to the video or into out_dir.
"""
import os
import subprocess
import sys

if len(sys.argv) < 2:
    print(__doc__); sys.exit(2)
video = sys.argv[1]
out_dir = sys.argv[2] if len(sys.argv) > 2 else (os.path.dirname(os.path.abspath(video)))


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


print(run(["ffprobe", "-v", "error", "-show_entries",
           "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration,size",
           "-of", "default=nw=1", video]).stdout.strip())
dur = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).stdout.strip())
print("--- audio (target: puncak di bawah -1 dBTP) ---")
log = run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
print("\n".join(log.strip().splitlines()[-12:]))
print("--- contact sheet ---")
sheet = os.path.join(out_dir, "contact_sheet.jpg")
run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", video, "-vf",
     f"fps={round(24 / dur, 4)},scale=240:-1,tile=8x3", "-frames:v", "1", "-q:v", "3", sheet])
print(sheet)
