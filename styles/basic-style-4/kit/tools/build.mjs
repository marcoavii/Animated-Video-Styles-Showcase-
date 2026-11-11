// One command, source to verified MP4:
//   node tools/build.mjs --ratio 9:16 --name Judul_Video [--keep] [--no-audio] [--no-copy]
// 1. export cues  2. sound mix  3. render segments (restarts the browser after a crash)
// 4. join without re-encoding  5. mux  6. check decoded frames, frame timing and loudness  7. only then copy to the Desktop
//
// Segments older than the scene code are wiped automatically, because a stale segment means a video that
// silently mixes old and new picture. After a small edit, delete just the affected out/seg_*/seg_NNNNN.mkv
// (480 frames = 8 s each) and pass --keep to avoid a full re-render.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf("--" + k); return i >= 0 ? a[i + 1] : d; };
const has = (k) => a.includes("--" + k);
const ratio = opt("ratio");
if (ratio !== "9:16" && ratio !== "16:9") { console.error("--ratio 9:16 or --ratio 16:9"); process.exit(2); }
const tag = ratio === "9:16" ? "9x16" : "16x9";
const name = opt("name", path.basename(process.cwd()));
const SEG = `out/seg_${tag}`;
const run = (cmd, args, o = {}) => { const r = spawnSync(cmd, args, { stdio: "inherit", shell: false, ...o }); return r.status ?? 1; };
const cap = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8" });
const die = (m) => { console.error("FAILED:", m); process.exit(1); };

function stamp() {
  const h = crypto.createHash("sha1");
  const walk = (d) => { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else h.update(p).update(fs.readFileSync(p)); } };
  walk("scenes");
  h.update(fs.readFileSync("vo/timing.json"));
  return h.digest("hex");
}

if (run("node", ["tools/export_cues.mjs"])) die("export cues");
const meta = JSON.parse(fs.readFileSync("audio/cues.json", "utf8"));
if (!has("no-audio")) {
  if (run("python", ["audio/design.py", "audio/cues.json", "vo/timing.json", "vo/vo_raw.wav", "audio/out"])) die("sound mix");
  run("python", ["tools/audio_qa.py", "audio/out", "audio/cues.json"]);
}
if (!fs.existsSync("audio/out/mix.wav")) die("audio/out/mix.wav missing");

fs.mkdirSync(SEG, { recursive: true });
const sp = `${SEG}/.stamp`, now = stamp();
if (!has("keep") && fs.existsSync(sp) && fs.readFileSync(sp, "utf8") !== now) {
  console.log("scene code changed: wiping old segments");
  for (const f of fs.readdirSync(SEG)) fs.unlinkSync(path.join(SEG, f));
}
fs.writeFileSync(sp, now);

const SIZE = 480;
const expected = Array.from({ length: Math.ceil(meta.frames / SIZE) }, (_, i) => `${SEG}/seg_${String(i * SIZE).padStart(5, "0")}.mkv`);
const clean = () => { for (const f of fs.readdirSync(SEG)) if (f.endsWith(".tmp.mkv")) fs.unlinkSync(path.join(SEG, f)); };
const missing = () => expected.filter((f) => !fs.existsSync(f));
clean();
for (let attempt = 1; attempt <= 8 && missing().length; attempt++) {
  console.log(`render attempt ${attempt}, ${missing().length} segments to go`);
  run("node", ["tools/render.mjs", "--ratio", ratio]);
  clean();
}
if (missing().length) die(`segments missing after 8 attempts: ${missing().join(" ")}`);

// Join without re-encoding. Each segment gets an explicit duration, or the concat demuxer drops frames at the
// seams. Do not join through a raw .h264 stream: it loses the display timestamps of the B-frames, which hides the
// first frames and leaves players with scrambled timing. Segments carry millisecond timestamps, so the join goes
// to a 1/6000 timescale first and a second pass rounds every timestamp to an exact frame (100 ticks), which keeps
// the file constant frame rate.
const list = `${SEG}/list.txt`;
fs.writeFileSync(list, expected.map((s, i) => {
  const count = i < expected.length - 1 ? SIZE : meta.frames - SIZE * i;
  return `file '${path.basename(s)}'\nduration ${(count / 60).toFixed(6)}\n`;
}).join(""));
const out = `out/${name}_${tag}_60fps.mp4`;
const joined = `${SEG}/joined.mp4`;
if (run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c:v", "copy", "-video_track_timescale", "6000", joined])) die("join");
if (run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", joined, "-i", "audio/out/mix.wav", "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-bsf:v", "setts=pts=round(PTS/100)*100:dts=round(DTS/100)*100", "-video_track_timescale", "6000", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-movflags", "+faststart", out])) die("mux");
fs.unlinkSync(list);
fs.unlinkSync(joined);

// Count decoded frames, not packets: a packet that the player never shows would pass a packet count.
const probe = cap("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "csv=p=0", out]).stdout.trim();
console.log("video:", probe);
const n = +probe.split(",").pop();
if (n !== meta.frames) die(`decoded frame count ${n}, expected ${meta.frames}`);
const shown = cap("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pts", "-of", "csv=p=0", out]).stdout.trim().split(/\s+/).map((v) => parseInt(v, 10));
const unordered = shown.slice(1).filter((v, i) => v !== shown[i] + 100).length;
if (shown[0] !== 0 || unordered) die(`frame timing is off: first pts ${shown[0]}, ${unordered} steps are not exactly one frame`);
const lufs = cap("ffmpeg", ["-hide_banner", "-i", out, "-map", "0:a", "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]).stderr;
console.log(lufs.split("\n").filter((l) => /I:|LRA:|Peak:/.test(l)).join("\n"));
const peak = parseFloat((lufs.match(/Peak:\s+(-?[\d.]+)/g) || []).pop()?.replace("Peak:", "") ?? "0");
if (peak > -1) console.warn(`WARNING: true peak in the MP4 is ${peak} dB, above the -1 dB target`);
run("python", ["tools/final_qa.py", out, "audio/cues.json"]);
const cols = ratio === "9:16" ? 15 : 10, sw = ratio === "9:16" ? 180 : 320;
fs.mkdirSync("out/qc", { recursive: true });
run("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", out, "-vf", `fps=1,scale=${sw}:-1,tile=${cols}x${Math.ceil(meta.dur / cols)}:padding=3`, "-frames:v", "1", `out/qc/final_${tag}.png`]);

if (!has("no-copy")) {
  const home = process.env.USERPROFILE || process.env.HOME;
  const desk = [path.join(home, "OneDrive", "Desktop"), path.join(home, "Desktop")].find((d) => fs.existsSync(d));
  if (desk) { const dst = path.join(desk, path.basename(out)); fs.copyFileSync(out, dst); console.log("copied to", dst); }
}
console.log("done:", path.resolve(out));
