// Rick Style starter exterior: deep blue sky with big clouds, warm sun, painted saturated ground.
// Copy it per location; the reference's worlds are canyons, stations, decks: rich textures and strong colour.
import * as THREE from "three";
import { M, plane, makeSky, sun, gradientEnv, drawTex, rng } from "./kit.js";

export function paintTex(stops, seed = 3, rx = 1, ry = 1) {
  const t = drawTex(1024, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([u, c]) => gr.addColorStop(u, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const R = rng(seed);
    for (let i = 0; i < 2600; i++) { const x = R() * w, y = R() * h, l = 8 + R() * 30; g.strokeStyle = `rgba(${R() > 0.5 ? "255,240,210" : "60,20,40"},${0.05 + R() * 0.08})`; g.lineWidth = 2 + R() * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (R() - 0.5) * 6); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  return t;
}

export function buildVivid(engine, o = {}) {
  const scene = new THREE.Scene();
  const SKY = { top: 0x0c46d0, mid: 0x3a8cf2, hor: 0xc4e6ff, sunDir: [0.45, 0.7, 0.5], sunCol: 0xffe2b4, sunGlow: 0.6, clouds: 0.62, cloudCol: 0xffffff, cloudShade: 0x8a9ae0, ...(o.sky || {}) };
  scene.background = new THREE.Color(SKY.hor);
  scene.environment = gradientEnv(engine.r, 0xcfe0ff, 0xffc890, 0x7a3a5a); scene.environmentIntensity = 0.6;
  const sky = makeSky(scene, SKY);
  plane(800, 800, new THREE.MeshStandardMaterial({ map: paintTex(o.ground || [[0, "#f2a24a"], [0.5, "#e07a3a"], [1, "#c8563a"]], 5, 60, 60), roughness: 0.9 }), 0, 0, 0, scene, -Math.PI / 2, 0, { cast: false });
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0xb0603a, 1.2));
  sun(scene, 0xffe6c0, 3.4, SKY.sunDir[0] * 150, SKY.sunDir[1] * 150, SKY.sunDir[2] * 150, 0, 0, 0, 30, 4096);
  return { scene, sky, grade: {}, dof: null, reset() {}, update(t) { sky.set(t); } };
}
