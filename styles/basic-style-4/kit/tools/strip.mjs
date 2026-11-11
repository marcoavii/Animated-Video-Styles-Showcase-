// usage: node tools/strip.mjs <out.png> <tStart> <n> <stepFrames> [w]  -> consecutive frames to inspect a transition
import { openPage } from "./serve.mjs";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [out, t0, n, step, w0] = process.argv.slice(2);
const w = +(w0 || 480), h = Math.round((w * 9) / 16);
const { page, browser, srv } = await openPage(w, h);
const dir = out.replace(/\.png$/, "") + "_f";
fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
const f0 = Math.round(+t0 * 60); let maxN = 0;
for (let i = 0; i < +n; i++) {
  const N = await page.evaluate((fr) => window.__seek(fr), f0 + i * +step);
  maxN = Math.max(maxN, N);
  await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, "0")}.png`) });
}
console.log("max subframes", maxN);
await browser.close(); srv.close();
spawnSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", path.join(dir, "f%03d.png"), "-vf", `tile=4x${Math.ceil(+n / 4)}:padding=3`, "-frames:v", "1", out], { stdio: "inherit" });
