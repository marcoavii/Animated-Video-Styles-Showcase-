// Story timeline. Every shot is anchored to a word in the narration, so picture and voice stay locked.
// Audio cues are declared next to the action they belong to and exported to the sound-design script.
import * as THREE from "three";
import { K, E, clamp, sstep, lerp, rng } from "./kit.js";
import { ARM } from "./actor.js";
import { buildOffice } from "./set_office.js";
import { buildSea } from "./set_sea.js";
import { buildLamp } from "./set_lamp.js";
import { buildStairs } from "./set_stairs.js";
import { buildHarbor } from "./set_harbor.js";
import { buildCustoms } from "./set_customs.js";

const whip = (dir = 1, d = 0.3, amt = 1.05, axis) => ({ type: "whip", d, dir, amt, axis });
const push = (amt = 5, d = 0.3) => ({ type: "push", d, amt });
const diss = (d = 0.14) => ({ type: "dissolve", d });
const pulse = (t, t0, d = 0.16) => (t < t0 || t > t0 + d ? 0 : Math.sin(((t - t0) / d) * Math.PI));
const popIn = (t, t0, d = 0.26) => E.back(clamp((t - t0) / d));
const _v = new THREE.Vector3();
const _q = new URLSearchParams(location.search);
const P = +(_q.get("h") || 1080) > +(_q.get("w") || 1920); // 9:16 framing

// pose then solve a hand onto a world-space point
function reach(actor, params, side, world) {
  actor.pose(params);
  actor.root.updateMatrixWorld(true);
  actor.body.updateMatrixWorld(true);
  const l = actor.body.worldToLocal(_v.set(...world)).toArray();
  actor.pose({ ...params, [side]: l });
}
function attachToHand(obj, actor, idx = 1, off = [0, 0, 0]) {
  actor.root.updateMatrixWorld(true);
  actor.arms[idx].hand.getWorldPosition(obj.position);
  obj.position.x += off[0]; obj.position.y += off[1]; obj.position.z += off[2];
}

export async function buildStory(engine, timing) {
  const line = Object.fromEntries(timing.lines.map((l) => [l.id, l]));
  const W = (id, k = 0) => line[id].words[k].s;
  const WE = (id, k = 0) => line[id].words[k].e;
  const dur = timing.dur + 0.1;

  const office = buildOffice(engine);
  const seaDay = buildSea(engine, "day");
  const seaNight = buildSea(engine, "night");
  const seaDawn = buildSea(engine, "dawn");
  const lampR = buildLamp(engine);
  const stairs = buildStairs(engine);
  const harborDay = buildHarbor(engine, "day");
  const harborDusk = buildHarbor(engine, "dusk");
  const customs = buildCustoms(engine);

  const shots = [];
  const cues = [];
  const impacts = [];
  const cue = (name, t, o = {}) => { cues.push({ name, t: +t.toFixed(3), ...o }); };
  const hit = (t, a = 1) => impacts.push([t, a]);
  const S = (id, t0, t1, set, cam, o = {}) => { const s = { id, t0, t1, set, cam, seed: shots.length * 1.7 + 1, ...o }; shots.push(s); return s; };

  // ===================================== A. THE OFFICE =====================================
  const keeperBored = (t) => office.keeper.pose({ x: -0.35, z: -0.7, ry: -0.2, t, expr: "bored", look: [0.45, -0.3], headRx: 0.08 });
  const openCam = [[0, [-2.6, 2.3, 1.7], [-0.4, 2.05, -0.7], 40], [1, [-2.15, 2.15, 1.25], [-0.42, 2.08, -0.72], 38]];

  S("a1", 0, W("A1", 3), office, openCam, { sway: 0, amb: "office", pcam: [[0, [-2.6, 2.3, 1.7], [-0.4, 1.72, -0.7], 40], [1, [-2.15, 2.15, 1.25], [-0.42, 1.75, -0.72], 38]],
    do(t) { keeperBored(t); } });

  S("a2", W("A1", 3), W("A2", 0), office, [[0, [1.95, 2.25, -1.15], [1.4, 1.12, -1.85], 34], [1, [1.75, 1.82, -1.32], [1.38, 1.12, -1.85], 34]], { trans: diss(0.12), amb: "office", dof: { ap: 0.05, max: 0.012 } });
  cue("paper_slide", W("A1", 3) - 0.02); cue("stamp_thud", W("A1", 6) - 0.04, { gain: 0.9 });
  hit(W("A1", 6) - 0.04, 0.35);

  const begT = W("A2", 3);
  S("a3", W("A2", 0), W("A2", 4), office, [[0, [-1.2, 1.55, 2.15], [-0.35, 1.72, -0.7], 34], [1, [-0.85, 1.42, 1.62], [-0.33, 1.78, -0.7], 34]], { trans: whip(1, 0.26), amb: "office",
    do(t) { const k = sstep(begT - 0.25, begT + 0.05, t); office.keeper.pose({ x: -0.35, z: -0.7, ry: 0.22, t, expr: k > 0.5 ? "beg" : "shock", look: [0.35, 0.55], headRx: -0.2, headRz: Math.sin(t * 16) * 0.018 * k, squash: Math.sin(t * 17) * 0.012 * k, kneel: k * 0.6, armL: ARM.clasp[0], armR: ARM.clasp[1] }); office.boss.pose({ x: 1.2, z: -3.25, t, expr: "bored", ry: -0.28 }); } });
  cue("cloth_flop", begT - 0.24);

  S("a4", W("A2", 4), W("A3", 0), office, [[0, [-3.2, 2.0, 4.3], [0.5, 1.45, -1.7], 38], [1, [-2.3, 2.15, 3.7], [0.5, 1.5, -1.7], 38]], { trans: diss(0.12), amb: "office",
    do(t) { office.keeper.pose({ x: -0.35, z: -0.7, ry: 2.65, t, expr: "beg", kneel: 0.75, armL: ARM.clasp[0], armR: ARM.clasp[1], headRx: -0.18, headRz: Math.sin(t * 15) * 0.03, look: [0, 0.7] }); office.boss.pose({ x: 1.2, z: -3.25, t, expr: "squint", ry: -0.22, look: [-0.5, -0.5] }); office.staff.forEach((a, i) => a.pose({ x: [-6.1, -3.2, -6.1, -4.3][i], z: [-2.75, -3.05, -0.45, -1.9][i], ry: 0.65, t, expr: "shock", look: [0.5, -0.1] })); } });

  // The whole office laughing: pan across the desks, two beats.
  S("a5", W("A3", 0), W("A3", 2), office, [[0, [-1.4, 2.6, 2.2], [-5.0, 1.65, -2.0], 44], [1, [-1.9, 2.5, 1.6], [-5.2, 1.7, -2.0], 44]], { trans: whip(-1, 0.26), amb: "office", pk: 1.2, pcam: [[0, [-1.6, 2.8, 2.8], [-4.9, 1.6, -1.9], 44], [1, [-2.0, 2.7, 2.3], [-4.9, 1.65, -1.9], 44]],
    do(t, u, l) { const laugh = (a, i, x, z, ry) => { const b = Math.abs(Math.sin(t * 13 + i)); a.pose({ x, z, ry, t, expr: "laugh", lean: 0.06 * Math.sin(t * 7 + i * 2), tilt: Math.sin(t * 9 + i) * 0.1, hop: b * 0.07, armL: i % 2 ? ARM.belly[0] : [-0.5, 1.55 + b * 0.2, 0.4], armR: i % 2 ? ARM.belly[1] : [0.34, 0.95 + b * 0.04, 0.42], headRx: -0.16, blink: false }); };
      laugh(office.staff[0], 0, -6.1, -2.75, 0.5); laugh(office.staff[1], 1, -3.2, -3.05, -0.1); laugh(office.staff[2], 2, -6.1, -0.45, 0.8); laugh(office.staff[3], 3, -4.3, -1.9, 0.3);
      office.keeper.pose({ x: -0.35, z: -0.7, ry: -1.3, t, expr: "beg", kneel: 0.75, armL: ARM.clasp[0], armR: ARM.clasp[1] }); } });
  cue("crowd_laugh", W("A3", 0) - 0.05, { dur: 1.65 });

  S("a6", W("A3", 2), W("A4", 0), office, [[0, [-5.0, 2.15, -0.2], [-6.05, 1.92, -2.75], 34], [1, [-5.2, 2.1, -0.55], [-6.05, 1.95, -2.75], 34]], { trans: diss(0.1), amb: "office",
    do(t) { const b = Math.abs(Math.sin(t * 14)); office.staff[0].pose({ x: -6.1, z: -2.75, ry: 0.1, t, expr: "laugh", hop: b * 0.07, tilt: Math.sin(t * 10) * 0.12, headRx: -0.18, armL: [-0.56, 1.72 + b * 0.1, 0.38], armR: ARM.belly[1], blink: false }); office.staff[2].pose({ x: -6.1, z: -0.45, ry: 0.9, t, expr: "laugh", visible: false }); } });

  // boss: shrug
  const shrugT = W("A4", 3);
  S("a7", W("A4", 0), W("A5", 0), office, [[0, [-0.4, 2.05, 0.75], [1.2, 1.65, -3.25], 34], [1, [-0.15, 2.0, 0.2], [1.2, 1.7, -3.25], 34]], { trans: whip(1, 0.28), amb: "office", dof: { ap: 0.02, max: 0.008 },
    do(t) { const s = E.back(clamp((t - shrugT) / 0.28)) * (1 - sstep(shrugT + 1.05, shrugT + 1.35, t)); office.boss.pose({ x: 1.2, z: -3.25, ry: -0.35, t, expr: "shrug", look: [-0.35, 0.05], armL: s > 0.02 ? [lerp(-0.55, -0.74, s), lerp(0.7, 1.28, s), lerp(0.03, 0.26, s)] : null, armR: s > 0.02 ? [lerp(0.55, 0.74, s), lerp(0.7, 1.28, s), lerp(0.03, 0.26, s)] : null, headRz: s * 0.14, body: 0, y: 0, headRx: s * 0.05 }); office.keeper.pose({ x: -0.35, z: -0.7, ry: 2.65, t, expr: "beg", kneel: 0.75, armL: ARM.clasp[0], armR: ARM.clasp[1], visible: false }); } });
  cue("cloth_shrug", shrugT); cue("tick_tick", W("A4", 5), { dur: 0.9 });

  // BAIKLAH. +5 slam
  const slam = W("A5", 1) - 0.02;
  S("a8", W("A5", 0), W("B1", 0) - 0.02, office, [[0, [-1.05, 1.85, 3.1], [-1.05, 1.95, -0.7], 40], [1, [-1.05, 1.8, 2.75], [-1.05, 1.98, -0.7], 40]], { trans: diss(0.1), amb: "office", pcam: [[0, [-0.5, 1.9, 3.7], [-0.42, 2.45, -0.7], 40], [1, [-0.48, 1.85, 3.3], [-0.42, 2.45, -0.7], 40]],
    do(t, u, l) { const k = popIn(t, slam, 0.24); const j = sstep(slam + 0.1, slam + 0.34, t); const b = Math.abs(Math.sin((t - slam) * 12)) * j;
      office.keeper.pose({ x: -0.35, z: -0.7, ry: 0.1, t, expr: j > 0.4 ? "star" : "beg", look: [0, 0.1], hop: b * 0.34, armL: j > 0.2 ? [-0.62, 2.04 + b * 0.1, 0.12] : ARM.clasp[0], armR: j > 0.2 ? [0.62, 2.04 + b * 0.1, 0.12] : ARM.clasp[1], squash: t > slam && t < slam + 0.1 ? 0.1 : 0, headRx: -0.08, blink: false });
      office.plus.visible = t > slam - 0.01; office.plus.scale.setScalar(Math.max(0.001, k) * (P ? 0.66 : 0.74)); office.plus.position.set(P ? -0.42 : -1.92, (P ? 3.72 : 2.2) - (1 - k) * 2.4, -0.7); office.plus.rotation.set(-0.08 + (1 - k) * 0.8, 0.26 + Math.sin(t * 2) * 0.03, 0.03); } });
  cue("impact_big", slam, { gain: 1 }); hit(slam, 1); cue("brass_stab", slam + 0.02, { note: "up" }); cue("rise_sparkle", slam + 0.24, { dur: 0.9 });

  // ===================================== B. BACK AT THE TOWER =====================================
  S("b1", W("B1", 0), W("B1", 4), seaDay, [[0, [62, 13, 66], [0, 22, 0], 42], [1, [34, 26, 42], [0, 29, 0], 42]], { trans: push(10, 0.32), amb: "seaday",
    do(t) { seaDay.gulls.slice(0, 3).forEach((g, i) => { g.visible = true; g.position.set(28 + i * 9 + Math.sin(t + i) * 2, 22 + i * 3 + Math.sin(t * 1.1 + i) * 0.8, 42 - i * 6 - t * 1.2); g.rotation.y = 2.4; g.userData.flap(t + i, 1); }); } });
  cue("seagull", W("B1", 0) + 0.15, { pan: 0.4 }); cue("seagull", W("B1", 2) + 0.05, { pan: -0.3, gain: 0.7 });

  // happiest man alive, pull out through the room
  S("b2", W("B1", 4), W("B2", 0), lampR, [[0, [-1.2, 2.25, 4.15], [-2.45, 2.05, 2.1], 36], [1, [1.4, 3.2, 5.6], [-1.45, 2.05, 1.6], 42]], { trans: whip(-1, 0.3), amb: "lampday", ease: "io",
    do(t, u, l) { lampR.mood("day"); const b = 0.5 + 0.5 * Math.sin(t * 3.2); lampR.keeper.pose({ x: -2.45, z: 2.1, ry: 0.42, t, expr: "bliss", look: [0, 0], armL: ARM.behindHead[0], armR: ARM.behindHead[1], headRz: Math.sin(t * 2.4) * 0.07, tilt: Math.sin(t * 2.4) * 0.045, hop: 0 });
      lampR.sparkles.slice(0, 4).forEach((s, i) => { const p = (l * 1.6 + i * 0.27) % 1; s.visible = true; const a = i * 1.7; s.position.set(-2.1 + Math.cos(a) * 0.72, 2.36 + Math.sin(a) * 0.56, 2.45); s.scale.setScalar(Math.sin(p * Math.PI) * 1.05); s.rotation.z = t * 2; }); } });
  cue("sparkle", W("B1", 5), { gain: 0.8 }); cue("sparkle", W("B1", 8), { gain: 0.6 }); cue("happy_sigh_tone", W("B1", 5), { dur: 2 });

  // polishing the lens
  const polishCam = [[0, [1.5, 2.65, 5.0], [-1.05, 2.25, 1.2], 38], [1, [1.0, 2.6, 4.5], [-1.1, 2.25, 1.2], 38]];
  S("b3", W("B2", 0), W("B2", 3), lampR, polishCam, { trans: diss(0.12), amb: "lampday",
    do(t, u, l) { lampR.mood("day"); const rub = Math.sin(t * 11); const p = [-0.98 + rub * 0.2, 2.38 + Math.cos(t * 11) * 0.12, 1.02 + rub * 0.12];
      reach(lampR.keeper, { x: -1.9, z: 1.45, ry: 1.55, t, expr: "happy", look: [0.5, 0.3], headRy: -0.55, headRx: -0.08, headRz: rub * 0.03 }, "armR", p);
      lampR.rag.visible = true; attachToHand(lampR.rag, lampR.keeper, 1); lampR.rag.rotation.set(rub * 0.3, 1, 0.4);
      lampR.sparkles.slice(0, 5).forEach((s, i) => { const q = (l * 1.15 + i * 0.21) % 1; s.visible = true; const a = i * 2.4; s.position.set(-0.8 + Math.cos(a) * 0.65, 2.75 + Math.sin(a) * 0.75, 1.66 + Math.sin(a * 2) * 0.1); s.scale.setScalar(Math.sin(q * Math.PI) * 1.05); s.rotation.z = t * 1.8 + i; }); } });
  cue("rag_squeak", W("B2", 0) + 0.02, { dur: 1.2 }); cue("sparkle", W("B2", 2));

  // feeding the gull on the gallery
  S("b4", W("B2", 3), W("B2", 7), lampR, [[0, [3.9, 2.35, 8.25], [7.1, 1.65, 4.9], 34], [1, [4.5, 2.05, 8.05], [7.3, 1.7, 4.95], 34]], { trans: whip(1, 0.28), amb: "lampout", pk: 1.25, pcam: [[0, [3.9, 2.35, 8.25], [7.0, 1.75, 4.55], 34], [1, [4.5, 2.05, 8.05], [7.1, 1.8, 4.55], 34]],
    do(t, u, l) { lampR.mood("day"); const g = lampR.gull; g.visible = true; const hop = Math.abs(Math.sin(t * 7)) * 0.05; g.position.set(7.98, 1.78 + hop, 5.1); g.rotation.y = 2.62; g.userData.flap(t, 0.6, true); const bk = pulse((l * 2) % 1, 0.1, 0.4); g.rotation.z = -bk * 0.5;
      const g2 = lampR.gull2; g2.visible = true; const arr = sstep(0, 0.7, l); g2.position.set(lerp(15, 10.8, arr), lerp(5.6, 3.1, arr) + Math.sin(t * 3) * 0.1, lerp(0.2, 2.6, arr)); g2.rotation.y = 2.2; g2.userData.flap(t + 1, 1);
      reach(lampR.keeper, { x: 6.12, z: 4.32, ry: 0.55, t, expr: "joy", look: [0.7, 0.05] }, "armR", [7.28, 1.86, 4.85]); } });
  cue("seagull", W("B2", 3) + 0.1, { pan: 0.25, gain: 1.05 }); cue("wing_flap", W("B2", 4), { pan: 0.45 }); cue("seagull", W("B2", 5) + 0.15, { pan: 0.5, gain: 0.7 });

  // never late: clock racing, then ignition
  const ignite = W("B2", 13);
  S("b5", W("B2", 7), ignite - 0.02, lampR, [[0, [3.5, 2.75, -0.45], [3.15, 2.72, -2.3], 30], [1, [3.35, 2.72, -0.95], [3.15, 2.72, -2.3], 30]], { trans: whip(1, 0.28), amb: "lampday",
    do(t) { lampR.mood("dawn"); lampR.keeper.pose({ visible: false }); } });
  cue("clock_tick", W("B2", 7), { dur: ignite - W("B2", 7), rate: 7 });

  S("b6", ignite, W("B3", 0), lampR, [[0, [1.9, 1.5, 4.2], [0, 3.1, 0], 38], [1, [1.3, 1.2, 3.25], [0, 3.2, 0], 38]], { trans: diss(0.08), amb: "lampday",
    do(t) { lampR.mood("dawn"); const on = E.out(clamp((t - ignite - 0.1) / 0.3)); lampR.setLamp(on * (1 + Math.sin(t * 34) * 0.05 * (1 - on)));
      lampR.keeper.pose({ x: -1.7, z: 1.3, ry: 0.55, t, expr: on > 0.3 ? "joy" : "happy", look: [0.65, 0.4], armR: [0.6, 2.05, 0.2] }); } });
  cue("lamp_ignite", ignite + 0.06); hit(ignite + 0.1, 0.4);

  // the empty view: walk past him and out of the glass
  S("b7", W("B3", 0), W("B3", 4), lampR, [[0, [-1.2, 2.5, -0.4], [-5.3, 2.05, -5.3], 40], [1, [-2.4, 2.45, -1.5], [-5.8, 2.05, -5.9], 40]], { trans: diss(0.18), amb: "lampday",
    do(t) { lampR.mood("day"); lampR.keeper.pose({ x: -4.15, z: -3.2, ry: 3.75, t, expr: "happy", armL: ARM.hip[0], armR: [0.18, 1.0, 0.42], headRx: 0.05 }); } });

  S("b8", W("B3", 4), W("C1", 0) - 0.02, seaDay, [[0, [22, 37, 30], [220, 18, 50], 44], [1, [82, 30, 38], [340, 8, 60], 44]], { trans: push(9, 0.34), amb: "seaday",
    do(t, u, l) { seaDay.gulls[0].visible = true; seaDay.gulls[0].position.set(102 + l * 22, 33 + Math.sin(t) * 0.5, 30 + l * 2); seaDay.gulls[0].rotation.y = 0; seaDay.gulls[0].userData.flap(t, 1); } });
  cue("wind_lonely", W("B3", 5) - 0.1, { dur: 2.2 }); cue("seagull", W("B3", 6) + 0.2, { pan: -0.5, gain: 0.45, far: 1 });

  // ===================================== C. THE STRANGE LIGHT =====================================
  const beamA = (t) => t * 0.72 + 0.4;
  S("c1", W("C1", 0), W("C1", 3), seaNight, [[0, [108, 4.2, 112], [0, 25, 0], 40], [1, [88, 5.8, 96], [0, 28, 0], 40]], { trans: diss(0.26), amb: "seanight",
    do(t) { seaNight.setLamp(1, beamA(t)); } });
  cue("night_sting", W("C1", 0) - 0.08); cue("beam_sweep", W("C1", 1), { dur: 1.3 });

  const boatPos = (t) => [62, 0.0 + Math.sin(t * 1.1) * 0.13, 78];
  const fisherFn = (t, faces = "shock") => { const f = seaNight.fishing; f.visible = true; f.userData.faceLight(16 * seaNight.lampLevel); const p = boatPos(t); f.position.set(...p); f.rotation.set(Math.sin(t * 0.9) * 0.02, -0.62, Math.sin(t * 1.3) * 0.03); f.userData.lantern(true);
    seaNight.fisher1.pose({ x: -0.9, y: f.userData.deck, z: 0.05, ry: 2.95, t, expr: faces, look: [0.1, 0.65], headRx: -0.25, armL: [-0.1, 1.1, 0.4] });
    seaNight.fisher2.pose({ x: 1.0, y: f.userData.deck, z: -0.05, ry: -2.95, t, expr: "squint", look: [-0.1, 0.55], headRx: -0.25, armR: [0.5, 1.62, 0.4] }); };
  S("c2", W("C1", 3), W("C2", 0), seaNight, [[0, [66.7, 3.5, 84.3], [28, 16, 24], 36], [1, [66.0, 3.3, 83.4], [24, 18, 20], 36]], { trans: whip(1, 0.28), amb: "seanight",
    do(t) { fisherFn(t, "neutral"); seaNight.setLamp(1, beamA(t)); } });
  cue("boat_creak", W("C1", 3) + 0.05); cue("water_lap", W("C1", 4), { dur: 1.4 });

  const blinkTimes = [W("C2", 2) + 0.05]; const threeT = [W("C2", 3) - 0.02, W("C2", 3) + 0.27, W("C2", 3) + 0.56];
  const blinkLevel = (t, list, d = 0.16) => { let m = 1; for (const b of list) { if (t > b && t < b + d) m = 0; else if (t >= b + d && t < b + d + 0.05) m = (t - b - d) / 0.05; } return m; };
  // close on the lantern from the gallery: blink
  S("c3", W("C2", 0), W("C2", 3) - 0.14, seaNight, [[0, [9.5, 32.2, 15.5], [0, 37, 0], 38], [1, [8.2, 32.8, 13.5], [0, 37, 0], 38]], { trans: diss(0.12), amb: "seanight",
    do(t) { seaNight.setLamp(blinkLevel(t, blinkTimes, 0.2), 0.75 + Math.sin(t * 0.3) * 0.06); } });
  blinkTimes.forEach((b) => { cue("relay_clack", b, { gain: 0.9 }); cue("morse_tone", b, { dur: 0.2, gain: 0.5 }); });

  // wide: tiga kali
  S("c4", W("C2", 3) - 0.14, W("C2", 5), seaNight, [[0, [52, 7, 92], [0, 30, 0], 26], [1, [47, 7.5, 86], [0, 31, 0], 25]], { trans: push(7, 0.2), amb: "seanight",
    do(t) { fisherFn(t); seaNight.setLamp(blinkLevel(t, threeT, 0.16), 2.32); } });
  threeT.forEach((b) => { cue("relay_clack", b); cue("morse_tone", b, { dur: 0.16 }); cue("beat_thud", b + 0.01, { gain: 0.55 }); });

  S("c5", W("C2", 5), W("C3", 0), seaNight, [[0, [60.3, 3.05, 73.2], [62.0, 2.62, 78.2], 36], [1, [60.5, 2.98, 73.8], [62.0, 2.62, 78.2], 36]], { trans: diss(0.1), amb: "seanight", dof: { ap: 0.02, max: 0.007 },
    do(t) { const f = seaNight.fishing; f.visible = true; fisherFn(t); seaNight.setLamp(1, beamA(t)); f.userData.lantern(false); f.userData.faceLight(34); seaNight.fisher1.pose({ x: -0.9, y: f.userData.deck, z: 0.05, ry: -2.05, t, expr: "shock", look: [0.5, 0], headRy: 0.3 }); seaNight.fisher2.pose({ x: 1.0, y: f.userData.deck, z: -0.05, ry: -2.55, t, expr: "shock", look: [-0.5, 0], headRy: -0.3, armR: [0.5, 1.62, 0.4] }); } });
  cue("drone_question", W("C2", 5), { dur: 1 });

  // officers arrive
  const doorP = [2.4, 5.7, 4.2];
  S("c6", W("C3", 0), W("C3", 2) + 0.12, seaDay, [[0, [14.6, 7.2, 15.6], [2, 8.2, 3.3], 38], [1, [12.7, 7.0, 13.6], [2, 8.1, 3.3], 38]], { trans: whip(-1, 0.28), amb: "seaday",
    do(t, u, l) { const w = sstep(0, 1.0, l); seaDay.officers.forEach((a, i) => a.pose({ x: lerp(8.8 + i * 1.5, 4.5 + i * 1.5, w), y: 5.7, z: lerp(13 + i * 0.5, 6.0 + i * 0.5, w), ry: -2.56, t, walk: w < 1 ? 1 : 0, expr: "angry", look: [0, 0.2], armL: [-0.55, 0.72 + Math.sin(t * 8.5) * 0.15, Math.sin(t * 8.5) * 0.2], armR: [0.55, 0.72 - Math.sin(t * 8.5) * 0.15, -Math.sin(t * 8.5) * 0.2] })); } });
  cue("footsteps_march", W("C3", 0), { dur: 1.0, surface: "gravel" }); cue("wind_gust", W("C3", 0), { gain: 0.5 });

  const doorT = W("C3", 3) - 0.04;
  S("c7", W("C3", 2) + 0.12, W("C4", 0), stairs, [[0, [1.0, 1.6, -1.0], [2.6, 1.85, 5.4], 40], [1, [1.1, 1.55, -0.2], [2.6, 1.9, 5.4], 40]], { trans: whip(1, 0.2), amb: "stairs",
    do(t) { const o = E.out(clamp((t - doorT) / 0.14)); stairs.hinge.rotation.y = o * 1.95; stairs.doorShaft.material.uniforms.s.value = o * 0.1; const w = sstep(doorT + 0.06, doorT + 0.85, t);
      const inn = t > doorT + 0.03; stairs.off1.pose({ visible: inn, x: lerp(2.5, 1.9, w), z: lerp(5.2, 2.6, w), ry: 3.3, t, walk: 1, expr: "angry" }); stairs.off2.pose({ visible: inn, x: lerp(3.3, 3.2, w), z: lerp(5.0, 3.2, w), ry: 3.3, t, walk: 1, expr: "angry" }); } });
  cue("door_burst", doorT); hit(doorT, 0.75); cue("reverb_tail_big", doorT + 0.03);

  // steps
  S("c8", W("C4", 0), W("C4", 5), stairs, [[0, [5.05, 1.42, 0.55], [3.5, 2.85, -3.5], 46], [1, [5.0, 1.55, 0.1], [3.5, 2.9, -3.5], 46]], { trans: diss(0.12), amb: "stairs",
    do(t) { const sc = Math.sin(t * 3.4); const op = { x: 3.4, y: 1.92, z: -3.56, ry: 0.42, t, expr: "squint", look: [0.1, -0.7], lean: 0.32, kneel: 0.7, headRx: 0.32 };
      reach(stairs.off1, op, "armR", [3.72 + sc * 0.16, 2.42, -2.92 + sc * 0.06]);
      stairs.magnifier.visible = true; attachToHand(stairs.magnifier, stairs.off1, 1, [0, 0.05, 0]); stairs.magnifier.rotation.set(0.4, 0.5, 0.1);
      stairs.off2.pose({ x: -0.32, y: 2.95, z: -4.95, ry: 1.25, t, expr: "squint", look: [0, -0.8], lean: 0.25, headRx: 0.3 }); } });
  cue("footsteps_stair", W("C4", 0), { dur: 1.2 }); cue("creak_wood", W("C4", 3) - 0.06);

  // wall tapping
  const taps = [W("C4", 5), W("C4", 5) + 0.36, W("C4", 6) + 0.1, W("C4", 7) + 0.1];
  const tapFn = (t) => { let v = 0; for (const b of taps) if (t > b) v = Math.max(v, Math.exp(-(t - b) * 12)); return v; };
  S("c9", W("C4", 5), W("C4", 8), stairs, [[0, [-3.9, 2.0, 3.55], [-0.4, 1.75, 5.1], 38], [1, [-3.5, 1.95, 3.7], [-0.4, 1.78, 5.1], 38]], { trans: whip(-1, 0.28), amb: "stairs",
    do(t) { const v = tapFn(t);
      reach(stairs.off2, { x: -0.6, z: 4.95, ry: -0.1, t, expr: "squint", look: [0.6, 0], headRy: -1.15, headRz: 0.0, tilt: 0.1 }, "armR", [-0.05, 1.85 + v * 0.16, 5.72 - v * 0.16]);
      stairs.hammer.visible = true; attachToHand(stairs.hammer, stairs.off2, 1); stairs.hammer.rotation.set(1.45 - v * 0.7, 0.2, 0);
      stairs.arcs.forEach((a, i) => { const last = taps.filter((b) => b < t).pop(); if (last === undefined) return; const age = t - last; if (age > 0.42) return; a.visible = true; const p = age / 0.42 + i * 0.13; a.position.set(0.2, 1.9, 5.45 - p * 0.15); a.scale.setScalar(0.32 + p * 1.0); a.rotation.set(0, 0.25, -Math.PI * 0.36); a.material.opacity = (1 - clamp(p)) * 0.9; }); } });
  taps.forEach((b, i) => cue("knock_wall", b, { gain: 0.9, hollow: i === 3 ? 0.3 : 1 }));

  // oil tank
  S("c10", W("C4", 8), W("C5", 0), stairs, [[0, [-1.55, 7.0, -3.65], [-1.3, 5.2, -1.0], 40], [1, [-1.5, 6.75, -3.4], [-1.3, 5.2, -1.0], 40]], { trans: whip(1, 0.28, 1, "y"), amb: "stairs",
    do(t) { const pop = sstep(W("C4", 12) - 0.2, W("C4", 12), t);
      const pp = { x: -1.28, y: 4.25, z: -0.2, ry: 3.14, t, expr: pop > 0.5 ? "shock" : "squint", look: [0, -0.5], lean: 0.5, headRx: -0.1 };
      reach(stairs.off1, pp, "armR", [-1.55, 5.0, -1.25]);
      stairs.flash.visible = true; attachToHand(stairs.flash, stairs.off1); stairs.flash.rotation.set(1.3, 0, 0.1); stairs.flash.lookAt(-1.35, 3, -1.45); } });
  cue("metal_hatch", W("C4", 9), { gain: 0.8 }); cue("tank_echo", W("C4", 11), { dur: 1.4 }); cue("flashlight_click", W("C4", 9) + 0.15);

  // NIHIL
  const nihil = W("C5", 0);
  S("c11", nihil, W("D1", 0) - 0.02, stairs, [[0, [0.4, 1.9, 6.0], [0.0, 1.5, 0.0], 40], [1, [0.3, 1.85, 5.05], [0.0, 1.62, 0.0], 40]], { trans: push(6, 0.2), amb: "stairs", fill: 5, pk: 1.42,
    do(t, u, l) { stairs.mess.visible = true; const sip = pulse(l, 0.1, 0.7);
      stairs.off1.pose({ x: -2.1, z: 1.0, ry: 0.4, t, expr: "sad", look: [0.2, -0.3], tilt: 0.05, lean: 0.12, headRx: 0.2 }); stairs.off2.pose({ x: 2.0, z: 0.25, ry: -0.3, t, expr: "sad", look: [-0.2, -0.4], lean: 0.12, headRx: 0.25 });
      stairs.keeper.root.visible = true;
      stairs.keeper.pose({ x: 0, z: 1, ry: 0.05, t, expr: sip > 0.4 ? "bliss" : "smirk", look: [-0.55, 0.05], armR: [0.14, lerp(1.32, 1.64, sip), 0.56], armL: ARM.hip[0] });
      stairs.mug.visible = true; attachToHand(stairs.mug, stairs.keeper, 1, [-0.06, 0.05, 0.05]); } });
  cue("sad_trombone_low", nihil + 0.02, { gain: 0.5 }); cue("sip", nihil + 0.2); cue("brick_settle", nihil + 0.06);

  // ===================================== D. MEANWHILE =====================================
  const crowdDay = (t, off = 0) => { const P = harborDay.people; [[-30, -4.4, 1.2, 1], [-25, -1.8, -1.5, 1], [-18, -4.8, 1.5, 1], [-12, -1.2, -1.5, 1], [-7, -5.0, 1.6, 1], [3, -1.5, 1.45, 1], [8, -4.5, -1.6, 1]].forEach(([x, z, ry], i) => { const dir = Math.sign(Math.sin(ry)); P[i].pose({ x: x + dir * (t - 35) * 1.3, z, ry, t: t + i * 0.3, walk: 0.95, expr: "neutral", armL: [-0.55, 0.72 + Math.sin(t * 8.5 + i) * 0.15, Math.sin(t * 8.5 + i) * 0.2], armR: [0.55, 0.72 - Math.sin(t * 8.5 + i) * 0.15, -Math.sin(t * 8.5 + i) * 0.2] }); }); };
  S("d1", W("D1", 0), W("D1", 4), harborDay, [[0, [-48, 4.8, 21], [-48, 5.4, -6], 42], [1, [-10, 5.0, 21], [-10, 5.9, -6], 42]], { trans: diss(0.14), amb: "harbor",
    do(t) { crowdDay(t); harborDay.gulls.forEach((g, i) => { g.visible = true; g.position.set(-30 + i * 15 + t * 1.6 - 55, 13 + i * 1.5 + Math.sin(t + i), 3 + i); g.rotation.y = 0; g.userData.flap(t + i, 1); }); } });
  cue("ship_horn_far", W("D1", 0) + 0.15, { pan: -0.4, gain: 0.7 }); cue("seagull", W("D1", 2) + 0.05, { pan: 0.3, gain: 0.6 }); cue("becak_bell", W("D1", 1) + 0.2, { pan: -0.2, gain: 0.5 });

  S("d2", W("D1", 4), W("D1", 6), harborDay, [[0, [-1.5, 6, 18], [0, 7.3, -6], 40], [1, [-0.6, 7.2, 12], [0, 8.7, -6], 34]], { trans: diss(0.1), amb: "harbor", do(t) { crowdDay(t); } });

  S("d3", W("D1", 6), W("D2", 0), customs, [[0, [-0.4, 2.1, 5.9], [-1.8, 1.7, 2.6], 36], [1, [-0.7, 2.05, 5.3], [-1.8, 1.72, 2.6], 36]], { trans: whip(1, 0.28), amb: "customs", dof: { ap: 0.02, max: 0.008 },
    do(t) { customs.customs.pose({ x: -1.8, z: 2.6, ry: 0.35, t, expr: "worried", look: [0.35, 0.1], armL: [-0.28, 2.02, 0.42], armR: ARM.hip[1], headRz: Math.sin(t * 16) * 0.01 }); } });
  cue("phone_ring", W("D1", 6) - 0.04, { dur: 0.95, gain: 0.5 });

  // chart: a token slides through
  S("d4", W("D2", 0), W("D2", 2) + 0.2, customs, [[0, [-3.0, 3.75, 1.75], [-2.2, 1.22, -0.6], 34], [1, [-1.5, 3.3, 1.35], [-0.8, 1.22, -0.6], 34]], { trans: diss(0.12), amb: "customs", dof: { ap: 0.03, max: 0.008 },
    do(t, u, l) { customs.customs.root.visible = false; const v = clamp(l / 1.2); customs.tokens.bad.position.set(lerp(-3.4, -0.2, v), 1.2, 0.1); customs.tokens.pat1.position.set(-2.7, 1.2, 0.05); customs.tokens.pat2.position.set(2.7, 1.2, 0.05); } });
  cue("calendar_flip", W("D2", 0), { dur: 0.6 }); cue("token_slide", W("D2", 2) - 0.1, { dur: 1 });

  // the ship itself, close past camera at night
  const smug = (t, x0, sp) => { seaNight.smugglers.forEach((s, i) => { s.visible = true; s.scale.setScalar(1.3); s.position.set(x0 + sp * t - i * 34, 0 + Math.sin(t * 0.9 + i) * 0.1, 56 + i * 2); s.rotation.set(0, Math.PI * 0, Math.sin(t * 0.8 + i) * 0.02); }); };
  S("d5", W("D2", 2) + 0.2, W("D3", 0), seaNight, [[0, [8, 2.0, 69.5], [-8, 4.6, 56], 44], [1, [7, 2.2, 68], [5, 5, 56], 44]], { trans: diss(0.18), amb: "seanight", grade: { exposure: 1.34 }, pcam: [[0, [10, 2.4, 86], [-9, 8, 56], 44], [1, [9, 2.6, 84], [1, 8, 56], 44]],
    do(t) { const T0 = W("D2", 2); smug(t - T0, -24, 12); seaNight.setLamp(1, beamA(t)); seaNight.ring.visible = false; } });
  cue("ship_engine_pass", W("D2", 2) + 0.2, { dur: 2.2, pan0: -0.7, pan1: 0.6 }); cue("wake_water", W("D2", 3), { dur: 1.8 });

  // patrol rushes to empty water
  S("d6", W("D3", 0), W("D4", 0), seaNight, [[0, [-4, 2.9, 78], [-46, 3.4, 54], 38], [1, [-6, 3.0, 72], [-22, 4.2, 54], 40]], { trans: whip(1, 0.28), amb: "seanight",
    do(t, u, l) { const P = seaNight.patrols[0]; P.visible = true; const v = E.out(clamp(l / 1.3)); P.scale.setScalar(1.25); P.position.set(lerp(-82, -22, v), 0.0 + Math.sin(t * 1.2) * 0.14, 54); P.rotation.set(0, 0, Math.sin(t * 1.1) * 0.015 + (1 - v) * 0.035); P.userData.siren(t); seaNight.setLamp(1, beamA(t)); } });
  cue("siren", W("D3", 0) - 0.04, { dur: 1.45, pan0: -0.6, pan1: 0.0 }); cue("speedboat", W("D3", 0), { dur: 1.3, pan0: -0.6, pan1: 0.1 });

  // evidence board
  const stamps = [WE("D4", 2) - 0.1, WE("D4", 5) - 0.1, WE("D4", 8) - 0.1];
  S("d7", W("D4", 0), W("D5", 0), customs, [[0, [7.0, 2.2, 2.4], [6.55, 1.95, 6.9], 44], [0.4, [3.7, 2.2, 2.4], [3.6, 1.95, 6.9], 44], [1, [0.45, 2.25, 2.5], [0.5, 1.95, 6.9], 44]], { trans: whip(-1, 0.28), amb: "customs", dof: null,
    do(t) { customs.customs.root.visible = false; customs.cards.forEach((c, i) => { const v = t > stamps[i]; c.xG.visible = v; const k = v ? E.back(clamp((t - stamps[i]) / 0.13)) : 0; c.xG.scale.setScalar(Math.max(0.001, 1.8 - k * 0.8)); }); } });
  stamps.forEach((s, i) => { cue("x_stamp", s, { gain: 0.72 + i * 0.1, pan: [0.4, 0, -0.4][i] }); hit(s, 0.3 + i * 0.1); });

  // arrest
  const cuffT = W("D5", 2) + 0.04;
  const flashes = [W("D5", 0) + 0.1, W("D5", 2) - 0.02, W("D5", 3) + 0.15, W("D5", 4)];
  const arrestPose = (t, zoom) => { const m = customs.master; const c = t > cuffT; m.pose({ x: 0.3, z: 3.0, ry: 0.0, t, expr: "shock", look: [(t * 3 | 0) % 2 ? 0.5 : -0.5, 0.2], armL: [-0.13, 1.2, 0.48], armR: [0.13, 1.2, 0.48], headRz: Math.sin(t * 13) * 0.02 });
    customs.pol1.pose({ x: -1.1, z: 3.1, ry: 0.65, t, expr: "angry", armR: [0.72, 1.1, 0.42], look: [0.5, 0.05] });
    customs.pol2.pose({ x: 1.75, z: 3.1, ry: -0.65, t, expr: "angry", armL: [-0.72, 1.1, 0.42], look: [-0.5, 0.05] });
    customs.cuffs.visible = c; if (c) { m.root.updateMatrixWorld(true); m.arms[0].hand.getWorldPosition(customs.cuffs.position); customs.cuffs.position.x += 0.13; customs.cuffs.rotation.set(1.1, 0, 0); }
    customs.red.intensity = (Math.sin(t * 10) > 0 ? 40 : 2); customs.blue.intensity = (Math.sin(t * 10) > 0 ? 2 : 42);
    let f = 0; flashes.forEach((b) => { if (t > b && t < b + 0.12) f = Math.max(f, 1 - (t - b) / 0.12); }); customs.flash.intensity = f * 260; };
  S("d8", W("D5", 0), W("D5", 3), customs, [[0, [0.6, 1.85, 6.5], [0.3, 1.55, 2.9], 46], [1, [0.5, 1.9, 5.9], [0.3, 1.6, 2.9], 46]], { trans: whip(1, 0.28), amb: "customs", pk: 1.2,
    do(t) { customs.customs.pose({ x: -5.5, z: 1.0, ry: 1.2, t, expr: "shock" }); arrestPose(t); } });
  cue("handcuffs", cuffT, { gain: 1 }); cue("siren_room", W("D5", 0), { dur: 1.9, gain: 0.35 }); hit(cuffT, 0.3); flashes.forEach((b) => cue("camera_flash", b, { gain: 0.6, pan: 0.15 }));
  S("d9", W("D5", 3), W("E1", 0) - 0.02, customs, [[0, [0.36, 2.0, 5.95], [0.3, 1.98, 3.0], 36], [1, [0.34, 2.0, 5.6], [0.3, 2.0, 3.0], 36]], { trans: diss(0.08), amb: "customs",
    do(t) { arrestPose(t); } });

  // ===================================== E. THE TWIST =====================================
  const turn = W("E1", 0) - 0.15;
  cue("drop_silence", W("E1", 0) - 0.3); cue("sub_drop_big", W("E1", 0) - 0.04, { gain: 1 }); cue("tension_bed", W("E1", 0), { dur: 16 });

  S("e1", W("E1", 0), W("E1", 2), lampR, [[0, [-1.1, 2.1, 4.65], [-1.85, 2.0, 1.6], 34], [1, [-1.45, 2.08, 3.85], [-1.87, 2.03, 1.6], 34]], { trans: push(6, 0.34), amb: "lampnight",
    do(t) { lampR.mood("night"); lampR.setLamp(0.95); const k = sstep(W("E1", 1) - 0.1, W("E1", 1) + 0.25, t); lampR.keeper.pose({ x: -1.85, z: 1.6, ry: lerp(1.5, 0.2, k), t, expr: k > 0.5 ? "smirk" : "neutral", look: [lerp(-0.8, 0.1, k), 0], headRx: 0.06 }); } });

  const leverTimes = [W("E1", 3), W("E1", 3) + 0.22, W("E1", 4) + 0.16];
  const leverV = (t) => { let v = 0; for (const b of leverTimes) if (t > b && t < b + 0.15) v = 1; return v; };
  S("e2", W("E1", 2), W("E2", 0), lampR, [[0, [3.1, 1.75, 2.15], [1.5, 1.32, 0.85], 34], [1, [2.8, 1.65, 1.85], [1.5, 1.32, 0.85], 34]], { trans: whip(1, 0.28), amb: "lampnight", dof: { ap: 0.03, max: 0.01 },
    do(t) { lampR.mood("night"); const v = leverV(t); lampR.setLamp(v ? 0.03 : 0.95); lampR.handle.rotation.x = v ? 0.55 : -0.5;
      lampR.leverG.updateWorldMatrix(true, false);
      const p = lampR.handle.localToWorld(_v.set(0, 0.5, 0)).toArray();
      reach(lampR.keeper, { x: 2.2, z: 0.15, ry: -1.1, t, expr: "smirk" }, "armL", p); } });
  leverTimes.forEach((b) => { cue("lever_clunk", b, { gain: 0.95 }); cue("morse_tone", b + 0.01, { dur: 0.15, gain: 0.5 }); });
  hit(leverTimes[2], 0.18);

  const san = W("E2", 1) - 0.02;
  S("e3", W("E2", 0), W("E3", 0), lampR, [[0, [0, 3.0, 6.1], [0, 3.05, 0], 40], [1, [0, 3.0, 5.5], [0, 3.05, 0], 40]], { trans: diss(0.1), amb: "lampnight", sway: 1.4, grade: { bloom: 0.5, thresh: 1.4 },
    do(t) { lampR.mood("night"); lampR.setLamp(0.08); lampR.morse.visible = true; lampR.morse.position.set(P ? -0.82 : -1.65, 3.0, 3.0); lampR.morse.scale.setScalar(P ? 0.5 : 1);
      lampR.glyphs.forEach((g, i) => { const on = t > san + i * 0.085; const k = on ? E.back(clamp((t - san - i * 0.085) / 0.12)) : 0; g.m.visible = on; g.h.visible = on; g.m.scale.setScalar(Math.max(0.001, k)); });
      lampR.keeper.pose({ visible: false }); } });
  [0, 1, 2, 3, 4].forEach((i) => cue("morse_tone", san + i * 0.085, { dur: i === 3 ? 0.12 : 0.06, gain: 0.8 }));
  cue("impact_big", san, { gain: 0.9 }); hit(san, 0.8); cue("reveal_braam", san + 0.02, { gain: 0.85 });

  // climb the tower
  S("e4", W("E3", 0), W("E3", 3), seaNight, [[0, [20, 6, 30], [0, 16, 0], 42], [1, [12, 37.5, 17], [0, 37, 1], 42]], { trans: whip(1, 0.3, 1.0, "y"), amb: "seanight", ease: "io",
    do(t) { seaNight.setLamp(1, beamA(t) * 1.2); seaNight.keeperG.root.visible = true; seaNight.keeperG.pose({ x: 1.7, y: seaNight.galY + 0.24, z: 2.62, ry: 0.55, t, expr: "smirk", look: [0, 0.1], armL: [-0.28, 1.5, 0.42], armR: [0.28, 1.5, 0.42] }); } });
  cue("rise_whoosh", W("E3", 0), { dur: WE("E3", 2) - W("E3", 0) + 0.2 }); cue("wind_height", W("E3", 2) - 0.1, { dur: 1.5 });

  // over his shoulder: the whole strait. Patrol lights sit left and right.
  const patrolN = [P ? -90 : -150, 0, 58], patrolS = [P ? 90 : 150, 0, 58];
  const setStraitShips = (t, pN, pS, opt = {}) => { const [a, b] = seaNight.patrols; a.visible = pN; b.visible = pS; a.scale.setScalar(3.4); b.scale.setScalar(3.4); a.position.set(patrolN[0] + Math.sin(t * 0.4) * 6, 0, patrolN[2]); b.position.set(patrolS[0] + Math.sin(t * 0.4 + 2) * 6, 0, patrolS[2]); a.userData.siren(t); b.userData.siren(t + 0.3); seaNight.smugglers.forEach((s, i) => { s.visible = true; s.scale.setScalar(2.2); s.position.set((opt.smX ?? -320) - i * 42, 0, 62); }); };
  S("e5", W("E3", 3), W("E4", 0), seaNight, [[0, [-1.98, 37.9, 1.5], [9.5, 25, 40], 54], [1, [-2.35, 38.5, 0.8], [8.5, 23, 40], 62]], { trans: diss(0.14), amb: "seawide", ease: "io", grade: { exposure: 1.4 }, pcam: [[0, [-1.98, 37.9, 1.5], [30, 28, 25], 50], [1, [-2.3, 38.6, 1.0], [30, 26, 25], 58]],
    do(t) { seaNight.hideHalo = true; seaNight.setLamp(1, Math.PI / 2 + 0.18); seaNight.lampLight.intensity = 16; seaNight.keeperG.root.visible = true; seaNight.keeperG.pose({ x: 0.1, y: seaNight.galY + 0.24, z: 3.05, ry: 0, t, expr: "smirk", armL: [-0.28, 1.86, 0.42], armR: [0.28, 1.86, 0.42] }); setStraitShips(t, true, true); seaNight.patrols[0].scale.setScalar(P ? 2.4 : 1.5); seaNight.patrols[1].scale.setScalar(P ? 2.4 : 1.5); seaNight.patrols[0].position.set(P ? 82 : -38, 0, P ? 22 : 58); seaNight.patrols[1].position.set(P ? 44 : 42, 0, P ? 73 : 58); } });
  cue("wide_swell", W("E3", 3) + 0.05, { dur: 2.2 }); cue("siren_far", W("E3", 7), { dur: 1.2, pan: -0.5, gain: 0.3 }); cue("siren_far", W("E3", 8) - 0.05, { dur: 1.1, pan: 0.5, gain: 0.3 });

  const blinks = (id, n, gap = 0.26) => { const t0 = W(id, 0) - 0.02; return Array.from({ length: n }, (_, i) => t0 + i * gap); };
  const b1 = blinks("E4", 1), b2 = blinks("E5", 2), b3 = blinks("E6", 3);
  const god = (x, z, y = 250) => [[0, [x - 8, y, z + 222], [x, 6, z + 20], 34], [1, [x + 6, y - 14, z + 204], [x, 6, z + 20], 34]];
  const labelPop = (m, t, t0, x, z, s = P ? 1.15 : 1.5) => { m.visible = t > t0; const k = E.back(clamp((t - t0) / 0.24)); m.scale.setScalar(Math.max(0.001, k) * s); m.position.set(x, 40 + (1 - k) * -24, z); m.rotation.set(-0.72, 0, 0); };
  const ringAt = (t, x, z, t0, r = P ? 36 : 46) => { seaNight.ring.visible = t > t0; seaNight.ring.position.set(x, 0.7, z); const k = E.out(clamp((t - t0) / 0.28)); const s = r * k * (1 + Math.sin(t * 5) * 0.02); seaNight.ring.scale.set(s, s, 1); };
  S("e6", W("E4", 0), W("E5", 0), seaNight, god(P ? -42 : -62, 40), { trans: whip(-1, 0.26, 0.5), amb: "seawide", grade: { bloom: 1.0, exposure: 1.22 },
    do(t) { seaNight.noMotes = true; seaNight.sea.u.glint.value = 0.2; seaNight.setLamp(blinkLevel(t, b1), 1.9 + Math.sin(t * 0.3) * 0.2); setStraitShips(t, true, false); const lt = W("E4", 2); ringAt(t, patrolN[0], patrolN[2], lt); labelPop(seaNight.labels.utara, t, W("E4", 4) - 0.18, patrolN[0], patrolN[2] - 52); } });
  S("e7", W("E5", 0), W("E6", 0), seaNight, god(P ? 42 : 62, 40), { trans: whip(1, 0.26, 0.5), amb: "seawide", grade: { bloom: 1.0, exposure: 1.22 },
    do(t) { seaNight.noMotes = true; seaNight.sea.u.glint.value = 0.2; seaNight.setLamp(blinkLevel(t, b2), 1.3 + Math.sin(t * 0.3) * 0.2); setStraitShips(t, false, true); const lt = W("E5", 2); ringAt(t, patrolS[0], patrolS[2], lt); labelPop(seaNight.labels.selatan, t, W("E5", 4) - 0.18, patrolS[0] - (P ? 12 : 0), patrolS[2] - 52); } });
  S("e8", W("E6", 0), W("E7", 0), seaNight, [[0, [0, 270, 200], [0, 6, 12], 38], [1, [0, 252, 182], [0, 6, 12], 38]], { trans: diss(0.14), amb: "seawide", grade: { bloom: 0.62, exposure: 1.22 },
    do(t, u, l) { seaNight.noMotes = true; seaNight.sea.u.glint.value = 0.2; seaNight.setLamp(blinkLevel(t, b3), 0.3); setStraitShips(t, false, false, { smX: lerp(-300, -200, clamp(l / 1.7)) }); const rt = W("E6", 2) - 0.05; const k = E.out(clamp((t - rt) / 0.4)); seaNight.route.visible = t > rt; seaNight.route.scale.set(Math.max(0.01, 700 * k), 1, 2.2); seaNight.route.position.set(-350 + 350 * k, 0.8, 58); labelPop(seaNight.labels.aman, t, W("E6", 3) - 0.14, 0, -62, P ? 1.15 : 1.5); seaNight.labels.aman.material.emissiveIntensity = 2.2; } });
  [b1, b2, b3].forEach((list, g) => list.forEach((b) => { cue("relay_clack", b, { gain: 0.72 }); cue("morse_tone", b, { dur: 0.15, gain: 0.8 }); }));
  cue("alarm_blip", W("E4", 2) - 0.02, { pan: -0.55 }); cue("alarm_blip", W("E5", 2) - 0.02, { pan: 0.55 }); cue("alarm_thud", W("E4", 4) - 0.18, { pan: -0.35 }); cue("alarm_thud", W("E5", 4) - 0.18, { pan: 0.35 }); cue("safe_chord", W("E6", 2) - 0.05, { gain: 0.9 });

  // convoy under the beam
  S("e9", W("E7", 0), W("E7", 7), seaNight, [[0, [31, 2.6, 71], [12, 5.0, 56], 46], [1, [25, 3.2, 70], [4, 6, 56], 46]], { trans: whip(-1, 0.3), amb: "seanight", grade: { exposure: 1.32 },
    do(t, u, l) { seaNight.smugglers.forEach((s, i) => { s.visible = true; s.scale.setScalar(1.2); s.position.set(-42 + l * 12 - i * 32 + 56, Math.sin(t + i) * 0.14, 56); s.rotation.z = Math.sin(t * 0.8 + i) * 0.02; }); seaNight.setLamp(1, 1.42 + Math.sin(l * 0.8) * 0.2); } });
  cue("ship_engine_pass", W("E7", 0), { dur: 2.4, pan0: -0.3, pan1: 0.5, gain: 0.75 }); cue("beam_sweep", W("E7", 2), { dur: 1.5 });

  // sunrise, innocent
  S("e10", W("E7", 7), W("F1", 0), lampR, [[0, [2.2, 2.75, 5.3], [-1.05, 2.25, 1.2], 38], [1, [1.3, 2.6, 4.7], [-1.1, 2.25, 1.2], 38]], { trans: diss(0.3), amb: "lampdawn",
    do(t, u, l) { lampR.mood("dawn"); lampR.setLamp(0.12); const rub = Math.sin(t * 9); reach(lampR.keeper, { x: -1.9, z: 1.45, ry: 1.55, t, expr: "bliss", headRy: -0.6, headRz: rub * 0.03, headRx: -0.05 }, "armR", [-0.98 + rub * 0.2, 2.38 + Math.cos(t * 9) * 0.12, 1.02 + rub * 0.12]); lampR.rag.visible = true; attachToHand(lampR.rag, lampR.keeper); lampR.rag.rotation.set(rub * 0.3, 1, 0.4);
      lampR.sparkles.slice(0, 3).forEach((s, i) => { const q = (l * 0.9 + i * 0.33) % 1; s.visible = true; const a = i * 2.4; s.position.set(-0.8 + Math.cos(a) * 0.65, 2.75 + Math.sin(a) * 0.75, 1.66); s.scale.setScalar(Math.sin(q * Math.PI)); s.rotation.z = t * 1.8 + i; }); } });
  cue("rag_squeak", W("E7", 8), { dur: 1.1, gain: 0.8 }); cue("rooster_far", W("E7", 12), { gain: 0.25 }); cue("dawn_swell", W("E7", 8), { dur: 2.6 }); cue("sparkle", W("E7", 10), { gain: 0.6 });

  // ===================================== F. THE POINT =====================================
  S("f1", W("F1", 0), W("F2", 0), lampR, [[0, [-0.75, 2.05, 3.65], [-1.72, 2.02, 1.82], 34], [1, [-1.05, 2.03, 3.3], [-1.72, 2.05, 1.82], 34]], { trans: whip(1, 0.26), amb: "lampdawn", dof: { ap: 0.02, max: 0.008 },
    do(t) { lampR.mood("dawn"); const k = sstep(W("F1", 2), W("F1", 3), t); lampR.keeper.pose({ x: -1.72, z: 1.82, ry: lerp(-0.2, 0.42, k), t, expr: k > 0.45 ? "smirk" : "happy", look: [lerp(-0.1, 0.45, k), 0.05] }); } });

  const slam2 = W("F2", 3) - 0.02;
  S("f2", W("F2", 0), W("F2", 6), lampR, [[0, [1.0, 2.0, 5.3], [-0.9, 2.2, 1.6], 38], [1, [0.8, 1.95, 4.75], [-0.9, 2.22, 1.6], 38]], { trans: diss(0.1), amb: "lampdawn", pcam: [[0, [-1.5, 2.2, 6.1], [-1.75, 2.85, 1.5], 40], [1, [-1.55, 2.15, 5.7], [-1.75, 2.85, 1.5], 40]],
    do(t) { lampR.mood("dawn"); const k = popIn(t, slam2, 0.24); lampR.plus.visible = t > slam2 - 0.01; lampR.plus.scale.setScalar(Math.max(0.001, k) * (P ? 0.64 : 0.68)); lampR.plus.position.set(P ? -1.75 : 0.1, (P ? 4.05 : 2.3) + (1 - k) * 3, P ? 1.7 : 2.1); lampR.plus.rotation.set(-0.05, 0.12, -0.02); lampR.keeper.pose({ x: -1.95, z: 1.5, ry: 0.5, t, expr: "sly", look: P ? [0.1, 0.65] : [0.75, 0.1], armR: [0.55, 1.32, 0.45], armL: ARM.hip[0], headRz: -0.06, ry: P ? 0.1 : 0.5 }); } });
  cue("impact_big", slam2, { gain: 0.72 }); hit(slam2, 0.55); cue("brass_stab", slam2 + 0.02, { note: "sly" });

  S("f3", W("F2", 6), W("F3", 0), seaDawn, [[0, [90, 18, 40], [0, 24, 0], 40], [1, [56, 24, 84], [0, 28, 0], 40]], { trans: whip(1, 0.3), amb: "seadawn", ease: "io",
    do(t) { seaDawn.gulls.slice(0, 3).forEach((g, i) => { g.visible = true; g.position.set(40 + i * 10, 28 + i * 3, 50 - t % 10 - i * 7); g.rotation.y = 2.3; g.userData.flap(t + i, 1); }); } });
  cue("wide_swell", W("F2", 6), { dur: 2.3, gain: 0.9 }); cue("seagull", W("F2", 8), { pan: 0.3, gain: 0.45 });

  // Harbour at dusk: a ship made it. Everyone cheers. Nobody looks at the tower.
  const cheer = (t) => { [[-5.2, 2.3, 0.3], [-3.0, 3.5, 0.1], [-0.9, 2.5, 0], [1.3, 3.8, -0.1], [3.4, 2.4, -0.15], [5.6, 3.5, -0.3], [7.8, 2.4, -0.3]].forEach(([x, z, ry], i) => { const b = Math.abs(Math.sin(t * 7.2 + i * 1.1)); harborDusk.people[i].pose({ x: P ? 0.6 + (x - 1.3) * 0.52 : x, z, ry, t: t + i, expr: "joy", hop: b * 0.3, armL: [-0.6, 2.0 + b * 0.1, 0.1], armR: [0.6, 2.0 + b * 0.1, 0.1], headRx: -0.08, blink: false }); }); };
  S("f4", W("F3", 0), W("F3", 3) + 0.1, harborDusk, [[0, [-40, 5, 72], [8, 7, 18], 38], [1, [-32, 5.4, 64], [8, 8, 18], 38]], { trans: diss(0.22), amb: "harbordusk",
    do(t) { cheer(t); } });
  S("f4b", W("F3", 3) + 0.1, W("F3", 7) + 0.1, harborDusk, [[0, [2, 2.9, 12.8], [1, 2.3, 2.5], 40], [1, [1, 2.8, 11.2], [1, 2.4, 2.5], 40]], { trans: whip(-1, 0.26), amb: "harbordusk", grade: { exposure: 0.84 },
    do(t) { cheer(t); harborDusk.cargo.visible = false; } });
  cue("ship_horn_near", W("F3", 0) + 0.02, { dur: 1.6, pan: 0.2 }); cue("crowd_cheer", W("F3", 2), { dur: 2.2 }); cue("seagull", W("F3", 5), { pan: -0.4, gain: 0.5 });

  S("f5", W("F3", 7) + 0.1, W("F4", 0), harborDusk, [[0, [36, 3.2, 3.2], [82, 26, 620], 30], [1, [36.2, 3.2, 3.2], [89.5, 42, 620], 5.8]], { trans: whip(1, 0.28), amb: "harbordusk", ease: "io", dof: null,
    do(t) { cheer(t); } });
  cue("distant_tension", W("F3", 8), { dur: 2.4 }); cue("beam_sweep", W("F3", 10), { dur: 1.3, gain: 0.6 });

  // Loop: land precisely on the opening frame of the video
  S("z", W("F4", 0), dur, office, [[0, [-3.0, 2.2, 2.4], [-0.45, 2.0, -0.7], 42], [1, [-2.6, 2.3, 1.7], [-0.4, 2.05, -0.7], 40]], { trans: whip(1, 0.3), sway: 0, amb: "office", ease: "out", pcam: [[0, [-3.0, 2.2, 2.4], [-0.45, 1.67, -0.7], 42], [1, [-2.6, 2.3, 1.7], [-0.4, 1.72, -0.7], 40]],
    do(t) { keeperBored(t); } });
  cue("loop_tick", dur - 0.12, { gain: 0.5 });

  // link, auto-generate transition whooshes
  shots.forEach((s, i) => { s.prev = shots[i - 1]; s.next = shots[i + 1]; });
  shots.forEach((s, i) => {
    if (!s.trans || i === 0) return;
    if (s.trans.type === "whip") cue("whoosh", s.t0 - s.trans.d * 0.5, { dur: s.trans.d, dir: s.trans.dir, big: s.trans.d > 0.27 ? 1 : 0 });
    else if (s.trans.type === "push") cue("whoosh_push", s.t0 - s.trans.d * 0.5, { dur: s.trans.d + 0.1 });
    else if (s.trans.d >= 0.14) cue("air_soft", s.t0 - s.trans.d * 0.5, { dur: s.trans.d + 0.15 });
  });

  const words = [];
  timing.lines.forEach((l) => { const tok = l.text.split(/\s+/); l.words.forEach((w, i) => words.push({ ...w, w: tok.length === l.words.length ? tok[i] : w.w })); });
  const captions = chunk(words, dur);
  const shake = (t) => { let v = 0; for (const [t0, a] of impacts) if (t > t0 && t < t0 + 0.6) v += a * Math.exp(-(t - t0) * 9); return v; };
  const acts = [{ t: 0, act: "comic" }, { t: line.B1.s, act: "warm" }, { t: line.C1.s, act: "suspense" }, { t: line.D1.s, act: "busy" }, { t: line.E1.s - 0.42, act: "none" }, { t: line.E2.e + 0.1, act: "tension" }, { t: line.F1.s, act: "sly" }];
  return { shots, captions, dur, cues, shake, fadeAt: () => ({ a: 0, c: [0, 0, 0] }), acts, ending: "loop" };
}

// 1-2 words on screen, split at punctuation: same reading rhythm as the reference
function chunk(words, dur) {
  const out = [];
  let i = 0;
  while (i < words.length) {
    const a = words[i];
    let t = a.w, e = a.e, j = i + 1;
    const endsA = /[,.?!]$/.test(a.w);
    if (!endsA && j < words.length && a.w.length + words[j].w.length <= 11 && words[j].s - a.e < 0.12) { t += " " + words[j].w; e = words[j].e; j++; }
    out.push({ t, s: a.s, e });
    i = j;
  }
  for (let k = 0; k < out.length - 1; k++) out[k].e = Math.min(out[k + 1].s, out[k].e + 0.45);
  out[out.length - 1].e = dur + 1;
  return out;
}
