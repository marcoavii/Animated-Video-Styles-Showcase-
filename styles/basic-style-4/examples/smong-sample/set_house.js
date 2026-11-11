// Inside a stilt house at night: woven bamboo walls, oil lamp, moonlit window, sleeping mat.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, drawTex, woodTex, plasterTex, textLines, spot, lamp, halo, dust, gradientEnv, glow, ink, inkAll, poster, rng, shaft, clamp, wob } from "./kit.js";

function weaveTex(seed = 3) {
  const t = drawTex(512, 512, (g, w, h) => {
    const R = rng(seed); const n = 16, s = w / n;
    g.fillStyle = "#a8834e"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const horiz = (x + y) % 2 === 0;
      const v = 0.85 + R() * 0.25;
      g.fillStyle = `rgb(${Math.round(196 * v)},${Math.round(158 * v)},${Math.round(98 * v)})`;
      g.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
      g.strokeStyle = "rgba(70,40,14,.35)"; g.lineWidth = 1;
      for (let k = 1; k < 4; k++) { g.beginPath(); if (horiz) { g.moveTo(x * s, y * s + (k * s) / 4); g.lineTo(x * s + s, y * s + (k * s) / 4); } else { g.moveTo(x * s + (k * s) / 4, y * s); g.lineTo(x * s + (k * s) / 4, y * s + s); } g.stroke(); }
      const gr = g.createLinearGradient(x * s, y * s, horiz ? x * s : x * s + s, horiz ? y * s + s : y * s);
      gr.addColorStop(0, "rgba(255,240,200,.18)"); gr.addColorStop(1, "rgba(40,20,5,.28)");
      g.fillStyle = gr; g.fillRect(x * s, y * s, s, s);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function matTex() {
  const t = drawTex(512, 512, (g, w, h) => {
    g.fillStyle = "#c9a35e"; g.fillRect(0, 0, w, h);
    const n = 32, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 ? "rgba(120,70,20,.25)" : "rgba(255,240,190,.15)";
      g.fillRect(x * s, y * s, s, s);
    }
    g.strokeStyle = "#8a2f24"; g.lineWidth = 18; g.strokeRect(28, 28, w - 56, h - 56);
    g.strokeStyle = "#2f5a4a"; g.lineWidth = 8; g.strokeRect(58, 58, w - 116, h - 116);
  });
  return t;
}
function batikTex() {
  return drawTex(512, 512, (g, w, h) => {
    g.fillStyle = "#3d5c8a"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const cx = x * 64 + 32 + (y % 2) * 32, cy = y * 64 + 32;
      g.strokeStyle = "#e9d9a8"; g.lineWidth = 4;
      g.beginPath(); g.ellipse(cx, cy, 20, 12, Math.PI / 4, 0, 7); g.stroke();
      g.beginPath(); g.ellipse(cx, cy, 20, 12, -Math.PI / 4, 0, 7); g.stroke();
      g.fillStyle = "#c9573a"; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill();
    }
    g.fillStyle = "#26395a"; g.fillRect(0, 0, w, 40); g.fillRect(0, h - 40, w, 40);
  });
}

export function buildHouse(engine) {
  const W = 4.6, D = 3.8, H = 3.5;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080d);
  scene.environment = gradientEnv(engine.r, 0x6a5a48, 0x2a2018, 0x0a0806);
  scene.environmentIntensity = 0.25;

  const wt = weaveTex(3); wt.repeat.set(3, 1.4);
  const wm = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.9 });
  // back wall with a window hole
  const wx = -2.1, wy = 1.95, ww = 1.4, wh = 1.05;
  const backWall = group(scene, 0, 0, -D);
  const part = (x0, x1, y0, y1) => { const m = plane(x1 - x0, y1 - y0, wm, (x0 + x1) / 2, (y0 + y1) / 2, 0, backWall); m.material = wm; return m; };
  part(-W, wx - ww / 2, 0, H); part(wx + ww / 2, W, 0, H); part(wx - ww / 2, wx + ww / 2, 0, wy - wh / 2); part(wx - ww / 2, wx + ww / 2, wy + wh / 2, H);
  plane(D * 2, H, wm, -W, H / 2, 0, scene, 0, Math.PI / 2);
  plane(D * 2, H, wm, W, H / 2, 0, scene, 0, -Math.PI / 2);
  plane(W * 2, H, wm, 0, H / 2, D, scene, 0, Math.PI);
  // posts and beams
  const beam = M(0x4a2c18, { r: 0.8 });
  [[-W + 0.1, -D + 0.1], [W - 0.1, -D + 0.1], [-W + 0.1, D - 0.1], [W - 0.1, D - 0.1], [0, -D + 0.1]].forEach(([x, z]) => { const p = box(0.18, H, 0.18, beam, x, H / 2, z, scene); ink(p, 0.01); });
  for (let i = -2; i <= 2; i++) { const r = box(0.12, 0.16, D * 2, beam, i * 1.5, H - 0.1, 0, scene); ink(r, 0.01); }
  box(W * 2, 0.16, 0.16, beam, 0, H - 0.25, -D + 0.12, scene);
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: plasterTex("#5a3e26", 5, 2, 2), roughness: 1 }), 0, H, 0, scene, Math.PI / 2);
  const fl = woodTex("#7a5232", 9, 3, 3, 10);
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: fl, roughness: 0.55 }), 0, 0, 0, scene, -Math.PI / 2);
  // window frame + shutters + view
  const wf = M(0x3e2414, { r: 0.7 });
  box(ww + 0.16, 0.1, 0.14, wf, wx, wy - wh / 2, -D, scene); box(ww + 0.16, 0.1, 0.14, wf, wx, wy + wh / 2, -D, scene);
  box(0.1, wh, 0.14, wf, wx - ww / 2, wy, -D, scene); box(0.1, wh, 0.14, wf, wx + ww / 2, wy, -D, scene);
  const sh = box(0.62, wh, 0.05, new THREE.MeshStandardMaterial({ map: woodTex("#6a4428", 4, 1, 1, 5), roughness: 0.8 }), wx - ww / 2 - 0.34, wy, -D + 0.25, scene); sh.rotation.y = -1.1; ink(sh, 0.01);
  const view = drawTex(512, 400, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#081430"); gr.addColorStop(0.55, "#1d3a6a"); gr.addColorStop(0.56, "#0c2244"); gr.addColorStop(1, "#06142a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const R = rng(8); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(220,230,255,${R() * 0.9})`; g.fillRect(R() * w, R() * h * 0.5, 1.6, 1.6); }
    g.fillStyle = "#f4f0dc"; g.beginPath(); g.arc(w * 0.68, h * 0.24, 34, 0, 7); g.fill();
    const mg = g.createRadialGradient(w * 0.68, h * 0.24, 30, w * 0.68, h * 0.24, 140); mg.addColorStop(0, "rgba(200,215,255,.35)"); mg.addColorStop(1, "rgba(200,215,255,0)"); g.fillStyle = mg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(230,236,255,${0.5 - i * 0.017})`; g.fillRect(w * 0.68 - 30 + Math.sin(i) * 14, h * 0.58 + i * 6, 60 - i * 1.4, 2); }
    g.fillStyle = "#050a14"; g.beginPath(); g.moveTo(0, h * 0.58); g.quadraticCurveTo(w * 0.12, h * 0.42, w * 0.26, h * 0.57); g.fill();
  });
  const vm = new THREE.MeshBasicMaterial({ map: view, toneMapped: true });
  vm.color.setScalar(1.6);
  plane(ww * 2.4, wh * 2.4, vm, wx, wy, -D - 1.2, scene);

  // moonlight through the window
  const moon = spot(scene, 0x9fb8ff, 55, wx - 0.4, wy + 0.8, -D - 2.5, wx + 1.4, 0, -0.4, 0.42, 0.7, 2048);
  const sf = shaft(scene, 0.55, 1.4, 3.6, 0x8fb0ff, 0.09, wx + 0.6, 0.95, -1.6, 1.4);
  sf.rotation.set(0.95, 0, -0.42);

  // sleeping mat, pillow, blanket
  plane(3.6, 1.9, new THREE.MeshStandardMaterial({ map: matTex(), roughness: 0.85 }), -0.1, 0.012, -0.55, scene, -Math.PI / 2);
  const pillow = rbox(0.95, 0.16, 0.6, 0.07, M(0xeee6d4, { r: 0.85 }), 0, 0.09, -0.92, scene); ink(pillow, 0.01);
  const blanket = rbox(1.4, 1.0, 1.8, 0.46, new THREE.MeshStandardMaterial({ map: batikTex(), roughness: 0.85 }), 0, 0.5, 0.75, scene); ink(blanket, 0.012);
  blanket.userData.base = blanket.position.clone(); blanket.visible = false; pillow.visible = false; // 2D cutouts instead

  // oil lamp (pelita) on a crate
  const crate = box(0.5, 0.42, 0.5, new THREE.MeshStandardMaterial({ map: woodTex("#8a5a33", 12, 1, 1, 4), roughness: 0.8 }), 2.3, 0.21, -1.9, scene); ink(crate, 0.01);
  const lampG = group(scene, 2.3, 0.42, -1.9);
  const can = cyl(0.075, 0.09, 0.2, M(0x7a7f84, { r: 0.35, m: 0.7 }), 0, 0.1, 0, lampG, 18); ink(can, 0.008);
  cyl(0.012, 0.012, 0.06, M(0x2a2018), 0, 0.23, 0, lampG, 6);
  const flame = sph(0.05, new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 7.5, 2.4), toneMapped: false }), 0, 0.31, 0, lampG, { cast: false });
  flame.scale.set(0.75, 1.7, 0.75);
  const fh = halo(lampG, 1.5, 0xffa040, 0, 0.32, 0, 0.8);
  const fl2 = lamp(lampG, 0xffb978, 9, 0, 0.45, 0.15, 11);
  fl2.castShadow = true; fl2.shadow.mapSize.set(1024, 1024); fl2.shadow.bias = -0.002; fl2.shadow.radius = 6;

  // wall dressing: calendar, fishing net, hanging sarong
  poster(scene, 0.7, 0.96, 1.35, 2.15, -D + 0.02, 0, (g, w, h) => {
    g.fillStyle = "#f6efe0"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#c2392b"; g.fillRect(0, 0, w, h * 0.27);
    textLines(g, [{ t: "DESEMBER", size: 52, color: "#fff" }, { t: "2004", size: 44, color: "#ffe1a8" }], w, h * 0.27, { top: 4, lh: 1.05 });
    g.fillStyle = "#3a2a20"; g.font = `700 30px "Plus Jakarta Sans"`; g.textAlign = "center";
    for (let i = 0; i < 31; i++) { const c = i % 7, r = Math.floor(i / 7); g.fillStyle = c === 0 ? "#c2392b" : "#3a2a20"; g.fillText(String(i + 1), 44 + c * ((w - 60) / 7) + 10, h * 0.36 + r * 64); }
    g.strokeStyle = "#c2392b"; g.lineWidth = 6; g.beginPath(); g.arc(44 + 4 * ((w - 60) / 7) + 10, h * 0.36 + 3 * 64 - 10, 26, 0, 7); g.stroke();
  }, { frame: 0, res: 600 });
  const net = drawTex(512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(60,48,30,.95)"; g.lineWidth = 3; for (let i = -10; i < 22; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 260, h); g.stroke(); g.beginPath(); g.moveTo(i * 32 + 260, 0); g.lineTo(i * 32, h); g.stroke(); } });
  const nm = new THREE.MeshStandardMaterial({ map: net, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 });
  const netM = plane(2.2, 1.7, nm, -W + 0.05, 1.9, 0.8, scene, 0, Math.PI / 2); netM.castShadow = true;
  for (let i = 0; i < 5; i++) { const f = sph(0.06, M(0xd8a43a, { r: 0.6 }), -W + 0.1, 1.15 + (i % 2) * 0.1, 0.0 + i * 0.4, scene); ink(f, 0.006); }
  const hook = box(1.8, 0.04, 0.04, beam, -W + 0.08, 2.75, 0.8, scene); hook.rotation.y = Math.PI / 2;

  // the shadow on the back wall: a giant wave rising over a row of little houses (for "bencana")
  const waveTex = drawTex(1024, 640, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#000";
    g.beginPath(); g.moveTo(0, h);
    g.lineTo(0, h * 0.72); g.bezierCurveTo(w * 0.18, h * 0.66, w * 0.36, h * 0.3, w * 0.58, h * 0.1);
    g.bezierCurveTo(w * 0.7, h * 0.02, w * 0.84, h * 0.06, w * 0.9, h * 0.2);
    g.bezierCurveTo(w * 0.82, h * 0.15, w * 0.74, h * 0.2, w * 0.78, h * 0.3);
    g.bezierCurveTo(w * 0.82, h * 0.36, w * 0.9, h * 0.32, w * 0.86, h * 0.42);
    g.bezierCurveTo(w * 0.84, h * 0.6, w * 0.92, h * 0.8, w, h * 0.86); g.lineTo(w, h); g.closePath(); g.fill();
    for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(w * (0.5 + i * 0.024), h * (0.1 + Math.sin(i * 1.3) * 0.04) - 8, 6 + (i % 3) * 4, 0, 7); g.fill(); }
  });
  const shadowMat = new THREE.MeshBasicMaterial({ map: waveTex, color: 0x000000, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const sg = new THREE.PlaneGeometry(3.6, 2.25); sg.translate(0, 1.125, 0);
  const waveShadow = new THREE.Mesh(sg, shadowMat); waveShadow.position.set(-1.0, 0.4, -D + 0.03); waveShadow.scale.x = 1.5; scene.add(waveShadow);
  const housesTex = drawTex(1024, 160, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#000"; for (let i = 0; i < 5; i++) { const x = 120 + i * 180; g.fillRect(x, 70, 90, 60); g.beginPath(); g.moveTo(x - 14, 72); g.lineTo(x + 45, 22); g.lineTo(x + 104, 72); g.fill(); g.fillRect(x + 6, 128, 8, 32); g.fillRect(x + 76, 128, 8, 32); } });
  const housesMat = new THREE.MeshBasicMaterial({ map: housesTex, color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
  const houses = plane(4.6, 0.7, housesMat, 0.1, 0.7, -D + 0.035, scene);

  scene.add(new THREE.HemisphereLight(0x9fb2dc, 0x4a3420, 0.95));
  const bounce = lamp(scene, 0xffc890, 7, 0.4, 2.8, 0.2, 9);
  spot(scene, 0xffe2c0, 26, -1.2, H - 0.2, 2.6, 0.4, 0.8, -0.6, 0.85, 0.9, 2048);
  const camFill = lamp(scene, 0xffe6cc, 5, 0, 2, 0, 7); camFill.userData.base = 5;
  const motes = dust(scene, 160, W * 1.8, H - 0.4, D * 1.6, 0, H / 2, 0, 0xffd8a8, 0.016, 7);

  return {
    scene, camFill, flame, flameLight: fl2, fh, waveShadow, shadowMat, housesMat, blanket,
    grade: { tint: [1.0, 0.98, 0.96], exposure: 1.42, sat: 0.92, lift: [0.006, 0.008, 0.02], sat: 1.02, bloom: 0.75, thresh: 0.85, edgeColor: [0.12, 0.08, 0.06], vignette: 0.55 },
    dof: null,
    // gutter: 0 calm flame, 1 a sudden draught
    flicker(t, gutter = 0) {
      const f = 1 + wob(t, 3.1, 1) * 0.08 + wob(t, 7.3, 2) * 0.05 + gutter * (wob(t, 13, 3) * 0.45 - 0.25);
      fl2.intensity = 9 * f; flame.scale.set(0.75 * (1 + gutter * 0.3), 1.7 * f, 0.75); flame.rotation.z = wob(t, 2.3) * 0.12 + gutter * wob(t, 9) * 0.5; fh.material.opacity = 0.8 * f;
    },
    reset() { shadowMat.opacity = 0; housesMat.opacity = 0; waveShadow.scale.set(1.5, 0.001, 1); },
    update(t) { motes.set(t); },
  };
}
