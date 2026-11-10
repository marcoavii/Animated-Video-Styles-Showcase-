// Harbour-authority office: warm amber room, the place the story starts and loops back to.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, poster, plasterTex, woodTex, tileTex, textLines, halo, dust, lamp, spot, shaft, gradientEnv, glow, makeSky, text3D, mesh, inkAll, ink, drawTex, FONT_STACK } from "./kit.js";
import { Actor } from "./actor.js";
import { CAST } from "./cast.js";

export function buildOffice(engine) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120b06);
  scene.environment = gradientEnv(engine.r, 0xffd9a0, 0x8a5a30, 0x2a1608);
  scene.environmentIntensity = 0.26;
  const W = 9, D = 6.5, HH = 4.6;

  // shell
  const wallTex = plasterTex("#a9804f", 3, 2, 1);
  const wall = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92 });
  plane(W * 2, HH, wall, 0, HH / 2, -D, scene);
  plane(D * 2, HH, wall, -W, HH / 2, 0, scene, 0, Math.PI / 2);
  plane(D * 2, HH, wall, W, HH / 2, 0, scene, 0, -Math.PI / 2);
  plane(W * 2, HH, wall, 0, HH / 2, D, scene, 0, Math.PI);
  const ceil = new THREE.MeshStandardMaterial({ map: plasterTex("#6a4627", 5, 2, 2), roughness: 1 });
  plane(W * 2, D * 2, ceil, 0, HH, 0, scene, Math.PI / 2);
  const floorT = woodTex("#6b3f20", 9, 3, 3, 8);
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.42 }), 0, 0, 0, scene, -Math.PI / 2);

  // wainscot + rail on all walls
  const wain = new THREE.MeshStandardMaterial({ map: woodTex("#5c3218", 21, 3, 1, 3), roughness: 0.5 });
  const rail = M(0x3e2110, { r: 0.45 });
  [[0, -D + 0.04, 0, W * 2], [0, D - 0.04, Math.PI, W * 2], [-W + 0.04, 0, Math.PI / 2, D * 2], [W - 0.04, 0, -Math.PI / 2, D * 2]].forEach(([x, z, ry, len]) => {
    const g = group(scene, x, 0, z); g.rotation.y = ry;
    box(len, 1.25, 0.08, wain, 0, 0.625, 0, g);
    box(len, 0.1, 0.14, rail, 0, 1.28, 0, g);
    box(len, 0.16, 0.1, rail, 0, 0.08, 0.02, g);
    for (let i = -len / 2 + 0.9; i < len / 2; i += 1.8) {
      box(1.45, 0.82, 0.03, M(0x6d3d1f, { r: 0.42 }), i, 0.66, 0.05, g);
    }
  });

  // door + window on the back wall
  const door = group(scene, -5.9, 0, -D + 0.05);
  box(1.75, 3.25, 0.1, M(0x2f6c6a, { r: 0.5 }), 0, 1.625, 0, door);
  [1.05, 2.35].forEach((y) => { box(1.28, 0.92, 0.04, M(0x25595a, { r: 0.5 }), 0, y, 0.06, door); });
  box(2.05, 0.15, 0.16, rail, 0, 3.33, 0.02, door);
  [-0.95, 0.95].forEach((x) => box(0.14, 3.3, 0.16, rail, x, 1.65, 0.02, door));
  sph(0.07, M(0xd9b34f, { r: 0.25, m: 0.9 }), 0.6, 1.5, 0.11, door);

  // window with daylight harbour view: sky card, sea strip
  const winG = group(scene, 5.7, 0, -D + 0.05);
  const view = drawTex(640, 512, (g, w, h) => {
    const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, "#6fc1e6"); s.addColorStop(0.62, "#dbf0ee"); s.addColorStop(0.63, "#2f8ea6"); s.addColorStop(1, "#1b6480");
    g.fillStyle = s; g.fillRect(0, 0, w, h);
    g.fillStyle = "#6a7b77"; g.beginPath(); g.moveTo(370, 322); g.lineTo(420, 305); g.lineTo(470, 318); g.lineTo(530, 300); g.lineTo(640, 322); g.fill();
    g.fillStyle = "#f4f1e8"; g.fillRect(452, 240, 13, 72); g.fillStyle = "#cc4b3a"; g.fillRect(452, 256, 13, 15); g.fillRect(452, 284, 13, 14); g.fillStyle = "#35302a"; g.fillRect(450, 232, 17, 9);
  });
  plane(2.6, 2.3, new THREE.MeshBasicMaterial({ map: view, color: new THREE.Color(2.2, 2.2, 2.2), toneMapped: false }), 0, 2.5, 0.02, winG);
  [[0, 1.3, 2.85, 0.14], [0, 3.7, 2.85, 0.14], [-1.36, 2.5, 0.14, 2.5], [1.36, 2.5, 0.14, 2.5], [0, 2.5, 2.7, 0.06], [0, 2.5, 0.06, 2.4]].forEach(([x, y, w, h]) => box(w, h, 0.14, rail, x, y, 0.05, winG));
  box(3.1, 0.1, 0.34, rail, 0, 1.2, 0.14, winG);
  const curtain = M(0x7c2f22, { r: 0.95 });
  [-1.55, 1.55].forEach((x) => { const c = rbox(0.42, 2.9, 0.12, 0.05, curtain, x, 2.4, 0.14, winG); });
  // god ray from window
  const ray = shaft(scene, 1.15, 3.2, 8, 0xffd9a0, 0.075, 3.3, 2.3, -3.8, 1.6);
  ray.rotation.set(0.55, 0, -0.55);
  const ray2 = shaft(scene, 0.7, 2.0, 7, 0xffe7bd, 0.05, 4.2, 2.6, -4.5, 1.6);
  ray2.rotation.set(0.4, 0, -0.42);

  // posters
  poster(scene, 1.15, 1.5, -2.9, 2.75, -D + 0.05, 0, (g, w, h) => { g.fillStyle = "#f3ecd8"; g.fillRect(0, 0, w, h); textLines(g, [{ t: "DINAS PELABUHAN", size: 21, weight: 700 }, { t: " ", size: 40 }, { t: "ATURAN", size: 62 }, { t: "KANTOR", size: 62 }, { t: " ", size: 36 }, { t: "Datang tepat waktu", size: 22, weight: 500 }, { t: "Pulang tepat waktu", size: 22, weight: 500 }, { t: "Pensiun tepat waktu", size: 22, weight: 500 }], w, h, { color: "#3b2a18" }); });
  poster(scene, 1.6, 0.74, 0.25, 3.45, -D + 0.05, 0, (g, w, h) => { g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7c2a1c"; g.lineWidth = 12; g.strokeRect(14, 14, w - 28, h - 28); textLines(g, [{ t: "DILARANG", size: 86 }, { t: "TERTAWA", size: 86 }], w, h, { color: "#7c2a1c", lh: 1.08 }); }, { res: 320 });
  // clock
  const clk = group(scene, 2.1, 3.2, -D + 0.08);
  const face = cyl(0.42, 0.42, 0.06, M(0xf4efe0, { r: 0.5 }), 0, 0, 0, clk, 40); face.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(0.43, 0.04, 10, 40), M(0x3e2110, { r: 0.4 }), 0, 0, 0.02, clk);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; box(0.022, 0.07, 0.01, M(0x2a2018), Math.sin(a) * 0.35, Math.cos(a) * 0.35, 0.04, clk, { cast: false }); }
  const hMin = group(clk, 0, 0, 0.05), hHour = group(clk, 0, 0, 0.055);
  box(0.02, 0.34, 0.012, M(0x1a1410), 0, 0.15, 0, hMin, { cast: false }); box(0.03, 0.22, 0.012, M(0x1a1410), 0, 0.1, 0, hHour, { cast: false });

  // wall sconces
  const sconce = (x, z, ry) => {
    const g = group(scene, x, 3.05, z); g.rotation.y = ry;
    box(0.13, 0.26, 0.05, M(0xb88a3a, { r: 0.3, m: 0.8 }), 0, -0.06, 0, g);
    sph(0.14, new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 6.8, 4), toneMapped: false }), 0, 0.08, 0.13, g, { cast: false, recv: false });
    return g;
  };
  sconce(-4.2, -D + 0.07, 0); sconce(3.9, -D + 0.07, 0);
  lamp(scene, 0xffcf9a, 5, -4.2, 3.1, -D + 0.6, 10); lamp(scene, 0xffcf9a, 4, 3.9, 3.1, -D + 0.6, 9);
  halo(scene, 1.8, 0xffc98a, -4.2, 3.14, -D + 0.25, 0.55); halo(scene, 1.8, 0xffc98a, 3.9, 3.14, -D + 0.25, 0.55);

  // shelf with binders
  const shelf = group(scene, -7.6, 0, -6.28);
  box(2.2, 3.2, 0.4, M(0x4a2813, { r: 0.55 }), 0, 1.6, 0, shelf);
  const cols = [0x8b3a2a, 0x2d5d60, 0xc29a4a, 0x384f70, 0x6e3a53, 0x4f6b3a];
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) box(0.17, 0.48 + (i * row) % 3 * 0.04, 0.26, M(cols[(i * 3 + row) % 6], { r: 0.75 }), -0.84 + i * 0.21, 0.5 + row * 0.75, 0.16, shelf);

  // === THE BOSS DESK ===
  const desk = group(scene, 1.2, 0, -2.25);
  const dtop = rbox(3.6, 0.13, 1.5, 0.03, new THREE.MeshStandardMaterial({ map: woodTex("#7a4623", 27, 1, 1, 3), roughness: 0.3 }), 0, 1.04, 0, desk);
  const body = new THREE.MeshStandardMaterial({ map: woodTex("#663719", 31, 1, 1, 4), roughness: 0.48 });
  box(1.0, 0.98, 1.3, body, -1.25, 0.49, 0, desk); box(1.0, 0.98, 1.3, body, 1.25, 0.49, 0, desk); box(1.6, 0.8, 0.06, body, 0, 0.6, 0.6, desk);
  for (const x of [-1.25, 1.25]) for (const y of [0.26, 0.72]) { box(0.8, 0.36, 0.03, M(0x7a4623, { r: 0.4 }), x, y, 0.67, desk); sph(0.03, M(0xd9b34f, { r: 0.25, m: 0.9 }), x, y, 0.7, desk); }
  // nameplate
  const plate = group(desk, 0.45, 1.19, 0.5);
  rbox(1.0, 0.19, 0.08, 0.02, M(0x23150a, { r: 0.35 }), 0, 0, 0, plate);
  plane(0.92, 0.14, new THREE.MeshStandardMaterial({ map: drawTex(512, 78, (g, w, h) => { g.fillStyle = "#c9a14d"; g.fillRect(0, 0, w, h); textLines(g, [{ t: "KEPALA DINAS", size: 50 }], w, h, { color: "#23150a" }); }), roughness: 0.3, metalness: 0.5 }), 0, 0, 0.042, plate);
  // banker's lamp
  const bl = group(desk, -1.25, 1.1, -0.05);
  cyl(0.15, 0.17, 0.05, M(0xc49a46, { r: 0.28, m: 0.9 }), 0, 0.02, 0, bl);
  cyl(0.018, 0.018, 0.4, M(0xc49a46, { r: 0.28, m: 0.9 }), 0, 0.22, 0, bl);
  const shade = mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.17, 24, 1, true), M(0x1f6a46, { r: 0.28, side: THREE.DoubleSide }), 0.02, 0.44, 0.06, bl); shade.rotation.x = 0.2;
  sph(0.05, new THREE.MeshBasicMaterial({ color: new THREE.Color(12, 8.5, 5), toneMapped: false }), 0.02, 0.38, 0.07, bl, { cast: false });
  lamp(bl, 0xffc27a, 3.2, 0.02, 0.32, 0.12, 3.5);
  halo(bl, 0.8, 0xffcf95, 0.02, 0.34, 0.1, 0.5);
  // desk clutter
  rbox(0.5, 0.05, 0.36, 0.01, M(0x4a2813, { r: 0.5 }), 1.2, 1.13, 0, desk);
  for (let i = 0; i < 4; i++) { const pp = box(0.42, 0.012, 0.3, M(0xefe8d6), 1.2 + i * 0.008, 1.165 + i * 0.012, i * 0.012, desk, { cast: false }); pp.rotation.y = i * 0.05 - 0.08; }
  const mug = cyl(0.07, 0.065, 0.14, M(0xe8e2d4, { r: 0.4 }), 0.68, 1.18, -0.2, desk, 20);
  // stamp rack
  const stampG = group(desk, 0.1, 1.11, 0.1);
  cyl(0.07, 0.085, 0.05, M(0x7a1f1a, { r: 0.4 }), 0, 0.03, 0, stampG, 20);
  sph(0.05, M(0x2a1a10, { r: 0.4 }), 0, 0.16, 0, stampG); cyl(0.022, 0.022, 0.1, M(0x2a1a10, { r: 0.4 }), 0, 0.09, 0, stampG, 12);

  // retirement letter lying on desk, faces up
  const letterTex = drawTex(768, 1024, (g, w, h) => {
    g.fillStyle = "#f6f0df"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#caa86a"; g.lineWidth = 6; g.strokeRect(26, 26, w - 52, h - 52);
    textLines(g, [{ t: "DINAS PELABUHAN", size: 34, weight: 700, color: "#6a5230" }, { t: " ", size: 36 }, { t: "SURAT", size: 104 }, { t: "PENSIUN", size: 104 }, { t: " ", size: 40 }, { t: "Dengan hormat,", size: 34, weight: 500 }, { t: "masa tugas Anda selesai.", size: 34, weight: 500 }, { t: " ", size: 44 }], w, h, { color: "#2b2015", top: 90 });
    g.fillStyle = "#ffe36e"; g.fillRect(90, 640, w - 180, 112);
    textLines(g, [{ t: "GAJI PENUH", size: 92 }], w, 112, { color: "#2b2015", top: 640 });
    g.strokeStyle = "#3b2c1a"; g.lineWidth = 4; g.beginPath(); g.moveTo(420, 900); g.bezierCurveTo(470, 850, 500, 950, 560, 880); g.bezierCurveTo(590, 860, 620, 920, 660, 890); g.stroke();
    g.fillStyle = "#7f7360"; g.font = `500 24px ${FONT_STACK}`; g.textAlign = "left"; g.fillText("Tertanda, Kepala Dinas", 90, 920);
  });
  const letter = mesh(new THREE.PlaneGeometry(0.72, 0.96), new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.7 }), 0.15, 1.115, 0.42, desk, { cast: false });
  letter.rotation.set(-Math.PI / 2, 0, -0.1);

  // boss's chair
  const chair = group(scene, 1.2, 0, -3.65);
  rbox(1.2, 1.9, 0.2, 0.08, M(0x5a1e1a, { r: 0.55 }), 0, 1.4, -0.28, chair);
  rbox(1.15, 0.2, 1.0, 0.08, M(0x5a1e1a, { r: 0.55 }), 0, 0.72, 0, chair);
  cyl(0.05, 0.08, 0.6, M(0x2a1a10), 0, 0.32, 0, chair, 12);

  // staff desks + cabinets left side
  const staffDesk = (x, z, ry = 0) => {
    const g = group(scene, x, 0, z); g.rotation.y = ry;
    rbox(1.8, 0.08, 1.0, 0.02, new THREE.MeshStandardMaterial({ map: woodTex("#8a5429", 41, 1, 1, 3), roughness: 0.42 }), 0, 0.92, 0, g);
    [[-0.8, -0.42], [0.8, -0.42], [-0.8, 0.42], [0.8, 0.42]].forEach(([a, b]) => box(0.07, 0.9, 0.07, M(0x4a2813), a, 0.45, b, g));
    rbox(0.5, 0.26, 0.42, 0.03, M(0x34404a, { r: 0.5 }), -0.3, 1.09, -0.1, g);
    for (let i = 0; i < 3; i++) box(0.34, 0.01, 0.26, M(0xefe8d6), 0.48, 0.97 + i * 0.012, 0.05, g, { cast: false });
    return g;
  };
  staffDesk(-6.1, -3.6); staffDesk(-3.2, -3.9); staffDesk(-6.5, -1.3, 0.28);
  // file cabinet & plant
  const cab = group(scene, 7.7, 0, -5.8);
  rbox(1.0, 2.1, 0.7, 0.03, M(0x4f6359, { r: 0.42, m: 0.3 }), 0, 1.05, 0, cab);
  [0.38, 1.05, 1.72].forEach((y) => { box(0.84, 0.54, 0.03, M(0x5d7468, { r: 0.42, m: 0.3 }), 0, y, 0.36, cab); box(0.2, 0.04, 0.03, M(0xd9c79b, { m: 0.8, r: 0.3 }), 0, y + 0.1, 0.39, cab); });
  const pot = group(scene, 8.1, 0, -3.8);
  cyl(0.3, 0.22, 0.5, M(0xa8583a, { r: 0.8 }), 0, 0.25, 0, pot, 20);
  for (let i = 0; i < 9; i++) { const a = i * 2.4; const l = sph(0.26, M(0x3d6b3f, { r: 0.8 }), Math.cos(a) * 0.24, 0.8 + (i % 3) * 0.28, Math.sin(a) * 0.24, pot); l.scale.set(0.65, 1.25, 0.45); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); }
  // floor rug
  plane(5.4, 3.4, new THREE.MeshStandardMaterial({ map: drawTex(512, 320, (g, w, h) => { g.fillStyle = "#6e2a1d"; g.fillRect(0, 0, w, h); g.strokeStyle = "#d4a85a"; g.lineWidth = 8; g.strokeRect(18, 18, w - 36, h - 36); g.lineWidth = 3; g.strokeRect(36, 36, w - 72, h - 72); for (let i = 0; i < 7; i++) { g.strokeStyle = i % 2 ? "#d4a85a" : "#94402a"; g.beginPath(); g.ellipse(w / 2, h / 2, 40 + i * 24, 24 + i * 14, 0, 0, 7); g.stroke(); } }), roughness: 0.95 }), 0.6, 0.012, -0.2, scene, -Math.PI / 2);

  // lights
  scene.add(new THREE.HemisphereLight(0xffe4c4, 0x5a3c26, 0.44));
  const key = spot(scene, 0xffdcb4, 72, -2.6, 4.3, 3.8, 0.4, 1.1, -1.4, 0.72, 0.8, 2048);
  const fill = spot(scene, 0xffe4bd, 30, 4.8, 4.2, -3.2, 0.6, 1.0, -1.0, 0.8, 0.9, 1024);
  spot(scene, 0xffdcb4, 58, -3.2, 4.4, 2.2, -5.2, 1.0, -2.0, 0.85, 0.9, 1024);
  lamp(scene, 0xffd6a8, 9, -4.8, 2.6, 0.6, 9);
  lamp(scene, 0xffa86a, 4, 0.4, 2.2, 3.5, 12);

  const motes = dust(scene, 240, 16, 4, 10, 0, 2.2, -1, 0xffe0b0, 0.022, 9);

  // === 3D gag prop: +5 TAHUN ===
  const plus = group(scene, 0, 0, 0);
  const t5 = text3D("+5", 1.0, 0x1a7fd1, { e: 0x0a3a66, ei: 0.5 }); t5.position.set(-0.62, 0.0, 0); plus.add(t5); ink(t5, 0.012, 0x0a1a2c);
  const tt = text3D("TAHUN", 0.46, 0x1a7fd1, { e: 0x0a3a66, ei: 0.5 }); tt.position.set(0.0, -0.8, 0); plus.add(tt); ink(tt, 0.01, 0x0a1a2c);
  plus.visible = false;

  // stars burst used around a joyful head
  const sparks = group(scene);
  const starShape = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const r = i % 2 ? 0.035 : 0.12; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? starShape.lineTo(x, y) : starShape.moveTo(x, y); }
  const sg = new THREE.ShapeGeometry(starShape);
  const sparkList = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.4, 3.4), toneMapped: false, side: THREE.DoubleSide })); sparks.add(m); sparkList.push(m); }
  sparks.visible = false;

  // cast
  const keeper = new Actor(scene, CAST.keeper);
  const boss = new Actor(scene, CAST.boss);
  const staff = CAST.staff.map((c) => new Actor(scene, c));
  const camFill = lamp(scene, 0xffe4c4, 3.2, 0, 2, 0, 10); camFill.userData.base = 3.2;
  const set = {
    camFill, scene, keeper, boss, staff, plus, sparks, sparkList, letter,
    grade: { tint: [1.0, 0.99, 0.93], exposure: 1.06, lift: [0.016, 0.008, 0.002], sat: 0.98, bloom: 0.5, thresh: 1.15, edgeColor: [0.16, 0.09, 0.05] },
    dof: { ap: 0.016, max: 0.006 },
    reset(t) {
      plus.visible = false; sparks.visible = false;
      keeper.pose({ x: -0.35, z: -0.7, ry: 0.7, t, expr: "bored" });
      boss.pose({ x: 1.2, z: -3.25, ry: -0.05, t, expr: "neutral" });
      const sp = [[-6.1, -2.75, 0.55], [-3.2, -3.05, 0.35], [-6.1, -0.45, 0.8], [-4.3, -1.9, 0.75]];
      staff.forEach((a, i) => a.pose({ x: sp[i][0], z: sp[i][1], ry: sp[i][2], t, expr: "neutral" }));
    },
    update(t) {
      motes.set(t);
      ray.material.uniforms.t.value = t; ray2.material.uniforms.t.value = t;
      hMin.rotation.z = -t * 0.08 - 1.2; hHour.rotation.z = -t * 0.007 - 4.6;
    },
  };
  return set;
}
