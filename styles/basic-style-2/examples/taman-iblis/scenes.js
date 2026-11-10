// Taman Iblis: the proven example. Every shot is a pure function of time: draw(c, t, lt, d).
'use strict';
Object.assign(BG_GRADE, { lane: '#a4b1c9', garden: '#a4b1c9', betty: '#a4b1c9', peek: '#a4b1c9', peekFg: '#a4b1c9', crawlBack: '#a4b1c9', crawlFg: '#a4b1c9', detector: '#a4b1c9', flailBack: '#a4b1c9', bangBack: '#a4b1c9', bangFg: '#a4b1c9', loadingBack: '#a4b1c9', loadingFg: '#a4b1c9', splitTop: '#a4b1c9', scratch: '#bcc4d4', under: '#c2c8d6', angle: '#bcc4d4' });
const mineSchedule = (n, from, to, pow = .62) => Array.from({ length: n }, (_, i) => from + (to - from) * Math.pow(i / (n - 1), pow));

// ===== TENT (warm opening) =====
function paintTent(g, r) {
  fullRect(g, '#2a1d12');
  g.fillStyle = lin(g, 0, -100, 0, 800, [[0, '#6e5236'], [.4, '#b18a5e'], [1, '#d7b283']]); g.fillRect(-OVER, -OVER, W + OVER * 2, 960 + OVER);
  // canvas folds
  for (let i = 0; i < 15; i++) {
    const x = -160 + i * 160 + r() * 40;
    g.fillStyle = 'rgba(70,45,22,.14)'; g.fill(sp([[x, -OVER], [x + 40, 300], [x + 14, 790], [x - 36, 790], [x - 16, 300], [x - 34, -OVER]]));
    line(g, [[x, -OVER], [x + 30, 340], [x, 790]], 3, 'rgba(50,30,14,.5)', true);
  }
  // sagging roof
  g.fillStyle = lin(g, 0, -OVER, 0, 120, [[0, '#2c1c10'], [1, 'rgba(60,40,22,.25)']]);
  g.fill(sp([[-OVER, -OVER], [W + OVER, -OVER], [W + OVER, 40], [1300, 110], [760, 70], [240, 118], [-OVER, 50]]));
  // night outside through the open flap
  const flap = sp([[1262, 790], [1296, 340], [1420, 120], [1550, 72], [1680, 122], [1800, 340], [1838, 790]]);
  g.save(); g.clip(flap);
  g.fillStyle = lin(g, 0, 40, 0, 560, [[0, '#0d1725'], [.6, '#1d3145'], [1, '#31495c']]); g.fillRect(1200, 0, 700, 800);
  moon(g, 1548, 240, 92);
  ridge(g, r, 560, 40, '#202e3c', 1, 120, 4); ridge(g, r, 620, 26, '#2a3137', 3.3, 120, 4);
  g.fillStyle = lin(g, 0, 640, 0, 800, [[0, '#4e4934'], [1, '#2a281d']]); g.fillRect(1200, 650, 700, 150);
  line(g, [[1200, 650], [1880, 650]], 4);
  wirePost(g, 1370, 680, .9, 3); wirePost(g, 1716, 680, .9, -4); barbed(g, 1370, 612, 1716, 612, 10);
  g.restore();
  // tied-back flaps
  ink(g, sp([[1248, -30], [1320, 200], [1296, 450], [1212, 790], [1120, 790], [1192, 360]]), lin(g, 1120, 0, 1320, 0, [[0, '#caa577'], [1, '#7f5f3c']]), 6);
  ink(g, sp([[1854, -30], [1780, 200], [1806, 450], [1888, 790], [2010, 790], [2000, -30]]), lin(g, 1780, 0, 2010, 0, [[0, '#7f5f3c'], [1, '#caa577']]), 6);
  // pole
  ink(g, rrect(1070, -OVER, 36, 960 + OVER, 8), lin(g, 1070, 0, 1106, 0, [[0, '#8e6b43'], [1, '#4e3620']]), 5);
  // pinned map board
  ink(g, rrect(120, 170, 330, 244, 6), '#5a3f26', 6);
  ink(g, poly([[138, 186], [432, 186], [432, 398], [138, 398]]), '#e6d5a7', 3, q => {
    q.fillStyle = '#9dbbc2'; q.fill(sp([[138, 186], [432, 186], [432, 236], [320, 250], [230, 232], [138, 244]]));
    line(q, [[138, 244], [230, 232], [320, 250], [432, 236]], 3, '#5c4a2a', true);
    line(q, [[250, 262], [242, 320], [268, 392]], 5, '#c7332a', true);
  });
  for (const [px, py] of [[200, 300], [320, 280], [360, 340]]) { ink(g, ell(px, py, 7), '#d6241b', 3); }
  // crates against the wall
  ink(g, poly([[52, 610], [340, 610], [340, 790], [52, 790]]), lin(g, 0, 610, 0, 790, [[0, '#9b7a4b'], [1, '#684e2c']]), 6, q => { q.strokeStyle = INK; q.lineWidth = 4; q.strokeRect(70, 628, 252, 144); line(q, [[70, 628], [322, 772]], 7, '#54401f'); });
  label(g, 'AWAS', 196, 690, 54, { font: 'Stencil', fill: 'rgba(40,24,10,.7)' });
  // duckboard floor
  g.fillStyle = lin(g, 0, 790, 0, H + OVER, [[0, '#b39063'], [.5, '#c9a578'], [1, '#d9b98d']]); g.fillRect(-OVER, 790, W + OVER * 2, H);
  line(g, [[-OVER, 790], [W + OVER, 790]], 6);
  for (const [y, h] of [[850, 3], [930, 4], [1040, 5]]) line(g, [[-OVER, y], [W + OVER, y]], h, 'rgba(50,30,12,.75)');
  const rows = [[790, 850, 8], [850, 930, 6], [930, 1040, 5], [1040, 1250, 4], [1250, H + OVER, 3]];
  rows.forEach(([a, b, n], ri) => { for (let i = 0; i <= n; i++) { const x = -180 + (i + (ri % 2) * .5) * (2300 / n); line(g, [[x, a], [lerp(x, 960, -.12), b]], 3, 'rgba(50,30,12,.6)'); } });
  // warm pool of lantern light on the floor
  g.fillStyle = rad(g, 700, 880, 900, [[0, 'rgba(255,214,150,.3)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-OVER, 700, W + OVER * 2, 600);
  g.fillStyle = 'rgba(20,12,4,.32)'; g.fill(ell(690, 942, 280, 34));
}
function lantern(c, x, y, sw, glow) {
  c.save(); c.translate(x, y); c.rotate(sw);
  line(c, [[0, -420], [0, 0]], 5, '#22160c');
  softGlow(c, 0, 62, 520, `rgba(255,190,100,${.34 * glow})`);
  softGlow(c, 0, 62, 150, `rgba(255,220,150,${.8 * glow})`);
  ink(c, sp([[-26, 28], [-34, 62], [-24, 100], [24, 100], [34, 62], [26, 28]]), rad(c, 0, 66, 46, [[0, '#fff5cf'], [.5, '#ffc95f'], [1, '#d48428']]), 5);
  ink(c, rrect(-30, 12, 60, 18, 4), '#3b2c1c', 4); ink(c, rrect(-30, 98, 60, 16, 4), '#3b2c1c', 4);
  c.restore();
}
function missionMap(c, x, y, s, rot, t) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const m = sp([[-310, -210], [-120, -222], [120, -212], [312, -220], [320, 0], [308, 214], [80, 222], [-140, 212], [-316, 220], [-322, 0]]);
  ink(c, m, lin(c, 0, -220, 0, 220, [[0, '#ecdcae'], [1, '#c9b27f']]), 9, g => {
    g.fillStyle = '#88aab4'; g.fill(sp([[-340, -240], [340, -240], [340, -120], [120, -96], [-80, -128], [-340, -96]]));
    line(g, [[-340, -96], [-80, -128], [120, -96], [340, -120]], 5, '#574627', true);
    g.strokeStyle = 'rgba(70,50,20,.25)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-320 + i * 80, -90); g.lineTo(-300 + i * 76, 220); g.stroke(); }
    // enemy line and mine belt
    line(g, [[128, -100], [104, 0], [152, 110], [122, 220]], 12, '#c7332a', true);
    for (let i = 0; i < 16; i++) { g.fillStyle = '#7e2019'; g.fill(ell(160 + hash(i) * 110, -80 + hash(i + 40) * 280, 7)); }
  });
  label(c, 'EL ALAMEIN', -160, -158, 34, { font: 'Stencil', fill: '#29404a' });
  label(c, 'TAMAN IBLIS', 216, 160, 24, { font: 'Marker', fill: '#8e1f18', rot: -.08 });
  for (let i = 0; i < 6; i++) {
    const k = pop(t, Q.tanks + i * .055, .18); if (k <= 0) continue;
    const tx = -256 + (i % 3) * 110, ty = -40 + Math.floor(i / 3) * 96;
    c.save(); c.translate(tx, ty); c.scale(k, k);
    ink(c, rrect(-40, -12, 80, 28, 6), '#2f5a9e', 5); ink(c, rrect(-20, -32, 42, 22, 5), '#3f72bd', 5); line(c, [[20, -22], [52, -24]], 7, INK);
    c.restore();
  }
  redArrow(c, -80, 40, 30, -30, 190, 40, inOut(seg(t, Q.arrow, Q.arrow + .5)), { lw: 18 });
  c.restore();
}
SC.tent = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.075, 0, -46, 0, -8);
  layer(c, cam, .9, g => drawBg(g, 'tent', paintTent));
  layer(c, cam, 1, g => {
    const sw = Math.sin(t * 1.25) * .03;
    const fl = .9 + .1 * noise1(t * 11);
    lantern(g, 640, 76, sw, fl);
    const talk = t > Q.mapIn;
    soldier(g, 700, 938, 1.92, {
      face: talk ? 'blank' : 'angry', blink: blinkAt(t, .4), lookX: talk ? -1 : .2, headTilt: talk ? .06 : -.03,
      armL: talk ? [2.2, 1.45, 'fist'] : [2.1, 1.75], armR: [-.5, -1.75, 'fist'],
      holdR: (R, A) => bayonet(R, A, 180, { rot: -1.72 }),
    });
    const k = outBack(seg(t, Q.mapIn, Q.mapIn + .34), 1.1);
    if (k > 0) missionMap(g, lerp(-240, 372, k), lerp(1020, 708, k), .98, -.08 + .02 * Math.sin(t), t);
  });
  hudStrip(c, outBack(seg(t, Q.stamp1942, Q.stamp1942 + .2), 1.2), 'GURUN MESIR, 1942', 262, 81, { size: 34 });
};

// ===== LANE (one-point perspective) =====
function paintLane(g, r) {
  sky(g, '#0a121c', '#182634', '#2c3c47', 470);
  clouds(g, r, 40, 7, 'rgba(90,110,130,.22)');
  moon(g, 960, 110, 84);
  ridge(g, r, 450, 50, '#212d39', 1.2, 200, 3.5); ridge(g, r, 480, 30, '#293036', 5.5, 170, 4);
  const hz = 486;
  g.fillStyle = lin(g, 0, hz, 0, H + OVER, [[0, '#2c2b23'], [.5, '#262419'], [1, '#14130f']]); g.fillRect(-OVER, hz, W + OVER * 2, H);
  line(g, [[-OVER, hz], [W + OVER, hz]], 5);
  const yb = H + OVER, hb = 58 + .631 * (yb - hz), lane = poly([[902, hz], [1018, hz], [960 + hb, yb], [960 - hb, yb]]);
  g.fillStyle = lin(g, 0, hz, 0, H + OVER, [[0, '#6d6246'], [.55, '#53492f'], [1, '#322c1e']]); g.fill(lane);
  g.save(); g.clip(lane);
  sandSpecks(g, r, 400, hz, 1520, H + OVER, 420, ['rgba(0,0,0,.14)', 'rgba(230,220,180,.07)']);
  for (let i = 0; i < 2; i++) { const o = i ? 1 : -1; line(g, [[960 + o * 26, hz], [960 + o * (26 + .359 * (yb - hz)), yb]], 12, 'rgba(0,0,0,.14)'); }
  g.restore();
  line(g, [[902, hz], [960 - hb, yb]], 4, 'rgba(0,0,0,.6)'); line(g, [[1018, hz], [960 + hb, yb]], 4, 'rgba(0,0,0,.6)');
  sandSpecks(g, r, -OVER, hz, 700, H + OVER, 320, ['rgba(0,0,0,.2)', 'rgba(200,200,170,.04)']);
  sandSpecks(g, r, 1240, hz, W + OVER, H + OVER, 320, ['rgba(0,0,0,.2)', 'rgba(200,200,170,.04)']);
  // wrecks and posts in perspective
  wreckTruck(g, 300, 660, 1.0);
  drums(g, 1590, 640, .9);
  for (let i = 0; i < 5; i++) {
    const k = i / 5, s = lerp(1.7, .34, Math.pow(k, .55));
    const y = lerp(990, hz + 16, Math.pow(k, .55));
    const lx = lerp(250, 840, Math.pow(k, .55)), rx = lerp(1670, 1080, Math.pow(k, .55));
    wirePost(g, lx, y, s, 2); wirePost(g, rx, y, s, -2);
  }
  for (let i = 0; i < 26; i++) { const x = r() * W, y = hz + 40 + r() * 560; if (x > 560 && x < 1360) continue; tuft(g, x, y, .5 + (y - hz) / 500); }
  g.fillStyle = rad(g, 960, 700, 900, [[0, 'rgba(180,190,180,.1)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-OVER, hz, W + OVER * 2, H);
}
function wreckTruck(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  ink(g, sp([[-150, 24], [-160, -44], [-44, -60], [20, -140], [110, -142], [136, -54], [176, -36], [176, 26]]), lin(g, 0, -140, 0, 30, [[0, '#4a4f49'], [1, '#22251f']]), 5, q => { q.fillStyle = '#0f1216'; q.fill(poly([[34, -124], [94, -124], [108, -66], [-8, -66]])); q.fillStyle = 'rgba(0,0,0,.3)'; q.fill(ell(90, 20, 120, 30)); });
  ink(g, ell(-92, 36, 40), '#16171a', 5); ink(g, ell(-92, 36, 14), '#3a3d40', 4);
  ink(g, ell(118, 40, 40), '#16171a', 5);
  g.restore();
}
function drums(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (const [dx, dy, rot] of [[-56, 0, .02], [50, 8, -.04], [0, -92, .1]]) {
    g.save(); g.translate(dx, dy); g.rotate(rot);
    ink(g, rrect(-44, -48, 88, 96, 6), lin(g, -44, 0, 44, 0, [[0, '#6a5a3e'], [.45, '#4c402a'], [1, '#241e14']]), 5);
    line(g, [[-44, -14], [44, -14]], 3); line(g, [[-44, 16], [44, 16]], 3); g.restore();
  }
  g.restore();
}
SC.lane = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1.03, 1.1, 0, 0, 10, -8);
  layer(c, cam, .9, g => drawBg(g, 'lane', paintLane));
  layer(c, cam, 1, g => {
    const boom = t - Q.boom1, gx = 960, walkK = seg(t, TL.cuts[1].t, Q.boom1), gy = lerp(810, 650, walkK), s = lerp(1.42, .96, walkK);
    if (boom < 0) {
      g.fillStyle = 'rgba(0,0,0,.24)'; g.fill(ell(gx, gy + 36 * s, 34 * s, 9 * s));
      const clk = t > Q.click1;
      ghostWalk(g, gx, gy, s, clk ? 0 : t * 1.5);
      if (clk) label(g, '!', gx + 42, gy - 118, 66, { stroke: INK, fill: '#ff3b2a', weight: 900, lw: 10 });
    } else {
      // flat ghost, crater, smoke
      g.fillStyle = 'rgba(10,8,6,.62)'; g.fill(ell(gx, gy + 34, 118, 26));
      puffs(g, gx, gy + 10, boom, { n: 16, seed: 22, s: .9, life: 3.6, a: .55 });
      const land = outCubic(seg(boom, .2, .55));
      g.save(); g.translate(gx + 300, lerp(gy - 260, gy + 96, land * land)); g.rotate(1.55); ghostWalk(g, 0, 0, 1.05, 0, land > 0 ? 1 : 0); g.restore();
      if (Math.floor(t * 7) % 2 || boom > 1.3) label(g, 'LANGKAH', gx + 310, gy - 52, 22, { font: 'Marker', fill: '#57e36d' });
      if (Math.floor(t * 7) % 2 || boom > 1.3) label(g, 'TERAKHIR!!!', gx + 310, gy - 24, 22, { font: 'Marker', fill: '#57e36d' });
      explosion(g, gx, gy + 20, boom, { s: 1.15, seed: 9 });
    }
  });
  fgFrame(c, cam, 11);
  killFeed(c, t, Q.boom1 + .12, 'RANJAU', 'KAMU');
};

// ===== UNDER (cross-section of half a million mines) =====
const UNDER_MINES = (() => {
  const r = RNG(4242), out = [];
  const rows = PORTRAIT ? 9 : 5, cols = PORTRAIT ? 5 : 9, x0 = PORTRAIT ? 510 : 70, dy = PORTRAIT ? 124 : 158;
  for (let row = 0; row < rows; row++) for (let i = 0; i < cols; i++) {
    out.push({ x: x0 + i * 222 + (row % 2) * 106 + r() * 56 - 28, y: 290 + row * dy + r() * 40 - 20, s: .62 + r() * .3, face: r() < .1, k: r() });
  }
  return out.sort((a, b) => a.k - b.k);
})();
function paintUnder(g, r) {
  sky(g, '#0a121c', '#142230', '#223240', 180);
  moon(g, 300, 64, 58);
  ridge(g, r, 130, 26, '#1e2a35', 2, 170, 3);
  g.fillStyle = lin(g, 0, 170, 0, H + OVER, [[0, '#81663f'], [.16, '#6f5734'], [.55, '#4c3b24'], [1, '#231a10']]); g.fillRect(-OVER, 170, W + OVER * 2, H + OVER);
  // strata
  for (let i = 0; i < 6; i++) {
    const y = 300 + i * 150; const pts = [];
    for (let x = -OVER; x < W + OVER + 200; x += 180) pts.push([x, y + Math.sin(x * .007 + i * 2) * 20 + r() * 12]);
    line(g, pts, 3.5, 'rgba(25,14,5,.34)', true);
  }
  sandSpecks(g, r, -OVER, 180, W + OVER, H + OVER, 1200, ['rgba(0,0,0,.12)', 'rgba(255,220,160,.05)', 'rgba(0,0,0,.08)']);
  for (let i = 0; i < 26; i++) rock(g, r() * W, 240 + r() * 860, .18 + r() * .25, '#3d3224');
  const top = []; for (let x = -OVER; x < W + OVER + 200; x += 150) top.push([x, 170 + Math.sin(x * .01) * 9]);
  line(g, top, 7, INK, true);
  for (let i = 0; i < 18; i++) tuft(g, r() * W, 172, .8);
  wirePost(g, 1400, 176, 1.1, 3); wirePost(g, 1700, 176, 1.1, -3); barbed(g, 1400, 96, 1700, 96, 12);
}
SC.under = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1.13, 1.0, 0, 0, 40, 0);
  layer(c, cam, 1, g => {
    drawBg(g, 'under', paintUnder);
    const sch = mineSchedule(UNDER_MINES.length, Q.minesFrom, Q.minesTo);
    UNDER_MINES.forEach((m, i) => {
      const k = pop(t, sch[i], .16); if (k <= 0) return;
      tellerMine(g, m.x, m.y, m.s * k, { face: m.face });
      const a = 1 - seg(t, sch[i], sch[i] + .28);
      if (a > 0) softGlow(g, m.x, m.y, 110, 'rgba(255,120,60,.8)', a * .7);
    });
  });
  const n = Math.round(lerp(0, 500000, Math.pow(seg(t, Q.minesFrom, Q.minesTo), 2.2)));
  if (t > Q.minesFrom) hud(c, g => label(g, n.toLocaleString('id-ID'), OW - 60, PORTRAIT ? 190 : 76, 72, { align: 'right', stroke: INK, fill: '#ffd24a', weight: 900, lw: 14 }));
};

// ===== DEVIL'S GARDEN =====
function paintGarden(g, r) {
  desertBack(g, r, { hz: 490, mx: 1600, my: 150, mr: 96 });
  sandGround(g, r, 610, { seed: 2, amp: 18, px: 900 });
  rock(g, 1820, 690, 1.3); wreckTruck(g, 120, 600, .7);
  wirePost(g, 690, 640, 1); wirePost(g, 1460, 636, 1); barbed(g, 690, 562, 1460, 556, 14);
  for (let i = 0; i < 24; i++) tuft(g, r() * W, 640 + r() * 380, .7 + r() * .6);
}
const GARDEN_ROWS = [[760, 742], [980, 758], [1210, 746], [1440, 762], [1668, 748], [860, 900], [1100, 918], [1340, 906], [1590, 920]];
function devilFlower(g, x, y, k, t, i) {
  const h = 92 * k;
  line(g, [[x, y - 16], [x + 8 * Math.sin(t * 2 + i), y - 16 - h]], 11, INK, true);
  line(g, [[x, y - 16], [x + 8 * Math.sin(t * 2 + i), y - 16 - h]], 5, '#3b7a35', true);
  const fx = x + 8 * Math.sin(t * 2 + i), fy = y - 16 - h;
  if (k > .2) {
    g.save(); g.translate(fx, fy); g.scale(k, k); g.rotate(Math.sin(t * 2.2 + i) * .1);
    for (let p = 0; p < 7; p++) { g.save(); g.rotate(p * .8976); ink(g, sp([[0, -10], [20, -36], [0, -56], [-20, -36]]), lin(g, 0, -10, 0, -56, [[0, '#e03a2e'], [1, '#8d1414']]), 4.5); g.restore(); }
    skull(g, 0, 0, .78);
    g.restore();
  }
}
function rommelFig(g, t, tilt) {
  soldier(g, 330, 900, 1.48, {
    kit: 'rommel', face: 'smug', blink: blinkAt(t, 1.1), lookX: .8, headTilt: .05,
    armL: [2.2, 1.4, 'fist'], armR: [.42 - tilt * .4, .1 - tilt * .3, 'fist'],
    holdR: (R, A) => {
      const q = R.c; q.save(); q.translate(A.hx, A.hy); q.rotate(tilt);
      R.shape(sp([[10, -30], [108, -36], [122, 36], [14, 44]]), lin(q, 0, -30, 0, 44, [[0, '#8fa3ad'], [1, '#4e5e68']]), 5);
      R.shape(poly([[110, -2], [202, -52], [216, -44], [122, 30]]), '#6c7e88', 5);
      R.shape(sp([[192, -68], [228, -60], [226, -30], [202, -34]]), '#8fa3ad', 5);
      R.fn(o => { o.lineWidth = 8; o.strokeStyle = INK; o.beginPath(); o.arc(52, -34, 34, 3.14, 0); o.stroke(); });
      q.restore();
    },
    extra: R => {
      // apron
      R.shape(sp([[-48, -100], [48, -100], [62, 62], [-62, 62]]), lin(R.c, 0, -100, 0, 60, [[0, '#d7d3c3'], [1, '#9a9685']]), 5);
      R.fn(o => { label(o, 'KEBUN', 0, -24, 26, { font: 'Stencil', fill: '#3a382f' }); label(o, 'SAYA', 0, 8, 26, { font: 'Stencil', fill: '#3a382f' }); });
    },
  });
}
SC.garden = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.07, 20, -30, 0, 0);
  layer(c, cam, .85, g => drawBg(g, 'garden', paintGarden));
  layer(c, cam, 1, g => {
    GARDEN_ROWS.forEach(([x, y], i) => {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fill(ell(x, y + 24, 90, 18));
      tellerMine(g, x, y, .86, {});
      const k = outElastic(seg(t, Q.bloom + i * .05, Q.bloom + .55 + i * .05));
      if (k > 0) devilFlower(g, x, y, k, t, i);
    });
    const tilt = .26 + Math.sin(t * 3) * .05;
    for (let i = 0; i < 14; i++) {
      const p = ((t * 1.7 + i / 14) % 1), dx = 650 + i * 2.5 + p * 70, dy = 650 + p * p * 220;
      g.fillStyle = 'rgba(160,215,255,.86)'; g.fill(ell(dx + hash(i) * 40, dy, 4, 8));
    }
    rommelFig(g, t, tilt);
    if (t < Q.signSlam + 1.2) { const lbl = pop(t, Q.rommel, .2); if (lbl > 0) { g.save(); g.translate(330, 268); g.scale(lbl, lbl); g.fillStyle = 'rgba(10,8,6,.84)'; g.fill(rrect(-108, -28, 216, 56, 5)); label(g, 'ROMMEL', 0, 2, 36, { font: 'Stencil', fill: '#f2e4bb' }); g.restore(); } }
    // sign slam
    const sk = seg(t, Q.signSlam, Q.signSlam + .15), sy = lerp(-560, 0, sk * sk);
    if (sk > 0) {
      const bounce = t > Q.signSlam + .15 ? Math.sin((t - Q.signSlam - .15) * 22) * 7 * Math.exp(-(t - Q.signSlam - .15) * 7) : 0;
      g.save(); g.translate(1160, 632 + sy + bounce); g.rotate(-.025);
      ink(g, rrect(-24, -340, 48, 400, 6), lin(g, -24, 0, 24, 0, [[0, '#7e5e3a'], [1, '#3d2a16']]), 6);
      ink(g, sp([[-400, -500], [0, -522], [400, -504], [412, -300], [400, -176], [0, -160], [-402, -178], [-412, -340]]), lin(g, 0, -520, 0, -170, [[0, '#a07c4e'], [1, '#6a4c2a']]), 8, q => { q.strokeStyle = 'rgba(30,16,4,.4)'; q.lineWidth = 4; for (const yy of [-420, -330, -240]) { q.beginPath(); q.moveTo(-420, yy); q.lineTo(420, yy + 6); q.stroke(); } });
      label(g, 'TAMAN IBLIS', 0, -372, 96, { font: 'Stencil', fill: '#f4e7c4', stroke: '#2a1a0c', lw: 12 });
      label(g, 'DILARANG INJAK RUMPUT', 0, -252, 36, { font: 'Stencil', fill: '#ffcf85', stroke: '#2a1a0c', lw: 6 });
      skull(g, -350, -372, 1.1); skull(g, 350, -372, 1.1);
      g.restore();
      dustKick(g, 1160, 650, t - Q.signSlam - .13, 1.6);
    }
  });
};

// ===== SCOPE (porthole with theatres of war) =====
function paintScope(g, r) {
  fullRect(g, '#090b0c');
  g.save(); g.filter = 'blur(26px)';
  for (let i = 0; i < 16; i++) { const x = r() * W, y = r() * H, q = 130 + r() * 240; g.fillStyle = lin(g, 0, y - q, 0, y + q, [[0, `rgba(${62 + r() * 26},${60 + r() * 20},${40 + r() * 12},.5)`], [1, 'rgba(14,14,10,.4)']]); g.fill(ell(x, y, q * 1.5, q, r() * 3)); }
  g.restore();
  ink(g, sp([[-OVER, 160], [420, 74], [860, -60], [1300, 26], [W + OVER, 130], [W + OVER, -OVER], [-OVER, -OVER]]), lin(g, 0, -OVER, 0, 170, [[0, '#0d100c'], [1, '#262b20']]), 6);
  ink(g, sp([[-OVER, 880], [500, 960], [1100, 1020], [W + OVER, 900], [W + OVER, H + OVER], [-OVER, H + OVER]]), lin(g, 0, 880, 0, H, [[0, '#34301f'], [1, '#14120c']]), 6);
  sandSpecks(g, r, -OVER, 900, W + OVER, H + OVER, 300, ['rgba(0,0,0,.2)', 'rgba(210,200,160,.05)']);
}
SC.scope = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.09, 0, 0, 0, -10);
  layer(c, cam, 1, g => {
    drawBg(g, 'scope', paintScope);
    const cx = 960, cy = 436, R = 386;
    const swaps = [Q.lens1, Q.lens2, Q.lens3];
    const idx = swaps.filter(s => t >= s).length;
    const who = [['brit', 'AFRIKA UTARA'], ['soviet', 'FRONT RUSIA'], ['us', 'NORMANDIA'], ['german', 'SEMUA PIHAK']][idx];
    softGlow(g, cx, cy, R * 1.6, 'rgba(190,215,235,.22)');
    const ring = ell(cx, cy, R + 34);
    ink(g, ring, lin(g, 0, cy - R, 0, cy + R, [[0, '#2a2d30'], [1, '#101214']]), 8);
    const lens = ell(cx, cy, R);
    g.save(); g.clip(lens);
    g.fillStyle = lin(g, 0, cy - R, 0, cy + R, [[0, '#a3bdce'], [1, '#6e8ea6']]); g.fillRect(cx - R, cy - R, R * 2, R * 2);
    soldier(g, cx, 1212, 2.5, { kit: who[0], face: idx === 3 ? 'smug' : (idx ? 'blank' : 'worried'), blink: blinkAt(t), armL: [2.2, 1.7], armR: [1, 1.4], headTilt: Math.sin(t * .8) * .015, halo: 3 });
    g.fillStyle = 'rgba(200,225,240,.2)'; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(sp([[cx - R, cy - R * .6], [cx - R * .5, cy - R], [cx, cy - R], [cx - R * .9, cy + R * .1]]));
    g.fillStyle = rad(g, cx, cy, R, [[0, 'rgba(0,0,0,0)'], [.72, 'rgba(0,0,0,0)'], [1, 'rgba(0,10,20,.6)']]); g.fillRect(cx - R, cy - R, R * 2, R * 2);
    label(g, who[1], cx, cy + 196, 52, { font: 'Stencil', fill: '#f4efe0', stroke: '#0b0d10', lw: 12, spacing: 4 });
    // iris click on each swap
    const iris = Math.max(...swaps.map(s => 1 - Math.abs(t - s) / .07), 0);
    if (iris > 0) { g.fillStyle = `rgba(4,6,8,${iris})`; g.fillRect(cx - R, cy - R, R * 2, R * 2); }
    g.restore();
    g.lineWidth = 12; g.strokeStyle = INK; g.stroke(lens);
  });
};

// ===== SCRATCH (problem one, drawing in the sand) =====
function paintScratch(g, r) {
  desertBack(g, r, { hz: 240, mx: 240, my: 80, mr: 62 });
  sandGround(g, r, 330, { hi: '#776b4b', mid: '#5f5335', lo: '#332b1a', seed: 3, amp: 12, px: 720 });
  g.fillStyle = rad(g, 700, 650, 760, [[0, 'rgba(255,214,150,.22)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-OVER, 300, W + OVER * 2, H);
  wirePost(g, 1120, 350, 1.1, 2); wirePost(g, 1780, 340, 1.1, -3); barbed(g, 1120, 268, 1780, 262, 16);
  rock(g, 1620, 380, .9, '#494a3f');
  // ammo crate with a tiny tenant
  ink(g, poly([[108, 392], [410, 392], [410, 590], [108, 590]]), lin(g, 0, 392, 0, 590, [[0, '#a78554'], [1, '#6c5130']]), 7, q => { q.strokeStyle = INK; q.lineWidth = 4; q.strokeRect(124, 408, 270, 166); });
  ink(g, poly([[108, 392], [172, 326], [468, 326], [410, 392]]), '#c09b63', 7);
  ink(g, poly([[410, 392], [468, 326], [468, 520], [410, 590]]), '#584126', 7);
  label(g, 'AMUNISI', 259, 462, 50, { font: 'Stencil', fill: 'rgba(40,24,10,.75)', rot: -.02 });
  ink(g, ell(258, 530, 30), '#e8ecef', 4); g.fillStyle = INK; g.fill(ell(248, 528, 3.2)); g.fill(ell(268, 528, 3.2)); line(g, [[252, 540], [264, 540]], 2.6);
}
function incised(g, pathFn, k) {
  // Scratch-drawn line with lit edge, drawn on over k = 0..1.
  if (k <= 0) return;
  const p = pathFn; g.save();
  g.setLineDash([k * 1400, 1400]); g.lineCap = 'round'; g.lineJoin = 'round';
  g.translate(2, 3); g.lineWidth = 7; g.strokeStyle = 'rgba(245,225,175,.5)'; g.stroke(p);
  g.translate(-2, -3); g.lineWidth = 6.5; g.strokeStyle = 'rgba(30,18,6,.86)'; g.stroke(p);
  g.restore();
}
const SCRIBBLES = (() => {
  const qm = (x, y, s) => sp([[x - 26 * s, y - 28 * s], [x, y - 54 * s], [x + 30 * s, y - 30 * s], [x + 2 * s, y], [x, y + 24 * s]], false);
  return [
    { p: rrect(460, 588, 214, 90, 12) }, { p: ell(567, 633, 40, 22) },
    { p: rrect(800, 720, 214, 90, 12) }, { p: ell(907, 765, 40, 22) },
    { p: rrect(255, 762, 214, 90, 12) }, { p: ell(362, 807, 40, 22) },
    { p: qm(748, 600, 1.4) }, { p: qm(610, 806, 1.4) }, { p: qm(1014, 628, 1.2) }, { p: qm(202, 660, 1.2) },
    { p: sp([[495, 700], [640, 740], [770, 770]], false) }, { p: sp([[470, 790], [560, 740], [620, 700]], false) },
  ];
})();
SC.scratch = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1.02, 1.08, 10, -20, 0, -8);
  layer(c, cam, .92, g => drawBg(g, 'scratch', paintScratch));
  layer(c, cam, 1, g => {
    SCRIBBLES.forEach((s, i) => {
      const a = Q.scribble - .55 + i * .19;
      incised(g, s.p, seg(t, a, a + .24));
    });
    const thinking = t > Q.think;
    const scratchMove = Math.sin(t * 14) * .08 * (thinking ? 0 : 1);
    soldier(g, 1290, 880, 1.56, {
      stance: 'sit', face: thinking ? 'think' : 'neutral', blink: blinkAt(t, .7), lookX: thinking ? 1 : -1, lookY: thinking ? 0 : 1, headTilt: thinking ? .08 : -.1, tilt: -.08,
      armL: thinking ? [2.4, 1.6, 'fist'] : [2.55 + scratchMove, 2.2 + scratchMove, 'fist'],
      holdL: thinking ? null : (R, A) => { const q = R.c; q.save(); q.translate(A.hx, A.hy); q.rotate(A.ang - .4); R.tube([[-20, 0], [90, 16], [170, 56]], 13, '#6d4f2d', '#3f2d17'); q.restore(); },
      armR: thinking ? [-.1, -2.75, 'fist'] : [1.2, 1.3, 'open'],
    });
    thoughtDots(g, 1380, 310, t, Q.think + .2, 3, 1.1);
  });
};

// ===== POSTER (S-mine datasheet) =====
function paintPosterTall(g, r) {
  fullRect(g, '#b9a077');
  g.fillStyle = lin(g, 0, -300, 0, 1400, [[0, '#dcc89e'], [.5, '#cdb78b'], [1, '#a68e64']]); g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${90 + r() * 40},${64 + r() * 30},30,${.03 + r() * .05})`; g.fill(ell(460 + r() * 1000, -320 + r() * 1720, 20 + r() * 150, 15 + r() * 110, r() * 3)); }
  g.lineWidth = 10; g.strokeStyle = 'rgba(40,28,14,.75)'; g.strokeRect(520, -270, 880, 1620);
  g.lineWidth = 3; g.strokeRect(538, -252, 844, 1584);
  label(g, 'RANJAU S', 960, -170, 124, { font: 'Stencil', fill: '#332515' });
  label(g, 'S-MINE 35', 960, -74, 40, { font: 'Stencil', fill: 'rgba(50,34,18,.85)' });
  label(g, '"BOUNCING BETTY"', 960, -24, 40, { font: 'Stencil', fill: 'rgba(50,34,18,.85)' });
  g.fillStyle = rad(g, 960, 250, 170, [[0, 'rgba(226,108,44,.95)'], [.85, 'rgba(190,86,34,.72)'], [1, 'rgba(160,70,30,.0)']]); g.fill(ell(960, 250, 170));
  g.lineWidth = 4; g.strokeStyle = 'rgba(60,24,8,.6)'; g.stroke(ell(960, 250, 116)); g.stroke(ell(960, 250, 58));
  g.save(); g.translate(960, 310); g.scale(2.1, 2.1); g.globalAlpha = .96;
  g.lineWidth = 5; g.strokeStyle = '#231a10'; g.lineJoin = 'round';
  g.stroke(rrect(-62, -64, 124, 124, 14)); g.stroke(rrect(-44, -46, 88, 88, 8));
  g.fillStyle = 'rgba(50,34,18,.2)'; for (let i = 0; i < 44; i++) g.fill(ell(-36 + (i % 8) * 10, -36 + Math.floor(i / 8) * 13, 3.2));
  g.stroke(rrect(-14, -98, 28, 36, 4));
  for (const a of [-.5, 0, .5]) line(g, [[0, -96], [Math.sin(a) * 28, -96 - Math.cos(a) * 44]], 5, '#231a10');
  g.restore();
  [['1', 'INJAK'], ['2', 'MELOMPAT'], ['3', 'SELESAI']].forEach(([n, txt], i) => {
    const y = 510 + i * 92;
    ink(g, ell(690, y, 40), '#332515', 0); label(g, n, 690, y + 2, 48, { font: 'Stencil', fill: '#dcc89e' });
    label(g, txt, 756, y + 2, 60, { font: 'Stencil', fill: '#332515', align: 'left' });
  });
}
function paintPoster(g, r) {
  if (PORTRAIT) return paintPosterTall(g, r);
  fullRect(g, '#b9a077');
  g.fillStyle = lin(g, 0, 0, W, H, [[0, '#dcc89e'], [.5, '#cdb78b'], [1, '#a68e64']]); g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${90 + r() * 40},${64 + r() * 30},30,${.03 + r() * .05})`; g.fill(ell(r() * W, r() * H, 20 + r() * 150, 15 + r() * 110, r() * 3)); }
  g.lineWidth = 10; g.strokeStyle = 'rgba(40,28,14,.75)'; g.strokeRect(50, 44, W - 100, H - 88);
  g.lineWidth = 3; g.strokeRect(68, 62, W - 136, H - 124);
  label(g, 'RANJAU S', 960, 148, 138, { font: 'Stencil', fill: '#332515' });
  label(g, 'S-MINE 35  /  "BOUNCING BETTY"', 960, 244, 40, { font: 'Stencil', fill: 'rgba(50,34,18,.85)' });
  // target
  g.fillStyle = rad(g, 640, 490, 190, [[0, 'rgba(226,108,44,.95)'], [.85, 'rgba(190,86,34,.72)'], [1, 'rgba(160,70,30,.0)']]); g.fill(ell(640, 490, 190));
  g.lineWidth = 4; g.strokeStyle = 'rgba(60,24,8,.6)'; g.stroke(ell(640, 490, 130)); g.stroke(ell(640, 490, 66)); line(g, [[460, 490], [820, 490]], 3, 'rgba(60,24,8,.6)'); line(g, [[640, 310], [640, 670]], 3, 'rgba(60,24,8,.6)');
  // blueprint cut of the mine
  g.save(); g.translate(640, 620); g.scale(2.5, 2.5); g.globalAlpha = .96;
  g.lineWidth = 5; g.strokeStyle = '#231a10'; g.lineJoin = 'round';
  g.stroke(rrect(-62, -64, 124, 124, 14)); g.stroke(rrect(-44, -46, 88, 88, 8));
  g.fillStyle = 'rgba(50,34,18,.2)'; for (let i = 0; i < 44; i++) { g.fill(ell(-36 + (i % 8) * 10, -36 + Math.floor(i / 8) * 13, 3.2)); }
  g.stroke(rrect(-14, -98, 28, 36, 4));
  for (const a of [-.5, 0, .5]) line(g, [[0, -96], [Math.sin(a) * 28, -96 - Math.cos(a) * 44]], 5, '#231a10');
  line(g, [[-30, 74], [30, 74]], 5, '#231a10');
  g.restore();
  // steps
  const rows = [['1', 'INJAK'], ['2', 'MELOMPAT'], ['3', 'SELESAI']];
  rows.forEach(([n, txt], i) => {
    const y = 420 + i * 170;
    ink(g, ell(1150, y, 54), '#332515', 0); label(g, n, 1150, y + 2, 64, { font: 'Stencil', fill: '#dcc89e' });
    label(g, txt, 1240, y + 2, 76, { font: 'Stencil', fill: '#332515', align: 'left' });
  });
}
SC.poster = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.05, 0, 0, 0, 0);
  const hit = t - Q.stamp;
  layer(c, cam, 1, g => {
    drawBg(g, 'poster', paintPoster);
    const sx = PORTRAIT ? 960 : 1270, sy = PORTRAIT ? 1060 : 740;
    stamp(g, t, Q.stamp, sx, sy, 'BAHAYA', { size: PORTRAIT ? 120 : 138, rot: -.13 });
    if (hit > 0 && hit < .25) softGlow(g, sx, sy, 460, 'rgba(255,190,140,.8)', 1 - hit / .25);
  });
};

// ===== BETTY =====
function paintBetty(g, r) {
  desertBack(g, r, { hz: 440, mx: 300, my: 130, mr: 88 });
  sandGround(g, r, 590, { seed: 7, amp: 14, px: 1000, hi: '#625a40', mid: '#423c2a' });
  wirePost(g, 1450, 610, 1.15, 3); wirePost(g, 1780, 606, 1.15, -3); barbed(g, 1450, 524, 1780, 518, 12);
  rock(g, 170, 700, 1.1);
  for (let i = 0; i < 18; i++) tuft(g, r() * W, 630 + r() * 340, .8);
}
SC.betty = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.1, 0, -44, 0, -36);
  const boom = t - Q.boom2, jump = t - Q.betJump;
  layer(c, cam, .9, g => drawBg(g, 'betty', paintBetty));
  layer(c, cam, 1, g => {
    const gx = 1024, gy = 860, topY = 576;
    if (boom < 0) {
      const clicked = t >= Q.betClick, up = jump > 0;
      if (!up) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fill(ell(gx, gy + 10, 62, 13)); for (const a of [-.5, 0, .5]) line(g, [[gx, gy + 6], [gx + Math.sin(a) * 26, gy + 6 - Math.cos(a) * 44]], 6, '#c9cfd4'); }
      g.fillStyle = 'rgba(10,8,5,.34)'; g.fill(ell(740, gy + 40, 200, 26));
      soldier(g, 740, gy + 38, 1.58, {
        face: up ? 'shock' : clicked ? 'worried' : 'neutral', blink: !clicked && blinkAt(t), lookX: 1, lookY: up ? .2 : 1,
        sweat: up ? 1 : (clicked ? .7 : 0), tilt: up ? -.05 : 0, footDir: 1,
        armL: up ? [2.5, -2.6, 'open'] : [2.1, 1.75], armR: up ? [.3, -1.0, 'open'] : [1, 1.35],
      });
      if (up) {
        const rise = outQuart(seg(jump, 0, .24)), y = lerp(gy + 20, topY, rise) + Math.sin(jump * 2.3) * 4;
        // launch smoke column
        puffs(g, gx, gy + 20, jump, { n: 7, seed: 41, s: .35, life: 1.6, a: .5, spread: .4 });
        sMine(g, gx, y, .92, { rot: jump * .34 });
        sparkle(g, gx + 40, y - 76, 42 * twinkle(t), 1);
        const lk = outCubic(seg(t, Q.betTop - .55, Q.betTop - .25));
        if (lk > 0) {
          const dx = 1166;
          g.save(); g.globalAlpha = lk;
          line(g, [[dx, gy + 20], [dx, lerp(gy + 20, topY, lk)]], 13, INK); line(g, [[dx, gy + 20], [dx, lerp(gy + 20, topY, lk)]], 6, '#ff4a1e');
          for (const yy of [gy + 20, topY]) { line(g, [[dx - 24, yy], [dx + 24, yy]], 13, INK); line(g, [[dx - 24, yy], [dx + 24, yy]], 6, '#ff4a1e'); }
          if (PORTRAIT) label(g, '1 METER', dx + 44, topY - 54, 54, { stroke: INK, fill: '#ff5a2c', weight: 900, lw: 10 });
          else label(g, '1 METER', dx + 40, (gy + topY) / 2, 54, { align: 'left', stroke: INK, fill: '#ff5a2c', weight: 900, lw: 10 });
          g.restore();
        }
        thoughtDots(g, 610, 180, t, Q.betTop - .1, 3, 1.1, .16);
      }
    } else {
      // after the blast: boots and a falling helmet
      g.fillStyle = 'rgba(8,6,4,.72)'; g.fill(ell(860, gy + 44, 330, 40));
      for (const bx of [686, 800]) { g.save(); g.translate(bx, gy + 40); g.scale(1.58, 1.58); ink(g, sp([[-24, -36], [22, -36], [24, -14], [44, -6], [46, 4], [0, 8], [-26, 4]]), '#1a1b1f', 5); g.restore(); puffs(g, bx, gy - 16, boom - .3, { n: 6, seed: bx, s: .24, life: 2.2, a: .5, spread: .6 }); }
      const fk = seg(boom, .15, 1.15), hx = lerp(1120, 1180, fk), hy = lerp(-120, gy + 26, fk * fk);
      const bounce = boom > 1.15 ? Math.abs(Math.sin((boom - 1.15) * 11)) * 60 * Math.exp(-(boom - 1.15) * 5) : 0;
      g.save(); g.translate(hx, hy - bounce); g.rotate(boom < 1.15 ? boom * 11 : Math.sin((boom - 1.15) * 14) * .42 * Math.exp(-(boom - 1.15) * 3) + .15); g.scale(1.3, 1.3); const R = new Rig(g, 3); helmetBrit(R, 62); R.draw(); g.restore();
      explosion(g, gx - 40, topY + 70, boom, { s: 1.75, seed: 14, smoke: 26, life: 1.3 });
    }
  });
  fgFrame(c, cam, 12);
  if (boom > 0) killFeed(c, t, Q.boom2 + .25, 'RANJAU S', 'ZENI');
};

// ===== PEEK =====
function paintPeek(g, r) { desertBack(g, r, { hz: 470, mx: 420, my: 170, mr: 110 }); }
function paintPeekFg(g, r) {
  const s = sp([[-OVER, 830], [240, 770], [700, 700], [1200, 712], [1640, 790], [W + OVER, 860], [W + OVER, H + OVER], [-OVER, H + OVER]]);
  g.fillStyle = lin(g, 0, 700, 0, H, [[0, '#5a5239'], [.4, '#38331f'], [1, '#191710']]); g.fill(s);
  g.lineWidth = 7; g.strokeStyle = INK; g.stroke(s);
  g.save(); g.clip(s); sandSpecks(g, r, -OVER, 700, W + OVER, H + OVER, 640, ['rgba(0,0,0,.18)', 'rgba(210,205,170,.05)']); g.restore();
  for (let i = 0; i < 12; i++) tuft(g, r() * W, 740 + r() * 100, 1.1);
}
SC.peek = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.09, 0, 0, 0, -12);
  layer(c, cam, .5, g => drawBg(g, 'peek', paintPeek));
  layer(c, cam, 1, g => {
    const up = outBack(seg(lt, .1, .46), 1.4);
    soldier(g, 980, lerp(1660, 1120, up), 1.7, {
      face: 'angry', blink: blinkAt(t, 1.4), lookX: -.4, headTilt: -.05, armL: [2, 1.8],
      armR: [-.4, -1.68, 'fist'], holdR: (R, A) => bayonet(R, A, 200, { rot: -1.64 }),
    });
    drawBg(g, 'peekFg', paintPeekFg);
    const gk = 1 - Math.abs(t - Q.glint - .1) / .22;
    if (gk > 0) sparkle(g, 1272, 212, 108 * gk, gk);
  });
  hudStrip(c, pop(t, .05 + TL.cuts.find(s => s.scene === 'peek').t, .2), 'MASALAH #1', 960, 96);
};

// ===== CRAWL =====
function paintCrawlBack(g, r) { desertBack(g, r, { hz: 420, mx: 1500, my: 150, mr: 94 }); wirePost(g, 300, 540, .8); wirePost(g, 760, 536, .8); barbed(g, 300, 480, 760, 476, 12); wreckTruck(g, 1660, 530, .7); }
function paintCrawlFg(g, r) { sandGround(g, r, 620, { seed: 1.5, amp: 10, px: 1000, hi: '#6e6648', mid: '#47412d' }); for (let i = 0; i < 24; i++) tuft(g, r() * W, 650 + r() * 340, .9); }
SC.crawl = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1.02, 1.12, 10, -80, 0, -24);
  layer(c, cam, .42, g => drawBg(g, 'crawlBack', paintCrawlBack));
  layer(c, cam, 1, g => {
    drawBg(g, 'crawlFg', paintCrawlFg);
    const stabT = [Q.stab1, Q.stab2, Q.stab2 + 1.15];
    let reach = 0, puffAge = -1;
    for (const st of stabT) { const u = t - st + .26; if (u > 0 && u < .9) { reach = u < .26 ? outCubic(u / .26) : 1 - inOut(seg(u, .46, .9)); if (u > .26) puffAge = u - .26; } }
    const crawl = lt * 12, x = 560 + lt * 13;
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fill(ell(x - 40, 812, 410, 28));
    proneSoldier(g, x, 800, 1.26, {
      wig: Math.sin(crawl * .55), face: 'think', blink: blinkAt(t), sweat: 1,
      nearA: lerp(.82, .28, reach), nearB: lerp(.4, .31, reach),
      headDy: Math.sin(crawl * .4) * 2,
      hold: (R, A) => bayonet(R, A, 214, { rot: lerp(.42, .36, reach) }),
    });
    const tipX = x + (112 + 70 * Math.cos(lerp(.82, .28, reach)) + 72 * Math.cos(lerp(.4, .31, reach)) + 214) * 1.26 * .985;
    if (puffAge >= 0) dustKick(g, tipX - 30, 856, puffAge, .85);
    // buried suspicion
    const qk = pop(t, Q.stab2 + .2, .24);
    if (qk > 0) label(g, '?', tipX + 30, 640, 120 * qk, { stroke: INK, fill: '#ffd24a', weight: 900, lw: 18 });
  });
  fgFrame(c, cam, 13);
};

// ===== ANGLE (30 degree diagram) =====
function paintAngle(g, r) {
  sky(g, '#0b1420', '#16232f', '#25313a', 440);
  clouds(g, r, 60, 5);
  moon(g, 1660, 110, 74);
  ridge(g, r, 410, 34, '#212c37', 2.1, 180, 4);
  g.fillStyle = lin(g, 0, 440, 0, H + OVER, [[0, '#a48853'], [.25, '#82693c'], [1, '#322513']]); g.fillRect(-OVER, 440, W + OVER * 2, H + OVER);
  for (let i = 0; i < 5; i++) { const y = 540 + i * 110, pts = []; for (let x = -OVER; x < W + OVER + 200; x += 180) pts.push([x, y + Math.sin(x * .008 + i * 3) * 16]); line(g, pts, 3.5, 'rgba(30,16,5,.3)', true); }
  sandSpecks(g, r, -OVER, 450, W + OVER, H + OVER, 1000, ['rgba(0,0,0,.12)', 'rgba(255,225,170,.06)']);
  for (let i = 0; i < 12; i++) rock(g, r() * W, 620 + r() * 480, .2 + r() * .2, '#4e3f28');
  const top = []; for (let x = -OVER; x < W + OVER + 200; x += 170) top.push([x, 440 + Math.sin(x * .011) * 5]);
  line(g, top, 7, INK, true);
  for (let i = 0; i < 16; i++) tuft(g, r() * W, 442, .85);
}
SC.angle = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1.0, 1.06, 0, -24, 0, -10);
  layer(c, cam, 1, g => {
    drawBg(g, 'angle', paintAngle);
    const mx = 1190, my = 690;
    mineSide(g, mx, my, 1.04);
    const tipEnd = [mx - 198, my + 4], ang = Math.PI / 6;
    const p = inOut(seg(t, TL.cuts.find(s => s.scene === 'angle').t + .1, Q.tink));
    const L0 = 500, tipDist = lerp(L0, 0, p);
    const tip = [tipEnd[0] - Math.cos(ang) * tipDist, tipEnd[1] - Math.sin(ang) * tipDist];
    // blade below the sand line, plus arm above it
    const handD = 480, hand = [tip[0] - Math.cos(ang) * handD, tip[1] - Math.sin(ang) * handD];
    const entryX = tipEnd[0] - (tipEnd[1] - 440) / Math.tan(ang);
    g.save(); g.translate(tip[0], tip[1]); g.rotate(ang);
    ink(g, poly([[-handD, -15], [-46, -14], [0, 0], [-46, 15], [-handD, 15]]), lin(g, 0, -15, 0, 15, [[0, '#f5f7f9'], [.5, '#c8cfd6'], [1, '#79818a']]), 6);
    ink(g, rrect(-handD - 12, -26, 22, 52, 4), '#878d94', 5);
    g.restore();
    // fist and sleeve
    const R = new Rig(g, 5);
    g.save(); g.translate(hand[0], hand[1]); g.rotate(ang);
    R.tube([[-50, 0], [-500, -90]], 74, KITS.brit.coat, KITS.brit.coatDk);
    glove(R, -56, 0, 0, 1.9, 'fist');
    g.restore(); R.draw();
    // angle guide
    const gk = outCubic(seg(t, ws('g4', 1), ws('g4', 1) + .3));
    if (gk > 0) {
      g.save(); g.globalAlpha = gk;
      g.setLineDash([20, 15]); line(g, [[entryX - 10, 440], [entryX + 370, 440]], 6, '#ffd24a'); g.setLineDash([]);
      g.lineWidth = 7; g.strokeStyle = '#ffd24a'; g.beginPath(); g.arc(entryX, 440, 270, 0, ang); g.stroke();
      label(g, '30°', entryX + 318, 508, 72, { stroke: INK, fill: '#ffd24a', weight: 900, lw: 12 });
      g.restore();
    }
    // labels
    const a1 = pop(t, ws('g5', 3), .22);
    if (a1 > 0) { g.save(); g.translate(tipEnd[0] - 310, tipEnd[1] - 6); g.scale(a1, a1); label(g, 'SISI', 0, 0, 68, { stroke: INK, fill: '#6df08a', weight: 900, lw: 12 }); g.restore(); redArrow(g, tipEnd[0] - 232, tipEnd[1] + 4, tipEnd[0] - 130, tipEnd[1] + 44, tipEnd[0] - 24, tipEnd[1] + 10, a1, { lw: 11, col: '#6df08a' }); }
    const a2 = pop(t, ws('g5', 5), .22);
    if (a2 > 0) {
      g.save(); g.translate(mx + 40, 306); g.scale(a2, a2);
      label(g, 'PELATUK', 0, 0, 62, { stroke: INK, fill: '#ff4a32', weight: 900, lw: 12 });
      g.restore();
      redArrow(g, mx + 40, 348, mx + 50, 480, mx + 10, 584, a2, { lw: 14 });
      g.save(); g.translate(mx + 2, 612); g.scale(a2, a2); line(g, [[-52, -52], [52, 52]], 26, INK); line(g, [[52, -52], [-52, 52]], 26, INK); line(g, [[-52, -52], [52, 52]], 13, '#ff2d20'); line(g, [[52, -52], [-52, 52]], 13, '#ff2d20'); g.restore();
    }
    const tk = t - Q.tink;
    if (tk >= 0 && tk < .4) { sparkle(g, tipEnd[0], tipEnd[1], 130 * (1 - tk / .4), 1, '#fff6c0'); for (let i = 0; i < 9; i++) { const a = -2.4 + i * .4, q = tk * 720; g.fillStyle = '#ffe89a'; g.fill(ell(tipEnd[0] + Math.cos(a) * q, tipEnd[1] + Math.sin(a) * q + 500 * tk * tk, 5 * (1 - tk / .4))); } }
  });
};

// ===== LOADING (thumbs up, pull back, progress bar) =====
function paintLoadingBack(g, r) { desertBack(g, r, { hz: 400, mx: 1460, my: 130, mr: 72 }); }
function paintLoadingFg(g, r) {
  sandGround(g, r, 470, { seed: 5.5, amp: 12, px: 960, pool: true, hi: '#5a5339', mid: '#3f3a29' });
  for (let i = 0; i < 90; i++) {
    const y = 480 + Math.pow(r(), 1.3) * 590, x = r() * W, s = .32 + (y - 470) / 1000;
    g.fillStyle = 'rgba(0,0,0,.26)'; g.fill(ell(x, y + 4, 66 * s, 13 * s));
    if (Math.abs(x - 960) < 80 && Math.abs(y - 700) < 60) continue;
    tellerMine(g, x, y, s * .44, {});
    if (r() < .34) { line(g, [[x, y], [x + 2, y - 34 * s]], 3, '#a9adb4'); g.fillStyle = '#d6241b'; g.fill(poly([[x + 2, y - 34 * s], [x + 2 + 20 * s, y - 28 * s], [x + 2, y - 18 * s]])); }
  }
}
SC.loading = (c, t, lt, d) => {
  const pull = inOut(seg(t, Q.pull, Q.pull + .75));
  const z = lerp(4.4, 1, pull) * (1 + lt * .004);
  const fx = 960, fy = 660;
  const cx = lerp(fx - 60, 960, pull), cy = lerp(fy - 62, 540, pull);
  c.save(); c.translate(W / 2, H / 2); const zb = 1 + (z - 1) * .35; c.scale(zb, zb); c.translate(-W / 2, -H / 2); drawBg(c, 'loadingBack', paintLoadingBack); c.restore();
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cx, -cy);
  drawBg(c, 'loadingFg', paintLoadingFg);
  c.fillStyle = 'rgba(0,0,0,.36)'; c.fill(ell(fx, 700, 54, 11));
  soldier(c, fx, 700, .42, {
    face: 'happy', lookX: 0, armL: [2.1, 1.75], armR: [-.3, -1.2, 'thumb'], headTilt: .05,
  });
  c.restore();
  const bk = 1 - pull;
  if (t > Q.thumb + .06) bubble(c, lerp(1370, 1100, pull), 280, pop(t, Q.thumb + .06) * Math.max(0, bk), ':D', { w: 150, h: 112, size: 110, tail: -80 });
  const pk = outBack(seg(t, Q.bar, Q.bar + .25), 1.2);
  if (pk > 0) hud(c, g => { g.translate(0, lerp(-230, 0, pk)); progressBar(g, (OW - 900) / 2, PORTRAIT ? 130 : 42, 900, .007, 'MEMBERSIHKAN JALUR...', '0,7%'); });
};

// ===== KOSACKI =====
function paintWorkshop(g, r) {
  fullRect(g, '#2a2118');
  g.fillStyle = lin(g, 0, -100, 0, 920, [[0, '#4a3b2c'], [.6, '#6f5a42'], [1, '#594735']]); g.fillRect(-OVER, -OVER, W + OVER * 2, 920 + OVER);
  for (let i = 0; i < 13; i++) { const x = -100 + i * 180; line(g, [[x, -OVER], [x + 6, 860]], 4, 'rgba(26,16,8,.34)'); }
  // blackboard
  ink(g, rrect(98, 92, 1000, 640, 8), '#5a3f24', 10);
  ink(g, rrect(124, 116, 948, 592, 4), lin(g, 0, 116, 0, 708, [[0, '#26362f'], [1, '#172420']]), 5, q => { for (let i = 0; i < 40; i++) { q.fillStyle = 'rgba(255,255,255,.012)'; q.fill(ell(124 + r() * 950, 116 + r() * 590, 40 + r() * 120, 12 + r() * 40, r() * 3)); } });
  g.fillStyle = '#3e2b18'; g.fillRect(124, 708, 948, 18);
  ink(g, rrect(860, 690, 60, 18, 3), '#e8e8df', 3);
  // shelf
  ink(g, rrect(1200, 180, 620, 24, 3), '#4f3820', 5);
  for (let i = 0; i < 7; i++) { const w = 34 + r() * 26, h = 70 + r() * 56, x = 1230 + i * 78; ink(g, rrect(x, 180 - h, w, h, 3), ['#6b3a2a', '#35525a', '#7a6a38', '#3b3f4a'][i % 4], 4); }
  // floor
  g.fillStyle = lin(g, 0, 920, 0, H + OVER, [[0, '#3f3122'], [1, '#1d150d']]); g.fillRect(-OVER, 920, W + OVER * 2, H);
  line(g, [[-OVER, 920], [W + OVER, 920]], 6);
  g.fillStyle = rad(g, 1100, 420, 1000, [[0, 'rgba(255,214,150,.2)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
}
function chalk(g, p, k) {
  if (k <= 0) return;
  g.save(); g.setLineDash([k * 1800, 1800]); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = 'rgba(238,240,226,.9)'; g.stroke(p); g.restore();
}
SC.kosacki = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.07, 10, -30, 0, -14);
  layer(c, cam, .9, g => {
    drawBg(g, 'workshop', paintWorkshop);
    // chalk detector schematic
    const a = Q.board;
    chalk(g, sp([[250, 260], [440, 380], [650, 500]], false), seg(t, a, a + .3));
    chalk(g, ell(760, 556, 150, 50), seg(t, a + .2, a + .5));
    chalk(g, sp([[260, 250], [300, 170], [380, 150], [450, 180], [470, 260]], false), seg(t, a + .35, a + .6));
    chalk(g, rrect(232, 240, 56, 76, 14), seg(t, a + .45, a + .65));
    chalk(g, rrect(444, 240, 56, 76, 14), seg(t, a + .5, a + .7));
    chalk(g, rrect(620, 260, 290, 120, 10), seg(t, a + .55, a + .85));
    if (t > a + .85) { label(g, 'DETEKTOR', 765, 320, 52, { font: 'Marker', fill: 'rgba(238,240,226,.92)' }); }
    if (t > a + 1) for (let i = 0; i < 3; i++) { const w = (t - a - 1 - i * .3) % 1.2; if (w > 0) { g.lineWidth = 5; g.strokeStyle = `rgba(238,240,226,${.7 * (1 - w / 1.2)})`; g.stroke(ell(760, 556, 150 + w * 120, 50 + w * 42)); } }
  });
  layer(c, cam, 1, g => {
    const free = t > Q.gratis;
    soldier(g, PORTRAIT ? 1240 : 1420, 1096, 1.96, {
      kit: 'polish', face: free ? 'happy' : 'smug', glasses: !free, mustache: '#4c3621', blink: blinkAt(t, .3), lookX: -.6, headTilt: -.05,
      armL: free ? [-2.4, -1.2, 'open'] : [2.6, 2.3, 'point'], armR: free ? [-.35, -2.2, 'open'] : [1.05, 1.35],
    });
    hudStrip(c, pop(t, Q.namecard, .22), 'JÓZEF KOSACKI', 1420, 104, { font: 'Rubik', size: 54, border: '#c7332a' });
    // patent certificate torn up
    const pk = outBack(seg(t, Q.gratis - .35, Q.gratis - .1), 1.2);
    if (pk > 0) {
      g.save(); g.translate(lerp(-400, PORTRAIT ? 720 : 610, pk), 480); g.rotate(-.06);
      ink(g, rrect(-210, -270, 420, 540, 6), lin(g, 0, -270, 0, 270, [[0, '#f0e6c8'], [1, '#d3c49a']]), 8, q => {
        q.strokeStyle = 'rgba(60,40,20,.5)'; q.lineWidth = 4; for (let i = 0; i < 7; i++) { q.beginPath(); q.moveTo(-160, -110 + i * 44); q.lineTo(160, -110 + i * 44); q.stroke(); }
      });
      label(g, 'PATEN', 0, -190, 76, { font: 'Stencil', fill: '#3c2a16' });
      const xk = seg(t, Q.paten, Q.paten + .14);
      if (xk > 0) { const pa = lerp(-190, 190, xk), pb = lerp(-240, 240, xk); line(g, [[-190, -240], [pa, pb]], 34, INK); line(g, [[-190, -240], [pa, pb]], 18, '#ff2d20'); }
      const xk2 = seg(t, Q.paten + .1, Q.paten + .24);
      if (xk2 > 0) { const pa = lerp(190, -190, xk2), pb = lerp(-240, 240, xk2); line(g, [[190, -240], [pa, pb]], 34, INK); line(g, [[190, -240], [pa, pb]], 18, '#ff2d20'); }
      g.restore();
      stamp(g, t, Q.gratis, PORTRAIT ? 780 : 700, 450, 'GRATIS!', { size: PORTRAIT ? 100 : 118, rot: -.16 });
    }
  });
};

// ===== DETECTOR =====
function paintDetector(g, r) {
  desertBack(g, r, { hz: 430, mx: 1650, my: 120, mr: 78 });
  sandGround(g, r, 610, { seed: 9, amp: 10, px: 960, hi: '#6e6648', mid: '#463f2b' });
  wirePost(g, 110, 628, 1.1, 4); wirePost(g, 470, 620, 1.1, -3); barbed(g, 110, 544, 470, 538, 12);
  for (let i = 0; i < 20; i++) tuft(g, r() * W, 640 + r() * 340, .8);
}
function detectorShot(c, t, lt, d, mode) {
  const cam = camAt(lt, d, 1, 1.08, 0, -32, 0, -14);
  detectorInner(c, t, lt, cam, mode);
  fgFrame(c, cam, 17);
}
function detectorInner(c, t, lt, cam, mode) {
  layer(c, cam, .9, g => drawBg(g, 'detector', paintDetector));
  layer(c, cam, 1, g => {
    const sw = Math.sin(lt * (mode === 'metal' ? 3.2 : 2.6)) * .13, gy = 770;
    const coil = { x: 1046 + sw * 330, y: 714 };
    // ground x-ray window
    const mineX = 1170, mineY = 734;
    const revealK = mode === 'metal' ? seg(t, Q.beepLock - .4, Q.beepLock) : 1;
    const R = 148;
    g.save();
    g.beginPath(); g.ellipse(mineX, mineY, Math.max(.01, R * revealK), Math.max(.01, R * .6 * revealK), 0, 0, 6.2832); g.closePath();
    if (revealK > 0) {
      g.fillStyle = 'rgba(16,14,10,.5)'; g.fill(); g.lineWidth = 5; g.strokeStyle = mode === 'metal' ? '#ff4a2c' : 'rgba(240,240,240,.5)'; g.stroke();
      g.clip();
      if (mode === 'metal') tellerMine(g, mineX, mineY, 1.2, {}); else woodMine(g, mineX, mineY + 6, 1.05);
    }
    g.restore();
    g.fillStyle = 'rgba(0,0,0,.32)'; g.fill(ell(620, gy + 36, 186, 24));
    soldier(g, 620, gy + 34, 1.42, {
      phones: true, face: mode === 'metal' ? (t > Q.beepLock ? 'happy' : 'think') : (t > Q.buta ? 'blank' : 'think'), blink: blinkAt(t, .2), lookX: 1, lookY: .5, headTilt: .05, stride: Math.sin(lt * 2.2) * .4, footDir: 1,
      armL: [1.7, .7, 'fist'], armR: [.35, .55, 'fist'],
      holdR: (Rg, A) => detectorTool(Rg, A, sw),
    });
    if (mode === 'metal') {
      const from = Q.beepFrom, lock = Q.beepLock;
      if (t > from) {
        for (let i = 0; i < 4; i++) {
          const w = ((t * (1 + (t > lock ? 1 : 0))) + i * .25) % 1;
          g.lineWidth = 6 * (1 - w); g.strokeStyle = `rgba(120,255,160,${(1 - w) * .9})`;
          g.stroke(ell(coil.x, coil.y + 28, 70 + w * 240, 22 + w * 76));
        }
      }
      // BIP! gags
      const beeps = [from + .1, from + .55, ws('i2', 0), ws('i2', 1)];
      beeps.forEach((b, i) => {
        const k = pop(t, b, .14), a = 1 - seg(t, b + .36, b + .6);
        if (k > 0 && a > 0) { g.save(); g.globalAlpha = a; label(g, 'BIP!', (PORTRAIT ? 760 : 1000) + i * (PORTRAIT ? 130 : 160) + hash(i) * 40, 470 - hash(i + 3) * 120 - (t - b) * 40, 62 * k, { font: 'Rubik', weight: 900, fill: '#7dff9e', stroke: INK, lw: 12, rot: -.1 + hash(i) * .2 }); g.restore(); }
      });
      if (t > lock) { sparkle(g, mineX + 76, mineY - 76, 66 * twinkle(t), 1); softGlow(g, mineX, mineY, 300, 'rgba(255,80,50,.5)', .6 + .4 * Math.sin(t * 22)); }
    } else {
      // Silence: the ring never comes.
      const k = pop(t, Q.buta, .2);
      if (k > 0) { bubble(g, 860, 280, k, '?', { size: 110, w: 100, h: 84, tail: -60 }); }
      g.save(); g.globalAlpha = .8 + .2 * Math.sin(t * 3);
      label(g, 'LOGAM: 0', mineX, mineY - 124, 42, { font: 'Stencil', fill: '#f2e4bb', stroke: INK, lw: 8 }); g.restore();
    }
  });
}
SC.detector = (c, t, lt, d) => detectorShot(c, t, lt, d, 'metal');
SC.blind = (c, t, lt, d) => detectorShot(c, t, lt, d, 'wood');

// ===== GERMAN =====
function plainDark(g, r) {
  fullRect(g, '#0e1419');
  g.fillStyle = rad(g, 960, 460, 1100, [[0, '#212c33'], [.6, '#141b21'], [1, '#090d10']]); g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
}
SC.german = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.09, 0, 0, 0, -18);
  layer(c, cam, 1, g => {
    drawBg(g, 'plain', plainDark);
    const wood = t > Q.woodIn, glass = t > Q.glassIn;
    soldier(g, 960, PORTRAIT ? 1520 : 1190, PORTRAIT ? 3 : 2.2, {
      kit: 'german', face: 'smug', blink: blinkAt(t, .9), lookX: .1, headTilt: Math.sin(t * .9) * .025,
      armL: wood ? [2.7, -2.9, 'fist'] : [1.1, .2, 'fist'], armR: glass ? [.44, -.25, 'fist'] : [2, 2.85, 'fist'],
    });
    const wk = outBack(seg(t, Q.woodIn, Q.woodIn + .26), 1.5);
    if (wk > 0) {
      const wx = PORTRAIT ? 700 : 468, py = PORTRAIT ? 230 : 430, ly = PORTRAIT ? 40 : 225, ms = PORTRAIT ? .76 : 1;
      woodMine(g, wx, py, 1.75 * wk * ms);
      const lb = pop(t, Q.woodIn + .06); if (lb > 0) label(g, 'KAYU', wx, ly, 82 * lb, { font: 'Rubik', weight: 900, fill: '#ffcd80', stroke: INK, lw: 14 });
    }
    const gk = outBack(seg(t, Q.glassIn, Q.glassIn + .26), 1.5);
    if (gk > 0) {
      const gx = PORTRAIT ? 1230 : 1450, py = PORTRAIT ? 230 : 430, ly = PORTRAIT ? 40 : 225, ms = PORTRAIT ? .76 : 1;
      glassMine(g, gx, py, 1.85 * gk * ms);
      const lb = pop(t, Q.glassIn + .06); if (lb > 0) label(g, 'KACA', gx, ly, 82 * lb, { font: 'Rubik', weight: 900, fill: '#b5f4f4', stroke: INK, lw: 14 });
      sparkle(g, gx + 80, py - 90, 54 * twinkle(t, 2), 1);
    }
  });
};

// ===== BACK TO THE BAYONET =====
SC.backtobayonet = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.1, 0, 0, 0, -26);
  layer(c, cam, .6, g => drawBg(g, 'peek', paintPeek));
  layer(c, cam, 1, g => {
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
    const rise = outBack(seg(t, Q.bayoRise, Q.bayoRise + .28), 1.3);
    soldier(g, 900, 1540, 2.95, {
      face: 'blank', blink: blinkAt(t, .1), lookX: 0, headTilt: 0, armL: [2.1, 1.75],
      armR: [lerp(.9, -.05, rise), lerp(1.4, -1.4, rise), 'fist'],
      holdR: (R, A) => bayonet(R, A, 180, { rot: -1.5 }),
    });
    thoughtDots(g, PORTRAIT ? 660 : 620, PORTRAIT ? 300 : 96, t, TL.p.j4.s + .1, 3, 1.2, .2);
    const gk = 1 - Math.abs(t - Q.bayoRise - .42) / .2;
    if (gk > 0) sparkle(g, 1336, PORTRAIT ? 190 : 90, 110 * gk, gk);
  });
};

// ===== TAPE (same lane, now marked) =====
SC.tape = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1.03, 1.1, 0, -22, 8, -10);
  layer(c, cam, .9, g => drawBg(g, 'lane', paintLane));
  layer(c, cam, 1, g => {
    const hz = 486, near = PORTRAIT ? 1560 : 1250, far = PORTRAIT ? 1250 : 1560;
    const k = inOut(seg(t, Q.tapeFrom, Q.tapeFrom + .75));
    const yAt = u => lerp(near, hz + 2, 1 - Math.pow(1 - u, 2.2));
    const edge = (side, u) => { const y = yAt(u); return [960 + side * (62 + (y - hz) * .652), y]; };
    for (const side of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 40 * k; i++) pts.push(edge(side, i / 40));
      if (pts.length > 1) {
        line(g, pts, 15, 'rgba(6,6,5,.65)');
        line(g, pts, 9, '#f6f7f2');
      }
      // lanterns
      for (let i = 0; i < 6; i++) {
        const u = .2 + i * .13, tl = Q.lamps + i * .07, lk = pop(t, tl, .16); if (lk <= 0) continue;
        const [x, y] = edge(side, u), s = (y - hz) / (near - hz) * 1.8 + .22;
        softGlow(g, x, y - 52 * s, 130 * s, 'rgba(90,220,150,.72)', lk);
        g.save(); g.translate(x, y); g.scale(s * lk, s * lk);
        line(g, [[0, 0], [0, -46]], 5, INK); ink(g, rrect(-13, -68, 26, 28, 5), '#b4ffd2', 4); g.restore();
      }
    }
    // tanks rolling up the lane, far away
    const tk = seg(t, Q.lamps, Q.offArrow + 1);
    for (let i = 0; i < 3; i++) { const y = lerp(hz + 4, hz + 46, tk) - i * 12, s = lerp(.03, .14, tk) * (1 - i * .24); const x = 960; g.save(); g.translate(x, y); g.scale(s, s); ink(g, rrect(-210, -96, 420, 96, 12), '#28282a', 6); ink(g, rrect(-100, -170, 200, 76, 12), '#333336', 6); softGlow(g, -90, -40, 90, 'rgba(255,220,150,.9)'); softGlow(g, 90, -40, 90, 'rgba(255,220,150,.9)'); g.restore(); }
    // off-tape arrow + what waits there
    const ak = inOut(seg(t, Q.offArrow, Q.offArrow + .42));
    redArrow(g, 1030, 640, lerp(1030, far, .6), 520, far - 60, 720, ak, { lw: 26 });
    const sk = pop(t, Q.offArrow + .3, .22);
    if (sk > 0 && t < Q.boom3) { g.save(); g.translate(far + 30, 690); g.scale(sk, sk); skull(g, 0, 0, 3.1); g.restore(); }
    if (t > Q.offArrow + .05 && t < Q.boom3) { const wk = seg(t, Q.offArrow + .1, Q.boom3); ghostWalk(g, lerp(1160, far - 10, wk), lerp(690, 760, wk), lerp(1.2, 1.5, wk), t * 1.5); }
    explosion(g, far, 790, t - Q.boom3, { s: .72, seed: 37, smoke: 12 });
  });
  fgFrame(c, cam, 14);
  if (t > Q.boom3) killFeed(c, t, Q.boom3 + .2, 'RANJAU', 'KAMU LAGI');
};

// ===== SPLIT (white line reveal) =====
function paintSplitTop(g, r) {
  desertBack(g, r, { hz: 300, mx: 1590, my: 80, mr: 56 });
  sandGround(g, r, 340, { seed: 4, amp: 8, px: 960, hi: '#5f5539', mid: '#40392a', pool: false });
}
function paintSplitBottom(g, r) {
  fullRect(g, '#151a1e');
  g.fillStyle = rad(g, 700, 1000, 900, [[0, '#2b3238'], [1, '#101417']]); g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
}
const SPLIT_MINES = (() => { const r = RNG(77); return Array.from({ length: 14 }, (_, i) => ({ x: 130 + i * 128 + r() * 40 - 20, y: 380 + r() * 88, s: .42 + r() * .24 })); })();
SC.split = (c, t, lt, d) => {
  const sy = 520, cam = camAt(lt, d, 1, 1.05, 0, -16, 0, 0);
  // top half
  c.save(); c.beginPath(); c.rect(-OVER, -OVER, W + OVER * 2, sy + OVER); c.clip();
  const openK = outCubic(seg(lt, .35, .7));
  layer(c, cam, 1, g => {
    if (openK > 0) {
      drawBg(g, 'splitTop', paintSplitTop);
      SPLIT_MINES.forEach((m, i) => {
        tellerMine(g, m.x, m.y, m.s);
        const k = seg(t, Q.splitMines + i * .03, Q.splitMines + i * .03 + .2);
        if (k > 0) softGlow(g, m.x, m.y, 150, 'rgba(255,70,40,.7)', k * (.6 + .4 * Math.sin(t * 20 + i)));
      });
    }
  });
  c.fillStyle = `rgba(0,0,0,${1 - openK})`; c.fillRect(-OVER, -OVER, W + OVER * 2, sy + OVER);
  c.restore();
  // bottom half
  c.save(); c.beginPath(); c.rect(-OVER, sy, W + OVER * 2, H); c.clip();
  layer(c, cam, 1, g => {
    drawBg(g, 'splitBottom', paintSplitBottom);
    const smug = t > Q.smug;
    soldier(g, 720, 1400, 2.3, {
      face: smug ? 'smug' : 'angry', blink: blinkAt(t), lookX: .7, armL: [2, 1.75],
      armR: [.2, -.55, 'fist'], headTilt: .05,
    });
    plunger(g, 1370, 1050, 2, seg(t, Q.splitMines + .36, Q.splitMines + .46));
  });
  c.restore();
  // the line
  const lk = outQuart(seg(lt, 0, .34));
  softGlow(c, W / 2, sy, 900, 'rgba(255,255,255,.1)');
  c.fillStyle = '#fbf8ee'; c.fillRect(W / 2 - W / 2 * lk, sy - 7, W * lk, 14);
};

// ===== BANGALORE =====
function paintBangBack(g, r) { desertBack(g, r, { hz: 430, mx: 640, my: 130, mr: 80 }); }
function paintBangFg(g, r) {
  sandGround(g, r, 620, { seed: 3.3, amp: 10, px: 1000, hi: '#6e6648', mid: '#47412d' });
  for (let i = 0; i < 24; i++) tuft(g, r() * W, 650 + r() * 340, .85);
  wirePost(g, 1320, 636, 1, 3); wirePost(g, 1680, 630, 1, -2); barbed(g, 1320, 552, 1680, 548, 14);
}
const BANG_X = [950, 1130, 1300, 1470, 1640, 1810];
const X_PLUNGER = 120;
SC.bangalore = (c, t, lt, d) => {
  const cam = PORTRAIT ? camAt(lt, d, 1, 1.03) : camAt(lt, d, 1.08, 1.14, 76, -10, -30, -44);
  const gy = 800;
  layer(c, cam, .45, g => drawBg(g, 'bangBack', paintBangBack));
  layer(c, cam, 1, g => {
    drawBg(g, 'bangFg', paintBangFg);
    const push = seg(t, Q.pipePush, Q.pipePush + 1.1);
    const seg1 = outBack(seg(t, Q.pipe1, Q.pipe1 + .24), 1), seg2 = outBack(seg(t, Q.pipe2, Q.pipe2 + .24), 1);
    const stub = lerp(280, 1320, inOut(push));
    const chain = t - Q.chain;
    // mines half in the sand
    BANG_X.forEach((x, i) => {
      const a = chain - i * .13;
      if (a < 0) { g.fillStyle = 'rgba(0,0,0,.34)'; g.fill(ell(x, gy + 34, 76, 15)); tellerMine(g, x, gy + 20, .62, {}); }
      else { g.fillStyle = 'rgba(8,6,4,.72)'; g.fill(ell(x, gy + 34, 120, 26)); }
    });
    // pipe
    if (chain < .1) {
      const pipeLen = (seg1 > 0 ? 260 * seg1 : 0) + (seg2 > 0 ? 260 * seg2 : 0) + stub * (push > 0 ? 1 : 0) * .6;
      const x0 = 620, x1 = x0 + pipeLen;
      if (pipeLen > 0) {
        ink(g, rrect(x0, gy - 2, x1 - x0, 26, 8), lin(g, 0, gy - 2, 0, gy + 24, [[0, '#d0d4d8'], [.45, '#8d939a'], [1, '#42474d']]), 6);
        for (let i = 1; i * 260 < pipeLen; i++) ink(g, rrect(x0 + i * 260 - 16, gy - 8, 32, 38, 5), '#555b62', 5);
      }
    }
    // wire to plunger
    line(g, [[X_PLUNGER, gy + 18], [260, gy + 56], [560, gy + 44], [640, gy + 16]], 5, '#a12d22', true);
    const crawlBack = seg(t, Q.plunger - .55, Q.plunger - .05);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fill(ell(360, gy + 34, 330, 24));
    proneSoldier(g, 380, gy + 24, 1.02, {
      face: t > Q.chain ? 'shock' : t > Q.plunger - .5 ? 'smug' : 'think', blink: blinkAt(t), sweat: t > Q.chain,
      nearA: .1, nearB: .05, wig: Math.sin(t * 5) * (1 - crawlBack),
    });
    plunger(g, X_PLUNGER, gy + 16, 1.08, seg(t, Q.plunger, Q.plunger + .09));
    BANG_X.forEach((x, i) => explosion(g, x, gy + 20, chain - i * .13, { s: 1.08, seed: 70 + i * 5, smoke: 14, life: 1.1 }));
    if (chain < 0) hudStrip(c, outBack(seg(t, TL.p.l4.s + .02, TL.p.l4.s + .26), 1.2), 'TORPEDO BANGALORE', 1100, 196, { size: 54 });
    if (seg1 > 0 && chain < 0) redArrow(g, 900, gy - 80, 1130, gy - 170, 1420, gy - 80, inOut(seg(t, Q.pipePush, Q.pipePush + .6)), { lw: 22 });
  });
  fgFrame(c, cam, 15);
};

// ===== FLAIL TANK =====
function paintFlailBack(g, r) { desertBack(g, r, { hz: 440, mx: 1510, my: 140, mr: 90 }); }
const FLAIL = PORTRAIT ? { speed: 215, tankX: 690, gy: 900, s: 1 } : { speed: 215, tankX: 640, gy: 842, s: 1.3 };
const flailMines = () => [Q.flailBoomA - .56, Q.flailBoomA, Q.flailBoomB, Q.flailBoomC, Q.cough + .42, Q.cough + 1.1];
const _ridgeTile = {};
function ridgeTile(g, ox, y) {
  if (!_ridgeTile.c) {
    const cv = mkCanvas(1240, 240), q = cv.getContext('2d');
    const pts = [[0, 110], [200, 62], [430, 100], [640, 48], [880, 100], [1060, 66], [1240, 110]];
    const s = sp(pts, false), f = new Path2D(); f.addPath(s); f.lineTo(1240, 240); f.lineTo(0, 240); f.closePath();
    q.fillStyle = lin(q, 0, 40, 0, 200, [[0, '#4e4a38'], [1, '#2e2c22']]); q.fill(f); q.lineWidth = 4; q.strokeStyle = INK; q.stroke(s);
    _ridgeTile.c = cv;
  }
  g.drawImage(_ridgeTile.c, ox, y - 80);
}
SC.flail = (c, t, lt, d) => {
  const { speed, tankX, gy, s } = FLAIL, ks = s / 1.3;
  const t0 = TL.cuts.find(q => q.scene === 'flail').t, dist = (t - t0) * speed;
  const drumScreenX = tankX + 372 * s;
  const cam = camAt(lt, d, 1, 1.06, 0, 0, -6, -8);
  layer(c, cam, .25, g => drawBg(g, 'flailBack', paintFlailBack));
  layer(c, cam, 1, g => {
    // scrolling mid dune
    const tile = 1200;
    for (let k = -1; k < 3; k++) { const ox = k * tile - ((dist * .45) % tile); ridgeTile(g, ox, 600); }
    // scrolling sand
    g.fillStyle = lin(g, 0, 700, 0, H + OVER, [[0, '#6c6446'], [.3, '#4d4630'], [1, '#1f1d15']]); g.fillRect(-OVER, 700, W + OVER * 2, H);
    line(g, [[-OVER, 700], [W + OVER, 700]], 5);
    for (let i = 0; i < (PORTRAIT ? 300 : 180); i++) {
      const wx = hash(i) * 2400, y = 712 + hash(i + 300) * (PORTRAIT ? 860 : 460), par = .6 + (y - 700) / 380;
      const x = ((wx - dist * par) % 2400 + 2400) % 2400 - 240;
      g.fillStyle = i % 5 ? 'rgba(0,0,0,.2)' : 'rgba(230,225,180,.07)'; g.fill(ell(x, y, 5 + hash(i + 5) * 16, 2 + hash(i + 7) * 3));
      if (i % 9 === 0) tuft(g, x, y, .8);
    }
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#a4b1c9'; g.fillRect(-OVER, 560, W + OVER * 2, H); g.restore();
    // mines ahead; each blows when the drum reaches it
    flailMines().forEach((bt) => {
      const ahead = (bt - t) * speed, x = drumScreenX + 18 + ahead, y = gy + 14;
      if (t < bt && x < W + 200) { g.fillStyle = 'rgba(0,0,0,.34)'; g.fill(ell(x, y + 12, 72, 14)); tellerMine(g, x, y, .58); }
    });
    // tank
    g.fillStyle = 'rgba(0,0,0,.42)'; g.fill(ell(tankX + 10, gy + 12, 400 * ks, 30));
    const bob = Math.sin(t * 14) * 1.6;
    // exhaust
    for (let i = 0; i < 9; i++) {
      const p = ((t * .9 + i / 9) % 1), px = tankX - 360 * ks - p * 240, py = gy - 220 * ks - p * 150 + Math.sin(i * 3 + t) * 8, r = 16 + p * 44;
      g.globalAlpha = (1 - p) * .36; g.fillStyle = '#26262a'; g.fill(ell(px, py, r)); g.globalAlpha = 1;
    }
    const coughAge = t - Q.cough;
    puffs(g, tankX - 370 * ks, gy - 230 * ks, coughAge, { n: 14, seed: 91, s: .8, life: 1.9, a: .95, c1: '#3b3b3f', c2: '#101013', spread: 1.2 });
    flailTank(g, tankX, gy + bob, s, t, { dist, face: t > Q.cough ? 'shock' : (t > Q.flailBoomA ? 'smug' : 'neutral') });
    // chain dust at the drum
    for (let i = 0; i < 8; i++) {
      const p = ((t * 2.4 + i / 8) % 1), px = drumScreenX + 80 - p * 260, py = gy + 2 - p * 110 * hash(i), r = 18 + p * 42;
      g.globalAlpha = (1 - p) * .55; g.fillStyle = '#7f775d'; g.fill(ell(px, py, r, r * .76)); g.globalAlpha = 1;
    }
    flailMines().forEach((bt, i) => {
      const age = t - bt; if (age < 0) return;
      explosion(g, drumScreenX + 18 - age * speed, gy + 14, age, { s: .86, seed: 120 + i * 9, smoke: 12, life: 1 });
    });
    const ck = pop(t, Q.cough, .22);
    if (ck > 0) bubble(g, tankX - 150 * ks, gy - 610 * ks, ck * (1 - seg(t, Q.cough + 1.25, Q.cough + 1.4)), 'UHUK!', { w: 148, h: 88, size: 64, tail: 40 });
  });
  fgFrame(c, cam, 16, { top: false });
  if (t < TL.p.m2.s + .6) hudStrip(c, outBack(seg(t, TL.p.m1.s + .1, TL.p.m1.s + .34), 1.2), 'TANK SCORPION', 1400, 96);
};

// ===== GENERAL (final gag) =====
SC.general = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.07, 0, 0, 0, -16);
  layer(c, cam, 1, g => {
    drawBg(g, 'plain', plainDark);
    const genK = outBack(seg(t, Q.genIn, Q.genIn + .34), 1.1);
    const clicked = t > Q.genClick;
    if (genK > 0) soldier(g, lerp(2200, PORTRAIT ? 1270 : 1380, genK), PORTRAIT ? 1560 : 1210, PORTRAIT ? 2.9 : 2.36, {
      kit: 'general', face: clicked ? 'shock' : 'blank', mustache: '#d7dade', blink: !clicked && blinkAt(t, .3), lookX: clicked ? 0 : -1, lookY: clicked ? 1 : 0, sweat: clicked ? 1 : 0,
      armL: [2.1, 1.75], armR: [1, 1.35], headTilt: -.03,
    });
    const points = t > ws('n2', 0);
    soldier(g, PORTRAIT ? 660 : 560, PORTRAIT ? 1590 : 1200, PORTRAIT ? 2.7 : 2.14, {
      face: clicked ? 'down' : (points ? 'smug' : 'neutral'), blink: blinkAt(t, 1.2), lookX: clicked ? .6 : .9, lookY: clicked ? 1 : 0, headTilt: .05, sweat: clicked ? .8 : 0,
      armL: [2.1, 1.75], armR: points ? [-.35, -.2, 'point'] : [-.7, -1.75, 'point'],
    });
    stamp(g, t, Q.ditolak, 960, PORTRAIT ? 90 : 204, 'DITOLAK', { size: PORTRAIT ? 118 : 150, rot: -.09 });
    const ck = pop(t, Q.genClick, .12);
    if (ck > 0) {
      label(g, 'klik', PORTRAIT ? 1280 : 1520, PORTRAIT ? 1090 : 1012, 62 * ck, { font: 'Marker', fill: '#ffe05a', stroke: INK, lw: 10, rot: -.08 });
      softGlow(g, PORTRAIT ? 1250 : 1400, PORTRAIT ? 1400 : 1080, 620, 'rgba(255,60,40,.55)', .5 + .4 * Math.sin(t * 18));
    }
  });
};

// ===== Per-video settings read by the engine =====
const NIGHT = '#dfe4ee';
const CHAIN = [0, 1, 2, 3, 4, 5].map(i => [Q.chain + i * .13, 26, .55]);
window.VIDEO = {
  // [time, amplitude px, duration]
  shakes: [[Q.boom1, 30, .75], [Q.signSlam, 20, .4], [Q.stamp, 12, .24], [Q.boom2, 40, 1], [Q.gratis, 9, .2], [Q.boom3, 12, .45], [Q.plunger, 5, .12],
    [Q.flailBoomA - .56, 10, .3], [Q.flailBoomA, 13, .36], [Q.flailBoomB, 13, .36], [Q.flailBoomC, 16, .4], [Q.cough + .42, 10, .3], [Q.ditolak, 14, .26], [Q.genClick, 3, .2], [Q.bigBoom, 44, 1.3], ...CHAIN],
  // [time, duration, colour]
  flashes: [[Q.boom1, .26, 'rgba(255,245,225,1)'], [Q.boom2, .4, 'rgba(255,250,235,1)'], [Q.stamp, .08, 'rgba(255,255,255,.55)'], [Q.signSlam, .1, 'rgba(255,240,210,.5)'],
    [Q.chain, .2, 'rgba(255,240,220,.85)'], [Q.flailBoomA, .1, 'rgba(255,230,190,.5)'], [Q.flailBoomC, .1, 'rgba(255,230,190,.5)'], [Q.ditolak, .07, 'rgba(255,255,255,.4)']],
  grade: { lane: NIGHT, garden: NIGHT, betty: NIGHT, peek: NIGHT, crawl: NIGHT, angle: NIGHT, loading: NIGHT, detector: NIGHT, blind: NIGHT, tape: NIGHT, bangalore: NIGHT, flail: NIGHT, scratch: NIGHT, under: NIGHT, backtobayonet: NIGHT },
  bigWords: { b3: 108, c4: 84, f4: 74, l3: 66 },
  // shot: [[time, stageX, stageY, zoom, moveSeconds], ...]. No entry = centred stage. 9:16 shows about 945x1680 of the stage at zoom 1.143.
  framing: {
    '9:16': {
      tent: [[0, 720, 620, 1.22], [Q.mapIn, 560, 640, 1.22, .3]],
      lane: [[0, 960, 600, 1.22]],
      under: [[0, 960, 560, 1.143]],
      garden: [[0, 470, 640, 1.25], [Q.signSlam - .24, 1150, 650, 1.143, .24]],
      scope: [[0, 960, 520, 1.143]],
      scratch: [[0, 1000, 640, 1.143], [Q.think, 1200, 620, 1.25, .4]],
      poster: [[0, 960, 540, 1.143]],
      betty: [[0, 930, 680, 1.25]],
      peek: [[0, 980, 620, 1.22]],
      crawl: [[0, 690, 650, 1.143]],
      angle: [[0, 950, 620, 1.143]],
      loading: [[0, 960, 640, 1.143]],
      kosacki: [[0, 1200, 600, 1.2], [Q.board - .1, 650, 520, 1.2, .3], [Q.gratis - .42, 950, 560, 1.143, .28]],
      detector: [[0, 860, 620, 1.143]], blind: [[0, 860, 620, 1.143]],
      german: [[0, 960, 620, 1.143]],
      backtobayonet: [[0, 900, 700, 1.143]],
      tape: [[0, 960, 600, 1.22]],
      split: [[0, 960, 560, 1.143]],
      bangalore: [[0, 520, 680, 1.143], [Q.pipePush, 1150, 680, 1.143, .9], [Q.plunger - .42, 430, 680, 1.143, .3], [Q.chain - .04, 1000, 680, 1.143, .12], [Q.chain + .1, 1450, 680, 1.143, .7]],
      flail: [[0, 790, 640, 1.143]],
      general: [[0, 960, 640, 1.143]],
    },
  },
};
