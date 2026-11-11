"""Objective mix check: stem loudness per location, voice-to-bed margin, peaks, spectrum balance."""
import json, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile
OUT = sys.argv[1]; cues = json.load(open(sys.argv[2], encoding="utf-8"))
SR = 48000
def rd(n):
    sr, x = wavfile.read(f"{OUT}/{n}"); return x.astype(np.float64) / 32768
v, s, a, m, mix = [rd(n) for n in ("stem_vo.wav", "stem_sfx.wav", "stem_amb.wav", "stem_music.wav", "mix.wav")]
# stems are written at -6 dB
v, s, a, m = v * 2, s * 2, a * 2, m * 2
def k(x):
    y = signal.lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    return signal.lfilter([1, -2, 1], [1, -1.99004745483398, 0.99007225036621], y, axis=0)
def db(x): return 10 * np.log10((k(x) ** 2).sum(1).mean() + 1e-12) - .691
print(f"integrated-ish dB  vo {db(v):.1f}  sfx {db(s):.1f}  amb {db(a):.1f}  music {db(m):.1f}  mix {db(mix):.1f}")
print("peaks", *[f"{n} {np.abs(x).max():.2f}" for n, x in (("vo", v), ("sfx", s), ("amb", a), ("mus", m), ("mix", mix))])
regs = {}
for sh in cues["shots"]:
    regs.setdefault(sh["amb"], []).append((sh["t0"], sh["t1"]))
print("location      amb    mus    sfx    vo")
for n, rr in regs.items():
    idx = np.concatenate([np.arange(int(a0 * SR), min(len(v), int(b0 * SR))) for a0, b0 in rr])
    print(f"{n:12s} {db(a[idx]):6.1f} {db(m[idx]):6.1f} {db(s[idx]):6.1f} {db(v[idx]):6.1f}")
for lo, hi in ((20, 80), (80, 250), (250, 1000), (1000, 4000), (4000, 10000), (10000, 20000)):
    f = signal.sosfilt(signal.butter(4, [lo / 24000, min(hi / 24000, .999)], "band", output="sos"), mix.mean(1))
    print(f"{lo:>5}-{hi:<5}Hz {20 * np.log10(np.sqrt((f ** 2).mean()) + 1e-9):6.1f} dB")
L, R = mix[:, 0], mix[:, 1]
print("stereo corr", round(float(np.corrcoef(L, R)[0, 1]), 3), "side/mid dB", round(20 * np.log10(np.std(L - R) / np.std(L + R)), 1))
cl = (np.abs(mix) > .98).sum(); print("samples >-0.2dBFS", int(cl))
