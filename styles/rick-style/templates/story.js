// The film. Shots start on spoken words; places join with soft dissolves or one continuous flying move.
// do(t, u, l) must be a pure function of time. See examples/smong-sample/story.js for a full film.
import { E, clamp, sstep, lerp } from "./kit.js";
import { timeline, whip, push, diss, popIn, pulse } from "./direct.js";
import { Toon } from "./sketch.js";
import { CAST } from "./cast.js";
import { buildVivid } from "./set_vivid.js";

export async function buildStory(engine, timing) {
  const tl = timeline(timing, { ending: "loop", tail: 0.6 });
  const { W, dur, S, cue, hit, act } = tl;
  const world = buildVivid(engine);
  const hero = new Toon(world.scene, CAST.hero), boss = new Toon(world.scene, CAST.boss);
  act("comic", 0);
  S("a1", 0, dur, world, [[0, [1.5, 0.9, 6], [0, 1.6, 0], 46], [1, [0.6, 1.1, 4.4], [0, 1.6, 0], 42, "io"]], { amb: "seaday", sway: 0.8,
    do(t) {
      hero.pose({ x: -0.9, z: 0, t, expr: "smug", armL: 25, elbowL: 100 });
      boss.pose({ x: 0.9, z: -0.4, t, expr: "angry", steam: true, armR: 30, elbowR: 110 });
    } });
  return tl.finish();
}
