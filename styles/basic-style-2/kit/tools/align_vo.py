"""Turns the user's ElevenLabs voice over into audio/vo.wav + build/words.json.

    python tools/align_vo.py "path/to/vo.mp3"

Whisper's word times are mapped onto the exact words in script.json, so names and spellings come from
the script, not from what Whisper heard. Words it could not match are listed so they can be checked.
A phrase with "hold": seconds in script.json gets that much silence added after it (room for a big hit).
"""
import difflib, json, os, re, subprocess, sys
import numpy as np
from scipy.io import wavfile
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
script = json.load(open(os.path.join(ROOT, "script.json"), encoding="utf-8"))
clean = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "audio", "vo_source.mp3")
os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True); os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
raw = os.path.join(ROOT, "build", "vo_raw.wav")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-ac", "1", "-ar", str(SR), raw], check=True)

model = WhisperModel("small", device="cpu", compute_type="int8")
segments, _ = model.transcribe(raw, language=script.get("language", "id"), word_timestamps=True,
                               initial_prompt=" ".join(p["say"].replace("*", "") for p in script["phrases"]))
heard = [{"w": clean(w.word), "s": w.start, "e": w.end} for s in segments for w in s.words]

tokens = []  # (phrase index, word as written in the script)
for pi, p in enumerate(script["phrases"]):
    for w in p["say"].replace("*", "").split():
        tokens.append((pi, w))
sm = difflib.SequenceMatcher(a=[clean(t[1]) for t in tokens], b=[h["w"] for h in heard], autojunk=False)
times = [None] * len(tokens)
exact = 0
missing = []
for tag, a1, a2, b1, b2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(a2 - a1):
            times[a1 + k] = (heard[b1 + k]["s"], heard[b1 + k]["e"]); exact += 1
    elif tag == "replace":
        # Whisper heard something else here ("Romel", "1942"), so its timing is still real.
        missing += list(range(a1, a2))
        if a2 - a1 == b2 - b1:
            for k in range(a2 - a1):
                times[a1 + k] = (heard[b1 + k]["s"], heard[b1 + k]["e"])
        else:
            t0, t1 = heard[b1]["s"], heard[b2 - 1]["e"]
            lens = [max(1, len(clean(tokens[i][1]))) for i in range(a1, a2)]; total = sum(lens); run = 0
            for i, n in zip(range(a1, a2), lens):
                times[i] = (t0 + (t1 - t0) * run / total, t0 + (t1 - t0) * (run + n) / total); run += n
    elif tag == "delete":
        missing += list(range(a1, a2))
known = [i for i, t in enumerate(times) if t]
if not exact:
    sys.exit("No script word matched the voice over. Is this the right VO and script.json language?")

# Script words Whisper missed entirely share the time between their neighbours.
for i in [m for m in missing if not times[m]]:
    prev = max((k for k in known if k < i), default=None); nxt = min((k for k in known if k > i), default=None)
    if prev is None:
        s = times[nxt][0] - .35 * (nxt - i); times[i] = (max(0, s), max(0, s) + .3)
    elif nxt is None:
        s = times[prev][1] + .35 * (i - prev - 1); times[i] = (s, s + .3)
    else:
        a, b, span = times[prev][1], times[nxt][0], nxt - prev - 1
        step = (b - a) / span
        times[i] = (a + step * (i - prev - 1), a + step * (i - prev))

_, x = wavfile.read(raw)
x = x.astype(np.float32) / 32768

# Whisper often starts a word during the pause before it. Snap each word onto the actual voice,
# because cuts and captions hang on these times.
hop = int(.01 * SR)
env = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same"))[::hop]
thr = .08 * np.percentile(env, 95)
for i, (s, e) in enumerate(times):
    fs, fe = int(s * 100), min(len(env) - 1, int(e * 100))
    if fe <= fs: continue
    on = env[fs:fe] >= thr
    # Start after the last real pause (0.12 s or more) inside the word's window, if voice follows it.
    # Only for a phrase's first word: elsewhere a window overrunning into the next phrase would drag the word forward.
    first = i == 0 or tokens[i - 1][0] != tokens[i][0]
    start = fs; run = 0
    if first:
        for k, v in enumerate(on):
            run = 0 if v else run + 1
            if run >= 12 and on[k + 1:].any(): start = fs + k + 1 + int(np.argmax(on[k + 1:]))
    if start == fs and not on[0] and on.any(): start = fs + int(np.argmax(on))
    # Whisper can also start late: walk back to the voice onset if a pause sits just before it.
    if first and start == fs and on[0]:
        back = fs
        while back > 0 and fs - back < 35 and env[back - 1] >= thr: back -= 1
        if fs - back < 35 and back > 0 and (env[max(0, back - 12):back] < thr).all(): start = back
    times[i] = (start / 100, max(e, start / 100 + .05))

# Optional silence after a phrase.
out = []; shift = 0.0; pieces = []; cursor = 0
for pi, p in enumerate(script["phrases"]):
    idx = [i for i, t in enumerate(tokens) if t[0] == pi]
    ws = [{"w": tokens[i][1], "s": round(times[i][0] + shift, 3), "e": round(times[i][1] + shift, 3)} for i in idx]
    out.append({"id": p["id"], "start": ws[0]["s"], "end": ws[-1]["e"], "words": ws})
    hold = float(p.get("hold", 0))
    if hold > 0:
        cut = int((times[idx[-1]][1] + .04) * SR)
        pieces += [x[cursor:cut], np.zeros(int(hold * SR), np.float32)]; cursor = cut; shift += hold
pieces.append(x[cursor:])
y = np.concatenate(pieces)
wavfile.write(os.path.join(ROOT, "audio", "vo.wav"), SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
json.dump(out, open(os.path.join(ROOT, "build", "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)

print(f"matched {exact}/{len(tokens)} script words exactly; VO length {len(y)/SR:.2f} s")
if missing:
    print("check these (Whisper heard them differently, time is estimated):")
    for i in missing:
        print(f"  {script['phrases'][tokens[i][0]]['id']}: {tokens[i][1]}  ~{times[i][0]:.2f}s")
extra = len(heard) - exact
if extra > max(5, len(tokens) * .15):
    print(f"WARNING: Whisper heard {extra} words that are not in script.json. The VO may differ from the script.")
print("wrote audio/vo.wav and build/words.json")
