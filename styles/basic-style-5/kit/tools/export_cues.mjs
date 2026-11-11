// Dump the sound cue sheet the story declares, so sound and picture stay in sync.
import { openPage } from "./serve.mjs";
import fs from "node:fs";
const { page, browser, srv } = await openPage(320, 180);
const meta = await page.evaluate("window.__meta");
fs.mkdirSync("audio", { recursive: true });
fs.writeFileSync("audio/cues.json", JSON.stringify(meta, null, 1));
const names = {}; meta.cues.forEach((c) => (names[c.name] = (names[c.name] || 0) + 1));
console.log("dur", meta.dur.toFixed(2), "frames", meta.frames, "shots", meta.shots.length, "cues", meta.cues.length, "kinds", Object.keys(names).length, "acts", meta.acts.length, "ending", meta.ending);
await browser.close(); srv.close();
