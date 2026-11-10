import glob, os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
w = int(sys.argv[4]) if len(sys.argv) > 4 else 640
files = sorted(glob.glob(os.path.join(src, "*.jpg")))
first = Image.open(files[0]); h = w * first.height // first.width
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols - 1) * 4, rows * h + (rows - 1) * 4), (40, 40, 40))
for i, f in enumerate(files):
    im = Image.open(f).resize((w, h), Image.LANCZOS)
    sheet.paste(im, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
sheet.save(out, quality=88)
print(len(files), sheet.size)
