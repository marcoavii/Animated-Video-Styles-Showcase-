// Basic style 5 props: woven sacks with red labels, buckets, number signs, hanging scales with a red dial,
// low-poly fish, a pile of feed pellets, chickens. Same soft 3D toy look as the world; signs use the UI font.
import * as THREE from "three";
import { M, mesh, box, cyl, sph, plane, group, drawTex, rng, ink, FONT_STACK } from "./kit.js";

const weave = drawTex(256, 256, (g, w, h) => {
  g.fillStyle = "#d8ad72"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#9c7140"; g.lineWidth = 4;
  for (let i = 0; i < w; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
});
weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(3, 2);

export function sack(parent, x, z, s = 1, ry = 0, label = true) {
  const g = group(parent, x, 0, z); g.scale.setScalar(s); g.rotation.y = ry;
  const prof = [[0, 0], [0.42, 0.02], [0.48, 0.16], [0.45, 0.45], [0.34, 0.7], [0.17, 0.86], [0, 0.9]].map(([a, b]) => new THREE.Vector2(a, b));
  mesh(new THREE.LatheGeometry(prof, 24), new THREE.MeshStandardMaterial({ map: weave, roughness: 0.95 }), 0, 0, 0, g);
  if (label) {
    const t = drawTex(128, 64, (c, w, h) => { c.fillStyle = "#d4312a"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffffff"; c.fillRect(54, 20, 20, 24); });
    const l = plane(0.32, 0.16, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), 0, 0.32, 0.485, g); l.rotation.x = -0.12;
  }
  return g;
}
export function bucket(parent, x, z, color = 0x2a6fd6, s = 1) {
  const g = group(parent, x, 0, z); g.scale.setScalar(s);
  cyl(0.17, 0.13, 0.26, M(color, { r: 0.4 }), 0, 0.13, 0, g, 20);
  return g;
}
// a small sign on a post, text drawn with the style font (numbers, "=", short labels)
export function sign(parent, x, z, lines, o = {}) {
  const { w = 0.7, h = 0.45, post = 0.9, ry = 0, color = "#2c2c2c", board = "#f2efe4", accent = "#1f9a7a" } = o;
  const g = group(parent, x, 0, z); g.rotation.y = ry;
  if (post > 0) box(0.06, post, 0.06, M(0x6b4a2a), 0, post / 2, 0, g);
  const t = drawTex(512, Math.round((512 * h) / w), (c, W, H) => {
    c.fillStyle = board; c.fillRect(0, 0, W, H);
    c.strokeStyle = accent; c.lineWidth = 14; c.strokeRect(7, 7, W - 14, H - 14);
    c.fillStyle = color; c.textAlign = "center"; c.textBaseline = "middle";
    const n = lines.length;
    lines.forEach((l, i) => { const size = l.size ?? (i === 0 ? H * 0.5 : H * 0.18); c.font = `800 ${size}px ${FONT_STACK}`; c.fillStyle = l.color ?? color; c.fillText(l.t, W / 2, H * ((i + 0.5) / n) + (n === 1 ? 0 : (i === 0 ? H * 0.05 : -H * 0.05))); });
  });
  const b = box(w, h, 0.05, [M(0x3a3a3a), M(0x3a3a3a), M(0x3a3a3a), M(0x3a3a3a), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), M(0x3a3a3a)], 0, post + h / 2, 0, g);
  ink(b, 0.012);
  return g;
}
// hanging scale: a red-rimmed dial with a needle over a clear bowl (the needle angle is set each frame)
export function hangingScale(parent, x, y, z, s = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(s);
  cyl(0.008, 0.008, 1.2, M(0x333333), 0, 0.6, 0, g, 6);
  const dialTex = drawTex(256, 256, (c, w, h) => {
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill();
    c.strokeStyle = "#222"; c.lineWidth = 4;
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r0 = i % 5 ? 104 : 92; c.beginPath(); c.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); c.lineTo(128 + Math.cos(a) * 114, 128 + Math.sin(a) * 114); c.stroke(); }
  });
  const dial = group(g, 0, 0, 0);
  const rim = cyl(0.3, 0.3, 0.08, M(0xd62b22, { r: 0.4 }), 0, 0, 0, dial, 40); rim.rotation.x = Math.PI / 2;
  const face = mesh(new THREE.CircleGeometry(0.26, 40), new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.6 }), 0, 0, 0.041, dial);
  const needle = group(dial, 0, 0, 0.05);
  box(0.02, 0.22, 0.01, M(0xd62b22), 0, 0.1, 0, needle);
  cyl(0.004, 0.004, 0.6, M(0x333333), 0, -0.6, 0, g, 6);
  const bowl = mesh(new THREE.SphereGeometry(0.42, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 0, -0.9, 0, g);
  return { g, needle, bowl, set(v) { needle.rotation.z = -v * Math.PI * 1.6; } };
}
export function fish(parent, x, y, z, s = 1, ry = 0) {
  const g = group(parent, x, y, z); g.scale.setScalar(s); g.rotation.y = ry;
  const bm = new THREE.MeshStandardMaterial({ color: 0xa9b4bd, roughness: 0.35, metalness: 0.2, flatShading: true });
  const b = mesh(new THREE.IcosahedronGeometry(0.2, 1), bm, 0, 0, 0, g); b.scale.set(1.6, 0.7, 0.45);
  const tail = mesh(new THREE.ConeGeometry(0.12, 0.2, 4), bm, -0.36, 0, 0, g); tail.rotation.z = Math.PI / 2;
  sph(0.03, M(0x111111), 0.22, 0.04, 0.08, g);
  return g;
}
// feed pellets: small brown bits, `spread(u)` flies them out in an arc and down into the pond
export function pellets(parent, n = 60, seed = 3, color = 0x5a3214, size = 1) {
  const R = rng(seed), g = group(parent), m = M(color, { r: 0.8 });
  const bits = [];
  for (let i = 0; i < n; i++) { const b = mesh(new THREE.IcosahedronGeometry((0.025 + R() * 0.02) * size, 0), m, 0, 0, 0, g, { cast: false }); b.userData.v = [(R() - 0.5) * 2, 1 + R() * 1.4, 0.8 + R() * 1.6]; b.userData.d = R() * 0.3; bits.push(b); }
  return {
    g, bits,
    // from: [x,y,z] hand position, floorY: where bits stop
    set(t, t0, from, floorY = 0, dir = 1) {
      bits.forEach((b) => { const [vx, vy, vz] = b.userData.v; const u = Math.max(0, t - t0 - b.userData.d); b.visible = t > t0 + b.userData.d; const y = from[1] + vy * u - 4.9 * u * u; b.position.set(from[0] + vx * u * dir * 0.8, Math.max(floorY, y), from[2] + vz * u * dir); });
    },
  };
}
export function chicken(parent, x, z, ry = 0, s = 1, color = 0xd9732c) {
  const g = group(parent, x, 0, z); g.rotation.y = ry; g.scale.setScalar(s);
  const bm = new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true });
  const b = mesh(new THREE.IcosahedronGeometry(0.16, 1), bm, 0, 0.2, 0, g); b.scale.set(1.2, 0.9, 0.9);
  sph(0.08, bm, 0.15, 0.36, 0, g);
  const comb = mesh(new THREE.ConeGeometry(0.03, 0.06, 4), M(0xd42a2a), 0.15, 0.45, 0, g);
  const beak = mesh(new THREE.ConeGeometry(0.02, 0.06, 4), M(0xf2b632), 0.24, 0.35, 0, g); beak.rotation.z = -Math.PI / 2;
  for (const s2 of [-1, 1]) cyl(0.01, 0.01, 0.12, M(0xf2b632), 0, 0.06, s2 * 0.05, g, 5);
  return g;
}
