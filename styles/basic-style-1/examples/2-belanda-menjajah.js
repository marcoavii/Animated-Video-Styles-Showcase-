// ---------- cast ----------
const PROT = { skin: '#d9a07a', hair: 'fringe', shirt: '#8a4b25', pattern: '#ecc88f' };
const MERCHANT = { skin: '#f3ccaf', hair: 'fringe', hairCol: '#7a4a22', hat: 'puritan', shirt: '#2a2622', ruff: true };
const SOLDIER = { skin: '#f0c6a6', hair: 'fringe', hairCol: '#5a3a1e', hat: 'tricorn', shirt: '#3b5a8f', belts: true };
const TRADER = { skin: '#c98d65', hair: 'fringe', hat: 'bandana', bandana: '#7a4f2a', shirt: '#b5651d', pattern: '#f2d39b' };
const RAJA = { skin: '#c98d65', hair: 'fringe', hat: 'destar', shirt: '#c9a227', pattern: '#7a3b12', sash: '#8e1b1b' };
const OFFICIAL = { skin: '#f3ccaf', hair: 'fringe', hairCol: '#9a9a9a', hat: 'tophat', shirt: '#24262e', buttons: true };
const HEROES = [
  { who: { skin: '#7b492e', hair: 'curly', hat: 'bandana', bandana: '#c8302a', shirt: '#efe8dc', expr: 'angry' }, lon: 128.65, lat: -3.55, name: 'Maluku', yr: '1817' },
  { who: { skin: '#c98d65', hair: 'fringe', hat: 'turban', shirt: '#f4f0e6', sash: '#2e6b4f', expr: 'angry' }, lon: 110.4, lat: -7.8, name: 'Jawa', yr: '1825–1830' },
  { who: { skin: '#c98d65', hair: 'fringe', hat: 'turban', turban: '#ffffff', shirt: '#fbfbf8', sash: '#7a4f2a', expr: 'angry' }, lon: 100.4, lat: -.7, name: 'Sumatra Barat', yr: '1803–1838' },
  { who: { skin: '#d9a07a', hat: 'hijab', hijab: '#2f2a2a', shirt: '#3b3433', expr: 'angry' }, lon: 96.3, lat: 4.6, name: 'Aceh', yr: '1873–1904' },
];
const KINGDOMS = [
  ['Aceh', 96.6, 4.4, 3.2, '#3f7d4a'], ['Palembang', 104.4, -3.0, 3.0, '#8c5a9e'], ['Banten', 106.1, -6.5, 1.5, '#d4a52a'], ['Mataram', 110.6, -7.6, 2.8, '#2f8f8a'],
  ['Banjar', 114.9, -2.6, 3.4, '#a0522d'], ['Gowa', 119.7, -4.8, 2.4, '#5e6fb0'], ['Ternate', 127.4, 1.0, 1.7, '#c95f7d'], ['Tidore', 128.3, -.7, 1.9, '#7aa33a'],
];
// Dutch holdings in the order they were taken (lon, lat, radius°, year)
const DUTCH_EARLY = [[106.8, -6.3, .9, 41.9], [128.2, -3.7, 1.3, 58.3], [129.9, -4.5, .7, 58.5], [119.5, -5.1, 1.2, 58.7], [108.6, -6.8, 1.3, 58.9], [110.9, -6.9, 1.3, 59.1], [112.8, -7.2, 1.3, 59.3]];
const DUTCH_LATE = [[104.4, -3.0, 2.2, 1825], [110.3, -7.5, 3.4, 1830], [100.5, -.8, 2.3, 1838], [114.5, -1.5, 4.6, 1860], [120.6, -2.6, 3.6, 1870], [96.5, 4.3, 2.6, 1904], [121, -8.7, 2.8, 1907], [115.2, -8.4, .9, 1908], [138.5, -4.5, 4.6, 1920]];
const yearT = y => 61.9 + (y - 1619) / (1920 - 1619) * 6.5;

// ---------- captions with highlight words ----------
const PHRASES = [
  [0.05, 4.0, ['Katanya', '!BELANDA MENJAJAH INDONESIA', 'selama', '!350 TAHUN|27']],
  [4.66, 5.16, ['Tapi bentar,']],
  [5.76, 8.1, ['emang Belanda', 'langsung menguasai', '!SELURUH NUSANTARA?']],
  [8.6, 9.5, ['!NGGAK JUGA!']],
  [10.14, 10.64, ['Jadi gini.']],
  [10.94, 13.36, ['!TAHUN 1602|27']],
  [13.58, 15.48, ['Belanda mendirikan', '!VOC|8']],
  [15.9, 17.88, ['!PERUSAHAAN DAGANG', 'dengan', '!HAK ISTIMEWA']],
  [18.48, 19.86, ['Mereka bukan', 'cuma berdagang,']],
  [20.18, 21.88, ['tapi juga bisa', 'bikin perjanjian,']],
  [22.06, 22.98, ['membangun benteng,']],
  [23.22, 24.74, ['bahkan', '!PUNYA TENTARA SENDIRI']],
  [25.2, 28.76, ['Awalnya,', 'mereka datang', 'buat menguasai', '!PERDAGANGAN REMPAH-REMPAH']],
  [29.3, 30.02, ['Masalahnya,']],
  [30.32, 33.04, ['Nusantara waktu itu', 'terdiri dari', '!BANYAK KERAJAAN,']],
  [33.26, 34.52, ['dengan kepentingan', 'berbeda.']],
  [35.2, 37.08, ['VOC memanfaatkan', '!MONOPOLI,']],
  [37.28, 40.32, ['!KEKUATAN MILITER,', 'dan', '!PERJANJIAN', 'dengan penguasa lokal']],
  [40.88, 42.56, ['Tahun 1619,|32']],
  [42.74, 44.94, ['!BATAVIA', 'jadi pusat', 'kekuasaan mereka']],
  [45.42, 45.8, ['Nah,']],
  [45.98, 47.16, ['ini bagian', 'menariknya']],
  [47.68, 51.66, ['!VOC BANGKRUT', 'dan dibubarkan', '!PADA 1799|47']],
  [52.16, 54.36, ['Tapi', '!KEKUASAAN BELANDA', '!NGGAK IKUT BUBAR']],
  [54.84, 57.7, ['Aset dan wilayahnya', 'diambil alih', 'pemerintah Belanda,']],
  [58.0, 61.34, ['lalu', '!EKSPANSI KOLONIAL', 'berlanjut lewat', '!PERANG DAN PENAKLUKAN']],
  [61.7, 65.06, ['Jadi, Belanda', 'nggak menaklukkan', 'Indonesia', '!DALAM SATU PERANG']],
  [65.48, 68.52, ['Kekuasaan itu', 'dibangun pelan-pelan', 'selama', '!BERABAD-ABAD']],
  [68.88, 71.04, ['sementara', 'banyak daerah', '!TERUS MELAWAN']],
  [71.52, 77.04, ['Indonesia', 'memproklamasikan', 'kemerdekaan', 'pada', '!17 AGUSTUS 1945|51']],
  [77.42, 82.96, ['dan Belanda', 'menyerahkan', 'kedaulatan', 'pada', '!27 DESEMBER 1949|60']],
  [83.38, 88.22, ['Jadi, cerita', '!350 TAHUN|27', 'itu', '!NGGAK SESEDERHANA', 'yang sering', 'kita dengar']],
  [88.7, 90.56, ['Masih banyak cerita', 'yang belum lu tahu']],
  [90.98, 92.5, ['!FOLLOW', '!BIAR NGGAK KETINGGALAN!']],
];
export const CAPS = [];
PHRASES.forEach(([s, e, chunks], pi) => {
  const parsed = chunks.map(ch => { const hl = ch[0] === '!', [txt0, wt] = (hl ? ch.slice(1) : ch).split('|'); return { text: txt0, hl, w: (wt ? +wt : txt0.length) + 4 }; });
  const total = parsed.reduce((n, x) => n + x.w, 0); let acc = s; const next = PHRASES[pi + 1] ? PHRASES[pi + 1][0] : DUR;
  parsed.forEach((p, i) => { const d = (e - s) * p.w / total; CAPS.push({ s: acc, e: i === parsed.length - 1 ? Math.min(next, e + .6) : acc + d, text: p.text, hl: p.hl }); acc += d; });
});
const capStart = (text, from = 0) => (CAPS.find(q => q.text.startsWith(text) && q.s >= from) || { s: 0 }).s;
function drawCaption(c, t) {
  const cap = CAPS.find(q => t >= q.s && t < q.e); if (!cap) return;
  if (cap.hl) txt(c, cap.text, W / 2, 1385, { size: 60, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 9, sc: back(pr(t, cap.s, cap.s + .2)) });
  else txt(c, cap.text, W / 2, 1385, { size: 52, font: SANS, weight: 500, a: pr(t, cap.s, cap.s + .1) });
}

// ---------- camera (map scenes) ----------
const CAM = [
  [0, 109, -4.6, 1900, 'l'], [2.4, 110, -4.3, 1980, 'l'], [3.6, 118, -2.5, 1150, 'io'], [10.1, 118, -2.5, 1230, 'l'],
  [28.8, 118, -2.5, 1550, 'h'], [29.5, 118, -2.5, 1150, 'out'], [35.2, 118, -2.5, 1220, 'l'],
  [40.6, 118, -2.5, 1220, 'h'], [41.5, 106.85, -6.25, 5200, 'io'], [45.4, 106.85, -6.25, 5600, 'l'],
  [57.9, 114, -4.5, 1500, 'h'], [58.4, 114, -4.5, 1220, 'out'], [59.9, 114, -4.5, 1250, 'l'], [60.4, 106.2, -5.6, 2500, 'io'], [61.5, 102, -2.2, 2600, 'l'],
  [62.2, 118, -2.5, 1150, 'io'], [68.6, 118, -2.5, 1240, 'l'],
  [69.0, 128.5, -3.9, 2700, 'io'], [69.3, 128.5, -3.9, 2750, 'l'], [69.65, 110.4, -8.0, 2700, 'io'], [69.95, 110.4, -8.0, 2750, 'l'],
  [70.3, 100.4, -.9, 2700, 'io'], [70.6, 100.4, -.9, 2750, 'l'], [70.95, 96.3, 4.4, 2700, 'io'], [71.6, 96.3, 4.4, 2780, 'l'],
  [83.2, 118, -2.5, 1500, 'h'], [84.0, 118, -2.5, 1150, 'out'], [88.6, 118, -2.5, 1230, 'l'], [92.7, 117, -1.0, 820, 'io'],
];
const EASE = { l: x => x, io, in: x => x * x * x, out: outC, h: () => 1 };
export function camAt(t) {
  let i = 1; while (i < CAM.length - 1 && CAM[i][0] < t) i++;
  const a = CAM[i - 1], b = CAM[i], p = EASE[b[4]](pr(t, a[0], b[0]));
  return { lon: lerp(a[1], b[1], p), lat: lerp(a[2], b[2], p), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)) };
}
const projector = (cam, w, h) => { const cx = cam.lon * D2R, cy = mY(cam.lat), k = cam.k; return (lon, lat) => [w / 2 + (lon * D2R - cx) * k, h / 2 - (mY(lat) - cy) * k]; };

// ---------- map: territory washes (hooked into drawMap) ----------
function mapExtra(c, P, cam, w, h, st, pat, olw, t) {
  const pxDeg = cam.k * D2R;
  if (st.washes && st.washes.length) {
    c.save(); c.beginPath(); pathRings(c, GROUP.indo, cam, w, h); c.clip('evenodd');
    for (const [lon, lat, r, col, a] of st.washes) { if (a <= 0) continue; const [x, y] = P(lon, lat); c.globalAlpha = a; c.beginPath(); c.arc(x, y, r * pxDeg, 0, TAU); c.fillStyle = col; c.fill(); }
    c.globalAlpha = .45; c.globalCompositeOperation = 'multiply'; c.fillStyle = pat; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
    for (const [lon, lat, r, , a] of st.washes) { if (a <= 0) continue; const [x, y] = P(lon, lat); c.globalAlpha = a * .8; c.beginPath(); c.arc(x, y, r * pxDeg, 0, TAU); c.lineWidth = olw * .7; c.strokeStyle = INK; c.stroke(); }
    c.restore();
    c.save(); c.beginPath(); pathRings(c, GROUP.indo, cam, w, h); c.lineWidth = olw * .6; c.strokeStyle = 'rgba(21,17,17,.6)'; c.stroke(); c.restore();
  }
  if (st.redWhite > 0) {
    c.save(); c.globalAlpha = st.redWhite; c.beginPath(); pathRings(c, GROUP.indo, cam, w, h); c.save(); c.clip('evenodd'); const [, ys] = P(118, -3.2);
    c.fillStyle = MP_R; c.fillRect(0, 0, w, ys); c.fillStyle = '#f7f5f0'; c.fillRect(0, ys, w, h - ys); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .35 * st.redWhite; c.fillStyle = pat; c.fillRect(0, 0, w, h); c.restore();
    c.lineWidth = olw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.restore();
  }
}
function mapState(t) {
  const st = { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, deep: 0, wallace: 0, plates: 0, washes: [], redWhite: 0 };
  const L = (s, lon, lat, a, o) => { if (a > 0) st.labels.push([s, lon, lat, a, o]); };
  // kingdoms (scene 1 teaser + scene 3)
  KINGDOMS.forEach(([n, lon, lat, r, col], i) => {
    const a = Math.max(t < 10.2 ? pr(t, 5.9 + i * .3, 6.1 + i * .3) : 0, t > 28.8 && t < 35.3 ? pr(t, 31.3 + i * .22, 31.5 + i * .22) : 0, t > 57.9 && t < 71.6 ? .85 : 0);
    if (a > 0) st.washes.push([lon, lat, r, col, a * .9]);
    if (t > 28.8 && t < 35.3) L(n, lon, lat - r * .2 - .9, pr(t, 31.4 + i * .22, 31.6 + i * .22), { size: 34, weight: 600, sc: env(t, 31.4 + i * .22) });
  });
  // Dutch holdings grow
  const dut = (lon, lat, r, t0) => { const p = pr(t, t0, t0 + .45); if (p > 0) st.washes.push([lon, lat, r * outC(p), DUTCH, .95]); };
  if (t > 40.6 && t < 45.5) dut(106.8, -6.3, .9, 41.9);
  if (t > 57.9 && t < 71.6) { DUTCH_EARLY.forEach(([lon, lat, r, t0]) => dut(lon, lat, r, t0 < 50 ? 57.9 : t0)); DUTCH_LATE.forEach(([lon, lat, r, y]) => dut(lon, lat, r, yearT(y))); }
  st.redWhite = t > 83.2 ? pr(t, 83.6, 84.4) : 0;
  L('Indonesia', 118, -10.6, t > 83.2 ? win(t, 84.4, 99) : 0, { size: 70, weight: 600 });
  return st;
}
function heroCard(c, t, i, P) {
  const hh = HEROES[i], t0 = 68.95 + i * .68; const s = env(t, t0 - .08, t0 + .72, .22, .14); if (s <= 0) return;
  const [x, y] = P(hh.lon, hh.lat); drawChar(c, x - 40, y + 140, 420, hh.who, s); drawGlove(c, x + 150, y - 160 + Math.sin(t * 14) * 10, 110, -.15, s);
  txt(c, hh.name, x - 40, y - 330, { size: 68, weight: 600, sc: s }); txt(c, hh.yr, x - 40, y - 260, { size: 54, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 6, sc: s });
}
function mapScene(c, t) {
  const cam = camAt(t), st = mapState(t), P = drawMap(c, W, H, cam, st, t);
  // S1: VOC ship sails in from the left
  if (t < 5.8) { const x = lerp(-220, 470, outC(pr(t, 0, 2.6))) + t * 35, [, y] = P(112, 6.5); ship(c, x, y, 150, t, 1 - pr(t, 5.2, 5.8)); }
  { const s = env(t, 2.5, 5.7); if (s > 0) { bigText(c, '350', W / 2, 430, { size: 230, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 12, sc: s }); bigText(c, 'TAHUN', W / 2, 590, { size: 96, font: SANS, weight: 700, stroke: INK, sw: 8, sc: s }); } }
  if (t < 10.2) KINGDOMS.forEach(([, lon, lat], i) => { const [x, y] = P(lon, lat); crown(c, x, y + 10, 60, '#f2c43a', env(t, 6.0 + i * .3, 10.1)); });
  { const s = env(t, 7.2, 10.1); if (s > 0) txt(c, '?', W / 2, 520, { size: 300, weight: 600, stroke: INK, sw: 16, sc: s }); }
  if (t > 8.55 && t < 10.2) { const y = lerp(2500, 1960, outC(pr(t, 8.6, 8.85))); drawChar(c, 800, y, 900, { ...PROT, expr: 'smug' }); drawGlove(c, 470, y - 900, 150, Math.sin(t * 18) * .35); }
  // S3: kingdoms with crowns and rivalries
  if (t > 28.8 && t < 35.3) {
    KINGDOMS.forEach(([, lon, lat], i) => { const [x, y] = P(lon, lat); crown(c, x, y + 8, 64, '#f2c43a', env(t, 31.3 + i * .22, 35.25)); });
    const pairs = [[2, 3], [6, 7], [4, 5]]; pairs.forEach(([a, b], j) => { const A = KINGDOMS[a], B = KINGDOMS[b], [x0, y0] = P(A[1], A[2]), [x1, y1] = P(B[1], B[2]); bolt(c, x0, y0 - 30, x1, y1 - 30, win(t, 33.3 + j * .25, 35.2, .1, .2), t); });
  }
  // S3b: Batavia 1619
  if (t > 40.6 && t < 45.5) {
    const [fx, fy] = P(106.82, -6.15);
    for (const [k, lon, lat, ph] of [[0, 105.8, -3.5, 0], [1, 107.9, -3.7, 1.7]]) { const [sx, sy] = P(lon, lat); ship(c, sx, sy, 115, t, env(t, 42.0 + k * .2, 45.5), ph); }
    fort(c, fx, fy + 40, 280, t, env(t, 41.7, 45.5));
    const s = env(t, 40.95, 45.5, .3, .2); if (s > 0) bigText(c, '1619', W / 2, 400, { size: 220, col: '#fff', stroke: INK, sw: 10, sc: s * (1 + 1.2 * (1 - outC(pr(t, 40.95, 41.25)))) });
    const a = win(t, 42.8, 45.5, .1, .2); if (a > 0) { c.save(); c.globalAlpha = a; yellowEllipse(c, fx, fy - 30, 290, 230, -.1, pr(t, 42.8, 43.3)); c.restore(); }
    txt(c, 'Batavia', fx, fy + 150, { size: 72, col: YEL, weight: 600, stroke: INK, sw: 6, sc: env(t, 42.85, 45.5) });
  }
  // S4: troops march to new territory
  if (t > 59.8 && t < 61.9) {
    const p = io(pr(t, 60.0, 61.6)), lon = lerp(106.6, 101.8, p), lat = lerp(-6.0, -2.3, p);
    for (let i = 0; i < 5; i++) { const [x, y] = P(lon - i * .55 + (i % 2) * .1, lat - i * .4 + (i % 2) * .35); drawChar(c, x, y - Math.abs(Math.sin(t * 9 + i)) * 12, 150, SOLDIER, env(t, 59.9 + i * .06, 61.85)); }
  }
  // S5: year counter for the slow expansion
  if (t > 61.8 && t < 68.8) { const y = Math.round(lerp(1619, 1920, pr(t, 61.9, 68.4))), a = win(t, 61.8, 68.8, .2, .2); txt(c, String(y), W / 2, 440, { size: 170, a }); txt(c, 'wilayah kolonial', W / 2, 555, { size: 52, italic: true, a }); }
  if (t > 61.8 && t < 68.8) DUTCH_LATE.forEach(([lon, lat, r, yr]) => { const t0 = yearT(yr), p = pr(t, t0, t0 + .6); if (p > 0 && p < 1) { const [x, y] = P(lon, lat); c.save(); c.globalAlpha = 1 - p; c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.arc(x, y, r * cam.k * D2R * (.6 + p * .8), 0, TAU); c.stroke(); c.restore(); } });
  // S5: resistance from many regions (pan between them)
  if (t > 68.8 && t < 71.7) for (let i = 0; i < 4; i++) heroCard(c, t, i, P);
  // S5 ending: narrator + follow
  if (t > 84.3) { const [x, y] = P(118, -3.2); txt(c, '350 TAHUN?', W / 2, 470, { size: 130, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: env(t, 84.4, 88.6) }); }
  if (t > 88.6) { const y = lerp(2500, 1960, outC(pr(t, 88.7, 88.95))); drawChar(c, 260, y, 820, { ...PROT, expr: t > 91.4 ? 'happy' : 'smug' }); followUI(c, t); }
}
function followUI(c, t) {
  const s = env(t, 90.9); if (s <= 0) return; c.save(); c.translate(W / 2, 470); c.scale(s, s);
  c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.roundRect(-400, -130, 800, 260, 60); c.fill(); c.shadowColor = 'transparent';
  c.save(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.fillStyle = '#e8d8b5'; c.fill(); c.clip(); drawChar(c, -260, 260, 380, PROT); c.restore(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.lineWidth = 7; c.strokeStyle = INK; c.stroke();
  const on = t > 91.7; c.beginPath(); c.roundRect(-130, -62, 360, 124, 62); c.fillStyle = on ? '#3a3a3a' : '#e8322c'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  txt(c, on ? 'Following ✓' : 'Follow', 50, 2, { size: 58, font: SANS, weight: 700, shadow: false, sc: on ? 1 : 1 + .06 * Math.max(0, Math.sin(t * 9)) });
  c.save(); c.translate(320, -10); c.rotate(on ? Math.sin(t * 22) * .3 * (1 - pr(t, 91.7, 92.4)) : 0); c.beginPath(); c.moveTo(-30, 30); c.quadraticCurveTo(-30, -38, 0, -40); c.quadraticCurveTo(30, -38, 30, 30); c.closePath(); c.fillStyle = '#f2c43a'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, 38, 9, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.restore();
  const gp = pr(t, 91.15, 91.6), back2 = pr(t, 91.75, 92.1); drawGlove(c, W / 2 + 120 + lerp(240, 0, outC(gp)) + back2 * 200, 470 + lerp(320, 70, outC(gp)) + back2 * 260 + (t > 91.6 && t < 91.75 ? 14 : 0), 140, -.5, env(t, 91.1, 92.5));
}

// ---------- plate scenes ----------
function sailScene(c, t) { // 10.1–13.5 camera follows the ship from the side
  plateSky(c, '#7fb0d8', '#e6eef0', 980, t); hills(c, 985, '#7e9aa3', 70, .006, -t * .3); plateSea(c, 980, H, t);
  hills(c, 990, '#6c8a72', 40, .01, -t * .9);
  ship(c, 520 + Math.sin(t * .9) * 20, 1290, 450, t);
  c.save(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 5; for (let i = 0; i < 5; i++) { const x = (900 - ((t * 420 + i * 260) % 1400)); c.beginPath(); c.moveTo(x, 1290 + i * 18); c.lineTo(x + 120, 1290 + i * 18); c.stroke(); } c.restore();
  const s = env(t, 11.0, 13.6); if (s > 0) bigText(c, '1602', W / 2, 300, { size: 220, stroke: INK, sw: 10, sc: s });
}
function logoBg(c, t) { const cam = { lon: 112, lat: -2, k: 700 }; c.save(); c.filter = 'sepia(.8) blur(3px) brightness(.9)'; drawMap(c, W, H, cam, { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0 }, t); c.restore(); c.fillStyle = 'rgba(245,232,200,.35)'; c.fillRect(0, 0, W, H); }
function logoScene(c, t) { // 13.5–16.6 stamp
  logoBg(c, t); const p = pr(t, 14.45, 14.7), s = lerp(2.2, 1, outC(p));
  if (t > 14.45) { c.save(); c.globalAlpha = pr(t, 14.45, 14.55); vocLogo(c, W / 2, 760, 520 * s * (1 + .01 * (t - 14.7))); c.restore(); }
  if (t > 14.7 && t < 15.3) { const q = pr(t, 14.7, 15.3); c.save(); c.globalAlpha = 1 - q; c.strokeStyle = '#1f2f57'; c.lineWidth = 8; c.beginPath(); c.arc(W / 2, 760, 330 + q * 160, 0, TAU); c.stroke(); c.restore(); }
  txt(c, 'Vereenigde Oostindische Compagnie', W / 2, 1150, { size: 46, italic: true, col: '#3a2a1e', shadow: false, a: pr(t, 15.0, 15.4) });
}
function tradeScene(c, t) { // 16.6–20.1 merchant trading
  plateSky(c, '#7fb0d8', '#e6eef0', 900, t); plateSea(c, 900, 1130, t); ship(c, 800, 1010, 170, t); hills(c, 905, '#7e9aa3', 50, .008, 1);
  woodFloor(c, 1130, '#9a6a3c', '#6a4424');
  drawChar(c, 300, 1570, 540, { ...MERCHANT, expr: 'smug' }, env(t, 16.65)); drawChar(c, 790, 1570, 520, { ...TRADER, expr: 'happy', flip: true }, env(t, 16.8));
  sack(c, 545, 1600, 230, false, env(t, 17.0));
  for (let i = 0; i < 4; i++) { const p = pr(t, 17.3 + i * .35, 17.95 + i * .35); if (p > 0 && p < 1) coin(c, lerp(380, 720, p), 1180 - Math.sin(p * Math.PI) * 260, 30); }
  const sp = pr(t, 18.9, 19.6); if (sp > 0) { nutmeg(c, lerp(700, 400, sp), 1250 - Math.sin(sp * Math.PI) * 200, 34, t); clove(c, lerp(740, 430, sp), 1230 - Math.sin(sp * Math.PI) * 230, 40, t * 2); }
}
function treatyScene(c, t, t0, ruler) { // merchant + ruler sign a treaty
  c.fillStyle = '#6b4a2e'; c.fillRect(-80, -80, W + 160, H + 160); c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < W; x += 150) c.fillRect(x, 0, 6, 1250);
  c.save(); c.globalAlpha = .9; c.fillStyle = '#e8d6a8'; c.beginPath(); c.roundRect(340, 260, 400, 520, 20); c.fill(); c.restore(); c.save(); c.lineWidth = 8; c.strokeStyle = '#3a2412'; c.strokeRect(340, 260, 400, 520); c.restore();
  dutchFlag(c, 380, 330, 140, 84, t); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(380, 330, 140, 84);
  drawChar(c, 280, 1500, 560, { ...MERCHANT, expr: 'smug' }, env(t, t0)); drawChar(c, 800, 1500, 560, { ...ruler, flip: true }, env(t, t0 + .1));
  woodFloor(c, 1380, '#8a5a32', '#4e301a');
  c.save(); c.translate(W / 2, 1610); c.rotate(-.05); c.fillStyle = '#f5ecd6'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 16; c.fillRect(-300, -170, 600, 340); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(-300, -170, 600, 340);
  c.fillStyle = '#3a2a1e'; c.font = `600 40px ${SERIF}`; c.textAlign = 'center'; c.fillText('PERJANJIAN', 0, -110); c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-230, -50 + i * 40); c.lineTo(230, -50 + i * 40); c.stroke(); }
  const sp = pr(t, t0 + .5, t0 + 1.3); c.strokeStyle = '#1b2a5a'; c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 40 * sp; i++) { const f = i / 40, x = -220 + f * 200, y = 110 + Math.sin(f * 18) * 16 - f * 10; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
  waxSeal(c, W / 2 + 190, 1700, 48, env(t, t0 + 1.35));
  if (sp > 0 && sp < 1) { const x = W / 2 - 220 + sp * 200, y = 1720 + Math.sin(sp * 18) * 16; c.save(); c.strokeStyle = '#efe6d2'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 70, y - 160); c.stroke(); c.restore(); drawGlove(c, x + 60, y - 70, 110, .5); }
}
function fortScene(c, t) { // 22.0–25.0
  const z = 1 + .14 * io(pr(t, 23.2, 23.5)) + .01 * (t - 22); c.save(); c.translate(W / 2, 1300); c.scale(z, z); c.translate(-W / 2, -1300);
  plateSky(c, '#78acd6', '#e2edf2', 1250, t); hills(c, 1255, '#8aa294', 60, .007, 2);
  c.fillStyle = '#7d8f4c'; c.fillRect(-80, 1250, W + 160, H); c.fillStyle = '#9a8a62'; c.fillRect(-80, 1250, W + 160, 30);
  fort(c, W / 2, 1270, 640, t, env(t, 22.05));
  cannon(c, 170, 1520, 220, t, 22.5, env(t, 22.15));
  for (let i = 0; i < 4; i++) drawChar(c, 380 + i * 150, 1700, 310, { ...SOLDIER, expr: i === 1 ? 'smug' : 'neutral' }, env(t, 23.25 + i * .09));
  c.restore();
}
function spiceScene(c, t) { // 25.0–28.8
  plateSky(c, '#80b2d8', '#eef2ea', 950, t); plateSea(c, 950, 1120, t); ship(c, lerp(980, 780, pr(t, 25, 28.8)), 1040, 200, t);
  woodFloor(c, 1120, '#a2703f', '#5e3a1e');
  const R = rng(9); for (let i = 0; i < 26; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 150, x = 320 + Math.cos(a) * d, y = 1560 + Math.sin(a) * d * .45 - (150 - d) * .5; if (t > 25.3 + i * .02) nutmeg(c, x, y, 40, R() * 3); }
  for (let i = 0; i < 70; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 150, x = 770 + Math.cos(a) * d, y = 1570 + Math.sin(a) * d * .45 - (150 - d) * .45; if (t > 25.5 + i * .01) clove(c, x, y, 52, R() * 6); }
  txt(c, 'Pala', 320, 1290, { size: 66, sc: env(t, 25.6) }); txt(c, 'Cengkih', 770, 1290, { size: 66, sc: env(t, 25.8) });
}
function vignettes(c, t) { // 35.2–40.6: monopoly, military, treaty
  if (t < 37.2) {
    plateSky(c, '#7fb0d8', '#e6eef0', 900, t); plateSea(c, 900, 1130, t); woodFloor(c, 1130, '#9a6a3c', '#6a4424');
    [[300, 1640], [520, 1660], [740, 1640], [410, 1430], [630, 1430], [520, 1230]].forEach(([x, y], i) => sack(c, x, y, 260, true, env(t, 35.25 + i * .07)));
    drawChar(c, 520, 1080, 360, { ...MERCHANT, expr: 'smug' }, env(t, 35.7));
    const s = env(t, 36.0); if (s > 0) { c.save(); c.translate(860, 820); c.scale(s, s); c.lineWidth = 9; c.strokeStyle = INK; c.beginPath(); c.arc(0, -70, 60, Math.PI, 0); c.stroke(); c.lineWidth = 6; c.beginPath(); c.roundRect(-90, -70, 180, 150, 18); c.fillStyle = '#f2c43a'; c.fill(); c.stroke(); c.beginPath(); c.arc(0, -5, 18, 0, TAU); c.fillStyle = INK; c.fill(); c.fillRect(-7, 0, 14, 40); c.restore(); }
  } else if (t < 38.7) { fortScene(c, t - 37.2 + 23.7); }
  else treatyScene(c, t, 38.7, RAJA);
}
function govScene(c, t) { // 51.9–57.9
  plateSky(c, '#7aaed8', '#e8eef2', 1300, t); hills(c, 1305, '#91a89a', 50, .006, 3); c.fillStyle = '#8c9a6a'; c.fillRect(-80, 1300, W + 160, H);
  const rise = outC(pr(t, 52.2, 52.8)); govBuilding(c, W / 2, 1320 + (1 - rise) * 700, 900, t);
  txt(c, 'Pemerintah Belanda', W / 2, 190, { size: 74, weight: 600, sc: env(t, 52.9) });
  // broken VOC logo pieces on the left, assets fly into the building
  vocLogo(c, 120, 600, 220, { split: .35, a: win(t, 54.6, 57.9, .3, .3) });
  const items = ['paper', 'coin', 'paper', 'ship', 'coin', 'paper', 'map', 'coin'];
  items.forEach((k, i) => { const p = pr(t, 54.9 + i * .3, 55.8 + i * .3); if (p <= 0 || p >= 1) return; const x = lerp(140, W / 2, io(p)), y = lerp(620, 1160, io(p)) - Math.sin(p * Math.PI) * 300, s = 1 - p * .5;
    if (k === 'paper') paper(c, x, y, 120, 150, p * 4, s); else if (k === 'coin') coin(c, x, y, 34 * s); else if (k === 'ship') ship(c, x, y, 110 * s, t); else { c.save(); c.translate(x, y); c.rotate(p * 3); c.fillStyle = '#e8d6a8'; c.fillRect(-70 * s, -45 * s, 140 * s, 90 * s); c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(-70 * s, -45 * s, 140 * s, 90 * s); c.fillStyle = MP_R; c.fillRect(-40 * s, -15 * s, 60 * s, 25 * s); c.restore(); } });
  drawChar(c, 860, 1640, 430, { ...OFFICIAL, expr: 'smug', flip: true }, env(t, 55.1));
}
function flagScene(c, t) { // 71.5–77.3
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2d4f86'); g.addColorStop(.55, '#d98c4f'); g.addColorStop(1, '#f6c27a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const sg = c.createRadialGradient(780, 1300, 30, 780, 1300, 700); sg.addColorStop(0, 'rgba(255,240,190,.9)'); sg.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H);
  c.save(); c.translate(780, 1300); c.rotate(t * .05); c.fillStyle = 'rgba(255,240,200,.12)'; for (let i = 0; i < 14; i++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(0, 0); c.lineTo(-60, -1400); c.lineTo(60, -1400); c.fill(); } c.restore();
  hills(c, 1720, '#3b2a2a', 70, .005, 1); c.fillStyle = '#3b2a2a'; c.fillRect(0, 1720, W, H);
  const z = 1 + .04 * (t - 71.5); c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); mpFlag(c, 250, 380, 640, 420, t); c.restore();
  const p = pr(t, capStart('17 AGUSTUS'), capStart('17 AGUSTUS') + .9); if (p > 0) { c.save(); c.globalAlpha = p; c.shadowColor = 'rgba(255,230,170,.9)'; c.shadowBlur = 40 * p; txt(c, '17 AGUSTUS 1945', W / 2, 1060, { size: 104, weight: 600, sc: 1.12 - .12 * outC(p) }); c.restore(); }
  txt(c, 'Proklamasi Kemerdekaan', W / 2, 1160, { size: 54, italic: true, a: pr(t, 72.4, 73.0) });
  c.fillStyle = '#000'; const bar = 110 * outC(pr(t, 71.5, 72)); c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
}
function docScene(c, t) { // 77.3–83.2
  c.fillStyle = '#3e2a1b'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 4; for (let y = 40; y < H; y += 120) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 20); c.stroke(); }
  const z = 1 + .022 * (t - 77.3); c.save(); c.translate(W / 2, 930); c.scale(z, z); c.rotate(-.025);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.fillStyle = '#f3e7c9'; c.fillRect(-400, -560, 800, 1120); c.shadowColor = 'transparent'; c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .5; c.fillStyle = c.createPattern(TEX, 'repeat'); c.fillRect(-400, -560, 800, 1120); c.restore();
  c.lineWidth = 4; c.strokeStyle = '#5a4630'; c.strokeRect(-370, -530, 740, 1060);
  c.fillStyle = MP_R; c.fillRect(-330, -490, 90, 30); c.fillStyle = '#fff'; c.fillRect(-330, -460, 90, 30); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-330, -490, 90, 60);
  dutchFlag(c, 240, -490, 90, 60, 0); c.strokeRect(240, -490, 90, 60);
  c.fillStyle = '#2b2018'; c.textAlign = 'center'; c.font = `600 50px ${SERIF}`; c.fillText('PENYERAHAN', 0, -360); c.fillText('KEDAULATAN', 0, -300);
  c.strokeStyle = 'rgba(60,40,20,.55)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-300, -200 + i * 52); c.lineTo(i === 8 ? 60 : 300, -200 + i * 52); c.stroke(); }
  for (const [sx, t0] of [[-170, 78.6], [170, 79.6]]) { const sp = pr(t, t0, t0 + .9); c.strokeStyle = '#1b2a5a'; c.lineWidth = 5; c.beginPath(); for (let i = 0; i <= 40 * sp; i++) { const f = i / 40, x = sx - 110 + f * 220, y = 380 + Math.sin(f * 16 + sx) * 18 - f * 12; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.strokeStyle = '#5a4630'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx - 120, 420); c.lineTo(sx + 120, 420); c.stroke(); }
  c.restore();
  waxSeal(c, W / 2, 1360, 60, env(t, 80.5));
  const d0 = capStart('27 DESEMBER'); txt(c, '27 DESEMBER 1949', W / 2, 240, { size: 100, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: env(t, d0) });
}

// ---------- scene list & transitions ----------
const SCENES = [
  [0, 10.1, mapScene, 'whip'], [10.1, 13.5, sailScene, 'zoom'], [13.5, 16.6, logoScene, 'whip'], [16.6, 20.1, tradeScene, 'whip'],
  [20.1, 22.0, (c, t) => treatyScene(c, t, 20.15, TRADER), 'zoom'], [22.0, 25.0, fortScene, 'whip'], [25.0, 28.8, spiceScene, 'zoom'],
  [28.8, 35.2, mapScene, 'whip'], [35.2, 40.6, vignettes, 'zoom'], [40.6, 45.4, mapScene, 'zoom'],
  [45.4, 51.9, (c, t) => { logoBg(c, t); const zi = outC(pr(t, 45.4, 46.4)), cr = pr(t, 48.0, 48.9), sp = io(pr(t, 49.1, 50.1)); vocLogo(c, W / 2, 760, 520 * lerp(.6, 1, zi) * (1 + .015 * (t - 46.4)), { crack: cr, split: sp }); const s = env(t, 50.05, 51.95, .25, .1); if (s > 0) bigText(c, '1799', W / 2, 760, { size: 260, col: '#fff', stroke: INK, sw: 12, sc: s * (1 + 1.4 * (1 - outC(pr(t, 50.05, 50.3)))) }); }, 'whip'],
  [51.9, 57.9, govScene, 'zoom'], [57.9, 71.55, mapScene, 'zoom'], [71.55, 77.3, flagScene, 'whip'], [77.3, 83.2, docScene, 'zoom'], [83.2, 99, mapScene, 'none'],
];
const SHAKES = [[7.3, 8.1, 5], [8.6, 9.4, 18], [14.45, 14.9, 16], [41.0, 41.5, 14], [50.05, 50.6, 18]];
let BUF_A = null, BUF_B = null;
function sceneAt(t) { return SCENES.findIndex(s => t >= s[0] && t < s[1]); }
function drawScene(c, t) {
  const i = Math.max(0, sceneAt(t)), [a, b, fn] = SCENES[i];
  const prev = SCENES[i - 1], next = SCENES[i + 1], D = .32;
  let tr = null;
  if (next && t > b - D / 2 && next[3] !== 'none' && SCENES[i][3] !== 'none') tr = { A: [fn, Math.min(t, b - 1e-3)], B: [next[2], b + 1e-3], p: (t - (b - D / 2)) / D, kind: SCENES[i][3] };
  else if (prev && t < a + D / 2 && prev[3] !== 'none') tr = { A: [prev[2], a - 1e-3], B: [fn, t], p: (t - (a - D / 2)) / D, kind: prev[3] };
  if (!tr) { fn(c, t); return; }
  if (!BUF_A) { BUF_A = cv(W, H); BUF_B = cv(W, H); }
  const ga = BUF_A.getContext('2d'), gb = BUF_B.getContext('2d'); tr.A[0](ga, tr.A[1]); tr.B[0](gb, tr.B[1]); const p = io(clamp(tr.p, 0, 1));
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  if (tr.kind === 'whip') { for (let k = 0; k < 4; k++) { const off = k * 26 * Math.sin(p * Math.PI); c.globalAlpha = k ? .3 : 1; c.drawImage(BUF_A, -p * W - off, 0); c.drawImage(BUF_B, (1 - p) * W - off, 0); } c.globalAlpha = 1; }
  else { const sa = 1 + p * .8, sb = .6 + .4 * p; c.globalAlpha = 1; c.drawImage(BUF_A, W / 2 - W * sa / 2, H * .45 - H * sa / 2, W * sa, H * sa); c.globalAlpha = p; c.drawImage(BUF_B, W / 2 - W * sb / 2, H * .45 - H * sb / 2, W * sb, H * sb); c.globalAlpha = 1;
    for (let k = 1; k <= 4; k++) { const s = 1 + Math.sin(p * Math.PI) * .04 * k; c.globalAlpha = .18; c.drawImage(c.canvas, W / 2 - W * s / 2, H * .45 - H * s / 2, W * s, H * s); } c.globalAlpha = 1; }
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
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .2; c.fillStyle = c.createPattern(TEX, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
  const vg = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.32)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  drawCaption(c, t);
}
