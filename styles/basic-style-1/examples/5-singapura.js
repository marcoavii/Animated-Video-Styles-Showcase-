// ---------- cast ----------
const PROT = { skin: '#d9a07a', hair: 'fringe', shirt: '#8a4b25', pattern: '#ecc88f' };
const WORKERS = [{ skin: '#efc9a2', hair: 'fringe', shirt: '#f1ede4', buttons: true }, { skin: '#c98d65', hair: 'fringe', hat: 'peci', shirt: '#f1ede4' }, { skin: '#9a6a48', hair: 'curly', shirt: '#e9e4d8', buttons: true }];
const SGP = { skin: '#efc9a2', hair: 'fringe', shirt: '#7fa7c9', buttons: true };
const INVESTORS = [{ skin: '#f3ccaf', hair: 'fringe', hairCol: '#c9a35a', shirt: '#2b3346', tie: '#c8302a' }, { skin: '#efc9a2', hair: 'fringe', shirt: '#3a3a42', tie: '#2f6fa8' }, { skin: '#9a6a48', hair: 'fringe', shirt: '#2b3346', tie: '#e2a72e' }];

// ---------- captions (script words unchanged; highlights ≤ 3 words) ----------
const PHRASES = [
  [0.05, .66, ['Bayangin,']],
  [1.08, 3.28, ['lu punya negara', 'yang ukurannya', '!KECIL BANGET,']],
  [3.66, 5.32, ['nggak punya banyak', '!SUMBER DAYA ALAM,']],
  [5.58, 7.38, ['bahkan', '!AIR PUN', '!HARUS DIPIKIRIN.']],
  [7.98, 8.76, ['Tapi sekarang,']],
  [8.94, 11.2, ['!DUNIA', 'justru', '!BERGANTUNG', 'sama negara ini.']],
  [11.86, 13.0, ['Namanya', '!SINGAPURA.|12']],
  [13.5, 19.34, ['!TAHUN 1965,|27', 'negara ini resmi', '!PISAH DARI MALAYSIA', 'dan harus', '!BERDIRI SENDIRI.']],
  [19.92, 22.84, ['Masalahnya,', 'mereka nggak punya', 'banyak sumber daya alam,']],
  [23.1, 24.22, ['!INDUSTRI MASIH MINIM,']],
  [24.54, 26.56, ['dan', '!PENGANGGURAN', 'jadi masalah besar.']],
  [27.14, 28.86, ['Bahkan', '!URUSAN AIR', 'aja rumit.']],
  [29.36, 33.94, ['Saat awal merdeka,', 'Singapura sangat', '!BERGANTUNG', 'pada', '!PASOKAN AIR', 'dari Malaysia.']],
  [34.54, 38.48, ['Kalau', '!EKONOMI GAGAL,', 'negara kecil ini', 'bisa', '!KESULITAN BANGET', 'buat bertahan.']],
  [39.08, 41.08, ['Tapi mereka punya', '!SATU KEUNGGULAN:']],
  [41.5, 44.22, ['!LOKASINYA STRATEGIS', 'di', '!JALUR PERDAGANGAN DUNIA.']],
  [44.72, 46.7, ['Alih-alih mengandalkan', 'sumber daya alam,']],
  [46.9, 48.52, ['Singapura', '!MEMBANGUN PELABUHAN,']],
  [48.72, 50.08, ['menarik', '!INVESTASI ASING,']],
  [50.32, 51.66, ['dan', '!MENGEMBANGKAN INDUSTRI.']],
  [52.14, 55.28, ['Bahkan air bekas pun', 'akhirnya diolah lagi', 'jadi', '!NEWater!|12']],
  [55.84, 56.38, ['!HASILNYA?']],
  [56.74, 60.94, ['Singapura berkembang', 'jadi salah satu', '!PUSAT PERDAGANGAN', 'dan', '!PELAYARAN DUNIA.']],
  [61.42, 64.58, ['Jadi, mereka', '!BUKAN POWERFUL', 'karena punya', '!WILAYAH LUAS,']],
  [64.94, 69.76, ['tapi karena berhasil', 'membuat', '!SELURUH DUNIA', 'punya alasan', 'untuk', '!TERHUBUNG', 'lewat mereka.']],
  [70.36, 72.02, ['!MASIH BANYAK CERITA', 'yang belum lu tahu.']],
  [72.36, 73.9, ['!FOLLOW', 'biar nggak', '!KETINGGALAN!']],
];
export const CAPS = [];
PHRASES.forEach(([s, e, chunks], pi) => {
  const parsed = chunks.map(ch => { const hl = ch[0] === '!', [txt0, wt] = (hl ? ch.slice(1) : ch).split('|'); return { text: txt0, hl, w: (wt ? +wt : txt0.length) + 4 }; });
  const total = parsed.reduce((n, x) => n + x.w, 0); let acc = s; const next = PHRASES[pi + 1] ? PHRASES[pi + 1][0] : DUR;
  parsed.forEach((p, i) => { const d = (e - s) * p.w / total; CAPS.push({ s: acc, e: i === parsed.length - 1 ? Math.min(next, e + .6) : acc + d, text: p.text, hl: p.hl }); acc += d; });
});
const capStart = (text, from = 0) => (CAPS.find(q => q.text.startsWith(text) && q.s >= from) || { s: 0 }).s;
const T_1965 = capStart('TAHUN 1965'), T_PISAH = capStart('PISAH DARI'), T_NEW = capStart('NEWater'), T_SDA = capStart('SUMBER DAYA'), T_AIR = capStart('AIR PUN');
function drawCaption(c, t) {
  const cap = CAPS.find(q => t >= q.s && t < q.e); if (!cap) return;
  if (cap.hl) txt(c, cap.text, W / 2, 1385, { size: 64, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: back(pr(t, cap.s, cap.s + .2)) });
  else txt(c, cap.text, W / 2, 1385, { size: 54, font: SANS, weight: 700, stroke: INK, sw: 7, a: pr(t, cap.s, cap.s + .1) });
}

// ---------- camera (map scenes) ----------
const CAM = [
  [0, 108, 2, 900, 'l'], [1.6, SG[0], SG[1], 16000, 'in'], [2.3, SG[0], SG[1], 17000, 'l'], [3.3, 108, 0, 1350, 'io'], [5.5, 108, 0, 1420, 'l'], [7.7, 104.5, 1, 2600, 'io'],
  [11.9, SG[0], SG[1], 15000, 'h'], [13.0, SG[0], SG[1], 18000, 'l'], [13.7, 103.8, 1.62, 11000, 'io'], [17.9, 103.8, 1.62, 11800, 'l'],
  [29.3, 103.74, 1.5, 38000, 'h'], [34.5, 103.74, 1.49, 42000, 'l'],
  [39.1, 100.5, 3.5, 1300, 'h'], [41.0, 100.5, 3.5, 1360, 'l'], [41.7, 101.3, 3, 2300, 'io'], [43.0, 99, 6, 710, 'io'], [46.8, 99, 6, 740, 'l'],
  [61.4, SG[0], SG[1], 16000, 'h'], [63.2, SG[0], SG[1], 17500, 'l'], [66.0, 92, 18, 330, 'io'], [74.2, 96, 12, 300, 'l'],
];
const EASE = { l: x => x, io, in: x => x * x * x, out: outC, h: () => 1 };
export function camAt(t) {
  let i = 1; while (i < CAM.length - 1 && CAM[i][0] < t) i++;
  const a = CAM[i - 1], b = CAM[i], p = EASE[b[4]](pr(t, a[0], b[0]));
  return { lon: lerp(a[1], b[1], p), lat: lerp(a[2], b[2], p), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)) };
}
const projector = (cam, w, h) => { const cx = cam.lon * D2R, cy = mY(cam.lat), k = cam.k; return (lon, lat) => [w / 2 + (lon * D2R - cx) * k, h / 2 - (mY(lat) - cy) * k]; };

const STRAIT = [[95.5, 5.8], [98.5, 6.6], [100.3, 5.0], [101.5, 2.9], [103.4, 1.32], [104.3, 1.2], [103.5, .7], [101.2, 1.6], [99.6, 2.9], [97.5, 4.6], [95.3, 5.3]];
const PIPE = [[103.6, 1.86], [103.68, 1.62], [103.765, 1.455], [103.8, 1.4], [103.82, 1.37]];
const SEA_ROUTES = [['India', [[80, 9], [92, 6], [98, 5], [101.5, 2.6], SG]], ['Eropa', [[62, 10], [80, 3], [95, 4.3], [101, 2.6], SG]], ['Tiongkok', [[118, 21], [111, 11], [106, 4], [104.5, 1.6], SG]]];
const HUBS = [[4.5, 51.9], [55.3, 25.3], [72.9, 19], [79.9, 6.9], [121.5, 31.2], [139.7, 35.6], [151.2, -33.9], [31, -29.9], [114.2, 22.3], [106.8, -6.2], [200, 34], [18.4, -33.9], [-74, 40.7]];
function mapExtra() {}
function mapState(t) {
  const st = { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, deep: 0, wallace: 0, plates: 0 };
  const L = (s, lon, lat, a, o) => { if (a > 0) st.labels.push([s, lon, lat, a, o]); };
  const cmp = t > 2.2 && t < 7.8 ? pr(t, 2.4, 2.9) : 0;
  if (cmp > 0) { st.fills.push({ rs: gid('458'), col: MY_COL, a: cmp * .9 }); st.fills.push({ rs: gid('360'), col: ID_COL, a: pr(t, 2.7, 3.2) * .9 }); }
  L('Malaysia', 101.2, 6.4, cmp * win(t, 2.4, 7.8), { size: 52, weight: 600 }); L('Malaysia', 114, 3.2, cmp * win(t, 2.4, 7.8), { size: 46 }); L('Indonesia', 114, -3.5, pr(t, 2.9, 3.3) * win(t, 2.4, 7.8), { size: 58, weight: 600 });
  // 1965: one country, then the border splits them
  if (t > 13.6 && t < 18) { st.fills.push({ rs: gid('458'), col: MY_COL, a: pr(t, 13.7, 14.0) }); st.fills.push({ rs: gid('702'), col: t < T_PISAH + .4 ? MY_COL : SG_RED, a: pr(t, 13.7, 14.0) }); L('Johor, Malaysia', 103.5, 1.95, pr(t, 13.9, 14.3), { size: 50, weight: 600 }); L('Singapura', 103.83, 1.22, pr(t, T_PISAH + .4, T_PISAH + .7), { size: 50, weight: 600, col: YEL }); }
  if (t > 1.4 && t < 13.7 || t > 61.3) st.fills.push({ rs: gid('702'), col: SG_RED, a: t > 61.3 ? 1 : pr(t, 1.45, 1.7) });
  if (t > 29.3 && t < 34.6) { st.fills.push({ rs: gid('458'), col: MY_COL, a: .55 }); st.fills.push({ rs: gid('702'), col: SG_RED, a: .7 }); L('Johor, Malaysia', 103.82, 1.72, 1, { size: 50, weight: 600 }); L('Singapura', 103.86, 1.31, 1, { size: 50, weight: 600, col: YEL }); }
  if (t > 39.1 && t < 46.9) L('Selat Malaka', 99.5, 4.6, pr(t, 41.6, 42.1), { size: 56, weight: 600, rot: -40, col: YEL });
  return st;
}
function sgMarker(c, P, t, a, label) { if (a <= 0) return; const [x, y] = P(SG[0], SG[1]); c.save(); c.globalAlpha = a; for (let i = 0; i < 2; i++) { const p = ((t * .8 + i * .5) % 1); c.globalAlpha = a * (1 - p); c.strokeStyle = SG_RED; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 18 + p * 70, 0, TAU); c.stroke(); } c.globalAlpha = a; c.beginPath(); c.arc(x, y, 16, 0, TAU); c.fillStyle = SG_RED; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); if (label) txt(c, label, x + 34, y + 58, { size: 56, weight: 600, col: '#fff', stroke: INK, sw: 6, a, align: 'left' }); }
function mapScene(c, t) {
  const cam = camAt(t), st = mapState(t), P = drawMap(c, W, H, cam, st, t), small = cam.k < 6000;
  // hook: tiny, few resources, even water is a worry
  if (t < 7.8) {
    sgMarker(c, P, t, small && t > 1.4 ? 1 : 0, t > 2.4 ? 'Singapura' : '');
    if (t > 1.45 && t < 2.6) { const [x, y] = P(SG[0], SG[1]); txt(c, 'Singapura', x, y - 230, { size: 80, weight: 600, col: YEL, stroke: INK, sw: 6, sc: env(t, 1.5, 2.6) }); }
    const ic = [[treeIcon, 300], [oreIcon, 540], [(cc, x, y, s, sc) => dropIcon(cc, x, y, s, '#2b2b2b', sc), 780]];
    if (t > T_SDA - .1 && t < 7.8) ic.forEach(([f, x], i) => { const s = env(t, T_SDA + i * .15, 7.75); f(c, x, 300, 150, s); redX(c, x, 300, 150, pr(t, T_SDA + .5 + i * .2, T_SDA + .8 + i * .2) * (s > 0 ? 1 : 0)); });
    const ds = env(t, T_AIR - .1, 7.75); if (ds > 0) { dropIcon(c, W / 2, 560, 220, '#3d8fd1', ds); txt(c, '?', W / 2 + 6, 585, { size: 140, weight: 600, stroke: INK, sw: 10, sc: ds }); }
  }
  // 1965: label, the year, the border line
  if (t > 11.9 && t < 18) {
    const [x, y] = P(SG[0], SG[1]); if (t < 13.7) txt(c, 'SINGAPURA', x, y - 300, { size: 110, font: SANS, weight: 700, col: '#fff', stroke: INK, sw: 9, sc: env(t, 12.0, 13.7) });
    { const s = env(t, T_1965, 18, .3, .1); if (s > 0) bigText(c, '1965', W / 2, 420, { size: 230, stroke: INK, sw: 12, sc: s * (1 + 1.2 * (1 - outC(pr(t, T_1965, T_1965 + .25)))) }); }
    const bp = pr(t, T_PISAH, T_PISAH + .7); if (bp > 0) { c.save(); polyline(c, P, [[103.45, 1.47], [103.62, 1.44], [103.76, 1.455], [103.9, 1.42], [104.05, 1.39]], bp); c.lineCap = 'round'; c.setLineDash([22, 14]); c.lineWidth = 16; c.strokeStyle = INK; c.stroke(); c.lineWidth = 9; c.strokeStyle = YEL; c.stroke(); c.restore(); }
  }
  // water pipes from Johor
  if (t > 29.3 && t < 34.6) {
    const fl = pr(t, 30.2, 30.9); c.save(); polyline(c, P, PIPE, fl); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 46; c.strokeStyle = INK; c.stroke(); c.lineWidth = 34; c.strokeStyle = '#9aa3aa'; c.stroke();
    if (t > 31.0) { c.lineWidth = 18; c.strokeStyle = '#3d8fd1'; c.setLineDash([30, 20]); c.lineDashOffset = -t * 160; c.shadowColor = 'rgba(80,170,255,.9)'; c.shadowBlur = 24 * pr(t, 31, 31.6); c.stroke(); }
    c.restore();
    const [a0, b0] = P(PIPE[0][0], PIPE[0][1]); dropIcon(c, a0 - 170, b0 + 40, 110, '#3d8fd1', env(t, 30.0, 34.5)); txt(c, 'Pipa air', a0 - 170, b0 + 150, { size: 44, weight: 600, sc: env(t, 30.2, 34.5) });
  }
  // strait + ships converging
  if (t > 39.1 && t < 46.9) {
    const a = pr(t, 41.5, 42.0); if (a > 0) { c.save(); c.beginPath(); pathRings(c, [toRing(STRAIT, 'str')], cam, W, H); c.globalAlpha = .5 * a; c.fillStyle = YEL; c.fill(); c.globalAlpha = a; c.setLineDash([16, 10]); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(); c.restore(); }
    sgMarker(c, P, t, 1, 'Singapura');
    SEA_ROUTES.forEach(([n, pts], i) => { const p = io(pr(t, 43.2 + i * .25, 46.5 + i * .2)); if (p <= 0) return; const head = polyline(c, P, pts, p); c.save(); c.setLineDash([14, 10]); c.lineDashOffset = -t * 40; c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke(); c.restore(); const [hx, hy] = head.at(-1); containerShip(c, hx, hy, 70, t, { seed: i + 3, flip: n === 'Tiongkok' }); const [sx, sy] = P(pts[0][0], pts[0][1]); txt(c, n, sx, sy - 40, { size: 48, weight: 600, sc: env(t, 43.2 + i * .25) }); });
  }
  // tiny but connected to the whole world
  if (t > 61.3) {
    const [x, y] = P(SG[0], SG[1]);
    if (t < 64.8) { const a = win(t, 61.6, 64.8, .1, .2); c.save(); c.globalAlpha = a; yellowEllipse(c, x, y, 240, 160, 0, pr(t, 61.6, 62.1)); c.restore(); txt(c, 'Kecil...', x, y - 260, { size: 80, italic: true, sc: env(t, 61.8, 64.8) }); }
    sgMarker(c, P, t, cam.k < 6000 ? 1 : 0, 'Singapura');
    HUBS.forEach((d, i) => { const p = pr(t, 65.2 + i * .25, 66.4 + i * .25); if (p <= 0) return; const mid = [(SG[0] + d[0]) / 2, (SG[1] + d[1]) / 2 + 12]; const head = polyline(c, P, [SG, mid, d], p); c.save(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#f2c43a'; c.stroke(); c.restore(); const [hx, hy] = head.at(-1); c.beginPath(); c.arc(hx, hy, 9, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); });
    if (t > 70.3) { const y2 = lerp(2500, 1960, outC(pr(t, 70.4, 70.65))); drawChar(c, 540, y2, 760, { ...PROT, expr: t > 73 ? 'happy' : 'smug' }); followUI(c, t, 72.4); }
  }
}
function followUI(c, t, t0) {
  const s = env(t, t0); if (s <= 0) return; c.save(); c.translate(W / 2, 470); c.scale(s, s);
  c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.roundRect(-400, -130, 800, 260, 60); c.fill(); c.shadowColor = 'transparent';
  c.save(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.fillStyle = '#e8d8b5'; c.fill(); c.clip(); drawChar(c, -260, 260, 380, PROT); c.restore(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.lineWidth = 7; c.strokeStyle = INK; c.stroke();
  const on = t > t0 + .8; c.beginPath(); c.roundRect(-130, -62, 360, 124, 62); c.fillStyle = on ? '#3a3a3a' : '#e8322c'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  txt(c, on ? 'Following ✓' : 'Follow', 50, 2, { size: 58, font: SANS, weight: 700, shadow: false, sc: on ? 1 : 1 + .06 * Math.max(0, Math.sin(t * 9)) });
  c.save(); c.translate(320, -10); c.rotate(on ? Math.sin(t * 22) * .3 * (1 - pr(t, t0 + .8, t0 + 1.5)) : 0); c.beginPath(); c.moveTo(-30, 30); c.quadraticCurveTo(-30, -38, 0, -40); c.quadraticCurveTo(30, -38, 30, 30); c.closePath(); c.fillStyle = '#f2c43a'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, 38, 9, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.restore();
  const gp = pr(t, t0 + .25, t0 + .7), b2 = pr(t, t0 + .85, t0 + 1.2); drawGlove(c, W / 2 + 120 + lerp(240, 0, outC(gp)) + b2 * 200, 470 + lerp(320, 70, outC(gp)) + b2 * 260 + (t > t0 + .7 && t < t0 + .85 ? 14 : 0), 140, -.5, env(t, t0 + .2, 99));
}

// ---------- plates ----------
function harborBase(c, t, sky = ['#78acd6', '#e6eef0'], skyline = 0) {
  plateSky(c, sky[0], sky[1], 980, t);
  if (skyline > 0) { c.save(); c.globalAlpha = skyline; [[120, 260, 300, '#6f8aa0'], [200, 200, 420, '#7f9ab0'], [300, 180, 360, '#5f7a90'], [380, 150, 470, '#8aa5bb'], [470, 170, 330, '#6f8aa0'], [560, 140, 400, '#7f9ab0'], [990, 160, 340, '#6f8aa0']].forEach(([x, w, h, col]) => tower(c, x, 990, w * .5, h * .55, col)); mbs(c, 800, 990, 200); c.restore(); }
  plateSea(c, 980, H, t);
}
function shipArrive(c, t) { // 7.7–11.9: container ships heading to the Singapore port
  harborBase(c, t, ['#78acd6', '#e6eef0'], 1);
  for (let k = 0; k < 3; k++) crane(c, 600 + k * 180, 1010, 230, t, k);
  containerShip(c, lerp(1500, 520, outC(pr(t, 7.7, 10.2))), 1300, 420, t, { seed: 4 });
  containerShip(c, lerp(1700, 900, outC(pr(t, 8.6, 11.5))), 1120, 220, t, { seed: 7, ph: 1 });
  txt(c, 'Pelabuhan Singapura', W / 2, 300, { size: 74, weight: 600, sc: env(t, 7.9) });
  const s = env(t, capStart('DUNIA'), 11.95); if (s > 0) { c.save(); c.translate(W / 2, 520); c.scale(s, s); c.beginPath(); c.arc(0, 0, 90, 0, TAU); c.fillStyle = '#3d8fd1'; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#5fa04a'; c.beginPath(); c.ellipse(-25, -15, 40, 30, .4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(35, 30, 30, 22, -.3, 0, TAU); c.fill(); c.restore(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * .5; arrow(c, W / 2 + Math.cos(a) * 230, 520 + Math.sin(a) * 160, W / 2 + Math.cos(a) * 115, 520 + Math.sin(a) * 85, 16, '#fff', s); } }
}
function city1965(c, t, bare = false) { // 17.9–19.9
  harborBase(c, t, ['#a8b8c0', '#e8e0cc']);
  c.fillStyle = '#8a7a5a'; c.fillRect(-80, 1120, W + 160, H);
  shophouses(c, -20, 1120, 160, 8, 3, .18);
  c.fillStyle = '#4f7a8a'; c.fillRect(-80, 1180, W + 160, 230); for (let i = 0; i < 4; i++) bumboat(c, 160 + i * 250, 1300 + (i % 2) * 40, 150, t);
  c.fillStyle = '#9a8a62'; c.fillRect(-80, 1410, W + 160, H);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.rect(120 + i * 320, 1560, 260, 200); c.fillStyle = '#c9b49a'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(110 + i * 320, 1560); c.lineTo(250 + i * 320, 1490); c.lineTo(390 + i * 320, 1560); c.closePath(); c.fillStyle = '#7a5a3a'; c.fill(); c.stroke(); }
  c.fillStyle = 'rgba(150,120,70,.22)'; c.fillRect(0, 0, W, H);
  if (bare) return;
  bigText(c, '1965', W / 2, 360, { size: 170, sc: env(t, 18.0) }); txt(c, 'Singapura, kota pelabuhan kecil', W / 2, 490, { size: 50, italic: true, sc: env(t, 18.2) });
}
function jobless(c, t) { // 19.9–27.1
  plateSky(c, '#9ab0c0', '#e6e6dc', 1100, t); c.fillStyle = '#9a8f72'; c.fillRect(-80, 1100, W + 160, H);
  factory(c, 780, 1110, 420, t, 1, env(t, 22.9)); c.beginPath(); c.rect(-80, 1090, 560, 20); c.fillStyle = '#b8ad92'; c.fill();
  for (let i = 0; i < 5; i++) { c.save(); c.strokeStyle = '#6a5a3a'; c.lineWidth = 6; c.beginPath(); c.moveTo(40 + i * 90, 1100); c.lineTo(40 + i * 90, 1010); c.stroke(); c.restore(); }
  { const s = env(t, 19.95, 23.0); const icons = [[treeIcon, 320], [oreIcon, 540], [(cc, x, y, ss, sc) => dropIcon(cc, x, y, ss, '#2b2b2b', sc), 760]]; icons.forEach(([f, x], i) => { f(c, x, 430, 130, s); redX(c, x, 430, 130, pr(t, 21.3 + i * .2, 21.6 + i * .2) * (s > 0 ? 1 : 0)); }); }
  { const s = env(t, 23.1, 27.15); if (s > 0) { c.save(); c.translate(780, 900); c.scale(s, s); c.fillStyle = '#f4efe2'; c.fillRect(-170, -45, 340, 90); c.lineWidth = 5; c.strokeStyle = INK; c.strokeRect(-170, -45, 340, 90); c.restore(); txt(c, 'Tidak ada lowongan', 780, 902, { size: 34, font: SANS, weight: 700, col: '#c8302a', shadow: false, sc: s }); } }
  WORKERS.forEach((w, i) => { const x = 180 + i * 230, y = 1720; drawChar(c, x, y, 380, { ...w, expr: 'worried' }, env(t, 24.4 + i * .12)); questionMark(c, x + 90, y - 430 - Math.abs(Math.sin(t * 3 + i)) * 12, 90, env(t, 24.8 + i * .12, 27.15)); });
  paper(c, 640, 1560, 110, 140, .2, env(t, 25.0));
  txt(c, 'Industri masih minim', W / 2, 260, { size: 62, weight: 600, sc: env(t, 23.2, 27.15) });
}
function reservoir(c, t) { // 27.1–29.3
  const z = 1 + .04 * (t - 27.1); c.save(); c.translate(W / 2, 1200); c.scale(z, z); c.translate(-W / 2, -1200);
  plateSky(c, '#86b4d6', '#eaf0ef', 900, t); hills(c, 905, '#6f8f5a', 120, .006, 2);
  c.fillStyle = '#b89a6a'; c.beginPath(); c.moveTo(-80, 1000); c.quadraticCurveTo(540, 1700, W + 80, 1000); c.lineTo(W + 80, H); c.lineTo(-80, H); c.closePath(); c.fill();
  c.fillStyle = '#c9ad7a'; c.beginPath(); c.moveTo(80, 1100); c.quadraticCurveTo(540, 1640, 1000, 1100); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(90,60,30,.5)'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const x = 150 + i * 55; c.beginPath(); c.moveTo(x, 1180 + (i % 3) * 30); c.lineTo(x + 20, 1220 + (i % 2) * 20); c.lineTo(x - 10, 1250); c.stroke(); }
  c.fillStyle = '#4f8fb0'; c.beginPath(); c.ellipse(540, 1330, 230, 60, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4; c.beginPath(); c.ellipse(540, 1320, 150, 25, 0, 0, TAU); c.stroke();
  c.restore();
  c.save(); c.translate(940, 820); c.fillStyle = 'rgba(255,255,255,.95)'; c.fillRect(-45, -260, 90, 520); c.lineWidth = 5; c.strokeStyle = INK; c.strokeRect(-45, -260, 90, 520); const lv = lerp(.5, .2, pr(t, 27.3, 28.5)); c.fillStyle = '#d6282f'; c.fillRect(-35, 250 - 500 * lv, 70, 500 * lv); for (let i = 0; i <= 5; i++) { c.beginPath(); c.moveTo(-45, -250 + i * 100); c.lineTo(-20, -250 + i * 100); c.stroke(); } c.restore();
  txt(c, 'Persediaan air', 940, 520, { size: 44, weight: 600, sc: env(t, 27.3) }); txt(c, 'Waduk', 380, 300, { size: 80, weight: 600, sc: env(t, 27.2) });
}
function worried(c, t) { // 34.5–39.1
  plateSky(c, '#8aa0b0', '#d8dcd8', 1150, t);
  shophouses(c, -10, 1150, 140, 8, 9, .1); c.fillStyle = '#8a8574'; c.fillRect(-80, 1150, W + 160, H);
  chart(c, 760, 560, 440, 320, pr(t, 34.9, 36.6), false, env(t, 34.7));
  const s = env(t, 35.3); if (s > 0) arrow(c, 860, 470, 960, 690, 30, '#d6282f', s);
  txt(c, 'Ekonomi', 760, 360, { size: 56, weight: 600, sc: env(t, 34.8) });
  const y = lerp(2500, 1960, outC(pr(t, 34.6, 34.85))); drawChar(c, 330, y, 900, { ...SGP, expr: 'worried' }); drawGlove(c, 600, y - 820 + Math.sin(t * 9) * 6, 130, .3);
}
function port(c, t) { // 46.8–48.7
  harborBase(c, t, ['#78acd6', '#e6eef0']);
  c.fillStyle = '#9a9a92'; c.fillRect(-80, 1300, W + 160, H); c.fillStyle = INK; c.fillRect(-80, 1296, W + 160, 6);
  boxStack(c, 30, 1700, 80, 5); boxStack(c, 600, 1720, 80, 6);
  containerShip(c, 560, 1250, 460, t, { seed: 11 });
  containerShip(c, lerp(-400, 1500, pr(t, 46.8, 48.7)), 1060, 200, t, { seed: 13, ph: 2 });
  for (let k = 0; k < 3; k++) crane(c, 200 + k * 340, 1310, 520, t * 1.6, k * 1.7);
  txt(c, 'Pelabuhan', W / 2, 260, { size: 84, weight: 600, sc: env(t, 46.9) });
}
function business(c, t) { // 48.7–52.1: offices, foreign investors, industry
  plateSky(c, '#78acd6', '#e6eef0', 1150, t); c.fillStyle = '#a8a89c'; c.fillRect(-80, 1150, W + 160, H);
  [[150, 160, 520, '#7f9ab0'], [330, 150, 680, '#5f7a90'], [500, 170, 600, '#8aa5bb'], [680, 140, 760, '#6f8aa0']].forEach(([x, w, h, col], i) => tower(c, x, 1160, w, h, col, outC(pr(t, 48.8 + i * .15, 49.4 + i * .15))));
  factory(c, 930, 1160, 300, t, 2, env(t, capStart('MENGEMBANGKAN')));
  chart(c, 300, 300, 360, 240, pr(t, 49.2, 50.6), true, env(t, 49.0));
  INVESTORS.forEach((w, i) => { const x = lerp(-200, 260 + i * 200, outC(pr(t, 48.9 + i * .2, 49.7 + i * .2))), y = 1700 - Math.abs(Math.sin(t * 7 + i)) * 10; drawChar(c, x, y, 380, { ...w, expr: 'smug' }); briefcase(c, x + 150, y - 110, 90); });
  txt(c, 'Investor asing', 380, 1240, { size: 54, weight: 600, sc: env(t, 49.0) }); txt(c, 'Industri', 930, 1240, { size: 54, weight: 600, sc: env(t, capStart('MENGEMBANGKAN')) });
}
function newater(c, t) { // 52.1–55.8: used water in, clean water out
  c.fillStyle = '#dfe7ea'; c.fillRect(0, 0, W, H); c.fillStyle = '#c9d3d6'; c.fillRect(0, 1250, W, H);
  const tank = (x, y, w, h, col, lab) => { c.beginPath(); c.roundRect(x - w / 2, y - h, w, h, 30); const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, shade(col, .25)); g.addColorStop(1, shade(col, -.2)); c.fillStyle = g; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); txt(c, lab, x, y - h - 40, { size: 40, weight: 600, col: '#2b2b2b', shadow: false }); };
  const pipeLine = (pts, col, p) => { c.save(); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 40; c.strokeStyle = INK; c.stroke(); c.lineWidth = 28; c.strokeStyle = '#a9b3b8'; c.stroke(); if (p > 0) { c.lineWidth = 14; c.strokeStyle = col; c.setLineDash([26, 18]); c.lineDashOffset = -t * 140; c.stroke(); } c.restore(); };
  pipeLine([[-40, 900], [200, 900]], '#8a6a3a', pr(t, 52.2, 52.4)); pipeLine([[290, 1000], [430, 1000]], '#a08a5a', pr(t, 52.6, 52.8)); pipeLine([[560, 1000], [700, 1000]], '#7fb0c8', pr(t, 53.0, 53.2)); pipeLine([[830, 900], [1120, 900]], '#3d8fd1', pr(t, 53.4, 53.6));
  tank(245, 1180, 170, 380, '#8a6a3a', 'Air bekas'); tank(495, 1180, 170, 380, '#9aa3aa', 'Saring'); tank(765, 1180, 170, 380, '#7a6ab0', 'Sinar UV');
  if (t > 53.0) { c.save(); c.globalAlpha = .35 + .25 * Math.sin(t * 9); c.fillStyle = '#c9b6ff'; c.beginPath(); c.roundRect(690, 810, 150, 360, 26); c.fill(); c.restore(); }
  const b = env(t, T_NEW - .3); if (b > 0) { c.save(); c.translate(900, 1560); c.scale(b, b); c.beginPath(); c.roundRect(-70, -170, 140, 300, 30); c.fillStyle = 'rgba(160,210,240,.85)'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#3d8fd1'; c.fillRect(-70, -40, 140, 70); c.fillRect(-25, -215, 50, 50); c.strokeRect(-25, -215, 50, 50); c.restore(); }
  for (let i = 0; i < 8; i++) { const p = ((t * .7 + i / 8) % 1); if (t > 53.6) { c.fillStyle = `rgba(255,255,255,${1 - p})`; c.beginPath(); c.arc(980 + Math.sin(i) * 60, 860 - p * 160, 6, 0, TAU); c.fill(); } }
  const s = env(t, T_NEW); if (s > 0) txt(c, 'NEWater', W / 2, 380, { size: 170, font: SANS, weight: 700, col: '#3d8fd1', stroke: INK, sw: 12, sc: s * (1 + .8 * (1 - outC(pr(t, T_NEW, T_NEW + .25)))) });
}
function oldCity(c, t) { city1965(c, 18.5, true); }
function modernCity(c, t, port2 = 0) {
  const g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, '#2d4f86'); g.addColorStop(1, '#f2b77a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  [[60, 110, 620, '#4f6f90'], [170, 130, 820, '#3f5f80'], [300, 120, 700, '#5f7fa0'], [420, 150, 900, '#4a6a8a'], [560, 120, 760, '#5a7a9a'], [990, 140, 720, '#4f6f90'], [880, 110, 560, '#3f5f80']].forEach(([x, w, h, col]) => tower(c, x, 1180, w, h, col));
  mbs(c, 720, 1180, 330);
  plateSea(c, 1180, H, t); c.fillStyle = 'rgba(255,200,120,.12)'; c.fillRect(0, 1180, W, 400);
  if (port2 > 0) { for (let k = 0; k < 3; k++) crane(c, 120 + k * 200, 1200, 260, t, k); containerShip(c, lerp(1500, 600, outC(pr(t, 58.6, 60.3))), 1500, 420, t, { seed: 21 }); containerShip(c, lerp(-500, 250, outC(pr(t, 59.2, 61.2))), 1700, 300, t, { seed: 23, ph: 1, flip: true }); }
}
function compare(c, t) { // 55.8–58.6: 1965 vs today, a wipe that sweeps the old city away
  const p = io(pr(t, 56.3, 58.2)), xs = lerp(W * .5, W + 10, p) * (t < 56.3 ? 1 : 1);
  modernCity(c, t);
  c.save(); c.beginPath(); c.rect(0, 0, t < 56.3 ? W * .5 : xs - W * .5 + W * .5 * (1 - p), H); c.clip(); oldCity(c, t); c.restore();
  const xd = t < 56.3 ? W * .5 : W * .5 * (1 - p); if (xd > 4) { c.fillStyle = '#fff'; c.fillRect(xd - 4, 0, 8, H); txt(c, '1965', xd / 2, 700, { size: 110, weight: 600, stroke: INK, sw: 8 }); }
  txt(c, 'Sekarang', xd + (W - xd) / 2, 700, { size: 100, weight: 600, stroke: INK, sw: 8 });
}

// ---------- scene list & transitions ----------
const SCENES = [
  [0, 7.7, mapScene, 'zoom'], [7.7, 11.9, shipArrive, 'zoom'], [11.9, 17.9, mapScene, 'whip'], [17.9, 19.9, city1965, 'whip'], [19.9, 27.1, jobless, 'zoom'],
  [27.1, 29.3, reservoir, 'zoom'], [29.3, 34.5, mapScene, 'whip'], [34.5, 39.1, worried, 'zoom'], [39.1, 46.8, mapScene, 'zoom'], [46.8, 48.7, port, 'whip'],
  [48.7, 52.1, business, 'whip'], [52.1, 55.8, newater, 'zoom'], [55.8, 58.6, compare, 'cut'], [58.6, 61.4, (c, t) => modernCity(c, t, 1), 'zoom'], [61.4, 99, mapScene, 'none'],
];
const SHAKES = [[T_1965, T_1965 + .45, 14], [T_NEW, T_NEW + .4, 10]];
let BUF_A = null, BUF_B = null;
function sceneAt(t) { return SCENES.findIndex(s => t >= s[0] && t < s[1]); }
function drawScene(c, t) {
  const i = Math.max(0, sceneAt(t)), [a, b, fn] = SCENES[i];
  const prev = SCENES[i - 1], next = SCENES[i + 1], D = .32;
  let tr = null;
  if (next && t > b - D / 2 && !['none', 'cut'].includes(SCENES[i][3])) tr = { A: [fn, Math.min(t, b - 1e-3)], B: [next[2], b + 1e-3], p: (t - (b - D / 2)) / D, kind: SCENES[i][3] };
  else if (prev && t < a + D / 2 && !['none', 'cut'].includes(prev[3])) tr = { A: [prev[2], a - 1e-3], B: [fn, t], p: (t - (a - D / 2)) / D, kind: prev[3] };
  if (!tr) { fn(c, t); return; }
  if (!BUF_A) { BUF_A = cv(W, H); BUF_B = cv(W, H); }
  const ga = BUF_A.getContext('2d'), gb = BUF_B.getContext('2d'); tr.A[0](ga, tr.A[1]); tr.B[0](gb, tr.B[1]); const p = io(clamp(tr.p, 0, 1));
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  if (tr.kind === 'whip') { for (let k = 0; k < 4; k++) { const off = k * 26 * Math.sin(p * Math.PI); c.globalAlpha = k ? .3 : 1; c.drawImage(BUF_A, -p * W - off, 0); c.drawImage(BUF_B, (1 - p) * W - off, 0); } c.globalAlpha = 1; }
  else { const sa = 1 + p * .8, sb = .6 + .4 * p; c.drawImage(BUF_A, W / 2 - W * sa / 2, H * .45 - H * sa / 2, W * sa, H * sa); c.globalAlpha = p; c.drawImage(BUF_B, W / 2 - W * sb / 2, H * .45 - H * sb / 2, W * sb, H * sb); c.globalAlpha = 1;
    for (let k = 1; k <= 4; k++) { const s = 1 + Math.sin(p * Math.PI) * .04 * k; c.globalAlpha = .18; c.drawImage(c.canvas, W / 2 - W * s / 2, H * .45 - H * s / 2, W * s, H * s); } c.globalAlpha = 1; }
}

// ---------- sound: SFX + a quiet documentary music bed that ducks under the VO ----------
export function sfx(sr, n, vo) {
  const out = new Float32Array(n), R = rng(55);
  const add = (t0, dur, f) => { const i0 = Math.max(0, Math.floor(t0 * sr)), i1 = Math.min(n, Math.floor((t0 + dur) * sr)); for (let i = i0; i < i1; i++) out[i] += f((i - i0) / sr); };
  const boom = (t0, amp, len = 1.6) => { let ph = 0; add(t0, len, x => { const f = lerp(70, 34, Math.min(1, x / .6)); ph += TAU * f / sr; return amp * Math.sin(ph) * Math.exp(-x * 2.6); }); };
  const whoosh = (t0, amp) => { let lp = 0, bp = 0; add(t0 - .18, .42, x => { const e = Math.sin(Math.PI * x / .42) ** 2, k = .02 + .3 * Math.sin(Math.PI * x / .42); lp += k * ((R() * 2 - 1) - lp); bp += .5 * (lp - bp); return amp * e * (lp - bp) * 3; }); };
  const water = (t0, dur, amp) => { let lp = 0; add(t0, dur, x => { lp += .06 * ((R() * 2 - 1) - lp); const bub = R() < .0015 ? 1 : 0; return amp * (lp * 2 + bub * .2) * Math.min(1, x * 3, (dur - x) * 3); }); };
  const horn = (t0, amp) => { let ph = 0; add(t0, 1.4, x => { ph += TAU * 98 / sr; const s = Math.sin(ph) + .5 * Math.sin(2 * ph) + .3 * Math.sin(3 * ph); return amp * s * Math.min(1, x * 6, (1.4 - x) * 3); }); };
  const clank = (t0, amp) => add(t0, .3, x => amp * (Math.sin(TAU * 420 * x) + .6 * Math.sin(TAU * 1130 * x)) * Math.exp(-x * 16));
  SCENES.slice(1).forEach(([a], i) => { if (!['cut', 'none'].includes(SCENES[i][3])) whoosh(a, .06); });
  whoosh(1.0, .08); whoosh(64.6, .07);
  boom(T_1965, .26); boom(T_NEW, .2);
  horn(8.0, .05); horn(47.0, .05);
  clank(47.2, .05); clank(47.9, .05); clank(48.3, .04);
  water(30.9, 3.6, .05); water(52.2, 3.4, .05); water(5.6, 1.6, .03);
  // music: slow Am–F–C–G pad with a soft bass, ducked by the VO envelope
  const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 164.8, 196], [196, 246.9, 293.7]], bar = 3.6, gain = .05;
  let env = 0; const k = Math.exp(-1 / (sr * .12));
  for (let i = 0; i < n; i++) {
    const x = i / sr, ci = Math.floor(x / bar) % 4, cx = (x % bar) / bar, ch = chords[ci];
    const att = Math.min(1, cx * 4) * Math.min(1, (1 - cx) * 6 + .35);
    let s = 0; for (const f of ch) s += Math.sin(TAU * f * x) * .5 + Math.sin(TAU * f * 1.003 * x) * .5;
    s = s / 3 * att + .6 * Math.sin(TAU * ch[0] / 2 * x) * att;
    const v = vo ? Math.abs(vo[i]) : 0; env = Math.max(v, env * k);
    const duck = 1 - .6 * Math.min(1, env / .12), fade = Math.min(1, x / 1.5, (DUR - x) / 1.5);
    out[i] += s * gain * duck * Math.max(0, fade);
  }
  return out;
}

// ---------- compositing ----------
let ACC = null;
const isMap = t => { const i = sceneAt(t); return i >= 0 && SCENES[i][2] === mapScene; };
function camSpeed(t) { const a = camAt(t), b = camAt(t - 1 / FPS); return Math.abs((a.lon - b.lon) * D2R * a.k) + Math.abs((mY(a.lat) - mY(b.lat)) * a.k) + Math.abs(Math.log(a.k / b.k)) * 900; }
export function renderFrame(c, t) {
  if (!ACC) ACC = cv(W, H);
  const sp = isMap(t) && isMap(t - 1 / FPS) && sceneAt(t) === sceneAt(t - 1 / FPS) ? camSpeed(t) : 0;
  let sh = 0; for (const [a, b, amp] of SHAKES) if (t > a && t < b) sh = Math.max(sh, amp * (1 - pr(t, a, b)));
  c.save(); if (sh > 0) { c.translate(W / 2 + Math.sin(t * 97) * sh, H / 2 + Math.cos(t * 83) * sh); c.scale(1.04, 1.04); c.translate(-W / 2, -H / 2); }
  if (sp > 22) { const n = sp > 70 ? 5 : 3, a = ACC.getContext('2d'); for (let i = 0; i < n; i++) { drawScene(a, t - i / FPS / n * 1.2); c.globalAlpha = 1 / (i + 1); c.drawImage(ACC, 0, 0); } c.globalAlpha = 1; }
  else drawScene(c, t);
  c.restore();
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .2; c.fillStyle = c.createPattern(TEX, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
  const vg = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.32)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  drawCaption(c, t);
}
