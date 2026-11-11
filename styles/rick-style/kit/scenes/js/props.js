// Props shared by the island, house and beach sets.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, rng, drawTex, woodTex, ink, inkAll, glow, halo, lamp } from "./kit.js";

// ---------- palm ----------
let FROND_TEX = null;
function frondTex() {
  if (FROND_TEX) return FROND_TEX;
  FROND_TEX = drawTex(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const R = rng(4);
    for (let i = 0; i < 46; i++) {
      const x = 12 + (i / 46) * (w - 30);
      const len = (h * 0.47) * Math.pow(Math.sin(Math.PI * (0.08 + 0.9 * i / 46)), 0.6);
      [-1, 1].forEach((s) => {
        g.strokeStyle = `rgb(${60 + R() * 30},${130 + R() * 40},${50 + R() * 25})`;
        g.lineWidth = 7; g.lineCap = "round";
        g.beginPath(); g.moveTo(x, h / 2); g.quadraticCurveTo(x + 10, h / 2 + s * len * 0.5, x + 26, h / 2 + s * len); g.stroke();
        g.strokeStyle = "rgba(20,40,14,.55)"; g.lineWidth = 1.5; g.stroke();
      });
    }
    g.strokeStyle = "#5a7a2a"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  });
  FROND_TEX.wrapS = FROND_TEX.wrapT = THREE.ClampToEdgeWrapping;
  return FROND_TEX;
}
function frondGeo(L, W, droop) {
  const g = new THREE.PlaneGeometry(1, 1, 14, 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5, v = p.getY(i);
    p.setXYZ(i, u * L, 0.35 * L * u * (1 - u) * 1.4 - droop * u * u, v * W);
  }
  g.computeVertexNormals();
  return g;
}
export function makePalm(parent, x, y, z, h = 7, lean = 0.25, seed = 1, ry = 0) {
  const R = rng(seed);
  const gr = group(parent, x, y, z); gr.rotation.y = ry;
  const trunkMat = M(0x8a6a48, { r: 0.9 }), ringMat = M(0x6e5238, { r: 0.9 });
  const n = 9; let px = 0, py = 0;
  const top = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    const x0 = Math.sin(u0 * 1.4) * lean * h * 0.55, x1 = Math.sin(u1 * 1.4) * lean * h * 0.55;
    const y0 = u0 * h, y1 = u1 * h;
    const r = 0.26 - 0.1 * u0;
    const seg = cyl(r * 0.92, r, Math.hypot(x1 - x0, y1 - y0) * 1.02, i % 2 ? trunkMat : ringMat, (x0 + x1) / 2, (y0 + y1) / 2, 0, gr, 10);
    seg.rotation.z = -Math.atan2(x1 - x0, y1 - y0);
    ink(seg, 0.01);
    top.set(x1, y1, 0);
  }
  const crown = group(gr, top.x, top.y, top.z);
  const fm = new THREE.MeshStandardMaterial({ map: frondTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.75 });
  const k = 9;
  for (let i = 0; i < k; i++) {
    const L = h * (0.42 + R() * 0.12);
    const f = new THREE.Mesh(frondGeo(L, 1.25, L * (0.45 + R() * 0.25)), fm);
    f.castShadow = true; f.rotation.y = (i / k) * Math.PI * 2 + R() * 0.3; f.rotation.z = 0.25 + R() * 0.2;
    crown.add(f);
  }
  for (let i = 0; i < 4; i++) { const c = sph(0.2, M(0x5a6a24, { r: 0.6 }), Math.cos(i * 1.7) * 0.25, -0.25, Math.sin(i * 1.7) * 0.25, crown); ink(c, 0.008); }
  gr.userData.crown = crown;
  return gr;
}

// ---------- stilt house (rumah panggung) ----------
export function makeHouse(parent, x, y, z, ry = 0, o = {}) {
  const { w = 4.4, d = 3.4, wall = "#a8794a", roof = 0x7a3a26, lit = false, s = 1 } = o;
  const g = group(parent, x, y, z); g.rotation.y = ry; g.scale.setScalar(s);
  const post = M(0x5a3a22, { r: 0.85 });
  for (const px of [-w / 2 + 0.2, 0, w / 2 - 0.2]) for (const pz of [-d / 2 + 0.2, d / 2 - 0.2]) cyl(0.11, 0.12, 1.7, post, px, 0.85, pz, g, 8);
  box(w + 0.3, 0.18, d + 0.3, M(0x6a4428, { r: 0.8 }), 0, 1.72, 0, g);
  const wm = new THREE.MeshStandardMaterial({ map: woodTex(wall, 31 + x * 3, 1, 1, 9), roughness: 0.85 });
  wm.map.rotation = Math.PI / 2;
  const body = box(w, 2.1, d, wm, 0, 2.85, 0, g);
  // gable roof
  const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.55, 0); sh.lineTo(d / 2 + 0.55, 0); sh.lineTo(0, 1.7); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: w + 0.9, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.9) / 2); rg.rotateY(Math.PI / 2);
  mesh(rg, M(roof, { r: 0.7 }), 0, 3.9, 0, g);
  // door, window and ladder on the front (+z)
  box(0.9, 1.6, 0.06, M(0x4a2a18, { r: 0.7 }), -w * 0.22, 2.62, d / 2 + 0.02, g);
  const winMat = lit ? new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 5.2, 2.2), toneMapped: false }) : M(0x1c140e, { r: 0.6 });
  box(0.9, 0.7, 0.06, winMat, w * 0.22, 3.0, d / 2 + 0.02, g);
  box(1.1, 0.1, 0.1, M(0x4a2a18), w * 0.22, 2.6, d / 2 + 0.05, g);
  for (let i = 0; i < 5; i++) box(0.9, 0.06, 0.18, post, -w * 0.22, 0.25 + i * 0.32, d / 2 + 0.35 + (4 - i) * 0.16, g);
  inkAll(g, 0.012);
  if (lit) { halo(g, 2.4, 0xffb060, w * 0.22, 3.0, d / 2 + 0.3, 0.55); lamp(g, 0xffaa55, 8, w * 0.22, 3.0, d / 2 + 0.8, 9); }
  return g;
}

// ---------- outrigger fishing boat ----------
export function makeBoat(parent, col = "#7a2d22", stripe = 0xe0c24a) {
  const g = group(parent);
  const pts = []; for (let i = 0; i <= 18; i++) { const u = i / 18; pts.push(new THREE.Vector2(Math.sin(u * Math.PI) * 0.72 + 0.02, (u - 0.5) * 7.2)); }
  const hg = new THREE.LatheGeometry(pts, 18); hg.rotateZ(Math.PI / 2);
  const hull = mesh(hg, new THREE.MeshStandardMaterial({ map: woodTex(col, 45, 1, 1, 5), roughness: 0.65 }), 0, 0.42, 0, g); hull.scale.set(1, 0.7, 1.18);
  box(6.1, 0.08, 1.1, M(0x4a2c17, { r: 0.8 }), 0, 0.78, 0, g);
  box(5.6, 0.16, 1.18, M(stripe, { r: 0.6 }), 0, 0.62, 0, g);
  [-1.6, 1.6].forEach((x) => { const a = cyl(0.05, 0.05, 6.2, M(0xc9a668, { r: 0.8 }), x, 0.92, 0, g, 8); a.rotation.x = Math.PI / 2; });
  [-1, 1].forEach((s) => { const f = cyl(0.11, 0.11, 6.4, M(0xd8bd80, { r: 0.8 }), 0, 0.3, s * 3.05, g, 10); f.rotation.z = Math.PI / 2; });
  [-1.6, 1.6].forEach((x) => [-1, 1].forEach((s) => cyl(0.04, 0.04, 0.72, M(0xc9a668, { r: 0.8 }), x, 0.62, s * 3.05, g, 6)));
  inkAll(g, 0.012);
  return g;
}

// ---------- reef fish ----------
export function makeFish(parent, col, size = 1) {
  const g = group(parent);
  const inner = group(g);
  const body = sph(0.22, M(col, { r: 0.35 }), 0, 0, 0, inner); body.scale.set(1.25, 0.62, 0.32); ink(body, 0.01);
  const tg = new THREE.ConeGeometry(0.14, 0.2, 3); tg.rotateZ(Math.PI / 2);
  const tail = mesh(tg, M(new THREE.Color(col).multiplyScalar(0.75).getHex(), { r: 0.4 }), -0.33, 0, 0, inner); tail.scale.set(1, 1, 0.25); ink(tail, 0.008);
  const fin = mesh(new THREE.ConeGeometry(0.07, 0.14, 3), M(new THREE.Color(col).multiplyScalar(0.8).getHex()), 0.02, 0.14, 0, inner); fin.scale.z = 0.25;
  [-1, 1].forEach((s) => { sph(0.04, M(0xffffff, { r: 0.3 }), 0.17, 0.035, s * 0.06, inner, { cast: false }); sph(0.022, M(0x080808), 0.19, 0.038, s * 0.072, inner, { cast: false }); });
  g.scale.setScalar(size);
  // lying on its side on wet sand, flopping
  g.userData.flop = (t, k = 1, ph = 0) => {
    const f = Math.max(0, Math.sin(t * 11 + ph)) * k;
    inner.rotation.set(Math.PI / 2 * 0.92, 0, Math.sin(t * 22 + ph) * 0.35 * k);
    inner.position.y = 0.05 + f * 0.22;
    inner.rotation.y = Math.sin(t * 7 + ph) * 0.5 * k;
  };
  return g;
}

// ---------- plastic bucket ----------
export function makeBucket(parent, col = 0x2f7fd0) {
  const g = group(parent);
  const b = cyl(0.19, 0.14, 0.34, M(col, { r: 0.35 }), 0, 0.17, 0, g, 24); ink(b, 0.01);
  const rim = mesh(new THREE.TorusGeometry(0.19, 0.018, 8, 26), M(col, { r: 0.35 }), 0, 0.34, 0, g); rim.rotation.x = Math.PI / 2;
  const h = mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 20, Math.PI), M(0xd8d8d8, { r: 0.4, m: 0.4 }), 0, 0.34, 0, g); ink(h, 0.006);
  g.userData.handleTop = 0.53;
  return g;
}

// ---------- glowing music note ----------
export function makeNote(parent, col = 0xffd27a) {
  const s = new THREE.Shape();
  const e = new THREE.Path();
  s.absellipse(0, 0, 0.13, 0.095, 0, Math.PI * 2, false, 0.4);
  const head = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
  const g = group(parent);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2.2), toneMapped: false, transparent: true });
  mesh(head, mat, 0, 0, 0, g, { cast: false });
  box(0.028, 0.48, 0.03, mat, 0.11, 0.24, 0.015, g, { cast: false });
  const fl = new THREE.Shape(); fl.moveTo(0, 0); fl.quadraticCurveTo(0.16, -0.06, 0.13, -0.24); fl.quadraticCurveTo(0.1, -0.12, 0, -0.1); fl.closePath();
  mesh(new THREE.ExtrudeGeometry(fl, { depth: 0.03, bevelEnabled: false }), mat, 0.11, 0.48, 0, g, { cast: false });
  halo(g, 0.9, col, 0.06, 0.2, 0, 0.35);
  g.userData.mat = mat;
  return g;
}

// ---------- reef dressing ----------
export function rockLump(parent, r, x, y, z, seed, mat, sy = 0.6) {
  const g = new THREE.IcosahedronGeometry(r, 3);
  const p = g.attributes.position; const R = rng(seed);
  const sd = [R() * 9, R() * 9, R() * 9];
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const d = v.clone().normalize();
    const n = Math.sin(d.x * 4.1 + sd[0]) * Math.cos(d.y * 3.3 + sd[1]) * Math.sin(d.z * 5.2 + sd[2]) * 0.16 + Math.sin(d.x * 11 + sd[1]) * Math.sin(d.z * 9 + sd[0]) * 0.06;
    v.addScaledVector(d, r * n); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const m = mesh(g, mat, x, y, z, parent); m.scale.y = sy;
  return m;
}
const CORAL = [0xe0707a, 0xf0a04a, 0x9a62b0, 0xd85a4a, 0xf2d06a];
export function coral(parent, x, y, z, seed) {
  const R = rng(seed); const g = group(parent, x, y, z);
  const col = CORAL[Math.floor(R() * CORAL.length)];
  const mat = M(col, { r: 0.6 });
  const kind = R();
  if (kind < 0.5) {
    for (let i = 0; i < 6; i++) { const b = cyl(0.05, 0.08, 0.5 + R() * 0.5, mat, (R() - 0.5) * 0.5, 0.25, (R() - 0.5) * 0.5, g, 8); b.rotation.set((R() - 0.5) * 0.8, 0, (R() - 0.5) * 0.8); sph(0.08, mat, b.position.x + Math.sin(b.rotation.z) * -0.3, 0.55 + R() * 0.3, b.position.z + Math.sin(b.rotation.x) * 0.3, g); }
  } else {
    const b = sph(0.45 + R() * 0.3, mat, 0, 0.1, 0, g); b.scale.y = 0.55;
  }
  inkAll(g, 0.01);
  return g;
}
