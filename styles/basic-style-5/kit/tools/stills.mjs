// Contact sheet for checking framing.
// node tools/stills.mjs <out.png> --ratio 9:16 [--mid | --t 1.0,2.5] [--ids a1,b2] [--w 360] [--cols 10]
// Without --t it takes the midpoint of every shot. Add --ids to limit it.
// The packed sheet can look colour-banded in the image viewer. The raw frames in <out>_f/ do not; read those for colour.
import { openPage } from "./serve.mjs";
import { FPS } from "./fps.mjs";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf("--" + k); return i >= 0 ? a[i + 1] : d; };
const out = a[0];
const portrait = opt("ratio", "16:9") === "9:16";
const w = +opt("w", portrait ? 360 : 640), h = portrait ? Math.round((w * 16) / 9) : Math.round((w * 9) / 16);
const cols = +opt("cols", portrait ? 10 : 5);
const { page, browser, srv } = await openPage(w, h);
const meta = await page.evaluate("window.__meta");
let times = [];
if (opt("t")) times = opt("t").split(",").map(Number);
else {
  const ids = opt("ids") ? opt("ids").split(",") : null;
  for (const s of meta.shots) if (!ids || ids.includes(s.id)) times.push((s.t0 + s.t1) / 2);
}
const dir = out.replace(/\.png$/, "") + "_f";
fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
const t0 = Date.now();
let i = 0;
for (const t of times) {
  await page.evaluate((fr) => window.__seek(fr), Math.round(t * FPS));
  await page.screenshot({ path: path.join(dir, `f${String(i++).padStart(3, "0")}.png`) });
}
console.log("rendered", times.length, "in", ((Date.now() - t0) / 1000).toFixed(1), "s; shots", meta.shots.length, "dur", meta.dur.toFixed(2));
console.log(meta.shots.map((s) => `${s.id} ${s.t0.toFixed(2)}-${s.t1.toFixed(2)}`).join(" | "));
await browser.close(); srv.close();
const rows = Math.ceil(times.length / cols);
spawnSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", path.join(dir, "f%03d.png"), "-vf", `tile=${cols}x${rows}:padding=4`, "-frames:v", "1", out], { stdio: "inherit" });
