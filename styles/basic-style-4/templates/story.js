// The film. Every shot starts on a spoken word (hard cut, the Basic style 4 default).
// do(t, u, l) must be a pure function of time. See examples/smong-sample/story.js for a full film.
import { E, clamp, sstep, lerp } from "./kit.js";
import { timeline, popIn, pulse } from "./direct.js";
import { Puppet, Cutout } from "./toon.js";
import { CAST } from "./cast.js";
import { buildRoom4 } from "./set_room4.js";

export async function buildStory(engine, timing) {
  const tl = timeline(timing, { ending: "loop", tail: 0.6, hi: [] }); // hi: words shown in yellow
  const { W, dur, S, cue, hit, act } = tl;
  const room = buildRoom4(engine);
  const hero = new Puppet(room.scene, CAST.hero), other = new Puppet(room.scene, CAST.other);
  act("comic", 0);
  S("a1", 0, dur, room, [[0, [0, 1.45, 5.0], [0, 1.2, 0], 32], [1, [0, 1.45, 4.7], [0, 1.2, 0], 31]], { amb: "office", sway: 0.2,
    do(t) {
      hero.pose({ x: -0.8, z: 0, t, expr: "smug", armL: 30, elbowL: 110, armR: 30, elbowR: 110 });
      other.pose({ x: 0.8, z: -0.3, t, expr: "neutral" });
    } });
  return tl.finish();
}
