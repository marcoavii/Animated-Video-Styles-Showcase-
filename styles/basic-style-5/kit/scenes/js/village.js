// Basic style 5 world: a bright, saturated low-poly village. Lime grass with long blade strokes, faceted round
// trees, palms with saw-tooth fronds, bamboo fences, woven-wall houses with orange tile roofs and laundry,
// dug ponds with brown dirt walls, a lime rim and blue (or green) water. Warm sun, soft shadows, blue sky with
// big white clouds. Sets return { scene, camFill, grade, dof, reset(t), update(t, shot) } for the engine.
import * as THREE from "three";
import { M, mesh, box, cyl, sph, plane, group, drawTex, rng, gradientEnv, sun, lamp, makeSky, shaft, halo, glow } from "./kit.js";

// ---------- textures
const TX = new Map();
const cached = (k, f) => (TX.has(k) ? TX.get(k) : (TX.set(k, f()), TX.get(k)));
export function grassTex() {
  return cached("grass", () => {
    const t = drawTex(1024, 1024, (g, w, h) => {
      g.fillStyle = "#79c425"; g.fillRect(0, 0, w, h);
      const R = rng(4);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${R() > 0.5 ? "150,215,60" : "70,140,25"},${0.12 + R() * 0.12})`; g.beginPath(); g.ellipse(R() * w, R() * h, 60 + R() * 140, 30 + R() * 80, R() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 1600; i++) {
        const x = R() * w, y = R() * h, l = 14 + R() * 26, a = -0.5 + R() * 0.3;
        g.strokeStyle = R() > 0.5 ? "rgba(170,230,80,.55)" : "rgba(60,125,20,.45)"; g.lineWidth = 2 + R() * 2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
export function dirtTex() {
  return cached("dirt", () => {
    const t = drawTex(512, 512, (g, w, h) => {
      g.fillStyle = "#7d5226"; g.fillRect(0, 0, w, h);
      const R = rng(9);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(${R() > 0.5 ? "150,100,50" : "60,35,15"},.25)`; g.fillRect(0, R() * h, w, 3 + R() * 10); }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(40,22,8,${R() * 0.35})`; g.fillRect(R() * w, R() * h, 2 + R() * 3, 2 + R() * 3); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
export function waterTex(green = false) {
  return cached("water" + green, () => {
    const t = drawTex(512, 512, (g, w, h) => {
      g.fillStyle = green ? "#73b83a" : "#5fb0de"; g.fillRect(0, 0, w, h);
      const R = rng(green ? 3 : 5);
      for (let i = 0; i < 140; i++) {
        const x = R() * w, y = R() * h, s = 10 + R() * 26;
        g.strokeStyle = green ? "rgba(140,200,80,.5)" : "rgba(170,220,250,.65)"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x, y - s * 0.4, x + s, y); g.stroke();
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
function wovenTex(base = "#c9a160", line = "#8f6a33") {
  return cached("woven" + base, () => {
    const t = drawTex(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      g.strokeStyle = line; g.lineWidth = 3;
      for (let i = -h; i < w + h; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
function roofTex() {
  return cached("roof", () => {
    const t = drawTex(256, 256, (g, w, h) => {
      g.fillStyle = "#c7562c"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) { g.fillStyle = "rgba(90,30,10,.45)"; g.fillRect(0, y + 26, w, 6); for (let x = (y / 32) % 2 * 16; x < w; x += 32) { g.fillStyle = "rgba(255,170,120,.18)"; g.fillRect(x, y, 14, 26); } }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
function frondTex() {
  return cached("frond", () => drawTex(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = "#4f8f1e"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    for (let x = 8; x < w - 10; x += 9) {
      const l = (1 - x / w) * 50 + 12;
      g.strokeStyle = x % 18 ? "#6fbf2c" : "#4f9a22"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x + 16, h / 2 - l); g.stroke();
      g.beginPath(); g.moveTo(x, h / 2); g.lineTo(x + 16, h / 2 + l); g.stroke();
    }
  }));
}

// ---------- pieces
const leafMats = [0x3f8f27, 0x52a332, 0x2f7a22, 0x63b23a].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }));
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4322, roughness: 0.9, flatShading: true });
export function tree(parent, x, z, s = 1, seed = 1) {
  const R = rng(seed), g = group(parent, x, 0, z); g.scale.setScalar(s);
  mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6), trunkMat, 0, 1.1, 0, g);
  const n = 4 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const r = 0.8 + R() * 0.6;
    const m = mesh(new THREE.IcosahedronGeometry(r, 1), leafMats[Math.floor(R() * 4)], (R() - 0.5) * 1.6, 2.4 + R() * 1.1, (R() - 0.5) * 1.6, g);
    m.rotation.set(R() * 3, R() * 3, 0); m.scale.y = 0.8;
  }
  return g;
}
export function bush(parent, x, z, s = 1, seed = 2) {
  const R = rng(seed), g = group(parent, x, 0, z); g.scale.setScalar(s);
  for (let i = 0; i < 3; i++) { const m = mesh(new THREE.IcosahedronGeometry(0.45 + R() * 0.25, 1), leafMats[Math.floor(R() * 4)], (R() - 0.5) * 0.9, 0.3, (R() - 0.5) * 0.6, g); m.scale.y = 0.75; }
  return g;
}
const frondMat = () => new THREE.MeshStandardMaterial({ map: frondTex(), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85 });
export function palm(parent, x, z, s = 1, seed = 3, lean = 0.15) {
  const R = rng(seed), g = group(parent, x, 0, z); g.scale.setScalar(s); g.rotation.y = R() * 6;
  const tm = new THREE.MeshStandardMaterial({ color: 0xbfa06c, roughness: 0.9 });
  let y = 0, px = 0;
  for (let i = 0; i < 7; i++) { const seg = mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.75, 8), tm, px, y + 0.37, 0, g); seg.rotation.z = -lean * (i / 7); y += 0.72; px += lean * 0.12 * i; }
  const top = group(g, px, y, 0);
  const fm = frondMat();
  for (let i = 0; i < 11; i++) {
    const f = group(top); f.rotation.y = (i / 11) * Math.PI * 2 + R() * 0.3;
    const p = mesh(new THREE.PlaneGeometry(2.4, 0.6, 6, 1), fm, 1.15, 0, 0, f, { cast: true });
    const pos = p.geometry.attributes.position; for (let k = 0; k < pos.count; k++) { const xx = pos.getX(k) + 1.2; pos.setY(k, pos.getY(k)); pos.setZ(k, -0.12 * xx * xx); }
    p.geometry.computeVertexNormals();
    p.rotation.x = Math.PI / 2 + (R() - 0.5) * 0.5; f.rotation.z = 0.25;
  }
  return g;
}
export function fence(parent, x0, z0, x1, z1, h = 0.9) {
  const g = group(parent), bm = M(0xc9a35a, { r: 0.8 });
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 0.6)), a = Math.atan2(z1 - z0, x1 - x0);
  for (let i = 0; i <= n; i++) cyl(0.04, 0.04, h, bm, x0 + ((x1 - x0) * i) / n, h / 2, z0 + ((z1 - z0) * i) / n, g, 8);
  for (const y of [h * 0.45, h * 0.85]) { const r = cyl(0.03, 0.03, L, bm, (x0 + x1) / 2, y, (z0 + z1) / 2, g, 8); r.rotation.z = Math.PI / 2; r.rotation.y = -a; }
  return g;
}
export function house(parent, x, z, ry = 0, s = 1) {
  const g = group(parent, x, 0, z); g.rotation.y = ry; g.scale.setScalar(s);
  const wall = new THREE.MeshStandardMaterial({ map: wovenTex(), roughness: 0.9 });
  wall.map.repeat.set(4, 2);
  box(5, 2.4, 3.4, wall, 0, 1.4, 0, g);
  box(5.2, 0.4, 3.6, M(0x7a5532), 0, 0.2, 0, g);
  box(0.9, 1.7, 0.08, M(0x3a2414), -0.8, 1.15, 1.72, g);
  box(0.8, 0.7, 0.08, M(0x2a1a10), 1.2, 1.6, 1.72, g);
  const rm = new THREE.MeshStandardMaterial({ map: roofTex(), roughness: 0.75 }); rm.map.repeat.set(4, 3);
  for (const sgn of [-1, 1]) { const r = box(5.8, 0.1, 2.5, rm, 0, 3.15, sgn * 1.05, g); r.rotation.x = sgn * 0.62; }
  // laundry line
  const cols = [0x2a7fd0, 0xe85aa0, 0x2ec4b6, 0xf2d03b, 0x8a5ad8];
  cyl(0.015, 0.015, 4.6, M(0x333333), 0, 2.55, 2.1, g, 6).rotation.z = Math.PI / 2;
  cols.forEach((c, i) => plane(0.55, 0.62, M(c, { r: 0.9, side: THREE.DoubleSide }), -1.8 + i * 0.9, 2.2, 2.1, g));
  return g;
}
// a dug pond: hole in the ground, dirt walls, lime rim, water (or empty dirt, or green algae water)
export function pond(parent, x, z, w, d, o = {}) {
  const { depth = 0.9, water = "blue", rim = 0.28, level = 0.62 } = o;
  const g = group(parent, x, 0, z);
  const dm = new THREE.MeshStandardMaterial({ map: dirtTex(), roughness: 0.95 });
  const wallM = dm.clone(); wallM.map = dirtTex().clone(); wallM.map.needsUpdate = true; wallM.map.repeat.set(w / 2, depth / 1.2);
  plane(w, d, dm, 0, -depth, 0, g, -Math.PI / 2);
  plane(w, depth, wallM, 0, -depth / 2, -d / 2, g, 0, 0);
  plane(w, depth, wallM, 0, -depth / 2, d / 2, g, 0, Math.PI);
  plane(d, depth, wallM, -w / 2, -depth / 2, 0, g, 0, Math.PI / 2);
  plane(d, depth, wallM, w / 2, -depth / 2, 0, g, 0, -Math.PI / 2);
  // lime rim: bright top, dirt sides
  const top = M(0x8fd431, { r: 0.85 }), side = new THREE.MeshStandardMaterial({ map: dirtTex(), roughness: 0.95 });
  const mats = [side, side, top, side, side, side];
  const rimH = 0.16;
  for (const [rx, rz, rw, rd] of [[0, -d / 2 - rim / 2, w + rim * 2, rim], [0, d / 2 + rim / 2, w + rim * 2, rim], [-w / 2 - rim / 2, 0, rim, d], [w / 2 + rim / 2, 0, rim, d]]) mesh(new THREE.BoxGeometry(rw, rimH, rd), mats, rx, rimH / 2, rz, g);
  let wm = null;
  if (water !== "none") {
    const tex = waterTex(water === "green").clone(); tex.needsUpdate = true; tex.repeat.set(w / 3, d / 3);
    wm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, metalness: 0.0 });
    plane(w, d, wm, 0, -depth * (1 - level), 0, g, -Math.PI / 2, 0, { recv: true });
  }
  g.userData = { w, d, depth, water: wm, top: -depth * (1 - level) };
  return g;
}
// ground with holes cut where ponds go
export function ground(scene, holes = [], size = 160) {
  const s = new THREE.Shape(); s.moveTo(-size / 2, -size / 2); s.lineTo(size / 2, -size / 2); s.lineTo(size / 2, size / 2); s.lineTo(-size / 2, size / 2); s.lineTo(-size / 2, -size / 2);
  for (const [x, z, w, d] of holes) { const h = new THREE.Path(); h.moveTo(x - w / 2, -(z - d / 2)); h.lineTo(x - w / 2, -(z + d / 2)); h.lineTo(x + w / 2, -(z + d / 2)); h.lineTo(x + w / 2, -(z - d / 2)); h.lineTo(x - w / 2, -(z - d / 2)); s.holes.push(h); }
  const tex = grassTex().clone(); tex.needsUpdate = true; tex.repeat.set(0.25, 0.25);
  const m = mesh(new THREE.ShapeGeometry(s), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), 0, 0, 0, scene, { cast: false });
  m.rotation.x = -Math.PI / 2;
  return m;
}
// tall grass blades near the camera: the reference always has blurry blades in the foreground
export function blades(scene, cx, cz, w, d, n = 2500, seed = 7, avoid = []) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([-0.05, 0, 0, 0.05, 0, 0, 0, 1, 0], 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.9 });
  const im = new THREE.InstancedMesh(geo, mat, n);
  const R = rng(seed), o = new THREE.Object3D(), c = new THREE.Color();
  let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) {
    const x = cx + (R() - 0.5) * w, z = cz + (R() - 0.5) * d;
    if (avoid.some(([ax, az, aw, ad]) => Math.abs(x - ax) < aw / 2 + 0.35 && Math.abs(z - az) < ad / 2 + 0.35)) continue;
    o.position.set(x, 0, z); o.rotation.set((R() - 0.5) * 0.5, R() * 6, (R() - 0.5) * 0.6); o.scale.set(1, 0.12 + R() * 0.22, 1); o.updateMatrix();
    im.setMatrixAt(k, o.matrix); im.setColorAt(k, c.setHSL(0.25 + R() * 0.04, 0.62, 0.26 + R() * 0.14)); k++;
  }
  im.count = k; im.castShadow = false; im.receiveShadow = true;
  scene.add(im);
  return im;
}
export function path(parent, x, z, w, l, ry = 0) {
  const tex = dirtTex().clone(); tex.needsUpdate = true; tex.repeat.set(w / 2, l / 2);
  const p = box(w, 0.14, l, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), x, 0.07, z, parent); p.rotation.y = ry; return p;
}

// ---------- the village set
export function buildVillage(engine, o = {}) {
  const { ponds = [[0, 0, 5, 3.6, { water: "blue" }]], seed = 1, houses = [[-5, -12, 0.15]], sunDir = [0.5, 0.75, 0.4] } = o;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8cc6ee);
  scene.fog = new THREE.Fog(0xcfe8dc, 30, 110);
  scene.environment = gradientEnv(engine.r, 0xbfe2ff, 0xd9eec4, 0x5c8a2a);
  scene.environmentIntensity = 0.55;
  const sky = makeSky(scene, { top: 0x2f86d8, mid: 0x75b8ec, hor: 0xdff1fb, sunDir, sunCol: 0xfff4d8, sunGlow: 0.9, sunSize: 0.9985, clouds: 0.62, cloudCol: 0xffffff, cloudShade: 0xc8d6e6 });
  ground(scene, ponds.map(([x, z, w, d]) => [x, z, w, d]));
  const P = ponds.map(([x, z, w, d, po]) => pond(scene, x, z, w, d, po || {}));
  blades(scene, 0, 2, 26, 20, 3200, seed, ponds.map(([x, z, w, d]) => [x, z, w + 0.6, d + 0.6]));
  houses.forEach(([x, z, ry]) => house(scene, x, z, ry));
  const R = rng(seed + 11);
  for (let i = 0; i < 16; i++) { const a = R() * Math.PI * 2, r = 13 + R() * 16; tree(scene, Math.cos(a) * r, -Math.abs(Math.sin(a)) * r - 4, 0.9 + R() * 0.7, i + 3); }
  for (let i = 0; i < 6; i++) palm(scene, -14 + i * 6 + R() * 2, -9 - R() * 8, 1.0 + R() * 0.35, i + 31);
  for (let i = 0; i < 14; i++) bush(scene, -12 + R() * 24, -5 - R() * 7, 0.8 + R() * 0.6, i + 51);
  fence(scene, -9, -7.5, 9, -7.5);
  scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x5d8a2a, 1.25));
  const sd = new THREE.Vector3(...sunDir).normalize();
  const key = sun(scene, 0xfff0d2, 3.1, sd.x * 30, sd.y * 30, sd.z * 30, 0, 0, 0, 18, 4096);
  const camFill = lamp(scene, 0xffffff, 0, 0, 2, 0, 8); camFill.userData.base = 0;
  return {
    scene, camFill, sky, ponds: P, key,
    grade: {},
    dof: null, // the reference is sharp; close-ups add a light dof on the shot: { dof: { ap: 0.004, max: 0.004 } }
    reset() {}, update(t) { sky.set(t); P.forEach((p) => { const m = p.userData.water; if (m) m.map.offset.set(t * 0.01, t * 0.006); }); },
  };
}

// ---------- underwater close-up: green water, slanted light shafts, glowing plankton, low-poly rocks
export function buildUnderwater(engine, o = {}) {
  const scene = new THREE.Scene();
  const bg = drawTex(16, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#245f20"); gr.addColorStop(0.6, "#164214"); gr.addColorStop(1, "#0c2c0c"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.background = bg;
  scene.fog = new THREE.Fog(0x1e5a1e, 4, 22);
  scene.add(new THREE.HemisphereLight(0xc8f0a0, 0x1a3a10, 1.5));
  const key = sun(scene, 0xe8ffc8, 1.6, 3, 10, 4, 0, 0, 0, 10, 2048);
  // light shafts: long soft additive quads
  const rays = group(scene);
  const rayTex = drawTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(220,255,170,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const R = rng(o.seed ?? 5);
  for (let i = 0; i < 7; i++) {
    const m = plane(3.0 + R() * 3.0, 30, new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0.32 + R() * 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), -9 + i * 3 + R(), 4, -6 - R() * 4, rays);
    m.rotation.z = 0.42;
  }
  // plankton: glowing green spheres
  const orbs = [];
  const om = new THREE.MeshStandardMaterial({ color: 0x7ad83a, emissive: 0x3c9a14, emissiveIntensity: 0.7, roughness: 0.15 });
  for (let i = 0; i < 18; i++) { const s = mesh(new THREE.SphereGeometry(0.16 + R() * 0.2, 24, 16), om, (R() - 0.5) * 7, -1 + R() * 7, -1 - R() * 7, scene, { cast: false }); s.userData.b = s.position.clone(); s.userData.p = R() * 6; orbs.push(s); halo(s, 1.4 + R() * 0.6, 0x9cff5a, 0, 0, 0, 0.55); }
  // rocks
  const rm = new THREE.MeshStandardMaterial({ color: 0x7d5b34, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 14; i++) { const r = mesh(new THREE.DodecahedronGeometry(0.35 + R() * 0.4, 0), rm, (R() - 0.5) * 6, -2.4 + R() * 0.5, -0.5 - R() * 4, scene); r.rotation.set(R() * 3, R() * 3, R() * 3); }
  const camFill = lamp(scene, 0xffffff, 0, 0, 2, 0, 8); camFill.userData.base = 0;
  return {
    scene, camFill, key, orbs,
    grade: { bloom: 0.7, thresh: 0.9, vignette: 0.55 },
    dof: null,
    reset() {}, update(t) { orbs.forEach((s) => { const b = s.userData.b, p = s.userData.p; s.position.set(b.x + Math.sin(t * 0.4 + p) * 0.15, b.y + Math.sin(t * 0.6 + p * 2) * 0.2, b.z); }); },
  };
}

// ---------- rice: clumps of thin blades on a grid inside a shallow plot (use pond(..., { depth: 0.3, level: 0.8 }))
// rice(parent, pondGroup, { spacing, seed }) -> { set({ h: height in m, ripe: 0..1 }) }; ripe turns blades golden and grows hanging grain heads
export function rice(parent, plot, o = {}) {
  const { spacing = 0.38, seed = 9 } = o;
  const { w, d, top } = plot.userData;
  const blade = [], R = rng(seed);
  for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, lean = 0.12 + R() * 0.1, wd = 0.022; const cx = Math.cos(a), cz = Math.sin(a); blade.push(-wd * cz, 0, wd * cx, wd * cz, 0, -wd * cx, cx * lean, 1, cz * lean); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(blade, 3)); geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5fb52a, side: THREE.DoubleSide, roughness: 0.85 });
  const nx = Math.floor((w - 0.2) / spacing), nz = Math.floor((d - 0.2) / spacing);
  const g = group(plot, 0, top, 0);
  const im = new THREE.InstancedMesh(geo, mat, nx * nz);
  const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshStandardMaterial({ color: 0xe0b43a, roughness: 0.7, flatShading: true }), nx * nz);
  const o3 = new THREE.Object3D(); let k = 0;
  const base = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = -w / 2 + 0.1 + spacing * (i + 0.5) + (R() - 0.5) * 0.06, z = -d / 2 + 0.1 + spacing * (j + 0.5) + (R() - 0.5) * 0.06;
    base.push([x, z, R() * 6, 0.85 + R() * 0.3]);
    o3.position.set(x, 0, z); o3.rotation.set(0, base[k][2], 0); o3.scale.set(1, 1, 1); o3.updateMatrix(); im.setMatrixAt(k, o3.matrix); k++;
  }
  im.castShadow = true; im.receiveShadow = true; heads.castShadow = true;
  g.add(im, heads);
  let last = null;
  const green = new THREE.Color(0x5fb52a), gold = new THREE.Color(0xc9b83a);
  return {
    g,
    set({ h = 0.4, ripe = 0 } = {}) {
      const key = h.toFixed(3) + "|" + ripe.toFixed(3); if (key === last) return; last = key;
      mat.color.copy(green).lerp(gold, ripe);
      heads.visible = ripe > 0.05;
      base.forEach(([x, z, ry, s], i) => {
        o3.position.set(x, 0, z); o3.rotation.set(0, ry, 0); o3.scale.set(1 + h * 0.4, h * s, 1 + h * 0.4); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix);
        o3.position.set(x + Math.cos(ry) * 0.06, h * s * 0.92, z + Math.sin(ry) * 0.06); o3.scale.set(0.8 + ripe * 0.5, 1.6 + ripe, 0.8 + ripe * 0.5); o3.rotation.set(0.6, ry, 0); o3.updateMatrix(); heads.setMatrixAt(i, o3.matrix);
      });
      im.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    },
  };
}
