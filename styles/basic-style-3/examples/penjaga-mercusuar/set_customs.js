// Customs operations room: green walls, map table, evidence board, the arrest.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, shaft, halo, spot, lamp, gradientEnv, drawTex, textLines, tileTex, woodTex, plasterTex, ink, dust, FONT_STACK } from "./kit.js";
import { Actor } from "./actor.js";
import { CAST } from "./cast.js";
import { makeShip } from "./set_sea.js";

// Painted chart of the strait; the same geography the night shots use.
function chartTex(w = 1536, h = 1024) {
  return drawTex(w, h, (g) => {
    const sea = g.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, "#c7ddd2"); sea.addColorStop(1, "#a9cdc8");
    g.fillStyle = sea; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(60,90,90,.25)"; g.lineWidth = 2;
    for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const land = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = "#d9c79a"; g.fill(); g.lineWidth = 5; g.strokeStyle = "#7a6a48"; g.stroke(); };
    land([[0, 0], [1536, 0], [1536, 210], [1320, 270], [1100, 225], [850, 280], [640, 230], [420, 290], [210, 250], [0, 300]]);
    land([[0, 1024], [1536, 1024], [1536, 760], [1300, 700], [1040, 770], [820, 720], [560, 780], [320, 715], [0, 770]]);
    g.fillStyle = "#d9c79a"; g.beginPath(); g.ellipse(768, 480, 62, 44, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke();
    g.fillStyle = "#c23b2c"; g.fillRect(758, 425, 20, 50);
    // patrol sectors
    g.setLineDash([18, 12]); g.lineWidth = 6; g.strokeStyle = "#a22a22";
    g.beginPath(); g.ellipse(330, 510, 170, 130, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(1210, 510, 170, 130, 0, 0, 7); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#3a2c1c"; g.textAlign = "center"; g.font = `800 62px ${FONT_STACK}`;
    g.fillText("SELAT", 768, 640);
    g.font = `800 34px ${FONT_STACK}`; g.fillStyle = "#a22a22";
    g.fillText("PATROLI UTARA", 330, 515); g.fillText("PATROLI SELATAN", 1210, 515);
    g.fillStyle = "#3a2c1c"; g.font = `800 34px ${FONT_STACK}`; g.fillText("MERCUSUAR", 768, 400);
  });
}
function cardTex(title, draw) {
  return drawTex(512, 660, (g, w, h) => {
    g.fillStyle = "#f4edd9"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#caa86a"; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
    draw(g, w, h);
    g.fillStyle = "#2a2018"; g.textAlign = "center"; g.font = `800 ${title.length > 6 ? 68 : 86}px ${FONT_STACK}`;
    g.fillText(title, w / 2, h - 70);
  });
}

export function buildCustoms(engine) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10140f);
  scene.environment = gradientEnv(engine.r, 0xeaf0d8, 0x7a8a6a, 0x2a2418);
  scene.environmentIntensity = 0.32;
  const W = 11, D = 7, HH = 4.8;
  const wT = plasterTex("#47705c", 161, 3, 1);
  const wall = new THREE.MeshStandardMaterial({ map: wT, roughness: 0.82 });
  plane(W * 2, HH, wall, 0, HH / 2, -D, scene);
  plane(D * 2, HH, wall, -W, HH / 2, 0, scene, 0, Math.PI / 2);
  plane(D * 2, HH, wall, W, HH / 2, 0, scene, 0, -Math.PI / 2);
  plane(W * 2, HH, wall, 0, HH / 2, D, scene, 0, Math.PI);
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: plasterTex("#c9c5b0", 163, 2, 2), roughness: 1 }), 0, HH, 0, scene, Math.PI / 2);
  plane(W * 2, D * 2, new THREE.MeshStandardMaterial({ map: tileTex("#e4dcc4", "#8c5a3a", 165, 5, 3, 4), roughness: 0.34 }), 0, 0, 0, scene, -Math.PI / 2);
  // dado rail
  [[0, -D + 0.05, 0, W * 2], [0, D - 0.05, Math.PI, W * 2], [-W + 0.05, 0, Math.PI / 2, D * 2], [W - 0.05, 0, -Math.PI / 2, D * 2]].forEach(([x, z, ry, l]) => { const g = group(scene, x, 0, z); g.rotation.y = ry; box(l, 1.1, 0.06, M(0x2f4a3e, { r: 0.45 }), 0, 0.55, 0, g); box(l, 0.09, 0.12, M(0x7a4623, { r: 0.45 }), 0, 1.12, 0, g); });

  // sign above the door
  const signG = group(scene, -7.2, 3.7, -D + 0.06);
  rbox(3.4, 0.9, 0.08, 0.02, M(0x20302a, { r: 0.45 }), 0, 0, 0, signG);
  plane(3.2, 0.74, new THREE.MeshStandardMaterial({ map: drawTex(768, 178, (g, w, h) => { g.fillStyle = "#e9dcae"; g.fillRect(0, 0, w, h); textLines(g, [{ t: "RUANG OPERASI", size: 88 }], w, h, { color: "#20302a" }); }), roughness: 0.5 }), 0, 0, 0.044, signG);
  // door
  box(1.8, 3.2, 0.12, M(0x7a4623, { r: 0.45 }), -7.2, 1.6, -D + 0.06, scene);

  // === windows with blinds, projecting stripy sun ===
  const blinds = group(scene, 7.6, 2.8, -D + 0.05);
  plane(3.6, 2.6, new THREE.MeshBasicMaterial({ color: new THREE.Color(5.2, 5.2, 4.8), toneMapped: false }), 0, 0, 0.02, blinds);
  for (let i = 0; i < 12; i++) box(3.7, 0.11, 0.05, M(0xe9e2d0, { r: 0.7 }), 0, -1.25 + i * 0.226, 0.08, blinds, { cast: false });
  [[0, 1.4, 3.9, 0.14], [0, -1.4, 3.9, 0.14], [-1.9, 0, 0.14, 2.9], [1.9, 0, 0.14, 2.9]].forEach(([x, y, w, h]) => box(w, h, 0.16, M(0x3a2214, { r: 0.5 }), x, y, 0.02, blinds));
  const sr = shaft(scene, 1.4, 3.6, 9, 0xfff0c8, 0.07, 5.2, 2.5, -3.6, 1.5); sr.rotation.set(0.75, 0, -0.5);

  // === map table ===
  const tbl = group(scene, 0, 0, -0.6);
  rbox(8.4, 0.16, 4.6, 0.03, new THREE.MeshStandardMaterial({ map: woodTex("#6d3f20", 171, 1, 1, 4), roughness: 0.38 }), 0, 1.1, 0, tbl);
  [[-3.9, -2], [3.9, -2], [-3.9, 2], [3.9, 2]].forEach(([x, z]) => rbox(0.26, 1.04, 0.26, 0.04, M(0x472812, { r: 0.45 }), x, 0.52, z, tbl));
  const chart = plane(7.8, 4.1, new THREE.MeshStandardMaterial({ map: chartTex(), roughness: 0.7 }), 0, 1.186, 0, tbl, -Math.PI / 2, 0, { cast: false });
  // tokens
  const tokens = {};
  const mkToken = (col, sails) => { const g = group(tbl); const s = new THREE.Shape(); s.moveTo(-0.4, 0); s.lineTo(0.3, 0); s.lineTo(0.5, 0.14); s.lineTo(-0.42, 0.14); s.closePath(); const e = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false }); e.translate(0, 0, -0.11); mesh(e, M(col, { r: 0.45 }), 0, 0, 0, g); box(0.22, 0.14, 0.14, M(0xe9e2d0, { r: 0.6 }), -0.1, 0.2, 0, g); ink(g.children[0], 0.008); return g; };
  tokens.bad = mkToken(0x1c1c20); tokens.bad.position.set(-3.2, 1.2, 0.1);
  tokens.pat1 = mkToken(0x225a9e); tokens.pat1.position.set(-1.9, 1.2, 0.05);
  tokens.pat2 = mkToken(0x225a9e); tokens.pat2.position.set(2.0, 1.2, 0.05);
  // pendant lamps over table
  const pend = (x, z) => {
    const g = group(scene, x, 0, z);
    cyl(0.012, 0.012, 1.2, M(0x14100c), 0, HH - 0.6, 0, g, 6);
    const s = mesh(new THREE.CylinderGeometry(0.1, 0.58, 0.36, 28, 1, true), M(0x2b4a3c, { r: 0.42, m: 0.3, side: THREE.DoubleSide }), 0, HH - 1.3, 0, g);
    sph(0.13, new THREE.MeshBasicMaterial({ color: new THREE.Color(15, 11.5, 7), toneMapped: false }), 0, HH - 1.42, 0, g, { cast: false, recv: false });
    halo(g, 1.1, 0xffdca0, 0, HH - 1.42, 0, 0.5);
    const l = spot(g, 0xffdca0, 20, 0, HH - 1.42, 0, 0, 0, 0, 0.95, 0.9, 1024);
    return g;
  };
  pend(-2.2, -0.6); pend(2.2, -0.6);

  // === evidence board: three clue cards, each gets stamped ===
  const board = group(scene, 3.6, 2.4, D - 0.08); board.rotation.y = Math.PI;
  rbox(10, 2.9, 0.12, 0.02, M(0xa07a48, { r: 0.92 }), 0, 0, 0, board);
  const frameB = M(0x472812, { r: 0.45 });
  box(10.2, 0.14, 0.18, frameB, 0, 1.5, 0, board); box(10.2, 0.14, 0.18, frameB, 0, -1.5, 0, board); box(0.14, 3.1, 0.18, frameB, -5.05, 0, 0, board); box(0.14, 3.1, 0.18, frameB, 5.05, 0, 0, board);
  const icons = {
    radio: (g, w) => { g.strokeStyle = "#3a2c1c"; g.fillStyle = "#3a2c1c"; g.fillRect(w / 2 - 110, 200, 220, 180); g.fillStyle = "#f4edd9"; g.beginPath(); g.arc(w / 2 - 40, 290, 56, 0, 7); g.fill(); g.fillStyle = "#3a2c1c"; g.beginPath(); g.arc(w / 2 - 40, 290, 18, 0, 7); g.fill(); g.lineWidth = 14; g.beginPath(); g.moveTo(w / 2 + 64, 200); g.lineTo(w / 2 + 130, 90); g.stroke(); for (let i = 0; i < 3; i++) { g.fillStyle = "#f4edd9"; g.fillRect(w / 2 + 44, 250 + i * 30, 50, 12); } },
    spy: (g, w) => { g.fillStyle = "#3a2c1c"; g.beginPath(); g.ellipse(w / 2, 190, 136, 28, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(w / 2 - 88, 190); g.lineTo(w / 2 - 66, 90); g.lineTo(w / 2 + 66, 90); g.lineTo(w / 2 + 88, 190); g.fill(); g.lineWidth = 16; g.strokeStyle = "#3a2c1c"; g.beginPath(); g.arc(w / 2 - 60, 290, 46, 0, 7); g.stroke(); g.beginPath(); g.arc(w / 2 + 60, 290, 46, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2 - 14, 290); g.lineTo(w / 2 + 14, 290); g.stroke(); },
    print: (g, w) => { g.strokeStyle = "#3a2c1c"; g.lineWidth = 11; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(w / 2, 240, 24 + i * 22, 36 + i * 28, 0, Math.PI * 1.05, Math.PI * 2.5 - i * 0.04); g.stroke(); } },
  };
  const cards = [["RADIO", icons.radio], ["MATA-MATA", icons.spy], ["JEJAK", icons.print]].map(([t, ic], i) => {
    const g = group(board, -3.1 + i * 3.1, 0.05, 0.075);
    g.rotation.z = (i - 1) * 0.02;
    plane(1.95, 2.5, new THREE.MeshStandardMaterial({ map: cardTex(t, ic), roughness: 0.8 }), 0, 0, 0.01, g, 0, 0, { recv: true });
    const pin = sph(0.07, M(0xb23024, { r: 0.3 }), 0, 1.13, 0.05, g, { cast: false });
    // X stamp
    const xG = group(g, 0, 0.1, 0.03);
    const xM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 0.1, 0.07), toneMapped: false, transparent: true, opacity: 0.95, depthWrite: false });
    const a = mesh(new THREE.BoxGeometry(1.95, 0.28, 0.005), xM, 0, 0, 0, xG, { cast: false, recv: false }); a.rotation.z = Math.PI / 4;
    const b = mesh(new THREE.BoxGeometry(1.95, 0.28, 0.005), xM, 0, 0, 0.002, xG, { cast: false, recv: false }); b.rotation.z = -Math.PI / 4;
    xG.visible = false;
    return { g, xG };
  });

  // wall clock, filing, phone
  const clk = group(scene, -2.2, 3.6, -D + 0.08);
  const face = cyl(0.42, 0.42, 0.06, M(0xf4efe0, { r: 0.5 }), 0, 0, 0, clk, 36); face.rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(0.43, 0.04, 10, 40), M(0x1c1a18, { r: 0.4 }), 0, 0, 0.02, clk);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; box(0.022, 0.07, 0.01, M(0x2a2018), Math.sin(a) * 0.35, Math.cos(a) * 0.35, 0.04, clk, { cast: false }); }
  const hM = group(clk, 0, 0, 0.05), hH = group(clk, 0, 0, 0.055);
  box(0.02, 0.34, 0.012, M(0x1a1410), 0, 0.15, 0, hM, { cast: false }); box(0.03, 0.22, 0.012, M(0x1a1410), 0, 0.1, 0, hH, { cast: false });
  for (let i = 0; i < 3; i++) { const c = group(scene, 9.3, 0, -5.6 + i * 1.2); rbox(1.1, 2.0, 1.05, 0.03, M(0x6a7a70, { r: 0.42, m: 0.32 }), 0, 1, 0, c); [0.4, 1, 1.6].forEach((y) => { box(0.02, 0.45, 0.88, M(0x7f9085, { r: 0.42, m: 0.32 }), -0.56, y, 0, c); box(0.03, 0.04, 0.2, M(0xd9c79b, { m: 0.8, r: 0.3 }), -0.58, y + 0.08, 0, c); }); }

  // handcuffs
  const cuffs = group(scene); cuffs.visible = false;
  const cm = M(0xbfc4cc, { r: 0.22, m: 0.95 });
  [-0.12, 0.12].forEach((x) => { const t = mesh(new THREE.TorusGeometry(0.095, 0.022, 8, 24), cm, x, 0, 0, cuffs); });
  box(0.1, 0.018, 0.018, cm, 0, 0, 0, cuffs);

  // patrol boat for "selalu terlambat" uses harbor set; here keep flash & lights
  scene.add(new THREE.HemisphereLight(0xe8ecd0, 0x4a4030, 0.62));
  const key = spot(scene, 0xfff0d0, 58, 6.5, 4.6, -3.5, 0, 0.8, 0, 0.9, 0.85, 2048);
  lamp(scene, 0xe8ecd0, 16, -2.5, 3.6, 4.8, 16);
  lamp(scene, 0xe8ecd0, 13, 3.5, 3.8, 3.8, 14);
  spot(scene, 0xfff0d8, 40, 1.5, 4.5, 0.6, 3.6, 2.2, 6.9, 0.95, 0.9, 0);
  const flash = lamp(scene, 0xffffff, 0, 2, 3.2, 3.2, 24);
  // police lights sweeping in the room
  const red = lamp(scene, 0xff2a20, 0, -5, 2.6, 3, 18), blue = lamp(scene, 0x2a5cff, 0, 5, 2.6, 3, 18);

  const motes = dust(scene, 240, 18, 4.4, 12, 0, 2.4, 0, 0xfff0d0, 0.022, 51);
  const customs = new Actor(scene, CAST.customs);
  const master = new Actor(scene, CAST.harbormaster);
  const pol1 = new Actor(scene, CAST.police1), pol2 = new Actor(scene, CAST.police2);

  const camFill = lamp(scene, 0xf4f0dc, 7, 0, 2, 0, 11); camFill.userData.base = 7;
  return {
    camFill, scene, tbl, tokens, cards, customs, master, pol1, pol2, cuffs, flash, red, blue, board,
    grade: { exposure: 1.0, tint: [0.99, 1.0, 0.95], sat: 1.0, bloom: 0.55, thresh: 1.15, lift: [0.006, 0.008, 0.004], edgeColor: [0.1, 0.12, 0.09] },
    dof: { ap: 0.016, max: 0.006 },
    reset(t) {
      cards.forEach((c) => (c.xG.visible = false));
      cuffs.visible = false; flash.intensity = 0; red.intensity = 0; blue.intensity = 0;
      customs.pose({ x: -1.8, z: 2.6, ry: 2.8, t, expr: "worried" });
      master.root.visible = false; pol1.root.visible = false; pol2.root.visible = false;
    },
    update(t) { motes.set(t); hM.rotation.z = -t * 0.12; hH.rotation.z = -t * 0.01 - 2.4; sr.material.uniforms.t.value = t; },
  };
}
