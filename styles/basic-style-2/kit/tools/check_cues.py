"""Does each spotted hit actually read in the mix? Compares the level just after each cue with just before it."""
import json, os
import numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "build", "timeline.json"), encoding="utf-8"))
sr, x = wavfile.read(os.path.join(ROOT, "audio", "stems", "sfx.wav")); sfx = x.mean(axis=1)
sr, x = wavfile.read(os.path.join(ROOT, "audio", "mix.wav")); mix = x.mean(axis=1)
def rms(a): return 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9)
print(f'{"cue":<12}{"time":>7}{"sfx pre":>9}{"sfx post":>9}{"mix post":>9}')
for k, t in sorted(TL["c"].items(), key=lambda q: q[1]):
    i = int(t * sr); a = sfx[max(0, i - int(.14 * sr)):i - int(.01 * sr)]; b = sfx[i:i + int(.14 * sr)]; m = mix[i:i + int(.14 * sr)]
    if len(b) == 0 or len(a) == 0: continue
    flag = "" if rms(b) - rms(a) > 1.5 or rms(b) > -22 else "  <- weak"
    print(f'{k:<12}{t:7.2f}{rms(a):9.1f}{rms(b):9.1f}{rms(m):9.1f}{flag}')
