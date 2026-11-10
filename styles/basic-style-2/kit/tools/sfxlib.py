"""Basic style 2 sound kit: every effect, bed and instrument is synthesised here, nothing is sampled.
A video's own src/sound.py (or sound.py) imports this and places events on the timeline; tools/mix.py mixes.
Buses: VO, SFX (with desert/room reverb sends), AMB (location beds), MUS (score).
"""
import json, os, subprocess, re
import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, sosfilt, fftconvolve, lfilter, resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "build", "timeline.json"), encoding="utf-8"))
SR = 48000
DUR = TL["dur"] + 0.2
LEN = int(DUR * SR)
Q = TL["c"]
CUT = {c["scene"]: c["t"] for c in TL["cuts"]}
P = TL["p"]
def ws(pid, i=0):
    w = P[pid]["w"]
    return w[min(i, len(w) - 1)]["s"]

rng = np.random.default_rng(20261104)
def R(seed): return np.random.default_rng(seed)
def N(d): return max(1, int(d * SR))
def T(n): return np.arange(n) / SR
def db(x): return 10 ** (x / 20)

# ---------- filters ----------
def _sos(kind, f, o): return butter(o, np.clip(np.array(f) / (SR / 2), 1e-4, .999), kind, output="sos")
def lp(x, f, o=2): return sosfilt(_sos("lowpass", f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos("highpass", f, o), x, axis=0)
def bp(x, a, b, o=2): return sosfilt(_sos("bandpass", [a, b], o), x, axis=0)
def peak(x, f, gain_db, q=1.0):
    a = db(gain_db / 2); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
    b0, b1, b2 = 1 + al * a, -2 * np.cos(w), 1 - al * a
    a0, a1, a2 = 1 + al / a, -2 * np.cos(w), 1 - al / a
    return lfilter([b0 / a0, b1 / a0, b2 / a0], [1, a1 / a0, a2 / a0], x, axis=0)
def svf(x, fc, q=1.2, mode="bp"):
    """Time-varying state-variable filter; fc is an array the same length as x."""
    y = np.zeros(len(x)); lo = ba = 0.0; k = 1 / q
    f = 2 * np.sin(np.pi * np.clip(fc, 10, SR * .16) / SR)
    for i, v in enumerate(x.tolist()):
        fi = f[i]; hi = v - lo - k * ba; ba += fi * hi; lo += fi * ba
        y[i] = ba if mode == "bp" else lo
    return y

# ---------- sources ----------
def white(n, r=rng): return r.standard_normal(n)
def colored(n, power, r=rng):
    s = np.fft.rfft(r.standard_normal(n + 64)); f = np.fft.rfftfreq(n + 64, 1 / SR); f[0] = f[1]
    y = np.fft.irfft(s / f ** power, n + 64)[:n]
    return y / (np.max(np.abs(y)) + 1e-9)
def pink(n, r=rng): return colored(n, .5, r)
def brown(n, r=rng): return colored(n, 1., r)
def dec(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def fade(x, a=.002, b=.01):
    x = x.copy(); na, nb = min(N(a), len(x)), min(N(b), len(x))
    x[:na] *= np.linspace(0, 1, na); x[-nb:] *= np.linspace(1, 0, nb); return x
def sweep_sin(f0, f1, d, curve=2.0):
    n = N(d); k = np.linspace(0, 1, n) ** curve; f = f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(x, p=1.0): return x / (np.max(np.abs(x)) + 1e-9) * p
def sat(x, drive=2.0): return np.tanh(x * drive) / np.tanh(drive)
def modal(modes, d, strike=.002, seed=1, noise=.5):
    """Struck-metal synthesis: decaying partials plus a short contact noise."""
    n = N(d); t = T(n); y = np.zeros(n); r = R(seed)
    for f, tau, a in modes:
        y += a * np.sin(2 * np.pi * f * t + r.uniform(0, 6.28)) * np.exp(-t / tau)
    y *= np.minimum(1, t / max(strike, 1e-4))
    nn = N(.012); y[:nn] += noise * r.standard_normal(nn) * dec(nn, .003)
    return norm(y)
def stereo(l, r): return np.stack([l, r], 1)
def widen(x, ms=9, seed=2):
    """Decorrelate a mono layer with a Haas offset and a slightly different filter."""
    d = N(ms / 1000); pad = np.zeros(d)
    l = np.concatenate([x, pad]); r = np.concatenate([pad, x])
    return stereo(l, lp(r, 9000, 1))

# ---------- buses ----------
buses = {k: np.zeros((LEN + SR * 8, 2)) for k in ["sfx", "amb", "mus", "sendD", "sendR"]}
def to_st(sig, pan=0.0):
    if sig.ndim == 2: return sig
    a = (pan + 1) * np.pi / 4
    return stereo(sig * np.cos(a), sig * np.sin(a))
def put(t, sig, gain=1.0, pan=0.0, bus="sfx", desert=0.0, room=0.0):
    i = int(t * SR)
    if i < 0: sig = sig[-i:]; i = 0
    st = to_st(sig, pan) * gain
    j = min(len(buses[bus]), i + len(st)); st = st[:j - i]
    # de-click every event's edges
    tail = min(N(.003), len(st))
    if tail > 1:
        st = st.copy(); st[-tail:] *= np.linspace(1, 0, tail)[:, None]
    buses[bus][i:j] += st
    if desert: buses["sendD"][i:j] += st * desert
    if room: buses["sendR"][i:j] += st * room

# ---------- sound effects ----------
def boom(size=1.0, seed=1, tail=3.2):
    """Layered mine blast: crack, fire body, chest thump, debris crackle, sand rain."""
    r = R(seed); n = N(tail + 1.2); out = np.zeros((n, 2))
    for ch in range(2):
        rr = R(seed * 13 + ch)
        crack = hp(white(N(.06), rr), 900) * dec(N(.06), .006)
        out[:len(crack), ch] += crack * .8
        m = N(1.6); fc = 180 + 5200 * np.exp(-T(m) / .16)
        body = svf(white(m, rr) * dec(m, .46), fc, q=.7, mode="lp")
        out[:m, ch] += norm(body) * .95
        mm = N(.9)
        grit = hp(lp(sat(white(mm, rr) * dec(mm, .2), 5), 4200), 500) * .34
        out[:mm, ch] += grit
    sub_n = N(1.9); fs = 26 + 74 * np.exp(-T(sub_n) / .13)
    sub = np.sin(2 * np.pi * np.cumsum(fs) / SR) * dec(sub_n, .55) * np.minimum(1, T(sub_n) / .004)
    out[:sub_n] += sat(sub, 1.6)[:, None] * 1.05
    rum_n = N(tail); rum = lp(brown(rum_n, r), 150, 2) * dec(rum_n, tail / 3.1) * np.minimum(1, T(rum_n) / .05)
    out[:rum_n, 0] += norm(rum) * .3; out[:rum_n, 1] += norm(np.roll(rum, N(.011))) * .3
    # debris: thinning random ticks and pebbles falling over the tail
    deb_n = N(tail); deb = np.zeros((deb_n, 2))
    count = int(150 * size)
    for i in range(count):
        at = int(min(1, r.exponential(.27)) * .75 * deb_n + N(.12)); at = min(at, deb_n - N(.03) - 1)
        L = N(r.uniform(.004, .02)); f = r.uniform(1500, 7500); tt = T(L)
        tick = (np.sin(2 * np.pi * f * tt) * .6 + r.standard_normal(L) * .7) * dec(L, r.uniform(.002, .007)) * r.uniform(.15, .75)
        pan = r.uniform(-1, 1); gl, gr = np.cos((pan + 1) * .785), np.sin((pan + 1) * .785)
        deb[at:at + L, 0] += tick * gl; deb[at:at + L, 1] += tick * gr
    out[:deb_n] += deb * .3 * dec(deb_n, tail / 2.2)[:, None]
    return norm(out, min(1.0, .62 + .38 * size))

def whoosh(d=.46, up=True, seed=1, gain=1.0):
    """Whip-pan air. The peak sits at the centre so it lands on the cut."""
    r = R(seed); n = N(d); e = np.sin(np.linspace(0, np.pi, n)) ** 2.4
    a, b = (420, 3400) if up else (3000, 360)
    fc = np.geomspace(a, b, n)
    l = svf(pink(n, r), fc, q=1.0) ; rr = svf(pink(n, r), fc * 1.08, q=1.0)
    air = hp(white(n, r), 2800) * e ** 2 * .1
    thump = sweep_sin(120, 54, d) * e ** 3 * .32
    return stereo(norm(l) * e + air + thump, norm(rr) * e + air + thump) * gain

def click_mech(heavy=False, seed=3):
    a = modal([(3120, .007, 1), (5400, .004, .5), (1450, .011, .55)], .05, seed=seed, noise=.7)
    if not heavy: return a
    b = modal([(2360, .012, 1), (4100, .006, .6), (820, .03, .7)], .12, seed=seed + 1, noise=.8)
    out = np.zeros(N(.2)); out[:len(a)] += a * .8; out[N(.055):N(.055) + len(b)] += b
    return out + np.r_[lp(white(N(.12), R(seed)), 300) * dec(N(.12), .03) * .6, np.zeros(N(.08))]

def thud(f=70, d=.3, noise=.5, seed=4, sand=False):
    r = R(seed); n = N(d); s = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.3 * dec(n, .018))) / SR) * dec(n, d / 3.6)
    nz = lp(white(n, r), 1600 if not sand else 3400) * dec(n, .035) * noise
    return norm(sat(s + nz, 1.3))

def stamp_slam(seed=5):
    n = N(.5); r = R(seed)
    wood = modal([(180, .05, 1), (410, .028, .7), (720, .018, .4)], .4, seed=seed, noise=1.)
    slap = hp(white(N(.04), r), 1400) * dec(N(.04), .007)
    y = np.zeros(n); y[:len(wood)] += wood; y[:len(slap)] += slap * .8; y += thud(62, .5, .3, seed) * .9
    return norm(y)

def paper(d=.3, seed=6):
    r = R(seed); n = N(d); e = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    grains = np.cumsum(r.random(n) < 180 / SR) % 2 * 2 - 1
    return norm(bp(white(n, r) * (.55 + .45 * grains), 1400, 7800) * e + lp(white(n, r), 500) * e * .4)

def sand_crunch(d=.11, seed=7, g=1.0):
    r = R(seed); n = N(d); gate = lp((r.random(n) < 760 / SR).astype(float), 3200)
    return norm(bp(white(n, r), 700, 6200) * norm(gate) * dec(n, d / 3)) * g + norm(lp(white(n, r), 240) * dec(n, .02)) * .4 * g

def scratch_stroke(d, seed=8, rate=2.2):
    r = R(seed); n = N(d); strokes = np.abs(np.sin(np.pi * rate * T(n))) ** 1.5
    gate = lp((r.random(n) < 1500 / SR).astype(float), 5000)
    return norm(bp(white(n, r), 1300, 6600) * norm(gate) * strokes)

def chalk(d, seed=9):
    r = R(seed); n = N(d); squeak = np.sin(2 * np.pi * np.cumsum(3100 + 240 * np.sin(2 * np.pi * 7 * T(n))) / SR) * .09
    return norm(bp(white(n, r), 2000, 8000) * (.4 + .6 * np.abs(np.sin(np.pi * 5 * T(n)))) + squeak) * np.minimum(1, T(n) / .01)

def glint(d=.9, seed=10):
    """Blade 'schwing': metal scrape into a shimmering partial stack."""
    r = R(seed); n = N(d); t = T(n); y = np.zeros(n)
    for f, a in [(2840, 1), (4210, .7), (6120, .45), (8330, .3), (10510, .18)]:
        y += a * np.sin(2 * np.pi * f * t * (1 + .004 * np.sin(2 * np.pi * 6 * t))) * np.exp(-t / .3)
    sc_n = N(.18); sc = hp(white(sc_n, r), 3200) * np.sin(np.linspace(0, np.pi, sc_n)) ** 2 * .9
    y[:sc_n] += sc
    return norm(y)

def tink(seed=11):
    return modal([(3560, .19, 1), (5280, .12, .6), (8020, .07, .35), (1840, .3, .4)], .9, seed=seed, noise=.65)

def metal_clunk(seed=12, f=760):
    return modal([(f, .09, 1), (f * 1.72, .06, .7), (f * 2.63, .035, .45), (f * .41, .12, .5)], .4, seed=seed, noise=.8)

def helmet_clank(seed=13, g=1.0):
    return modal([(1120, .1, 1), (1760, .07, .7), (2840, .05, .4), (560, .14, .55)], .5, seed=seed, noise=.75) * g

def pop_mine(i, seed=14):
    """Each mine arriving: dull sand thump plus a tiny tick climbing in pitch."""
    f = 74 + i * .9
    y = thud(f, .16, .55, seed + i, sand=True)
    tick = modal([(1200 + i * 42, .012, 1), (2500 + i * 70, .007, .5)], .05, seed=seed + i, noise=.2)
    y[:len(tick)] += tick * .4
    return y

def beep(f=1180, d=.09):
    n = N(d); t = T(n)
    tone = np.tanh(3 * np.sin(2 * np.pi * f * t)) + .3 * np.sin(2 * np.pi * f * 2.01 * t)
    return bp(tone, 500, 3400) * np.minimum(1, t / .004) * np.minimum(1, (d - t) / .008) * .8

def ui_blip(f1=880, f2=1320, d=.07):
    y = np.zeros(N(2 * d + .12))
    for k, f in enumerate((f1, f2)):
        n = N(d + .1); s = (np.sin(2 * np.pi * f * T(n)) + .24 * np.sin(4 * np.pi * f * T(n))) * dec(n, .05)
        y[k * N(d):k * N(d) + n] += s
    return norm(y)

def braam(f=55, d=2.0, seed=15):
    """Low brass-and-sub stab with the filter opening as it hits."""
    n = N(d); t = T(n); y = np.zeros((n, 2)); r = R(seed)
    bright = .1 + .9 * np.exp(-t / .55)
    env = np.minimum(1, t / .025) * np.exp(-t / (d * .46))
    for ch in range(2):
        s = np.zeros(n)
        for det in (-.012, .004, .013):
            ph = r.uniform(0, 6.28)
            for k in range(1, 24):
                fk = f * k * (1 + det)
                if fk > 9000: break
                s += np.sin(2 * np.pi * fk * t + ph * k) / k * np.exp(-(k - 1) * .55 * (1 - bright))
        y[:, ch] = sat(s / 3, 1.5) * env
    y[:, 0] += np.sin(2 * np.pi * f / 2 * t) * env * .6; y[:, 1] += np.sin(2 * np.pi * f / 2 * t) * env * .6
    return y / np.max(np.abs(y))

def riser(d=1.2, seed=16, f0=280, f1=4800):
    r = R(seed); n = N(d); fc = np.geomspace(f0, f1, n); e = np.linspace(0, 1, n) ** 2.3
    return norm(stereo(svf(pink(n, r), fc, 2.2) * e, svf(pink(n, r), fc * 1.04, 2.2) * e))

def heartbeat():
    def one(g): return thud(46, .24, .12, 22) * g
    y = np.zeros(N(.5)); a = one(1); b = one(.66)
    y[:len(a)] += a; y[N(.17):N(.17) + len(b)] += b
    return y

def spring_launch(seed=17):
    """S-mine propellant charge: dry pop, metal ping, rising whistle."""
    r = R(seed); n = N(.6); y = np.zeros(n)
    th = thud(96, .3, 1.0, seed) * .9; y[:len(th)] += th
    m = N(.42); w = sweep_sin(360, 2140, .42, .55) * np.sin(np.linspace(0, np.pi, m)) ** 1.2 * .28
    y[:m] += w
    k = metal_clunk(seed, 1420); y[:min(len(k), n)] += k[:n] * .45
    return norm(y)

def water(d, seed=18):
    r = R(seed); n = N(d); y = np.zeros(n)
    for _ in range(int(d * 34)):
        at = r.integers(0, n - N(.05)); L = N(r.uniform(.012, .04)); f0 = r.uniform(600, 1900)
        s = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 1.5, L)) / SR) * dec(L, .012) * r.uniform(.3, 1)
        y[at:at + L] += s
    return norm(y + bp(white(n, r), 1800, 7000) * .13)

def tape_zip(d=.75, seed=19):
    r = R(seed); n = N(d); y = np.zeros(n); t = 0.0
    while t < d - .02:
        k = t / d; L = N(.006); at = N(t)
        y[at:at + L] += R(int(t * 1e4)).standard_normal(L) * dec(L, .0014)
        t += lerp(.042, .012, k)
    y = bp(y, 900, 8000)
    fr = bp(white(n, r), 2000, 7000) * np.linspace(.2, .6, n) * .36
    return norm(y + fr) * np.minimum(1, (d - T(n)) / .05)

def lerp(a, b, k): return a + (b - a) * k

def lamp_pop(i, seed=20):
    f = 420 * 2 ** (i / 7)
    s = np.sin(2 * np.pi * np.cumsum(np.linspace(f, f * 1.8, N(.09))) / SR) * dec(N(.09), .026)
    return s * .8

def stick_ratchet(d=.1, seed=21):
    r = R(seed); y = np.zeros(N(d + .02))
    for i in range(6):
        at = N(i * d / 6); L = N(.005); y[at:at + L] += r.standard_normal(L) * dec(L, .001)
    return norm(bp(y, 1200, 6500))

def sub_hit(f=44, d=1.4):
    n = N(d); s = np.sin(2 * np.pi * np.cumsum(f * (1 + .9 * dec(n, .04))) / SR) * dec(n, d / 3.5)
    return s

def tinnitus(d=3.2, f=4050):
    n = N(d); t = T(n)
    s = np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * (f * 1.5 + 3) * t)
    return s * np.minimum(1, t / .08) * (1 - t / d) ** 2.2 * .5

def cough_engine(seed=23):
    """Backfire and a stumbling diesel."""
    r = R(seed); y = np.zeros(N(1.5))
    for at, g in [(0, 1), (.16, .55), (.3, .75), (.54, .4), (.72, .5), (.98, .32)]:
        n = N(.2); s = sat(lp(white(n, R(int(at * 99) + 1)), 1400) * dec(n, .05) * 2.5, 2) + np.sin(2 * np.pi * 58 * T(n)) * dec(n, .08)
        i = N(at); y[i:i + n] += s * g
    return norm(y)

# ---------- reverbs ----------
def make_ir(d, predelay, damp0, damp1, seed, early=()):
    n = N(d); ir = np.zeros((n, 2)); r = R(seed); t = T(n)
    for ch in range(2):
        tail = r.standard_normal(n) * np.exp(-t / (d / 6.2)) * np.minimum(1, t / .025)
        fc = damp0 * np.exp(-t / (d / 2.6)) + damp1
        # piecewise damping: darker as the tail goes on
        blocks = np.array_split(tail, 40); out = []
        idx = 0
        for b in blocks:
            out.append(lp(b, fc[min(idx + len(b) // 2, n - 1)], 1)); idx += len(b)
        ir[:, ch] = np.concatenate(out)
    pad = np.zeros((N(predelay), 2)); ir = np.concatenate([pad, ir])
    for at, g, pan in early:
        i = N(at); ir[i, 0] += g * (1 - pan) * 4; ir[i, 1] += g * (1 + pan) * 4
    return ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))

IR_DESERT = make_ir(2.8, .03, 3200, 500, 31, early=[(.21, .22, -.5), (.34, .16, .6), (.58, .1, -.2), (.86, .07, .4)])
IR_ROOM = make_ir(.42, .006, 6200, 1400, 32, early=[(.012, .3, .4), (.019, .24, -.5), (.031, .16, .1)])

# ---------- ambience beds ----------
def amb_wind(n, seed, base=210, gust=.09):
    r = R(seed); out = np.zeros((n, 2)); t = T(n)
    for ch in range(2):
        rr = R(seed * 3 + ch)
        lf = lp(rr.standard_normal(n), 1.1, 1); lf = lf / (np.max(np.abs(lf)) + 1e-9)
        fc = np.maximum(90, base * (1 + .55 * lf))
        step = 256; w = pink(n, rr); y = np.zeros(n)
        # block-wise moving low-pass keeps long beds cheap
        for i in range(0, n, step * 8):
            j = min(n, i + step * 8); y[i:j] = lp(w[i:j], fc[i], 1)
        out[:, ch] = hp(y, 40) * (.6 + .4 * np.abs(lf))
    return norm(out)

def crickets(n, seed):
    """Sparse night insects, kept far off."""
    t = T(n); y = np.zeros((n, 2)); r = R(seed)
    for k in range(5):
        f = r.uniform(4100, 5600); period = r.uniform(.9, 1.7); start = r.uniform(0, 1); pan = r.uniform(-.8, .8)
        on = ((t + start) % period) < period * .42
        s = np.sin(2 * np.pi * f * t) * (.5 + .5 * np.sin(2 * np.pi * r.uniform(36, 44) * t)) * on
        s = lp(s.astype(float), 6000, 1) * r.uniform(.4, 1)
        y[:, 0] += s * np.cos((pan + 1) * .785); y[:, 1] += s * np.sin((pan + 1) * .785)
    return norm(y)

def distant_barrage(n, seed, rate=.5):
    """El Alamein's guns far away: rolling thuds under everything."""
    y = np.zeros((n, 2)); r = R(seed); t = 0.3
    while t < n / SR - 2:
        d = N(1.8); s = lp(white(d, r), 150) * dec(d, .38) * np.minimum(1, T(d) / .03) * r.uniform(.3, 1)
        i = N(t); pan = r.uniform(-.8, .8)
        y[i:i + d, 0] += s * np.cos((pan + 1) * .785); y[i:i + d, 1] += s * np.sin((pan + 1) * .785)
        t += r.exponential(1 / rate) + .15
    return norm(y)

# ---------- score (original; D minor, played by plucks, low brass and drums) ----------
NOTE = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
def hz(name):
    m = re.match(r"([A-G]b?)(\d)", name); return 440 * 2 ** ((NOTE[m[1]] + 12 * (int(m[2]) + 1) - 69) / 12)
def pluck(f, d=.75, bright=.55, seed=1):
    n = N(d); L = max(2, int(SR / f)); ex = np.zeros(n); r = R(seed); ex[:L] = r.standard_normal(L) * np.hanning(L)
    ex = lp(ex, 700 + 5000 * bright, 1)
    g = .4985
    a = np.zeros(L + 2); a[0] = 1; a[L] = -g; a[L + 1] = -g
    return norm(lfilter([1], a, ex)) * dec(n, d / 3.3)
def tom(f=74, d=.5, g=1.0, seed=2):
    n = N(d); s = np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * dec(n, .03))) / SR) * dec(n, d / 3.2)
    nz = lp(white(n, R(seed)), 1600) * dec(n, .016) * .5
    return sat(s + nz, 1.4) * g
def snare(seed=3, g=1.0):
    n = N(.2); nz = bp(white(n, R(seed)), 1400, 8000) * dec(n, .055); s = np.sin(2 * np.pi * 190 * T(n)) * dec(n, .03) * .6
    return norm(nz + s) * g
def tick(seed=4, g=1.0):
    return modal([(1720, .016, 1), (2810, .01, .5)], .05, seed=seed, noise=.2) * g
def brass(f, d=.6, g=1.0, seed=5):
    return braam(f, d, seed) * g
def bass_note(f, d=.55):
    n = N(d); t = T(n)
    return (np.sin(2 * np.pi * f * t) + .28 * np.sin(4 * np.pi * f * t) + .1 * np.sin(6 * np.pi * f * t)) * dec(n, d / 2.6) * np.minimum(1, t / .006)
def glock(f, d=.8):
    n = N(d); t = T(n)
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 3.01 * t)) * dec(n, .22)
def drone(root, t0, t1, g=1.0, seed=6):
    n = N(t1 - t0 + .6); t = T(n); y = np.zeros((n, 2)); r = R(seed)
    for ch in range(2):
        s = np.zeros(n)
        for det in (-.003, .002, .0046):
            for k in range(1, 9):
                s += np.sin(2 * np.pi * root * k * (1 + det) * t + r.uniform(0, 6)) / k ** 1.5
        y[:, ch] = s
    y = lp(y, 900); y /= np.max(np.abs(y))
    env = np.minimum(1, t / .6) * np.minimum(1, (t1 - t0 + .6 - t) / .6)
    put(t0, y * env[:, None], g, bus="mus")

# ---------- voice over chain ----------
def process_vo():
    sr, x = wavfile.read(os.path.join(ROOT, "audio", "vo.wav"))
    x = x.astype(np.float64) / 32768
    if sr != SR: x = resample_poly(x, SR, sr)
    x = hp(x, 85, 2)
    x = peak(x, 180, 1.6, .9); x = peak(x, 3400, 2.4, .8); x = peak(x, 7600, -1.6, 1.4)
    env = uniform_filter1d(np.abs(x), N(.008)) + 1e-6
    thr = db(-22); gain = np.where(env > thr, (thr / env) ** (1 - 1 / 2.8), 1.0)
    gain = uniform_filter1d(minimum_filter1d(gain, N(.006)), N(.02))
    x = x * gain
    active = x[np.abs(x) > .01]
    x = x * db(-18.5) / (np.sqrt(np.mean(active ** 2)) + 1e-9)
    out = np.zeros(LEN + SR * 8); out[:min(len(x), len(out))] = x[:len(out)]
    return out

def vo_env(vo):
    e = uniform_filter1d(np.abs(vo), N(.05))
    e = e / (np.max(e) + 1e-9)
    speak = np.clip(e / .12, 0, 1)
    # fast down, slow up
    s = minimum_filter1d(1 - speak, N(.12))
    return uniform_filter1d(s, N(.16))

def muffle(x, windows, f=340):
    """Shell-shock: the world goes dull right after a blast, then opens back up."""
    if not windows: return x
    n = len(x); t = T(n); m = np.zeros(n)
    for t0, atk, hold, rel in windows:
        m = np.maximum(m, np.interp(t, [t0 - atk, t0, t0 + hold, t0 + hold + rel], [0, 1, 1, 0], left=0, right=0))
    lo = lp(x, f, 2)
    return x * (1 - m)[:, None] + lo * m[:, None]

def automate(t_pts, g_pts, n):
    return np.interp(T(n), t_pts, g_pts)

def peak_limit(x, ceiling=db(-1.3), look=.004, release=.09):
    """Look-ahead limiter with 4x oversampled detection, so true peaks stay under the ceiling."""
    up = resample_poly(x, 4, 1, axis=0)
    pk4 = np.max(np.abs(up), axis=1)
    m = len(pk4) // 4
    pk = pk4[:m * 4].reshape(m, 4).max(axis=1)
    if m < len(x): pk = np.r_[pk, np.full(len(x) - m, pk[-1])]
    g = np.minimum(1, ceiling / (pk + 1e-9))
    g = minimum_filter1d(g, N(look) * 2 + 1)
    a = np.exp(-1 / (release * SR))
    g2 = lfilter([1 - a], [1, -a], g, zi=[g[0] * a])[0]
    g2 = np.minimum(g2, g)
    g3 = uniform_filter1d(g2, N(look))
    return x * g3[:, None]

def write(name, x):
    os.makedirs(os.path.join(ROOT, "audio", "stems"), exist_ok=True)
    wavfile.write(os.path.join(ROOT, "audio", name), SR, np.clip(x, -1, 1).astype(np.float32))

def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]; p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1]; l = re.findall(r"LRA:\s+(-?[\d.]+) LU", r)[-1]
    return float(i), float(p), float(l)


# ---------- helpers shared by every video ----------
def spot_transitions():
    """Whooshes and accents for every cut in cues.json."""
    seeds = 100
    for c in TL["cuts"]:
        t = c["t"]; seeds += 1
        if c["type"] == "whip":
            pan_sign = {"left": 1, "right": -1, "up": 0, "down": 0}[c["dir"]]
            w = whoosh(.52, c["dir"] != "right", seeds, 1.0)
            d = N(.52)
            if pan_sign:
                sweep = np.linspace(-pan_sign, pan_sign, d)
                a = (sweep + 1) * np.pi / 4
                w = stereo(w[:, 0] * np.cos(a) * 1.3, w[:, 1] * np.sin(a) * 1.3)
            put(t - .19, w, .5, desert=.08)
        elif c["type"] == "flash":
            put(t - .02, sub_hit(50, 1.1), .42); put(t - .02, hp(white(N(.11), R(seeds)), 2600) * dec(N(.11), .03), .2)
        elif c["type"] == "punch":
            put(t - .06, whoosh(.24, True, seeds), .42); put(t, sub_hit(70, .5), .3)
        elif c["type"] == "whiteline":
            put(t - .1, hp(white(N(.16), R(seeds)), 3200) * np.linspace(0, 1, N(.16)) ** 2, .26)
            put(t, tinnitus(.45, 6200) * 2, .15, 0); put(t + .34, sub_hit(60, .9), .4); put(t + .34, whoosh(.3, False, seeds), .22)

PROG_MINOR = [("D3", "F3", "A3"), ("Bb2", "D3", "F3"), ("G2", "Bb2", "D3"), ("A2", "C3", "E3")]
PROG_BRIGHT = [("F3", "A3", "C4"), ("C3", "E3", "G3"), ("D3", "F3", "A3"), ("Bb2", "D3", "F3")]
BEAT = .6; E8 = BEAT / 2
def plucks(t0, t1, prog, g=1.0, bright=.5, low=False, with_tick=False, seed=500, pan=-.2):
    """Pizzicato ostinato that restarts on a cut, so the score changes land on the edit."""
    t = t0; i = 0
    while t < t1 - .05:
        ch = prog[(i // 8) % len(prog)]
        pat = [0, 2, 1, 2, 0, 2, 1, 2][i % 8]
        f = hz(ch[pat]); f = f / 2 if low else f
        if i % 2 == 0 or not low:
            put(t, pluck(f, .75, bright, seed + i), g * (1 if i % 4 == 0 else .72), pan + .1 * np.sin(i), "mus")
        if i % 4 == 0:
            put(t, bass_note(hz(ch[0]) / 2, .5), g * .55, 0, "mus")
        if with_tick and i % 2 == 1:
            put(t, tick(seed + i, 1.0), g * .22, .4, "mus")
        t += E8; i += 1

def ambience_mix(table):
    """table: shot -> (wind, crickets, guns, room, lantern, canvas) gains; stepped per shot with a short crossfade."""
    n = LEN + SR
    wind = amb_wind(n, 301, 240); cr = crickets(n, 303); gun = distant_barrage(n, 304, .55)
    room = hp(lp(pink(n, R(305)), 900), 60); room = stereo(room, np.roll(room, 311))
    lant = hp(lp(white(n, R(306)), 8000), 3000) * (1 + .3 * lp(R(307).standard_normal(n), 8, 1) * 20)
    canv = lp(amb_wind(n, 308, 400), 1100)
    keys = [c["scene"] for c in TL["cuts"]]; times = [c["t"] for c in TL["cuts"]] + [DUR + 1]
    tgrid = T(n)
    tracks = [(wind, .05), (cr, .016), (gun, .3), (room, .036), (lant, 1.0), (canv, .05)]
    for ti, (sig, g) in enumerate(tracks):
        xs, ys = [], []
        for i, k in enumerate(keys):
            v = table.get(k, (.42, .4, .55, 0, 0, 0))[ti]
            xs += [times[i] + .05, times[i + 1] - .05]; ys += [v, v]
        e = np.interp(tgrid, xs, ys); b = np.interp(tgrid, [0, .2], [0, 1])
        buses["amb"][:n] += to_st(sig, 0) * (e * b)[:, None] * g
