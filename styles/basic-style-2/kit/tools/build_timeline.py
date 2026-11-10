"""Merge script.json + build/words.json + cues.json into build/timeline.json and build/timeline.js.

The same resolved file drives the visuals (timeline.js) and the sound design (timeline.json),
so swapping the voice over re-syncs both.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
script = json.load(open(os.path.join(ROOT, "script.json"), encoding="utf-8"))
words = {p["id"]: p for p in json.load(open(os.path.join(ROOT, "build", "words.json"), encoding="utf-8"))}
cfg = json.load(open(os.path.join(ROOT, "cues.json"), encoding="utf-8"))


def resolve(ref):
    pid, i, off = ref
    if pid is None:
        return 0.0
    w = words[pid]["words"]
    if not w:
        return words[pid]["start"] + off
    return round(w[min(i, len(w) - 1)]["s"] + off, 3)


phrases = {}
order = []
for p in script["phrases"]:
    pid = p["id"]
    raw = p.get("show") or p["say"]
    tokens = raw.split()
    w = words[pid]["words"]
    out = []
    for i, tok in enumerate(tokens):
        red = tok.startswith("*")
        tok = tok.replace("*", "")
        if len(tokens) == len(w):
            s = w[i]["s"]
        elif i == len(tokens) - 1:
            s = w[-1]["s"]
        else:
            s = w[min(i, len(w) - 1)]["s"]
        out.append({"t": tok.upper(), "s": s, "red": red})
    phrases[pid] = {"s": words[pid]["start"], "e": words[pid]["end"], "tokens": out,
                    "w": [{"s": x["s"], "e": x["e"]} for x in w]}
    order.append(pid)

cues = {k: resolve(v) for k, v in cfg["cues"].items()}
cuts = []
for c in cfg["cuts"]:
    cuts.append({**c, "t": resolve(c["at"])})
tl = {"dur": cues["end"], "fps": 60, "order": order, "p": phrases, "c": cues, "cuts": cuts}
json.dump(tl, open(os.path.join(ROOT, "build", "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
with open(os.path.join(ROOT, "build", "timeline.js"), "w", encoding="utf-8") as f:
    f.write("window.TL=" + json.dumps(tl, ensure_ascii=False) + ";\n")
print("dur", tl["dur"], "frames", round(tl["dur"] * 60), "cuts", len(cuts))
for a, b in zip(cuts, cuts[1:]):
    print(f'{a["scene"]:<14}{a["t"]:7.2f}  len {b["t"]-a["t"]:5.2f}')
print(f'{cuts[-1]["scene"]:<14}{cuts[-1]["t"]:7.2f}')
