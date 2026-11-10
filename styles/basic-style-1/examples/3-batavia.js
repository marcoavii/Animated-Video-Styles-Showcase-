// ---------- cast ----------
const PROT = { skin: '#d9a07a', hair: 'fringe', shirt: '#8a4b25', pattern: '#ecc88f' };
const COEN = { skin: '#f1c7a7', hair: 'fringe', hairCol: '#4a3220', beard: 'goatee', shirt: '#24221f', ruff: true, buttons: true };
const SOLDIER = { skin: '#f0c6a6', hair: 'fringe', hairCol: '#5a3a1e', hat: 'tricorn', shirt: '#3b5a8f', belts: true };
const TRADER = { skin: '#c98d65', hair: 'fringe', hat: 'bandana', bandana: '#7a4f2a', shirt: '#b5651d', pattern: '#f2d39b' };
const CHINA = { skin: '#efc9a2', hair: 'fringe', hat: 'skullcap', shirt: '#2f5a8a', buttons: true };
const ARAB = { skin: '#c99068', hair: 'fringe', hat: 'turban', shirt: '#efe8dc', beard: 'full', hairCol: '#2a1e16' };
const DIRS = [{ skin: '#f3ccaf', hair: 'fringe', hairCol: '#9a9a9a', hat: 'puritan', shirt: '#2a2622', ruff: true, beard: 'full' }, { skin: '#f1c7a7', hair: 'fringe', hairCol: '#6a4a2a', hat: 'puritan', shirt: '#2a2622', ruff: true }, { skin: '#f3ccaf', hair: 'fringe', hairCol: '#c9a35a', hat: 'puritan', shirt: '#2a2622', ruff: true, beard: 'goatee' }];
const BATAVI = [{ skin: '#f0c6a6', hair: 'long', hairCol: '#c9a35a', beard: 'full', shirt: '#7a5a3a', pattern: '#a88458', cloak: '#5a4a3a' }, { skin: '#eebf9c', hair: 'long', hairCol: '#8a5a2b', beard: 'full', shirt: '#6b6a3a', cloak: '#4a3a2a' }, { skin: '#f3ccaf', hair: 'long', hairCol: '#d9b46a', shirt: '#7a3b2a', pattern: '#c9a35a' }];

// ---------- captions ----------
const PHRASES = [
  [0.05, 1.7, ['!JAKARTA PERNAH DIHANCURKAN']],
  [2.12, 5.44, ['terus', '!DIBANGUN ULANG SAMA BELANDA', 'dan dikasih nama', '!BATAVIA']],
  [5.82, 6.8, ['Tapi yang menarik,']],
  [7.2, 11.66, ['nama Batavia ini', 'ternyata', '!BUKAN NAMA YANG AWALNYA', 'pengen dipakai', 'sama orang Belanda sendiri']],
  [12.14, 12.6, ['Jadi gini,']],
  [13.06, 17.14, ['sebelum namanya Batavia,', 'kawasan ini', 'dikenal sebagai', '!JAYAKARTA']],
  [17.5, 19.04, ['!LOKASINYA STRATEGIS BANGET']],
  [19.42, 23.6, ['karena jadi salah satu', '!PUSAT PERDAGANGAN', 'dan', '!PELABUHAN PENTING', 'di pesisir utara Jawa']],
  [24.06, 24.42, ['Nah,']],
  [24.62, 28.2, ['!VOC|5', 'yang waktu itu', 'lagi gencar-gencarnya', '!MEMPERLUAS KEKUASAAN,']],
  [28.38, 29.52, ['ngincer wilayah ini']],
  [29.98, 33.64, ['Sampai akhirnya', '!TAHUN 1619|32']],
  [34.04, 38.74, ['pasukan VOC', 'di bawah', '!JAN PIETERSZOON COEN|24', '!MENYERANG DAN MENGHANCURKAN', 'Jayakarta']],
  [39.3, 43.12, ['Setelah itu,', 'mereka mulai', '!MEMBANGUN KOTA BARU', 'di atas wilayah tersebut']],
  [43.62, 46.6, ['Tapi', '!BAGIAN PALING MENARIK', 'justru soal namanya']],
  [47.06, 50.26, ['Coen sebenarnya', 'pengen menamai', 'kota ini', '!NIEUW HOORN']],
  [50.6, 52.76, ['terinspirasi dari', '!KOTA ASALNYA DI BELANDA']],
  [53.24, 56.76, ['Tapi ternyata', '!PIMPINAN VOC', 'di Belanda', 'punya ide lain']],
  [57.1, 59.64, ['Mereka memilih nama', '!BATAVIA|10']],
  [59.86, 62.16, ['yang diambil dari', 'nama', '!SUKU BATAVI KUNO']],
  [62.62, 66.14, ['Akhirnya', '!BATAVIA', 'jadi', '!PUSAT KEKUASAAN VOC DI ASIA']],
  [66.58, 68.3, ['Nama ini', 'bertahan berabad-abad,']],
  [68.62, 72.64, ['sampai Jepang', 'menduduki Indonesia', '!TAHUN 1942|32']],
  [72.94, 74.78, ['dan menggantinya', 'menjadi', '!JAKARTA']],
  [75.26, 80.88, ['Jadi nama Jakarta', 'yang sekarang', 'kita pakai', 'ternyata punya', 'sejarah panjang', 'soal', '!PEREBUTAN KEKUASAAN']],
  [81.34, 83.2, ['Masih banyak cerita', 'yang belum lu tahu']],
  [83.62, 85.1, ['!FOLLOW', '!BIAR NGGAK KETINGGALAN!']],
];
export const CAPS = [];
PHRASES.forEach(([s, e, chunks], pi) => {
  const parsed = chunks.map(ch => { const hl = ch[0] === '!', [txt0, wt] = (hl ? ch.slice(1) : ch).split('|'); return { text: txt0, hl, w: (wt ? +wt : txt0.length) + 4 }; });
  const total = parsed.reduce((n, x) => n + x.w, 0); let acc = s; const next = PHRASES[pi + 1] ? PHRASES[pi + 1][0] : DUR;
  parsed.forEach((p, i) => { const d = (e - s) * p.w / total; CAPS.push({ s: acc, e: i === parsed.length - 1 ? Math.min(next, e + .6) : acc + d, text: p.text, hl: p.hl }); acc += d; });
});
const capStart = (text, from = 0) => (CAPS.find(q => q.text.startsWith(text) && q.s >= from) || { s: 0 }).s;
// key beats, read off the caption timing so visuals land on the words
const T_BATAVIA1 = capStart('BATAVIA'), T_1619 = capStart('TAHUN 1619'), T_COEN = capStart('JAN PIETERSZOON'), T_ATTACK = capStart('MENYERANG');
const T_NH = capStart('NIEUW HOORN'), T_REVEAL = capStart('BATAVIA', 57), T_1942 = capStart('TAHUN 1942'), T_JKT = capStart('JAKARTA', 72);
function drawCaption(c, t) {
  const cap = CAPS.find(q => t >= q.s && t < q.e); if (!cap) return;
  if (cap.hl) txt(c, cap.text, W / 2, 1385, { size: cap.text.length > 26 ? 52 : 60, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 9, sc: back(pr(t, cap.s, cap.s + .2)) });
  else txt(c, cap.text, W / 2, 1385, { size: 52, font: SANS, weight: 500, a: pr(t, cap.s, cap.s + .1) });
}

// ---------- camera (map scenes) ----------
const JKT = [106.83, -6.13];
const CAM = [
  [0, 110.5, -6.9, 1500, 'l'], [1.4, 106.83, -6.13, 9000, 'in'],
  [12.1, 106.83, -6.13, 9000, 'h'], [13.1, 110, -7.2, 2100, 'io'], [16.0, 107.4, -6.5, 3800, 'io'], [17.1, 106.85, -6.2, 5600, 'io'], [17.7, 109, -2.5, 1150, 'io'], [19.5, 109.3, -2.3, 1100, 'l'],
  [38.9, 106.83, -6.13, 4400, 'h'], [41.3, 106.83, -6.13, 5200, 'l'],
  [64.6, 106.83, -6.13, 3000, 'h'], [65.7, 98, 8, 520, 'io'], [68.7, 98, 8, 545, 'l'],
  [75.2, 106.83, -6.2, 26000, 'h'], [76.4, 106.83, -6.2, 15000, 'out'], [81.2, 106.83, -6.2, 16000, 'l'], [85.3, 107, -6.6, 6000, 'io'],
];
const EASE = { l: x => x, io, in: x => x * x * x, out: outC, h: () => 1 };
export function camAt(t) {
  let i = 1; while (i < CAM.length - 1 && CAM[i][0] < t) i++;
  const a = CAM[i - 1], b = CAM[i], p = EASE[b[4]](pr(t, a[0], b[0]));
  const c = { lon: lerp(a[1], b[1], p), lat: lerp(a[2], b[2], p), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)) };
  if (t > 12.1 && t < 13.1) { c.lon += Math.sin(t * 90) * .25; c.lat += Math.cos(t * 70) * .15; } // rewind jitter
  return c;
}
const projector = (cam, w, h) => { const cx = cam.lon * D2R, cy = mY(cam.lat), k = cam.k; return (lon, lat) => [w / 2 + (lon * D2R - cx) * k, h / 2 - (mY(lat) - cy) * k]; };

const ROUTES = [[102.25, 2.2, 'Malaka'], [113.3, 21.5, 'Tiongkok'], [128.2, -3.6, 'Maluku'], [119.4, -5.1, 'Makassar'], [88, 3.5, 'India']];
const NETWORK = [[129.9, 32.7, 'Jepang'], [120.2, 23.0, 'Taiwan'], [100.5, 14.4, 'Siam'], [102.25, 2.2, 'Malaka'], [128.2, -3.6, 'Maluku'], [80.2, 6.0, 'Ceylon'], [80.3, 13.4, 'Koromandel'], [72.8, 21.2, 'Surat'], [56.3, 27.2, 'Persia']];
function mapExtra(c, P, cam, w, h, st, pat, olw, t) {
  const pxDeg = cam.k * D2R;
  if (st.washes && st.washes.length) {
    c.save(); c.beginPath(); pathRings(c, LANDR, cam, w, h); c.clip('evenodd');
    for (const [lon, lat, r, col, a] of st.washes) { if (a <= 0) continue; const [x, y] = P(lon, lat); c.globalAlpha = a; c.beginPath(); c.arc(x, y, r * pxDeg, 0, TAU); c.fillStyle = col; c.fill(); c.globalAlpha = a * .8; c.lineWidth = olw; c.strokeStyle = INK; c.stroke(); }
    c.restore();
  }
  const lines = (dests, prog, a, t0) => {
    if (a <= 0) return; const [x0, y0] = P(JKT[0], JKT[1]); c.save(); c.globalAlpha = a;
    dests.forEach(([lon, lat], i) => { const p = clamp(prog * dests.length * .5 - i * .35, 0, 1); if (p <= 0) return; const [x1, y1] = P(lon, lat), mx = (x0 + x1) / 2 + (y1 - y0) * .18, my = (y0 + y1) / 2 - (x1 - x0) * .18;
      c.beginPath(); for (let k = 0; k <= 40 * p; k++) { const f = k / 40, x = (1 - f) * (1 - f) * x0 + 2 * (1 - f) * f * mx + f * f * x1, y = (1 - f) * (1 - f) * y0 + 2 * (1 - f) * f * my + f * f * y1; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.setLineDash([16, 12]); c.lineDashOffset = -t * 40; c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke(); c.setLineDash([]);
      if (p >= 1) { c.beginPath(); c.arc(x1, y1, 12, 0, TAU); c.fillStyle = YEL; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); } });
    c.restore();
  };
  lines(ROUTES, st.routes || 0, st.routesA || 0);
  lines(NETWORK, st.net || 0, st.netA || 0);
}
function mapState(t) {
  const st = { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, deep: 0, wallace: 0, plates: 0, washes: [] };
  const L = (s, lon, lat, a, o) => { if (a > 0) st.labels.push([s, lon, lat, a, o]); };
  L('Jawa', 110.2, -7.45, t < 1.4 ? win(t, 0, 1.2) : win(t, 13.2, 17.4), { size: 60 });
  L('Laut Jawa', 110, -5, win(t, 13.6, 17.4), { size: 46, italic: true });
  if (t > 38.9 && t < 41.4) st.washes.push([JKT[0], JKT[1], .45 * outC(pr(t, 39.4, 40.1)), '#e07a1f', .9]);
  if (t > 75.2) st.washes.push([106.83, -6.22, .22, RED, .55 * pr(t, 75.6, 76.3)]);
  st.routes = pr(t, 17.6, 19.3); st.routesA = win(t, 17.6, 19.6, .1, .2);
  st.net = pr(t, 65.0, 67.3); st.netA = win(t, 64.9, 68.7, .1, .2);
  if (t > 17.6 && t < 19.6) ROUTES.forEach(([lon, lat, n], i) => L(n, lon, lat + 1.4, pr(t, 18.1 + i * .17, 18.3 + i * .17), { size: 40, weight: 600 }));
  if (t > 64.6 && t < 68.7) NETWORK.forEach(([lon, lat, n], i) => L(n, lon, lat + 2.6, pr(t, 65.3 + i * .2, 65.5 + i * .2), { size: 40, weight: 600 }));
  return st;
}
function mapScene(c, t) {
  const cam = camAt(t), st = mapState(t), P = drawMap(c, W, H, cam, st, t), [jx, jy] = P(JKT[0], JKT[1]);
  // hook: old-map fast zoom onto Jayakarta
  if (t < 1.5) { txt(c, 'Jayakarta', jx, jy - 120, { size: 74, weight: 600, col: YEL, stroke: INK, sw: 6, sc: env(t, .7, 1.45) }); }
  // context: Jayakarta highlighted on the north coast
  { const a = win(t, 16.3, 17.7, .1, .2); if (a > 0) { c.save(); c.globalAlpha = a; yellowEllipse(c, jx, jy, 160, 120, 0, pr(t, 16.3, 16.7)); c.restore(); txt(c, 'Jayakarta', jx, jy - 190, { size: 80, weight: 600, col: YEL, stroke: INK, sw: 6, sc: env(t, 16.35, 17.7) }); } }
  if (t > 17.6 && t < 19.6) { c.save(); c.beginPath(); c.arc(jx, jy, 22, 0, TAU); c.fillStyle = YEL; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); txt(c, 'Jayakarta', jx, jy + 70, { size: 54, weight: 600, col: YEL, stroke: INK, sw: 5 }); }
  // VOC takes the area
  if (t > 38.9 && t < 41.4) { txt(c, 'Wilayah VOC', jx, jy - 230, { size: 76, weight: 600, col: '#fff', stroke: INK, sw: 6, sc: env(t, 39.6, 41.4) }); dutchFlagPin(c, jx, jy - 20, t, env(t, 39.4, 41.4)); }
  // Asia network
  if (t > 64.6 && t < 68.7) { c.save(); c.beginPath(); c.arc(jx, jy, 20, 0, TAU); c.fillStyle = '#e07a1f'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); txt(c, 'Batavia', jx, jy + 62, { size: 58, weight: 600, col: YEL, stroke: INK, sw: 5, sc: env(t, 64.8, 68.7) });
    const a = win(t, 66.5, 68.7, .2, .2); if (a > 0) { const y = Math.round(lerp(1621, 1942, io(pr(t, 66.6, 68.5)))); txt(c, String(y), W / 2, 330, { size: 170, a }); txt(c, 'nama Batavia bertahan', W / 2, 445, { size: 50, italic: true, a }); } }
  // modern Jakarta
  if (t > 75.2) {
    const [mx, my] = P(106.827, -6.175); monas(c, mx, my, 430, env(t, 75.7));
    txt(c, 'JAKARTA', W / 2, 330, { size: 140, font: SANS, weight: 700, col: '#fff', stroke: INK, sw: 10, sc: env(t, 75.5, 81.3) });
    const s = env(t, 78.0, 81.3); if (s > 0) { const names = ['Jayakarta', 'Batavia', 'Jakarta'], cols = ['#8a6a3a', '#e07a1f', RED]; names.forEach((n, i) => { const si = env(t, 78.0 + i * .45, 81.3); if (si <= 0) return; const x = 190 + i * 350, y = 1590; c.save(); c.translate(x, y); c.scale(si, si); c.fillStyle = cols[i]; c.beginPath(); c.roundRect(-150, -48, 300, 96, 48); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); txt(c, n, x, y + 2, { size: 50, weight: 600, sc: si }); if (i) arrow(c, x - 205, y, x - 158, y, 18, '#fff', si); }); }
  }
  if (t > 81.2) { const y = lerp(2500, 1960, outC(pr(t, 81.3, 81.55))); drawChar(c, 260, y, 820, { ...PROT, expr: t > 84.2 ? 'happy' : 'smug' }); followUI(c, t, 83.6); }
}
function dutchFlagPin(c, x, y, t, sc) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(sc, sc); c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -150); c.stroke(); dutchFlag(c, 0, -150, 110, 66, t); c.lineWidth = 3; c.strokeRect(0, -150, 110, 66); c.restore(); }
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

// ---------- plate scenes ----------
const TOWN_STILT = [[90, 1330, 300], [330, 1300, 260], [560, 1340, 320], [800, 1310, 270], [1010, 1335, 300], [210, 1470, 330], [690, 1480, 350], [940, 1460, 320]];
const TOWN_DUTCH = [[60, 1290, 330], [200, 1270, 360], [340, 1290, 320], [480, 1265, 370], [620, 1290, 330], [760, 1270, 360], [900, 1290, 320], [1040, 1270, 350]];
function cityBack(c, t, mood) {
  const g = c.createLinearGradient(0, 0, 0, 1300);
  if (mood === 'fire') { g.addColorStop(0, '#3a1d18'); g.addColorStop(.6, '#a2401f'); g.addColorStop(1, '#f08a3a'); } else if (mood === 'grey') { g.addColorStop(0, '#5c6672'); g.addColorStop(1, '#b8bcbe'); } else { g.addColorStop(0, '#78acd6'); g.addColorStop(1, '#e4eef2'); }
  c.fillStyle = g; c.fillRect(-80, -80, W + 160, 1400);
  if (mood !== 'fire') plateSky(c, mood === 'grey' ? '#5c6672' : '#78acd6', mood === 'grey' ? '#b8bcbe' : '#e4eef2', 1300, t);
  hills(c, 1150, mood === 'fire' ? '#5a2a1a' : '#7e9aa3', 70, .005, 1.3);
}
function burningTown(c, t, a = 1, extra = 0) {
  cityBack(c, t, 'fire'); c.fillStyle = '#4a3a22'; c.fillRect(-80, 1300, W + 160, H);
  palm(c, 980, 1180, 330, t); palm(c, 120, 1200, 300, t + 1);
  TOWN_STILT.forEach(([x, y, s], i) => { stiltHouse(c, x, y, s, .8); });
  TOWN_STILT.forEach(([x, y, s], i) => { flame(c, x + (i % 2 ? 30 : -20), y - s * .55, s * .55, t, i); smoke(c, x, y - s * 1.0, s * .35, t, i, .9); });
  embers(c, t, .9);
  for (let k = 0; k < extra; k++) { const p = ((t * 1.3 + k * .37) % 1), x = lerp(W + 50, 300 + k * 150, p), y = lerp(700, 1250, p) - Math.sin(p * Math.PI) * 220; c.beginPath(); c.arc(x, y, 16, 0, TAU); c.fillStyle = '#1b1b1b'; c.fill(); }
  const fl = Math.max(0, Math.sin(t * 17)) * .12 * a; c.fillStyle = `rgba(255,140,40,${fl})`; c.fillRect(0, 0, W, H);
}
function bataviaTown(c, t, rise = 1, mood) {
  cityBack(c, t, mood); c.fillStyle = mood === 'grey' ? '#7a7c74' : '#8c9a6a'; c.fillRect(-80, 1300, W + 160, H);
  TOWN_DUTCH.forEach(([x, y, s], i) => { const r = clamp(rise * TOWN_DUTCH.length - i, 0, 1); dutchHouse(c, x, y + (1 - outC(r)) * 500, s, i, r > 0 ? 1 : 0); });
  canal(c, 1330, 1520, t); c.fillStyle = mood === 'grey' ? '#6e7068' : '#a39a82'; c.fillRect(-80, 1534, W + 160, H);
}
function hookCity(c, t) { // 1.4–12.1
  if (t < 3.0) burningTown(c, t);
  else { const p = pr(t, 3.0, 4.2); if (p < 1) { burningTown(c, t, 1 - p); c.save(); c.beginPath(); c.arc(W / 2, 1300, p * 1700, 0, TAU); c.clip(); bataviaTown(c, t, p); c.restore(); } else bataviaTown(c, t, 1); }
  // name morph JAYAKARTA -> BATAVIA
  const mp = pr(t, T_BATAVIA1 - .35, T_BATAVIA1 + .35); morphText(c, 'JAYAKARTA', 'BATAVIA', W / 2, 400, mp, { size: 130 });
  if (t > 1.4 && t < 3.0) txt(c, 'abad ke-17', W / 2, 520, { size: 52, italic: true, a: win(t, 1.6, 3.0) });
  // the twist teaser: narrator not sure about the name
  if (t > 7.0) { const y = lerp(2500, 1960, outC(pr(t, 7.1, 7.35))) + lerp(0, 900, io(pr(t, 11.8, 12.1))); drawChar(c, 760, y, 900, { ...PROT, expr: t > 9.4 ? 'worried' : 'smug' }); drawGlove(c, 420, y - 820 + Math.sin(t * 6) * 8, 150, .25); questionMark(c, 900, 620, 220, env(t, 9.4, 12.05)); }
}
function portScene(c, t) { // 19.4–23.9
  plateSky(c, '#7fb0d8', '#eaf0ef', 880, t); plateSea(c, 880, 1150, t); hills(c, 885, '#7e9aa3', 40, .009, 2);
  junk(c, 230, 1060, 300, t, env(t, 19.5)); ship(c, 760, 1050, 240, t, env(t, 19.6));
  woodFloor(c, 1150, '#9a6a3c', '#6a4424');
  drawChar(c, 230, 1660, 420, { ...CHINA, expr: 'happy' }, env(t, 19.7)); drawChar(c, 540, 1690, 440, { ...TRADER, expr: 'happy' }, env(t, 19.85)); drawChar(c, 850, 1660, 420, { ...ARAB, flip: true }, env(t, 20.0));
  sack(c, 390, 1760, 170, false, env(t, 20.3)); jar(c, 700, 1770, 150); sack(c, 990, 1790, 150, false, env(t, 20.5));
  for (let i = 0; i < 5; i++) { const p = pr(t, 20.6 + i * .45, 21.2 + i * .45); if (p > 0 && p < 1) coin(c, lerp(i % 2 ? 300 : 800, 540, p), 1200 - Math.sin(p * Math.PI) * 220, 28); }
  txt(c, 'Pelabuhan Jayakarta', W / 2, 300, { size: 80, weight: 600, sc: env(t, 19.6) });
}
function arrivalScene(c, t) { // 23.9–32.6
  plateSky(c, '#7fb0d8', '#eaf0ef', 900, t); plateSea(c, 900, H, t);
  c.fillStyle = '#c9b27a'; c.beginPath(); c.moveTo(-80, 1000); c.quadraticCurveTo(250, 940, 520, 1010); c.lineTo(-80, 1100); c.closePath(); c.fill();
  palm(c, 60, 990, 200, t); palm(c, 420, 1000, 170, t + 2); [[150, 985, 160], [300, 975, 150]].forEach(([x, y, s]) => stiltHouse(c, x, y, s));
  for (const [i, x1, y0, s] of [[2, 900, 1060, 230], [0, 640, 1180, 300], [1, 860, 1400, 380]]) { const x = lerp(1450 + i * 120, x1, outC(pr(t, 24.0 + i * .3, 27.5 + i * .3))) - (t - 24) * 6; ship(c, x, y0, s, t, 1, i * 1.3); }
  woodFloor(c, 1740, '#8a5a32', '#5a3a1e');
  for (let i = 0; i < 4; i++) drawChar(c, 150 + i * 150, 1850, 290, { ...SOLDIER, expr: i === 2 ? 'smug' : 'neutral' }, env(t, 26.4 + i * .1));
  const a = win(t, 28.4, 31.2, .15, .3); if (a > 0) { const x = 230, y = 940, r = 120 + 30 * Math.sin(t * 6); c.save(); c.globalAlpha = a; c.lineWidth = 9; c.strokeStyle = YEL; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { c.beginPath(); c.moveTo(x + dx * r * .6, y + dy * r * .6); c.lineTo(x + dx * r * 1.3, y + dy * r * 1.3); c.stroke(); } c.restore(); }
  const s = env(t, T_1619, 32.7, .3, .1); if (s > 0) bigText(c, '1619', W / 2, 470, { size: 240, stroke: INK, sw: 12, sc: s * (1 + 1.3 * (1 - outC(pr(t, T_1619, T_1619 + .25)))) });
}
function coenScene(c, t) { // 32.6–36.7 zoom in on Coen
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a1f1f'); g.addColorStop(1, '#1d1212'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(120,30,30,.5)'; for (let x = 0; x < W; x += 90) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 45, H / 2, x, H); c.lineTo(x + 40, H); c.quadraticCurveTo(x + 85, H / 2, x + 40, 0); c.fill(); }
  const lg = c.createRadialGradient(W / 2, 800, 50, W / 2, 800, 800); lg.addColorStop(0, 'rgba(255,220,160,.35)'); lg.addColorStop(1, 'rgba(255,220,160,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H);
  dutchFlag(c, 760, 560, 220, 136, t); c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(760, 560, 220, 136);
  const z = lerp(780, 1150, io(pr(t, 32.6, 35.4))); drawChar(c, W / 2, 1720 + (z - 780) * .55, z, { ...COEN, expr: 'smug' });
  const s = env(t, T_COEN - .05, 36.8); if (s > 0) { c.save(); c.translate(W / 2, 330); c.scale(s, s); c.fillStyle = 'rgba(20,12,10,.75)'; c.beginPath(); c.roundRect(-430, -95, 860, 190, 30); c.fill(); c.restore(); txt(c, 'Jan Pieterszoon Coen', W / 2, 300, { size: 72, weight: 600, sc: s }); txt(c, 'Gubernur Jenderal VOC', W / 2, 370, { size: 46, italic: true, col: YEL, sc: s }); }
}
function attackScene(c, t) { burningTown(c, t, 1, 3); }
function buildScene(c, t) { bataviaTown(c, t, pr(t, 41.4, 43.0)); txt(c, 'Kota baru', W / 2, 360, { size: 90, weight: 600, sc: env(t, 41.6) }); }
function deskScene(c, t) { // 43.6–53.0
  c.fillStyle = '#4a3322'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < W; x += 140) c.fillRect(x, 0, 8, 1150);
  c.save(); c.fillStyle = '#88a8c4'; c.fillRect(640, 160, 320, 380); c.lineWidth = 12; c.strokeStyle = '#2b1d12'; c.strokeRect(640, 160, 320, 380); c.beginPath(); c.moveTo(800, 160); c.lineTo(800, 540); c.moveTo(640, 350); c.lineTo(960, 350); c.stroke(); c.restore();
  drawChar(c, 340, 1300, 820, { ...COEN, expr: t > T_NH + .9 ? 'happy' : 'neutral' });
  woodFloor(c, 1150, '#8a5a32', '#4e301a');
  // city plan on the desk
  c.save(); c.translate(270, 1560); c.rotate(-.08); c.fillStyle = '#e8d6a8'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 14; c.fillRect(-200, -170, 400, 340); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(-200, -170, 400, 340);
  c.strokeStyle = '#4c7a9a'; c.lineWidth = 9; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(-180, k * 90); c.lineTo(180, k * 90); c.stroke(); c.beginPath(); c.moveTo(k * 110, -150); c.lineTo(k * 110, 150); c.stroke(); } c.strokeStyle = '#7a5a3a'; c.lineWidth = 3; c.strokeRect(-170, -150, 340, 300); c.restore();
  // blank sheet, then "Nieuw Hoorn" handwritten
  c.save(); c.translate(720, 1580); c.rotate(.04); c.fillStyle = '#f7f0dc'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 14; c.fillRect(-250, -180, 500, 360); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(-250, -180, 500, 360);
  const wp = pr(t, T_NH - .3, T_NH + .9); c.font = `italic 600 92px ${SERIF}`; c.textAlign = 'left'; c.textBaseline = 'middle'; const tw = c.measureText('Nieuw Hoorn').width; c.save(); c.beginPath(); c.rect(-tw / 2 - 10, -100, (tw + 20) * wp, 200); c.clip(); c.fillStyle = '#1b2a5a'; c.fillText('Nieuw Hoorn', -tw / 2, 0); c.restore();
  const px = -tw / 2 + tw * wp; c.restore();
  if (wp > 0 && wp < 1) { const x = 720 + px, y = 1580 + Math.sin(t * 30) * 8; c.save(); c.strokeStyle = '#f3ead5'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y - 170); c.stroke(); c.restore(); drawGlove(c, x + 55, y - 70, 110, .5); }
  // candle
  c.fillStyle = '#efe6d0'; c.fillRect(980, 1290, 50, 150); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(980, 1290, 50, 150); flame(c, 1005, 1292, 60, t, 3);
  // Hoorn thought bubble
  const s = env(t, 50.7, 53.1); if (s > 0) bubble(c, 680, 520, 330, 250, 470, 760, s, (cc, bx, by, bw, bh) => { const g2 = cc.createLinearGradient(0, by, 0, by + bh); g2.addColorStop(0, '#9cc4e4'); g2.addColorStop(1, '#e8f0f2'); cc.fillStyle = g2; cc.fillRect(bx, by, bw, bh); cc.fillStyle = '#7d9a5a'; cc.fillRect(bx, by + bh * .68, bw, bh); [[0, .78], [1, .78], [2, .78], [3, .78]].forEach(([i]) => dutchHouse(cc, bx + bw * (.3 + i * .12), by + bh * .72, 170, i + 1)); windmill(cc, bx + bw * .78, by + bh * .72, 230, t); txt(cc, 'Hoorn, Belanda', bx + bw / 2, by + bh * .84, { size: 46, weight: 600 }); });
}
function decisionScene(c, t) { // 53.0–59.8
  const pushZ = 1 + .08 * io(pr(t, 57.1, T_REVEAL)); c.save(); c.translate(W / 2, 1200); c.scale(pushZ, pushZ); c.translate(-W / 2, -1200);
  c.fillStyle = '#5a3e2a'; c.fillRect(-100, -100, W + 200, H + 200); c.fillStyle = 'rgba(0,0,0,.22)'; for (let x = 0; x < W; x += 150) c.fillRect(x, 0, 8, 1000);
  vocLogo(c, W / 2, 300, 200, { ink: '#e8d6a8' });
  DIRS.forEach((d, i) => drawChar(c, 200 + i * 340, 1060, 420, { ...d, expr: i === 1 ? 'smug' : 'neutral' }, env(t, 53.1 + i * .12)));
  txt(c, 'Heeren XVII · pimpinan VOC', W / 2, 120, { size: 50, italic: true, col: YEL, sc: env(t, capStart('PIMPINAN VOC')) });
  woodFloor(c, 980, '#7a4e2c', '#3e2614');
  c.save(); c.translate(W / 2, 1450); c.fillStyle = '#f3e7c9'; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 24; c.fillRect(-360, -330, 720, 660); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = '#5a4630'; c.strokeRect(-340, -310, 680, 620);
  c.fillStyle = '#2b2018'; c.font = `600 54px ${SERIF}`; c.textAlign = 'center'; c.fillText('KEPUTUSAN', 0, -230); c.font = `italic 500 34px ${SERIF}`; c.fillText('nama kota baru:', 0, -170);
  c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-260, 170 + i * 44); c.lineTo(260, 170 + i * 44); c.stroke(); } c.restore();
  // Coen's proposal pinned to the side, struck through at the reveal
  c.save(); c.translate(900, 1130); c.rotate(.12); c.fillStyle = '#f7f0dc'; c.fillRect(-140, -70, 280, 140); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(-140, -70, 280, 140); c.fillStyle = '#1b2a5a'; c.font = `italic 600 44px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Nieuw Hoorn', 0, 0);
  const xp = pr(t, T_REVEAL + .3, T_REVEAL + .6); if (xp > 0) { c.strokeStyle = '#c8302a'; c.lineWidth = 9; c.beginPath(); c.moveTo(-120, -10); c.lineTo(-120 + 240 * xp, -10 + 20 * xp); c.stroke(); } c.restore();
  c.restore();
  // the pause before the reveal: dim and hush
  const dim = win(t, 57.1, T_REVEAL + .05, .5, .05) * .55; if (dim > 0) { c.fillStyle = `rgba(0,0,0,${dim})`; c.fillRect(0, 0, W, H); }
  // BATAVIA stamp
  const sp = pr(t, T_REVEAL, T_REVEAL + .18); if (sp > 0) { const sc = lerp(3, 1, outC(sp)); c.save(); c.translate(W / 2, 1460); c.rotate(-.12); c.scale(sc, sc); c.globalAlpha = Math.min(1, sp * 2); c.lineWidth = 12; c.strokeStyle = '#b3201a'; c.beginPath(); c.roundRect(-330, -105, 660, 210, 24); c.stroke(); c.font = `700 150px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#b3201a'; c.fillText('BATAVIA', 0, 8); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .25; c.fillStyle = c.createPattern(TEX, 'repeat'); c.fillRect(-340, -115, 680, 230); c.restore(); }
  { const q = pr(t, T_REVEAL + .1, T_REVEAL + .9); if (q > 0 && q < 1) { c.save(); c.globalAlpha = 1 - q; c.strokeStyle = '#e8d6a8'; c.lineWidth = 10; c.beginPath(); c.ellipse(W / 2, 1460, 360 + q * 300, 130 + q * 120, 0, 0, TAU); c.stroke(); c.restore(); } }
}
function bataviScene(c, t) { // 59.8–62.6 the ancient Batavi
  plateSky(c, '#8fb3cf', '#e2e8e4', 1000, t); hills(c, 1000, '#4f6b45', 120, .006, 4); hills(c, 1080, '#3f5a38', 80, .01, 1);
  c.fillStyle = '#5f8ea0'; c.beginPath(); c.moveTo(-80, 1120); c.quadraticCurveTo(540, 1060, W + 80, 1150); c.lineTo(W + 80, 1260); c.quadraticCurveTo(540, 1180, -80, 1250); c.closePath(); c.fill();
  c.fillStyle = '#6b7a3c'; c.fillRect(-80, 1250, W + 160, H);
  BATAVI.forEach((b, i) => { const x = 230 + i * 310, y = 1700 + (i === 1 ? 40 : 0); drawChar(c, x, y, 470, { ...b, expr: i === 1 ? 'smug' : 'neutral' }, env(t, 59.9 + i * .12)); if (i !== 2) shield(c, x + 170, y - 140, 230, .15); c.save(); c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(x - 190, y + 10); c.lineTo(x - 140, y - 520); c.stroke(); c.fillStyle = '#9aa0a6'; c.beginPath(); c.moveTo(x - 140, y - 520); c.lineTo(x - 160, y - 470); c.lineTo(x - 125, y - 475); c.closePath(); c.fill(); c.stroke(); c.restore(); });
  txt(c, 'Suku Batavi', W / 2, 330, { size: 100, weight: 600, sc: env(t, 60.0) }); txt(c, 'di delta Sungai Rhein', W / 2, 440, { size: 52, italic: true, sc: env(t, 60.3) });
}
function bataviaGrown(c, t) { // 62.6–64.6
  cityBack(c, t); c.fillStyle = '#8c9a6a'; c.fillRect(-80, 1300, W + 160, H);
  TOWN_DUTCH.forEach(([x, y, s], i) => { if (i === 3 || i === 4) return; dutchHouse(c, x, y - 40, s * .9, i); });
  stadhuis(c, W / 2, 1300, 560, t, env(t, 62.7));
  canal(c, 1330, 1520, t); c.fillStyle = '#a39a82'; c.fillRect(-80, 1534, W + 160, H);
  ship(c, lerp(-200, 260, outC(pr(t, 62.6, 64))), 1470, 220, t); drawChar(c, 820, 1780, 300, { ...TRADER, expr: 'happy' }, env(t, 62.9)); drawChar(c, 980, 1790, 300, { ...SOLDIER }, env(t, 63.0));
  txt(c, 'Batavia', W / 2, 360, { size: 120, weight: 600, col: YEL, stroke: INK, sw: 8, sc: env(t, 62.7) });
}
function occupation(c, t) { // 68.6–75.2
  cityBack(c, t, 'grey'); c.fillStyle = '#7a7c74'; c.fillRect(-80, 1300, W + 160, H);
  stadhuis(c, W / 2, 1360, 560, t, 1, t < 69.95 ? 'nl' : 'jp', t < 69.95 ? io(pr(t, 69.0, 69.9)) * 2.4 : 2.4 - io(pr(t, 70.0, 70.7)) * 2.4);
  c.fillStyle = '#6e7068'; c.fillRect(-80, 1500, W + 160, H);
  const s = env(t, T_1942, 75.3, .3, .1); if (s > 0) bigText(c, '1942', W / 2, 1660, { size: 200, stroke: INK, sw: 10, sc: s * (1 + 1.3 * (1 - outC(pr(t, T_1942, T_1942 + .25)))) });
  morphText(c, 'BATAVIA', 'JAKARTA', W / 2, 300, pr(t, T_JKT - .45, T_JKT + .35), { size: 150, colA: '#f2e9d8', colB: YEL });
  txt(c, 'Pendudukan Jepang', W / 2, 450, { size: 56, italic: true, a: win(t, 69.2, 73.4) });
}

// ---------- scene list & transitions ----------
const SCENES = [
  [0, 1.4, mapScene, 'zoom'], [1.4, 12.1, hookCity, 'cut'], [12.1, 19.45, mapScene, 'whip'], [19.45, 23.9, portScene, 'zoom'],
  [23.9, 32.65, arrivalScene, 'whip'], [32.65, T_ATTACK, coenScene, 'zoom'], [T_ATTACK, 38.9, attackScene, 'whip'], [38.9, 41.3, mapScene, 'zoom'],
  [41.3, 43.6, buildScene, 'whip'], [43.6, 53.05, deskScene, 'whip'], [53.05, 59.85, decisionScene, 'zoom'], [59.85, 62.6, bataviScene, 'zoom'],
  [62.6, 64.6, bataviaGrown, 'zoom'], [64.6, 68.65, mapScene, 'zoom'], [68.65, 75.2, occupation, 'zoom'], [75.2, 99, mapScene, 'none'],
];
const SHAKES = [[T_1619, T_1619 + .5, 16], [T_REVEAL, T_REVEAL + .55, 22], [T_1942, T_1942 + .5, 16], [T_ATTACK, 38.8, 5]];
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

// ---------- sound effects (mixed under the VO) ----------
export function sfx(sr, n) {
  const out = new Float32Array(n), R = rng(77);
  const add = (t0, dur, f) => { const i0 = Math.max(0, Math.floor(t0 * sr)), i1 = Math.min(n, Math.floor((t0 + dur) * sr)); for (let i = i0; i < i1; i++) out[i] += f((i - i0) / sr); };
  const boom = (t0, amp) => { let ph = 0; add(t0, 1.6, x => { const f = lerp(70, 34, Math.min(1, x / .6)); ph += TAU * f / sr; return amp * Math.sin(ph) * Math.exp(-x * 2.6); }); let lp = 0; add(t0, .25, x => { lp += .25 * ((R() * 2 - 1) - lp); return amp * .9 * lp * Math.exp(-x * 18); }); };
  const thud = (t0, amp) => { let ph = 0; add(t0, .35, x => { ph += TAU * lerp(140, 60, x / .35) / sr; return amp * Math.sin(ph) * Math.exp(-x * 11); }); let lp = 0; add(t0, .06, x => { lp += .5 * ((R() * 2 - 1) - lp); return amp * .7 * lp * Math.exp(-x * 60); }); };
  const whoosh = (t0, amp) => { let lp = 0, bp = 0; add(t0 - .18, .42, x => { const e = Math.sin(Math.PI * x / .42) ** 2, k = .02 + .3 * Math.sin(Math.PI * x / .42); lp += k * ((R() * 2 - 1) - lp); bp += .5 * (lp - bp); return amp * e * (lp - bp) * 3; }); };
  const crackle = (t0, dur, amp) => { let lp = 0; add(t0, dur, x => { lp += .03 * ((R() * 2 - 1) - lp); const pop = R() < .0009 ? (R() * 2 - 1) * 4 : 0; return amp * (lp * 2.5 + pop * .3) * Math.min(1, x * 4, (dur - x) * 4); }); };
  const scratch = (t0, dur, amp) => { let hp = 0, prev = 0; add(t0, dur, x => { const v = R() * 2 - 1; hp = .9 * (hp + v - prev); prev = v; return amp * hp * (.6 + .4 * Math.sin(x * 70)) * Math.min(1, x * 10, (dur - x) * 10); }); };
  SCENES.slice(1).forEach(([a], i) => { if (!['cut', 'none'].includes(SCENES[i][3])) whoosh(a, .08); });
  whoosh(1.0, .1); whoosh(12.4, .1);
  crackle(1.4, 1.8, .07); crackle(T_ATTACK, 38.9 - T_ATTACK, .07);
  [T_ATTACK + .15, T_ATTACK + .75, T_ATTACK + 1.35].forEach(t0 => boom(t0, .22));
  boom(T_1619, .4); thud(T_1619, .25); boom(T_1942, .4); thud(T_1942, .25);
  boom(T_REVEAL, .55); thud(T_REVEAL, .45);
  thud(T_BATAVIA1, .25); thud(T_JKT, .25);
  scratch(T_NH - .3, 1.2, .045);
  return out;
}

// ---------- compositing ----------
let ACC = null, TMP = null;
const isMap = t => { const i = sceneAt(t); return i >= 0 && SCENES[i][2] === mapScene; };
function camSpeed(t) { const a = camAt(t), b = camAt(t - 1 / FPS); return Math.abs((a.lon - b.lon) * D2R * a.k) + Math.abs((mY(a.lat) - mY(b.lat)) * a.k) + Math.abs(Math.log(a.k / b.k)) * 900; }
export function renderFrame(c, t) {
  if (!ACC) { ACC = cv(W, H); TMP = cv(W, H); }
  const sp = isMap(t) && isMap(t - 1 / FPS) ? camSpeed(t) : 0;
  let sh = 0; for (const [a, b, amp] of SHAKES) if (t > a && t < b) sh = Math.max(sh, amp * (1 - pr(t, a, b)));
  c.save(); if (sh > 0) { c.translate(W / 2 + Math.sin(t * 97) * sh, H / 2 + Math.cos(t * 83) * sh); c.scale(1.04, 1.04); c.translate(-W / 2, -H / 2); }
  if (sp > 22) { const n = sp > 70 ? 5 : 3, a = ACC.getContext('2d'); for (let i = 0; i < n; i++) { drawScene(a, t - i / FPS / n * 1.2); c.globalAlpha = 1 / (i + 1); c.drawImage(ACC, 0, 0); } c.globalAlpha = 1; }
  else drawScene(c, t);
  c.restore();
  const tg = TMP.getContext('2d'), rw = win(t, 12.1, 13.15, .1, .25);
  if (rw > 0) { tg.clearRect(0, 0, W, H); tg.drawImage(c.canvas, 0, 0); c.save(); c.filter = `sepia(${.75 * rw}) blur(${2.2 * rw}px) brightness(${1 - .12 * rw})`; c.drawImage(TMP, 0, 0); c.restore(); }
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .2; c.fillStyle = c.createPattern(TEX, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
  const vg = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${.32 + .3 * rw})`); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  chevrons(c, -1, rw, t);
  drawCaption(c, t);
}
