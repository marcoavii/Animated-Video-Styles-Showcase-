"""Study a reference video from the first frame to the last and write everything a style clone needs.

usage: python analyze_ref.py <video> <outdir> [--whisper small|base|none] [--quick] [--lang id]

Measures (story, script and VO content are NOT the target; they are only used for timing):
  format     resolution, ratio, fps (and VFR), codec, colour tags, encoder/app tags (tool hints)
  edit       every cut, gradual transitions (dissolve / fade / dip / flash), whip blur, shot lengths, tempo
  camera     per-shot pan/tilt speed, push/pull zoom, shake
  look       palette, brightness, contrast, saturation, warmth, black/white point, grain, sharpness,
             vignette, dark ink-line density, per shot and overall
  captions   band position, size, fill colours, outline colour, lines, on/off timing, sync to words
  sound      loudness, speech rate, music bed level + tempo guess, SFX density, hits on cuts, spectrogram
Writes into <outdir>:
  report.json, report.md       numbers
  sheets/shots_NN.png          middle frame of EVERY shot, labelled (read all of them)
  sheets/timeline_NN.png       frames at a fixed step over the whole video (read all of them)
  sheets/transitions.png       frame strips around each non-hard cut
  sheets/captions_NN.png       crop of every caption change
  sheets/palette.png, sheets/spectrogram.png
  frames/shot_NNN.jpg          full-resolution middle frame per shot (for close looks + comparison)
  captions/cap_NNN.png         full-resolution caption crops (for font matching)
--quick skips Whisper, caption crops and the timeline sheets (used by compare.py on a render).
"""
import json, os, re, subprocess, sys, math
import numpy as np
from scipy import ndimage, signal
from PIL import Image, ImageDraw, ImageFont

A = sys.argv[1:]
if len(A) < 2:
    print(__doc__); sys.exit(2)
SRC, OUT = A[0], A[1]
opt = lambda k, d=None: A[A.index("--" + k) + 1] if "--" + k in A else d
QUICK = "--quick" in A
WHISPER = "none" if QUICK else opt("whisper", "small")
LANG = opt("lang", None)
for d in ("sheets", "frames", "captions"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

def run(cmd, **k):
    return subprocess.run(cmd, capture_output=True, **k)

def font(size):
    for p in ("C:/Windows/Fonts/arialbd.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# ------------------------------------------------------------------ 1. format + tool hints
pj = json.loads(run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", SRC]).stdout)
vs = next(s for s in pj["streams"] if s["codec_type"] == "video")
aus = next((s for s in pj["streams"] if s["codec_type"] == "audio"), None)
W0, H0 = int(vs["width"]), int(vs["height"])
rot = int((vs.get("tags") or {}).get("rotate", 0) or 0)
for sd in vs.get("side_data_list", []) or []:
    if "rotation" in sd: rot = int(sd["rotation"])
if abs(rot) in (90, 270): W0, H0 = H0, W0
fr = lambda s: (lambda a, b: float(a) / float(b) if float(b) else 0)(*s.split("/"))
r_fps, avg_fps = fr(vs.get("r_frame_rate", "0/1")), fr(vs.get("avg_frame_rate", "0/1"))
DUR = float(pj["format"].get("duration") or vs.get("duration") or 0)
pts = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-read_intervals", "%+20", "-show_entries", "frame=pts_time", "-of", "csv=p=0", SRC], text=True).stdout.split()
pts = np.array([float(x) for x in pts if re.match(r"^-?[\d.]+$", x)])
dts = np.diff(pts) if len(pts) > 2 else np.array([1 / max(avg_fps, 1)])
vfr = bool(len(dts) > 5 and dts.std() > 0.25 * dts.mean())
FPS = avg_fps if avg_fps > 0 else r_fps
common = min((24, 25, 30, 50, 60, 23.976, 29.97, 59.94, 120), key=lambda c: abs(c - FPS))
tags = {}
for scope, d in (("format", pj["format"].get("tags", {})), ("video", vs.get("tags", {})), ("audio", (aus or {}).get("tags", {}))):
    for k, v in (d or {}).items(): tags[f"{scope}.{k}"] = v
blob = " ".join(f"{k}={v}" for k, v in tags.items()).lower()
SIGS = [("capcut", "CapCut (captions/auto-captions, templates, effects)"), ("lavf", "ffmpeg/libavformat (re-encoded or rendered by code, e.g. Remotion, ffmpeg pipeline, a downloader)"),
        ("premiere", "Adobe Premiere Pro"), ("after effects", "Adobe After Effects"), ("adobe", "an Adobe app"), ("davinci", "DaVinci Resolve"), ("resolve", "DaVinci Resolve"),
        ("final cut", "Final Cut Pro"), ("apple", "Apple device or app (iPhone, iMovie, Final Cut)"), ("blender", "Blender"), ("vn ", "VN editor"), ("inshot", "InShot"),
        ("kinemaster", "KineMaster"), ("canva", "Canva"), ("remotion", "Remotion"), ("tiktok", "TikTok (downloaded or exported)"), ("vid:v", "TikTok download"),
        ("isom", "generic MP4 brand (no app named)"), ("android", "Android device"), ("unity", "Unity"), ("unreal", "Unreal Engine"), ("handbrake", "HandBrake re-encode"),
        ("youtube", "YouTube download"), ("google", "Google/YouTube pipeline"), ("x264", "x264 encoder"), ("instagram", "Instagram download")]
hints = sorted({v for k, v in SIGS if k in blob})
enc_info = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,profile,pix_fmt,color_space,color_transfer,color_primaries,bit_rate", "-of", "json", SRC], text=True).stdout
x264opt = re.search(r"x264 - core \d+[^\n]{0,200}", run(["ffmpeg", "-v", "error", "-i", SRC, "-map", "0:v:0", "-c", "copy", "-frames:v", "3", "-f", "h264", "-"]).stdout.decode("latin1", "ignore"))
fmt = {"width": W0, "height": H0, "ratio": "9:16" if H0 > W0 * 1.5 else "16:9" if W0 > H0 * 1.5 else ("1:1" if abs(W0 - H0) < 10 else ("4:5" if H0 > W0 else "4:3")),
       "fps": round(FPS, 3), "fps_nearest_standard": common, "r_frame_rate": vs.get("r_frame_rate"), "vfr": vfr, "duration": round(DUR, 3),
       "codec": vs.get("codec_name"), "pix_fmt": vs.get("pix_fmt"), "color": {k: vs.get(k) for k in ("color_space", "color_transfer", "color_primaries", "color_range")},
       "bitrate_kbps": round(int(pj["format"].get("bit_rate", 0)) / 1000), "audio": {k: (aus or {}).get(k) for k in ("codec_name", "sample_rate", "channels")},
       "tags": tags, "encoder_settings": x264opt.group(0)[:200] if x264opt else None, "tool_hints": hints}
print(f"[format] {W0}x{H0} {fmt['ratio']} {FPS:.3f} fps {'VFR ' if vfr else ''}{DUR:.1f}s  hints: {', '.join(hints) or '-'}")

# ------------------------------------------------------------------ decoding helper
def frames(width, fps=None, gray=False):
    h = int(round(width * H0 / W0 / 2)) * 2
    vf = (f"fps={fps}," if fps else "") + f"scale={width}:{h}:flags=area"
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", SRC, "-vf", vf, "-pix_fmt", "gray" if gray else "rgb24", "-f", "rawvideo", "-"], stdout=subprocess.PIPE, bufsize=10 ** 7)
    n = width * h * (1 if gray else 3)
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        a = np.frombuffer(b, np.uint8)
        yield a.reshape(h, width) if gray else a.reshape(h, width, 3)
    p.wait()

def luma(rgb): return rgb[..., 0] * .2126 + rgb[..., 1] * .7152 + rgb[..., 2] * .0722

# ------------------------------------------------------------------ 2. caption + look pass (4 fps, 360 px)
SFPS = 4.0
CW = 360
heat, samples = None, []
pal_px = []
for i, f in enumerate(frames(CW, SFPS)):
    f = f.astype(np.float32)
    Y = luma(f)
    mn, mx = f.min(2), f.max(2)
    white = mn > 212
    yellow = (f[..., 0] > 190) & (f[..., 1] > 150) & (f[..., 2] < 140) & (f[..., 0] - f[..., 2] > 90)
    colored = (mx > 200) & ((mx - mn) > 110)
    dark = ndimage.maximum_filter(Y < 70, size=5)
    txt = (white | yellow | colored) & dark
    # keep glyph-sized pieces only: big bright shapes with an outline (white heads, signs, sky) are not captions
    lab, nl = ndimage.label(txt)
    if nl:
        area = np.bincount(lab.ravel(), minlength=nl + 1)
        objs = ndimage.find_objects(lab)
        hmax = 0.075 * f.shape[0]
        bad = np.zeros(nl + 1, bool)
        for j, sl in enumerate(objs, 1):
            hh_, ww_ = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            fill = area[j] / max(1, hh_ * ww_)
            if hh_ > hmax or area[j] > 0.0035 * f.shape[0] * f.shape[1] or (area[j] > 40 and fill > 0.8) or area[j] < 3: bad[j] = True
        bad[0] = True
        txt = ~bad[lab]
    # text glyphs are thin: keep only bright pixels that are close to dark ones on both sides somewhere
    heat = txt.astype(np.float32) if heat is None else heat + txt
    samples.append(np.packbits(txt, axis=1))
NS = len(samples)
Hs, Ws = heat.shape
print(f"[pass A] {NS} samples at {SFPS} fps")

# caption band: rows that often hold outlined text and whose content changes over time
rowheat = heat.sum(1) / (NS * Ws)
unpack = lambda k: np.unpackbits(samples[k], axis=1)[:, :Ws].astype(bool)
row_var = np.zeros(Hs)
for k in range(1, NS):
    row_var += (unpack(k) ^ unpack(k - 1)).sum(1)
row_var /= max(1, NS - 1) * Ws
score = ndimage.uniform_filter1d(row_var, 5)
bands = []
if score.max() > 0.0004:
    thr = max(score.max() * 0.25, 0.0002)
    lab, nb = ndimage.label(score > thr)
    for b in range(1, nb + 1):
        rows = np.where(lab == b)[0]
        if len(rows) > 0.16 * Hs: continue  # far too tall for a caption line
        bands.append({"y0": int(rows[0]), "y1": int(rows[-1]) + 1, "change": float(score[rows].sum()), "presence": float(rowheat[rows].mean())})
    bands.sort(key=lambda b: -b["change"])
static_rows = np.where((ndimage.uniform_filter1d(rowheat, 5) > 0.01) & (score < 0.0002))[0]
cap = None
if bands:
    b = bands[0]
    pad = max(3, int((b["y1"] - b["y0"]) * 0.35))
    y0, y1 = max(0, b["y0"] - pad), min(Hs, b["y1"] + pad)
    on, sig = [], []
    for k in range(NS):
        m = unpack(k)[y0:y1]
        on.append(m.sum() > (y1 - y0) * Ws * 0.002)
        sig.append(m)
    events = []
    for k in range(NS):
        if not on[k]:
            if events and events[-1]["end"] is None: events[-1]["end"] = k / SFPS
            continue
        new = not events or events[-1]["end"] is not None
        if not new:
            a, bb = sig[k], sig[events[-1]["k"]]
            inter, uni = (a & bb).sum(), (a | bb).sum()
            # also compare with previous sample so slow pop-in animations do not count as new captions
            a2 = sig[k - 1]
            if uni and inter / uni < 0.35 and ((a & a2).sum() / max(1, (a | a2).sum())) < 0.5:
                events[-1]["end"] = k / SFPS; new = True
        if new: events.append({"k": k, "t": k / SFPS, "end": None})
    if events and events[-1]["end"] is None: events[-1]["end"] = NS / SFPS
    # measure each caption from its densest sample
    caps = []
    for e in events:
        k0, k1 = e["k"], max(e["k"] + 1, int(round(e["end"] * SFPS)))
        best = max(range(k0, min(k1, NS)), key=lambda k: sig[k].sum())
        m = sig[best]
        rr, cc = np.where(m)
        if len(rr) < 8: continue
        caps.append({"t": round(e["t"], 3), "end": round(e["end"], 3), "k": best, "y0": int(rr.min() + y0), "y1": int(rr.max() + y0 + 1), "x0": int(cc.min()), "x1": int(cc.max() + 1)})
    cap = {"band_px360": [y0, y1], "events": caps}
print(f"[captions] bands {[(b['y0'], b['y1']) for b in bands[:3]]}  captions found: {len(cap['events']) if cap else 0}")

# look stats per sample, with the caption band blanked
mask = np.ones((Hs, Ws), bool)
if cap: mask[cap["band_px360"][0]:cap["band_px360"][1]] = False
look = []
cap_fill = []
cap_at = {e["k"]: e for e in cap["events"]} if cap else {}
for k, f in enumerate(frames(CW, SFPS)):
    if k >= NS: break
    f = f.astype(np.float32)
    Y = luma(f)
    mn, mx = f.min(2), f.max(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    if k % 2 == 0: pal_px.append(f[::6, ::6][mask[::6, ::6]].reshape(-1, 3))
    Ym = Y[mask]
    gx, gy = ndimage.sobel(Y, 1), ndimage.sobel(Y, 0)
    g = np.hypot(gx, gy)
    flat = (g < 18) & mask
    resid = Y - ndimage.gaussian_filter(Y, 1.0)
    grain = float(resid[flat].std()) if flat.sum() > 200 else 0.0
    lap = ndimage.laplace(Y)
    hh, ww = Y.shape
    c = Y[hh // 3:2 * hh // 3, ww // 3:2 * ww // 3].mean()
    corners = np.concatenate([Y[:hh // 8, :ww // 8].ravel(), Y[:hh // 8, -ww // 8:].ravel(), Y[-hh // 8:, :ww // 8].ravel(), Y[-hh // 8:, -ww // 8:].ravel()]).mean()
    ink = ((Y < 45) & (g > 60) & mask).mean()
    look.append({"t": k / SFPS, "luma": float(Ym.mean()), "contrast": float(Ym.std()), "sat": float(sat[mask].mean()), "warm": float((f[..., 0] - f[..., 2])[mask].mean()),
                 "black": float(np.percentile(Ym, 2)), "white": float(np.percentile(Ym, 98)), "grain": grain, "sharp": float(lap[mask].var()),
                 "vignette": float(corners / max(c, 1)), "ink": float(ink)})
    e = cap_at.get(k)
    if e:
        m = unpack(k)[e["y0"]:e["y1"], e["x0"]:e["x1"]]
        px = f[e["y0"]:e["y1"], e["x0"]:e["x1"]][m]
        darkpx = f[e["y0"]:e["y1"], e["x0"]:e["x1"]][(Y[e["y0"]:e["y1"], e["x0"]:e["x1"]] < 60)]
        cap_fill.append((px, darkpx, e))

def kmeans(X, k, it=12, seed=0):
    X = np.asarray(X, np.float32)
    if len(X) < k: return X, np.ones(len(X))
    rs = np.random.RandomState(seed)
    C = X[rs.choice(len(X), k, replace=False)]
    for _ in range(it):
        d = ((X[:, None] - C[None]) ** 2).sum(2); l = d.argmin(1)
        for j in range(k):
            if (l == j).any(): C[j] = X[l == j].mean(0)
    l = ((X[:, None] - C[None]) ** 2).sum(2).argmin(1)
    w = np.bincount(l, minlength=k) / len(l)
    o = np.argsort(-w)
    return C[o], w[o]
hexc = lambda c: "#%02x%02x%02x" % tuple(int(max(0, min(255, v))) for v in c)
P = np.concatenate(pal_px)
P = P[np.random.RandomState(1).choice(len(P), min(len(P), 40000), replace=False)]
pc, pw = kmeans(P, 10)
palette = [{"hex": hexc(c), "share": round(float(w), 3)} for c, w in zip(pc, pw)]

cap_style = None
if cap and cap_fill:
    allf = np.concatenate([p for p, _, _ in cap_fill])
    fc, fw = kmeans(allf[np.random.RandomState(2).choice(len(allf), min(len(allf), 20000), replace=False)], 4)
    dk = np.concatenate([d for _, d, _ in cap_fill if len(d)]) if any(len(d) for _, d, _ in cap_fill) else np.zeros((1, 3))
    oc = np.median(dk, 0)
    hs = np.array([(e["y1"] - e["y0"]) / Hs for _, _, e in cap_fill])
    ws = np.array([(e["x1"] - e["x0"]) / Ws for _, _, e in cap_fill])
    cy = np.array([(e["y0"] + e["y1"]) / 2 / Hs for _, _, e in cap_fill])
    cx = np.array([(e["x0"] + e["x1"]) / 2 / Ws for _, _, e in cap_fill])
    durs = np.array([e["end"] - e["t"] for e in cap["events"]])
    # per-caption main fill colour (shows keyword highlight frequency)
    per = []
    for px, _, e in cap_fill:
        if len(px) < 5: continue
        m = np.median(px, 0); per.append(hexc(m))
    def family(h):
        r, g, b = int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)
        if min(r, g, b) > 200: return "white"
        if r > 180 and g > 140 and b < 130: return "yellow/orange"
        if g > 150 and r < 140: return "green"
        if b > 150 and r < 140: return "blue/cyan"
        if r > 170 and g < 110: return "red/pink"
        return "other"
    fam = {}
    for h in per: fam[family(h)] = fam.get(family(h), 0) + 1
    on_time = float(sum(durs))
    cap_style = {"count": len(cap["events"]), "center_y_pct": round(float(np.median(cy)) * 100, 1), "center_x_pct": round(float(np.median(cx)) * 100, 1),
                 "glyph_block_height_pct_of_H": round(float(np.median(hs)) * 100, 2), "width_pct_of_W_median": round(float(np.median(ws)) * 100, 1), "width_pct_max": round(float(ws.max()) * 100, 1),
                 "fill_colours": [{"hex": hexc(c), "share": round(float(w), 3)} for c, w in zip(fc, fw)], "outline_colour": hexc(oc),
                 "caption_colour_families": fam, "duration_median_s": round(float(np.median(durs)), 2), "duration_p10_p90": [round(float(np.percentile(durs, 10)), 2), round(float(np.percentile(durs, 90)), 2)],
                 "on_screen_share": round(on_time / max(DUR, 1e-3), 2), "static_text_rows_pct": [round(r / Hs * 100, 1) for r in static_rows[::max(1, len(static_rows) // 6)]] if len(static_rows) else []}
lk = {k: np.array([r[k] for r in look]) for k in look[0]} if look else {}
look_sum = {k: {"median": round(float(np.median(v)), 4 if k in ("sat", "ink") else 2), "p10": round(float(np.percentile(v, 10)), 4 if k in ("sat", "ink") else 2), "p90": round(float(np.percentile(v, 90)), 4 if k in ("sat", "ink") else 2)} for k, v in lk.items() if k != "t"}

# ------------------------------------------------------------------ 3. edit + camera pass (native fps, 160 px gray)
GW = 160
prev, diffs, hists, sharp, lum, motion = None, [], [], [], [], []
gmask = None
win = None
prevF = None
for f in frames(GW, None, gray=True):
    f = f.astype(np.float32)
    if gmask is None:
        gh = f.shape[0]
        gmask = np.ones_like(f, bool)
        if cap:
            a, b = cap["band_px360"]
            gmask[int(a / Hs * gh):int(math.ceil(b / Hs * gh))] = False
        win = np.outer(np.hanning(f.shape[0]), np.hanning(f.shape[1])).astype(np.float32)
    h = np.histogram(f[gmask], 32, (0, 256))[0].astype(np.float32); h /= h.sum()
    hists.append(h)
    lum.append(float(f[gmask].mean()))
    sharp.append(float(ndimage.laplace(f)[gmask].var()))
    if prev is not None:
        Fa = np.fft.fft2((prev - prev.mean()) * win); Fb = np.fft.fft2((f - f.mean()) * win)
        R = Fa * np.conj(Fb); R /= np.abs(R) + 1e-6
        r = np.fft.ifft2(R).real
        py, px = np.unravel_index(r.argmax(), r.shape)
        conf = float(r.max())
        dy = py if py < r.shape[0] // 2 else py - r.shape[0]
        dx = px if px < r.shape[1] // 2 else px - r.shape[1]
        motion.append((dx / GW, dy / GW, conf))
        # motion-compensated difference: a flying camera changes every pixel but stays low here; a cut does not
        best = 1e9
        for sy, sx in ((dy, dx), (0, 0)):
            if abs(sy) >= f.shape[0] // 3 or abs(sx) >= f.shape[1] // 3: continue
            a_ = prev[max(0, sy):f.shape[0] + min(0, sy), max(0, sx):f.shape[1] + min(0, sx)]
            b_ = f[max(0, -sy):f.shape[0] + min(0, -sy), max(0, -sx):f.shape[1] + min(0, -sx)]
            m_ = gmask[max(0, -sy):f.shape[0] + min(0, -sy), max(0, -sx):f.shape[1] + min(0, -sx)]
            # compare blurred copies so motion blur and sub-pixel drift do not count
            e = float(np.abs(ndimage.uniform_filter(a_, 3) - ndimage.uniform_filter(b_, 3))[m_].mean())
            best = min(best, e)
        diffs.append(best)
    else:
        diffs.append(0.0); motion.append((0.0, 0.0, 1.0))
    prev = f
    prevF = f
NF = len(diffs)
if NF and DUR: FPS_D = NF / DUR
else: FPS_D = FPS
fps_eff = FPS if not vfr else FPS_D
D = np.array(diffs); Hh = np.array(hists); L = np.array(lum); SH = np.array(sharp); MO = np.array(motion)
hd = np.r_[0, np.abs(np.diff(Hh, axis=0)).sum(1)]
print(f"[pass B] {NF} frames")

# hard cuts: single-frame spike in both pixel and histogram difference
med = ndimage.median_filter(D, size=max(9, int(fps_eff * 0.5)) | 1)
cuts = []
for i in range(1, NF):
    nb = max(D[i - 1], D[i + 1] if i + 1 < NF else 0)
    hnb = max(hd[i - 1], hd[i + 1] if i + 1 < NF else 0)
    calm = D[i] > max(8.0, 3.0 * med[i] + 3) and D[i] > 1.7 * nb and (hd[i] > 0.15 or D[i] > 24 or MO[i, 2] < 0.08)
    busy = D[i] > max(10.0, 1.5 * med[i] + 3) and D[i] > 1.35 * nb and hd[i] > 0.3 and hd[i] > 1.8 * hnb  # fast camera footage
    if calm or busy:
        if not cuts or i - cuts[-1] > 2: cuts.append(i)
# gradual transitions: big change over ~0.2-1 s with no spike, and the middle frame is a blend of the ends
grads = []
K = max(4, int(round(fps_eff * 0.4)))
cutset = set(cuts)
small = []
for f in frames(64, None, gray=True): small.append(f.astype(np.float32))
small = np.array(small[:NF]) if small else np.zeros((0,))
if len(small) > 2 * K:
    sm = np.ones(small.shape[1:], bool)
    if cap:
        a, b = cap["band_px360"]; sh = small.shape[1]
        sm[int(a / Hs * sh):int(math.ceil(b / Hs * sh))] = False
    i = K
    while i < NF - K:
        a, b = small[i - K], small[i + K]
        span = np.abs(a - b)[sm].mean()
        near_cut = any(abs(i - c) <= K for c in cuts)
        if span > 14 and not near_cut and D[i - K:i + K].max() < max(10.0, 3.0 * np.median(D[max(0, i - 3 * K):i + 3 * K]) + 4) * 1.4:
            # a true cross-fade: every frame in between is A*(1-a) + B*a with a rising steadily, and nothing else
            BA = (b - a)[sm]; nrm = float((BA ** 2).sum()) + 1e-6
            al, res = [], []
            for j in range(i - K + 1, i + K):
                Fj = (small[j] - a)[sm]
                aj = float((Fj * BA).sum() / nrm); al.append(aj)
                res.append(float(np.abs(Fj - aj * BA).mean()))
            al = np.array(al); fit = max(res) / span
            mono = np.all(np.diff(al) > -0.04) and al[-1] - al[0] > 0.6 and np.median(np.abs(np.diff(al))) > 0.02
            if fit < 0.22 and mono:
                kind = "dissolve"
                ml = L[i - K:i + K + 1]
                if ml.min() < 18 and L[i - K] > 30 and L[i + K] > 30: kind = "dip-to-black"
                elif ml.max() > 235 and L[i - K] < 220 and L[i + K] < 220: kind = "flash/dip-to-white"
                elif L[i - K] < 12 or L[i + K] < 12: kind = "fade-from/to-black"
                grads.append({"frame": i, "t": round(i / fps_eff, 3), "dur": round(2 * K / fps_eff, 2), "type": kind, "blend_fit": round(fit, 2)})
                i += 2 * K; continue
        i += max(1, K // 3)
# place changes with no cut: the camera flies, whips or morphs from one place to the next
K2 = max(4, int(round(fps_eff * 0.5)))
flys = []
if NF > 2 * K2:
    hl = np.array([np.abs(Hh[min(NF - 1, i + K2)] - Hh[i]).sum() for i in range(NF)])
    pk, _ = signal.find_peaks(hl, height=0.55, distance=int(fps_eff * 0.8))
    taken = [c for c in cuts] + [g["frame"] for g in grads]
    for p_ in pk:
        mid = p_ + K2 // 2
        if any(abs(mid - c) < K2 * 1.2 for c in taken): continue
        seg = MO[p_:p_ + K2]
        mv = float(np.hypot(seg[:, 0], seg[:, 1]).mean() * fps_eff * 100)
        blur = float(SH[p_:p_ + K2].min() / max(np.median(SH), 1e-3))
        kind = "whip/fly-through" if (mv > 20 or blur < 0.4) else "morph/slide/other"
        flys.append({"frame": int(mid), "t": round(mid / fps_eff, 3), "type": kind, "move_pct_per_s": round(mv, 1), "blur_ratio": round(blur, 2), "hist_change": round(float(hl[p_]), 2)})
        taken.append(mid)
grads += flys
grads.sort(key=lambda g: g["frame"])
# cut flavour: whip (motion blur + big motion around it), flash, or plain
cutinfo = []
base_sharp = np.median(SH) if len(SH) else 1
for c in cuts:
    lo, hi = max(0, c - 3), min(NF, c + 3)
    # judge blur and motion on the frames beside the cut, never on the cut pair itself
    side = [k for k in range(lo, hi) if k not in (c,)]
    ref_sharp = np.median(SH[max(0, c - int(fps_eff)):min(NF, c + int(fps_eff))]) or base_sharp
    blur = float(min(SH[k] for k in side) / max(ref_sharp, 1e-3)) if side else 1.0
    mv = float(max([np.hypot(*MO[k, :2]) for k in side if k != c and MO[k, 2] > 0.05] or [0]))
    kind = "hard"
    if blur < 0.35 and mv > 0.03: kind = "whip/blur"
    elif L[lo:hi].max() > 240 and np.median(L) < 200: kind = "flash"
    elif L[c] < 10 or L[c - 1] < 10: kind = "via-black"
    cutinfo.append({"frame": c, "t": round(c / fps_eff, 3), "type": kind, "blur_ratio": round(blur, 2)})
bounds = sorted([0] + [c["frame"] for c in cutinfo] + [g["frame"] for g in grads] + [NF])
shots = []
tin = {c["frame"]: c["type"] for c in cutinfo}; tin.update({g["frame"]: g["type"] for g in grads})
for a, b in zip(bounds[:-1], bounds[1:]):
    if b - a < 2: continue
    mo = MO[a + 1:b]
    ok = mo[:, 2] > 0.05 if len(mo) else np.zeros(0, bool)
    dx = mo[ok, 0] if ok.any() else np.zeros(1); dy = mo[ok, 1] if ok.any() else np.zeros(1)
    speed = float(np.hypot(dx.mean(), dy.mean()) * fps_eff * 100)  # % of width per second, steady part
    jitter = float(np.hypot(np.std(dx - ndimage.uniform_filter1d(dx, 7)), np.std(dy - ndimage.uniform_filter1d(dy, 7))) * 100) if len(dx) > 8 else 0.0
    shots.append({"i": len(shots), "f0": a, "f1": b, "t0": round(a / fps_eff, 3), "t1": round(b / fps_eff, 3), "dur": round((b - a) / fps_eff, 3), "in": tin.get(a, "start"),
                  "pan_pct_per_s": round(speed, 2), "pan_dir": [round(float(dx.mean() * fps_eff * 100), 2), round(float(dy.mean() * fps_eff * 100), 2)], "jitter": round(jitter, 3),
                  "luma": round(float(L[a:b].mean()), 1)})
# zoom per shot: compare first and last steady frames of the shot at several scales
def zoom_of(a, b):
    if b - a < max(6, fps_eff * 0.3) or len(small) < b: return 0.0
    A_, B_ = small[a + 1], small[b - 2]
    h, w = A_.shape
    best, bs = 1e9, 1.0
    for s in np.linspace(0.85, 1.15, 31):
        im = Image.fromarray(A_.astype(np.uint8)).resize((max(8, int(w * s)), max(8, int(h * s))), Image.BILINEAR)
        arr = np.asarray(im, np.float32)
        hh, ww = arr.shape
        cy0, cx0 = (hh - h // 2) // 2, (ww - w // 2) // 2
        ca = arr[cy0:cy0 + h // 2, cx0:cx0 + w // 2]
        cb = B_[h // 4:h // 4 + h // 2, w // 4:w // 4 + w // 2]
        if ca.shape != cb.shape: continue
        e = np.abs(ca - cb).mean()
        if e < best: best, bs = e, s
    return round((bs - 1) * 100, 1)
for s in shots:
    s["zoom_pct"] = zoom_of(s["f0"], s["f1"])
    s["move"] = ("push-in" if s["zoom_pct"] > 2.5 else "pull-out" if s["zoom_pct"] < -2.5 else "") + (" pan" if s["pan_pct_per_s"] > 4 else "")
    s["move"] = s["move"].strip() or ("static/subtle" if s["pan_pct_per_s"] < 1.5 else "slow drift")
SL = np.array([s["dur"] for s in shots]) if shots else np.array([DUR])
edit = {"shots": len(shots), "cuts_per_min": round(len(shots) / max(DUR, 1e-3) * 60, 1), "shot_len_mean": round(float(SL.mean()), 2), "shot_len_median": round(float(np.median(SL)), 2),
        "shot_len_p10_p90": [round(float(np.percentile(SL, 10)), 2), round(float(np.percentile(SL, 90)), 2)], "shot_len_min_max": [round(float(SL.min()), 2), round(float(SL.max()), 2)],
        "transitions": {}, "moves": {}, "jitter_median": round(float(np.median([s["jitter"] for s in shots])) if shots else 0, 3)}
for s in shots[1:]: edit["transitions"][s["in"]] = edit["transitions"].get(s["in"], 0) + 1
for s in shots: edit["moves"][s["move"]] = edit["moves"].get(s["move"], 0) + 1
# pacing curve: shots per 10 s window
edit["shots_per_10s"] = [int(sum(1 for s in shots if w <= s["t0"] < w + 10)) for w in range(0, int(math.ceil(DUR)), 10)]
print(f"[edit] {edit['shots']} shots, mean {edit['shot_len_mean']} s, transitions {edit['transitions']}")

# ------------------------------------------------------------------ 4. frame extraction + sheets
def grab(times, outdir, prefix, width=None):
    """Exact frames at the given times, full resolution unless width is given. Returns paths."""
    paths = []
    for j, t in enumerate(times):
        p = os.path.join(outdir, f"{prefix}{j:03d}.jpg")
        vf = ["-vf", f"scale={width}:-2"] if width else []
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t):.3f}", "-i", SRC, "-frames:v", "1", *vf, "-q:v", "2", p])
        paths.append(p if os.path.exists(p) else None)
    return paths

def sheet(items, out, cols, tw, title=None):
    """items: list of (path or PIL image, label). Writes a labelled grid."""
    ims = []
    for it, lab in items:
        if it is None: continue
        im = it if isinstance(it, Image.Image) else Image.open(it).convert("RGB")
        im = im.resize((tw, int(tw * im.height / im.width)), Image.LANCZOS)
        ims.append((im, lab))
    if not ims: return None
    th = max(i.height for i, _ in ims)
    lab_h = 30
    rows = math.ceil(len(ims) / cols)
    top = 44 if title else 0
    S = Image.new("RGB", (cols * (tw + 6) + 6, top + rows * (th + lab_h + 6) + 6), (24, 24, 24))
    d = ImageDraw.Draw(S)
    if title: d.text((8, 8), title, fill=(255, 255, 255), font=font(26))
    for n, (im, lab) in enumerate(ims):
        x, y = 6 + (n % cols) * (tw + 6), top + 6 + (n // cols) * (th + lab_h + 6)
        S.paste(im, (x, y))
        d.text((x + 2, y + th + 4), lab, fill=(255, 230, 120), font=font(14 if tw < 300 else 18))
    S.save(out)
    return out

portrait = H0 > W0
mids = [(s["t0"] + s["t1"]) / 2 for s in shots]
shot_paths = grab(mids, os.path.join(OUT, "frames"), "shot_")
per = 30 if portrait else 24
cols = 6 if portrait else 4
tw = 240 if portrait else 400
sheets = []
for p in range(0, len(shots), per):
    items = [(shot_paths[j], f"#{j} {shots[j]['t0']:.1f}s {shots[j]['dur']:.1f}s {shots[j]['in'][:6]} {shots[j]['move'][:9]}") for j in range(p, min(len(shots), p + per))]
    out = os.path.join(OUT, "sheets", f"shots_{p // per:02d}.png")
    if sheet(items, out, cols, tw, f"Shots {p}-{min(len(shots), p + per) - 1}  (middle frame of each)"): sheets.append(out)

if not QUICK:
    step = 1.0 if DUR <= 120 else 2.0 if DUR <= 300 else 5.0
    ts = list(np.arange(0.25, DUR, step))
    tdir = os.path.join(OUT, "frames", "timeline"); os.makedirs(tdir, exist_ok=True)
    tp = grab(ts, tdir, "t_", width=320 if portrait else 480)
    per_t = 40 if portrait else 30
    for p in range(0, len(ts), per_t):
        items = [(tp[j], f"{ts[j]:.2f}s") for j in range(p, min(len(ts), p + per_t))]
        out = os.path.join(OUT, "sheets", f"timeline_{p // per_t:02d}.png")
        if sheet(items, out, 8 if portrait else 6, 180 if portrait else 300, f"Timeline every {step:g} s  ({ts[p]:.1f}-{ts[min(len(ts), p + per_t) - 1]:.1f} s)"): sheets.append(out)
    # transitions: strips around each non-hard cut and gradual transition (max 12)
    tr = [(c["t"], c["type"]) for c in cutinfo if c["type"] != "hard"] + [(g["t"], g["type"]) for g in grads]
    tr.sort()
    tdir2 = os.path.join(OUT, "frames", "trans"); os.makedirs(tdir2, exist_ok=True)
    items = []
    for n, (t, kind) in enumerate(tr[:12]):
        offs = np.linspace(-0.3, 0.3, 6)
        ps = grab([t + o for o in offs], tdir2, f"tr{n:02d}_", width=240 if portrait else 360)
        for o, p in zip(offs, ps): items.append((p, f"{kind[:10]} {t + o:.2f}"))
    if items:
        out = os.path.join(OUT, "sheets", "transitions.png")
        if sheet(items, out, 6, 200 if portrait else 300, "Non-hard transitions: 6 frames across each (-0.3 s .. +0.3 s)"): sheets.append(out)
    # also a strip around the first 6 hard cuts, to see what a cut looks like frame by frame
    items = []
    for n, c in enumerate([c for c in cutinfo if c["type"] == "hard"][:4]):
        fr_ = [c["t"] + k / fps_eff for k in (-2, -1, 0, 1, 2, 3)]
        ps = grab(fr_, tdir2, f"cut{n:02d}_", width=240 if portrait else 360)
        for t, p in zip(fr_, ps): items.append((p, f"cut {t:.3f}"))
    if items:
        out = os.path.join(OUT, "sheets", "cuts_framebyframe.png")
        if sheet(items, out, 6, 200 if portrait else 300, "Hard cuts frame by frame (does anything happen on the cut?)"): sheets.append(out)

    # captions: full-res crop of each caption event
    if cap and cap["events"]:
        sc = W0 / CW
        cdir = os.path.join(OUT, "captions")
        items = []
        for n, e in enumerate(cap["events"]):
            t = e["k"] / SFPS
            p = os.path.join(cdir, f"full_{n:03d}.png")
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", SRC, "-frames:v", "1", p])
            if not os.path.exists(p): continue
            im = Image.open(p).convert("RGB")
            pad = int(0.25 * (e["y1"] - e["y0"]) * sc) + 6
            box = (max(0, int(e["x0"] * sc) - pad), max(0, int(e["y0"] * sc) - pad), min(W0, int(e["x1"] * sc) + pad), min(H0, int(e["y1"] * sc) + pad))
            cr = im.crop(box); cp = os.path.join(cdir, f"cap_{n:03d}.png"); cr.save(cp)
            e["crop"] = os.path.relpath(cp, OUT); e["full"] = os.path.relpath(p, OUT)
            items.append((cr, f"#{n} {e['t']:.2f}-{e['end']:.2f}s"))
        for p in range(0, len(items), 48):
            out = os.path.join(OUT, "sheets", f"captions_{p // 48:02d}.png")
            # caption crops have different widths: pad each into a fixed tile
            tiles = []
            for cr, lab in items[p:p + 48]:
                tile = Image.new("RGB", (420, 120), (60, 60, 60))
                c2 = cr.copy(); c2.thumbnail((410, 110))
                tile.paste(c2, ((420 - c2.width) // 2, (120 - c2.height) // 2)); tiles.append((tile, lab))
            if sheet(tiles, out, 4, 420, "Caption crops (full resolution source in captions/)"): sheets.append(out)
        # one full frame with the caption, to see placement in context
        if cap["events"]:
            mid = cap["events"][len(cap["events"]) // 2]
            if mid.get("full"): cap_style and cap_style.setdefault("example_frame", mid["full"])

# palette swatch
sw = Image.new("RGB", (1000, 140), (0, 0, 0)); d = ImageDraw.Draw(sw); x = 0
for c in palette:
    w = max(30, int(1000 * c["share"]))
    d.rectangle([x, 0, x + w, 100], fill=c["hex"]); d.text((x + 3, 106), c["hex"], fill=(255, 255, 255), font=font(14)); x += w
if cap_style:
    for j, c in enumerate(cap_style["fill_colours"]):
        d.rectangle([700 + j * 70, 106, 760 + j * 70, 138], fill=c["hex"])
sw.save(os.path.join(OUT, "sheets", "palette.png"))

# ------------------------------------------------------------------ 5. sound
sound = {"has_audio": aus is not None}
if aus is not None:
    lu = run(["ffmpeg", "-hide_banner", "-i", SRC, "-map", "0:a:0", "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"], text=True).stderr
    g = lambda k: (lambda m: float(m[-1]) if m else None)(re.findall(k + r":\s+(-?[\d.]+)", lu))
    sound.update({"lufs_i": g("I"), "lra": g("LRA"), "true_peak": g("Peak")})
    SR = 16000
    raw = run(["ffmpeg", "-v", "error", "-i", SRC, "-map", "0:a:0", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    st = run(["ffmpeg", "-v", "error", "-i", SRC, "-map", "0:a:0", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]).stdout
    s2 = np.frombuffer(st, np.float32).reshape(-1, 2) if aus.get("channels", 1) >= 2 else None
    if s2 is not None and len(s2) > SR:
        sound["stereo_width_side_mid_db"] = round(float(20 * np.log10(np.std(s2[:, 0] - s2[:, 1]) / max(np.std(s2[:, 0] + s2[:, 1]), 1e-9) + 1e-9)), 1)
    hop = 160  # 10 ms
    fr_ = np.lib.stride_tricks.sliding_window_view(np.pad(x, (0, 400)), 400)[::hop]
    rms = np.sqrt((fr_ ** 2).mean(1) + 1e-12); rdb = 20 * np.log10(rms + 1e-9)
    # words from Whisper -> speech spans
    words = []
    if WHISPER != "none":
        try:
            from faster_whisper import WhisperModel
            tmpw = os.path.join(OUT, "_audio16k.wav")
            run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-map", "0:a:0", "-ac", "1", "-ar", "16000", tmpw])
            m = WhisperModel(WHISPER, device="cpu", compute_type="int8")
            segs, info = m.transcribe(tmpw, word_timestamps=True, language=LANG, vad_filter=False)
            for sg in segs:
                for w in sg.words or []: words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
            sound["speech_lang"] = info.language
            os.remove(tmpw)
        except Exception as ex:
            print("whisper skipped:", ex)
    speech = np.zeros(len(rms), bool)
    for w in words:
        speech[int(w["s"] * 100):int(w["e"] * 100) + 1] = True
    if not words:
        # crude VAD: energy in the speech band well above the floor
        b = signal.sosfilt(signal.butter(4, [300 / 8000, 3400 / 8000], "band", output="sos"), x)
        br = np.sqrt((np.lib.stride_tricks.sliding_window_view(np.pad(b, (0, 400)), 400)[::hop] ** 2).mean(1) + 1e-12)
        bdb = 20 * np.log10(br + 1e-9)
        speech = ndimage.binary_closing(bdb > np.percentile(bdb, 25) + 18, iterations=15)
    speech = ndimage.binary_dilation(speech, iterations=8)
    gaps = ~speech
    sound["speech_share"] = round(float(speech.mean()), 2)
    if words:
        tot = words[-1]["e"] - words[0]["s"]
        sound["words"] = len(words); sound["words_per_s"] = round(len(words) / max(tot, 1e-3), 2)
        pauses = [round(words[i + 1]["s"] - words[i]["e"], 2) for i in range(len(words) - 1) if words[i + 1]["s"] - words[i]["e"] > 0.35]
        sound["pauses_over_0.35s"] = len(pauses); sound["longest_pause"] = max(pauses) if pauses else 0
    sp_db = float(np.median(rdb[speech])) if speech.any() else None
    gap_db = float(np.median(rdb[gaps])) if gaps.sum() > 30 else None
    # tonal-ness of the gaps: low spectral flatness = music, high = noise/room
    music = {}
    if gaps.sum() > 50:
        idx = np.where(gaps)[0]
        segsx = np.concatenate([x[i * hop:i * hop + hop] for i in idx[:: max(1, len(idx) // 3000)]])
        f, Pxx = signal.welch(segsx, SR, nperseg=2048)
        band = (f > 80) & (f < 5000)
        flat = float(np.exp(np.mean(np.log(Pxx[band] + 1e-20))) / (np.mean(Pxx[band]) + 1e-20))
        music["gap_level_db_below_speech"] = round(sp_db - gap_db, 1) if sp_db is not None and gap_db is not None else None
        music["gap_spectral_flatness"] = round(flat, 3)
        music["bed_guess"] = ("music or tonal bed under the VO" if flat < 0.12 and gap_db > -55 else "noise/room tone only" if gap_db > -60 else "near silence between phrases")
    # low band sustained energy under speech is another sign of music
    lowb = signal.sosfilt(signal.butter(4, 140 / 8000, "low", output="sos"), x)
    lr = np.sqrt((np.lib.stride_tricks.sliding_window_view(np.pad(lowb, (0, 400)), 400)[::hop] ** 2).mean(1) + 1e-12)
    music["low_band_db_in_gaps"] = round(float(np.median(20 * np.log10(lr[gaps] + 1e-9))), 1) if gaps.sum() > 30 else None
    # tempo from onset envelope (gaps weighted up, speech down)
    S_ = np.abs(signal.stft(x, SR, nperseg=1024, noverlap=1024 - hop)[2])
    flux = np.r_[0, np.maximum(0, np.diff(np.log1p(S_ * 50), axis=1)).sum(0)]
    flux = flux[:len(rms)] if len(flux) >= len(rms) else np.pad(flux, (0, len(rms) - len(flux)))
    fl = flux * np.where(speech, 0.35, 1.0)
    fl = fl - ndimage.uniform_filter1d(fl, 50)
    ac = np.correlate(fl, fl, "full")[len(fl) - 1:]
    lags = np.arange(len(ac)) / 100.0
    rng_ = (lags > 60 / 180) & (lags < 60 / 60)
    if rng_.any() and ac[0] > 0:
        L_ = lags[rng_][np.argmax(ac[rng_])]
        music["tempo_bpm_guess"] = round(60 / L_, 1); music["tempo_confidence"] = round(float(ac[rng_].max() / ac[0]), 3)
    sound["music"] = music
    # SFX: strong onsets, and how many cuts have a sound hit within 80 ms
    pk, _ = signal.find_peaks(flux, height=np.percentile(flux, 97), distance=8)
    hits = pk / 100.0
    sound["strong_onsets_per_min"] = round(len(hits) / max(DUR, 1e-3) * 60, 1)
    sound["strong_onsets_in_pauses"] = int(sum(1 for p in pk if p < len(gaps) and gaps[p]))
    ct = [s["t0"] for s in shots[1:]]
    sound["cuts_with_hit_80ms"] = round(sum(1 for t in ct if len(hits) and np.abs(hits - t).min() < 0.08) / max(1, len(ct)), 2)
    # spectrogram image
    f, t, Z = signal.spectrogram(x, SR, nperseg=1024, noverlap=768)
    Zd = 10 * np.log10(Z + 1e-12)
    Zd = np.clip((Zd - (Zd.max() - 80)) / 80, 0, 1)
    keep = f < 8000
    img = (np.flipud(Zd[keep]) * 255).astype(np.uint8)
    im = Image.fromarray(img).resize((min(2400, max(800, int(DUR * 20))), 400))
    im = Image.merge("RGB", (im, im.point(lambda v: int(v * 0.8)), im.point(lambda v: int(v * 0.4))))
    dd = ImageDraw.Draw(im)
    for c in ct:
        xx = int(c / DUR * im.width); dd.line([xx, 0, xx, 12], fill=(80, 200, 255))
    for w in words[:: max(1, len(words) // 200)]:
        xx = int(w["s"] / DUR * im.width); dd.line([xx, 392, xx, 400], fill=(255, 255, 255))
    im.save(os.path.join(OUT, "sheets", "spectrogram.png"))
    # caption sync to words
    if cap_style and words:
        ws_ = np.array([w["s"] for w in words])
        offs = [e["t"] - ws_[np.abs(ws_ - e["t"]).argmin()] for e in cap["events"]]
        cap_style["start_offset_to_nearest_word_median_s"] = round(float(np.median(offs)), 3)
        cnt = [int(((ws_ >= e["t"] - 0.12) & (ws_ < e["end"] - 0.05)).sum()) for e in cap["events"]]
        cap_style["words_per_caption_median"] = float(np.median(cnt)) if cnt else None
        cap_style["words_per_caption_dist"] = {str(k): cnt.count(k) for k in sorted(set(cnt))}
    sound["word_list_for_timing_only"] = words[:4000]
    # cuts vs words: does a cut land on a word start?
    if words and ct:
        ws_ = np.array([w["s"] for w in words])
        o = [t - ws_[np.abs(ws_ - t).argmin()] for t in ct]
        edit["cut_to_nearest_word_start_median_s"] = round(float(np.median(o)), 3)
        edit["cuts_within_120ms_of_word_start"] = round(float(np.mean(np.abs(o) < 0.12)), 2)
print(f"[sound] {sound.get('lufs_i')} LUFS, music {sound.get('music', {}).get('bed_guess')}")

# ------------------------------------------------------------------ 6. write report
rep = {"source": os.path.abspath(SRC), "format": fmt, "edit": edit, "cuts": cutinfo, "gradual": grads, "shots": shots, "look": look_sum, "palette": palette,
       "captions": cap_style, "caption_events": cap["events"] if cap else [], "caption_bands_all": bands[:5], "sound": sound, "sheets": [os.path.relpath(p, OUT) for p in sheets]}
json.dump(rep, open(os.path.join(OUT, "report.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False, default=lambda o: o.item() if hasattr(o, "item") else str(o))

def tbl(d): return "\n".join(f"| {k} | {v} |" for k, v in d.items())
md = [f"# Reference analysis: {os.path.basename(SRC)}", "", "Numbers measured by analyze_ref.py. Story, script and VO content are ignored; words are only used for timing.", "",
      "## Format", "| | |", "|---|---|", tbl({k: v for k, v in fmt.items() if k not in ("tags",)}), "", "Metadata tags (tool hints):", "", "```", json.dumps(tags, indent=1, ensure_ascii=False)[:3000], "```", "",
      "## Edit", "| | |", "|---|---|", tbl(edit), "",
      "## Look (caption band excluded)", "| metric | median | p10 | p90 |", "|---|---|---|---|"] + [f"| {k} | {v['median']} | {v['p10']} | {v['p90']} |" for k, v in look_sum.items()] + [
      "", "luma/contrast/black/white: 0-255. sat: 0-1. warm: mean(R-B). grain: residual std in flat areas (0.5-1 = clean digital, >2 = visible grain). sharp: Laplacian variance at 360 px. vignette: corner/centre luma (1 = none, <0.8 = strong). ink: share of dark edge pixels (>0.01 = drawn outlines likely).", "",
      "Palette: " + ", ".join(f"{c['hex']} {c['share']:.0%}" for c in palette), "",
      "## Captions", "```", json.dumps(cap_style, indent=1, ensure_ascii=False) if cap_style else "no burned-in captions detected (check the timeline sheets by eye)", "```", "",
      "## Sound", "```", json.dumps({k: v for k, v in sound.items() if k != "word_list_for_timing_only"}, indent=1, ensure_ascii=False), "```", "",
      "## Shots", "| # | t0 | dur | in | move | pan %W/s | zoom % | jitter | luma |", "|---|---|---|---|---|---|---|---|---|"] + [
      f"| {s['i']} | {s['t0']} | {s['dur']} | {s['in']} | {s['move']} | {s['pan_pct_per_s']} | {s['zoom_pct']} | {s['jitter']} | {s['luma']} |" for s in shots] + [
      "", "## Sheets to read (all of them)", ""] + [f"- {os.path.relpath(p, OUT)}" for p in sheets] + ["- sheets/palette.png", "- sheets/spectrogram.png (blue ticks on top = cuts, white ticks at the bottom = word starts; long horizontal lines = music)"]
open(os.path.join(OUT, "report.md"), "w", encoding="utf-8").write("\n".join(str(x) for x in md))
print("done:", os.path.abspath(os.path.join(OUT, "report.md")))
