// "Abu dapur ke sawah": 4 shots, push or pull on every shot, hard cuts on spoken words, a dissolve into the harvest.
import * as THREE from "three";
import { E, clamp, sstep, lerp, K } from "./kit.js";
import { timeline, diss } from "./direct.js";
import { Villager } from "./people.js";
import { buildVillage, rice } from "./village.js";
import { bucket, pellets, chicken } from "./props5.js";
import { CAST } from "./cast.js";

export async function buildStory(engine, timing) {
  const tl = timeline(timing, { ending: "loop", tail: 0.7, hi: ["abu", "panen", "paling", "tinggi"] });
  const { W, WE, dur, S, cue, act } = tl;
  // two paddies split by a grass walkway: Darto's on the left, the neighbour's on the right
  const plotA = [-2.55, -2.6, 4.4, 6.2, { depth: 0.32, level: 0.78, water: "blue", rim: 0.3 }];
  const plotB = [2.55, -2.6, 4.4, 6.2, { depth: 0.32, level: 0.78, water: "blue", rim: 0.3 }];
  const v = buildVillage(engine, { ponds: [plotA, plotB], houses: [[-5, -15, 0.1], [7, -17, -0.4]], sunDir: [0.6, 0.6, 0.45] });
  const riceA = rice(v.scene, v.ponds[0], { seed: 11 }), riceB = rice(v.scene, v.ponds[1], { seed: 12 });
  const darto = new Villager(v.scene, { ...CAST.juragan, mustache: true });
  const tetangga = new Villager(v.scene, CAST.petani);
  const pail = bucket(v.scene, 0, 0, 0x2a6fd6, 0.9);
  const ash = [0.25, 1.15, 2.0].map((t0, i) => ({ t0, p: pellets(v.scene, 70, 20 + i, 0x9c9a94, 0.8) }));
  chicken(v.scene, 6.2, -1.2, -2.2, 0.7); chicken(v.scene, -5.6, 0.8, 0.9, 0.7, 0xf2f2ee);
  act("none", 0);

  const tLaugh = 2.86;            // the "haha" between the lines
  const tTetangga = W("A2", 0);
  const tTapi = W("A3", 0), tPadi = W("A3", 3);
  const hand = new THREE.Vector3();
  const throwArm = (t) => { const ph = ((t - 0.1) % 0.9) / 0.9; return ph < 0.35 ? [20, -20 + ph * 60, 30] : [35, 85 - (ph - 0.35) * 120, 15]; };
  const youngRice = () => { riceA.set({ h: 0.38 }); riceB.set({ h: 0.36 }); };
  const ripeRice = () => { riceA.set({ h: 1.35, ripe: 1 }); riceB.set({ h: 0.62, ripe: 0.35 }); };
  const hideAsh = () => ash.forEach((a) => a.p.set(-9, 0, [0, -5, 0]));

  // 1. Darto on the walkway, scattering grey ash from a pail into his paddy. Low camera in the grass, push in.
  S("s1", 0, tLaugh, v, [[0, [2.4, 1.75, 3.7], [-0.6, 0.55, -1.2], 44], [1, [2.05, 1.7, 3.2], [-0.6, 0.6, -1.2], 44]], { amb: "desa", sway: 0.25,
    do(t) {
      youngRice();
      darto.pose({ x: 0, z: 0, t, ry: -0.55, expr: { eyes: "dot", brow: "flat", mouth: "smile" }, armL: [10, 30, 70], armR: throwArm(t) });
      darto.root.updateMatrixWorld(true);
      darto.arms[0].hand.getWorldPosition(hand);
      pail.position.set(hand.x, hand.y - 0.22, hand.z); pail.visible = true;
      darto.arms[1].hand.getWorldPosition(hand);
      const floor = v.ponds[0].userData.top;
      ash.forEach((a) => a.p.bits.forEach((b) => {
        const [side, up, fwd] = b.userData.v, u = Math.max(0, t - a.t0 - b.userData.d);
        b.visible = t > a.t0 + b.userData.d;
        b.position.set(hand.x - fwd * u * 0.9, Math.max(floor, hand.y + up * u - 4.9 * u * u), hand.z + side * u * 0.5);
      }));
      tetangga.pose({ x: 40, t });
    } });
  cue("whoosh", 0.32, { dur: 0.22, dir: -1, big: 0 }); cue("whoosh", 1.22, { dur: 0.22, dir: -1, big: 0 }); cue("whoosh", 2.07, { dur: 0.22, dir: -1, big: 0 });
  cue("water_lap", 0.7, { dur: 1.6, gain: 0.5 });

  // 2. The neighbour at the edge of his paddy laughs and points; Darto, behind, looks round calmly. Hard cut on the laugh.
  S("s2", tLaugh, tTapi, v, [[0, [4.5, 1.85, 4.4], [1.8, 0.85, 0.0], 42], [1, [4.15, 1.8, 3.9], [1.8, 0.9, 0.0], 42]], { amb: "desa", sway: 0.25,
    do(t) {
      youngRice(); hideAsh(); pail.visible = false;
      const laughing = t < 3.3;
      tetangga.pose({ x: 2.7, z: 1.3, t, ry: -0.75, expr: { eyes: "happy", brow: "up", mouth: laughing ? "open" : "smile" }, talk: laughing ? 1 : 0,
        armR: [25, 75, 15], armL: [12, 0, 60], lean: laughing ? Math.sin(t * 14) * 3 : 0 });
      darto.pose({ x: -0.2, z: -1.6, t, ry: lerp(-1.3, 0.55, sstep(tTetangga + 0.4, tTetangga + 1.0, t)), expr: { eyes: "dot", brow: "flat", mouth: "flat" } });
    } });

  // 3. Dissolve to the harvest: Darto's rice stands tall and golden, the neighbour's is short. Wide, pulling back.
  S("s3", tTapi, tPadi, v, [[0, [0.4, 2.9, 5.2], [0, 0.0, -2.2], 44], [1, [0.5, 3.15, 6.1], [0, 0.0, -2.2], 44]], { amb: "desa", sway: 0.2, trans: diss(0.28),
    do(t) {
      ripeRice(); hideAsh(); pail.visible = false;
      darto.pose({ x: -0.15, z: 0.2, t, ry: 0.2, expr: { eyes: "happy", mouth: "lips" } });
      tetangga.pose({ x: 0.75, z: 0.6, t, ry: -0.5, expr: { eyes: "ring", brow: "up", mouth: "o" } });
    } });
  cue("rise_sparkle", tTapi + 0.5, { dur: 0.9 });

  // 4. Low medium: Darto spreads his arms, grinning, in front of his tall rice; the neighbour gapes, sweating. Push in.
  S("s4", tPadi, dur, v, [[0, [-0.2, 1.05, 4.1], [-0.6, 1.45, -0.2], 42], [1, [-0.25, 1.1, 3.6], [-0.6, 1.45, -0.2], 42]], { amb: "desa", sway: 0.25,
    dof: { ap: 0.004, max: 0.004 },
    do(t) {
      ripeRice(); hideAsh(); pail.visible = false;
      const open = sstep(tPadi, tPadi + 0.35, t);
      darto.pose({ x: -0.75, z: 0.1, t, ry: 0.25, expr: { eyes: "happy", brow: "up", mouth: "grin" }, armL: [lerp(8, 60, open), 10, lerp(10, -45, open)], armR: [lerp(8, 60, open), 10, lerp(10, -45, open)] });
      tetangga.pose({ x: 0.85, z: 0.9, t, ry: -0.55, expr: { eyes: "ring", brow: "worried", mouth: "o", look: -1 }, sweat: sstep(tPadi + 0.6, tPadi + 0.9, t) });
    } });
  cue("sparkle", W("A3", 4), { gain: 0.6 });

  return tl.finish();
}
