"""Reference vs result, side by side, with the numbers that still differ.

usage:
  python compare.py --ref <reference.mp4> --ref-report <analysis>/report.json --out <result.mp4> --dest <dir> [--pairs pairs.json] [--n 8]
  python compare.py --ref <reference.mp4> --ref-report <analysis>/report.json --out-frames <dir of PNG/JPG stills> --dest <dir> [--pairs pairs.json]

pairs.json (optional, recommended: pair shots of the same KIND, e.g. close-up with close-up):
  [{"ref_t": 3.2, "out_t": 4.1, "label": "close-up"}, {"ref_t": 12.0, "out_frame": "f004.png", "label": "insert"}]
Without pairs, shots are paired by their position in the film.

Writes <dest>/side_by_side_NN.png (REFERENSI left, HASIL right), <dest>/metrics.md (table + flagged differences),
<dest>/metrics.json. With --out, the result video is analysed with analyze_ref.py --quick first.
"""
import json, os, subprocess, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

A = sys.argv[1:]
opt = lambda k, d=None: A[A.index("--" + k) + 1] if "--" + k in A else d
REF, OUTV, OUTF, DEST = opt("ref"), opt("out"), opt("out-frames"), opt("dest", "compare")
if not REF or not (OUTV or OUTF):
    print(__doc__); sys.exit(2)
os.makedirs(DEST, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))

def font(size):
    for p in ("C:/Windows/Fonts/arialbd.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def analyse(video, outdir):
    rp = os.path.join(outdir, "report.json")
    if not os.path.exists(rp):
        subprocess.run([sys.executable, "-I", os.path.join(HERE, "analyze_ref.py"), video, outdir, "--quick"], check=True)
    return json.load(open(rp, encoding="utf-8"))

ref_rep = json.load(open(opt("ref-report"), encoding="utf-8")) if opt("ref-report") else analyse(REF, os.path.join(DEST, "_ref"))
out_rep = analyse(OUTV, os.path.join(DEST, "_out")) if OUTV else None

def grab(video, t, path):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t):.3f}", "-i", video, "-frames:v", "1", "-q:v", "2", path])
    return Image.open(path).convert("RGB")

def stats(im):
    a = np.asarray(im.resize((360, int(360 * im.height / im.width))), np.float32)
    Y = a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return {"luma": float(Y.mean()), "contrast": float(Y.std()), "sat": float(sat.mean()), "warm": float((a[..., 0] - a[..., 2]).mean()),
            "black": float(np.percentile(Y, 2)), "white": float(np.percentile(Y, 98))}

# ------------------------------------------------------------ pairs
pairs = json.load(open(opt("pairs"), encoding="utf-8")) if opt("pairs") else None
ref_shots = ref_rep["shots"]
tmp = os.path.join(DEST, "_frames"); os.makedirs(tmp, exist_ok=True)
items = []
if OUTF:
    out_files = sorted(f for f in os.listdir(OUTF) if f.lower().endswith((".png", ".jpg")))
if pairs is None:
    n = int(opt("n", 8))
    if OUTV:
        osh = out_rep["shots"]
        k = min(n, len(osh), len(ref_shots))
        pairs = [{"ref_t": (ref_shots[int(i * len(ref_shots) / k)]["t0"] + ref_shots[int(i * len(ref_shots) / k)]["t1"]) / 2,
                  "out_t": (osh[int(i * len(osh) / k)]["t0"] + osh[int(i * len(osh) / k)]["t1"]) / 2, "label": f"posisi {i + 1}/{k}"} for i in range(k)]
    else:
        k = min(n, len(out_files), len(ref_shots))
        pairs = [{"ref_t": (ref_shots[int(i * len(ref_shots) / k)]["t0"] + ref_shots[int(i * len(ref_shots) / k)]["t1"]) / 2,
                  "out_frame": out_files[int(i * len(out_files) / k)], "label": f"posisi {i + 1}/{k}"} for i in range(k)]
for j, p in enumerate(pairs):
    r = grab(REF, p["ref_t"], os.path.join(tmp, f"r{j:02d}.jpg"))
    if "out_frame" in p: o = Image.open(os.path.join(OUTF, p["out_frame"])).convert("RGB"); olab = p["out_frame"]
    else: o = grab(OUTV, p["out_t"], os.path.join(tmp, f"o{j:02d}.jpg")); olab = f"{p['out_t']:.2f}s"
    items.append((r, o, p.get("label", ""), f"{p['ref_t']:.2f}s", olab))

# ------------------------------------------------------------ side-by-side sheets
portrait = ref_rep["format"]["height"] > ref_rep["format"]["width"]
ph = 720 if portrait else 405
per = 3 if portrait else 3
sheets = []
for s in range(0, len(items), per):
    chunk = items[s:s + per]
    cells = []
    for r, o, lab, rl, ol in chunk:
        rw = int(ph * r.width / r.height); ow = int(ph * o.width / o.height)
        cell = Image.new("RGB", (rw + ow + 30, ph + 70), (18, 18, 18))
        cell.paste(r.resize((rw, ph), Image.LANCZOS), (10, 60)); cell.paste(o.resize((ow, ph), Image.LANCZOS), (rw + 20, 60))
        d = ImageDraw.Draw(cell)
        d.text((10, 6), f"REFERENSI  {rl}", fill=(120, 200, 255), font=font(22))
        d.text((rw + 20, 6), f"HASIL  {ol}", fill=(255, 210, 90), font=font(22))
        d.text((10, 34), lab, fill=(220, 220, 220), font=font(18))
        cells.append(cell)
    if portrait:
        S = Image.new("RGB", (sum(c.width for c in cells) + 10 * (len(cells) + 1), max(c.height for c in cells) + 20), (0, 0, 0)); x = 10
        for c in cells: S.paste(c, (x, 10)); x += c.width + 10
    else:
        S = Image.new("RGB", (max(c.width for c in cells) + 20, sum(c.height for c in cells) + 10 * (len(cells) + 1)), (0, 0, 0)); y = 10
        for c in cells: S.paste(c, (10, y)); y += c.height + 10
    path = os.path.join(DEST, f"side_by_side_{s // per:02d}.png"); S.save(path); sheets.append(path)

# ------------------------------------------------------------ numbers
rows, flags = [], []
def row(name, a, b, rel=0.15, absd=None):
    if a is None or b is None: rows.append((name, a, b, "")); return
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        d = abs(a - b); bad = d > absd if absd is not None else d > rel * max(abs(a), 1e-6)
        rows.append((name, round(a, 3), round(b, 3), "BEDA" if bad else "ok"))
        if bad: flags.append(f"{name}: referensi {round(a, 3)}, hasil {round(b, 3)}")
    elif isinstance(a, str) and isinstance(b, str) and a.startswith("#") and b.startswith("#") and len(a) == len(b) == 7:
        ca, cb = [int(a[i:i + 2], 16) for i in (1, 3, 5)], [int(b[i:i + 2], 16) for i in (1, 3, 5)]
        bad = sum((x - y) ** 2 for x, y in zip(ca, cb)) ** 0.5 > 30
        rows.append((name, a, b, "BEDA" if bad else "ok"))
        if bad: flags.append(f"{name}: referensi {a}, hasil {b}")
    else:
        bad = a != b
        rows.append((name, a, b, "BEDA" if bad else "ok"))
        if bad: flags.append(f"{name}: referensi {a}, hasil {b}")

ps = [(stats(r), stats(o)) for r, o, *_ in items]
for k, tol in (("luma", 12), ("contrast", 8), ("sat", 0.05), ("warm", 10), ("black", 10), ("white", 15)):
    row(f"frame {k} (rata-rata pasangan)", float(np.mean([a[k] for a, _ in ps])), float(np.mean([b[k] for _, b in ps])), absd=tol)
if out_rep:
    rf, of = ref_rep["format"], out_rep["format"]
    row("rasio", rf["ratio"], of["ratio"])
    row("fps", rf["fps_nearest_standard"], of["fps_nearest_standard"], absd=0.5)
    re_, oe = ref_rep["edit"], out_rep["edit"]
    row("panjang shot rata-rata (s)", re_["shot_len_mean"], oe["shot_len_mean"], rel=0.2)
    row("panjang shot median (s)", re_["shot_len_median"], oe["shot_len_median"], rel=0.2)
    row("shot per menit", re_["cuts_per_min"], oe["cuts_per_min"], rel=0.2)
    tot = lambda d: sum(d.values()) or 1
    for k in sorted(set(re_["transitions"]) | set(oe["transitions"])):
        row(f"sambungan {k} (porsi)", re_["transitions"].get(k, 0) / tot(re_["transitions"]), oe["transitions"].get(k, 0) / tot(oe["transitions"]), absd=0.15)
    for k in sorted(set(re_["moves"]) | set(oe["moves"])):
        row(f"gerak kamera {k} (porsi)", re_["moves"].get(k, 0) / tot(re_["moves"]), oe["moves"].get(k, 0) / tot(oe["moves"]), absd=0.2)
    for k, tol in (("luma", 12), ("contrast", 8), ("sat", 0.05), ("warm", 10), ("grain", 0.6), ("vignette", 0.1), ("ink", 0.01), ("sharp", None)):
        a, b = ref_rep["look"].get(k, {}).get("median"), out_rep["look"].get(k, {}).get("median")
        if tol is None: row(f"look {k}", a, b, rel=0.5)
        else: row(f"look {k}", a, b, absd=tol)
    rc, oc = ref_rep.get("captions") or {}, out_rep.get("captions") or {}
    row("caption ada", bool(rc), bool(oc))
    if rc and oc:
        row("caption pusat Y (%)", rc["center_y_pct"], oc["center_y_pct"], absd=2.5)
        row("caption tinggi huruf (% H)", rc["glyph_block_height_pct_of_H"], oc["glyph_block_height_pct_of_H"], rel=0.15)
        row("caption lebar median (% W)", rc["width_pct_of_W_median"], oc["width_pct_of_W_median"], rel=0.2)
        row("caption warna utama", rc["fill_colours"][0]["hex"], oc["fill_colours"][0]["hex"])
        row("caption warna keluarga", rc.get("caption_colour_families"), oc.get("caption_colour_families"))
        row("caption durasi median (s)", rc["duration_median_s"], oc["duration_median_s"], rel=0.25)
    rs, os_ = ref_rep["sound"], out_rep["sound"]
    row("loudness LUFS", rs.get("lufs_i"), os_.get("lufs_i"), absd=1.0)
    row("true peak", rs.get("true_peak"), os_.get("true_peak"), absd=1.5)
    row("musik", (rs.get("music") or {}).get("bed_guess"), (os_.get("music") or {}).get("bed_guess"))
    row("onset kuat per menit", rs.get("strong_onsets_per_min"), os_.get("strong_onsets_per_min"), rel=0.35)
    row("cut dengan bunyi (porsi)", rs.get("cuts_with_hit_80ms"), os_.get("cuts_with_hit_80ms"), absd=0.2)
md = ["# Perbandingan referensi vs hasil", "", "Lembar berdampingan: " + ", ".join(os.path.basename(s) for s in sheets), "",
      "| ukuran | referensi | hasil | |", "|---|---|---|---|"] + [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in rows] + [
      "", "## Yang terukur masih beda", ""] + ([f"- {f}" for f in flags] or ["- (tidak ada selisih besar pada angka; tetap periksa lembar berdampingan dengan mata)"]) + [
      "", "Angka tidak melihat bentuk karakter, gaya gambar, atau rasa gerak. Tambahkan pengamatan mata di bawah ini sebelum melapor ke user.", ""]
open(os.path.join(DEST, "metrics.md"), "w", encoding="utf-8").write("\n".join(str(x) for x in md))
json.dump({"rows": rows, "flags": flags, "sheets": sheets}, open(os.path.join(DEST, "metrics.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False, default=str)
print("\n".join(sheets)); print(os.path.join(DEST, "metrics.md")); print("flags:", len(flags))
for f in flags: print(" -", f)
