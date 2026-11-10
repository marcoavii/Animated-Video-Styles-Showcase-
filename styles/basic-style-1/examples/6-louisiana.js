// ---------- cast ----------
const PROT = { skin: '#d9a07a', hair: 'fringe', shirt: '#8a4b25', pattern: '#ecc88f' };
const DIP1 = { skin: '#f3ccaf', hair: 'wig', shirt: '#2b3a5a', cravat: true, buttons: true };
const DIP2 = { skin: '#f1c7a7', hair: 'wig', hairCol: '#cfcac0', shirt: '#5a3a2a', cravat: true, buttons: true };
const NAPO = { skin: '#f3ccaf', hair: 'fringe', hairCol: '#3a2a1c', hat: 'bicorne', shirt: '#2b3a6a', epaulette: true, buttons: true };
const JEFF = { skin: '#f6d2b8', hair: 'wig', hairCol: '#c0713a', shirt: '#4a3a2a', cravat: true, buttons: true };
const FRREP = { skin: '#f3ccaf', hair: 'wig', shirt: '#2b3a6a', cravat: true, sash: '#c8302a' };
const FRSOL = { skin: '#f0c6a6', hair: 'fringe', hairCol: '#5a3a1e', hat: 'shako', shirt: '#2b3a6a', belts: true };
const PEOPLE = [{ skin: '#6b3f26', hair: 'curly', shirt: '#e8dcc4' }, { skin: '#7b492e', hat: 'headwrap', wrap: '#c8302a', shirt: '#e3d3b0' }, { skin: '#5e3720', hair: 'curly', shirt: '#d9c9a4' }, { skin: '#704026', hat: 'headwrap', wrap: '#2f5aa0', shirt: '#e8dcc4' }];

// ---------- captions (VO words unchanged; highlights ≤ 3 words) ----------
const PHRASES = [
  [0.05, 2.62, ['Amerika cuma mau beli', '!SATU KOTA', 'dari Prancis.']],
  [3.12, 7.62, ['Tapi pulangnya', 'malah dapet wilayah', 'seluas hampir', '!2,1 JUTA|17', '!KILOMETER PERSEGI!']],
  [8.06, 8.76, ['!KOK BISA?']],
  [9.14, 9.7, ['Jadi gini,']],
  [10.16, 15.44, ['!TAHUN 1800-AN,|26', '!NAPOLEON', 'punya rencana', 'membangun kembali', '!KEKAISARAN PRANCIS', 'di Amerika.']],
  [15.98, 19.78, ['Kuncinya ada di', '!LOUISIANA', 'dan koloni kaya', 'bernama', '!SAINT-DOMINGUE,']],
  [20.08, 20.86, ['sekarang Haiti.']],
  [21.28, 24.82, ['Tapi penduduk Saint-Domingue', 'yang diperbudak', '!BANGKIT MELAWAN', 'Prancis.']],
  [25.22, 27.92, ['Napoleon kirim', '!PULUHAN RIBU TENTARA', 'buat merebutnya.']],
  [28.32, 29.22, ['Awalnya berhasil,']],
  [29.48, 32.14, ['tapi wabah', '!YELLOW FEVER', 'menghancurkan pasukannya.']],
  [32.58, 35.8, ['Prancis akhirnya', '!KEHILANGAN KENDALI', 'atas koloni itu.']],
  [36.18, 40.18, ['Nah, tanpa Saint-Domingue,', '!RENCANA NAPOLEON', 'di Amerika', 'jadi berantakan.']],
  [40.66, 45.66, ['Sementara itu,', 'Amerika butuh', '!NEW ORLEANS', 'buat mengamankan', '!JALUR PERDAGANGAN', '!SUNGAI MISSISSIPPI.']],
  [46.0, 48.72, ['!THOMAS JEFFERSON', 'lalu mengirim diplomat', 'buat negosiasi.']],
  [49.08, 53.58, ['Target awalnya', '!NEW ORLEANS', 'dan', '!FLORIDA,', 'dengan anggaran maksimal', '!10 JUTA DOLAR.|20']],
  [53.92, 58.76, ['Tapi Prancis', 'malah menawarkan', '!SELURUH LOUISIANA', 'seharga', '!15 JUTA DOLAR!|21']],
  [59.1, 63.5, ['Diplomatnya', '!LANGSUNG SETUJU,', 'meski tawaran itu', '!DI LUAR MANDAT', 'awal mereka.']],
  [63.88, 64.34, ['!HASILNYA?']],
  [64.64, 69.2, ['Wilayah Amerika', 'hampir', '!DUA KALI LIPAT,', 'dengan harga sekitar', '!4 SEN|8', '!PER ACRE!']],
  [69.5, 71.3, ['!MASIH BANYAK CERITA', 'yang belum lu tahu.']],
  [71.62, 73.05, ['!FOLLOW', 'biar nggak', '!KETINGGALAN!']],
];
export const CAPS = [];
PHRASES.forEach(([s, e, chunks], pi) => {
  const parsed = chunks.map(ch => { const hl = ch[0] === '!', [txt0, wt] = (hl ? ch.slice(1) : ch).split('|'); return { text: txt0, hl, w: (wt ? +wt : txt0.length) + 4 }; });
  const total = parsed.reduce((n, x) => n + x.w, 0); let acc = s; const next = PHRASES[pi + 1] ? PHRASES[pi + 1][0] : DUR;
  parsed.forEach((p, i) => { const d = (e - s) * p.w / total; CAPS.push({ s: acc, e: i === parsed.length - 1 ? Math.min(next, e + .6) : acc + d, text: p.text, hl: p.hl }); acc += d; });
});
const capStart = (text, from = 0) => (CAPS.find(q => q.text.startsWith(text) && q.s >= from) || { s: 0 }).s;
const T_KOTA = capStart('SATU KOTA'), T_21 = capStart('2,1 JUTA'), T_KOK = capStart('KOK BISA'), T_LOUIS = capStart('LOUISIANA'), T_SD = capStart('SAINT-DOMINGUE,'), T_HAITI = capStart('sekarang Haiti');
const T_KENDALI = capStart('KEHILANGAN'), T_RENCANA = capStart('RENCANA NAPOLEON'), T_NO = capStart('NEW ORLEANS'), T_MISS = capStart('SUNGAI MISSISSIPPI'), T_NO2 = capStart('NEW ORLEANS', 49), T_FL = capStart('FLORIDA'), T_10 = capStart('10 JUTA');
const T_SELURUH = capStart('SELURUH LOUISIANA'), T_15 = capStart('15 JUTA'), T_SETUJU = capStart('LANGSUNG SETUJU'), T_MANDAT = capStart('DI LUAR MANDAT'), T_HASIL = capStart('HASILNYA'), T_2X = capStart('DUA KALI'), T_4 = capStart('4 SEN');
function drawCaption(c, t) {
  const cap = CAPS.find(q => t >= q.s && t < q.e); if (!cap) return;
  if (cap.hl) txt(c, cap.text, W / 2, 1385, { size: 64, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: back(pr(t, cap.s, cap.s + .2)) });
  else txt(c, cap.text, W / 2, 1385, { size: 54, font: SANS, weight: 700, stroke: INK, sw: 7, a: pr(t, cap.s, cap.s + .1) });
}

// ---------- camera (map scenes) ----------
const CAM = [
  [0, -92, 37, 600, 'l'], [1.4, NOLA[0], NOLA[1], 8500, 'in'], [3.1, NOLA[0], NOLA[1], 9200, 'l'], [4.6, -97, 38, 620, 'io'], [9.1, -97, 38, 660, 'l'],
  [12.5, 2.35, 48.85, 1200, 'h'], [13.4, -30, 38, 380, 'io'], [14.9, -78, 33, 420, 'io'], [15.8, -97, 38, 640, 'io'], [18.0, -96, 37, 670, 'l'], [19.1, -72.6, 19.0, 4400, 'io'], [21.3, -72.6, 19.0, 4800, 'l'],
  [32.5, -72.6, 19.0, 4500, 'h'], [35.9, -72.6, 19.0, 4800, 'l'], [36.8, -86, 31, 700, 'io'], [40.4, -86, 31, 740, 'l'], [41.4, -84, 38, 950, 'io'], [42.6, -89, 37, 1000, 'io'], [44.3, -90, 34, 1300, 'l'], [46.1, NOLA[0], NOLA[1], 5200, 'io'],
  [49.08, -86, 30, 2000, 'h'], [51.4, -86, 30, 2150, 'l'],
  [63.7, -95, 39, 640, 'h'], [66.8, -95, 39, 660, 'l'], [69.2, -96, 40, 470, 'io'], [73.3, -96, 40, 450, 'l'],
];
const EASE = { l: x => x, io, in: x => x * x * x, out: outC, h: () => 1 };
export function camAt(t) {
  let i = 1; while (i < CAM.length - 1 && CAM[i][0] < t) i++;
  const a = CAM[i - 1], b = CAM[i], p = EASE[b[4]](pr(t, a[0], b[0]));
  return { lon: lerp(a[1], b[1], p), lat: lerp(a[2], b[2], p), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)) };
}
const projector = (cam, w, h) => { const cx = cam.lon * D2R, cy = mY(cam.lat), k = cam.k; return (lon, lat) => [w / 2 + (lon * D2R - cx) * k, h / 2 - (mY(lat) - cy) * k]; };

function mapExtra(c, P, cam, w, h, st, pat, olw, t) {
  for (const [ring, col, a, wipe] of st.regions || []) {
    if (a <= 0) continue; c.save(); c.beginPath(); pathRings(c, LANDW, cam, w, h); c.clip('evenodd');
    if (wipe) { const [x, y] = P(wipe[0], wipe[1]); c.beginPath(); c.arc(x, y, Math.max(.1, wipe[2]), 0, TAU); c.clip(); }
    c.beginPath(); pathRings(c, [ring], cam, w, h); c.globalAlpha = a; c.fillStyle = col; c.fill();
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = .4 * a; c.fillStyle = pat; c.fill(); c.globalCompositeOperation = 'source-over';
    c.globalAlpha = a; c.lineWidth = olw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.restore();
  }
  if (st.miss > 0) { c.save(); polyline(c, P, MISS, st.miss); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = INK; c.stroke(); c.lineWidth = 8; c.strokeStyle = '#7fd0ff'; c.shadowColor = 'rgba(120,200,255,.9)'; c.shadowBlur = 18; c.stroke(); c.restore(); }
}
function mapState(t) {
  const st = { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, deep: 0, wallace: 0, plates: 0, regions: [], miss: 0 };
  const L = (s, lon, lat, a, o) => { if (a > 0) st.labels.push([s, lon, lat, a, o]); };
  const R = (ring, col, a, wipe) => { if (a > 0) st.regions.push([ring, col, a, wipe]); };
  const politics = (a, louisCol = FR_BLUE, usA = 1) => { R(RG.brit, GB_RED, a * .9); R(RG.spain, ES_ORANGE, a * .9); R(RG.florida, ES_ORANGE, a * .9); R(RG.usa, US_TEAL, a * usA); };
  // hook: the whole of Louisiana spreading out from New Orleans
  if (t < 9.2) {
    R(RG.orleans, FR_BLUE, pr(t, .9, 1.2));
    if (t > 3.0) { politics(pr(t, 3.4, 4.0) * .85); R(RG.louis, FR_BLUE, 1, t < T_21 + .8 ? [NOLA[0], NOLA[1], io(pr(t, 4.6, T_21 + .8)) * 1500] : null); }
    L('New Orleans', NOLA[0], NOLA[1] + .9, win(t, .9, 3.4), { size: 56, weight: 600, col: YEL });
    L('Louisiana', -100, 42, pr(t, 5.0, 5.4), { size: 72, weight: 600 }); L('Amerika Serikat', -81, 38.5, pr(t, 4.2, 4.6), { size: 44, weight: 600 }); L('Spanyol', -108, 30, pr(t, 4.2, 4.6), { size: 48 }); L('Britania', -95, 56, pr(t, 4.2, 4.6), { size: 48 });
  }
  // context: Louisiana, then Saint-Domingue
  if (t > 12.4 && t < 21.4) {
    politics(pr(t, 15.0, 15.6) * .8); R(RG.louis, FR_BLUE, pr(t, T_LOUIS - .1, T_LOUIS + .3)); R(RG.sd, FR_BLUE, pr(t, 18.6, 19.0));
    L('Prancis', 2.5, 46.5, win(t, 12.4, 13.6), { size: 60, weight: 600 }); L('Louisiana', -100, 42, pr(t, T_LOUIS, T_LOUIS + .3), { size: 72, weight: 600 });
    L('Saint-Domingue', -72.8, 20.55, pr(t, T_SD, T_SD + .3), { size: 54, weight: 600, col: YEL }); L('sekarang Haiti', -72.8, 17.55, pr(t, T_HAITI, T_HAITI + .3), { size: 48, weight: 600, col: YEL, italic: true });
  }
  // conflict outcome + build-up
  if (t > 32.4 && t < 46.2) {
    const lost = pr(t, T_KENDALI, T_KENDALI + .5);
    R(RG.sd, lost > 0 ? HT_GREEN : FR_BLUE, 1); L('Haiti', -72.8, 19.3, lost * win(t, 32.4, 36.4), { size: 60, weight: 600, col: YEL });
    if (t > 36) { politics(pr(t, 36.3, 36.8) * .85); R(RG.louis, FR_BLUE, pr(t, 36.3, 36.8)); R(RG.sd, '#5a6a5a', pr(t, 36.6, 37.1) * .9); }
    L('Louisiana', -100, 42, win(t, 36.5, 40.6), { size: 64, weight: 600 }); L('Saint-Domingue', -72.8, 20.6, win(t, 36.5, 40.6), { size: 44, weight: 600 });
    L('Amerika Serikat', -82, 38.5, win(t, 40.6, 46.2), { size: 56, weight: 600 }); L('1803', -84, 35.6, win(t, 40.9, 46.2), { size: 50, italic: true });
    st.miss = pr(t, T_MISS - .9, T_MISS + .4);
    L('Sungai Mississippi', -95.5, 40, pr(t, T_MISS - .4, T_MISS), { size: 46, weight: 600, col: '#bfe8ff', rot: -70 });
    L('New Orleans', NOLA[0] + 1.2, NOLA[1] + 1.3, win(t, T_NO, 46.2), { size: 50, weight: 600, col: YEL });
  }
  // target: New Orleans and Florida
  if (t > 49 && t < 51.5) { politics(.8); R(RG.louis, FR_BLUE, .9); R(RG.orleans, YEL, pr(t, T_NO2, T_NO2 + .3)); R(RG.florida, '#e8322c', pr(t, T_FL, T_FL + .3)); L('New Orleans', -90.6, 31.6, pr(t, T_NO2, T_NO2 + .3), { size: 54, weight: 600, col: YEL }); L('Florida', -82.3, 28.4, pr(t, T_FL, T_FL + .3), { size: 60, weight: 600 }); }
  // payoff: Louisiana joins the USA
  if (t > 63.6) {
    const merge = pr(t, T_2X - .2, T_2X + .9); politics(1); R(RG.louis, FR_BLUE, 1 - pr(t, T_2X + .9, T_2X + 1.1)); R(RG.orleans, FR_BLUE, 1 - pr(t, T_2X + .9, T_2X + 1.1));
    R(RG.louis, US_TEAL, 1, merge < 1 ? [NOLA[0], NOLA[1], io(merge) * 1800] : null); R(RG.orleans, US_TEAL, merge);
    L('Sebelum', -95, 51.5, win(t, 63.9, T_2X), { size: 64, weight: 600 }); L('Sesudah', -95, 51.5, pr(t, T_2X + .3, T_2X + .6) * win(t, T_2X, 69.3), { size: 64, weight: 600, col: YEL });
    L('Amerika Serikat', -92, 40, pr(t, T_2X + .9, T_2X + 1.3) * win(t, 64, 69.6), { size: 72, weight: 600 });
  }
  return st;
}
function mapScene(c, t) {
  const cam = camAt(t), st = mapState(t), P = drawMap(c, W, H, cam, st, t), [nx, ny] = P(NOLA[0], NOLA[1]);
  // hook: two diplomats came for one city
  if (t < 4.8) { const s = env(t, 1.0, 4.4); [[DIP1, -120], [DIP2, 120]].forEach(([d, dx], i) => { drawChar(c, nx + dx, ny + 420, 360, { ...d, expr: 'smug' }, env(t, 1.0 + i * .12, 4.4)); }); paper(c, nx, ny + 260, 120, 150, -.1, s); txt(c, '1 kota', nx, ny + 262, { size: 38, font: SANS, weight: 700, col: '#2b2018', shadow: false, sc: s, rot: -6 }); }
  { const s = env(t, T_21 - .05, 9.2); if (s > 0) { txt(c, '±2,1 juta km²', W / 2, 420, { size: 130, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: s * (1 + .8 * (1 - outC(pr(t, T_21, T_21 + .25)))) }); } }
  if (t > T_KOK - .05 && t < 9.2) { const y = lerp(2500, 1960, outC(pr(t, T_KOK, T_KOK + .2))); drawChar(c, 300, y, 820, { ...DIP1, expr: 'shock' }); drawChar(c, 800, y + 40, 760, { ...DIP2, expr: 'shock', flip: true }); txt(c, '?!', W / 2, 640, { size: 220, weight: 600, stroke: INK, sw: 12, sc: env(t, T_KOK) }); }
  // across the Atlantic
  if (t > 12.6 && t < 15.6) { const path = [[-4.5, 48.4], [-25, 42], [-50, 33], [-75, 27], [NOLA[0], NOLA[1]]], p = io(pr(t, 12.7, 15.4)), head = polyline(c, P, path, p); c.save(); c.setLineDash([16, 12]); c.lineDashOffset = -t * 40; c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(); c.restore(); const [hx, hy] = head.at(-1); galleon(c, hx, hy, 130, t, { flag: 'fr' }); }
  if (t > 18.8 && t < 21.4) { const [x, y] = P(-72.6, 19.0); c.save(); c.globalAlpha = win(t, 19.0, 21.4, .1, .2); yellowEllipse(c, x, y, 280, 160, 0, pr(t, 19.0, 19.4)); c.restore(); }
  // Napoleon's plan falls apart
  if (t > 36.2 && t < 40.7) { const y = lerp(2500, 1960, outC(pr(t, 36.3, 36.55))) + lerp(0, 900, io(pr(t, 40.35, 40.7))); drawChar(c, 290, y, 820, { ...NAPO, expr: t > T_RENCANA ? 'worried' : 'neutral' }); const [sx, sy] = P(-72.6, 19); redX(c, sx, sy, 110, pr(t, 36.7, 37.2)); if (t > T_RENCANA) questionMark(c, 560, y - 880, 150, env(t, T_RENCANA, 40.5)); }
  // trade down the Mississippi
  if (t > 43.4 && t < 46.2) [[.62, 0], [.78, 1], [.9, 2]].forEach(([p0, i]) => { const p = clamp(p0 + (t - 43.4) * .06, 0, 1), pts = polyline(c, P, MISS, p); const [x, y] = pts.at(-1); keelboat(c, x, y - 12, cam.k > 2500 ? 140 : 70, t); });
  // New Orleans & Florida targets
  if (t > 49 && t < 51.5) { const [fx, fy] = P(-82, 28); arrow(c, fx + 220, fy - 260, fx + 70, fy - 80, 26, '#fff', env(t, T_FL)); }
  // payoff
  if (t > 63.6) {
    { const s = env(t, T_4 - .1); if (s > 0) { coin(c, W / 2 - 250, 470, 70 * s); txt(c, '4 sen / acre', W / 2 + 60, 470, { size: 120, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: s }); } }
    if (t > 69.4) { const y = lerp(2500, 1960, outC(pr(t, 69.5, 69.75))); drawChar(c, 270, y, 640, { ...DIP1, expr: 'happy' }); drawChar(c, 810, y + 30, 600, { ...DIP2, expr: 'happy', flip: true }); followUI(c, t, 71.6); }
  }
}
function followUI(c, t, t0) {
  const s = env(t, t0); if (s <= 0) return; c.save(); c.translate(W / 2, 760); c.scale(s, s);
  c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.roundRect(-400, -130, 800, 260, 60); c.fill(); c.shadowColor = 'transparent';
  c.save(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.fillStyle = '#e8d8b5'; c.fill(); c.clip(); drawChar(c, -260, 260, 380, PROT); c.restore(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.lineWidth = 7; c.strokeStyle = INK; c.stroke();
  const on = t > t0 + .8; c.beginPath(); c.roundRect(-130, -62, 360, 124, 62); c.fillStyle = on ? '#3a3a3a' : '#e8322c'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  txt(c, on ? 'Following ✓' : 'Follow', 50, 2, { size: 58, font: SANS, weight: 700, shadow: false, sc: on ? 1 : 1 + .06 * Math.max(0, Math.sin(t * 9)) });
  c.save(); c.translate(320, -10); c.rotate(on ? Math.sin(t * 22) * .3 * (1 - pr(t, t0 + .8, t0 + 1.5)) : 0); c.beginPath(); c.moveTo(-30, 30); c.quadraticCurveTo(-30, -38, 0, -40); c.quadraticCurveTo(30, -38, 30, 30); c.closePath(); c.fillStyle = '#f2c43a'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, 38, 9, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.restore();
  const gp = pr(t, t0 + .25, t0 + .7), b2 = pr(t, t0 + .85, t0 + 1.2); drawGlove(c, W / 2 + 120 + lerp(240, 0, outC(gp)) + b2 * 200, 760 + lerp(320, 70, outC(gp)) + b2 * 260 + (t > t0 + .7 && t < t0 + .85 ? 14 : 0), 140, -.5, env(t, t0 + .2, 99));
}

// ---------- plates ----------
function palace(c, t) { // 9.1–12.5 Napoleon in an imperial hall
  c.fillStyle = '#2f4a3a'; c.fillRect(0, 0, W, H);
  for (let x = 40; x < W; x += 260) { c.fillStyle = 'rgba(212,169,58,.25)'; c.fillRect(x, 120, 200, 980); c.strokeStyle = '#d4a93a'; c.lineWidth = 6; c.strokeRect(x, 120, 200, 980); }
  c.fillStyle = '#9fc2df'; c.fillRect(400, 220, 280, 620); c.strokeStyle = '#d4a93a'; c.lineWidth = 14; c.strokeRect(400, 220, 280, 620); c.lineWidth = 6; c.beginPath(); c.moveTo(540, 220); c.lineTo(540, 840); c.moveTo(400, 530); c.lineTo(680, 530); c.stroke();
  for (const sd of [-1, 1]) { c.fillStyle = '#8e1b1b'; c.beginPath(); c.moveTo(540 + sd * 150, 180); c.quadraticCurveTo(540 + sd * 260, 500, 540 + sd * 170, 900); c.lineTo(540 + sd * 320, 900); c.lineTo(540 + sd * 320, 180); c.fill(); }
  c.save(); c.translate(540, 90); c.strokeStyle = '#d4a93a'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, -100); c.lineTo(0, 0); c.stroke(); for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(i * 40, 30 + Math.abs(i) * 6, 12, 0, TAU); c.fillStyle = '#ffe9a8'; c.fill(); c.stroke(); } c.restore();
  c.fillStyle = '#6a2a2a'; c.fillRect(0, 1250, W, H); c.fillStyle = '#d4a93a'; c.fillRect(0, 1250, W, 12);
  flagPole(c, 160, 1250, 420, 'fr', t, env(t, 9.3));
  const z = lerp(760, 900, io(pr(t, 9.2, 12.4))); drawChar(c, W / 2 + 40, 1250 + (z - 760) * .4, z, { ...NAPO, expr: 'smug' }, env(t, 9.25));
  bigText(c, '1800-an', W / 2, 300, { size: 150, stroke: INK, sw: 10, sc: env(t, capStart('TAHUN 1800')) });
  txt(c, 'Napoleon Bonaparte', W / 2, 1120, { size: 64, weight: 600, col: YEL, stroke: INK, sw: 6, sc: env(t, capStart('NAPOLEON')) });
}
function plantation(c, t) { // 21.25–23.3
  plateSky(c, '#9cc4dc', '#f0ead6', 900, t); hills(c, 905, '#6f8f5a', 90, .006, 3);
  c.save(); c.translate(820, 880); c.fillStyle = '#efe6d2'; c.fillRect(-90, -90, 180, 90); c.fillStyle = '#8a4a2a'; c.beginPath(); c.moveTo(-110, -90); c.lineTo(0, -150); c.lineTo(110, -90); c.fill(); c.restore();
  caneField(c, 1000, t); c.fillStyle = '#8a7a52'; c.fillRect(-80, 1260, W + 160, H);
  coffeeShrub(c, 120, 1330, 200); coffeeShrub(c, 980, 1350, 220);
  PEOPLE.slice(0, 3).forEach((p, i) => { const x = 280 + i * 260, y = 1760; drawChar(c, x, y, 380, { ...p, expr: 'worried' }, env(t, 21.3 + i * .1)); caneBundle(c, x + 110, y - 300, 170); });
  txt(c, 'Perkebunan tebu & kopi', W / 2, 300, { size: 64, weight: 600, sc: env(t, 21.35) });
}
function revolution(c, t) { // 23.3–25.2
  const g = c.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, '#6a2a1e'); g.addColorStop(1, '#f0a050'); c.fillStyle = g; c.fillRect(0, 0, W, H); hills(c, 1100, '#3a2a22', 110, .006, 1); c.fillStyle = '#4a3a2a'; c.fillRect(0, 1100, W, H);
  flagPole(c, 540, 1180, 640, 'ht', t, env(t, 23.4));
  PEOPLE.forEach((p, i) => { const x = 160 + i * 250, y = 1720 + (i % 2) * 40; drawChar(c, x, y, 420, { ...p, expr: 'angry' }, env(t, 23.35 + i * .08)); drawGlove(c, x + (i % 2 ? -150 : 150), y - 470 + Math.sin(t * 10 + i) * 12, 120, 0, env(t, 23.6 + i * .08)); });
  txt(c, 'Revolusi Haiti', W / 2, 300, { size: 96, weight: 600, col: YEL, stroke: INK, sw: 7, sc: env(t, 23.4) });
}
function fleet(c, t) { // 25.2–28.3
  plateSky(c, '#78acd6', '#e6eef0', 900, t); plateSea(c, 900, H, t);
  [[0, 300, 1010, 200], [1, 760, 1060, 240], [2, 470, 1250, 340], [3, 900, 1380, 300]].forEach(([i, x, y, s]) => galleon(c, x + (t - 25.2) * 30, y, s, t, { flag: 'fr', ph: i * 1.3, sc: env(t, 25.25 + i * .12) }));
  for (let i = 0; i < 10; i++) { const s = env(t, 26.2 + i * .07); if (s > 0) drawChar(c, 90 + i * 100, 1820, 170, FRSOL, s); }
  txt(c, 'Pasukan Prancis', W / 2, 300, { size: 80, weight: 600, sc: env(t, 25.3) });
}
function landing(c, t) { // 28.3–29.4
  plateSky(c, '#78acd6', '#eaf0ef', 900, t); plateSea(c, 900, 1150, t); galleon(c, 860, 1030, 220, t, { flag: 'fr' });
  c.fillStyle = '#d9c28a'; c.fillRect(-80, 1150, W + 160, H); palm(c, 90, 1160, 260, t);
  for (let i = 0; i < 4; i++) drawChar(c, lerp(700, 220, outC(pr(t, 28.3, 29.3))) + i * 170, 1700, 330, { ...FRSOL, expr: 'smug' });
  flagPole(c, lerp(900, 420, outC(pr(t, 28.3, 29.3))), 1420, 380, 'fr', t);
}
function fever(c, t) { // 29.4–32.5
  plateSky(c, '#a8b8a0', '#e8e4cc', 1000, t); c.fillStyle = '#9a8a62'; c.fillRect(-80, 1000, W + 160, H);
  for (const x of [180, 900]) { c.beginPath(); c.moveTo(x - 160, 1060); c.lineTo(x, 880); c.lineTo(x + 160, 1060); c.closePath(); c.fillStyle = '#e8dcc0'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); }
  c.save(); c.translate(540, 560); c.rotate(-.03); c.fillStyle = '#f1e4c4'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 20; c.fillRect(-330, -300, 660, 560); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = '#5a4630'; c.strokeRect(-310, -280, 620, 520);
  c.fillStyle = '#3a2a1e'; c.font = `italic 600 54px ${SERIF}`; c.textAlign = 'center'; c.fillText('Demam Kuning', 0, -200); c.font = `italic 500 34px ${SERIF}`; c.fillText('(yellow fever)', 0, -150); c.restore();
  mosquito(c, 440 + Math.sin(t * 9) * 6, 600, 300); thermometer(c, 740, 760, 300, pr(t, 29.7, 31.2));
  drawChar(c, 540, 1600, 300, { ...FRSOL, skin: '#e8d27a', expr: 'worried' }, env(t, 30.75));
  for (const [x, rot, t0] of [[440, -1.45, 30.6], [640, 1.45, 30.9]]) drawChar(c, x, 1790, 330, { ...FRSOL, skin: '#e8d27a', expr: 'worried', rot }, env(t, t0));
}
function office(c, t) { // 46.0–49.08 Jefferson sends diplomats
  c.fillStyle = '#e8dcc4'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(120,90,60,.15)'; for (let x = 0; x < W; x += 120) c.fillRect(x, 0, 60, 1250);
  c.save(); c.fillStyle = '#e8d6a8'; c.fillRect(600, 220, 400, 300); c.lineWidth = 10; c.strokeStyle = '#5a3a1e'; c.strokeRect(600, 220, 400, 300); c.restore();
  miniMap(c, 610, 230, 380, 280, { lon: -88, lat: 36, k: 520 }, { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, regions: [[RG.usa, US_TEAL, .9], [RG.louis, FR_BLUE, .9]] });
  flagPole(c, 140, 1250, 420, 'us', t);
  woodFloor(c, 1250, '#8a5a32', '#4e301a');
  drawChar(c, 420, 1250, 720, { ...JEFF, expr: 'smug' }, env(t, 46.05));
  txt(c, 'Thomas Jefferson', 420, 380, { size: 66, weight: 600, col: YEL, stroke: INK, sw: 6, sc: env(t, 46.1) }); txt(c, 'Presiden Amerika Serikat', 420, 455, { size: 42, italic: true, sc: env(t, 46.2) });
  if (t > 47.0) { const x = lerp(1400, 820, outC(pr(t, 47.0, 48.4))); drawChar(c, x, 1760, 360, { ...DIP1, flip: true }); drawChar(c, x + 170, 1790, 340, { ...DIP2, flip: true }); paper(c, x - 140, 1580, 90, 110, .2); }
}
function budgetDoc(c, t) { // 51.4–53.9
  c.fillStyle = '#3e2a1b'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, 900); c.rotate(-.03); const z = 1 + .03 * (t - 51.4); c.scale(z, z); c.fillStyle = '#f3e7c9'; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; c.fillRect(-360, -520, 720, 980); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = '#5a4630'; c.strokeRect(-335, -495, 670, 930);
  c.fillStyle = '#2b2018'; c.textAlign = 'center'; c.font = `600 52px ${SERIF}`; c.fillText('INSTRUKSI NEGOSIASI', 0, -400);
  c.font = `italic 500 40px ${SERIF}`; c.fillText('Target: New Orleans & Florida', 0, -300); c.fillText('Anggaran maksimal:', 0, -200);
  c.font = `700 92px ${SANS}`; c.fillStyle = '#1b5e2a'; c.fillText('$10,000,000', 0, -80);
  c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-260, 60 + i * 60); c.lineTo(260, 60 + i * 60); c.stroke(); } c.restore();
  flagUS15(c, 140, 1440, 160, 100); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(140, 1440, 160, 100);
  const s = env(t, T_10 - .05); if (s > 0) { txt(c, '$10 JUTA', W / 2, 1600, { size: 140, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: s }); }
}
function negotiation(c, t) { // 53.9–59.1
  const z = 1 + .12 * io(pr(t, T_15 - .3, T_15 + .1)); c.save(); c.translate(W / 2, 1300); c.scale(z, z); c.translate(-W / 2, -1300);
  c.fillStyle = '#5a3e2a'; c.fillRect(-100, -100, W + 200, H + 200); c.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 0; x < W; x += 150) c.fillRect(x, 0, 8, 1100);
  flagPole(c, 120, 1080, 380, 'us', t); flagPole(c, 900, 1080, 380, 'fr', t);
  drawChar(c, 230, 1120, 460, { ...DIP1, expr: t > T_15 ? 'shock' : 'neutral' }); drawChar(c, 420, 1150, 420, { ...DIP2, expr: t > T_15 ? 'shock' : 'neutral' }); drawChar(c, 820, 1130, 470, { ...FRREP, expr: 'smug', flip: true });
  bubbleSay(c, 300, 480, 110, '?', env(t, 54.2, 56.0)); bubbleSay(c, 800, 470, 120, '!', env(t, 54.8, 56.2));
  woodFloor(c, 1100, '#8a5a32', '#4e301a');
  const mp = outC(pr(t, T_SELURUH - .2, T_SELURUH + .5)); if (mp > 0) { c.save(); c.translate(W / 2, 1460); c.scale(1, mp); c.fillStyle = '#e8d6a8'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 20; c.fillRect(-400, -260, 800, 520); c.shadowColor = 'transparent'; c.restore(); if (mp > .9) miniMap(c, 150, 1210, 780, 500, { lon: -95, lat: 40, k: 560 }, { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, regions: [[RG.usa, US_TEAL, .7], [RG.louis, FR_BLUE, 1], [RG.orleans, FR_BLUE, 1]] }); c.lineWidth = 6; c.strokeStyle = '#5a3a1e'; c.strokeRect(140, 1200 + (1 - mp) * 260, 800, 520 * mp); }
  c.restore();
  if (t > T_SELURUH - .1) morphText(c, '$10 JUTA', '$15 JUTA', W / 2, 330, pr(t, T_15 - .35, T_15 + .2), { size: 150, colA: '#f2e9d8', colB: YEL });
}
function signing(c, t) { // 59.1–63.7
  c.fillStyle = '#4a3322'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < W; x += 140) c.fillRect(x, 0, 8, 1150);
  drawChar(c, 280, 1250, 600, { ...DIP1, expr: 'happy' }); drawChar(c, 800, 1260, 580, { ...DIP2, expr: 'happy', flip: true });
  woodFloor(c, 1150, '#8a5a32', '#4e301a');
  c.save(); c.translate(560, 1540); c.rotate(-.03); c.fillStyle = '#f5ecd6'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 16; c.fillRect(-330, -300, 660, 560); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(-330, -300, 660, 560);
  c.fillStyle = '#2b2018'; c.textAlign = 'center'; c.font = `600 50px ${SERIF}`; c.fillText('Louisiana Purchase', 0, -220); c.font = `italic 500 34px ${SERIF}`; c.fillText('1803 · $15.000.000', 0, -160);
  for (const [sx, t0] of [[-150, 59.4], [150, 60.3]]) { const sp = pr(t, t0, t0 + .8); c.strokeStyle = '#1b2a5a'; c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 40 * sp; i++) { const f = i / 40, x = sx - 110 + f * 220, y = 120 + Math.sin(f * 16 + sx) * 18 - f * 10; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.restore();
  waxSeal(c, 560, 1780, 54, env(t, 61.1));
  // the original mandate, overshot
  c.save(); c.translate(860, 470); c.rotate(.08); c.fillStyle = '#f7f0dc'; c.fillRect(-170, -110, 340, 220); c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(-170, -110, 340, 220); c.fillStyle = '#2b2018'; c.textAlign = 'center'; c.font = `600 34px ${SERIF}`; c.fillText('Mandat awal', 0, -50); c.font = `700 46px ${SANS}`; c.fillText('maks $10 juta', 0, 20); c.restore();
  const sp = pr(t, T_MANDAT, T_MANDAT + .2); if (sp > 0) { c.save(); c.translate(860, 480); c.rotate(-.18); c.scale(lerp(2.4, 1, outC(sp)), lerp(2.4, 1, outC(sp))); c.lineWidth = 9; c.strokeStyle = '#c8302a'; c.beginPath(); c.roundRect(-210, -60, 420, 120, 18); c.stroke(); c.font = `700 56px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c8302a'; c.fillText('DI LUAR MANDAT', 0, 4); c.restore(); }
  if (t > 59.3 && t < 61.2) { const sp2 = pr(t, 59.4, 61.1), x = 560 - 260 + (sp2 < .5 ? sp2 * 2 : (sp2 - .5) * 2 + 1.36) * 160, y = 1660; c.save(); c.strokeStyle = '#efe6d2'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y - 160); c.stroke(); c.restore(); drawGlove(c, x + 55, y - 70, 100, .5); }
}

// ---------- scene list & transitions ----------
const SCENES = [
  [0, 9.1, mapScene, 'whip'], [9.1, 12.5, palace, 'zoom'], [12.5, 21.25, mapScene, 'whip'], [21.25, 23.3, plantation, 'whip'], [23.3, 25.2, revolution, 'zoom'],
  [25.2, 28.3, fleet, 'whip'], [28.3, 29.4, landing, 'whip'], [29.4, 32.5, fever, 'zoom'], [32.5, 46.0, mapScene, 'whip'], [46.0, 49.08, office, 'zoom'],
  [49.08, 51.4, mapScene, 'whip'], [51.4, 53.9, budgetDoc, 'whip'], [53.9, 59.1, negotiation, 'zoom'], [59.1, 63.7, signing, 'zoom'], [63.7, 99, mapScene, 'none'],
];
const SHAKES = [[T_21, T_21 + .4, 10], [T_KOK, T_KOK + .45, 16], [T_15, T_15 + .5, 18], [T_MANDAT, T_MANDAT + .35, 10]];
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

// ---------- sound: SFX + quiet music bed ducked under the VO ----------
export function sfx(sr, n, vo) {
  const out = new Float32Array(n), R = rng(63);
  const add = (t0, dur, f) => { const i0 = Math.max(0, Math.floor(t0 * sr)), i1 = Math.min(n, Math.floor((t0 + dur) * sr)); for (let i = i0; i < i1; i++) out[i] += f((i - i0) / sr); };
  const boom = (t0, amp, len = 1.6) => { let ph = 0; add(t0, len, x => { const f = lerp(70, 34, Math.min(1, x / .6)); ph += TAU * f / sr; return amp * Math.sin(ph) * Math.exp(-x * 2.6); }); };
  const thud = (t0, amp) => { let ph = 0; add(t0, .35, x => { ph += TAU * lerp(140, 60, x / .35) / sr; return amp * Math.sin(ph) * Math.exp(-x * 11); }); };
  const whoosh = (t0, amp) => { let lp = 0, bp = 0; add(t0 - .18, .42, x => { const e = Math.sin(Math.PI * x / .42) ** 2, k = .02 + .3 * Math.sin(Math.PI * x / .42); lp += k * ((R() * 2 - 1) - lp); bp += .5 * (lp - bp); return amp * e * (lp - bp) * 3; }); };
  const buzz = (t0, dur, amp) => add(t0, dur, x => amp * Math.sign(Math.sin(TAU * (560 + 40 * Math.sin(x * 9)) * x)) * .4 * Math.min(1, x * 4, (dur - x) * 4));
  const scratch = (t0, dur, amp) => { let hp = 0, prev = 0; add(t0, dur, x => { const v = R() * 2 - 1; hp = .9 * (hp + v - prev); prev = v; return amp * hp * (.6 + .4 * Math.sin(x * 70)) * Math.min(1, x * 10, (dur - x) * 10); }); };
  const clink = (t0, amp) => add(t0, .25, x => amp * (Math.sin(TAU * 2600 * x) + .5 * Math.sin(TAU * 3900 * x)) * Math.exp(-x * 22));
  SCENES.slice(1).forEach(([a], i) => { if (!['cut', 'none'].includes(SCENES[i][3])) whoosh(a, .06); });
  whoosh(1.0, .08); whoosh(4.0, .08); whoosh(19.0, .06);
  boom(T_21, .2); thud(T_KOK, .2); boom(T_15, .32); thud(T_15, .22); thud(T_MANDAT, .2); thud(61.1, .15);
  buzz(29.6, 2.6, .02); scratch(59.4, .8, .04); scratch(60.3, .8, .04); clink(T_4, .05); clink(T_4 + .12, .04);
  const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 164.8, 196], [196, 246.9, 293.7]], bar = 3.6, gain = .045;
  let env = 0; const k = Math.exp(-1 / (sr * .12));
  for (let i = 0; i < n; i++) {
    const x = i / sr, ci = Math.floor(x / bar) % 4, cx = (x % bar) / bar, ch = chords[ci], att = Math.min(1, cx * 4) * Math.min(1, (1 - cx) * 6 + .35);
    let s = 0; for (const f of ch) s += Math.sin(TAU * f * x) * .5 + Math.sin(TAU * f * 1.003 * x) * .5;
    s = s / 3 * att + .6 * Math.sin(TAU * ch[0] / 2 * x) * att;
    const v = vo ? Math.abs(vo[i]) : 0; env = Math.max(v, env * k);
    out[i] += s * gain * (1 - .6 * Math.min(1, env / .12)) * Math.max(0, Math.min(1, x / 1.5, (DUR - x) / 1.5));
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
