// Opening aerial: a small island at night, a few lit stilt houses among the palms, moon over the sea.
import * as THREE from "three";
import { M, plane, group, mesh, makeSky, makeSea, sun, gradientEnv, dust, plasterTex, rng, halo, glow, ink } from "./kit.js";
import { makePalm, makeHouse, rockLump } from "./props.js";

const NIGHT = { top: 0x0e0632, mid: 0x3a1f7a, hor: 0xa04aa0, sunDir: [0.35, 0.3, -0.9], sunCol: 0xffe8c8, sunGlow: 0.6, sunSize: 0.9991, clouds: 0.42, cloudCol: 0xb07ac8, cloudShade: 0x2a1650, stars: 1.4, deep: 0x120846, shallow: 0x3a2aa0, sky: 0x6a3aa8, fog: 0x7a3a9a, glint: 2.0, foam: 0xc8a8ff, chop: 0.9 };

export function buildIsland(engine) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NIGHT.hor);
  scene.environment = gradientEnv(engine.r, 0x2b3f6c, 0x18243f, 0x060a14);
  scene.environmentIntensity = 0.5;
  const sky = makeSky(scene, NIGHT);
  const sea = makeSea(scene, { ...NIGHT, islands: [[0, 0, 38]], far: 1400, size: 3000 });

  // island: sand ring + green hill
  const sandG = new THREE.CylinderGeometry(40, 46, 3, 64, 1); const sand = mesh(sandG, new THREE.MeshStandardMaterial({ map: plasterTex("#c9b98c", 4, 6, 6), roughness: 1 }), 0, -1.1, 0, scene);
  const hillG = new THREE.SphereGeometry(30, 64, 32); const hp = hillG.attributes.position; const R = rng(12);
  for (let i = 0; i < hp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(hp, i); const d = v.clone().normalize(); v.addScaledVector(d, Math.sin(d.x * 5) * Math.cos(d.z * 4) * 2.2 + Math.sin(d.z * 9 + 1) * 0.8); hp.setXYZ(i, v.x, v.y, v.z); }
  hillG.computeVertexNormals();
  const hill = mesh(hillG, new THREE.MeshStandardMaterial({ map: plasterTex("#2f5a32", 9, 4, 4), roughness: 1 }), -6, -6, -10, scene); hill.scale.set(1, 0.55, 0.9);
  for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, r = 22 + R() * 14; makePalm(scene, Math.cos(a) * r, 0.2, Math.sin(a) * r, 6 + R() * 4, 0.15 + R() * 0.25, 30 + i, R() * 6); }
  for (let i = 0; i < 18; i++) { const a = R() * Math.PI * 2, r = 6 + R() * 16; makePalm(scene, -6 + Math.cos(a) * r, 8 + R() * 3, -10 + Math.sin(a) * r * 0.8, 5 + R() * 3, 0.1, 80 + i, R() * 6); }
  // the village on the shore facing the camera
  [[-14, 30, 0.3, true], [-4, 33, 0.1, true], [7, 31, -0.2, false], [17, 26, -0.5, true]].forEach(([x, z, ry, lit], i) => makeHouse(scene, x, 0.3, z, ry, { lit, wall: ["#9a6c40", "#a8794a", "#8a5c36", "#b08050"][i], s: 1.1 }));
  for (let i = 0; i < 10; i++) rockLump(scene, 1 + R() * 1.6, (R() - 0.5) * 80, 0, 38 + R() * 6, 50 + i, M(0x3a3c40, { r: 0.9 }));

  scene.add(new THREE.HemisphereLight(0x5a7ab8, 0x141c2e, 0.8));
  sun(scene, 0xb4c8ff, 1.6, 40, 60, -140, 0, 0, 0, 60, 4096);
  const f = new THREE.DirectionalLight(0x7f98d8, 1.2); f.position.set(-0.5, 0.6, 1); scene.add(f);
  const motes = dust(scene, 120, 160, 30, 160, 0, 15, 0, 0xbfd4ff, 0.06, 4);
  return {
    scene, sky, sea,
    grade: { exposure: 1.2, tint: [1.0, 0.95, 1.1], sat: 1.35, bloom: 0.9, thresh: 0.8, lift: [0.004, 0.008, 0.02], edgeColor: [0.3, 0.32, 0.42], vignette: 0.5 },
    dof: null,
    reset() {},
    update(t) { sky.set(t); sea.set(t); motes.set(t); },
  };
}
