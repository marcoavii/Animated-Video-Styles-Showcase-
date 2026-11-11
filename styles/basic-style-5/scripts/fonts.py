"""Find and fetch the caption font of a reference.

  python fonts.py get "Montserrat" [--dest DIR]
      Downloads the family from the Google Fonts repository (OFL/Apache/UFL, free to use) into DIR
      (default: the cache ~/.cache/style-cloner/fonts). Prints the file paths.

  python fonts.py match <caption_crop.png> --text "EXACT TEXT" [--fonts "A,B,C"] [--top 8]
      Renders the same text in every candidate font and weight and ranks them by shape overlap with the
      caption fill in the crop. Type the text exactly as shown (same upper/lower case). Run it on 3-5
      different crops (long words work best) and trust the font that wins most often.
      Writes <crop>_fontmatch.png: the crop on top, the best candidates below, for a visual check.

  python fonts.py size <crop1.png> <crop2.png> ... --texts "word1|word2|..." --font "Family" --weight 800 --frame-h <reference height px>
      Measures the caption font-size as a share of the frame height (same word rendered at a known size, widths
      compared). Pass the median to new_style.py --cap-size. The glyph-block estimate in report.json runs ~1.3x too big.

Fonts that are not on Google Fonts (CapCut/TikTok presets such as "The Bold Font", Komika, Proxima) cannot be
downloaded here: the closest free match wins, and the skill notes the difference.
"""
import io, json, os, sys, urllib.request, urllib.parse
import numpy as np
from PIL import Image, ImageDraw, ImageFont

CACHE = os.path.join(os.path.expanduser("~"), ".cache", "style-cloner", "fonts")
DEFAULT = ["Montserrat", "Poppins", "Inter", "Roboto", "Open Sans", "Lato", "Nunito", "Rubik", "Plus Jakarta Sans", "Outfit",
           "Lexend", "Kanit", "Barlow", "League Spartan", "Anton", "Bebas Neue", "Oswald", "Bangers", "Luckiest Guy", "Lilita One",
           "Fredoka", "Titan One", "Baloo 2", "Archivo Black", "Figtree", "Manrope", "Raleway", "TikTok Sans", "Bowlby One", "Chewy"]
UA = {"User-Agent": "style-cloner-font-fetch"}

def http(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def get(family, dest=CACHE):
    os.makedirs(dest, exist_ok=True)
    key = "".join(ch for ch in family.lower() if ch.isalnum())
    have = [os.path.join(dest, f) for f in os.listdir(dest) if f.lower().startswith(key) or f.lower().replace("-", "").startswith(key)]
    have = [h for h in have if h.lower().endswith((".ttf", ".otf"))]
    if have: return sorted(have)
    for lic in ("ofl", "apache", "ufl"):
        try:
            lst = json.loads(http(f"https://api.github.com/repos/google/fonts/contents/{lic}/{key}"))
        except Exception:
            continue
        out = []
        for f in lst:
            n = f["name"]
            if not n.lower().endswith(".ttf") or "italic" in n.lower(): continue
            p = os.path.join(dest, n.replace("[", "_").replace("]", "_"))
            if not os.path.exists(p):
                open(p, "wb").write(http(f["download_url"]))
            out.append(p)
        lic_file = next((f for f in lst if f["name"] in ("OFL.txt", "LICENSE.txt", "LICENSE")), None)
        if lic_file and not os.path.exists(os.path.join(dest, key + "_LICENSE.txt")):
            try: open(os.path.join(dest, key + "_LICENSE.txt"), "wb").write(http(lic_file["download_url"]))
            except Exception: pass
        if out: return sorted(out)
    return []

def variants(path):
    """(label, ImageFont factory) for each weight the file offers."""
    out = []
    try:
        f = ImageFont.truetype(path, 40)
        axes = f.get_variation_axes()
    except Exception:
        axes = None
    name = os.path.basename(path)
    if axes:
        ax = next((a for a in axes if a.get("name") in (b"Weight", "Weight") or a.get("tag") == "wght"), axes[0])
        lo, hi = ax["minimum"], ax["maximum"]
        for w in (400, 500, 600, 700, 800, 900):
            if lo <= w <= hi:
                def mk(size, w=w):
                    ft = ImageFont.truetype(path, size); vals = []
                    for a in ft.get_variation_axes():
                        vals.append(w if (a.get("name") in (b"Weight", "Weight")) else a.get("default", a["minimum"]))
                    ft.set_variation_by_axes(vals); return ft
                out.append((f"{name} wght {w}", mk))
    else:
        out.append((name, lambda size: ImageFont.truetype(path, size)))
    return out

def fill_mask(img):
    """Bright caption fill (white/yellow/any light colour) inside a dark outline, tight-cropped."""
    a = np.asarray(img.convert("RGB"), np.float32)
    lum = a.mean(2)
    hist = np.histogram(lum, 64, (0, 256))[0].astype(float)
    # Otsu threshold
    p = hist / hist.sum(); bins = (np.arange(64) + 0.5) * 4
    best, thr = -1, 128
    for k in range(1, 63):
        w0, w1 = p[:k].sum(), p[k:].sum()
        if w0 == 0 or w1 == 0: continue
        m0, m1 = (p[:k] * bins[:k]).sum() / w0, (p[k:] * bins[k:]).sum() / w1
        v = w0 * w1 * (m0 - m1) ** 2
        if v > best: best, thr = v, bins[k]
    mn, mx = a.min(2), a.max(2)
    white = (mn > 200) & (mx - mn < 45)
    warm = (a[..., 0] > 190) & (a[..., 1] > 140) & (a[..., 2] < 140)
    m = white if white.sum() >= warm.sum() else warm
    dark = np.zeros_like(m)
    from scipy import ndimage
    dark = ndimage.maximum_filter(lum < 80, size=max(3, int(a.shape[0] * 0.08)))
    lab, n = ndimage.label(m)
    if n:
        keep = np.zeros(n + 1, bool)
        for j, sl in enumerate(ndimage.find_objects(lab), 1):
            keep[j] = (dark[sl] & (lab[sl] == j)).any()
        m = keep[lab]
    if m.sum() < 30: m = lum > max(thr, 150)
    rr, cc = np.where(m)
    if len(rr) == 0: return m
    return m[rr.min():rr.max() + 1, cc.min():cc.max() + 1]

def render(text, factory, h_target):
    size = 120
    ft = factory(size)
    l, t, r, b = ft.getbbox(text)
    im = Image.new("L", (r - l + 20, b - t + 20), 0)
    ImageDraw.Draw(im).text((10 - l, 10 - t), text, font=ft, fill=255)
    m = np.asarray(im) > 127
    rr, cc = np.where(m)
    return m[rr.min():rr.max() + 1, cc.min():cc.max() + 1] if len(rr) else m

def score(ref, cand):
    H = 64
    W = max(8, int(round(ref.shape[1] * H / ref.shape[0])))
    rs = lambda m, w: np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((w, H), Image.BILINEAR)) > 127
    a = rs(ref, W); b = rs(cand, W)
    iou = (a & b).sum() / max(1, (a | b).sum())
    ar_r, ar_c = ref.shape[1] / ref.shape[0], cand.shape[1] / cand.shape[0]
    ink_r, ink_c = ref.mean(), cand.mean()  # stroke weight
    return iou * np.exp(-abs(np.log(ar_c / ar_r)) * 3) * np.exp(-abs(np.log((ink_c + 1e-3) / (ink_r + 1e-3))) * 1.5), iou, ar_c / ar_r

def match(crop, text, fonts, top):
    ref = fill_mask(Image.open(crop))
    rows = []
    for fam in fonts:
        try: files = get(fam)
        except Exception as e:
            print("skip", fam, e); continue
        if not files: print("not on Google Fonts:", fam); continue
        for f in files:
            for lab, fac in variants(f):
                try:
                    c = render(text, fac, ref.shape[0])
                    s, iou, ar = score(ref, c)
                    rows.append((s, iou, ar, fam, lab, f, fac))
                except Exception as e:
                    pass
    rows.sort(key=lambda r: -r[0])
    for s, iou, ar, fam, lab, f, _ in rows[:top]:
        print(f"{s:.3f}  iou {iou:.2f}  width ratio {ar:.2f}  {fam:18s} {lab}")
    # visual check sheet
    src = Image.open(crop).convert("RGB")
    tw = 600
    src = src.resize((tw, max(1, int(src.height * tw / src.width))))
    tiles = [src]
    for s, iou, ar, fam, lab, f, fac in rows[:min(top, 6)]:
        c = render(text, fac, 100)
        im = Image.fromarray((c * 255).astype(np.uint8)).convert("RGB")
        im = im.resize((tw, max(1, int(im.height * tw / im.width))))
        canvas = Image.new("RGB", (tw, im.height + 26), (30, 30, 30)); canvas.paste(im, (0, 26))
        ImageDraw.Draw(canvas).text((4, 4), f"{s:.3f} {fam} {lab}", fill=(255, 220, 90))
        tiles.append(canvas)
    S = Image.new("RGB", (tw, sum(t.height + 6 for t in tiles)), (0, 0, 0)); y = 0
    for t in tiles: S.paste(t, (0, y)); y += t.height + 6
    out = os.path.splitext(crop)[0] + "_fontmatch.png"; S.save(out); print("sheet:", out)
    return rows

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    opt = lambda k, d=None: a[a.index("--" + k) + 1] if "--" + k in a else d
    if a[0] == "get":
        for p in get(a[1], opt("dest", CACHE)): print(p)
    elif a[0] == "match":
        fonts = [f.strip() for f in opt("fonts", ",".join(DEFAULT)).split(",") if f.strip()]
        match(a[1], opt("text"), fonts, int(opt("top", 8)))
    elif a[0] == "size":
        # font-size as a share of the frame height: render the same text at a known size, compare widths
        crops = [c for c in a[1:] if c.lower().endswith(".png")]
        texts = [t.strip() for t in opt("texts", opt("text", "")).split("|")]
        fam, w = opt("font"), int(opt("weight", "800"))
        frame_h = float(opt("frame-h"))
        files = get(fam)
        fac = None
        for f in files:
            for lab, fc in variants(f):
                if f"wght {w}" in lab or (len(variants(f)) == 1 and (str(w) in lab or "Bold" in lab or "Black" in lab)): fac = fac or fc
        if fac is None: fac = variants(files[0])[0][1]
        ratios = []
        for c, t in zip(crops, texts):
            ref = fill_mask(Image.open(c))
            r = render(t, fac, 0)  # rendered at 120 px
            ratios.append(ref.shape[1] / r.shape[1] * 120 / frame_h)
            print(f"{os.path.basename(c)} '{t}': font-size {ratios[-1]:.4f} of frame height")
        print(f"MEDIAN font-size: {np.median(ratios):.4f} x frame height  (pass to new_style.py --cap-size)")
    else:
        print(__doc__)
