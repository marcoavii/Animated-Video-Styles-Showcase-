"""Objective mix report: speech vs bed levels, per-shot loudness, peaks of each hit."""
import json, os, sys
import numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "build", "timeline.json"), encoding="utf-8"))
sr, x = wavfile.read(os.path.join(ROOT, "audio", "mix.wav"))
mono = x.mean(axis=1)
def rms(a): return 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9)
def seg(a, b): return mono[int(a * sr):int(b * sr)]

speech, gaps = [], []
order = TL["order"]
for i, pid in enumerate(order):
    p = TL["p"][pid]; speech.append(seg(p["s"], p["e"]))
    if i + 1 < len(order):
        n = TL["p"][order[i + 1]]
        if n["s"] - p["e"] > .2: gaps.append((p["e"] + .03, n["s"] - .03))
print("speech rms dB", round(rms(np.concatenate(speech)), 1), " (reference: -12.8)")
vals = [rms(seg(a, b)) for a, b in gaps]
print("gap rms dB  median", round(float(np.median(vals)), 1), "min", round(min(vals), 1), "max", round(max(vals), 1), " (reference: median about -21.7)")
print("stereo: L/R correlation", round(float(np.corrcoef(x[:, 0], x[:, 1])[0, 1]), 3))
cuts = TL["cuts"] + [{"scene": "END", "t": TL["dur"]}]
print("\nshot            rms    peak   VO-to-bed (speech minus gap in this shot)")
for a, b in zip(cuts, cuts[1:]):
    s = seg(a["t"], b["t"])
    sp, gp = [], []
    for i, pid in enumerate(order):
        p = TL["p"][pid]
        if a["t"] <= p["s"] < b["t"]: sp.append(seg(p["s"], p["e"]))
    for g0, g1 in gaps:
        if a["t"] <= g0 < b["t"]: gp.append(seg(g0, g1))
    r = f'{rms(np.concatenate(sp)) - rms(np.concatenate(gp)):5.1f}' if sp and gp else "  -  "
    print(f'{a["scene"]:<14}{rms(s):6.1f} {20*np.log10(np.max(np.abs(s))+1e-9):6.1f}   {r}')
# energy in bands for the whole mix
from scipy.signal import welch
f, p = welch(mono, sr, nperseg=8192)
bands = [(20, 60), (60, 200), (200, 800), (800, 3000), (3000, 8000), (8000, 18000)]
tot = p.sum()
print("\nband share (dB rel. total):", {f"{a}-{b}": round(10*np.log10(p[(f>=a)&(f<b)].sum()/tot), 1) for a, b in bands})
