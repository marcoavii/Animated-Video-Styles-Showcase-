# Smong sample: sound design for a night lullaby, a draining sea and a tsunami.
# Every helper from design.py is shared into this module after import (T, noise, bp, lp, hp, _svf, sine_sweep,
# pan_st, wide, sat, adsr, saw, lp_var, ks, pad, note, put, mus, surf, wind, room, events, slow, N, SR, DUR ...).
# Layering follows a film approach: transient + body + tail, each layer with its own pan and space.
import numpy as np

R0 = np.random.RandomState(2004)
T_HIT = 9.97   # wave impact, picture cuts to black here


def svf(x, fr, q=1.2):
    """design.py keeps its state-variable filter private; borrow it at call time"""
    import __main__
    return __main__._svf(x, fr, q)


def _env():
    """reverb routing and loudness targets for these beds live in design.py (AMB2ENV, BED_TARGET)"""
    pass


# ------------------------------------------------------------------ house at night
def night_swell(dur=1.6, gain=1, **k):
    """opening: warm low strings blooming with sea air and a high shimmer"""
    d = dur + 1.2; t = T(d); e = np.clip(t / 0.5, 0, 1) ** 1.5 * np.clip((d - t) / 1.0, 0, 1)
    strings = sum(saw(f * (1 + 0.003 * ((i % 3) - 1)), len(t)) for i, f in enumerate([73.4, 110, 146.8, 174.6, 220]))
    strings = lp_var(strings, 260 + 900 * np.clip(t / d, 0, 1)) * e * 0.16
    shimmer = sum(np.sin(2 * np.pi * f * t + np.sin(t * 3 + i)) for i, f in enumerate([1760, 2217, 2637])) * e * 0.012
    air = svf(noise(d), 700 + 500 * np.sin(t * 0.8), 0.8) * e * 0.05
    return wide(strings + shimmer + air, 0.8, 14) * gain

def tokek(gain=1, pan=-0.6, **k):
    """gecko on the wall: two throaty croaks, 'to-kek'"""
    x = np.zeros(int(0.7 * SR))
    for j, (f0, dd) in enumerate([(320, 0.11), (260, 0.16)]):
        t = T(dd); fr = f0 * (1 + 0.4 * np.exp(-t * 30))
        y = np.sign(np.sin(2 * np.pi * np.cumsum(fr) / SR)) * np.sin(np.pi * t / dd) ** 0.7
        y = bp(y, 400, 2400) + bp(noise(dd), 900, 2500) * np.sin(np.pi * t / dd) * 0.4
        s = int((0.0 if j == 0 else 0.2) * SR); x[s:s + len(y)] += y
    return pan_st(x, pan) * 0.05 * gain

def cloth_pat(gain=1, **k):
    d = 0.22; t = T(d)
    thump = lp(noise(d), 260, 2) * np.exp(-t * 38) * 1.4 + np.sin(2 * np.pi * 110 * t) * np.exp(-t * 30) * 0.5
    rustle = bp(noise(d), 1500, 6500) * np.exp(-t * 24) * 0.25
    return pan_st(thump + rustle, 0.15) * 0.22 * gain

def floor_creak(gain=1, **k):
    d = 0.55; t = T(d); u = t / d
    fr = 180 + 90 * np.sin(np.pi * u) + 25 * R0.randn(len(t)).cumsum() / np.sqrt(len(t))
    stick = (np.sin(2 * np.pi * 23 * t) > 0.2).astype(float)
    x = bp(saw(fr, len(t)), 300, 2600) * (0.4 + 0.6 * stick) * np.sin(np.pi * u) ** 1.5
    return pan_st(x, 0.35) * 0.06 * gain

def sleepy_breath(gain=1, **k):
    d = 0.9; t = T(d); e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return pan_st(svf(noise(d), 700 - 250 * t / d, 1.2) * e, -0.1) * 0.035 * gain

def shadow_swell(dur=1.0, **k):
    """a reversed ocean wave that lands on 'bencana'"""
    d = dur; t = T(d); u = t / d
    e = u ** 2.6
    body = lp_var(noise(d), 150 + 2600 * u ** 2) * e
    hiss = hp(noise(d), 3500) * u ** 4 * 0.5
    low = sine_sweep(d, 40, 70) * e * 0.8
    x = body + hiss + low
    x[-int(0.006 * SR):] *= np.linspace(1, 0, int(0.006 * SR))
    return wide(x, 0.8, 13) * 0.2

def flame_gutter(**k):
    d = 0.7; t = T(d); e = np.exp(-t * 5) * np.clip(t * 60, 0, 1)
    flutter = 0.5 + 0.5 * np.sin(2 * np.pi * (19 + 8 * t) * t)
    x = bp(noise(d), 180, 1400) * e * flutter + lp(noise(d), 90) * e * 0.6
    return pan_st(x, 0.45) * 0.2

def eye_pop(**k):
    d = 0.12; t = T(d)
    x = np.sin(2 * np.pi * np.cumsum(380 + 1500 * (t / d) ** 0.6) / SR) * np.exp(-t * 32) + hp(noise(d), 3000) * np.exp(-t * 300) * 0.4
    return pan_st(x, 0) * 0.12

def lullaby_stop(**k):
    """the lullaby chord pitch-drops like a stopped tape"""
    d = 0.9; t = T(d); drop = np.exp(-t * 3.2)
    x = sum(np.sin(2 * np.pi * np.cumsum(f * (0.35 + 0.65 * drop)) / SR) * np.exp(-t * 2.5) for f in (587.3, 698.5, 880))
    return wide(lp(x, 2400), 0.5, 9) * 0.05


# ------------------------------------------------------------------ the sea leaves
def splashes(dur=1.2, gain=1, **k):
    d = dur; x = np.zeros((int(d * SR), 2)); t0 = 0.0
    while t0 < d - 0.2:
        dd = 0.18; t = T(dd)
        y = bp(noise(dd), 600, 5000) * np.exp(-t * 26) + sum(np.sin(2 * np.pi * np.cumsum(R0.uniform(500, 1400) * (1 + 2.5 * t)) / SR) * np.exp(-t * 40) * 0.2 for _ in range(2))
        y = pan_st(y, R0.uniform(-0.6, 0.6)); j = int(t0 * SR); x[j:j + len(y)] += y[: len(x) - j]
        t0 += R0.uniform(0.12, 0.3)
    return x * 0.06 * gain
def kids_play(dur=1.2, gain=1, **k): return splashes(dur, gain)

def sea_drain(dur=1.6, **k):
    """the signature: the whole sea is sucked away. Pull + gurgle + pebble rattle + sub, then a dead hush"""
    d = dur + 0.9; t = T(d); u = np.clip(t / dur, 0, 1)
    env = np.clip(t / 0.25, 0, 1) * (1 - u ** 3) ** 0.8 * np.clip((d - t) / 0.5, 0, 1)
    pull = lp_var(noise(d), 2600 * (1 - u) ** 1.5 + 160) * env * 1.0
    suck = svf(noise(d), 1800 - 1400 * u, 3.0) * env * 0.45
    hiss = hp(noise(d), 4200) * env * (1 - u) * 0.25
    # bubbles: rising chirps
    bub = np.zeros(len(t))
    for _ in range(140):
        s = R0.uniform(0, dur * 0.95); dd = R0.uniform(0.02, 0.06); tt = T(dd); f0 = R0.uniform(300, 1300)
        y = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 3 * tt / dd)) / SR) * np.sin(np.pi * tt / dd)
        j = int(s * SR); bub[j:j + len(y)] += y * (1 - s / dur) * R0.uniform(0.3, 1)
    # backwash dragging pebbles: dense granular clicks
    peb = np.zeros(len(t)); n_cl = 900
    for _ in range(n_cl):
        s = R0.uniform(0.05, dur); dd = 0.008; tt = T(dd)
        y = bp(noise(dd), 2000, 9000) * np.exp(-tt * 600)
        j = int(s * SR); peb[j:j + len(y)] += y * R0.uniform(0.2, 1) * np.sin(np.pi * s / dur)
    sub = sine_sweep(d, 52, 28) * env * 0.9
    L = pull + suck * 0.9 + hiss + bub * 0.05 + peb * 0.32 + sub
    Rr = pull * 0.95 + suck + hiss * 0.9 + np.roll(bub, 211) * 0.05 + np.roll(peb, 337) * 0.32 + sub
    return np.stack([L, Rr], 1) * 0.3

def gull_scatter(**k):
    out = np.zeros((int(1.8 * SR), 2))
    for i, (s, p) in enumerate([(0.0, -0.6), (0.18, 0.5), (0.4, -0.1), (0.62, 0.7)]):
        y = seagull(pan=p, gain=0.9); j = int(s * SR); out[j:j + len(y)] += y[: len(out) - j]
    for s, p in [(0.05, -0.4), (0.25, 0.3), (0.5, 0.6)]:
        y = wing_flap(pan=p); j = int(s * SR); out[j:j + len(y)] += y[: len(out) - j]
    return out * 0.8

def boat_thud(pan=0, gain=1, **k):
    d = 0.9; t = T(d)
    x = np.sin(2 * np.pi * 82 * t) * np.exp(-t * 9) + sum(np.sin(2 * np.pi * f * t + i) * np.exp(-t * a) * g for i, (f, a, g) in enumerate([(196, 14, 0.5), (318, 18, 0.3), (511, 26, 0.18)]))
    x += lp(noise(d), 600) * np.exp(-t * 40) * 0.8 + bp(noise(d), 1500, 5000) * np.exp(-t * 60) * 0.2
    return pan_st(sat(x, 1.2), pan) * 0.22 * gain

def fish_flop(dur=1.3, gain=1, pan=0, **k):
    d = dur; out = np.zeros((int(d * SR), 2)); s = 0.0
    while s < d - 0.1:
        dd = 0.06; t = T(dd)
        y = bp(noise(dd), 700, 4200) * np.exp(-t * 85) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) * 0.4
        y = pan_st(y, np.clip(pan + R0.uniform(-0.5, 0.5), -1, 1)); j = int(s * SR); out[j:j + len(y)] += y[: len(out) - j] * R0.uniform(0.5, 1)
        s += R0.uniform(0.06, 0.17)
    return out * 0.09 * gain

def sand_run(dur=0.8, gain=1, n=3, **k):
    d = dur + 0.2; out = np.zeros((int(d * SR), 2))
    for r in range(int(n)):
        s = R0.uniform(0, 0.08); p = R0.uniform(-0.6, 0.6)
        while s < dur:
            dd = 0.11; t = T(dd)
            y = lp(noise(dd), 900) * np.exp(-t * 40) + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 35) * 0.6 + bp(noise(dd), 1500, 6000) * np.exp(-t * 55) * 0.35
            y = pan_st(y, p); j = int(s * SR); out[j:j + len(y)] += y[: len(out) - j] * R0.uniform(0.6, 1)
            s += R0.uniform(0.13, 0.17)
    return out * 0.12 * gain

def rumble_ground(dur=2.2, gain=1, **k):
    d = dur + 0.6; t = T(d); u = np.clip(t / dur, 0, 1)
    e = u ** 1.6 * np.clip((d - t) / 0.6, 0, 1)
    x = lp(noise(d), 110, 3) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t)) * 3 + np.sin(2 * np.pi * (32 + 6 * u) * t) * 0.6
    return wide(x * e, 0.4, 9) * 0.3 * gain

def hand_stop(**k):
    """one heartbeat as his hand freezes"""
    out = np.zeros(int(0.7 * SR))
    for s, g in [(0, 1), (0.22, 0.7)]:
        t = T(0.25); y = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 6) + 38) / SR) * np.exp(-t * 16) * g
        j = int(s * SR); out[j:j + len(y)] += y
    return pan_st(out, 0) * 0.32


# ------------------------------------------------------------------ the wave
def braam_huge(gain=1, **k):
    """0.35 s reverse riser, then a huge low brass braam with a sub hit"""
    pre = 0.35; d = pre + 3.0; t = T(d)
    rise = np.zeros(len(t)); n0 = int(pre * SR); tu = t[:n0] / pre
    rise[:n0] = (lp_var(noise(pre), 300 + 6000 * tu ** 2) * tu ** 3 * 0.9)
    tb = np.clip(t - pre, 0, None); on = (t >= pre).astype(float)
    fr = [27.5, 55, 82.4, 110, 164.8, 220]
    br = sum(saw(f * (1 + 0.005 * ((i % 3) - 1)), len(t)) + saw(f * 1.007, len(t)) for i, f in enumerate(fr))
    br = lp_var(br, 140 + 2600 * np.exp(-tb * 2.8) + 200 * np.clip(tb, 0, 1)) * on * np.clip(tb * 40, 0, 1) * np.exp(-tb * 0.9)
    br = sat(br / 4.5, 1.8)
    sub = np.sin(2 * np.pi * np.cumsum(62 * np.exp(-tb * 1.5) + 26) / SR) * np.exp(-tb * 1.4) * on * 0.9
    hit = lp(noise(d), 300) * np.exp(-tb * 18) * on * 1.4
    return wide(rise + br * 0.9 + sub + hit, 0.75, 16) * 0.3 * gain

def wave_roar(dur=2.6, **k):
    """the wall of water getting close: rumble, roar opening up, spray hiss, crackling foam"""
    d = dur + 0.3; t = T(d); u = np.clip(t / dur, 0, 1)
    e = (0.08 + 0.92 * u ** 1.8) * np.clip((d - t) / 0.3, 0, 1)
    def ch(seed):
        n = np.random.RandomState(seed).randn(len(t))
        roar = lp_var(n, 220 + 3200 * u ** 1.6) * 1.2
        mid = svf(n, 500 + 900 * u, 0.7) * 0.5
        spray = hp(np.random.RandomState(seed + 9).randn(len(t)), 5000) * u ** 2.5 * 0.35
        crack = np.zeros(len(t))
        R = np.random.RandomState(seed + 3)
        for _ in range(int(500 * dur)):
            s = R.uniform(0, dur); j = int(s * SR); dd = int(0.004 * SR)
            if j + dd < len(t): crack[j:j + dd] += R.randn(dd) * np.exp(-np.arange(dd) / (0.0012 * SR)) * (s / dur) ** 2
        return (roar + mid + spray + bp(crack, 1500, 8000) * 0.4) * e
    low = np.sin(2 * np.pi * (30 + 8 * u) * t) * e * 0.4 + lp(noise(d), 70) * e * 1.4
    return np.stack([ch(11) + low, ch(12) + low], 1) * 0.115

def crowd_run(dur=0.9, gain=1, **k):
    d = dur + 0.3; out = sand_run(dur, 0.7, n=7)
    murmur = np.zeros((len(out), 2))
    for i in range(6):
        tt = T(d); f0 = R0.uniform(170, 330)
        v = saw(f0 * (1 + 0.06 * np.sin(2 * np.pi * R0.uniform(4, 7) * tt)), len(tt))
        v = (bp(v, 500, 900) + bp(v, 1100, 1700) * 0.6) * (0.5 + 0.5 * np.sin(2 * np.pi * R0.uniform(3, 6) * tt + i) ** 2)
        murmur[: len(v)] += pan_st(v, R0.uniform(-0.7, 0.7))[: len(murmur)]
    return (out + lp(murmur, 1800) * 0.012) * gain

def wave_crash(gain=1, **k):
    """0.3 s air push, then the wall of water lands: sub boom, mass, debris, long wash"""
    pre = 0.3; d = pre + 2.6; t = T(d)
    tb = np.clip(t - pre, 0, None); on = (t >= pre).astype(float)
    push = lp_var(noise(d), 400 + 5000 * np.clip(t / pre, 0, 1) ** 2) * np.clip(t / pre, 0, 1) ** 2 * (1 - on) * 0.8
    boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tb * 3) + 24) / SR) * np.exp(-tb * 1.2) * on * 1.3
    mass = lp_var(noise(d), 900 + 4000 * np.exp(-tb * 4)) * np.exp(-tb * 1.5) * on * 1.4
    deb = np.zeros(len(t)); R = np.random.RandomState(77)
    for _ in range(260):
        s = pre + R.exponential(0.25); j = int(s * SR); dd = int(R.uniform(0.01, 0.05) * SR)
        if j + dd < len(t): deb[j:j + dd] += bp(R.randn(dd), 300, 3500) * np.exp(-np.arange(dd) / (0.008 * SR)) * R.uniform(0.2, 1)
    wash = hp(noise(d), 1200) * np.exp(-tb * 1.1) * on * 0.5
    x = push + sat(boom + mass + deb * 0.5, 1.4) + wash
    return wide(x, 0.85, 17) * 0.42 * gain


# ------------------------------------------------------------------ beds
def _crickets(seed, level):
    def f(ch):
        R = np.random.RandomState(seed + ch); t = np.arange(N) / SR; x = np.zeros(N)
        for k in range(4):
            fc = R.uniform(4200, 5600); rate = R.uniform(14, 22); burst = R.uniform(0.7, 1.4)
            gate = (np.sin(2 * np.pi * rate * t) > 0.3) * (np.sin(2 * np.pi * t / burst + k) > -0.2)
            x += np.sin(2 * np.pi * fc * t) * gate * R.uniform(0.4, 1)
        return lp(x, 7000) * level
    return stereo_bed(f)

def _rustle(seed, level):
    def f(ch):
        n = np.random.RandomState(seed + ch).randn(N)
        return bp(n, 1800, 7000) * (0.3 + 0.7 * slow(N, 1.4, 0, 1, seed + ch) ** 2) * level
    return stereo_bed(f)

def _bed_house():
    _env()
    return _crickets(301, 0.006) + surf(302, 0.006, 0.12, 600) + wind(303, 0.004, 420, 2.0) + room(304, 0.002, (70, 400))

def _bed_beach():
    _env()
    return surf(311, 0.034, 0.2, 2200) + wind(312, 0.014, 760, 1.0) + _rustle(313, 0.006) + events(gullfar, 0.3, 314, 0.18)

def _bed_drained():
    _env()
    # no surf: the missing wave noise is the point. Wind, far hiss, trickles
    return wind(321, 0.018, 520, 1.3) + room(322, 0.003, (40, 160)) + events(drip, 1.4, 323, 0.02) + surf(324, 0.004, 0.08, 500)

def _bed_hill():
    _env()
    return wind(331, 0.03, 880, 1.2) + _rustle(332, 0.012) + room(333, 0.004, (35, 140))

BEDS_CUSTOM = {"housenight": _bed_house, "beach": _bed_beach, "drained": _bed_drained, "hill": _bed_hill}


# ------------------------------------------------------------------ score
def _frame_drum(d=0.5, deep=1.0):
    t = T(d)
    return sine_sweep(d, 140 * deep, 70 * deep) * np.exp(-t * 14) + bp(noise(d), 200, 1800) * np.exp(-t * 60) * 0.5

def act_lullaby(t0, t1):
    """nandong-flavoured lullaby: kecapi-like plucks in D minor pentatonic over a soft drone, a frame drum on the bar"""
    beat = 60 / 76
    mel = [74, 72, 69, 72, 74, 77, 74, 72, 69, 67, 69, 72, 69, 67, 62, 0]
    put(mus, pad([note(38), note(45), note(50)], t1 - t0 + 0.6, 0.6, 0.6, 520), t0, 0, 0.5)
    tt = t0 + 0.12; i = 0
    while tt < t1 - 0.1:
        m = mel[i % len(mel)]
        if m: put(mus, ks(note(m), 1.4, 0.75), tt, 0.25 * np.sin(i), 0.32)
        if i % 4 == 0: put(mus, ks(note(50 if (i // 4) % 2 == 0 else 45), 1.6, 0.4), tt, -0.2, 0.3)
        if i % 4 == 0: put(mus, _frame_drum(0.5, 1), tt, 0.1, 0.18)
        if i % 4 == 2: put(mus, _frame_drum(0.3, 1.5), tt, 0.1, 0.07)
        tt += beat / 2; i += 1

def act_shore(t0, t1):
    """bright morning plucks, with one low cello note that does not belong"""
    beat = 60 / 96; arp = [62, 66, 69, 74, 69, 66]; tt = t0; i = 0
    while tt < t1 - 0.05:
        put(mus, ks(note(arp[i % 6] + 12), 1.0, 0.7), tt, 0.3 * np.sin(i * 1.3), 0.22); tt += beat / 2; i += 1
    put(mus, pad([note(37)], t1 - t0 + 0.4, 0.4, 0.4, 300), t0 + 0.3, 0, 0.35)

def act_drain(t0, t1):
    """eerie: high harmonics rubbing a semitone apart, a slow heartbeat underneath"""
    d = t1 - t0 + 0.4; t = T(d); e = np.clip(t / 0.4, 0, 1) * np.clip((d - t) / 0.3, 0, 1)
    hi = sum(np.sin(2 * np.pi * f * t * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t + i))) for i, f in enumerate([1760, 1864.7, 2349.3]))
    put(mus, wide(hi * e * 0.05, 0.9, 13), t0, 0, 1)
    put(mus, pad([note(26), note(33)], d, 0.5, 0.3, 200), t0, 0, 0.6)

def act_run(t0, t1):
    """driving taiko and low string ostinato in D minor until the impact, then nothing"""
    end = min(t1, T_HIT); beat = 60 / 132
    pat = [38, 38, 50, 38, 41, 38, 50, 45]; tt = t0; i = 0
    put(mus, pad([note(26), note(38), note(45), note(53)], end - t0, 0.25, 0.05, 700), t0, 0, 0.55)
    while tt < end - 0.05:
        put(mus, ks(note(pat[i % 8]), 0.35, 0.55), tt, 0.2 * (1 if i % 2 else -1), 0.45)
        if i % 4 == 0: put(mus, taiko(0.55), tt, 0, 0.5)
        if i % 4 == 2: put(mus, taiko(0.35), tt, 0, 0.32)
        if i >= 8 and i % 2 == 1: put(mus, taiko(0.25), tt, 0.3, 0.3)
        tt += beat / 2; i += 1
    mus[int(T_HIT * SR):] = 0

ACTS_CUSTOM = {"lullaby": act_lullaby, "shore": act_shore, "drain": act_drain, "run": act_run}
