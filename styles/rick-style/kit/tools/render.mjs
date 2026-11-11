// Step the page frame by frame, capture, encode to segments. Finished segments are skipped, so a crash loses little.
// node tools/render.mjs --ratio 9:16 [startFrame endFrame]
import { openPage } from "./serve.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const ri = args.indexOf("--ratio");
const ratio = ri >= 0 ? args[ri + 1] : "16:9";
const pos = args.filter((x, i) => !x.startsWith("--") && i !== ri + 1);
const PORTRAIT = ratio === "9:16";
const W = PORTRAIT ? 1080 : 1920, H = PORTRAIT ? 1920 : 1080, SEG = 480;
const SEGDIR = path.resolve(`out/seg_${PORTRAIT ? "9x16" : "16x9"}`);
fs.mkdirSync(SEGDIR, { recursive: true });
const { page, browser, srv } = await openPage(W, H);
const meta = await page.evaluate("window.__meta");
const total = meta.frames;
const start = +(pos[0] || 0), end = +(pos[1] || total);
console.log("frames", total, "fps", meta.fps, "range", start, end, ratio);
const client = await page.createCDPSession();

function encoder(file) {
  return spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", "60", "-c:v", "png", "-i", "-",
    "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p",
    "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-profile:v", "high", "-g", "120",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv", "-threads", "6", file], { stdio: ["pipe", "inherit", "inherit"] });
}
const t0 = Date.now(); let done = 0, subs = 0;
for (let s = Math.floor(start / SEG) * SEG; s < end; s += SEG) {
  const file = path.join(SEGDIR, `seg_${String(s).padStart(5, "0")}.mkv`);
  const stop = Math.min(s + SEG, total);
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) { console.log("skip", s); continue; }
  const tmp = file + ".tmp.mkv";
  const enc = encoder(tmp);
  for (let f = s; f < stop; f++) {
    subs += await page.evaluate((fr) => window.__seek(fr), f);
    const { data } = await client.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, captureBeyondViewport: false });
    const buf = Buffer.from(data, "base64");
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
    done++;
  }
  enc.stdin.end();
  await new Promise((r, j) => enc.on("close", (c) => (c === 0 ? r() : j(new Error("ffmpeg " + c)))));
  fs.renameSync(tmp, file);
  const el = (Date.now() - t0) / 1000;
  console.log(`seg ${s} ok | ${done} frames, ${(el / done).toFixed(2)} s/frame, avg sub ${(subs / done).toFixed(1)}`);
}
await browser.close(); srv.close();
console.log("all segments done", ((Date.now() - t0) / 60000).toFixed(1), "min");
