"""Basic style 3 sound design. Everything is synthesized here, nothing sampled, so it is license-free.

Signal flow (a real post-production layout):
  VO     -> HPF, de-ess, presence EQ, compression
  SFX    -> per-cue layered synthesis (transient + body + tail), panned, sent to the reverb of the scene it sits in
  AMB    -> one designed bed per location, crossfaded on picture changes, ducked by the voice
  MUSIC  -> sparse pizzicato/strings score by story act, ducked by the voice
  MASTER -> glue compression, lookahead limiter, -14 LUFS / -1 dBTP

usage: design.py <cues.json> <timing.json> <vo_raw.wav> <outdir>
"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.signal import fftconvolve

SR = 48000
cues_meta = json.load(open(sys.argv[1], encoding="utf-8"))
timing = json.load(open(sys.argv[2], encoding="utf-8"))
vo_path, OUT = sys.argv[3], sys.argv[4]
os.makedirs(OUT, exist_ok=True)
DUR = cues_meta["dur"]
N = int(DUR * SR) + 1
SHOTS = cues_meta["shots"]
rs = np.random.RandomState(1347)


# ------------------------------------------------------------------ primitives
def T(d): return np.arange(int(max(d, 1e-3) * SR)) / SR
def noise(d): return rs.randn(int(max(d, 1e-3) * SR)).astype(np.float64)
def sos(kind, f, order=2):
    return signal.butter(order, np.array(f) / (SR / 2), kind, output="sos")
def lp(x, f, o=2): return signal.sosfilt(sos("lowpass", min(f, SR * 0.48), o), x)
def hp(x, f, o=2): return signal.sosfilt(sos("highpass", f, o), x)
def bp(x, a, b, o=2): return signal.sosfilt(sos("bandpass", [a, min(b, SR * 0.48)], o), x)
def env_exp(d, rate): return np.exp(-T(d) * rate)
def adsr(d, a=0.01, r=0.05, shape=1.0):
    n = int(d * SR); e = np.ones(n)
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    if na > 0: e[:na] = np.linspace(0, 1, na) ** shape
    if nr > 0: e[-nr:] *= np.linspace(1, 0, nr) ** shape
    return e
def fit(x, n):
    if len(x) >= n: return x[:n]
    return np.pad(x, (0, n - len(x)))
def sweep_bp(x, f0, f1, q=1.2, step=256):
    """time-varying band-pass (state variable filter)"""
    n = len(x); y = np.zeros(n); lo = bd = 0.0
    fr = f0 * (f1 / f0) ** (np.arange(n) / max(1, n - 1)) if np.isscalar(f0) else None
    return _svf(x, fr, q)
def _svf(x, fr, q=1.2):
    n = len(x); y = np.zeros(n); lo = bd = 0.0; q1 = 1.0 / q
    g = 2 * np.sin(np.pi * np.clip(fr, 10, SR * 0.2) / SR)
    for i in range(n):
        hi = x[i] - lo - q1 * bd
        bd += g[i] * hi; lo += g[i] * bd
        y[i] = bd
    return y
def lp_var(x, fr):
    """one-pole cascade with moving cutoff"""
    n = len(x); y = np.zeros(n); a = b = 0.0
    k = 1 - np.exp(-2 * np.pi * np.clip(fr, 20, SR * 0.45) / SR)
    for i in range(n):
        a += k[i] * (x[i] - a); b += k[i] * (a - b); y[i] = b
    return y
def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak
def sat(x, drive=1.5): return np.tanh(x * drive) / np.tanh(drive)
def sine_sweep(d, f0, f1, curve="exp", phase=0.0):
    t = T(d); n = len(t)
    fr = f0 * (f1 / f0) ** (t / d) if curve == "exp" else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(fr) / SR + phase)
def saw(fr, n=None):
    if np.isscalar(fr): fr = np.full(n, fr)
    ph = np.cumsum(fr) / SR
    # band limited by summing harmonics would be slow; PolyBLEP-free saw softened by filter later
    return 2 * (ph % 1) - 1
def square(fr, n=None):
    if np.isscalar(fr): fr = np.full(n, fr)
    return np.sign(np.sin(2 * np.pi * np.cumsum(fr) / SR))
def pan_st(x, p=0.0):
    """equal-power pan; p may be array"""
    p = np.clip(p, -1, 1); a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)
def wide(x, amt=0.5, ms=11):
    """Haas + decorrelation: gives mono layers real stereo width"""
    d = int(ms * SR / 1000)
    r = np.concatenate([np.zeros(d), x])[: len(x)]
    return np.stack([x * (1 - amt * 0.2) + r * amt * 0.3, x * (1 - amt * 0.2) - r * amt * 0.3 + r * amt * 0.35], axis=1)
def to_st(x, p=0.0): return pan_st(x, p) if x.ndim == 1 else x


# ------------------------------------------------------------------ reverbs (synthesized impulse responses)
def make_ir(t60, predelay=0.01, bright=6000, dark=1200, er=None, seed=1):
    R = np.random.RandomState(seed); n = int(t60 * 1.2 * SR)
    out = []
    for ch in range(2):
        x = R.randn(n)
        d = np.exp(-6.91 * np.arange(n) / (t60 * SR))
        # high frequencies die faster than lows: what makes a room sound real
        a = lp(x, dark) * d; b = hp(x, dark) * d * np.exp(-np.arange(n) / (0.32 * t60 * SR))
        ir = lp(a + b * 0.7, bright)
        if er:
            for tt, g in er:
                k = int(tt * SR * (1 + ch * 0.07))
                if k < n: ir[k] += g * (1 if ch else -1) * 0.6 * np.abs(x).max()
        out.append(np.concatenate([np.zeros(int(predelay * SR)), ir]))
    ir = np.stack(out, 1)
    return ir / np.sqrt((ir ** 2).sum(0).mean())

IRS = {
    "office": make_ir(0.42, 0.006, 5200, 900, [(0.011, .5), (0.019, .4), (0.031, .3)], 1),
    "lamp": make_ir(0.75, 0.004, 8000, 1500, [(0.009, .6), (0.017, .5), (0.026, .45), (0.041, .35)], 2),
    "stairs": make_ir(2.9, 0.022, 4200, 700, [(0.038, .7), (0.074, .5), (0.118, .4), (0.19, .25)], 3),
    "customs": make_ir(0.62, 0.007, 6000, 1000, [(0.013, .5), (0.024, .4), (0.04, .3)], 4),
    "outdoor": make_ir(0.9, 0.05, 5000, 800, [(0.16, .3), (0.31, .16), (0.53, .08)], 5),
    "harbor": make_ir(1.6, 0.05, 4800, 700, [(0.11, .35), (0.23, .25), (0.47, .15)], 6),
    "hall": make_ir(3.6, 0.03, 5200, 650, None, 7),
}
AMB2ENV = {"office": "office", "lampday": "lamp", "lampout": "outdoor", "lampnight": "lamp", "lampdawn": "lamp", "stairs": "stairs", "customs": "customs", "seaday": "outdoor", "seanight": "outdoor", "seawide": "outdoor", "seadawn": "outdoor", "harbor": "harbor", "harbordusk": "harbor", "housenight": "office", "beach": "outdoor", "drained": "outdoor", "hill": "outdoor"}
SEND = {"office": .16, "lamp": .2, "stairs": .3, "customs": .17, "outdoor": .14, "harbor": .2}

def env_at(t):
    for s in SHOTS:
        if s["t0"] <= t < s["t1"]: return AMB2ENV.get(s.get("amb"), "office")
    return "office"


# ------------------------------------------------------------------ the sound library
def whoosh(dur=0.3, dir=1, big=0, **k):
    d = dur + 0.14; n = int(d * SR); t = np.arange(n) / d / SR
    pk = dur * 0.72 / d
    e = np.where(t < pk, (t / pk) ** 2.6, np.exp(-(t - pk) * 14))
    fr = 240 + 3400 * e ** 1.5
    a = _svf(noise(d), fr, 0.95) * e
    air = hp(noise(d), 3800) * e ** 3 * 0.28
    fl = 1 + 0.25 * np.sin(2 * np.pi * (28 + 34 * e) * np.arange(n) / SR)
    body = lp(noise(d), 420) * e ** 2 * 0.65
    x = (a * fl + air + body) * 0.8
    st = pan_st(x, dir * (-0.72 + 1.44 * (t ** 1.2)))
    if big:
        sub = sine_sweep(d, 86, 48) * e ** 2 * 0.42
        st += pan_st(sub, 0)
    return st * 0.52
def whoosh_push(dur=0.4, **k):
    d = dur + 0.2; n = int(d * SR); t = np.arange(n) / d / SR
    e = np.where(t < .62, (t / .62) ** 3.2, np.exp(-(t - .62) * 16))
    fr = 180 + 2200 * e ** 1.3
    x = _svf(noise(d), fr, 0.7) * e + hp(noise(d), 4800) * e ** 3 * 0.22 + sine_sweep(d, 70, 44) * e ** 2 * 0.5
    return wide(x, 0.8, 14) * 0.5
def air_soft(dur=0.3, **k):
    d = dur + 0.1
    e = np.sin(np.pi * T(d) / d) ** 2
    return wide(bp(noise(d), 300, 2600) * e, 0.7) * 0.11
def impact_big(gain=1, **k):
    d = 2.6; t = T(d)
    sub = sine_sweep(d, 76, 29) * np.exp(-t * 2.6) * 1.0
    thump = lp(noise(d), 200, 3) * np.exp(-t * 16) * 2.2
    crack = hp(noise(d), 2400) * np.exp(-t * 70) * 0.8 + bp(noise(d), 500, 2000) * np.exp(-t * 38) * 0.7
    metal = sum(np.sin(2 * np.pi * f * t + i) * np.exp(-t * (3.2 + i * 0.7)) * a for i, (f, a) in enumerate([(187, .24), (301, .16), (457, .1), (733, .07), (1190, .04)]))
    x = sat(sub + thump + crack + metal, 1.3)
    return wide(x, 0.35, 9) * 0.56 * gain
def brass_stab(note="up", **k):
    d = 0.62; t = T(d); roots = {"up": [146.8, 185, 220, 293.7], "sly": [146.8, 174.6, 220, 293.7]}[note]
    x = sum(saw(f * (1 + 0.0035 * (i % 2 * 2 - 1)), len(t)) + saw(f * 1.004, len(t)) for i, f in enumerate(roots))
    fc = 500 + 3800 * np.exp(-t * 7)
    x = lp_var(x, fc) * adsr(d, 0.012, 0.3) * np.exp(-t * 2.8)
    return wide(x / 5, 0.6, 12) * 0.38
def rise_sparkle(dur=0.9, **k):
    d = dur + 0.6; x = np.zeros(int(d * SR))
    for i in range(11):
        f = 1046.5 * 2 ** (np.array([0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24])[i] / 12)
        s = int(i / 11 * dur * SR); tt = T(0.55)
        x[s:s + len(tt)] += (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * 9) * (0.45 + i * 0.05)
    return wide(x, 0.9, 7) * 0.14
def sparkle(gain=1, **k):
    d = 0.95; st = np.zeros((int(d * SR), 2))
    for i in range(6):
        f = rs.uniform(3200, 8200); s = int(rs.uniform(0, .28) * SR); tt = T(.5)
        y = (np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 1.51 * tt)) * np.exp(-tt * 12)
        st[s:s + len(tt)] += pan_st(y, rs.uniform(-.6, .6))
    return st * 0.085 * gain
def happy_sigh_tone(dur=2, **k):
    d = dur + 0.6; t = T(d); e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6
    x = sum(np.sin(2 * np.pi * f * t + np.sin(t * 2.1 + i) * 0.2) * a for i, (f, a) in enumerate([(349.2, .5), (440, .45), (523.3, .42), (659.3, .26), (784, .16)]))
    return wide(x * e, 0.9, 13) * 0.05
def paper_slide(**k):
    d = 0.32; t = T(d); e = np.sin(np.pi * t / d) ** .7
    return pan_st(bp(noise(d), 1500, 9000) * e * .5 + hp(noise(d), 6500) * np.exp(-t * 14) * .3, 0.1) * 0.5
def stamp_thud(gain=1, **k):
    d = .5; t = T(d)
    x = sine_sweep(d, 180, 70) * np.exp(-t * 26) + lp(noise(d), 1200) * np.exp(-t * 62) * 1.3 + bp(noise(d), 1200, 5000) * np.exp(-t * 120) * .35
    return pan_st(sat(x, 1.2), 0) * .55 * gain
def x_stamp(gain=1, pan=0, **k):
    d = .8; t = T(d)
    x = sine_sweep(d, 130, 52) * np.exp(-t * 15) * 1.2 + lp(noise(d), 2200) * np.exp(-t * 42) * 1.5 + hp(noise(d), 3000) * np.exp(-t * 90) * .5 + sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 12) * a for f, a in [(310, .12), (610, .08)])
    return pan_st(sat(x, 1.4), pan) * .62 * gain
def cloth_flop(**k):
    d = .32; t = T(d)
    return pan_st(bp(noise(d), 300, 3500) * np.exp(-t * 11) * .6 + lp(noise(d), 240) * np.exp(-t * 24) * 1.1, 0) * .4
def cloth_shrug(**k):
    d = .42; t = T(d); e = np.sin(np.pi * t / d) ** 1.3
    return wide(bp(noise(d), 700, 5200) * e, .5) * .17
def tick_tick(dur=.9, **k):
    x = np.zeros(int((dur + .1) * SR))
    for i, s in enumerate(np.arange(0, dur, .22)):
        tt = T(.06); a = bp(noise(.06), 2200, 6500) * np.exp(-tt * 110); j = int(s * SR); x[j:j + len(a)] += a
    return pan_st(x, .18) * .13
def clock_tick(dur=1, rate=7, gain=1, **k):
    x = np.zeros(int((dur + .1) * SR)); i = 0
    for s in np.arange(0, dur, 1 / rate):
        tt = T(.05); a = bp(noise(.05), 1700 if i % 2 else 2500, 7000) * np.exp(-tt * 140) + np.sin(2 * np.pi * (1650 if i % 2 else 2100) * tt) * np.exp(-tt * 180) * .4
        j = int(s * SR); x[j:j + len(a)] += a; i += 1
    return wide(x, .25, 5) * .3 * gain
def lamp_ignite(**k):
    d = 2.2; t = T(d)
    clunk = sine_sweep(d, 220, 90) * np.exp(-t * 40) + hp(noise(d), 1800) * np.exp(-t * 170) * .9
    buzz_e = np.clip(t * 7, 0, 1) * np.exp(-t * 1.5)
    hum = sum(np.sin(2 * np.pi * 100 * m * t) / m for m in (1, 2, 3, 4, 5, 7)) * buzz_e * .16 * (1 + .4 * np.sin(t * 2 * np.pi * 31) * np.exp(-t * 4))
    wh = lp_var(noise(d), 300 + 3800 * np.clip(t * 3.2, 0, 1) * np.exp(-t * 1.4)) * np.clip(t * 6, 0, 1) * np.exp(-t * 2.2) * .85
    shim = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) * np.clip(t * 4, 0, 1) for f in (1760, 2217, 2637, 3520)) * .035
    sb = sine_sweep(d, 68, 42) * np.clip(t * 12, 0, 1) * np.exp(-t * 3.4) * .55
    return wide(clunk * .5 + hum + wh + shim + sb, .5, 10) * .8
def seagull(pan=0, gain=1, far=0, **k):
    calls = rs.randint(3, 6); d = 1.6; x = np.zeros(int(d * SR)); pos = 0.0
    for c in range(calls):
        dur = rs.uniform(.11, .2); tt = T(dur); u = tt / dur
        base = rs.uniform(1550, 2100)
        fr = base * (1 + .36 * np.sin(np.pi * u) ** 1.3 - .24 * u)
        ph = 2 * np.pi * np.cumsum(fr) / SR
        y = sum(np.sin(ph * m + 1.6 * np.sin(ph * .5)) / m ** 1.1 for m in (1, 2, 3, 4))
        y = bp(y, 900, 7000) * np.sin(np.pi * u) ** .6
        j = int(pos * SR)
        if j + len(y) < len(x): x[j:j + len(y)] += y
        pos += dur + rs.uniform(.03, .1)
    if far: x = lp(x, 2800)
    return pan_st(x, pan) * .1 * gain
def wing_flap(pan=0, **k):
    d = .55; x = np.zeros(int(d * SR))
    for i in range(5):
        tt = T(.07); a = bp(noise(.07), 300, 2600) * np.sin(np.pi * tt / .07) ** 1.3
        j = int(i * .095 * SR); x[j:j + len(a)] += a * (1 - i * .08)
    return pan_st(x, pan) * .28
def rag_squeak(dur=1.2, gain=1, **k):
    d = dur + .1; t = T(d); rate = 3.5
    ph = (t * rate) % 1
    am = np.sin(np.pi * ph) ** 2 * (0.65 + .35 * np.sin(t * 2 * np.pi * rate * .5))
    fr = 1750 + 1000 * np.sin(2 * np.pi * rate * t) + 120 * np.sin(2 * np.pi * 47 * t)
    a = np.sin(2 * np.pi * np.cumsum(fr) / SR) + .45 * np.sin(2 * np.pi * 2.01 * np.cumsum(fr) / SR)
    fric = bp(noise(d), 1200, 7500) * am * .35
    return pan_st((a * am * .35 + fric) * adsr(d, .03, .1), -.1) * .17 * gain
def wind_lonely(dur=2.2, **k):
    d = dur + 1; t = T(d)
    fr = 620 + 280 * np.sin(t * 1.4) + 120 * np.sin(t * 3.7 + 1)
    x = _svf(noise(d), fr, 4.5) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.4
    return wide(x, .9, 18) * .13
def wind_gust(gain=1, **k):
    d = 1.5; t = T(d); e = np.sin(np.pi * t / d) ** 1.7
    return wide(_svf(noise(d), 500 + 900 * e, 1.3) * e, .9, 16) * .22 * gain
def wind_height(dur=1.5, **k):
    d = dur + .6; t = T(d); e = np.sin(np.pi * t / d) ** 1.3
    fr = 900 + 600 * np.sin(t * 2.4) * e
    return wide((_svf(noise(d), fr, 3.2) * .9 + hp(noise(d), 2400) * .1) * e, .95, 22) * .19
def night_sting(**k):
    d = 3.2; t = T(d); e = np.clip(t * 10, 0, 1) * np.exp(-t * 1.0)
    x = sum(np.sin(2 * np.pi * f * t + np.sin(t * 3 + i) * .3) * a for i, (f, a) in enumerate([(73.4, .6), (110, .36), (155.6, .3), (233, .1), (622, .05)]))
    return wide(x * e, .8, 14) * .25
def beam_sweep(dur=1.3, gain=1, **k):
    d = dur + .5; t = T(d); e = np.sin(np.pi * t / d) ** 2
    x = _svf(noise(d), 240 + 1100 * e, 3) * e * .8 + np.sin(2 * np.pi * (220 + 70 * e) * t) * e * .08
    return pan_st(x, -0.7 + 1.4 * t / d) * .15 * gain
def boat_creak(**k):
    d = 1.0; t = T(d); e = np.sin(np.pi * t / d) ** 1.1
    fr = 210 + 90 * (t / d) + 45 * np.sin(t * 40)
    ph = np.cumsum(fr) / SR
    # stick-slip: bursts at the creak rate, formant-filtered
    x = bp(((ph % 1) ** 8) * 2 - .3, 340, 2400) * e
    return pan_st(x, .15) * .17
def water_lap(dur=1.4, pan=0, gain=1, **k):
    st = np.zeros((int((dur + .6) * SR), 2))
    for s in np.arange(0, dur, .33):
        tt = T(.4); y = lp_var(noise(.4), 500 + 2800 * np.exp(-tt * 16)) * (1 - np.exp(-tt * 120)) * np.exp(-tt * 10)
        j = int((s + rs.uniform(0, .1)) * SR)
        st[j:j + len(y)] += pan_st(y, pan + rs.uniform(-.4, .4))
    return st * .22 * gain
def relay_clack(gain=1, **k):
    d = .08; t = T(d); x = hp(noise(d), 1200) * np.exp(-t * 300) + np.sin(2 * np.pi * 1430 * t) * np.exp(-t * 170) * .5
    j = int(.009 * SR); y = np.zeros(len(x)); y[j:] = x[:-j] * .5
    return pan_st(x + y, 0) * .3 * gain
def morse_tone(dur=.15, gain=1, **k):
    d = dur + .02; t = T(d)
    x = (np.sin(2 * np.pi * 784 * t) + .22 * np.sin(2 * np.pi * 1568 * t) + .4 * np.sin(2 * np.pi * 392 * t)) * adsr(d, .004, .012)
    return wide(x, .3, 6) * .11 * gain
def beat_thud(gain=1, **k):
    d = .5; t = T(d)
    return pan_st(sine_sweep(d, 92, 44) * np.exp(-t * 15) + lp(noise(d), 300) * np.exp(-t * 60) * .7, 0) * .5 * gain
def drone_question(dur=1, **k):
    d = dur + .9; t = T(d); e = np.clip(t * 2.2, 0, 1) * np.clip((d - t) * 1.6, 0, 1)
    x = sum(np.sin(2 * np.pi * f * (1 + t * .012) * t) * a for f, a in [(220, .4), (261.6, .3), (311, .22)])
    return wide(x * e, .9, 12) * .09
def footsteps_march(dur=1, surface="gravel", **k):
    x = np.zeros(int((dur + .3) * SR))
    for i, s in enumerate(np.arange(0, dur, .185)):
        d = .14; tt = T(d)
        y = (bp(noise(d), 500, 5500) * .75 + lp(noise(d), 240) * 1.1) * np.exp(-tt * 34)
        j = int((s + rs.uniform(0, .01)) * SR); x[j:j + len(y)] += y * (.8 + .2 * (i % 2))
    return wide(x, .35, 8) * .29
def footsteps_stair(dur=1.2, **k):
    x = np.zeros(int((dur + .3) * SR))
    for i, s in enumerate(np.arange(0, dur, .3)):
        d = .2; tt = T(d)
        y = sine_sweep(d, 130 + i * 8, 90) * np.exp(-tt * 34) + bp(noise(d), 400, 3000) * np.exp(-tt * 60) * .5
        j = int(s * SR); x[j:j + len(y)] += y
    return pan_st(x, .1) * .24
def creak_wood(**k):
    d = .55; t = T(d); e = np.sin(np.pi * t / d)
    ph = np.cumsum(160 + 170 * t / d + 24 * np.sin(t * 90)) / SR
    return pan_st(bp((ph % 1) ** 10 * 2, 300, 2800) * e, .1) * .2
def door_burst(**k):
    d = 1.3; t = T(d)
    crack = bp(noise(d), 500, 6000) * np.exp(-t * 30) * 1.1 + hp(noise(d), 3000) * np.exp(-t * 100) * .5
    thud = sine_sweep(d, 115, 50) * np.exp(-t * 11) * 1.2 + lp(noise(d), 300) * np.exp(-t * 18) * 1.0
    rattle = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 9) * .05 for f in (780, 1240, 1830, 2760))
    x = sat(crack + thud + rattle, 1.4)
    return wide(x, .4, 9) * .72
def reverb_tail_big(**k):
    d = 1.6; t = T(d)
    return wide(lp_var(noise(d), 2000 * np.exp(-t * 2) + 200) * np.exp(-t * 3.2), .9, 21) * .13
def knock_wall(gain=1, hollow=1, **k):
    d = .36; t = T(d); f0 = 208 if hollow > .5 else 145
    x = np.sin(2 * np.pi * f0 * t) * np.exp(-t * (24 / hollow)) + .55 * np.sin(2 * np.pi * f0 * 2.27 * t) * np.exp(-t * 40) + bp(noise(d), 800, 4000) * np.exp(-t * 95) * .9
    return pan_st(x, .25) * .45 * gain
def metal_hatch(gain=1, **k):
    d = 1.0; t = T(d)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * a) * g for f, a, g in [(164, 9, .7), (389, 11, .4), (641, 14, .3), (1120, 18, .2), (2090, 24, .1)]) + bp(noise(d), 700, 5000) * np.exp(-t * 55) * .8
    return pan_st(x, -.2) * .34 * gain
def tank_echo(dur=1.4, **k):
    d = dur + .9; t = T(d); e = np.clip(t * 4, 0, 1) * np.exp(-t * .9)
    x = (np.sin(2 * np.pi * 62 * t) + .6 * np.sin(2 * np.pi * 93 * t) + .22 * np.sin(2 * np.pi * 186 * t)) * e * .35
    for s in (.32, .75, 1.12):
        tt = T(.28); y = np.sin(2 * np.pi * (1050 + 520 * tt / .28) * tt) * np.exp(-tt * 24) * .35
        j = int(s * SR); x[j:j + len(y)] += y
    return wide(x, .6, 16) * .32
def flashlight_click(**k):
    d = .05; t = T(d); x = hp(noise(d), 2500) * np.exp(-t * 380) + np.sin(2 * np.pi * 2700 * t) * np.exp(-t * 300) * .3
    return pan_st(x, -.2) * .26
def sad_trombone_low(gain=1, **k):
    d = 1.9; x = np.zeros(int(d * SR))
    for i, (f, s, l) in enumerate([(164.8, 0, .28), (155.6, .3, .28), (146.8, .6, .28), (138.6, .9, .8)]):
        tt = T(l); vib = 1 + (.012 * np.sin(2 * np.pi * 5.6 * tt) if i == 3 else 0) - (.03 * tt / l if i == 3 else 0)
        y = saw(f * vib, len(tt)); e = adsr(l, .03, .08)
        wah = 500 + 1100 * np.sin(np.pi * np.clip(tt / l, 0, 1)) ** 2
        j = int(s * SR); x[j:j + len(y)] += lp_var(y, wah) * e
    return wide(x, .4, 10) * .2 * gain
def sip(**k):
    d = .32; t = T(d); e = np.sin(np.pi * t / d) ** .8
    return pan_st(_svf(noise(d), 1500 + 1800 * t / d, 4) * e, 0) * .12
def brick_settle(**k):
    st = np.zeros((int(.9 * SR), 2))
    for i in range(6):
        d = .1; tt = T(d); f = rs.uniform(800, 2600); y = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 60) + bp(noise(d), 1500, 7000) * np.exp(-tt * 110) * .7
        j = int(rs.uniform(0, .7) * SR); st[j:j + len(y)] += pan_st(y, rs.uniform(-.6, .6))
    return st * .12
def ship_horn(dur=1.6, pan=0, gain=1, far=False):
    d = dur + .4; t = T(d); e = adsr(d, .22, .5)
    fr = 92 * (1 + .002 * np.sin(2 * np.pi * 4.3 * t))
    x = saw(fr, len(t)) + .8 * saw(fr * 1.5, len(t)) + .45 * saw(fr * 2.01, len(t))
    x = lp(x, 620 if far else 1300, 2) * e
    return pan_st(x, pan) * (.15 if far else .3) * gain
def ship_horn_far(pan=0, gain=1, **k): return ship_horn(1.3, pan, gain, True)
def ship_horn_near(dur=1.6, pan=0, **k): return ship_horn(dur, pan, 1, False)
def becak_bell(pan=0, gain=1, **k):
    d = .7; st = np.zeros((int(d * SR), 2))
    for s in (0, .17):
        tt = T(.48); y = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * a) * g for f, a, g in [(2640, 9, .6), (3560, 12, .4), (5010, 15, .25)])
        j = int(s * SR); st[j:j + len(y)] += pan_st(y, pan)
    return st * .12 * gain
def phone_ring(dur=.95, gain=1, **k):
    d = dur + .1; t = T(d); gate = (np.sin(2 * np.pi * 19 * t) > 0) * 1.0
    x = (np.sin(2 * np.pi * 1180 * t) + .7 * np.sin(2 * np.pi * 1740 * t) + .4 * np.sin(2 * np.pi * 2610 * t)) * gate
    return pan_st(bp(x, 500, 5000) * adsr(d, .005, .07), -.35) * .14 * gain
def calendar_flip(dur=.6, **k):
    x = np.zeros(int((dur + .15) * SR))
    for s in (0, .17, .34):
        tt = T(.14); y = bp(noise(.14), 1200, 9500) * np.sin(np.pi * tt / .14) ** .7; j = int(s * SR); x[j:j + len(y)] += y
    return wide(x, .3, 6) * .2
def token_slide(dur=1, **k):
    d = dur + .1; t = T(d); x = bp(noise(d), 300, 2400) * (0.72 + .28 * np.sin(2 * np.pi * 21 * t)) * adsr(d, .05, .12)
    return pan_st(x, -.4 + .8 * t / d) * .13
def ship_engine_pass(dur=2.2, pan0=-.7, pan1=.6, gain=1, **k):
    d = dur + .4; t = T(d); u = t / d
    dop = 1.03 - .06 * np.tanh((u - .5) * 6)  # doppler
    fr = 34 * dop; ph = np.cumsum(fr) / SR
    pulses = sum(np.sin(2 * np.pi * ph * m) / m for m in (1, 2, 3, 4, 6, 8))
    e = np.sin(np.pi * u) ** 1.2
    wash = lp_var(noise(d), 700 + 1500 * e) * e * .4
    return pan_st(lp(pulses, 600) * e * .55 + wash, pan0 + (pan1 - pan0) * u) * .34 * gain
def wake_water(dur=1.8, **k):
    d = dur + .4; t = T(d); e = np.sin(np.pi * t / d) ** .9 * (.75 + .25 * np.sin(2 * np.pi * 4.1 * t))
    return wide(bp(noise(d), 500, 6000) * e, .9, 14) * .15
def siren(dur=1.45, pan0=-.6, pan1=0, **k):
    d = dur + .2; t = T(d); u = t / d
    fr = (820 + 460 * np.sin(2 * np.pi * 1.1 * t)) * (1.03 - .03 * u)
    x = saw(fr, len(t)) * .5 + np.sin(2 * np.pi * np.cumsum(fr) / SR)
    x = lp_var(bp(x, 400, 4800), 1600 + 2200 * u) * adsr(d, .05, .28)
    return pan_st(x, pan0 + (pan1 - pan0) * u) * .19
def siren_far(dur=1.2, pan=0, gain=.3, **k):
    d = dur + .3; t = T(d)
    fr = 760 + 300 * np.sin(2 * np.pi * .9 * t + pan * 3)
    return pan_st(lp(np.sin(2 * np.pi * np.cumsum(fr) / SR), 1500) * adsr(d, .2, .3), pan) * .3 * gain
def siren_room(dur=1.9, gain=.35, **k):
    d = dur + .3; t = T(d)
    fr = 660 + 300 * np.sin(2 * np.pi * .8 * t)
    return wide(lp(saw(fr, len(t)), 1100) * adsr(d, .2, .4), .7, 13) * .28 * gain
def speedboat(dur=1.3, pan0=-.6, pan1=.1, **k):
    d = dur + .3; t = T(d); u = t / d
    fr = 88 + 78 * (1 - np.exp(-u * 3))
    x = lp(saw(fr, len(t)) + saw(fr * 1.01, len(t)), 800) * .4 + bp(noise(d), 500, 3500) * .3
    return pan_st(x * adsr(d, .09, .3), pan0 + (pan1 - pan0) * u) * .3
def handcuffs(gain=1, **k):
    d = .85; st = np.zeros((int(d * SR), 2))
    for i in range(7):
        tt = T(.05); f = 3400 + i * 110
        y = hp(noise(.05), 2800) * np.exp(-tt * 200) * .7 + np.sin(2 * np.pi * f * tt) * np.exp(-tt * 110) * .5
        j = int(i * .035 * SR); st[j:j + len(y)] += pan_st(y, .05)
    tt = T(.5); j = int(.27 * SR)
    y = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * a) * g for f, a, g in [(2310, 12, .4), (3720, 16, .3), (5310, 22, .2)])
    st[j:j + len(y)] += pan_st(y, .05)
    return st * .34 * gain
def camera_flash(gain=1, pan=0, **k):
    d = .5; t = T(d)
    pop = hp(noise(d), 1600) * np.exp(-t * 130) * .8 + sine_sweep(d, 500, 180) * np.exp(-t * 60) * .4
    wh = sine_sweep(d, 2800, 6400) * np.clip(t * 30, 0, 1) * np.exp(-t * 7) * .07
    return pan_st(pop + wh, pan) * .34 * gain
def sub_drop_big(gain=1, **k):
    d = 2.8; t = T(d)
    x = sine_sweep(d, 96, 25) * np.exp(-t * 1.25) * 1.0 + lp(noise(d), 170) * np.exp(-t * 6) * .7 + hp(noise(d), 2200) * np.exp(-t * 80) * .1
    return wide(sat(x, 1.2), .15, 7) * .5 * gain
def tension_bed(dur=16, **k):
    d = dur + 1; t = T(d); u = t / d
    g = np.clip(t * .8, 0, 1) * np.clip((d - t) * .9, 0, 1)
    low = (np.sin(2 * np.pi * 55 * t) + .55 * np.sin(2 * np.pi * 82.4 * t + np.sin(t * .9))) * .2
    beat = np.zeros(len(t))
    for s in np.arange(0, dur, .577):  # 104 BPM pulse, follows the music
        tt = T(.3); h = sine_sweep(.3, 72, 44) * np.exp(-tt * 18); j = int(s * SR)
        beat[j:j + len(h)] += h * (.7 + .3 * ((int(s / .577)) % 2 == 0))
    high = _svf(noise(d), 2400 + 1600 * u, 8) * (.05 + .1 * u) * (.7 + .3 * np.sin(2 * np.pi * 7.5 * t))
    return wide((low + beat * (.55 + .4 * u) + high) * g, .4, 12) * .24
def lever_clunk(gain=1, **k):
    d = .32; t = T(d)
    x = sine_sweep(d, 300, 112) * np.exp(-t * 40) * .9 + bp(noise(d), 900, 6000) * np.exp(-t * 130) * .9 + sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 28) * g for f, g in [(830, .14), (1490, .08)])
    return pan_st(x, .12) * .42 * gain
def reveal_braam(gain=1, **k):
    d = 3.2; t = T(d)
    fr = [36.7, 55, 73.4, 110, 146.8]
    x = sum(saw(f * (1 + .004 * ((i % 3) - 1)), len(t)) + saw(f * 1.006, len(t)) for i, f in enumerate(fr))
    x = lp_var(x, 170 + 1900 * np.exp(-t * 2.4) + 300 * np.clip(t, 0, 1)) * np.clip(t * 26, 0, 1) * np.exp(-t * 1.0)
    x = sat(x / 4, 1.6)
    return wide(x, .7, 15) * .24 * gain
def rise_whoosh(dur=1.5, **k):
    d = dur + .25; t = T(d); u = t / d; e = u ** 2.1 * np.clip((1 - u) * 14, 0, 1)
    x = _svf(noise(d), 180 + 2800 * u ** 2, 1.4) * e + np.sin(2 * np.pi * np.cumsum(70 + 210 * u ** 2) / SR) * e * .25
    return wide(x, .85, 15) * .36
def wide_swell(dur=2.2, gain=1, **k):
    d = dur + .9; t = T(d); e = np.clip(t * 1.3, 0, 1) * np.clip((d - t) * 1.3, 0, 1)
    x = sum(saw(f * (1 + .003 * i), len(t)) for i, f in enumerate([73.4, 110, 146.8, 220, 293.7, 440]))
    x = lp_var(x, 300 + 1100 * np.clip(t / d, 0, 1)) * e * .2
    air = hp(noise(d), 1800) * e * .05
    return wide(x + air, .95, 19) * .28 * gain
def alarm_blip(pan=0, **k):
    d = .36; st = np.zeros(int(d * SR))
    for s, f in ((0, 830), (.18, 660)):
        tt = T(.14); y = lp(square(f, len(tt)), 4200) * adsr(.14, .004, .02); j = int(s * SR); st[j:j + len(y)] += y
    return pan_st(st, pan) * .12
def alarm_thud(pan=0, **k):
    d = .9; t = T(d)
    x = sine_sweep(d, 88, 38) * np.exp(-t * 7) * 1.1 + lp(noise(d), 500) * np.exp(-t * 32) * .8 + sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * g for f, g in [(329, .07), (466, .06)])
    return pan_st(sat(x, 1.3), pan) * .48
def safe_chord(gain=1, **k):
    d = 2.1; t = T(d); e = np.clip(t * 9, 0, 1) * np.exp(-t * 1.6)
    x = sum(np.sin(2 * np.pi * f * t + np.sin(t * 2.2 + i) * .15) * a for i, (f, a) in enumerate([(146.8, .6), (220, .5), (293.7, .55), (370, .45), (440, .35), (587, .25), (880, .13), (1175, .07)]))
    sh = hp(noise(d), 6000) * np.exp(-t * 4) * .05
    return wide(x * e + sh, .85, 12) * .2 * gain
def rooster_far(gain=.25, **k):
    d = 1.0; t = T(d); u = t / d
    fr = 620 + 500 * np.sin(np.pi * np.clip(u * 1.2, 0, 1)) ** 1.5 - 160 * u
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = sum(np.sin(ph * m) / m for m in (1, 2, 3)) * adsr(d, .03, .3)
    return pan_st(lp(x, 1800), .5) * .2 * gain
def dawn_swell(dur=2.6, **k):
    d = dur + 1.4; t = T(d); e = np.clip(t * .9, 0, 1) * np.clip((d - t) * .9, 0, 1)
    x = sum(np.sin(2 * np.pi * f * t + np.sin(t * 2.3 + i) * .25) * a for i, (f, a) in enumerate([(87.3, .6), (174.6, .45), (261.6, .4), (349.2, .34), (440, .3), (523.3, .22), (698.5, .12)]))
    return wide(x * e, .95, 15) * .15
def crowd_voices(d, n, rate=(4.6, 7), base=(130, 300), fm=(650, 1150, 2500)):
    st = np.zeros((int(d * SR), 2)); t = T(d)
    for v in range(n):
        f0 = rs.uniform(*base); r = rs.uniform(*rate); ph0 = rs.uniform(0, 6.28)
        jit = 1 + .05 * lp(rs.randn(len(t)), 7) * 40
        fr = f0 * jit * (1 + .1 * np.sin(2 * np.pi * r * t + ph0))
        src = saw(fr, len(t))
        syl = np.clip(np.sin(2 * np.pi * r * t + ph0), 0, 1) ** 1.6
        v1 = sum(bp(src, f * .8, f * 1.25) * g for f, g in zip(fm, (1, .7, .35)))
        y = v1 * syl * (0.6 + .4 * np.sin(2 * np.pi * rs.uniform(.3, .8) * t + ph0))
        y += bp(noise(d), 1400, 6000) * syl * .22
        st += pan_st(y, rs.uniform(-.8, .8))
    return st / np.sqrt(n)
def crowd_laugh(dur=1.65, **k):
    d = dur + .25; e = adsr(d, .1, .4)[:, None]
    return crowd_voices(d, 8) * e * .35
def crowd_cheer(dur=2.2, **k):
    d = dur + .4; t = T(d); e = adsr(d, .2, .55)[:, None]
    a = crowd_voices(d, 12, rate=(1.2, 2.4), base=(160, 340), fm=(780, 1400, 2800)) * .55
    cl = np.zeros(len(t))
    for i in range(int(d * 26)):
        tt = T(.03); y = bp(noise(.03), 900, 6500) * np.exp(-tt * 180); j = int(rs.uniform(0, d - .04) * SR); cl[j:j + len(y)] += y * rs.uniform(.4, 1)
    return (a + wide(cl, .9, 7) * .28) * e * .5
def distant_tension(dur=2.4, **k):
    d = dur + .9; t = T(d); e = np.clip(t * 1.5, 0, 1) * np.clip((d - t) * 1.4, 0, 1)
    x = sum(np.sin(2 * np.pi * f * t + np.sin(t * 5.1 + i) * .08) * a for i, (f, a) in enumerate([(73.4, .55), (110, .3), (622.3, .09), (659.3, .08)]))
    return wide(x * e, .9, 16) * .19
def loop_tick(gain=.5, **k):
    d = .1; t = T(d)
    return pan_st(bp(noise(d), 1200, 5000) * np.exp(-t * 110), 0) * .14 * gain
def drop_silence(**k): return np.zeros((1, 2))

LIB = {k: v for k, v in globals().items() if callable(v) and not k.startswith("_")}
# A video may add its own sounds in audio/custom_sfx.py: plain functions (same shape as above), plus
# optional BEDS_CUSTOM = {"name": lambda: stereo_array} and ACTS_CUSTOM = {"name": fn(t0, t1)}.
BEDS_CUSTOM, ACTS_CUSTOM = {}, {}
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import custom_sfx as _c
    _c.__dict__.update({k: v for k, v in globals().items() if not k.startswith("_") and k not in _c.__dict__})
    LIB.update({k: v for k, v in _c.__dict__.items() if callable(v) and not k.startswith("_") and k not in LIB})
    BEDS_CUSTOM = getattr(_c, "BEDS_CUSTOM", {}); ACTS_CUSTOM = getattr(_c, "ACTS_CUSTOM", {})
except ModuleNotFoundError:
    pass
def _share_with_custom():
    """custom_sfx.py is imported before the bed and score helpers below exist, so hand them over once they do"""
    if "_c" in globals():
        _c.__dict__.update({k: v for k, v in globals().items() if not k.startswith("_") and k not in _c.__dict__})


# ------------------------------------------------------------------ ambience beds (long, loop-free: just generated for the whole film)
def long_noise(): return rs.randn(N).astype(np.float64)
def slow(n, rate, lo=0.0, hi=1.0, seed=0):
    """smooth random control signal"""
    R = np.random.RandomState(seed); k = int(n / SR * rate) + 3
    pts = R.uniform(lo, hi, k); x = np.linspace(0, k - 1, n)
    i = x.astype(int); f = x - i; f = f * f * (3 - 2 * f)
    return pts[i] * (1 - f) + pts[np.minimum(i + 1, k - 1)] * f
def stereo_bed(fn, spread=True):
    L = fn(1); R = fn(2)
    return np.stack([L, R], 1)
def surf(seed, level, rate=.15, bright=1800):
    def f(ch):
        n = np.random.RandomState(seed * 7 + ch).randn(N)
        sw = slow(N, rate, .15, 1, seed + ch)
        return bp(n, 90, bright) * sw * level + hp(n, bright) * sw ** 2 * level * .22
    return stereo_bed(f)
def wind(seed, level, c=500, q=.9):
    def f(ch):
        n = np.random.RandomState(seed * 11 + ch).randn(N)
        return _svf(n, c + 340 * slow(N, .5, -1, 1, seed + ch), q) * (.5 + .5 * slow(N, .3, 0, 1, seed + 5 + ch)) * level
    return stereo_bed(f)
def tone_hum(base, level, harm=(1, 2, 3)):
    t = np.arange(N) / SR
    x = sum(np.sin(2 * np.pi * base * h * t) / h for h in harm) * level * (1 + .03 * np.sin(t * .7))
    return np.stack([x, x * .94], 1)
def room(seed, level, f=(60, 700)):
    return stereo_bed(lambda ch: bp(np.random.RandomState(seed * 13 + ch).randn(N), *f) * level)
def events(fn, rate, seed, gain=1.0, pans=(-.7, .7)):
    """scatter one-shot detail through a bed so it never sounds like a static loop"""
    R = np.random.RandomState(seed); out = np.zeros((N, 2)); t = R.uniform(0, 1 / rate)
    while t < DUR:
        y = fn(R); y = to_st(y, R.uniform(*pans)); j = int(t * SR); e = min(N, j + len(y))
        out[j:e] += y[: e - j] * gain
        t += R.exponential(1 / rate) + .25
    return out
def drip(R):
    d = .28; tt = T(d); f0 = R.uniform(900, 1500)
    return np.sin(2 * np.pi * (f0 + 650 * tt / d) * tt) * np.exp(-tt * 24)
def ropeclink(R):
    d = .3; tt = T(d); return sum(np.sin(2 * np.pi * R.uniform(800, 3200) * tt) * np.exp(-tt * R.uniform(14, 30)) for _ in range(3)) / 3
def typing(R):
    x = np.zeros(int(.7 * SR))
    for s in np.cumsum(R.uniform(.06, .17, 5)):
        tt = T(.03); y = bp(R.randn(len(tt)), 1500, 6000) * np.exp(-tt * 170); j = int(s * SR)
        if j + len(y) < len(x): x[j:j + len(y)] += y
    return x
def buoybell(R):
    d = 1.6; tt = T(d); return sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * a) * g for f, a, g in [(592, 2.4, .6), (1412, 3.6, .3), (2240, 5, .14)])
def glasstick(R):
    d = .22; tt = T(d); return np.sin(2 * np.pi * R.uniform(2600, 4100) * tt) * np.exp(-tt * 40) * .6
def farbirds(R):
    x = np.zeros(int(.8 * SR)); j = 0
    for i in range(R.randint(2, 5)):
        dur = R.uniform(.05, .12); tt = T(dur); f = R.uniform(2800, 4600)
        y = np.sin(2 * np.pi * np.cumsum(f + 900 * np.sin(np.pi * tt / dur)) / SR) * np.sin(np.pi * tt / dur)
        if j + len(y) < len(x): x[j:j + len(y)] += y
        j += len(y) + int(R.uniform(.03, .1) * SR)
    return x
def farmurmur(seed, level):
    def f(ch):
        n = np.random.RandomState(seed + ch).randn(N)
        return bp(n, 280, 1500) * (.5 + .5 * slow(N, 3.2, 0, 1, seed + ch * 9)) * level
    return stereo_bed(f)
def gullfar(R):
    return lp(seagull(gain=1.0, far=1)[:, 0], 2300)

print("building ambience beds...", flush=True)
BED_MAKERS = {
    "office": lambda: room(1, .004, (70, 500)) + tone_hum(60, .0016) + events(lambda R: lp(gullfar(R), 1000), .09, 1, .1) + events(typing, .32, 2, .022, (-.8, -.2)) + surf(2, .0035, .11, 500),
    "seaday": lambda: surf(3, .036) + wind(4, .018, 760, 1.0) + events(gullfar, .34, 3, .22),
    "seanight": lambda: surf(5, .03, .14, 1300) + wind(6, .012, 380, 1.1) + events(buoybell, .12, 4, .012) + events(lambda R: water_lap(.9, gain=.6), .32, 8, .16),
    "seawide": lambda: surf(7, .022, .1, 900) + wind(8, .03, 680, 1.3),
    "seadawn": lambda: surf(9, .026, .13, 1500) + wind(10, .012, 620) + events(gullfar, .3, 5, .15) + events(farbirds, .35, 6, .01),
    "lampday": lambda: wind(11, .012, 720, 2.6) + room(12, .002, (90, 420)) + events(glasstick, .32, 7, .012) + surf(13, .009, .1, 700) + events(gullfar, .14, 9, .06),
    "lampout": lambda: wind(14, .036, 920, 1.3) + surf(15, .018, .1, 1000) + events(gullfar, .22, 10, .1),
    "lampnight": lambda: wind(16, .012, 460, 3.0) + tone_hum(100, .0028, (1, 2, 3, 5)) + events(glasstick, .4, 11, .012) + surf(17, .007, .1, 600),
    "lampdawn": lambda: wind(18, .008, 660, 2.6) + events(farbirds, .55, 12, .012) + surf(19, .008, .1, 700),
    "stairs": lambda: wind(20, .012, 240, 5) + room(21, .004, (45, 260)) + events(drip, .55, 13, .05) ,
    "customs": lambda: tone_hum(100, .0026, (1, 2, 3, 4)) + room(22, .0035, (80, 600)) + events(typing, .55, 14, .03, (-.7, .7)) + events(lambda R: lp(gullfar(R), 1400), .07, 15, .05),
    "harbor": lambda: surf(23, .012, .2, 1500) + farmurmur(24, .012) + room(25, .007, (50, 280)) + events(gullfar, .26, 16, .15) + events(ropeclink, .22, 17, .018),
    "harbordusk": lambda: surf(26, .012, .18, 1300) + farmurmur(27, .012) + wind(28, .008, 500) + events(gullfar, .2, 18, .12) + events(ropeclink, .2, 19, .014),
}
_share_with_custom()
BED_MAKERS.update(BEDS_CUSTOM)
_used = sorted({s.get("amb") for s in SHOTS if s.get("amb")})
_bad = [u for u in _used if u not in BED_MAKERS]
if _bad: raise SystemExit(f"unknown ambience {_bad}. Available: {sorted(BED_MAKERS)}")
BEDS = {u: BED_MAKERS[u]() for u in _used}

K_B1, K_A1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]
K_B2, K_A2 = [1, -2, 1], [1, -1.99004745483398, 0.99007225036621]
def kweight(x): return signal.lfilter(K_B2, K_A2, signal.lfilter(K_B1, K_A1, x, axis=0), axis=0)
def rough_lufs(x): return -.691 + 10 * np.log10((kweight(x) ** 2).sum(1).mean() + 1e-14)
BED_TARGET = {"office": -37, "seaday": -29, "seanight": -29, "seawide": -28, "seadawn": -30, "lampday": -35, "lampout": -29, "lampnight": -36, "lampdawn": -35, "stairs": -34, "customs": -37, "harbor": -31, "harbordusk": -31, "housenight": -35, "beach": -28, "drained": -34, "hill": -31}
def amb_mix():
    out = np.zeros((N, 2)); xf = int(.09 * SR)
    for name in list(BEDS):
        BEDS[name] = BEDS[name] * 10 ** ((BED_TARGET.get(name, -33) - rough_lufs(BEDS[name])) / 20)
    for name, bed in BEDS.items():
        g = np.zeros(N)
        for s in SHOTS:
            if s.get("amb") == name:
                a, b = int(s["t0"] * SR), int(s["t1"] * SR); g[a:b] = 1
        # smooth the gate: ambience changes on the cut, with a short crossfade
        k = np.hanning(xf * 2 + 1); k /= k.sum()
        g = np.convolve(g, k, "same")
        out += bed * g[:, None]
    return out


# ------------------------------------------------------------------ score: sparse, by act, never fighting the voice
BEAT = 60 / 104
def ks(f, d, bright=.5, seed=0):
    """Karplus-Strong plucked string"""
    R = np.random.RandomState(int(f * 13) + seed); n = int(d * SR); L = max(2, int(SR / f))
    buf = R.uniform(-1, 1, L); buf = lp(buf, 800 + 8000 * bright)
    y = np.zeros(n); i = 0; prev = 0.0; damp = .996
    for k in range(n):
        v = buf[i]; y[k] = v; buf[i] = damp * .5 * (v + prev); prev = v; i = (i + 1) % L
    return y * np.exp(-np.arange(n) / SR * 1.6)
def pad(fs, d, a=.3, r=.5, cut=900):
    t = T(d); x = sum(saw(f * (1 + .0028 * (j - 1)), len(t)) for f in fs for j in range(3)) / (3 * len(fs))
    return lp(x, cut, 2) * adsr(d, a, r)
def note(n): return 440 * 2 ** ((n - 69) / 12)
def taiko(d=.55):
    t = T(d); return sine_sweep(d, 96, 54) * np.exp(-t * 9) + lp(noise(d), 500) * np.exp(-t * 45) * .6
def put(buf, y, t, p=0.0, g=1.0):
    y = to_st(y, p); j = int(t * SR)
    if j >= N or j < 0: return
    e = min(N, j + len(y)); buf[j:e] += y[: e - j] * g

print("writing score...", flush=True)
mus = np.zeros((N, 2))
_theme = [62, 65, 69, 67, 65, 62, 64, 57]
_bass = [38, 38, 45, 45, 43, 43, 45, 45]
def act_none(t0, t1): pass
def act_comic(t0, t1):
    """walking pizzicato bass with a little theme, D minor: the hook and the joke"""
    t = t0; b = 0
    while t < t1 - .3:
        put(mus, ks(note(_bass[b % 8]), 1.1, .35), t, 0, .55)
        if b % 2 == 0 and t > t0 + .3: put(mus, ks(note(_theme[(b // 2) % 8] + 12), .8, .7), t + BEAT * .5, .25, .22)
        t += BEAT; b += 1
def act_warm(t0, t1):
    """plucked F major arpeggio with a soft pad: contentment before the trouble"""
    arp = [53, 60, 65, 69, 72, 69, 65, 60, 48, 55, 64, 67, 72, 67, 64, 55]; t = t0; b = 0
    while t < t1 - .1:
        put(mus, ks(note(arp[b % 16] + 12), 1.2, .6), t, .3 * np.sin(b * .9), .28)
        if b % 8 == 0: put(mus, pad([note(53), note(60), note(69)] if b % 16 == 0 else [note(48), note(55), note(64)], BEAT * 4.3, .4, .7, 800), t, 0, .3)
        t += BEAT / 2; b += 1
def act_suspense(t0, t1):
    """low strings and silence, one lonely pluck every two beats"""
    put(mus, pad([note(38), note(45), note(53)], t1 - t0 + .3, .35, .7, 420), t0, 0, .55)
    for i, m in enumerate([74, 77, 75, 74, 70, 69, 74, 77] * 3):
        tt = t0 + i * BEAT * 2 + BEAT
        if tt < t1 - .3: put(mus, ks(note(m), 1.3, .4), tt, -.3 + .1 * (i % 8), .17)
def act_busy(t0, t1):
    """pizzicato ostinato with drums that build: investigation, pressure"""
    t = t0; b = 0; pat = [45, 57, 52, 57, 48, 57, 52, 57, 43, 55, 50, 55, 45, 57, 52, 57]
    while t < t1:
        put(mus, ks(note(pat[b % 16]), .55, .55), t, .2 * (1 if b % 2 else -1), .3)
        if b % 4 == 0: put(mus, taiko(), t, 0, .32 + .24 * (t - t0) / max(1, t1 - t0))
        if t > t0 + (t1 - t0) * .65 and b % 2 == 0: put(mus, taiko(.3), t + BEAT * .5, 0, .2)
        t += BEAT / 2; b += 1
def act_tension(t0, t1):
    """rising ostinato over a held chord: the reveal"""
    t = t0; b = 0; pat = [38, 50, 45, 50, 41, 53, 45, 53]
    put(mus, pad([note(38), note(50), note(57), note(65)], t1 - t0, .8, 1.2, 620), t0, 0, .36)
    while t < t1 - .1:
        put(mus, ks(note(pat[b % 8] + (b // 16)), .6, .5 + b * .005), t, .25 * np.sin(b), .28 + b * .002)
        t += BEAT / 2; b += 1
def act_sly(t0, t1):
    """the comic theme returns with a pad under it: the punchline"""
    act_comic(t0, t1)
    t = t0
    while t < t1 - BEAT:
        put(mus, pad([note(50), note(57), note(65)], BEAT * 4.1, .3, .6, 900), t, 0, .22); t += BEAT * 4
def act_resolve(t0, t1):
    """one held chord fading to the root: use for an ending that finishes instead of looping"""
    put(mus, pad([note(38), note(50), note(57), note(65)], t1 - t0, 1.0, 2.4, 520), t0, 0, .5)
    put(mus, ks(note(62), 2.6, .35), t1 - 2.4, -.2, .26)
ACTS = {k[4:]: v for k, v in list(globals().items()) if k.startswith("act_")}
_share_with_custom()
ACTS.update(ACTS_CUSTOM)
_acts = sorted(cues_meta.get("acts") or [], key=lambda a: a["t"])
for _i, _a in enumerate(_acts):
    if _a["act"] not in ACTS: raise SystemExit(f"unknown music act {_a['act']}. Available: {sorted(ACTS)}")
    ACTS[_a["act"]](_a["t"], _acts[_i + 1]["t"] if _i + 1 < len(_acts) else DUR)
mus *= .36


# ------------------------------------------------------------------ build SFX + sends
print("rendering", len(cues_meta["cues"]), "cues...", flush=True)
sfx_dry = np.zeros((N, 2))
sends = {k: np.zeros((N, 2)) for k in IRS}
missing = set()
for c in cues_meta["cues"]:
    name = c["name"]; t = c["t"]
    fn = LIB.get(name)
    if fn is None: missing.add(name); continue
    kw = {k: v for k, v in c.items() if k not in ("name", "t")}
    y = to_st(fn(**kw))
    j = int(max(0, t) * SR)
    if j >= N: continue
    e = min(N, j + len(y)); y = y[: e - j]
    sfx_dry[j:e] += y
    ev = env_at(t)
    amt = SEND[ev]
    # big designed hits also go to the hall, the cinematic bloom
    if name in ("impact_big", "sub_drop_big", "reveal_braam", "door_burst", "alarm_thud", "x_stamp", "lamp_ignite", "safe_chord"):
        sends["hall"][j:e] += y * (.42 if name != "x_stamp" else .2)
    if name.startswith("whoosh"): amt *= .4
    sends[ev][j:e] += y * amt
if missing: print("MISSING CUES", missing)
wet = np.zeros((N, 2))
for k, s in sends.items():
    if np.abs(s).max() < 1e-6: continue
    ir = IRS[k]
    w = np.stack([fftconvolve(s[:, 0], ir[:, 0])[:N], fftconvolve(s[:, 1], ir[:, 1])[:N]], 1)
    wet += w
sfx = sfx_dry + wet * .85


# ------------------------------------------------------------------ voice processing
print("voice chain...", flush=True)
sr0, vo = wavfile.read(vo_path); vo = vo.astype(np.float64)
if vo.ndim > 1: vo = vo.mean(1)
vo = fit(vo, N)
vo = hp(vo, 85, 2)
# presence + air, gentle mud cut
vo = vo + bp(vo, 1800, 5200) * .5 + hp(vo, 9000) * .16 - bp(vo, 95, 300) * .3 - bp(vo, 280, 480) * .12
def follower(x, a, r):
    e = np.zeros(len(x)); ka, kr = np.exp(-1 / (a * SR)), np.exp(-1 / (r * SR)); v = 0.0; ab = np.abs(x)
    for i in range(len(x)):
        c = ka if ab[i] > v else kr; v = c * v + (1 - c) * ab[i]; e[i] = v
    return e
# de-esser
ess = bp(vo, 5200, 9500)
ee = follower(ess, .001, .05); g = np.minimum(1, (.018 / (ee + 1e-6)) ** .55)
vo = vo - ess * (1 - g)
# compressor 3:1, then level
ev = follower(vo, .004, .11) + 1e-7; th = np.percentile(ev[ev > 1e-4], 60); gr = np.where(ev > th, (ev / th) ** (1 / 3 - 1), 1.0)
vo = vo * gr
voiced = np.abs(vo) > np.percentile(np.abs(vo), 55)
vo = vo / np.sqrt((vo[voiced] ** 2).mean()) * .135  # about -20 LUFS while speaking
pk = .62; vo = np.where(np.abs(vo) > pk, np.sign(vo) * (pk + (np.abs(vo) - pk) * .35), vo)  # catch plosives only
vo_st = np.stack([vo, vo], 1)
# barely-there room so the voice sits in the same world as the sound
vo_room = np.stack([fftconvolve(vo, IRS["office"][:, 0])[:N], fftconvolve(vo, IRS["office"][:, 1])[:N]], 1) * .025
vo_st = vo_st + vo_room

# ------------------------------------------------------------------ mix
amb = amb_mix()
env = follower(vo, .012, .28)
act = np.clip((env - .01) / .08, 0, 1)
duck_amb = 10 ** (-(act * 4.5) / 20); duck_mus = 10 ** (-(act * 6.5) / 20); duck_sfx = 10 ** (-(act * 1.8) / 20)

# silence before the twist: everything falls away, then the sub drop lands
tt = np.arange(N) / SR
dip = np.ones(N)
for c in cues_meta["cues"]:
    if c["name"] == "drop_silence":
        t_drop = c["t"]
        dip = dip * (1 - np.clip((tt - (t_drop - .18)) / .18, 0, 1) * np.clip(1 - (tt - (t_drop + .34)) / .5, 0, 1) * .97)
AMB_G, MUS_G, SFX_G, VO_G = 1.0, 1.0, 0.72, 1.0
mus = mus * 10 ** ((-27.0 - rough_lufs(mus)) / 20)
amb_f = amb * (duck_amb * dip * AMB_G)[:, None]
mus_f = mus * (duck_mus * dip * MUS_G)[:, None]
sfx_f = sfx * (duck_sfx * SFX_G)[:, None]
vo_f = vo_st * VO_G

def write(name, x):
    wavfile.write(os.path.join(OUT, name), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
for nm, st in (("stem_vo.wav", vo_f), ("stem_sfx.wav", sfx_f), ("stem_amb.wav", amb_f), ("stem_music.wav", mus_f)):
    write(nm, st * .5)

mix = vo_f + sfx_f + amb_f + mus_f
if cues_meta.get("ending") == "fade":
    mix = mix * ((1 - np.clip((tt - (DUR - 1.9)) / 1.85, 0, 1)) ** 1.6)[:, None]
# bus glue
lvl = follower(mix.mean(1), .01, .16); th = 10 ** (-21 / 20)
glue = np.where(lvl > th, (lvl / th) ** (1 / 1.7 - 1), 1.0)
mix = mix * glue[:, None]
# 48k lowcut & subsonic filter
mix = signal.sosfilt(sos("highpass", 24, 2), mix, axis=0)
mix = mix + signal.sosfilt(sos("highpass", 5500, 1), mix, axis=0) * .17  # a little air on the master

# loudness (BS.1770 style K-weighted gating)
def lufs(x):
    p = (kweight(x) ** 2).sum(1); w = int(.4 * SR); h = int(.1 * SR)
    pw = np.array([p[i:i + w].mean() for i in range(0, len(p) - w, h)])
    l = -.691 + 10 * np.log10(pw + 1e-12)
    a = pw[l > -70]; g = -.691 + 10 * np.log10(a.mean()) - 10
    return -.691 + 10 * np.log10(pw[l > g].mean())
def limiter(x, ceil=.89, la=.0025, rel=.1):
    k = int(la * SR)
    up = np.stack([np.abs(signal.resample_poly(x[:, c], 4, 1))[: len(x) * 4] for c in (0, 1)], 1).max(1)
    up = np.pad(up, (0, max(0, len(x) * 4 - len(up))))
    pk = up.reshape(-1, 4).max(1)  # true-peak detector: limits what the DAC will actually output
    win = signal.fftconvolve(pk, np.ones(k) / k, "same") * 0 + np.maximum.reduce([np.roll(pk, i) for i in range(0, k, 8)])
    g = np.minimum(1, ceil / (win + 1e-9))
    y = np.zeros(len(g)); kr = np.exp(-1 / (rel * SR)); v = 1.0
    for i in range(len(g)):
        v = g[i] if g[i] < v else kr * v + (1 - kr) * g[i]
        y[i] = v
    y = np.convolve(y, np.ones(k) / k, "same")
    d = np.concatenate([np.zeros((k, 2)), x])[: len(x)]
    return d * np.minimum(y, 1)[:, None]

def true_peak(x):
    return max(float(np.abs(signal.resample_poly(x[:, c], 4, 1)).max()) for c in (0, 1))
target = -14.0
for it in range(4):
    now = lufs(mix); mix = mix * 10 ** ((target - now) / 20)
    mix = limiter(mix, ceil=.80)  # AAC encoding adds about 0.5 dB of peak, so leave room for it
print("loudness", round(lufs(mix), 2), "sample peak", round(float(np.abs(mix).max()), 3), "true peak dB", round(20 * np.log10(true_peak(mix)), 2))
write("mix.wav", mix)
print("stems peak", {n: round(float(np.abs(x).max()), 3) for n, x in (("vo", vo_f), ("sfx", sfx_f), ("amb", amb_f), ("mus", mus_f))})
print("done", round(N / SR, 2), "s")
