"""Offline sound for the What If episodes: every clip in episode.json "sound.clips" is synthesized from its prompt,
so no ElevenLabs key or credits are needed. Used by sfx.py (the default engine).

The prompt picks a recipe by keyword (first match wins, see RECIPES), the clip's name is checked too, and you can
force one with a third field: "pop": ["a cartoon speech bubble pop", 0.5, "pop"]. Every clip is deterministic
(seeded by name + prompt + length), so re-running sfx.py gives the same mix.

python <skill>/scripts/synth.py --list                 the recipes and the words that pick them
python <skill>/scripts/synth.py "<prompt>" 1.2 out.wav  try one prompt
"""
import hashlib
import re
import sys

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 44100


# ---------------------------------------------------------------- building blocks
def T(secs):
    return np.arange(max(1, int(secs * SR))) / SR


def noise(n, rng, color='white'):
    x = rng.standard_normal(n)
    if color == 'pink':
        x = lfilter([0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400], x)
    elif color == 'brown':
        x = np.cumsum(x)
        x = x - np.convolve(x, np.ones(2001) / 2001, mode='same')
    return x / max(1e-9, np.abs(x).max())


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100) / (SR / 2), 'low', output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, max(f, 10) / (SR / 2), 'high', output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [max(lo, 10) / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band', output='sos'), x)


def sweep_bp(x, f0, f1, q=2.0, steps=48):
    """Band-pass whose centre glides from f0 to f1 (log), done block by block."""
    out = np.zeros_like(x)
    edges = np.linspace(0, len(x), steps + 1).astype(int)
    for i in range(steps):
        a, b = edges[i], edges[i + 1]
        fc = f0 * (f1 / f0) ** (i / max(1, steps - 1))
        lo, hi = fc / (1 + 1 / q), fc * (1 + 1 / q)
        pad = min(a, 2048)
        out[a:b] = bp(x[a - pad:b], lo, hi)[pad:]
    return out


def env(n, attack=0.005, decay=0.2, curve=4.0, hold=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(attack, 1e-4))
    rel = np.clip(t - attack - hold, 0, None)
    return e * np.exp(-curve * rel / max(decay, 1e-4))


def bell_env(n, peak=0.5, sharp=2.0):
    t = np.linspace(0, 1, n)
    return np.where(t < peak, (t / peak) ** sharp, ((1 - t) / (1 - peak)) ** (sharp * 0.7))


def tone(freq, secs, kind='sine', phase=0.0):
    """freq: a number or an array (a glide) the length of the clip."""
    n = max(1, int(secs * SR))
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    ph = 2 * np.pi * np.cumsum(f) / SR + phase
    if kind == 'square':
        return np.sign(np.sin(ph))
    if kind == 'saw':
        return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if kind == 'tri':
        return 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1) - 1) - 1
    return np.sin(ph)


def glide(f0, f1, secs, shape='exp'):
    n = max(1, int(secs * SR))
    t = np.linspace(0, 1, n)
    return f0 * (f1 / f0) ** t if shape == 'exp' else f0 + (f1 - f0) * t


def place(buf, x, at):
    i = int(at * SR)
    j = min(len(buf), i + len(x))
    if j > i >= 0:
        buf[i:j] += x[:j - i]
    return buf


def fit(x, secs):
    n = max(1, int(secs * SR))
    if len(x) >= n:
        x = x[:n].copy()
    else:
        x = np.concatenate([x, np.zeros(n - len(x))])
    f = min(len(x), int(0.01 * SR))
    x[-f:] *= np.linspace(1, 0, f)
    return x


def bell(freq, secs, decay=0.6, bright=1.0):
    t = T(secs)
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * (1 / decay) * (1 + r / 3))
            for r, a in [(1, 1), (2.76, 0.45 * bright), (5.4, 0.25 * bright), (8.93, 0.12 * bright)])
    return x * env(len(t), 0.002, secs, 0.5)


def pluck(freq, secs, rng, damp=0.996):
    """Karplus-Strong: a plucked string (pizzicato, guitar-ish)."""
    n = max(1, int(secs * SR))
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = damp * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return lp(out, 5000)


# ---------------------------------------------------------------- recipes (each returns a clip of about `secs`)
def r_whoosh(secs, rng, up=True):
    n = int(secs * SR)
    x = sweep_bp(noise(n, rng, 'pink'), 350 if up else 3200, 3200 if up else 350, q=1.6)
    return x * bell_env(n, 0.62 if up else 0.4, 2.2)


def r_reverse(secs, rng):
    return r_whoosh(secs, rng)[::-1] * 0.9 + r_whoosh(secs, rng) * 0.2


def r_pop(secs, rng):
    s = min(secs, 0.18)
    x = tone(glide(1100, 260, s), s) * env(int(s * SR), 0.001, 0.06, 3)
    click = np.zeros_like(x)
    click[: int(0.004 * SR)] = hp(noise(int(0.004 * SR), rng), 3000) * 0.5
    return x + click


def r_sparkle(secs, rng):
    buf = np.zeros(int(secs * SR))
    notes = [2093, 2349, 2637, 3136, 3520, 4186, 4699]
    k = max(4, int(secs * 12))
    for i in range(k):
        f = notes[rng.integers(len(notes))] * rng.choice([1, 1, 1.5])
        place(buf, 0.6 * (1 - i / (k + 2)) * bell(f, 0.35, 0.18, 0.6), i * secs * 0.75 / k)
    return buf + 0.15 * hp(noise(len(buf), rng), 6000) * bell_env(len(buf), 0.2)


def r_ding(secs, rng):
    return bell(1318.5, secs, decay=max(0.3, secs * 0.6)) + 0.5 * bell(1975.5, secs, decay=max(0.25, secs * 0.4))


def r_boom(secs, rng):
    n = int(secs * SR)
    body = tone(glide(85, 32, secs), secs) * env(n, 0.004, secs * 0.35, 2.2)
    thump = lp(noise(n, rng, 'brown'), 180) * env(n, 0.002, 0.25, 3)
    crack = lp(noise(n, rng), 2500) * env(n, 0.001, 0.05, 4) * 0.5
    return np.tanh(1.6 * (body + 0.8 * thump + crack))


def r_title_boom(secs, rng):
    buf = np.zeros(int(secs * SR))
    rise = secs * 0.55
    place(buf, r_whoosh(rise, rng) * 0.8 + 0.3 * tone(glide(200, 900, rise), rise) * bell_env(int(rise * SR), 0.95, 2), 0)
    place(buf, r_boom(secs - rise + 0.05, rng), rise - 0.03)
    return buf


def r_drone(secs, rng):
    n = int(secs * SR)
    x = sum(tone(f, secs, 'saw') for f in (55, 55.4, 82.4, 110.7))
    x = lp(x, 420, 4) + 0.6 * lp(noise(n, rng, 'brown'), 120)
    return np.tanh(1.3 * x) * env(n, 0.01, secs * 0.6, 1.5) + 0.7 * _pad(r_boom(min(secs, 1.2), rng), n)


def _pad(x, n):
    return np.concatenate([x, np.zeros(max(0, n - len(x)))])[:n]


def r_thud(secs, rng):
    s = min(secs, 0.5)
    n = int(s * SR)
    return np.tanh(2 * (tone(glide(140, 45, s), s) * env(n, 0.001, 0.09, 3) + 0.7 * lp(noise(n, rng), 600) * env(n, 0.001, 0.04, 3)))


def r_tumble(secs, rng):
    buf = np.zeros(int(secs * SR))
    t, k = 0.0, 0
    while t < secs - 0.12:
        place(buf, r_thud(0.3, rng) * rng.uniform(0.5, 1.0), t)
        t += rng.uniform(0.09, 0.2)
        k += 1
    return buf


def r_click(secs, rng):
    s = 0.03
    n = int(s * SR)
    return hp(noise(n, rng), 2500) * env(n, 0.0003, 0.006, 3) + 0.4 * tone(3200, s) * env(n, 0.0005, 0.01, 3)


def r_copy_click(secs, rng):
    buf = np.zeros(int(secs * SR))
    place(buf, r_click(0.05, rng), 0)
    place(buf, 0.35 * bell(2637, 0.3, 0.12), 0.04)
    return buf


def r_ticks(secs, rng, accel=True):
    buf = np.zeros(int(secs * SR))
    t, gap = 0.0, 0.11
    while t < secs - 0.03:
        place(buf, r_click(0.03, rng) * rng.uniform(0.6, 1), t)
        t += gap
        gap = max(0.025, gap * (0.9 if accel else 1))
    return buf


def r_ratchet(secs, rng):
    n = int(secs * SR)
    whirr = bp(noise(n, rng), 900, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * glide(12, 40, secs) * T(secs)[:n]))
    return 0.5 * r_ticks(secs, rng) + 0.35 * whirr * bell_env(n, 0.6)


def r_glitch(secs, rng):
    n = int(secs * SR)
    x = np.zeros(n)
    i = 0
    while i < n:
        L = int(rng.uniform(0.015, 0.07) * SR)
        kind = rng.integers(3)
        if kind == 0:
            seg = tone(rng.uniform(80, 900), L / SR, 'square')
        elif kind == 1:
            seg = np.round(noise(L, rng) * 4) / 4
        else:
            seg = np.zeros(L)
        x[i:i + L] = seg[: n - i] * rng.uniform(0.3, 1)
        i += L
    buzz = 0.3 * tone(120, secs, 'saw') * (rng.random(n) < 0.6)
    return lp(x + buzz, 7000) * bell_env(n, 0.15, 1.2)


def r_hum(secs, rng, rising=False):
    n = int(secs * SR)
    x = sum(a * tone(f, secs) for f, a in [(50, 1), (100, 0.6), (150, 0.35), (200, 0.2), (250, 0.15)])
    x += 0.15 * bp(noise(n, rng), 1800, 4000) * (0.5 + 0.5 * np.sin(2 * np.pi * 100 * T(secs)[:n]))
    e = np.linspace(0.25, 1, n) ** 2 if rising else np.ones(n) * 0.6
    return x * e * env(n, 0.05, secs, 0.2)


def r_power_down(secs, rng):
    n = int(secs * SR)
    f = glide(900, 35, secs)
    x = tone(f, secs, 'saw') * 0.5 + tone(f * 0.5, secs) * 0.7
    return lp(x, 3000) * np.linspace(1, 0, n) ** 1.5


def r_rewind(secs, rng):
    n = int(secs * SR)
    wob = 1 + 0.25 * np.sin(2 * np.pi * 7 * T(secs)[:n])
    x = tone(glide(1400, 2600, secs) * wob, secs, 'saw') * 0.3 + bp(noise(n, rng), 1500, 6000) * 0.4
    return lp(x, 6000) * bell_env(n, 0.3, 1.0)


def r_shatter(secs, rng):
    n = int(secs * SR)
    buf = hp(noise(n, rng), 2500) * env(n, 0.001, 0.15, 3)
    for _ in range(int(secs * 25)):
        place(buf, 0.25 * bell(rng.uniform(3000, 7000), 0.12, 0.05), rng.uniform(0.02, secs * 0.7))
    return buf + 0.5 * _pad(r_thud(0.3, rng), n)


def r_crack(secs, rng):
    n = int(secs * SR)
    buf = np.zeros(n)
    t = 0.0
    while t < secs * 0.7:
        place(buf, hp(noise(int(0.01 * SR), rng), 3000) * rng.uniform(0.4, 1), t)
        t += rng.uniform(0.005, 0.05)
    return buf + 0.3 * _pad(r_shatter(secs * 0.4, rng), n)


def r_clink(secs, rng):
    buf = np.zeros(int(secs * SR))
    place(buf, bell(2350, 0.5, 0.12, 1.4), 0)
    place(buf, 0.3 * hp(noise(int(0.2 * SR), rng), 1500) * env(int(0.2 * SR), 0.01, 0.1), 0.05)
    return buf


def r_bulb(secs, rng):
    buf = np.zeros(int(secs * SR))
    place(buf, 0.6 * bell(4200, 0.2, 0.06), 0)
    place(buf, r_pop(0.15, rng) * 0.6, 0.01)
    fz = int(0.3 * SR)
    place(buf, 0.25 * hp(noise(fz, rng), 4000) * env(fz, 0.005, 0.12), 0.03)
    return buf


def r_paper(secs, rng):
    n = int(secs * SR)
    slap = bp(noise(n, rng), 300, 3000) * env(n, 0.001, 0.05, 3)
    rustle = bp(noise(n, rng), 2000, 8000) * (rng.random(n) < 0.3) * env(n, 0.02, secs * 0.4, 2)
    return slap + 0.4 * rustle


def r_step(secs, rng):
    s = min(secs, 0.3)
    n = int(s * SR)
    return 0.8 * tone(glide(110, 60, s), s) * env(n, 0.002, 0.05, 3) + 0.4 * bp(noise(n, rng), 800, 3000) * env(n, 0.001, 0.02, 3)


def r_tiptoe(secs, rng):
    buf = np.zeros(int(secs * SR))
    place(buf, 0.4 * r_whoosh(secs * 0.8, rng), 0)
    place(buf, 0.5 * r_step(0.2, rng), secs * 0.55)
    return buf


def r_chirp(secs, rng):
    n = int(secs * SR)
    f = 700 + 500 * np.sin(np.pi * np.linspace(0, 1, n)) + 30 * np.sin(2 * np.pi * 22 * T(secs)[:n])
    x = tone(f, secs) + 0.3 * tone(f * 2, secs)
    return x * bell_env(n, 0.3, 1.5)


def r_yowl(secs, rng):
    n = int(secs * SR)
    f = 450 + 350 * np.sin(np.pi * np.linspace(0, 1, n) ** 0.7) + 40 * np.sin(2 * np.pi * 9 * T(secs)[:n])
    x = tone(f, secs, 'saw')
    x = lp(x, 2500) + 0.4 * hp(noise(n, rng), 3000) * np.linspace(0, 1, n) ** 3
    return x * bell_env(n, 0.4, 1.2)


def r_gulp(secs, rng):
    s = min(secs, 0.35)
    n = int(s * SR)
    return tone(glide(380, 120, s), s, 'tri') * bell_env(n, 0.3, 1.5) * 0.9


def r_gasp(secs, rng):
    n = int(secs * SR)
    x = sweep_bp(noise(n, rng, 'pink'), 700, 1800, q=3)
    return x * bell_env(n, 0.25, 1.5)


def r_crowd(secs, rng, laugh=False):
    n = int(secs * SR)
    buf = np.zeros(n)
    for _ in range(6):
        f0 = rng.uniform(500, 1400)
        rate = rng.uniform(5, 9) if laugh else rng.uniform(2, 4)
        am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rate * T(secs)[:n] + rng.uniform(0, 6)))
        buf += bp(noise(n, rng), f0 * 0.8, f0 * 1.3) * am * rng.uniform(0.4, 1)
    e = bell_env(n, 0.15, 1.0) if laugh else env(n, 0.3, secs, 0.3)
    return lp(buf, 3500) * e


def r_buzzer(secs, rng):
    n = int(secs * SR)
    return lp(tone(118, secs, 'square') + tone(123, secs, 'square'), 2500) * env(n, 0.005, secs, 0.6, hold=secs * 0.6)


def r_crunch(secs, rng):
    n = int(secs * SR)
    buf = np.zeros(n)
    t = 0.0
    while t < secs * 0.6:
        place(buf, lp(noise(int(0.015 * SR), rng), 5000) * rng.uniform(0.3, 1), t)
        t += rng.uniform(0.004, 0.03)
    return buf * bell_env(n, 0.15, 1.2)


def r_tweets(secs, rng):
    buf = np.zeros(int(secs * SR))
    t = 0.0
    while t < secs - 0.12:
        s = 0.09
        place(buf, 0.5 * tone(glide(2600, 3800, s), s) * bell_env(int(s * SR), 0.5), t)
        t += 0.13
    return buf


def r_shades(secs, rng):
    buf = r_whoosh(secs * 0.7, rng)
    buf = _pad(buf, int(secs * SR))
    place(buf, 0.6 * bell(3950, 0.4, 0.15, 1.2), secs * 0.55)
    return buf


def r_ambience(secs, rng, kind='room'):
    n = int(secs * SR)
    t = T(secs)[:n]
    if kind == 'wind':
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * t + rng.uniform(0, 6))
        x = sweep_bp(noise(n, rng, 'pink'), 400, 900, q=1.2, steps=24) * (0.4 + 0.6 * lfo)
        x += 0.3 * lp(noise(n, rng, 'brown'), 150)
    else:
        x = lp(noise(n, rng, 'brown'), 300) + 0.08 * tone(60, secs) + 0.05 * bp(noise(n, rng), 600, 1500)
    fade = min(n // 3, int(0.4 * SR))
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x


def r_music(secs, rng, prompt=''):
    """A light cartoon bed: pizzicato chords, a glockenspiel tune on a pentatonic scale and a soft bass."""
    m = re.search(r'(\d{2,3})\s*bpm', prompt)
    bpm = int(m.group(1)) if m else 110
    dark = any(w in prompt for w in ('dark', 'ominous', 'tense', 'sad', 'mysterious', 'suspense'))
    beat = 60 / bpm
    n = int(secs * SR)
    buf = np.zeros(n + SR)
    root = 196.0 if not dark else 174.6
    prog = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]] if not dark else [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 10, 14]]
    scale = [0, 2, 4, 7, 9, 12, 14, 16] if not dark else [0, 3, 5, 7, 10, 12, 15]
    hz = lambda semi, base=root: base * 2 ** (semi / 12)
    t, bar = 0.0, 0
    while t < secs:
        chord = prog[bar % 4]
        for b in range(4):
            tb = t + b * beat
            if tb >= secs:
                break
            place(buf, 0.35 * pluck(hz(chord[0] - 12), beat * 0.9, rng, 0.993), tb)  # bass
            for k, semi in enumerate(chord):  # off-beat pizzicato
                place(buf, 0.16 * pluck(hz(semi), beat * 0.6, rng, 0.99), tb + beat * 0.5 + k * 0.012)
            if rng.random() < 0.7:  # glockenspiel
                place(buf, 0.14 * bell(hz(scale[rng.integers(len(scale))] + 12), beat * 1.5, 0.35, 0.7), tb + beat * rng.choice([0, 0.5]))
        t += 4 * beat
        bar += 1
    x = buf[:n]
    f = min(n // 4, int(0.3 * SR))
    x[-f:] *= np.linspace(1, 0, f)
    return x


def r_blip(secs, rng):
    s = min(secs, 0.2)
    return 0.7 * tone(glide(700, 500, s), s) * env(int(s * SR), 0.002, 0.05, 3)


# (recipe, keywords). The first recipe with a keyword in "name + prompt" wins, so specific sounds come before generic
# ones. Keywords match whole words or phrases; a trailing * matches any ending ("tumbl*" = tumble, tumbling).
RECIPES = [
    ('music', ('music', 'soundtrack', 'melody', 'bed')),
    ('title_boom', ('rising into a deep boom', 'whoosh rising into', 'riser into')),
    ('drone', ('drone', 'ominous', 'sting', 'horror')),
    ('power_down', ('power-down', 'power down', 'losing power', 'whine dropping', 'shutting down')),
    ('hum', ('power grid hum', 'electrical hum', 'transformer*', 'power hum')),
    ('rewind', ('rewind*', 'vhs', 'tape')),
    ('ratchet', ('spinning backwards', 'ratchet', 'clock ticking very fast')),
    ('ticks', ('counter', 'ticking', 'digits rolling')),
    ('glitch', ('glitch*', 'crackl*', 'hologram', 'static', 'malfunction*')),
    ('shatter', ('smash*', 'shatter*', 'shards')),
    ('crack', ('crack*',)),
    ('bulb', ('bulb*',)),
    ('thud', ('catching', 'slap and thud', 'landing')),
    ('copy_click', ('copy click', 'computer copy', 'mouse click')),
    ('magic_pop', ('magical pop', 'pop as an object', 'out of thin air')),
    ('clink', ('clink*', 'tink', 'mug', 'ceramic')),
    ('shades', ('sunglasses', 'glint')),
    ('sparkle', ('sparkl*', 'twinkl*', 'shimmer*', 'magic*', 'fairy')),
    ('ding', ('ding', 'chime*', 'bell', 'correct answer')),
    ('buzzer', ('buzzer', 'wrong answer')),
    ('click', ('click*', 'switch*', 'snap*', 'button', 'clunk', 'breaker')),
    ('tweets', ('dizzy', 'tweet*', 'birds')),
    ('yowl', ('yowl*', 'hiss*', 'screech*')),
    ('chirp', ('chirp*', 'meow*', 'mew')),
    ('gulp', ('gulp*', 'swallow*')),
    ('gasp', ('gasp*', 'inhal*')),
    ('laugh', ('laugh*', 'giggl*', 'cheer*')),
    ('murmur', ('murmur*', 'crowd', 'whisper*', 'chatter*')),
    ('crunch', ('crunch*', 'bite', 'chew*')),
    ('paper', ('paper', 'rustl*', 'pages')),
    ('tumble', ('tumbl*', 'series of bumps')),
    ('tiptoe', ('tiptoe*', 'sneaking', 'creeping')),
    ('step', ('footstep*', 'step', 'steps')),
    ('thud', ('thud*', 'land*', 'slap*', 'catch*', 'bump*', 'drop*', 'impact')),
    ('boom', ('boom*', 'explosion', 'blast')),
    ('reverse', ('sucked backwards', 'reverse', 'backwards swoosh')),
    ('wind', ('wind', 'breeze', 'rooftop', 'outdoor*')),
    ('room', ('room tone', 'ambience', 'ambient', 'hum', 'city')),
    ('pop', ('pop*', 'bubble', 'appear*', 'poof')),
    ('whoosh', ('whoosh*', 'swoosh*', 'swish*', 'fall*', 'swing*', 'zip*')),
]


def r_magic_pop(secs, rng):
    buf = _pad(r_pop(0.18, rng), int(secs * SR))
    return buf + 0.35 * _pad(r_sparkle(secs * 0.8, rng), len(buf))


FUNCS = {
    'music': None, 'title_boom': r_title_boom, 'drone': r_drone, 'power_down': r_power_down,
    'hum': lambda s, g: r_hum(s, g, rising=True), 'rewind': r_rewind, 'ratchet': r_ratchet, 'ticks': r_ticks,
    'glitch': r_glitch, 'shatter': r_shatter, 'crack': r_crack, 'bulb': r_bulb, 'clink': r_clink, 'shades': r_shades,
    'sparkle': r_sparkle, 'ding': r_ding, 'buzzer': r_buzzer, 'copy_click': r_copy_click, 'click': r_click,
    'tweets': r_tweets, 'magic_pop': r_magic_pop, 'yowl': r_yowl, 'chirp': r_chirp, 'gulp': r_gulp, 'gasp': r_gasp,
    'laugh': lambda s, g: r_crowd(s, g, laugh=True), 'murmur': r_crowd, 'crunch': r_crunch, 'paper': r_paper,
    'tumble': r_tumble, 'tiptoe': r_tiptoe, 'step': r_step, 'thud': r_thud, 'boom': r_boom, 'reverse': r_reverse,
    'wind': lambda s, g: r_ambience(s, g, 'wind'), 'room': r_ambience, 'pop': r_pop, 'whoosh': r_whoosh, 'blip': r_blip,
}


def pick(name, prompt, forced=None):
    if forced:
        if forced not in FUNCS:
            raise SystemExit(f'Unknown synth recipe "{forced}". Recipes: {", ".join(FUNCS)}')
        return forced
    text = f'{name.lower().replace("_", " ")} {prompt.lower()}'
    for recipe, words in RECIPES:
        for w in words:
            pat = r'\b' + re.escape(w.rstrip('*')) + (r'' if w.endswith('*') else r'\b')
            if re.search(pat, text):
                return recipe
    return 'blip'


def make(name, prompt, secs, forced=None):
    """One clip as mono float64 at 44.1 kHz, peak 0.9."""
    recipe = pick(name, prompt, forced)
    seed = int(hashlib.sha1(f'{name}|{prompt}|{secs}'.encode()).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)
    x = r_music(secs, rng, prompt.lower()) if recipe == 'music' else FUNCS[recipe](secs, rng)
    x = fit(np.nan_to_num(np.asarray(x, dtype=float)), secs)
    return x / max(1e-9, np.abs(x).max()) * 0.9, recipe


if __name__ == '__main__':
    if '--list' in sys.argv:
        for r, words in RECIPES:
            print(f'{r:12s} {", ".join(w.strip() for w in words)}')
        print('blip         (anything else)')
        sys.exit(0)
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(2)
    import wave
    x, r = make('test', sys.argv[1], float(sys.argv[2]))
    with wave.open(sys.argv[3], 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print(f'{r}: {sys.argv[3]}')
