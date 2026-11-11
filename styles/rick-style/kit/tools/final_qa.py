"""Checks on the delivered MP4: loop match, frozen frames, biggest jumps, picture-to-sound sync on relay cues.
usage: final_qa.py <video.mp4> <cues.json>"""
import json, subprocess, sys
import numpy as np
F = sys.argv[1]; meta = json.load(open(sys.argv[2], encoding="utf-8"))
size = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", F], capture_output=True, text=True).stdout.strip().split(",")
portrait = int(size[1]) > int(size[0])
W, H = (108, 192) if portrait else (192, 108)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", F, "-vf", f"scale={W}:{H}", "-pix_fmt", "gray", "-f", "rawvideo", "-"], capture_output=True).stdout
v = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
m = np.ones((H, W), bool)  # leave the caption band out of comparisons
if portrait: m[int(H * .66):int(H * .76)] = False
else: m[int(H * .7):int(H * .84)] = False
if meta.get("ending", "loop") == "loop":
    print("loop diff first vs last frame (0-255, under about 5 is seamless):", round(float(np.abs(v[0] - v[-1])[m].mean()), 2))
else:
    print("last frame mean luma (should be near black):", round(float(v[-1].mean()), 1))
d = np.abs(np.diff(v, axis=0))[:, m].mean(1)
print("mean luma min/max:", round(float(v.mean((1, 2)).min()), 1), round(float(v.mean((1, 2)).max()), 1))
fz = np.where(d < 0.02)[0]
print("near-frozen frame pairs:", len(fz), fz[:12].tolist())
top = np.argsort(d)[-6:][::-1]
print("largest jumps:", [(round(float(i / 60), 2), round(float(d[i]), 1)) for i in top])
L = np.array([s["t1"] - s["t0"] for s in meta["shots"]])
print("shots", len(L), "mean", round(float(L.mean()), 2), "median", round(float(np.median(L)), 2), "max", round(float(L.max()), 2))
aud = subprocess.run(["ffmpeg", "-v", "error", "-i", F, "-ac", "1", "-ar", "8000", "-f", "f32le", "-"], capture_output=True).stdout
print("audio seconds", round(len(aud) / 4 / 8000, 3), "video seconds", round(len(v) / 60, 3))
