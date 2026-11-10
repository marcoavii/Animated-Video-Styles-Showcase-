"""Lock the user's ElevenLabs VO to the script: Whisper finds the time of each spoken word, the script supplies the spelling.
usage: python tools/align_vo.py <vo.mp3|wav> [--model small]

Reads  vo/script.json  {"lang": "id", "lines": [{"id": "A1", "t": "Kalimat persis seperti di VO."}, ...]}
Writes vo/vo_raw.wav   the VO as 48 kHz mono (the sound mix reads this)
       vo/timing.json  words with times, one entry per script token
       vo/words.md     the table to write shots from: line, word index, time, word
"""
import difflib, json, os, re, subprocess, sys
import numpy as np
from scipy.io import wavfile

args = sys.argv[1:]
vo = args[0]
model = args[args.index("--model") + 1] if "--model" in args else "small"
script = json.load(open("vo/script.json", encoding="utf-8"))
SR = 48000

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vo, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, np.float32).copy()
wavfile.write("vo/vo_raw.wav", SR, pcm)
dur = len(pcm) / SR
print(f"VO {dur:.2f} s, peak {np.abs(pcm).max():.2f}")

from faster_whisper import WhisperModel
text = " ".join(l["t"] for l in script["lines"])
m = WhisperModel(model, device="cpu", compute_type="int8")

def norm(w): return re.sub(r"[^\w]", "", w.lower())
# Whisper may split "mata-mata" or join words, so match on tokens with a fuzzy score
tokens = []
for li, l in enumerate(script["lines"]):
    for ti, t in enumerate(l["t"].split()):
        tokens.append({"line": li, "i": ti, "w": t, "n": norm(t)})
A = [t["n"] for t in tokens]
n = len(A)
GAP = -0.6

def align(heard):
    B = [norm(h["w"]) for h in heard]
    k = len(B)
    score = np.zeros((n + 1, k + 1)); back = np.zeros((n + 1, k + 1), np.int8)
    for i in range(1, n + 1):
        score[i][0] = i * GAP; back[i][0] = 1
    for j in range(1, k + 1):
        score[0][j] = j * GAP; back[0][j] = 2
    for i in range(1, n + 1):
        for j in range(1, k + 1):
            r = difflib.SequenceMatcher(None, A[i - 1], B[j - 1]).ratio()
            sim = 1.0 if r == 1 else (r if r >= 0.6 else -1.0)
            c = [score[i - 1][j - 1] + sim, score[i - 1][j] + GAP, score[i][j - 1] + GAP]
            b = int(np.argmax(c)); score[i][j] = c[b]; back[i][j] = b
    i, j = n, k; link = {}
    while i > 0 or j > 0:
        b = back[i][j]
        if b == 0:
            if difflib.SequenceMatcher(None, A[i - 1], B[j - 1]).ratio() >= 0.6: link[i - 1] = j - 1
            i -= 1; j -= 1
        elif b == 1: i -= 1
        else: j -= 1
    return link

def transcribe(**kw):
    segs, _ = m.transcribe("vo/vo_raw.wav", language=script.get("lang", "id"), word_timestamps=True, condition_on_previous_text=False, beam_size=5, **kw)
    return [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]

# A long initial prompt makes Whisper hallucinate over the opening seconds, so it is only a fallback.
attempts = [("no prompt", {"vad_filter": False}), ("vad", {"vad_filter": True}), ("short prompt", {"vad_filter": False, "initial_prompt": text[:120]})]
best = None
for label, kw in attempts:
    h = transcribe(**kw)
    l = align(h) if h else {}
    print(f"{label}: heard {len(h)} words, matched {len(l)}/{n} ({100 * len(l) / max(1, n):.0f}%)", flush=True)
    if best is None or len(l) > len(best[1]): best = (h, l)
    if len(l) / max(1, n) >= 0.93: break
heard, link = best
k = len(heard)
matched = len(link)

# Script words Whisper missed share the time between their matched neighbours, weighted by length
times = [None] * n
for a, b in link.items(): times[a] = (heard[b]["s"], heard[b]["e"])
i = 0
while i < n:
    if times[i] is None:
        j = i
        while j < n and times[j] is None: j += 1
        t0 = times[i - 1][1] if i > 0 else (heard[0]["s"] if heard else 0.0)
        t1 = times[j][0] if j < n else (heard[-1]["e"] if heard else dur)
        lens = [max(1, len(tokens[x]["n"])) for x in range(i, j)]; tot = sum(lens); c = t0
        for x, L in zip(range(i, j), lens):
            d = (t1 - t0) * L / tot; times[x] = (c, c + d); c += d
        i = j
    else: i += 1

# Whisper often starts the first word after a pause late. Pull each line's first word back to where sound really begins.
hop = int(SR * .01)
env = np.sqrt(np.convolve(pcm ** 2, np.ones(hop) / hop, "same"))[::hop]
floor = np.abs(pcm).max() * 10 ** (-38 / 20)
for li in range(len(script["lines"])):
    x = next(i for i, t in enumerate(tokens) if t["line"] == li)
    s, e = times[x]
    lo = times[x - 1][1] if x > 0 else 0.0
    a, b = int(lo * 100), int(s * 100)
    if b <= a: continue
    above = np.where(env[a:b] > floor)[0]
    # only trust a region of silence before the sound; speech running right up to it is the previous word
    if len(above) and (x == 0 or env[a:a + max(1, (b - a) // 3)].min() < floor):
        quiet = np.where(env[a:b] < floor)[0]
        if x == 0: on = a + above[0]
        elif len(quiet): on = a + quiet[-1] + 1
        else: continue
        if on / 100 < s and (x == 0 or s - on / 100 <= 0.3): times[x] = (max(lo, on / 100), e)

unmatched = [tokens[i]["w"] for i in range(n) if i not in link]
extra = [heard[j]["w"] for j in range(k) if j not in set(link.values())]
if unmatched: print("script words not heard clearly, check these:", " ".join(unmatched[:40]))
if extra: print("heard but not in script:", " ".join(extra[:40]))
if matched / max(1, n) < 0.85:
    print("WARNING: VO and script differ a lot. Fix vo/script.json to match what the VO actually says, then run again.")

lines = []; md = ["# Kata dan waktu", "", "Tulis shot dengan `W(\"id\", index)`.", ""]
for li, l in enumerate(script["lines"]):
    ws = []
    for x, t in enumerate(tokens):
        if t["line"] == li: ws.append({"w": t["w"], "s": round(times[x][0], 3), "e": round(times[x][1], 3), "line": li})
    lines.append({"i": li, "id": l["id"], "text": l["t"], "s": ws[0]["s"], "e": ws[-1]["e"], "words": ws})
    md.append(f"**{l['id']}** {ws[0]['s']:.2f}-{ws[-1]['e']:.2f}  " + " ".join(f"`{i}`{w['w']}" for i, w in enumerate(ws)))
    md.append("")
json.dump({"dur": round(dur, 3), "lines": lines}, open("vo/timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
open("vo/words.md", "w", encoding="utf-8").write("\n".join(md))
nw = sum(len(l["words"]) for l in lines)
print(f"{len(lines)} lines, {nw} words, {nw / dur:.2f} words/s. Wrote vo/timing.json and vo/words.md")
