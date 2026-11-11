// Frame rate of this project: project.json "fps" (set by new-video.sh from the style), default 60.
import fs from "node:fs";
let p = {};
try { p = JSON.parse(fs.readFileSync("project.json", "utf8")); } catch {}
export const FPS = +(p.fps || 60);
export const TICKS = 6000 / FPS; // 6000 is divisible by 24, 25, 30, 50 and 60
