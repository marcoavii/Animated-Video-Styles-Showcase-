// Smong sample in Basic style 4 (Ref 5 grammar): hard cuts on clause boundaries, frontal medium shots with a slow
// push, a big hand-and-prop insert, flat vector characters as stickers in clean 3D sets, darkening fade at the end.
import * as THREE from "three";
import { E, clamp, sstep, lerp, K, wob } from "./kit.js";
import { timeline, popIn, pulse } from "./direct.js";
import { Puppet, Cutout, UNIT } from "./toon.js";
import { drawFish, drawNote, drawPillow, drawBlanket, drawArm, drawWave } from "./props2d.js";
import { CAST } from "./cast.js";
import { buildIsland } from "./set_island.js";
import { buildHouse } from "./set_house.js";
import { buildBeach, groundY, seaY, pathAt } from "./set_beach.js";

export async function buildStory(engine, timing) {
  const tl = timeline(timing, { ending: "loop", tail: 0.8, hi: ["lagu", "bencana", "surut", "bukit"] });
  const { W, dur, S, cue, hit, act } = tl;
  const island = buildIsland(engine), house = buildHouse(engine), beach = buildBeach(engine);

  // ---------- house cast ----------
  const nenek = new Puppet(house.scene, CAST.nenek);
  const raka = new Puppet(house.scene, CAST.raka);
  const pillow = new Cutout(house.scene, 600, 260, 0.42, drawPillow);
  const blanket = new Cutout(house.scene, 1000, 420, 0.78, drawBlanket, { anchor: "bottom" });
  const notes = [0, 1, 2].map((i) => new Cutout(house.scene, 256, 320, 0.42, drawNote, { state: { col: ["#ffd36e", "#ffe49a", "#ffc65a"][i] } }));
  [nenek, raka].forEach((p) => p.tint(0xfff0de));
  // ---------- beach cast ----------
  const rk = new Puppet(beach.scene, CAST.raka), kA = new Puppet(beach.scene, CAST.kidA), kB = new Puppet(beach.scene, CAST.kidB);
  const nk = new Puppet(beach.scene, CAST.nenek);
  const folk = [CAST.man, CAST.woman, CAST.fisher, CAST.kidA, CAST.woman2, CAST.man2].map((c, i) => new Puppet(beach.scene, { ...c, seed: 40 + i * 3, res: 768 }));
  const FCOL = ["#f2b134", "#3aa0e0", "#e0603a", "#9a62d0", "#c0c8d0"];
  const fishes = FCOL.map((c) => new Cutout(beach.scene, 420, 220, 0.5, drawFish, { state: { col: c } }));
  const bigFish = new Cutout(beach.scene, 420, 220, 0.62, drawFish, { state: { col: "#f2b134" } });
  const arm = new Cutout(beach.scene, 1100, 520, 0.62, drawArm, { state: { open: 1 } });
  const wave = new Cutout(beach.scene, 2400, 1100, 40, drawWave, { anchor: "bottom", res: 2048 });
  const beachCast = [rk, kA, kB, nk, ...folk];
  const hideBeach = () => { beachCast.forEach((p) => p.pose({ visible: false })); fishes.forEach((f) => (f.mesh.visible = false)); bigFish.mesh.visible = false; arm.mesh.visible = false; wave.mesh.visible = false; };
  const world = (t, o = {}) => beach.world(t, { ...o, waveH: 0 });
  function waveAt(t, x, z, h, rise = 1) {
    wave.mesh.visible = true; wave.update(t, { foam: Math.round(t * 30) / 30 % 1, lip: 1 });
    wave.mesh.position.set(x, seaY(t) - 0.4, z); wave.mesh.scale.set(h / 40, (h / 40) * Math.max(0.02, rise), 1); wave.mesh.rotation.set(0, 0, 0);
  }

  // Raka lying on his back across the frame (a 2D cartoon lies sideways). rz: PI/2 lying, 0 upright.
  const RZ = Math.PI / 2;
  function lying(t, k, o = {}) {
    // pivot near the hip so he springs up from the mat
    const rz = lerp(RZ, 0, k), hipH = 0.94;
    const px = 0.75, py = 0.47, pz = -0.62;
    raka.pose({ x: px + Math.sin(rz) * hipH, y: py - Math.cos(rz) * hipH + hipH * (1 - k) * 0 + k * 0.0, z: pz, rz, t, blob: false, ...o });
    if (k > 0) raka.root.position.y = lerp(py - Math.cos(RZ) * hipH, 0, k);
    if (k > 0) raka.root.position.x = lerp(px + hipH, px - 0.2, k);
  }
  const bedding = (show = true, k = 0) => {
    pillow.mesh.visible = show && k < 0.05; pillow.mesh.position.set(-0.3, 0.2, -0.66);
    blanket.mesh.visible = show; blanket.mesh.position.set(0.95 + k * 0.3, -k * 0.5, -0.5); blanket.mesh.rotation.z = -k * 0.2;
  };
  const hideNotes = () => notes.forEach((n) => (n.mesh.visible = false));

  act("lullaby", 0);

  // 1. "Di pulau ini," : the island at night
  S("a1", 0, W("A1", 3), island, [[0, [-60, 22, 92], [-2, 5, 0], 30], [1, [-55, 20, 85], [-2, 5, 2], 29]], { amb: "seanight", sway: 0.2 });
  cue("night_swell", 0.0, { dur: 1.6 });

  // 2. "nenek-nenek menidurkan cucunya" : she pats him to sleep
  S("a2", W("A1", 3), W("A1", 6), house, [[0, [0.35, 1.55, 3.6], [0.35, 1.0, -1.2], 40], [1, [0.35, 1.5, 3.2], [0.35, 1.0, -1.2], 39]], { amb: "housenight", sway: 0.2, dof: null,
    do(t) {
      house.flicker(t); hideNotes(); bedding(true);
      lying(t, 0, { expr: "sleep" });
      const pat = Math.max(0, Math.sin(t * 6.2));
      nenek.pose({ x: 0.15, z: -1.45, t, kneel: true, expr: "hum", armR: 38 + pat * 6, elbowR: 70, armL: 12, headTilt: -6 });
    } });
  [W("A1", 3) + 0.2, W("A1", 3) + 0.7, W("A1", 3) + 1.2].forEach((tp) => cue("cloth_pat", tp, { gain: 0.8 }));
  cue("tokek", W("A1", 3) + 0.15, { gain: 0.8 });

  // 3. "dengan lagu tentang" : close on grandma singing, notes float out
  const tSing = W("A1", 6);
  S("a3", W("A1", 6), W("A1", 9), house, [[0, [0.0, 1.5, 1.9], [0.0, 1.25, -1.45], 32], [1, [0.0, 1.5, 1.6], [0.0, 1.27, -1.45], 31]], { amb: "housenight", sway: 0.15, dof: null,
    do(t) {
      house.flicker(t); bedding(true); lying(t, 0, { expr: "sleep" });
      const open = Math.sin((t - tSing) * 9) > -0.2;
      nenek.pose({ x: 0.15, z: -1.45, t, kneel: true, expr: open ? "sing" : "hum", armR: 20, elbowR: 95, armL: 20, elbowL: 95, headTilt: Math.sin(t * 2.6) * 6 });
      notes.forEach((n, i) => {
        const age = t - (tSing + 0.08 + i * 0.17);
        n.mesh.visible = age > 0;
        const s = Math.max(0.001, popIn(age, 0, 0.2));
        n.mesh.scale.setScalar(s); n.mesh.position.set(-0.45 - age * 0.55 - i * 0.1, 1.45 + age * 0.5 + i * 0.05, -1.3); n.mesh.rotation.z = Math.sin(age * 5 + i) * 0.25;
      });
    } });

  // 4. "bencana." : he springs upright, a wave shadow climbs the wall
  const tB = W("A1", 9);
  S("a4", tB, W("A2", 0), house, [[0, [0.15, 1.6, 3.0], [0.15, 1.55, -2], 40], [1, [0.15, 1.6, 2.6], [0.15, 1.6, -2], 38]], { amb: "housenight", sway: 0.2, dof: null,
    do(t) {
      const k = popIn(t, tB + 0.03, 0.22);
      house.flicker(t, sstep(tB, tB + 0.15, t) * 0.8);
      hideNotes(); bedding(true, k);
      lying(t, k, { expr: k > 0.3 ? "shock" : "sleep", sweat: k > 0.6, armL: k > 0.3 ? 40 : 8, armR: k > 0.3 ? 40 : 8, squash: -0.05 * pulse(t, tB + 0.1, 0.2) });
      nenek.pose({ x: 1.25, z: -1.6, t, kneel: true, expr: "hum", armR: 12 });
      const r = sstep(tB - 0.1, tB + 0.6, t);
      house.waveShadow.scale.set(-1.25, Math.max(0.001, 1.45 * E.out(r)), 1);
      house.shadowMat.opacity = 0.82 * sstep(tB - 0.15, tB + 0.1, t);
      house.housesMat.opacity = 0.82 * sstep(tB - 0.15, tB + 0.1, t);
    } });
  cue("shadow_swell", tB - 0.35, { dur: 1.0 });
  cue("lullaby_stop", tB - 0.02);
  cue("eye_pop", tB + 0.06);
  cue("cloth_flop", tB + 0.06);
  cue("reveal_braam", tB + 0.02, { gain: 0.5 });
  hit(tB + 0.05, 0.25);

  act("shore", W("A2", 0) - 0.05);
  act("drain", W("A2", 2));
  act("run", W("A4", 0) - 0.05);

  // 5. "Soalnya, kalau" : three kids on the beach, the calm sea behind them
  const line = [[-1.25, 3.4, kA], [0.05, 3.1, rk], [1.3, 3.5, kB]];
  S("b1", W("A2", 0), W("A2", 2), beach, [[0, [0.05, 1.55, 9.6], [0.05, 1.15, -2], 36], [1, [0.05, 1.5, 9.0], [0.05, 1.15, -2], 35]], { amb: "beach", sway: 0.2,
    do(t) {
      hideBeach(); world(t);
      line.forEach(([x, z, p], i) => p.pose({ x, y: groundY(x, z), z, t, expr: ["happy", "smug", "joy"][i], holdR: p === rk ? "bucket" : "", armR: p === rk ? 14 : 8, armL: p === kB ? 150 : 8, elbowL: p === kB ? -20 : 0, hop: p === kB ? Math.max(0, Math.sin(t * 6)) * 0.08 : 0 }));
    } });
  cue("kids_play", W("A2", 0) + 0.1, { dur: 1.2, gain: 0.45 });

  // 6. "laut tiba-tiba surut," : from behind them, the sea drains away
  const tDrain = 5.5;
  S("b2", W("A2", 2), W("A3", 0), beach, [[0, [0.3, 1.3, 7.4], [0, 0.2, -24], 44], [1, [0.3, 1.45, 7.9], [0, 0.0, -24], 46]], { amb: "beach", sway: 0.25,
    do(t) {
      hideBeach(); world(t);
      const jump = pulse(t, tDrain + 0.25, 0.25);
      line.forEach(([x, z, p]) => p.pose({ x, y: groundY(x, z), z, t, back: true, holdR: p === rk ? "bucket" : "", hop: jump * 0.12, armL: 8 + jump * 30, armR: 8 + jump * 30 }));
    } });
  cue("sea_drain", tDrain - 0.1, { dur: 1.6 });
  cue("gull_scatter", tDrain + 0.15);
  cue("boat_thud", 6.25, { pan: -0.5, gain: 0.8 });
  cue("boat_thud", 6.42, { pan: 0.4, gain: 0.6 });
  cue("drop_silence", W("A3", 0) + 0.02);

  // 7. "jangan pungut" : free fish! grinning on the wet sand
  const fishAt = [[-1.6, -4.4], [-0.5, -3.7], [0.9, -4.0], [1.9, -4.6], [0.2, -5.0]];
  S("b3", W("A3", 0), W("A3", 2), beach, [[0, [0.1, groundY(0, -1) + 1.6, -0.6], [0.1, groundY(0, -7) + 1.0, -9], 38], [1, [0.1, groundY(0, -1) + 1.55, -1.0], [0.1, groundY(0, -7) + 1.0, -9], 37]], { amb: "drained", sway: 0.2,
    do(t) {
      hideBeach(); world(t, { gulls: false });
      [[-1.3, -7.2, kA, "laugh"], [0.1, -6.8, rk, "joy"], [1.4, -7.4, kB, "joy"]].forEach(([x, z, p, ex], i) => p.pose({ x, y: groundY(x, z), z, t, expr: ex, holdR: p === rk ? "bucket" : "", armR: p === rk ? 120 : 30, elbowR: p === rk ? -10 : 40, armL: 30 + i * 10, elbowL: 50, hop: Math.max(0, Math.sin(t * 7 + i)) * 0.06 }));
      fishes.forEach((f, i) => { const [x, z] = fishAt[i]; f.mesh.visible = true; f.update(t, { col: FCOL[i], flop: Math.round(Math.sin(t * 13 + i * 2) * 4) / 4 }); f.mesh.position.set(x, groundY(x, z) + 0.12, z); f.mesh.rotation.set(-1.05, 0, (i - 2) * 0.4); });
    } });
  cue("fish_flop", W("A3", 0) + 0.05, { dur: 1.4, gain: 0.6, pan: 0.2 });

  // 8. "ikannya." : the insert. A big hand reaches for the fish and stops
  const tF = W("A3", 2);
  const ix = 30, iz = -10.5, iy = groundY(30, -10.5);
  S("b4", tF, W("A4", 0), beach, [[0, [ix + 0.05, iy + 1.55, iz + 0.35], [ix + 0.05, iy, iz - 0.05], 34], [1, [ix + 0.05, iy + 1.45, iz + 0.3], [ix + 0.05, iy, iz - 0.05], 33]], { amb: "drained", sway: 0.15,
    do(t, u, l) {
      hideBeach(); world(t, { gulls: false });
      bigFish.mesh.visible = true; bigFish.update(t, { col: "#f2b134", flop: Math.round(Math.sin(t * 15) * 4) / 4 });
      bigFish.mesh.position.set(ix - 0.12, iy + 0.03, iz); bigFish.mesh.rotation.set(-Math.PI / 2, 0, 0.15);
      arm.mesh.visible = true; arm.update(t, { open: l > 0.42 ? 0.3 : 1 });
      const reachK = E.out(clamp(l / 0.3)) * (1 - sstep(0.42, 0.6, l) * 0.18);
      arm.mesh.position.set(ix + lerp(1.1, 0.36, reachK), iy + 0.16, iz + 0.04 + 0.01 * Math.sin(l * 50) * sstep(0.42, 0.5, l)); arm.mesh.rotation.set(-Math.PI / 2, 0, 0.08);
    } });
  cue("hand_stop", tF + 0.42);
  cue("rumble_ground", tF + 0.3, { dur: 2.2, gain: 0.8 });

  // 9. "Lari" : close on Raka, the wave stands up behind him
  const tL = W("A4", 0);
  S("c1", tL, 8.55, beach, [[0, [0, groundY(0, -5.5) + 1.9, -1.9], [0, groundY(0, -5.5) + 1.85, -7], 36], [1, [0, groundY(0, -5.5) + 1.95, -2.3], [0, groundY(0, -5.5) + 1.95, -7], 35]], { amb: "drained", sway: 0.6,
    do(t, u, l) {
      hideBeach(); world(t, { gulls: false });
      rk.pose({ x: 0, y: groundY(0, -5.5), z: -5.5, t, expr: "terror", sweat: true, armL: 55, armR: 55, elbowL: -30, elbowR: -30, hop: Math.abs(Math.sin(t * 22)) * 0.02 });
      waveAt(t, 0, -48, 30, E.out(clamp(l / 0.6)) * 0.8 + 0.2);
    } });
  cue("braam_huge", tL - 0.38, { gain: 0.72 });
  cue("wave_roar", tL - 0.2, { dur: 2.4 });
  hit(tL, 0.35);

  // 10. "ke bukit!" : the village runs up the hill toward us, grandma waves them on; the wave arrives, fade to dark
  const [nx, nz] = pathAt(0.97);
  const tEnd = 9.75;
  S("c2", 8.55, dur, beach, [[0, [nx + 1.2, groundY(nx + 1.2, nz + 6) + 2.4, nz + 6], [nx - 3, groundY(nx, nz) - 6, nz - 40], 46], [1, [nx + 1.2, groundY(nx + 1.2, nz + 5.4) + 2.4, nz + 5.4], [nx - 3, groundY(nx, nz) - 6.5, nz - 40], 46]], { amb: "hill", sway: 0.4,
    do(t, u, l) {
      hideBeach(); world(t, { gulls: false });
      nk.pose({ x: nx - 0.35, y: groundY(nx - 0.35, nz + 3.0), z: nz + 3.0, t, expr: "shout", wave: Math.round(Math.sin(t * 10) * 25) });
      folk.concat([rk, kA]).forEach((p, i) => {
        const pp = 0.6 + i * 0.038 + l * 0.05; const [x, z] = pathAt(pp);
        p.pose({ x: x + ((i % 3) - 1) * 0.9, y: groundY(x, z), z, t: t + i * 0.37, expr: i % 3 ? "terror" : "worried", walk: 1.4, walkRate: 1.5 });
      });
      waveAt(t, 0, lerp(-70, -52, u), 42, 1);
    },
    frameGrade: (t) => ({ exposure: 1.02 * (1 - sstep(tEnd - 0.35, tEnd + 0.05, t) * 0.97) }) });
  cue("crowd_run", 8.55, { dur: 0.9, gain: 1 });
  cue("wind_gust", 8.65, { gain: 0.6 });
  cue("wave_crash", tEnd - 0.3, { gain: 0.85 });

  const out = tl.finish();
  out.captions[out.captions.length - 1].e = tEnd - 0.1;
  return out;
}
