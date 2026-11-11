// The film. Shots follow references/gaya.md: slow push or pull on every shot, hard cuts on spoken words,
// a short dissolve (diss(0.28)) when the place changes. do(t, u, l) must be a pure function of time.
import { E, clamp, sstep, lerp, K } from "./kit.js";
import { timeline, popIn, pulse, diss } from "./direct.js";
import { Villager } from "./people.js";
import { buildVillage } from "./village.js";
import { sack, bucket, sign } from "./props5.js";
import { CAST } from "./cast.js";

export async function buildStory(engine, timing) {
  const tl = timeline(timing, { ending: "loop", tail: 0.6, hi: [] }); // hi: words drawn in yellow
  const { W, dur, S, cue, act } = tl;
  const v = buildVillage(engine, { ponds: [[0, -1, 5, 3.4, { water: "blue" }]] });
  const juragan = new Villager(v.scene, CAST.juragan), petani = new Villager(v.scene, CAST.petani);
  bucket(v.scene, -2.2, -3.1, 0x2a6fd6); bucket(v.scene, 2.3, -3.1, 0xd43a2a);
  act("none", 0); // the reference has no music: voice, small SFX, quiet outdoor air
  S("a1", 0, dur, v, [[0, [0.4, 1.2, 5.2], [0, 1.1, 0], 40], [1, [0.3, 1.15, 4.4], [0, 1.15, 0], 40]], { amb: "desa", sway: 0.25,
    do(t) {
      juragan.pose({ x: 0.9, z: 0.6, t, ry: -0.4, expr: { eyes: "dot", mouth: "lips" }, talk: 1 });
      petani.pose({ x: -0.9, z: 0.4, t, ry: 0.4, expr: { eyes: "dot", mouth: "smile" } });
    } });
  return tl.finish();
}
