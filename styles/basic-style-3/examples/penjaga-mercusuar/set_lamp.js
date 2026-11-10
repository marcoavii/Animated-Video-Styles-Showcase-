// Inside the lantern room: giant Fresnel lens, brass, glass walls, gallery outside, sea far below. One room, three moods.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, makeSky, makeSea, shaft, halo, spot, lamp, sun, gradientEnv, drawTex, textLines, tileTex, woodTex, plasterTex, ink, inkAll, dust, text3D, clamp, E } from "./kit.js";
import { Actor } from "./actor.js";
import { CAST } from "./cast.js";
import { makeGull, makeShip } from "./set_sea.js";

const MOODS = {
  day: { top: 0x2a7fc4, mid: 0x7cc0e6, hor: 0xd8eef0, sunDir: [0.6, 0.6, 0.45], sunCol: 0xfff4dc, sunGlow: 0.5, clouds: 0.62, cloudCol: 0xffffff, cloudShade: 0xa4b8d0, stars: 0, deep: 0x0f5d7e, shallow: 0x2a9db0, sky: 0xbfe2ee, fog: 0xd8eef0, glint: 1.1, foam: 0xf4fbfb, keyC: 0xfff0d8, keyI: 3.1, hemi: [0xcfe7ff, 0x8a7458, 1.0], envI: 0.6, lampWarm: 0, grade: { exposure: 1.0, tint: [1.0, 1.0, 0.97], sat: 1.05, bloom: 0.5, thresh: 1.35, lift: [0, 0.003, 0.006], edgeColor: [0.2, 0.16, 0.14] } },
  night: { top: 0x050a1c, mid: 0x0d1a38, hor: 0x24406b, sunDir: [-0.55, 0.42, -0.5], sunCol: 0xcfe0ff, sunGlow: 0.35, clouds: 0.38, cloudCol: 0x4a5c80, cloudShade: 0x121c34, stars: 1, deep: 0x041226, shallow: 0x0d2b4a, sky: 0x1d3660, fog: 0x1c3358, glint: 0.9, foam: 0x7f9cc4, keyC: 0x9db8ff, keyI: 0.7, hemi: [0x4a6aa8, 0x181420, 0.42], envI: 0.5, lampWarm: 1, grade: { exposure: 1.1, tint: [0.97, 0.98, 1.05], sat: 1.04, bloom: 0.85, thresh: 1.0, lift: [0.004, 0.006, 0.014], edgeColor: [0.2, 0.17, 0.2] } },
  dawn: { top: 0x2b4f8a, mid: 0xe29a8c, hor: 0xffcf8a, sunDir: [0.8, 0.12, 0.58], sunCol: 0xffc070, sunGlow: 1.1, clouds: 0.5, cloudCol: 0xffd0a8, cloudShade: 0x9a6a7e, stars: 0, deep: 0x214a6e, shallow: 0x7a6a78, sky: 0xeab090, fog: 0xf3b58a, glint: 1.6, foam: 0xffe8d0, keyC: 0xffb878, keyI: 3.4, hemi: [0xffd2b0, 0x4a3a50, 0.72], envI: 0.5, lampWarm: 0.12, grade: { exposure: 1.02, tint: [1.04, 0.98, 0.92], sat: 1.08, bloom: 0.8, thresh: 1.05, edgeColor: [0.22, 0.15, 0.14] } },
};

export function buildLamp(engine) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0f18);
  scene.environment = gradientEnv(engine.r, 0xeaf3ff, 0xa8b8c8, 0x4a3a2c);
  scene.environmentIntensity = 0.5;
  const sky = makeSky(scene, { ...MOODS.day, gain: 1 });
  const sea = makeSea(scene, { ...MOODS.day, y: -34, far: 1600, chop: 0.5, size: 3200, islands: [[0, 0, 30]] });
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
  const key = sun(scene, 0xffffff, 1, 40, 40, 30, 0, 1, 0, 11, 4096);

  const R = 6.6, wallH = 1.25, glassH = 3.6;
  // floor
  plane(30, 30, new THREE.MeshStandardMaterial({ map: tileTex("#7c6a4f", "#5a4c39", 51, 5, 5, 4), roughness: 0.5, metalness: 0.15 }), 0, 0, 0, scene, -Math.PI / 2);
  // cut floor outside: gallery walkway is a darker steel ring (radius R..R+2.4)
  const ring = mesh(new THREE.RingGeometry(R, R + 2.6, 48), M(0x34373c, { r: 0.55, m: 0.5, side: THREE.DoubleSide }), 0, 0.02, 0, scene, { cast: false }); ring.rotation.x = -Math.PI / 2;
  // mask out the floor plane beyond gallery by hiding it with a disc-only floor
  scene.children.find((c) => c.geometry && c.geometry.type === "PlaneGeometry" && c.geometry.parameters.width === 30).visible = false;
  const floorDisc = mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ map: tileTex("#7c6a4f", "#5a4c39", 51, 5, 5, 4), roughness: 0.5, metalness: 0.15 }), 0, 0, 0, scene, { cast: false }); floorDisc.rotation.x = -Math.PI / 2;
  // tower below
  cyl(R + 2.6, R + 0.3, 3, M(0x22242a, { r: 0.7, m: 0.2 }), 0, -1.52, 0, scene, 48);
  const towerDrop = cyl(R - 0.4, R + 2.2, 34, new THREE.MeshStandardMaterial({ color: 0xe9e3d6, roughness: 0.8 }), 0, -19, 0, scene, 48);

  // low walls + glazing bars (12 sided); glass only as faint reflection panes
  const N = 12;
  const brass = M(0xc69b48, { r: 0.28, m: 0.92 });
  const iron = M(0x2a2622, { r: 0.42, m: 0.55 });
  const wallTex = plasterTex("#2f6a66", 61, 1, 1);
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.5) / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const w = 2 * R * Math.tan(Math.PI / N);
    const pn = group(scene, s * R, 0, c * R); pn.rotation.y = a;
    box(w, wallH, 0.28, new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.7 }), 0, wallH / 2, 0, pn);
    box(w + 0.05, 0.1, 0.42, M(0x7a4623, { r: 0.4 }), 0, wallH + 0.05, 0, pn);
    const gl = mesh(new THREE.PlaneGeometry(w, glassH), new THREE.MeshStandardMaterial({ color: 0xcfe4f0, transparent: true, opacity: 0.075, roughness: 0.06, metalness: 0.5, depthWrite: false, side: THREE.DoubleSide }), 0, wallH + glassH / 2 + 0.1, 0, pn, { cast: false, recv: false });
    // mullion
    const b = group(scene, Math.sin((i / N) * Math.PI * 2) * R / Math.cos(Math.PI / N), 0, Math.cos((i / N) * Math.PI * 2) * R / Math.cos(Math.PI / N));
    cyl(0.07, 0.07, glassH + 0.2, iron, 0, wallH + glassH / 2 + 0.1, 0, b, 8);
    box(w, 0.05, 0.05, iron, 0, wallH + glassH * 0.5, 0, pn);
  }
  // roof
  const roof = mesh(new THREE.SphereGeometry(R + 0.5, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(0x3a2a22, { r: 0.75, side: THREE.DoubleSide }), 0, wallH + glassH + 0.1, 0, scene); roof.scale.y = 0.42;
  const roofRing = mesh(new THREE.TorusGeometry(R + 0.1, 0.13, 10, 64), brass, 0, wallH + glassH + 0.1, 0, scene); roofRing.rotation.x = Math.PI / 2;
  // gallery rail
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; cyl(0.03, 0.03, 1.3, iron, Math.sin(a) * (R + 2.5), 0.65, Math.cos(a) * (R + 2.5), scene, 6); }
  const rr = mesh(new THREE.TorusGeometry(R + 2.5, 0.055, 8, 96), iron, 0, 1.32, 0, scene); rr.rotation.x = Math.PI / 2;
  const rr2 = mesh(new THREE.TorusGeometry(R + 2.5, 0.03, 8, 96), iron, 0, 0.7, 0, scene); rr2.rotation.x = Math.PI / 2;

  // ===== Lens =====
  const lens = group(scene, 0, 0, 0);
  // pedestal
  const pedMat = M(0x2d5d5a, { r: 0.4, m: 0.3 });
  cyl(1.3, 1.5, 0.3, brass, 0, 0.15, 0, lens, 32);
  cyl(0.82, 1.1, 1.0, pedMat, 0, 0.8, 0, lens, 32);
  cyl(1.45, 1.05, 0.22, brass, 0, 1.42, 0, lens, 32);
  // glass rings: stacked prisms catch reflection, emissive ramps with the lamp
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xcfeaf2, roughness: 0.04, metalness: 0.88, envMapIntensity: 1.8, transparent: true, opacity: 0.62, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const ringsList = [];
  const LY = 1.55, LH = 3.3;
  for (let i = 0; i < 17; i++) {
    const u = i / 16, r = 1.0 + Math.sin(u * Math.PI) * 0.54;
    const t = mesh(new THREE.TorusGeometry(r, 0.105, 8, 44), glassMat, 0, LY + u * LH, 0, lens, { cast: false });
    t.rotation.x = Math.PI / 2; t.scale.z = 1.05; ringsList.push(t);
  }
  // brass frame around lens
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.25;
    const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16, r = 1.13 + Math.sin(u * Math.PI) * 0.54; pts.push(new THREE.Vector3(Math.sin(a) * r, LY + u * LH, Math.cos(a) * r)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.032, 8, false), brass, 0, 0, 0, lens);
  }
  [LY - 0.04, LY + LH + 0.04].forEach((y) => { const r = mesh(new THREE.TorusGeometry(1.1, 0.055, 8, 44), brass, 0, y, 0, lens); r.rotation.x = Math.PI / 2; });
  const midBand = mesh(new THREE.TorusGeometry(1.6, 0.045, 8, 44), brass, 0, LY + LH / 2, 0, lens); midBand.rotation.x = Math.PI / 2;
  const capDome = mesh(new THREE.SphereGeometry(0.72, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass, 0, LY + LH + 0.06, 0, lens); capDome.scale.y = 0.6;
  sph(0.09, brass, 0, LY + LH + 0.56, 0, lens);
  // bulb
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), toneMapped: false });
  const bulb = sph(0.42, bulbMat, 0, LY + LH / 2, 0, lens, { cast: false, recv: false });
  const glowA = halo(lens, 6.6, 0xffdca0, 0, LY + LH / 2, 0, 1.1);
  const glowB = halo(lens, 16, 0xffc884, 0, LY + LH / 2, 0, 0.26);
  const lampL = lamp(lens, 0xffcf90, 120, 0, LY + LH / 2, 0, 22);
  const nightFill = lamp(scene, 0xffbf80, 0, -0.6, 3.2, 5.0, 12);
  const leverLight = lamp(scene, 0xffd9a0, 0, 2.5, 2.0, 1.9, 4);

  // ===== The secret: lever & shutter =====
  const leverG = group(scene, 1.32, 1.05, 0.68); leverG.rotation.y = 1.06;
  rbox(0.42, 0.52, 0.16, 0.03, M(0x3a3a3a, { r: 0.4, m: 0.75 }), 0, -0.05, 0, leverG);
  const handle = group(leverG, 0, 0.0, 0.09);
  const stick = cyl(0.028, 0.028, 0.48, brass, 0, 0.24, 0, handle, 10);
  const knob = sph(0.078, M(0xa22a22, { r: 0.28 }), 0, 0.5, 0, handle);
  ink(knob, 0.012);
  // shutter drum around bulb
  const shutter = group(lens, 0, LY + LH / 2, 0);
  const flap = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.95, 28, 1, true, 0, Math.PI * 1.7), M(0x24211e, { r: 0.45, m: 0.6, side: THREE.DoubleSide }), 0, 0, 0, shutter);
  shutter.visible = false;

  // ===== props =====
  const shelfG = group(scene, -5.2, 0, -2.7); shelfG.rotation.y = 1.08;
  rbox(1.8, 1.05, 0.5, 0.03, new THREE.MeshStandardMaterial({ map: woodTex("#6b3e1e", 81, 1, 1, 3), roughness: 0.5 }), 0, 0.52, 0, shelfG);
  // log book, oil can, mug
  rbox(0.5, 0.08, 0.36, 0.02, M(0x7c2a1f, { r: 0.6 }), -0.4, 1.09, 0, shelfG);
  const can = cyl(0.11, 0.16, 0.3, M(0x70604a, { r: 0.42, m: 0.6 }), 0.3, 1.2, 0, shelfG, 16);
  const spout = cyl(0.015, 0.035, 0.38, M(0x70604a, { r: 0.42, m: 0.6 }), 0.46, 1.32, 0, shelfG, 8); spout.rotation.z = -1;
  const mugS = cyl(0.08, 0.075, 0.15, M(0xe8e2d4, { r: 0.42 }), 0.68, 1.13, 0.05, shelfG, 16);
  // clock on a post
  const clockG = group(scene, 3.15, 0, -2.3);
  cyl(0.05, 0.05, 2.6, iron, 0, 1.3, 0, clockG, 10);
  const face = cyl(0.42, 0.42, 0.08, M(0xf4efe0, { r: 0.45 }), 0, 2.7, 0, clockG, 36); face.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(0.43, 0.05, 10, 36), brass, 0, 2.7, 0.01, clockG);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; box(0.024, 0.075, 0.01, M(0x241a12), Math.sin(a) * 0.34, 2.7 + Math.cos(a) * 0.34, 0.05, clockG, { cast: false }); }
  const hM = group(clockG, 0, 2.7, 0.055), hH = group(clockG, 0, 2.7, 0.06);
  box(0.022, 0.34, 0.012, M(0x14100c), 0, 0.15, 0, hM, { cast: false }); box(0.034, 0.22, 0.012, M(0x14100c), 0, 0.1, 0, hH, { cast: false });
  // stool + bucket + cot + string lights give it the "home" feel
  const stool = group(scene, -3.0, 0, 3.0);
  cyl(0.38, 0.38, 0.08, M(0x7a4623, { r: 0.5 }), 0, 0.8, 0, stool, 22);
  [0, 1, 2].forEach((i) => { const a = i * 2.1; const l = cyl(0.03, 0.04, 0.8, M(0x5c3218), Math.sin(a) * 0.26, 0.4, Math.cos(a) * 0.26, stool, 8); l.rotation.z = Math.sin(a) * 0.12; l.rotation.x = -Math.cos(a) * 0.12; });
  const bucket = group(scene, -3.6, 0, 1.6);
  cyl(0.3, 0.24, 0.48, M(0x5c7a8a, { r: 0.42, m: 0.65 }), 0, 0.24, 0, bucket, 20);
  // gull & its seed
  const gull = makeGull(scene, 1.25);
  const gull2 = makeGull(scene, 1.15);
  // framed "home" picture hung from roof ring (ref-style gag prop of our own)
  const sign = group(scene, -4.2, 3.55, -4.9); sign.rotation.y = 0.68;
  rbox(1.5, 0.82, 0.06, 0.02, M(0x4a2c17, { r: 0.5 }), 0, 0, 0, sign);
  plane(1.38, 0.7, new THREE.MeshStandardMaterial({ map: drawTex(512, 260, (g, w, h) => { g.fillStyle = "#f3ecd8"; g.fillRect(0, 0, w, h); textLines(g, [{ t: "RUMAHKU", size: 64 }, { t: "SURGAKU", size: 64, color: "#b7362b" }], w, h, { color: "#2a2018" }); }), roughness: 0.8 }), 0, 0, 0.034, sign);
  [-0.55, 0.55].forEach((x) => { box(0.02, 0.5, 0.02, iron, x, 0.65, 0, sign); });

  // sparkles on polish
  const starShape = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const r = i % 2 ? 0.03 : 0.14; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? starShape.lineTo(x, y) : starShape.moveTo(x, y); }
  const sg = new THREE.ShapeGeometry(starShape);
  const sparkles = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8, 5), toneMapped: false, side: THREE.DoubleSide })); m.visible = false; scene.add(m); sparkles.push(m); }

  // Morse glyphs (E2)
  const morse = group(scene, 0, 0, 0); morse.visible = false;
  const mGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.9, 0.5), toneMapped: false });
  const glyphs = [];
  [[0, 0.17], [0.62, 0.17], [1.24, 0.17], [2.1, 0.5], [3.28, 0.17]].forEach(([x, r], i) => {
    const m = r > 0.2 ? mesh(new THREE.CapsuleGeometry(0.17, 0.62, 6, 16), mGlow, x, 0, 0, morse, { cast: false }) : sph(0.2, mGlow, x, 0, 0, morse, { cast: false });
    if (r > 0.2) m.rotation.z = Math.PI / 2;
    const h = halo(morse, 0.9, 0xffa040, x, 0, 0, 0.2);
    glyphs.push({ m, h });
  });

  // +5 TAHUN repeat prop
  const plus = group(scene); plus.visible = false;
  const t5 = text3D("+5", 1.25, 0x1a7fd1, { e: 0x0a3a66, ei: 0.5 }); plus.add(t5); ink(t5, 0.012, 0x0a1a2c); t5.position.set(0, 0.42, 0);
  const tt = text3D("TAHUN", 0.54, 0x1a7fd1, { e: 0x0a3a66, ei: 0.5 }); tt.position.set(0, -0.72, 0); plus.add(tt); ink(tt, 0.01, 0x0a1a2c);

  // outside smuggler silhouette for the reveal (small far below)
  const motes = dust(scene, 200, 13, 5, 13, 0, 2.6, 0, 0xffe6c0, 0.02, 33);
  const keeper = new Actor(scene, CAST.keeper);
  const rag = rbox(0.24, 0.05, 0.2, 0.02, M(0xd9d0be, { r: 0.95 }), 0, 0, 0, scene); rag.visible = false;

  const moodCols = (m) => {
    const u = sky.u, c = (x) => new THREE.Color(x);
    u.top.value.set(m.top); u.mid.value.set(m.mid); u.hor.value.set(m.hor); u.sunDir.value.set(...m.sunDir).normalize(); u.sunCol.value.set(m.sunCol); u.sunGlow.value = m.sunGlow; u.clouds.value = m.clouds; u.cloudCol.value.set(m.cloudCol); u.cloudShade.value.set(m.cloudShade); u.stars.value = m.stars;
    const s = sea.u; s.deep.value.set(m.deep); s.shallow.value.set(m.shallow); s.sky.value.set(m.sky); s.fogCol.value.set(m.fog); s.sunDir.value.set(...m.sunDir).normalize(); s.sunCol.value.set(m.sunCol); s.glint.value = m.glint; s.foam.value.set(m.foam);
    key.color.set(m.keyC); key.intensity = m.keyI; key.position.set(m.sunDir[0] * 60, m.sunDir[1] * 60, m.sunDir[2] * 60);
    hemi.color.set(m.hemi[0]); hemi.groundColor.set(m.hemi[1]); hemi.intensity = m.hemi[2];
    scene.environmentIntensity = m.envI;
  };
  let moodNow = null;

  const camFill = lamp(scene, 0xfff0dc, 2.6, 0, 2, 0, 9); camFill.userData.base = 2.6;
  const set = {
    camFill, scene, keeper, rag, gull, gull2, sparkles, lens, handle, morse, glyphs, plus, shutter, leverG, sky, sea,
    grade: MOODS.day.grade,
    dof: { ap: 0.016, max: 0.006 },
    mood(name, grade = true) { if (moodNow !== name) { moodCols(MOODS[name]); moodNow = name; } this.grade = MOODS[name].grade; },
    setLamp(v) {
      const on = clamp(v);
      bulbMat.color.setRGB(0.6 + 28 * on, 0.5 + 21 * on, 0.45 + 11 * on);
      glassMat.emissiveIntensity = 0.62 * on;
      glowA.material.opacity = on; glowB.material.opacity = on;
      lampL.intensity = 95 * on;
      nightFill.intensity = moodNow === "night" ? 12 * (0.25 + 0.75 * on) : 0;
      leverLight.intensity = moodNow === "night" ? 7 : 0;
    },
    reset(t) {
      this.mood("day");
      this.setLamp(0);
      rag.visible = false; gull.visible = false; gull2.visible = false; morse.visible = false; plus.visible = false; shutter.visible = false; handle.rotation.x = -0.5;
      sparkles.forEach((s) => (s.visible = false));
      keeper.pose({ x: -3, z: 2.6, ry: 0.5, t, expr: "happy" });
      gull.position.set(0, -50, 0); gull2.position.set(0, -50, 0);
    },
    update(t) {
      sky.set(t); sea.set(t); motes.set(t);
      hM.rotation.z = -t * 0.2 - 1; hH.rotation.z = -t * 0.015 - 2;
    },
  };
  return set;
}
