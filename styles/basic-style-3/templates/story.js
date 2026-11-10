// The film. Every shot starts on a spoken word, so picture and voice cannot drift.
// A shot's do(t, u, l) must be a pure function of time: t absolute seconds, u 0..1 through the shot, l seconds into it.
// See examples/penjaga-mercusuar/story.js for a full film.
import { E, clamp, sstep, lerp } from "./kit.js";
import { Actor, ARM } from "./actor.js";
import { timeline, whip, push, diss, popIn, reach, P } from "./direct.js";
import { CAST } from "./cast.js";
import { buildRoom } from "./set_room.js";

export async function buildStory(engine, timing) {
  const tl = timeline(timing, { ending: "loop" }); // "loop" lands on the opening frame, "fade" ends on black
  const { W, WE, dur, S, cue, hit, act } = tl;

  const room = buildRoom(engine);
  const hero = new Actor(room.scene, CAST.hero);

  act("comic", 0);

  const openCam = [[0, [-2.6, 2.3, 1.7], [-0.4, 2.05, -0.7], 40], [1, [-2.15, 2.15, 1.25], [-0.42, 2.08, -0.72], 38]];
  const openPortrait = [[0, [-2.6, 2.3, 1.7], [-0.4, 1.72, -0.7], 40], [1, [-2.15, 2.15, 1.25], [-0.42, 1.75, -0.72], 38]];
  const firstLine = timing.lines[0].id;

  S("a1", 0, dur, room, openCam, { sway: 0, amb: "office", pcam: openPortrait,
    do(t) { hero.pose({ x: -0.35, z: -0.7, ry: -0.2, t, expr: "bored", look: [0.45, -0.3], headRx: 0.08 }); } });

  return tl.finish();
}
