// The port: quay, warehouses, customs house, crane, water. Day for the "problem", dusk for the payoff.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, makeSky, makeSea, shaft, halo, sun, lamp, gradientEnv, drawTex, textLines, plasterTex, woodTex, brickTex, tileTex, rockTex, dust, wob, ink } from "./kit.js";
import { Actor } from "./actor.js";
import { CAST } from "./cast.js";
import { makeShip, makeGull } from "./set_sea.js";

const MOODS = {
  day: { top: 0x2a7fc4, mid: 0x7cc0e6, hor: 0xdff0ee, sunDir: [-0.5, 0.75, 0.55], sunCol: 0xfff2d8, sunGlow: 0.5, clouds: 0.6, cloudCol: 0xffffff, cloudShade: 0xa4b8d0, deep: 0x125f7c, shallow: 0x2d9aa8, sky: 0xbfe2ee, fog: 0xdff0ee, glint: 1.0, foam: 0xf4fbfb, keyC: 0xfff0d8, keyI: 3.3, hemi: [0xcfe7ff, 0x8a7a60, 1.1], env: [0xcfe9ff, 0xa8cfe6, 0x5a6a60], envI: 0.5, grade: { exposure: 1.0, tint: [1.0, 1.0, 0.98], sat: 1.05, bloom: 0.42, thresh: 1.45, edgeColor: [0.2, 0.19, 0.2] }, lit: false },
  dusk: { top: 0x20305e, mid: 0xc76d6e, hor: 0xffa35e, sunDir: [-0.4, 0.05, 0.9], sunCol: 0xff9a50, sunGlow: 1.2, clouds: 0.56, cloudCol: 0xffb070, cloudShade: 0x6a4a6a, deep: 0x213a5e, shallow: 0x7a5468, sky: 0xe88c64, fog: 0xf49a64, glint: 1.7, foam: 0xffdcc0, keyC: 0xff9c5a, keyI: 3.0, hemi: [0xc08ab0, 0x3a2a3a, 0.85], env: [0xffb080, 0xa06070, 0x2a2438], envI: 0.5, grade: { exposure: 1.02, tint: [1.05, 0.97, 0.92], sat: 1.08, bloom: 0.6, thresh: 1.25, edgeColor: [0.22, 0.13, 0.15] }, lit: true },
};

function window2(parent, x, y, z, ry, lit, w = 1, h = 1.5) {
  const g = group(parent, x, y, z); g.rotation.y = ry;
  box(w + 0.2, h + 0.2, 0.1, M(0xe9e2d0, { r: 0.8 }), 0, 0, 0, g);
  box(w, h, 0.12, lit ? new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 3.4, 1.5), toneMapped: false }) : M(0x1c2c3a, { r: 0.12, m: 0.55 }), 0, 0, 0.02, g, { cast: false });
  box(0.05, h, 0.14, M(0xe9e2d0), 0, 0, 0.02, g, { cast: false }); box(w, 0.05, 0.14, M(0xe9e2d0), 0, 0, 0.02, g, { cast: false });
  return g;
}

export function buildHarbor(engine, moodName) {
  const mo = MOODS[moodName];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(mo.hor);
  scene.environment = gradientEnv(engine.r, ...mo.env);
  scene.environmentIntensity = mo.envI;
  const sky = makeSky(scene, mo);
  const sea = makeSea(scene, { ...mo, z: 0, y: -1.3, far: 1100, chop: 0.55, size: 2400, islands: [] });
  scene.add(new THREE.HemisphereLight(...mo.hemi));
  sun(scene, mo.keyC, mo.keyI, mo.sunDir[0] * 110, mo.sunDir[1] * 110 + 8, mo.sunDir[2] * 110, 0, 0, -3, 58, 4096);

  // Quay: road along X, water starts at z>8
  const conc = new THREE.MeshStandardMaterial({ map: tileTex("#a39c8b", null, 121, 40, 4, 4), roughness: 0.92 });
  box(420, 2, 60, conc, 0, -1, -22, scene);
  box(420, 0.4, 0.5, M(0x4a4a4a, { r: 0.7 }), 0, 0.2, 7.75, scene);
  for (let x = -100; x < 130; x += 9) { const b = group(scene, x, 0, 7.2); cyl(0.2, 0.26, 0.6, M(0x24262c, { r: 0.4, m: 0.55 }), 0, 0.3, 0, b, 12); sph(0.27, M(0x24262c, { r: 0.4, m: 0.55 }), 0, 0.62, 0, b); }
  // road strip + kerb
  box(420, 0.04, 6.4, M(0x4b4c4f, { r: 0.92 }), 0, 0.03, -2.8, scene, { cast: false });
  box(420, 0.2, 0.25, M(0xd8d2c0, { r: 0.8 }), 0, 0.1, -6, scene);
  for (let x = -100; x < 130; x += 6) box(2.6, 0.02, 0.16, M(0xe8d9a0, { r: 0.8 }), x, 0.06, -2.8, scene, { cast: false });

  const lit = mo.lit;
  // === warehouse row ===
  const wh = (x, w, h, col, seed, label) => {
    const g = group(scene, x, 0, -13);
    box(w, h, 12, new THREE.MeshStandardMaterial({ map: brickTex(col, "#7a6c58", seed, w / 8, h / 6), roughness: 0.9 }), 0, h / 2, 0, g);
    const rf = box(w + 0.8, 0.4, 12.6, M(0x3c434a, { r: 0.55, m: 0.4 }), 0, h + 0.2, 0, g);
    box(w, 0.5, 0.2, M(0xe2dac4, { r: 0.8 }), 0, h - 0.8, 6.05, g);
    const big = box(w * 0.34, h * 0.54, 0.2, M(0x2f5e5b, { r: 0.5, m: 0.3 }), -w * 0.18, h * 0.27, 6.05, g);
    for (let i = 0; i < 6; i++) box(w * 0.32, 0.03, 0.04, M(0x24494a, { r: 0.5 }), -w * 0.18, 0.3 + i * (h * 0.09), 6.17, g, { cast: false });
    const n = Math.floor(w / 3.2);
    for (let i = 0; i < n; i++) window2(g, (i - (n - 1) / 2) * 3.0, h - 2.4, 6.08, 0, lit && i % 3 === 0);
    if (label) {
      const signTex = drawTex(1024, 180, (c, cw, ch) => { c.fillStyle = "#efe6cf"; c.fillRect(0, 0, cw, ch); c.strokeStyle = "#3a2c1c"; c.lineWidth = 10; c.strokeRect(8, 8, cw - 16, ch - 16); textLines(c, [{ t: label, size: 112 }], cw, ch, { color: "#3a2c1c" }); });
      plane(Math.min(w * 0.72, 11), 1.5, new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.75 }), w * 0.08, h * 0.62, 6.17, g);
    }
    return g;
  };
  wh(-54, 24, 9.5, "#8a5a3c", 123, "GUDANG 3");
  wh(-29, 22, 11, "#a1673f", 125, "GUDANG 2");
  wh(30, 22, 10, "#8a5a3c", 127, "GUDANG 1");
  wh(58, 26, 12, "#7c5238", 129, "GUDANG 4");

  // === BEA CUKAI: colonial white with red roof, columns and clock ===
  const cu = group(scene, 0, 0, -13.5);
  const wall = new THREE.MeshStandardMaterial({ map: plasterTex("#ece4d0", 131, 2, 1), roughness: 0.85 });
  box(36, 11, 13, wall, 0, 5.5, 0, cu);
  const rf = mesh(new THREE.CylinderGeometry(0.01, 25, 7, 4, 1), M(0xa7442f, { r: 0.72 }), 0, 14.4, 0, cu); rf.rotation.y = Math.PI / 4; rf.scale.set(1.05, 1, 0.38);
  box(37, 0.5, 14, M(0xdcd3bc, { r: 0.8 }), 0, 11.2, 0, cu);
  // portico
  const po = group(cu, 0, 0, 7.1);
  box(15, 0.7, 4.0, M(0xd8cfba, { r: 0.8 }), 0, 0.35, 0, po);
  box(15.5, 1.1, 4.4, M(0xece4d0, { r: 0.8 }), 0, 8.3, 0, po);
  const ped = new THREE.Shape(); ped.moveTo(-8.2, 0); ped.lineTo(8.2, 0); ped.lineTo(0, 3); ped.closePath();
  const pg = new THREE.ExtrudeGeometry(ped, { depth: 3.8, bevelEnabled: false });
  mesh(pg, M(0xe3dac5, { r: 0.8 }), 0, 8.85, -1.9, po);
  const nameT = drawTex(1400, 200, (c, w, h) => { c.fillStyle = "#e3dac5"; c.fillRect(0, 0, w, h); textLines(c, [{ t: "BEA CUKAI", size: 170, spacing: 18 }], w, h, { color: "#7c5a1e" }); });
  plane(9, 1.28, new THREE.MeshStandardMaterial({ map: nameT, roughness: 0.6 }), 0, 9.4, 1.92, po);
  for (let i = 0; i < 6; i++) { const x = -6.2 + i * 2.48; cyl(0.42, 0.52, 7.0, M(0xf2ead8, { r: 0.75 }), x, 4.2, 1.5, po, 24); cyl(0.66, 0.66, 0.3, M(0xe0d7c2, { r: 0.8 }), x, 7.72, 1.5, po, 18); cyl(0.66, 0.68, 0.28, M(0xe0d7c2, { r: 0.8 }), x, 0.84, 1.5, po, 18); }
  box(3, 5.6, 0.2, M(0x4c2e18, { r: 0.45 }), 0, 3.5, -1.9, po);
  [-3.6, 3.6].forEach((x) => window2(po, x, 4.2, -1.9, 0, lit, 1.8, 3.4));
  for (let i = 0; i < 5; i++) box(13.8 - i * 0.05, 0.16, 0.36, M(0xd8cfba, { r: 0.85 }), 0, 0.06 + i * 0.13, 2.1 + (4 - i) * 0.33, po, { cast: false });
  for (let ix = 0; ix < 4; ix++) for (const s of [-1, 1]) { window2(cu, s * (10.5 + ix * 2.2), 3.2, 6.56, 0, lit && ix % 2 === 0, 1.3, 2.2); window2(cu, s * (10.5 + ix * 2.2), 8, 6.56, 0, lit && ix % 2 === 1, 1.3, 2.2); }
  // clock tower
  const ct = group(cu, 0, 11, -1);
  box(4.4, 9.2, 4.4, wall, 0, 4.6, 0, ct);
  const cone = mesh(new THREE.ConeGeometry(3.6, 3.2, 4), M(0xa7442f, { r: 0.72 }), 0, 10.8, 0, ct); cone.rotation.y = Math.PI / 4;
  const face = cyl(1.3, 1.3, 0.1, new THREE.MeshBasicMaterial({ color: lit ? new THREE.Color(4.6, 4.2, 3) : new THREE.Color(0.95, 0.92, 0.84), toneMapped: !lit ? false : false }), 0, 6.6, 2.24, ct, 36); face.rotation.x = Math.PI / 2; face.castShadow = false;
  const hM = group(ct, 0, 6.6, 2.32), hH = group(ct, 0, 6.6, 2.34);
  box(0.09, 1.1, 0.03, M(0x14100c), 0, 0.5, 0, hM, { cast: false }); box(0.13, 0.7, 0.03, M(0x14100c), 0, 0.32, 0, hH, { cast: false });
  const fp = cyl(0.05, 0.05, 3.4, M(0x444), 8, 12.6, 5, cu, 8);
  const flag = group(cu, 8, 13.6, 5);
  const fl1 = box(1.8, 0.5, 0.02, M(0xc62b23, { r: 0.8 }), 0.9, 0.5, 0, flag, { cast: false }); const fl2 = box(1.8, 0.5, 0.02, M(0xf6f4ec, { r: 0.8 }), 0.9, 0, 0, flag, { cast: false });

  // === Container stacks & crane ===
  const cols = [0xb4482e, 0x2d6e7a, 0xd09b3a, 0x4f6b3a, 0x8a2d22, 0x35507a];
  for (let i = 0; i < 18; i++) {
    const c = rbox(6.1, 2.5, 2.5, 0.05, M(cols[(i * 5) % 6], { r: 0.75 }), 86 + (i % 3) * 6.3, 1.25 + (Math.floor(i / 9) * 2.5), -4 + (Math.floor(i / 3) % 3) * 2.7, scene);
    for (let k = 0; k < 8; k++) box(0.05, 2.1, 0.03, M(0x000000, { r: 1, op: 0.2 }), -2.7 + k * 0.77, 0, 1.26, c, { cast: false });
  }
  const crane = group(scene, 74, 0, -2);
  const yel = M(0xdda522, { r: 0.55, m: 0.25 });
  [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([x, z]) => box(0.7, 22, 0.7, yel, x, 11, z, crane));
  box(9, 0.8, 9, yel, 0, 22, 0, crane);
  box(44, 1.1, 1.1, yel, -6, 26, 0, crane);
  box(0.8, 5, 0.8, yel, 0, 24, 0, crane);
  box(2.4, 2.2, 2.4, M(0xeee8d8, { r: 0.6 }), -18, 24.6, 0, crane);
  cyl(0.05, 0.05, 14, M(0x18181a), -22, 18.5, 0, crane, 6);
  box(6.1, 2.5, 2.5, M(0xd09b3a, { r: 0.7 }), -22, 11, 0, crane);

  // === street props ===
  const lampPosts = [];
  for (let x = -60; x < 62; x += 15) {
    const g = group(scene, x, 0, -5.4);
    cyl(0.07, 0.11, 5.2, M(0x20252a, { r: 0.45, m: 0.5 }), 0, 2.6, 0, g, 10);
    const b = sph(0.26, new THREE.MeshBasicMaterial({ color: lit ? new THREE.Color(16, 11, 5.5) : new THREE.Color(1.1, 1.05, 0.9), toneMapped: false }), 0, 5.4, 0, g, { cast: false });
    if (lit) { halo(g, 3.6, 0xffc88a, 0, 5.4, 0, 0.75); lamp(g, 0xffb670, 40, 0, 5.1, 0.4, 18); }
    lampPosts.push(g);
  }
  // crates and nets
  [[-14, 3.4], [-12.8, 4.6], [-16, 4.4], [14, 3.8], [15.4, 5.2], [18, 3.4], [-40, 4.2], [42, 4.1]].forEach(([x, z], i) => {
    const c = rbox(1.5, 1.2, 1.5, 0.03, new THREE.MeshStandardMaterial({ map: woodTex("#a07a48", 141 + i, 1, 1, 4), roughness: 0.85 }), x, 0.6, z, scene); c.rotation.y = i * 0.7;
    if (i % 3 === 0) { const d = rbox(1.1, 0.9, 1.1, 0.03, new THREE.MeshStandardMaterial({ map: woodTex("#8a6638", 151 + i, 1, 1, 4), roughness: 0.85 }), x + 0.2, 1.65, z, scene); d.rotation.y = i; }
  });
  // becak: a three-wheel pedicab, local colour
  const becak = group(scene, -24, 0, -3.6);
  const seat = rbox(1.9, 1.4, 1.5, 0.2, M(0xc53b2e, { r: 0.45 }), 0, 1.4, 0, becak);
  const canopy = mesh(new THREE.SphereGeometry(1.25, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0x225f5e, { r: 0.6 }), -0.12, 2.1, 0, becak); canopy.scale.set(1.0, 0.72, 0.85);
  [[0.1, 0.9], [0.1, -0.9]].forEach(([x, z]) => { const w = mesh(new THREE.TorusGeometry(0.58, 0.06, 8, 24), M(0x1a1c1f, { r: 0.45 }), x, 0.6, z, becak); });
  const w3 = mesh(new THREE.TorusGeometry(0.58, 0.06, 8, 24), M(0x1a1c1f, { r: 0.45 }), -2.3, 0.6, 0, becak);
  box(2.2, 0.08, 0.1, M(0x1a1c1f), -1.4, 1.1, 0, becak);
  cyl(0.04, 0.04, 1.0, M(0x1a1c1f), -2.3, 1.4, 0, becak, 8);
  ink(seat, 0.012);

  // Distant lighthouse on the horizon over the water
  const farLH = group(scene, 90, -1.3, 620);
  const bTex = drawTex(64, 512, (g, w, h) => { for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#c23b2c" : "#f3efe3"; g.fillRect(0, (i / 5) * h, w, h / 5 + 1); } });
  const farRock = mesh(new THREE.IcosahedronGeometry(50, 2), M(moodName === "dusk" ? 0x3a2a3c : 0x6a7a70, { r: 1, m: 0 }), 0, -18, 0, farLH); farRock.scale.y = 0.42;
  const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector2(7.5 - i * 0.34, i * 7.6));
  const ft = mesh(new THREE.LatheGeometry(pts, 24), new THREE.MeshStandardMaterial({ map: bTex, roughness: 0.8 }), 0, 0, 0, farLH, { cast: false, recv: false });
  cyl(5.2, 5.4, 5, M(0x30343a), 0, 63, 0, farLH, 18, { cast: false, recv: false });
  const rfL = mesh(new THREE.SphereGeometry(6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0xa42f24), 0, 65.4, 0, farLH, { cast: false }); rfL.scale.y = 0.7;
  const farGlow = sph(3.2, new THREE.MeshBasicMaterial({ color: new THREE.Color(32, 24, 13), toneMapped: false }), 0, 63, 0, farLH, { cast: false, recv: false });
  const farHalo = halo(farLH, 62, 0xffdca0, 0, 63, 0, 1);
  const farBeam = group(farLH, 0, 63, 0);
  const fbS = shaft(farBeam, 1.2, 40, 680, 0xffe6b0, 0.34, 0, 0, 340, 3.4); fbS.rotation.x = -Math.PI / 2;
  farBeam.visible = moodName === "dusk"; farHalo.visible = moodName === "dusk"; farGlow.visible = moodName === "dusk";

  // === ships ===
  const patrol = makeShip(scene, "patrol"); patrol.position.set(-14, -0.7, 14); patrol.scale.setScalar(1.25);
  patrol.userData.siren(0, 0);
  const cargo = makeShip(scene, "cargo"); cargo.visible = moodName === "dusk"; cargo.position.set(6, -0.6, 21); cargo.scale.setScalar(1.05);
  const gulls = [0, 1, 2, 3].map(() => makeGull(scene, 1.3));

  // === people ===
  const people = [];
  const palette = [CAST.staff[0], CAST.staff[1], CAST.staff[2], CAST.sailor, CAST.fisher1, CAST.fisher2, CAST.staff[3]];
  for (let i = 0; i < 7; i++) people.push(new Actor(scene, { ...palette[i], seed: 200 + i * 7 }));
  const customs = new Actor(scene, CAST.customs);

  const motes = dust(scene, 220, 60, 10, 26, 0, 4, 4, 0xffe8c0, 0.05, 41);

  return {
    scene, sky, sea, people, customs, patrol, cargo, becak, gulls, farBeam, farLH, flag,
    grade: mo.grade,
    dof: null,
    reset(t) {
      people.forEach((p) => (p.root.visible = false));
      customs.root.visible = false;
      gulls.forEach((g) => (g.visible = false));
      hH.rotation.z = -1.1; hM.rotation.z = -t * 0.1;
    },
    update(t) {
      sky.set(t); sea.set(t); motes.set(t);
      farBeam.rotation.y = t * 0.6;
      flag.rotation.y = Math.sin(t * 2.4) * 0.14; fl1.rotation.y = Math.sin(t * 5) * 0.08; fl2.rotation.y = Math.sin(t * 5 + 1) * 0.08;
      patrol.position.y = -0.7 + Math.sin(t * 0.9) * 0.08; patrol.rotation.z = Math.sin(t * 0.7) * 0.012;
      cargo.position.y = -0.6 + Math.sin(t * 0.7) * 0.07;
    },
  };
}
