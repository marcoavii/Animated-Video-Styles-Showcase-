// Open water: lighthouse island, ships, gulls, coasts. Built once per mood so each sky/sea/light is tuned on its own.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, makeSky, makeSea, shaft, halo, sun, lamp, rng, gradientEnv, drawTex, textLines, plasterTex, woodTex, rockTex, glow, ink, inkAll, text3D, dust, wob, clamp, spot, brickTex } from "./kit.js";
import { Actor } from "./actor.js";
import { CAST } from "./cast.js";

const MOODS = {
  day: { top: 0x2a7fc4, mid: 0x7cc0e6, hor: 0xd8eef0, sunDir: [0.55, 0.62, 0.3], sunCol: 0xfff4dc, sunGlow: 0.5, clouds: 0.62, cloudCol: 0xffffff, cloudShade: 0x9fb4cc, deep: 0x0f5d7e, shallow: 0x2a9db0, sky: 0xbfe2ee, fog: 0xd8eef0, glint: 1.1, foam: 0xf4fbfb, gain: 1.05, keyC: 0xfff0d8, keyI: 3.0, hemi: [0xbfe0ff, 0x8a7a60, 1.05], env: [0xcfe9ff, 0xa8cfe6, 0x4d6a78], envI: 0.55, chop: 1, grade: { exposure: 1.0, tint: [1, 1, 0.98], sat: 1.06, bloom: 0.42, thresh: 1.5, lift: [0, 0.004, 0.008], edgeColor: [0.2, 0.2, 0.24] } },
  night: { top: 0x050a1c, mid: 0x0d1a38, hor: 0x24406b, sunDir: [-0.2, 0.42, -0.95], sunCol: 0xcfe0ff, sunGlow: 0.14, sunSize: 0.9992, clouds: 0.38, cloudCol: 0x4a5c80, cloudShade: 0x121c34, stars: 1, deep: 0x041226, shallow: 0x0d2b4a, sky: 0x1d3660, fog: 0x1c3358, glint: 0.9, foam: 0x7f9cc4, gain: 1, keyC: 0xa8c0ff, keyI: 1.5, hemi: [0x5a7ab8, 0x141c2e, 0.85], env: [0x2b3f6c, 0x18243f, 0x060a14], envI: 0.5, chop: 0.8, grade: { exposure: 1.1, tint: [0.92, 0.98, 1.12], sat: 1.05, bloom: 0.8, thresh: 0.9, lift: [0.004, 0.008, 0.018], edgeColor: [0.3, 0.3, 0.4] } },
  dawn: { top: 0x2b4f8a, mid: 0xe29a8c, hor: 0xffcf8a, sunDir: [0.75, 0.1, 0.6], sunCol: 0xffc070, sunGlow: 1.1, clouds: 0.5, cloudCol: 0xffd0a8, cloudShade: 0x9a6a7e, deep: 0x214a6e, shallow: 0x7a6a78, sky: 0xeab090, fog: 0xf3b58a, glint: 1.6, foam: 0xffe8d0, gain: 1, keyC: 0xffbd80, keyI: 2.6, hemi: [0xffc8a8, 0x4a4060, 0.7], env: [0xffd0a0, 0xc08070, 0x30304a], envI: 0.5, chop: 0.8, grade: { exposure: 1.02, tint: [1.04, 0.98, 0.92], sat: 1.08, bloom: 0.72, thresh: 1.1, edgeColor: [0.25, 0.16, 0.16] } },
};

const shaftUp = (s) => s;

function rockLump(parent, r, x, y, z, seed, mat, sy = 0.6) {
  const g = new THREE.IcosahedronGeometry(r, 3);
  const p = g.attributes.position; const R = rng(seed);
  const seeds = [R() * 9, R() * 9, R() * 9];
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const d = v.clone().normalize();
    const n = Math.sin(d.x * 4.1 + seeds[0]) * Math.cos(d.y * 3.3 + seeds[1]) * Math.sin(d.z * 5.2 + seeds[2]) * 0.16 + Math.sin(d.x * 11 + seeds[1]) * Math.sin(d.z * 9 + seeds[0]) * 0.06;
    v.addScaledVector(d, r * n);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const m = mesh(g, mat, x, y, z, parent); m.scale.y = sy;
  return m;
}

export function makeShip(parent, kind) {
  const g = group(parent);
  if (kind === "patrol") {
    const hull = new THREE.Shape(); hull.moveTo(-5.6, 0); hull.lineTo(5.0, 0); hull.lineTo(6.6, 1.4); hull.lineTo(-5.9, 1.3); hull.closePath();
    const h = new THREE.ExtrudeGeometry(hull, { depth: 3.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 }); h.translate(0, 0, -1.6);
    mesh(h, M(0xd8d6cb, { r: 0.55 }), 0, 0, 0, g);
    box(11.8, 0.3, 3.3, M(0x2a64a8, { r: 0.5 }), 0.2, 0.58, 0, g);
    rbox(4.4, 1.7, 2.5, 0.1, M(0xe9e6db, { r: 0.55 }), -1.0, 2.2, 0, g);
    rbox(2.4, 1.2, 2.1, 0.1, M(0xe9e6db, { r: 0.55 }), -0.4, 3.6, 0, g);
    box(2.45, 0.42, 2.14, M(0x10202e, { r: 0.15, m: 0.4 }), -0.4, 3.75, 0, g);
    cyl(0.07, 0.09, 2.4, M(0x31343a), -0.5, 5.2, 0, g, 10);
    const pr = sph(0.17, new THREE.MeshBasicMaterial({ color: new THREE.Color(16, 1.4, 1), toneMapped: false }), -0.75, 6.4, 0, g, { cast: false });
    const pb = sph(0.17, new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 2.6, 18), toneMapped: false }), -0.25, 6.4, 0, g, { cast: false });
    const hr = halo(g, 3.2, 0xff3a2c, -0.75, 6.4, 0, 0.9), hb = halo(g, 3.2, 0x3a6aff, -0.25, 6.4, 0, 0.9);
    const lr = lamp(g, 0xff3a2c, 14, -0.75, 6, 0, 20), lb = lamp(g, 0x3a6aff, 14, -0.25, 6, 0, 20);
    // deck rail
    for (let i = -5; i <= 5; i++) cyl(0.03, 0.03, 0.6, M(0x31343a), i, 1.7, 1.45, g, 6);
    box(10.4, 0.04, 0.04, M(0x31343a), 0, 2, 1.45, g);
    g.userData.siren = (t, on = 1) => { const a = Math.sin(t * 13) > 0 ? 1 : 0.06, b = 1.06 - a; pr.visible = true; pr.material.color.setRGB(16 * a * on, 1.4 * a * on, a * on); pb.material.color.setRGB(b * on, 2.6 * b * on, 18 * b * on); hr.material.opacity = a * on; hb.material.opacity = b * on; lr.intensity = 14 * a * on; lb.intensity = 14 * b * on; };
  } else if (kind === "smuggler") {
    const hull = new THREE.Shape(); hull.moveTo(-6.6, 0); hull.lineTo(5.6, 0); hull.lineTo(7.4, 2.1); hull.lineTo(-7, 1.8); hull.closePath();
    const h = new THREE.ExtrudeGeometry(hull, { depth: 3.6, bevelEnabled: false }); h.translate(0, 0, -1.8);
    mesh(h, M(0x4a505a, { r: 0.7 }), 0, 0, 0, g);
    box(13.2, 0.14, 3.66, M(0x8a3a2a, { r: 0.75 }), 0, 0.64, 0, g);
    rbox(2.3, 2.2, 2.6, 0.08, M(0x3c4047, { r: 0.75 }), -4.2, 3.0, 0, g);
    box(2.36, 0.5, 2.66, M(0x0e1218, { r: 0.2 }), -4.2, 3.4, 0, g);
    const R = rng(9);
    for (let i = 0; i < 12; i++) { const c = rbox(1.1, 0.9, 1.1, 0.04, M([0x6f5335, 0x57422b, 0x3e6d5a, 0x7a3f2c][i % 4], { r: 0.8 }), -1.9 + (i % 4) * 1.5, 2.3 + Math.floor(i / 8) * 0.95, ((i >> 2) % 2 ? 0.7 : -0.7), g); c.rotation.y = R() * 0.3; }
    cyl(0.1, 0.13, 3.8, M(0x1e1f22), -4.3, 5.5, 0, g, 10);
    const w = sph(0.09, new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 8, 3), toneMapped: false }), -3.2, 3.5, 1.32, g, { cast: false });
    halo(g, 1.0, 0xffb060, -3.2, 3.5, 1.32, 0.6);
    // thin rope line of the wake handled by shot
  } else if (kind === "fishing") {
    // outrigger perahu: slim hull, bamboo floats
    const pts = []; for (let i = 0; i <= 18; i++) { const u = i / 18; pts.push(new THREE.Vector2(Math.sin(u * Math.PI) * 0.72 + 0.02, (u - 0.5) * 7.2)); }
    const hg = new THREE.LatheGeometry(pts, 18); hg.rotateZ(Math.PI / 2);
    const hull = mesh(hg, new THREE.MeshStandardMaterial({ map: woodTex("#7a2d22", 45, 1, 1, 5), roughness: 0.65 }), 0, 0.42, 0, g); hull.scale.set(1, 0.7, 1.18);
    box(6.1, 0.08, 1.1, M(0x4a2c17, { r: 0.8 }), 0, 0.78, 0, g);
    box(5.6, 0.16, 1.18, M(0xe0c24a, { r: 0.6 }), 0, 0.62, 0, g);
    [-1.6, 1.6].forEach((x) => { const a = cyl(0.05, 0.05, 6.2, M(0xc9a668, { r: 0.8 }), x, 0.92, 0, g, 8); a.rotation.x = Math.PI / 2; });
    [-1, 1].forEach((s) => { const f = cyl(0.11, 0.11, 6.4, M(0xd8bd80, { r: 0.8 }), 0, 0.3, s * 3.05, g, 10); f.rotation.z = Math.PI / 2; });
    [-1.6, 1.6].forEach((x) => [-1, 1].forEach((s) => { const a = cyl(0.04, 0.04, 0.72, M(0xc9a668, { r: 0.8 }), x, 0.62, s * 3.05, g, 6); }));
    const lampG = group(g, 2.6, 0.84, 0);
    cyl(0.03, 0.03, 1.6, M(0x2a2018), 0, 0.8, 0, lampG, 8);
    const gl = sph(0.13, new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 8.5, 3.6), toneMapped: false }), 0, 1.5, 0, lampG, { cast: false });
    const hl = halo(lampG, 2.6, 0xffbb6a, 0, 1.5, 0, 0.75);
    const ll = lamp(lampG, 0xffb060, 12, 0, 1.5, 0, 12);
    g.userData.lantern = (on) => { gl.visible = !!on; hl.visible = !!on; ll.visible = !!on; };
    g.userData.deck = 0.82;
    const fl = lamp(g, 0xffd9a0, 0, 0, 3.4, -3.2, 12); g.userData.faceLight = (v) => { fl.intensity = v; };
  } else if (kind === "cargo") {
    const hull = new THREE.Shape(); hull.moveTo(-11, 0); hull.lineTo(10, 0); hull.lineTo(13, 4.2); hull.lineTo(-11.5, 3.8); hull.closePath();
    const h = new THREE.ExtrudeGeometry(hull, { depth: 6, bevelEnabled: false }); h.translate(0, 0, -3);
    mesh(h, M(0x2e4f73, { r: 0.65 }), 0, 0, 0, g);
    box(22.5, 0.4, 6.06, M(0x8a2d22, { r: 0.7 }), -0.4, 0.8, 0, g);
    rbox(4.4, 3.6, 5, 0.1, M(0xefeadf, { r: 0.6 }), -7.8, 5.8, 0, g);
    for (let i = 0; i < 3; i++) box(0.9, 0.7, 0.05, M(0x162030, { r: 0.2 }), -9.2 + i * 1.3, 6.5, 2.52, g);
    cyl(0.5, 0.6, 2.8, M(0xb23a2e, { r: 0.6 }), -8.2, 8.8, 0, g, 18);
    const cols = [0xb4482e, 0x2d6e7a, 0xd09b3a, 0x4f6b3a];
    for (let i = 0; i < 10; i++) rbox(3.1, 2.1, 2.5, 0.04, M(cols[i % 4], { r: 0.7 }), -3.5 + (i % 5) * 3.3, 5.1 + Math.floor(i / 5) * 2.15, 1.3, g), rbox(3.1, 2.1, 2.5, 0.04, M(cols[(i + 2) % 4], { r: 0.7 }), -3.5 + (i % 5) * 3.3, 5.1 + Math.floor(i / 5) * 2.15, -1.3, g);
  }
  return g;
}

export function makeGull(parent, scale = 1) {
  const g = group(parent);
  const body = sph(0.3, M(0xf6f4ec, { r: 0.7 }), 0, 0, 0, g); body.scale.set(1.5, 0.75, 0.78);
  ink(body, 0.012);
  const head = sph(0.19, M(0xf8f6ee, { r: 0.7 }), 0.46, 0.18, 0, g); ink(head, 0.012);
  const beak = mesh(new THREE.ConeGeometry(0.06, 0.24, 10), M(0xe8a92a, { r: 0.5 }), 0.7, 0.16, 0, g); beak.rotation.z = -Math.PI / 2 - 0.1;
  [-1, 1].forEach((s) => { const e = sph(0.034, M(0x0c0a08, { r: 0.2 }), 0.52, 0.24, s * 0.15, g, { cast: false }); });
  const wings = [-1, 1].map((s) => {
    const w = group(g, 0, 0.1, s * 0.16);
    const shape = new THREE.Shape(); shape.moveTo(-0.32, 0); shape.lineTo(0.3, 0); shape.lineTo(0.12, 1.15); shape.lineTo(-0.34, 1.0); shape.closePath();
    const wg = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }); wg.rotateX(Math.PI / 2 * s);
    const m = mesh(wg, M(0xe9e8e0, { r: 0.75, side: THREE.DoubleSide }), 0, 0, 0, w);
    const tip = group(w, 0, 0, 0); box(0.5, 0.03, 0.24, M(0x2a2a30), -0.1, 0, s * 1.04, w, { cast: false });
    return { w, s };
  });
  const legs = [-1, 1].map((s) => { const l = cyl(0.016, 0.016, 0.32, M(0xe8a92a), -0.03, -0.32, s * 0.09, g, 6); return l; });
  const folds = [-1, 1].map((s) => { const f = sph(0.26, M(0xd8d7d0, { r: 0.75 }), -0.14, 0.04, s * 0.19, g); f.scale.set(1.55, 0.58, 0.3); f.rotation.z = 0.2; ink(f, 0.01); const tipG = sph(0.1, M(0x2a2a30, { r: 0.7 }), -0.34, -0.06, 0, f, { cast: false }); tipG.scale.set(1.6, 0.8, 1.05); return f; });
  g.scale.setScalar(scale);
  g.userData.flap = (t, amp = 1, perched = false) => {
    wings.forEach(({ w, s }) => { w.visible = !perched; w.rotation.x = s * (Math.sin(t * 9) * 0.65 * amp - 0.1); });
    folds.forEach((f) => (f.visible = perched));
    legs.forEach((l) => (l.visible = perched));
  };
  return g;
}

export function buildSea(engine, moodName) {
  const mo = MOODS[moodName];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(mo.hor);
  scene.environment = gradientEnv(engine.r, ...mo.env);
  scene.environmentIntensity = mo.envI;
  const sky = makeSky(scene, mo);
  const coast = [[0, 0, 22]];
  const sea = makeSea(scene, { ...mo, islands: coast, far: 1400, size: 3000 });
  scene.add(new THREE.HemisphereLight(...mo.hemi));
  const key = sun(scene, mo.keyC, mo.keyI, mo.sunDir[0] * 150, mo.sunDir[1] * 150 + 10, mo.sunDir[2] * 150, 0, 8, 0, 42, 4096);
  key.shadow.bias = -0.0005;
  if (moodName === "night") { const fillN = new THREE.DirectionalLight(0x8fa8e8, 1.9); fillN.position.set(0.4, 0.5, 1); scene.add(fillN); }

  // ===== Island =====
  const isl = group(scene);
  const rockMat = new THREE.MeshStandardMaterial({ map: rockTex("#6f6c64", 19), roughness: 0.95 });
  const rockMat2 = new THREE.MeshStandardMaterial({ map: rockTex("#7d776b", 23), roughness: 0.95 });
  rockLump(isl, 21, 0, -1.5, 0, 3, rockMat, 0.3);
  rockLump(isl, 13, 13, -0.6, 8, 5, rockMat2, 0.34);
  rockLump(isl, 11, -13, -0.8, 7, 7, rockMat, 0.32);
  rockLump(isl, 9, -8, -0.4, -11, 8, rockMat2, 0.42);
  rockLump(isl, 5, 19, 0, -9, 10, rockMat, 0.5);
  rockLump(isl, 3, 23, -0.1, 11, 12, rockMat2, 0.7);
  rockLump(isl, 2.4, -22, -0.2, 2, 14, rockMat2, 0.75);
  const grass = rockLump(isl, 13.5, 0, 2.2, 0, 16, new THREE.MeshStandardMaterial({ color: 0x6a8a52, roughness: 0.95 }), 0.26);

  // tower
  const towerH = 30, towerR0 = 3.5, towerR1 = 2.25;
  const bandTex = drawTex(64, 1024, (g, w, h) => { const n = 5; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? "#c23b2c" : "#f3efe3"; g.fillRect(0, (i / n) * h, w, h / n + 1); } for (let i = 0; i < 2400; i++) { g.fillStyle = `rgba(30,20,15,${Math.random() * 0.04})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  bandTex.wrapS = THREE.RepeatWrapping;
  const tower = group(isl, 0, 4.5, 0);
  const pr = []; for (let i = 0; i <= 26; i++) { const u = i / 26; pr.push(new THREE.Vector2(towerR0 + (towerR1 - towerR0) * Math.pow(u, 0.8), u * towerH)); }
  mesh(new THREE.LatheGeometry(pr, 56), new THREE.MeshStandardMaterial({ map: bandTex, roughness: 0.72 }), 0, 0, 0, tower);
  cyl(4.3, 4.6, 1.4, new THREE.MeshStandardMaterial({ map: rockTex("#8a8478", 29), roughness: 0.9 }), 0, 0.5, 0, tower, 40);
  // tower windows
  [[6, 0.4], [13, 2.4], [20, 4.5], [10, 3.6]].forEach(([y, a]) => {
    const r = towerR0 + (towerR1 - towerR0) * Math.pow(y / towerH, 0.8) + 0.03;
    const w = group(tower, Math.sin(a) * r, y, Math.cos(a) * r); w.rotation.y = a;
    box(0.72, 1.2, 0.08, M(0x2a2018), 0, 0, 0, w);
    box(0.54, 1.02, 0.08, moodName === "night" ? new THREE.MeshBasicMaterial({ color: new THREE.Color(5.5, 3.2, 1.1), toneMapped: false }) : M(0x1b2c3a, { r: 0.12, m: 0.5 }), 0, 0, 0.03, w);
  });
  // gallery
  const galY = towerH + 0.1;
  cyl(3.5, 2.6, 0.5, M(0x2a2c30, { r: 0.55, m: 0.4 }), 0, galY, 0, tower, 40);
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; cyl(0.03, 0.03, 1.15, M(0x1d1f22, { r: 0.4, m: 0.5 }), Math.sin(a) * 3.4, galY + 0.8, Math.cos(a) * 3.4, tower, 6); }
  const railT = mesh(new THREE.TorusGeometry(3.4, 0.05, 8, 64), M(0x1d1f22, { r: 0.4, m: 0.5 }), 0, galY + 1.38, 0, tower); railT.rotation.x = Math.PI / 2;
  // lantern room
  const lanY = galY + 0.25;
  cyl(2.0, 2.0, 0.9, M(0x2a2c30, { r: 0.5, m: 0.5 }), 0, lanY + 0.45, 0, tower, 12);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cyl(0.05, 0.05, 2.9, M(0x1d1f22, { r: 0.35, m: 0.7 }), Math.sin(a) * 1.96, lanY + 2.3, Math.cos(a) * 1.96, tower, 8); }
  const glass = cyl(1.92, 1.92, 2.9, new THREE.MeshStandardMaterial({ color: 0xbcd8e8, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false }), 0, lanY + 2.3, 0, tower, 24, { cast: false });
  const roof = mesh(new THREE.SphereGeometry(2.35, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(0xa42f24, { r: 0.45, m: 0.2 }), 0, lanY + 3.72, 0, tower); roof.scale.y = 0.72;
  sph(0.22, M(0xd8ae4c, { r: 0.25, m: 0.9 }), 0, lanY + 5.5, 0, tower);
  // the lamp itself
  const lampY = 4.5 + lanY + 2.3;
  const bulb = sph(0.8, new THREE.MeshBasicMaterial({ color: new THREE.Color(30, 22, 12), toneMapped: false }), 0, lampY, 0, isl, { cast: false });
  const haloA = halo(isl, 16, 0xffdca0, 0, lampY, 0, 1.3);
  const haloB = halo(isl, 44, 0xffc884, 0, lampY, 0, 0.32);
  const beamG = group(isl, 0, lampY, 0);
  const mkBeam = (ry) => { const h = group(beamG); h.rotation.y = ry; const s = shaft(h, 0.5, 26, 460, 0xffe6b0, 0.55, 0, 0, 230, 3.4); s.rotation.x = -Math.PI / 2; s.scale.y = 1; s.geometry.rotateX(0); return s; };
  const beams = [mkBeam(0), mkBeam(Math.PI)];
  beams.forEach((b) => { b.material.uniforms.s.value = 0.55; });
  const lampLight = lamp(isl, 0xffdca0, 700, 0, lampY, 0, 120);

  // tower door + cottage
  const dA = 0.55;
  const doorG = group(tower, Math.sin(dA) * 3.55, 0, Math.cos(dA) * 3.55); doorG.rotation.y = dA;
  box(1.8, 2.9, 0.22, M(0x8a8478, { r: 0.8 }), 0, 1.45, -0.1, doorG);
  box(1.42, 2.52, 0.1, M(0x1c5b5a, { r: 0.55 }), 0, 1.3, 0.05, doorG);
  sph(0.07, M(0xd9b34f, { r: 0.25, m: 0.9 }), 0.5, 1.3, 0.13, doorG);
  // sign by the door
  const cottage = group(isl, -9, 3.6, 3.2); cottage.rotation.y = 0.5;
  box(6.4, 3, 4.2, new THREE.MeshStandardMaterial({ map: plasterTex("#efe8d6", 41), roughness: 0.9 }), 0, 1.5, 0, cottage);
  const rf = mesh(new THREE.CylinderGeometry(0.01, 4.5, 2.1, 4, 1), M(0xa8452f, { r: 0.8 }), 0, 4.0, 0, cottage); rf.rotation.y = Math.PI / 4; rf.scale.set(1.15, 1, 0.82);
  box(1.0, 1.1, 0.1, M(0x263a4a, { r: 0.25 }), 1.5, 1.8, 2.12, cottage);
  box(1.0, 2.0, 0.1, M(0x2d5d60, { r: 0.6 }), -1.3, 1.0, 2.12, cottage);
  // jetty
  const jetty = group(isl, 13, 1.0, 20); jetty.rotation.y = -0.3;
  box(3.2, 0.2, 18, new THREE.MeshStandardMaterial({ map: woodTex("#7a5a3a", 71, 1, 3, 3), roughness: 0.9 }), 0, 0.5, 4, jetty);
  for (let i = -4; i < 13; i += 3) [-1.4, 1.4].forEach((x) => cyl(0.14, 0.17, 3.5, M(0x4a3524), x, -0.9, i, jetty, 10));

  // ===== far coasts: low painted hills =====
  const hill = (x, z, r, sy, col, seed) => rockLump(scene, r, x, -r * sy * 0.15, z, seed, new THREE.MeshStandardMaterial({ color: col, roughness: 1 }), sy);
  const hillA = moodName === "day" ? 0x6f8f70 : moodName === "dawn" ? 0x8a6a78 : 0x13233f;
  const hillB = moodName === "day" ? 0x8ea98e : moodName === "dawn" ? 0xa17a80 : 0x1b2f50;
  [[-330, -560, 300, 0.1, 31], [-20, -620, 260, 0.12, 33], [300, -620, 300, 0.1, 35], [120, 660, 360, 0.09, 37], [-340, 700, 340, 0.1, 39], [520, 700, 320, 0.09, 41], [-820, -640, 360, 0.08, 43], [860, -660, 340, 0.08, 45]].forEach(([x, z, r, sy, s], i) => hill(x, z, r, sy, i % 2 ? hillA : hillB, s));

  // ===== vessels =====
  const fishing = makeShip(scene, "fishing"); fishing.visible = false;
  const fisher1 = new Actor(fishing, CAST.fisher1), fisher2 = new Actor(fishing, CAST.fisher2);
  const patrols = [makeShip(scene, "patrol"), makeShip(scene, "patrol")];
  const smugglers = [makeShip(scene, "smuggler"), makeShip(scene, "smuggler"), makeShip(scene, "smuggler")];
  [...patrols, ...smugglers].forEach((s) => (s.visible = false));
  const gulls = [0, 1, 2, 3, 4].map(() => makeGull(scene, 1.3)); gulls.forEach((g) => (g.visible = false));

  // 3D map labels
  const labels = { utara: text3D("UTARA", 11, 0xe24a36, { e: 0xe24a36, ei: 0.9 }), selatan: text3D("SELATAN", 11, 0xe24a36, { e: 0xe24a36, ei: 0.9 }), aman: text3D("JALAN AMAN", 13, 0x3fdc7c, { e: 0x3fdc7c, ei: 0.45 }) };
  for (const k in labels) { labels[k].visible = false; scene.add(labels[k]); }
  // glowing route line across the strait
  const routeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 5.5, 2.2), toneMapped: false, transparent: true, opacity: 0.9 });
  const route = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 1.6), routeMat); route.visible = false; scene.add(route);
  // danger circles around patrols
  const ringM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 0.45, 0.3), toneMapped: false, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 96), ringM); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.6; ring.visible = false; scene.add(ring);

  // officers marching to the door (day)
  const officers = moodName === "day" ? [new Actor(scene, CAST.officer1), new Actor(scene, CAST.officer2)] : [];
  // keeper silhouette on the gallery
  const keeperG = new Actor(scene, CAST.keeper);

  const motes = moodName === "night" ? dust(scene, 200, 200, 60, 200, 30, 30, 60, 0xbfd4ff, 0.14, 21) : null;

  const set = {
    scene, sky, sea, isl, fishing, fisher1, fisher2, patrols, smugglers, gulls, labels, route, ring, ringM, officers, keeperG, beamG, beams, bulb, haloA, haloB, lampLight, lampY, doorG, tower, galY: 4.5 + galY,
    grade: mo.grade,
    dof: null,
    lampLevel: 1, beamAngle: 0,
    setLamp(level, angle) {
      this.lampLevel = level; this.beamAngle = angle;
      const on = clamp(level);
      bulb.material.color.setRGB(30 * on + 0.5, 22 * on + 0.4, 12 * on + 0.3);
      haloA.material.opacity = on; haloB.material.opacity = on;
      lampLight.intensity = 700 * on;
      beamG.rotation.y = angle;
      beams.forEach((b) => { b.material.uniforms.s.value = 0.55 * on; b.visible = on > 0.01; });
      sea.u.beam.value = on;
      sea.u.beamPos.value.set(0, 0, 0);
      sea.u.beamDir.value.set(Math.sin(angle), 0, Math.cos(angle));
      if (this.hideHalo) { haloA.visible = false; haloB.visible = false; } else { haloA.visible = true; haloB.visible = true; }
    },
    reset(t) {
      fishing.visible = false;
      patrols.forEach((s) => (s.visible = false)); smugglers.forEach((s) => (s.visible = false));
      gulls.forEach((g) => (g.visible = false));
      for (const k in labels) labels[k].visible = false;
      route.visible = false; ring.visible = false; this.noMotes = false; this.hideHalo = false; sea.u.glint.value = mo.glint ?? 1;
      officers.forEach((o) => o.root.visible = false);
      keeperG.root.visible = false;
      const dayLamp = moodName === "day" ? 0 : moodName === "dawn" ? 0.1 : 1;
      this.setLamp(dayLamp, t * 0.6);
    },
    update(t) {
      sky.set(t); sea.set(t); if (motes) { motes.set(t); motes.points.visible = !this.noMotes; }
      beams.forEach((b) => (b.material.uniforms.t.value = t));
    },
  };
  return set;
}
