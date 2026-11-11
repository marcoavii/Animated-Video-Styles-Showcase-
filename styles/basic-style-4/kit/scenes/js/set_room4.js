// Basic style 4 interior: the reference's clean, soft, slightly muted room. Plaster with soft blotches above,
// a painted dado below, tiled or plank floor, even soft light, no harsh shadows.
import * as THREE from "three";
import { M, box, plane, group, drawTex, rng, gradientEnv, spot, lamp } from "./kit.js";

export function blotchTex(base, blot, seed = 3, rx = 1, ry = 1) {
  const t = drawTex(1024, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const R = rng(seed);
    for (let i = 0; i < 140; i++) {
      const x = R() * w, y = R() * h, r = 18 + R() * 46;
      g.fillStyle = blot; g.globalAlpha = 0.1 + R() * 0.16;
      g.beginPath(); g.ellipse(x, y, r, r * (0.6 + R() * 0.5), R() * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  return t;
}
export function tilesTex(a, grout, n = 4, rx = 1, ry = 1) {
  const t = drawTex(1024, 1024, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    const s = w / n; const R = rng(5);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${R() * 0.04})`; g.fillRect(x * s, y * s, s, s); }
    g.strokeStyle = grout; g.lineWidth = 7; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  return t;
}

export function buildRoom4(engine, o = {}) {
  const { W = 6, D = 5, H = 3.6, wall = "#c9c3aa", blot = "#8e8a72", dado = "#4e868c", dadoH = 1.15, floor = "#c9ced2", grout = "#6a7076" } = o;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);
  scene.environment = gradientEnv(engine.r, 0xf2f2ee, 0xc8cac4, 0x6a6c68);
  scene.environmentIntensity = 0.6;
  const wm = new THREE.MeshStandardMaterial({ map: blotchTex(wall, blot, 3, 2, 1), roughness: 0.95 });
  const dm = new THREE.MeshStandardMaterial({ map: blotchTex(dado, "#2e5a60", 9, 3, 1), roughness: 0.8 });
  const walls = [[0, -D, 0, W * 2], [-W, 0, Math.PI / 2, D * 2], [W, 0, -Math.PI / 2, D * 2], [0, D, Math.PI, W * 2]];
  walls.forEach(([x, z, ry, len]) => {
    const g = group(scene, x, 0, z); g.rotation.y = ry;
    plane(len, H - dadoH, wm, 0, dadoH + (H - dadoH) / 2, 0, g);
    plane(len, dadoH, dm, 0, dadoH / 2, 0.005, g);
    box(len, 0.06, 0.06, M(0xd8d6cc, { r: 0.7 }), 0, dadoH, 0.03, g);
  });
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: tilesTex(floor, grout, 4, W, D), roughness: 0.6 }), 0, 0, 0, scene, -Math.PI / 2);
  plane(W * 2, D * 2, M(0xe6e4dc, { r: 1 }), 0, H, 0, scene, Math.PI / 2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a92, 1.6));
  const key = spot(scene, 0xfffaf0, 40, 0, H - 0.2, 4, 0, 0.8, -2, 1.0, 1, 2048);
  const camFill = lamp(scene, 0xffffff, 0, 0, 2, 0, 8); camFill.userData.base = 0;
  return {
    scene, camFill,
    grade: { exposure: 1.02, sat: 0.96 },
    dof: null,
    reset() {}, update() {},
  };
}
