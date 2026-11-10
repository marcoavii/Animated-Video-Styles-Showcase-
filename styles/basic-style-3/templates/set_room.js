// Starter interior. Copy it per location and change the materials, props, lights and grade.
// Fully enclosed on purpose: whip transitions swing the camera past where the shot was looking.
import * as THREE from "three";
import { M, box, plane, group, plasterTex, woodTex, spot, lamp, gradientEnv, dust, halo, sph } from "./kit.js";

export function buildRoom(engine, o = {}) {
  const { wall = "#a9804f", floor = "#6b3f20", trim = "#5c3218", W = 9, D = 6.5, H = 4.6, key = 0xffdcb4, grade = {} } = o;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120b06);
  scene.environment = gradientEnv(engine.r, 0xffd9a0, 0x8a5a30, 0x2a1608);
  scene.environmentIntensity = 0.26;

  const wm = new THREE.MeshStandardMaterial({ map: plasterTex(wall, 3, 2, 1), roughness: 0.92 });
  plane(W * 2, H, wm, 0, H / 2, -D, scene);
  plane(D * 2, H, wm, -W, H / 2, 0, scene, 0, Math.PI / 2);
  plane(D * 2, H, wm, W, H / 2, 0, scene, 0, -Math.PI / 2);
  plane(W * 2, H, wm, 0, H / 2, D, scene, 0, Math.PI);
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: plasterTex(o.ceiling || "#8a6c4c", 5, 2, 2), roughness: 1 }), 0, H, 0, scene, Math.PI / 2);
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: woodTex(floor, 9, 3, 3, 8), roughness: 0.42 }), 0, 0, 0, scene, -Math.PI / 2);
  // wainscot: gives every wall a horizon line and scale
  const wain = new THREE.MeshStandardMaterial({ map: woodTex(trim, 21, 3, 1, 3), roughness: 0.5 });
  [[0, -D + 0.04, 0, W * 2], [0, D - 0.04, Math.PI, W * 2], [-W + 0.04, 0, Math.PI / 2, D * 2], [W - 0.04, 0, -Math.PI / 2, D * 2]].forEach(([x, z, ry, len]) => {
    const g = group(scene, x, 0, z); g.rotation.y = ry;
    box(len, 1.25, 0.08, wain, 0, 0.625, 0, g);
    box(len, 0.1, 0.14, M(0x3e2110, { r: 0.45 }), 0, 1.28, 0, g);
  });
  // a practical lamp: visible bulb, soft halo, real light
  const sconce = (x, z) => {
    const g = group(scene, x, 3.05, z);
    sph(0.14, new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 6.8, 4), toneMapped: false }), 0, 0.08, 0.13, g, { cast: false, recv: false });
    halo(g, 1.8, 0xffc98a, 0, 0.1, 0.2, 0.55);
    lamp(g, 0xffcf9a, 5, 0, 0.1, 0.5, 10);
  };
  sconce(-W * 0.45, -D + 0.07); sconce(W * 0.45, -D + 0.07);

  scene.add(new THREE.HemisphereLight(0xffe4c4, 0x5a3c26, 0.85));
  spot(scene, key, 72, -2.6, H - 0.3, 3.8, 0.4, 1.1, -1.4, 0.9, 0.9, 2048);
  spot(scene, 0xffe4bd, 30, 4.8, H - 0.4, -3.2, 0.6, 1.0, -1.0, 0.9, 0.9, 1024);
  // soft room bounce: lifts the upper walls and ceiling so 9:16 framing never shows a black void above the set
  lamp(scene, 0xffdcb4, 26, 0, H - 0.7, 0, W * 2.4);
  lamp(scene, 0xffdcb4, 12, -W * 0.55, H - 1.0, -D * 0.3, W * 1.6);
  lamp(scene, 0xffdcb4, 12, W * 0.55, H - 1.0, -D * 0.3, W * 1.6);
  // follows the camera so a face turned away from the key never crushes to black
  const camFill = lamp(scene, 0xffe4c4, 3.2, 0, 2, 0, 10); camFill.userData.base = 3.2;
  const motes = dust(scene, 240, W * 1.8, H - 0.6, D * 1.6, 0, H / 2, 0, 0xffe0b0, 0.022, 9);

  return {
    scene, camFill,
    grade: { tint: [1.0, 0.99, 0.93], exposure: 1.06, lift: [0.016, 0.008, 0.002], sat: 0.98, bloom: 0.5, thresh: 1.15, edgeColor: [0.16, 0.09, 0.05], ...grade },
    dof: { ap: 0.016, max: 0.006 },
    reset() {}, // put every transient prop back here; shots run out of order during a dissolve
    update(t) { motes.set(t); },
  };
}
