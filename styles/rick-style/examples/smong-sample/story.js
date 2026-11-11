// Smong sample in Rick Style: inked 2D characters in a saturated 3D world, a camera that flies (FPV pushes with
// real motion blur, cranes, low angles), soft dissolves between places, one-word captions.
import * as THREE from "three";
import { E, clamp, sstep, lerp, K, wob } from "./kit.js";
import { timeline, whip, push, diss, popIn, pulse } from "./direct.js";
import { Toon } from "./sketch.js";
import { CAST } from "./cast.js";
import { buildIsland } from "./set_island.js";
import { buildHouse } from "./set_house.js";
import { buildBeach, groundY, seaY, pathAt } from "./set_beach.js";
import { makeNote, makeBucket, makeFish } from "./props.js";

export async function buildStory(engine, timing) {
  const tl = timeline(timing, { ending: "loop", tail: 0.9 });
  const { W, dur, S, cue, hit, act } = tl;
  const island = buildIsland(engine), house = buildHouse(engine), beach = buildBeach(engine);

  const nenek = new Toon(house.scene, CAST.nenek), raka = new Toon(house.scene, CAST.raka);
  [nenek, raka].forEach((p) => p.tint(0xffe2c8));
  house.blanket.scale.set(1, 0.5, 1); house.blanket.userData.base.y = 0.28;
  const notes = [0, 1, 2, 3].map((i) => makeNote(house.scene, [0xffd27a, 0xffe7a0, 0xffc060, 0xfff0c0][i]));
  const rk = new Toon(beach.scene, CAST.raka), kA = new Toon(beach.scene, CAST.kidA), kB = new Toon(beach.scene, CAST.kidB);
  const nk = new Toon(beach.scene, CAST.nenek);
  const folk = [CAST.man, CAST.woman, CAST.fisher, CAST.man2, CAST.woman, CAST.man].map((c, i) => new Toon(beach.scene, { ...c, seed: 40 + i * 3, res: 768 }));
  const bucket = makeBucket(beach.scene);
  const cast = [rk, kA, kB, nk, ...folk];
  const hideBeach = () => { cast.forEach((p) => p.pose({ visible: false })); bucket.visible = false; };
  const hideNotes = () => notes.forEach((n) => (n.visible = false));

  act("lullaby", 0);

  // 1. "Di pulau ini," : FPV dive across the night sea to the island
  S("a1", 0, 1.4, island, [[0, [-150, 46, 270], [-6, 6, 0], 52], [1, [-46, 13, 70], [-4, 6, 4], 40, "io"]], { amb: "seanight", sway: 0.4 });
  cue("night_swell", 0.0, { dur: 1.6 });
  cue("rise_whoosh", 0.1, { dur: 1.2 });

  // 2. "nenek-nenek menidurkan" : low dolly past grandma patting him to sleep
  const ZF = 1.35; // Raka's feet; he lies toward -z
  S("a2", 1.4, W("A1", 6), house, [[0, [-2.4, 1.55, 2.6], [0.35, 0.65, -0.4], 40], [1, [-1.7, 1.6, 2.2], [0.35, 0.7, -0.4], 38]], { trans: diss(0.22), amb: "housenight", sway: 0.5,
    do(t) {
      house.flicker(t); hideNotes();
      raka.pose({ x: 0, z: ZF, t, lie: true, expr: "sleep" });
      const pat = Math.max(0, Math.sin(t * 6.2));
      nenek.pose({ x: 1.15, y: -0.62, z: -0.35, t, expr: "hum", armL: 40 + pat * 10, elbowL: 50, headTilt: -8 });
    } });
  [1.55, 2.05, 2.5].forEach((tp) => cue("cloth_pat", tp, { gain: 0.8 }));
  cue("tokek", 1.5, { gain: 0.8 });

  // 3. "dengan lagu tentang" : crane in on her singing, glowing notes rise
  const tSing = W("A1", 6);
  S("a3", W("A1", 6), W("A1", 9), house, [[0, [-0.7, 1.2, 2.0], [1.1, 1.15, -0.35], 34], [1, [-0.35, 1.45, 1.35], [1.1, 1.25, -0.35], 30, "out"]], { trans: diss(0.16), amb: "housenight", sway: 0.4,
    do(t) {
      house.flicker(t);
      raka.pose({ x: 0, z: ZF, t, lie: true, expr: "sleep" });
      const open = Math.sin((t - tSing) * 9) > -0.2;
      nenek.pose({ x: 1.15, y: -0.62, z: -0.35, t, expr: open ? "sing" : "hum", armL: 20, elbowL: 100, armR: 20, elbowR: 100, headTilt: Math.sin(t * 2.6) * 7 });
      notes.forEach((n, i) => {
        const age = t - (tSing + 0.05 + i * 0.15);
        n.visible = age > 0; if (!n.visible) return;
        n.scale.setScalar(Math.max(0.001, popIn(age, 0, 0.2) * 0.8));
        n.position.set(0.75 - age * 0.7 - i * 0.1, 1.5 + age * 0.55 + Math.sin(age * 5 + i) * 0.06, -0.2 + Math.sin(age * 3 + i) * 0.1);
        n.rotation.set(0, 0.4, Math.sin(age * 4 + i) * 0.3);
      });
    } });

  // 4. "bencana." : snap zoom, he bolts upright, the wave shadow climbs the wall
  const tB = W("A1", 9);
  S("a4", tB, W("A2", 0), house, [[0, [0.1, 1.0, 3.6], [0, 1.3, -1.5], 44], [1, [0.1, 1.05, 3.0], [0, 1.4, -1.5], 40, "out"]], { trans: push(4, 0.22), amb: "housenight", sway: 0.6,
    do(t) {
      const k = popIn(t, tB + 0.02, 0.22);
      house.flicker(t, sstep(tB, tB + 0.15, t) * 0.8); hideNotes();
      raka.pose({ x: 0, z: lerp(ZF, 0.6, k), t, lie: k < 0.15, expr: k > 0.2 ? "shock" : "sleep", sweat: k > 0.6, hop: k > 0.15 ? 0.35 * (1 - k) + pulse(t, tB + 0.05, 0.25) * 0.25 : 0, armL: 60, armR: 60, elbowL: -20, elbowR: -20 });
      const b = house.blanket, bb = b.userData.base; b.position.set(bb.x + 0.2 * k, bb.y - 0.25 * k, bb.z + 0.5 * k); b.rotation.x = 0.3 * k;
      nenek.pose({ x: 1.3, y: -0.62, z: -0.6, t, expr: "hum" });
      const r = sstep(tB - 0.1, tB + 0.6, t);
      house.waveShadow.scale.set(-1.25, Math.max(0.001, 1.45 * E.out(r)), 1);
      house.shadowMat.opacity = 0.85 * sstep(tB - 0.15, tB + 0.1, t); house.housesMat.opacity = 0.85 * sstep(tB - 0.15, tB + 0.1, t);
    } });
  cue("shadow_swell", tB - 0.35, { dur: 1.0 });
  cue("lullaby_stop", tB - 0.02);
  cue("eye_pop", tB + 0.06);
  cue("cloth_flop", tB + 0.06);
  cue("reveal_braam", tB + 0.02, { gain: 0.55 });
  hit(tB + 0.05, 0.35);

  act("shore", W("A2", 0) - 0.05);
  act("drain", W("A2", 2));
  act("run", W("A4", 0) - 0.05);

  // 5. "Soalnya, kalau" : FPV over the village, down to the kids at the waterline
  const kids = [[-1.6, -0.4, kA, "joy"], [0.1, -0.9, rk, "smug"], [1.7, -0.3, kB, "happy"]];
  S("b1", W("A2", 0), W("A2", 2), beach, [[0, [6, 34, 70], [1, 2, 0], 50], [0.75, [3.2, 2.0, 6.5], [0.1, 1.2, -1], 40, "io"], [1, [2.7, 1.6, 5.4], [0.1, 1.15, -1], 38]], { trans: diss(0.22), amb: "beach", sway: 0.5,
    do(t) {
      hideBeach(); beach.world(t, { waveH: 0 });
      kids.forEach(([x, z, p, ex], i) => p.pose({ x, y: groundY(x, z), z, t, expr: ex, holdR: p === rk ? "bucket" : "", armL: p === kA ? 150 : 10, elbowL: p === kA ? -20 : 10, hop: p === kA ? Math.max(0, Math.sin(t * 6)) * 0.12 : 0 }));
    } });
  cue("rise_whoosh", W("A2", 0) - 0.1, { dur: 0.9 });
  cue("kids_play", W("A2", 0) + 0.4, { dur: 1.0, gain: 0.5 });

  // 6. "laut tiba-tiba surut," : at ankle height the water rushes out between their legs
  const tDrain = 5.5;
  S("b2", W("A2", 2), W("A3", 0), beach, [[0, [0.2, 0.55, 2.4], [0, 0.0, -20], 50], [1, [0.2, 0.75, 1.2], [0, -0.3, -20], 52, "in"]], { trans: diss(0.14), amb: "beach", sway: 0.6,
    do(t) {
      hideBeach(); beach.world(t, { waveH: 0 });
      const jump = pulse(t, tDrain + 0.25, 0.3);
      kids.forEach(([x, z, p]) => p.pose({ x: x * 1.25, y: groundY(x, z), z: z - 0.6, t, back: true, holdR: p === rk ? "bucket" : "", hop: jump * 0.15, armL: 10 + jump * 40, armR: 10 + jump * 40 }));
    } });
  cue("sea_drain", tDrain - 0.1, { dur: 1.6 });
  cue("gull_scatter", tDrain + 0.15);
  cue("boat_thud", 6.25, { pan: -0.5, gain: 0.8 });
  cue("boat_thud", 6.42, { pan: 0.4, gain: 0.6 });
  cue("drop_silence", W("A3", 0) + 0.02);

  // 7. "jangan pungut" : tracking alongside them as they sprint onto the reef
  const tR = W("A3", 0);
  S("b3", tR, W("A3", 2), beach, [[0, [4.6, 1.4, -0.6], [0.0, 0.9, -3.0], 44], [1, [4.4, 1.4, -3.6], [0.0, 0.8, -6.4], 44]], { trans: diss(0.14), amb: "drained", sway: 0.7,
    do(t) {
      hideBeach(); beach.world(t, { waveH: 0 });
      const l = t - tR;
      [[0.0, -1.2, rk, "joy"], [-1.3, -0.4, kA, "laugh"], [1.2, -1.9, kB, "joy"]].forEach(([x, z, p, ex], i) => { const zz = z - l * 5.5; p.pose({ x, y: groundY(x, zz), z: zz, t: t + i * 0.3, expr: ex, walk: 1.3, walkRate: 1.5, holdR: p === rk ? "bucket" : "" }); });
    } });
  cue("sand_run", tR - 0.05, { dur: 0.75, gain: 0.9 });
  cue("fish_flop", tR + 0.05, { dur: 1.4, gain: 0.55, pan: 0.2 });

  // 8. "ikannya." : on the sand, Raka crouches over a flopping fish, and freezes
  const tF = W("A3", 2), fx = 1.6, fz = -11.5, gy = groundY(fx, fz);
  S("b4", tF, W("A4", 0), beach, [[0, [0.9, gy + 0.32, -10.1], [1.55, gy + 0.55, -11.7], 40], [1, [1.0, gy + 0.36, -10.35], [1.55, gy + 0.6, -11.7], 36]], { trans: diss(0.12), amb: "drained", sway: 0.4, dof: { ap: 0.03, max: 0.012 },
    do(t, u, l) {
      hideBeach(); beach.world(t, { waveH: 0, flop: 1.4, gulls: false });
      const frozen = l > 0.42;
      rk.pose({ x: 2.1, y: gy - 0.55, z: -12.3, t, expr: frozen ? "worried" : "joy", armR: frozen ? 40 : 55 + Math.sin(t * 9) * 4, elbowR: frozen ? 70 : 30, armL: 30, elbowL: 40, look: frozen ? [0.6, -0.2] : [-0.3, 0.6] });
    } });
  cue("hand_stop", tF + 0.42);
  cue("rumble_ground", tF + 0.3, { dur: 2.2, gain: 0.8 });

  // 9. "Lari" : crane up over his shoulder, the wave stands up on the horizon, he spins round screaming
  const tL = W("A4", 0);
  S("c1", tL, 8.55, beach, [[0, [0.6, groundY(0.6, -9) + 1.3, -8.4], [0.4, 3, -60], 46], [1, [0.8, groundY(0.6, -9) + 3.2, -6.2], [0.4, 6, -60], 52, "out"]], { trans: diss(0.12), amb: "drained", sway: 0.8,
    do(t, u, l) {
      hideBeach(); beach.world(t, { waveZ: lerp(-150, -135, u), waveH: lerp(12, 18, E.out(u)), gulls: false });
      const turned = l > 0.36;
      rk.pose({ x: 0.4, y: groundY(0.4, -10.5), z: -10.5, t, back: !turned, expr: "terror", sweat: true, armL: 60, armR: 60, elbowL: -30, elbowR: -30, hop: turned ? pulse(t, tL + 0.37, 0.2) * 0.25 : 0 });
    } });
  cue("braam_huge", tL - 0.38, { gain: 0.72 });
  cue("wave_roar", tL - 0.2, { dur: 2.6 });
  hit(tL, 0.4);

  // 10. "ke bukit!" : FPV chase up the hill behind the running village, grandma at the top waving them in
  const [nx, nz] = pathAt(0.98);
  S("c2", 8.55, 9.45, beach, [[0, (() => { const [x, z] = pathAt(0.5); return [x + 0.5, groundY(x, z) + 2.2, z - 3]; })(), (() => { const [x, z] = pathAt(0.95); return [x, groundY(x, z) + 1.5, z]; })(), 50], [1, (() => { const [x, z] = pathAt(0.66); return [x + 0.5, groundY(x, z) + 2.2, z - 3]; })(), (() => { const [x, z] = pathAt(1.0); return [x, groundY(x, z) + 1.5, z]; })(), 46, "in"]], { trans: diss(0.12), amb: "hill", sway: 1.2,
    do(t, u, l) {
      hideBeach(); beach.world(t, { waveZ: -70, waveH: 18, gulls: false });
      nk.pose({ x: nx, y: groundY(nx, nz), z: nz, t, expr: "shout", wave: true });
      folk.concat([kA, kB]).forEach((p, i) => { const pp = 0.6 + i * 0.035 + l * 0.08; const [x, z] = pathAt(pp); p.pose({ x: x + ((i % 3) - 1) * 0.9, y: groundY(x, z), z, t: t + i * 0.37, back: true, walk: 1.4, walkRate: 1.6 }); });
    } });
  cue("crowd_run", 8.55, { dur: 0.9, gain: 1 });
  cue("wind_gust", 8.65, { gain: 0.6 });

  // 11. whip round to the sea: the wall of water curls over the empty beach, smash to black
  const tW = 9.45, tHit = 9.97;
  S("c3", tW, dur, beach, [[0, [0.6, groundY(0, 9) + 1.0, 9.5], [0, 8.5, -14], 62], [0.5, [0.5, groundY(0, 9) + 0.9, 9.9], [0, 14, -12], 68, "io"], [1, [0.4, groundY(0, 9) + 0.85, 10.3], [0, 15, -10], 70]], { trans: whip(1, 0.24), amb: "drained", sway: 1.4,
    do(t, u) { hideBeach(); beach.world(t, { waveZ: lerp(-18, 2, sstep(0, 1, (t - tW) / (tHit - tW))), waveH: lerp(17, 18.5, u), gulls: false }); },
    frameGrade: (t) => (t > tHit ? { exposure: 0, bloom: 0 } : {}) });
  cue("wave_crash", tHit - 0.3, { gain: 1 });
  hit(tW + 0.2, 0.25); hit(tHit - 0.2, 0.6);

  const out = tl.finish();
  out.captions[out.captions.length - 1].e = tHit;
  return out;
}
