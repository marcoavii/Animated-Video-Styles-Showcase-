// Inside the tower: spiral stair, shafts of cold window light, oil tank at the bottom. Where the search comes up empty.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, shaft, halo, spot, lamp, sun, gradientEnv, drawTex, textLines, tileTex, woodTex, plasterTex, brickTex, ink, dust, clamp } from "./kit.js";
import { Actor } from "./actor.js";
import { CAST } from "./cast.js";

export function buildStairs(engine) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f14);
  scene.environment = gradientEnv(engine.r, 0xbcd0e8, 0x5a6470, 0x241c14);
  scene.environmentIntensity = 0.3;
  const R = 6.2, H = 26;

  // wall: two-tone. teal to shoulder height, cream brick above
  const up = new THREE.MeshStandardMaterial({ map: brickTex("#c9ba9a", "#a89878", 91, 7, 5), roughness: 0.9, side: THREE.BackSide });
  mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true), up, 0, H / 2, 0, scene);
  const low = new THREE.MeshStandardMaterial({ map: plasterTex("#2d6a66", 93, 2, 1), roughness: 0.62, side: THREE.BackSide });
  mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, 1.9, 64, 1, true), low, 0, 0.95, 0, scene);
  const bandT = mesh(new THREE.TorusGeometry(R - 0.09, 0.06, 8, 96), M(0x1d4a47, { r: 0.45 }), 0, 1.93, 0, scene); bandT.rotation.x = Math.PI / 2;
  plane(R * 2.2, R * 2.2, new THREE.MeshStandardMaterial({ map: tileTex("#b8ab8f", "#8b7e66", 95, 6, 6, 4), roughness: 0.5 }), 0, 0, 0, scene, -Math.PI / 2);
  plane(R * 2.2, R * 2.2, M(0x22201c, { r: 1 }), 0, H, 0, scene, Math.PI / 2);

  // spiral stair
  const steps = 96, rise = 0.27, ang = 0.2;
  const inner = R - 2.5;
  const stepGeo = new THREE.BoxGeometry(2.5, 0.12, 0.92);
  const stepMat = new THREE.MeshStandardMaterial({ map: woodTex("#6a4426", 101, 1, 1, 2), roughness: 0.6 });
  const stepInst = new THREE.InstancedMesh(stepGeo, stepMat, steps);
  const dummy = new THREE.Object3D();
  const railPts = [], railPts2 = [];
  for (let i = 0; i < steps; i++) {
    const a = i * ang + 1.2, y = 0.2 + i * rise;
    dummy.position.set(Math.sin(a) * (R - 1.28), y, Math.cos(a) * (R - 1.28));
    dummy.rotation.y = a + Math.PI / 2;
    dummy.updateMatrix(); stepInst.setMatrixAt(i, dummy.matrix);
    if (i % 2 === 0) {
      const p = group(scene, Math.sin(a) * inner, y, Math.cos(a) * inner);
      cyl(0.022, 0.022, 1.1, M(0x1c1a18, { r: 0.4, m: 0.55 }), 0, 0.55, 0, p, 6);
    }
    railPts.push(new THREE.Vector3(Math.sin(a) * inner, y + 1.12, Math.cos(a) * inner));
    railPts2.push(new THREE.Vector3(Math.sin(a) * (R - 0.18), y - 0.22, Math.cos(a) * (R - 0.18)));
  }
  stepInst.castShadow = true; stepInst.receiveShadow = true; scene.add(stepInst);
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 400, 0.045, 8, false), M(0x7a4623, { r: 0.42 }), 0, 0, 0, scene);
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts2), 400, 0.16, 8, false), M(0x2e2a24, { r: 0.7 }), 0, 0, 0, scene);

  // windows + cold shafts
  const shafts = [];
  [[5.4, 0.9], [9.6, 3.6], [14, 5.3], [18.5, 2.1]].forEach(([y, a], i) => {
    const w = group(scene, Math.sin(a) * (R - 0.02), y, Math.cos(a) * (R - 0.02)); w.rotation.y = a + Math.PI;
    box(1.6, 2.3, 0.12, M(0x2a2018), 0, 0, 0, w);
    plane(1.32, 2.0, new THREE.MeshBasicMaterial({ color: new THREE.Color(5.4, 6.6, 7.8), toneMapped: false }), 0, 0, 0.08, w);
    box(0.06, 2, 0.04, M(0x2a2018), 0, 0, 0.1, w); box(1.3, 0.06, 0.04, M(0x2a2018), 0, 0, 0.1, w);
    const hold = group(w, 0, 0, 0);
    const s = shaft(hold, 0.85, 2.6, 11, 0xbcd6f2, 0.12, 0, -2.2, 5.3, 1.5);
    s.rotation.x = 0.92 - Math.PI / 2 + Math.PI / 2; shafts.push(s);
    s.rotation.set(-1.05, 0, 0);
    s.position.set(0, -2.6, 4.8);
    // a soft light through each
    const sl = spot(scene, 0xbcd6f2, 90, Math.sin(a) * (R + 1.3), y + 1.4, Math.cos(a) * (R + 1.3), Math.sin(a) * -1.5, y - 4, Math.cos(a) * -1.5, 0.5, 0.9, i < 2 ? 1024 : 0);
  });

  // warm wall lamps
  const lamps = [[2.8, -1.1], [7.4, 2.4], [12.2, 0.4]].map(([y, a]) => {
    const g = group(scene, Math.sin(a) * (R - 0.08), y, Math.cos(a) * (R - 0.08)); g.rotation.y = a + Math.PI;
    box(0.13, 0.28, 0.06, M(0x7a5a2a, { r: 0.35, m: 0.8 }), 0, 0, 0, g);
    cyl(0.1, 0.12, 0.22, M(0x241a12, { r: 0.4, m: 0.5 }), 0, 0.12, 0.12, g, 14);
    const b = sph(0.11, new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 9, 4), toneMapped: false }), 0, 0.02, 0.12, g, { cast: false });
    halo(g, 1.7, 0xffc080, 0, 0.02, 0.15, 0.55);
    lamp(g, 0xffb670, 12, 0, 0.1, 0.5, 11);
    return g;
  });

  // door at ground (opened for burst)
  const dA = 0.45;
  const doorPos = group(scene, Math.sin(dA) * (R - 0.04), 0, Math.cos(dA) * (R - 0.04)); doorPos.rotation.y = dA + Math.PI;
  box(2.4, 3.2, 0.14, M(0x3a2a1a, { r: 0.6 }), 0, 1.6, 0.0, doorPos);
  plane(1.9, 2.8, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 3.8, 3.9), toneMapped: false }), 0, 1.4, 0.08, doorPos);
  const hinge = group(doorPos, -0.95, 0, 0.16);
  const door = rbox(1.9, 2.8, 0.1, 0.02, M(0x1c5b5a, { r: 0.55 }), 0.95, 1.4, 0, hinge);
  box(1.3, 0.8, 0.03, M(0x174c4b, { r: 0.55 }), 0.95, 2.1, 0.06, hinge);
  box(1.3, 0.8, 0.03, M(0x174c4b, { r: 0.55 }), 0.95, 0.9, 0.06, hinge);
  sph(0.07, M(0xd9b34f, { r: 0.25, m: 0.9 }), 1.65, 1.4, 0.09, hinge);
  const doorShaft = shaft(doorPos, 1.2, 3.6, 8.5, 0xd8e8f8, 0.0, 0, 1.3, 4.0, 1.4);
  doorShaft.rotation.x = Math.PI / 2 + 0.16; doorShaft.geometry.rotateY(0);

  // oil tank
  const tankG = group(scene, -1.35, 0, -1.45);
  const tankMat = M(0x9a7a3a, { r: 0.34, m: 0.82 });
  cyl(1.7, 1.7, 3.6, tankMat, 0, 2.1, 0, tankG, 40);
  [0.7, 2.1, 3.5].forEach((y) => { const b = mesh(new THREE.TorusGeometry(1.72, 0.05, 8, 48), M(0x5a4420, { r: 0.4, m: 0.8 }), 0, y, 0, tankG); b.rotation.x = Math.PI / 2; });
  const dome = mesh(new THREE.SphereGeometry(1.7, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), tankMat, 0, 3.9, 0, tankG); dome.scale.y = 0.34;
  // open hatch on the top, black interior
  const hatchY = 4.47;
  cyl(0.62, 0.66, 0.2, M(0x5a4420, { r: 0.4, m: 0.8 }), 0, hatchY, 0, tankG, 28);
  const hole = cyl(0.56, 0.56, 0.02, M(0x050403, { r: 0.1 }), 0, hatchY + 0.1, 0, tankG, 28, { cast: false });
  const lid = group(tankG, 0.62, hatchY + 0.1, 0); const lidM = cyl(0.62, 0.62, 0.06, M(0x5a4420, { r: 0.4, m: 0.8 }), -0.62, 0, 0, lid, 28); lid.rotation.z = -1.25;
  // tank ladder
  [[-0.32], [0.32]].forEach(([x]) => { const r = box(0.05, 4.4, 0.05, M(0x2a2622, { r: 0.4, m: 0.6 }), x, 2.25, 1.8, tankG); });
  for (let i = 0; i < 12; i++) box(0.68, 0.04, 0.04, M(0x2a2622, { r: 0.4, m: 0.6 }), 0, 0.35 + i * 0.35, 1.8, tankG);
  // label
  const lab = group(tankG, 0, 2.0, 1.71);
  plane(1.6, 0.8, new THREE.MeshStandardMaterial({ map: drawTex(512, 256, (g, w, h) => { g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2a2018"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); textLines(g, [{ t: "MINYAK", size: 88 }, { t: "LAMPU", size: 88, color: "#a22a22" }], w, h, { color: "#2a2018", lh: 1.06 }); }), roughness: 0.7 }), 0, 0, 0.015, lab);
  // gauge pipe, crates, bucket
  const pipe = cyl(0.08, 0.08, 18, M(0x54483a, { r: 0.5, m: 0.7 }), -4.45, 9.5, -4.2, scene, 10);
  [[5.0, 0.45, -2.3, 1, 0.9], [4.45, 0.4, -3.3, 0.9, 0.8], [5.05, 1.22, -2.5, 0.75, 0.62]].forEach(([x, y, z, w, h], i) => { const c = rbox(w, h, w, 0.03, new THREE.MeshStandardMaterial({ map: woodTex("#8a6a3e", 111 + i, 1, 1, 3), roughness: 0.8 }), x, y, z, scene); c.rotation.y = i * 0.6; });
  // scattered mess after the search (tools, bricks, papers), shown on the "Nihil" beat
  const mess = group(scene); mess.visible = false;
  const MR = (i, n) => Math.sin(i * 91.7 + n) * 0.5 + 0.5;
  for (let i = 0; i < 16; i++) {
    const c = i % 3;
    const x = -2.8 + MR(i, 1) * 7, z = -1.0 + MR(i, 2) * 5;
    if (c === 0) { const b = rbox(0.5, 0.2, 0.26, 0.02, M(0xa9613f, { r: 0.9 }), x, 0.11, z, mess); b.rotation.y = i; }
    else if (c === 1) { const p = plane(0.42, 0.56, M(0xf0eadb, { r: 0.8, side: THREE.DoubleSide }), x, 0.02, z, mess, -Math.PI / 2); p.rotation.z = i; p.castShadow = false; }
    else { const b = rbox(0.42, 0.14, 0.3, 0.03, M(0xb88a3a, { r: 0.5, m: 0.4 }), x, 0.08, z, mess); b.rotation.y = i * 0.7; }
  }

  // sound wave arcs (for tapping)
  const arcMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.8, 1.8), toneMapped: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
  const arcs = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 32, Math.PI * 0.72), arcMat.clone()); m.visible = false; scene.add(m); return m; });

  // props in hand: magnifier + flashlight + hammer
  const magnifier = group(scene); magnifier.visible = false;
  const mr = mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 28), M(0xc69b48, { r: 0.28, m: 0.9 }), 0, 0.24, 0, magnifier);
  mesh(new THREE.CircleGeometry(0.21, 28), new THREE.MeshStandardMaterial({ color: 0xcfeaf2, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.5, side: THREE.DoubleSide }), 0, 0.24, 0, magnifier, { cast: false });
  cyl(0.024, 0.03, 0.34, M(0x3a2214, { r: 0.5 }), 0, -0.13, 0, magnifier, 10);
  const hammer = group(scene); hammer.visible = false;
  cyl(0.024, 0.024, 0.42, M(0x7a5a2a, { r: 0.6 }), 0, 0, 0, hammer, 8);
  const hh = rbox(0.24, 0.1, 0.1, 0.02, M(0x3a3a40, { r: 0.35, m: 0.85 }), 0, 0.22, 0, hammer);
  const flash = group(scene); flash.visible = false;
  const ft = cyl(0.05, 0.075, 0.28, M(0x2a2a30, { r: 0.35, m: 0.7 }), 0, 0, 0, flash, 12); ft.rotation.x = Math.PI / 2;
  const fb = shaft(flash, 0.06, 0.6, 3.2, 0xfff0c8, 0.35, 0, 0, 1.75, 1.6); fb.rotation.x = -Math.PI / 2;

  // lights
  scene.add(new THREE.HemisphereLight(0xc4d6ec, 0x4a3c30, 0.95));
  const keyL = spot(scene, 0xffd9a8, 80, 2.6, 8.6, 3.2, 0, 1, 0, 0.82, 0.85, 2048);
  lamp(scene, 0x9fc0e8, 28, 0, 5.2, 0, 20);
  lamp(scene, 0xffcf96, 16, 0.6, 3.8, 3.6, 12);
  lamp(scene, 0xffd6a8, 14, 2.0, 5.2, -2.0, 9);
  lamp(scene, 0xffd6a8, 12, -1.0, 3.6, 3.6, 8);
  lamp(scene, 0xffd6a8, 12, -2.4, 7.0, -4.2, 8);

  const motes = dust(scene, 360, 10, 16, 10, 0, 7, 0, 0xd8e8ff, 0.028, 77);
  const off1 = new Actor(scene, CAST.officer1), off2 = new Actor(scene, CAST.officer2), keeper = new Actor(scene, CAST.keeper);
  const mug = cyl(0.07, 0.065, 0.14, M(0xe8e2d4, { r: 0.42 }), 0, 0, 0, scene, 16); mug.visible = false;

  const camFill = lamp(scene, 0xffe4c8, 11, 0, 2, 0, 11); camFill.userData.base = 11;
  return {
    camFill, scene, off1, off2, keeper, hinge, door, doorShaft, arcs, magnifier, hammer, flash, mess, mug, tankG, lid,
    grade: { exposure: 1.02, tint: [0.98, 1.0, 1.02], sat: 1.0, bloom: 0.62, thresh: 1.1, lift: [0.005, 0.008, 0.012], edgeColor: [0.12, 0.13, 0.15] },
    dof: { ap: 0.016, max: 0.006 },
    reset(t) {
      magnifier.visible = false; hammer.visible = false; flash.visible = false; mess.visible = false; mug.visible = false;
      arcs.forEach((a) => (a.visible = false));
      hinge.rotation.y = 0; doorShaft.material.uniforms.s.value = 0;
      off1.pose({ x: 1.5, z: 1.5, t, ry: 0.2 }); off2.pose({ x: -0.4, z: 2, t, ry: 0.2 }); keeper.root.visible = false;
    },
    update(t) { motes.set(t); shafts.forEach((s) => (s.material.uniforms.t.value = t)); },
  };
}
