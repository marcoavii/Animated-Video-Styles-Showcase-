// ---------- cast ----------
const PROT = { skin: '#d9a07a', hair: 'fringe', shirt: '#8a4b25', pattern: '#ecc88f' };
const EURO = { skin: '#f3ccaf', hair: 'fringe', hairCol: '#7a4a22', hat: 'beret', beretCol: '#7a1f2a', shirt: '#2f4a6a', ruff: true, beard: 'goatee' };
const PORTU = { skin: '#eebf9c', hair: 'fringe', hairCol: '#2a1e16', hat: 'beret', shirt: '#5a2a2a', ruff: true, beard: 'full' };
const DUTCHM = { skin: '#f3ccaf', hair: 'fringe', hairCol: '#c9a35a', hat: 'puritan', shirt: '#2a2622', ruff: true };
const ENGL = { skin: '#f6d2b8', hair: 'fringe', hairCol: '#8a5a2b', hat: 'capotain', shirt: '#2f4a2f', ruff: true, beard: 'goatee' };
const VOCO = { skin: '#f1c7a7', hair: 'fringe', hairCol: '#4a3220', hat: 'puritan', shirt: '#24221f', ruff: true, sash: '#e07a1f', beard: 'goatee' };
const SELLER = { skin: '#a86b44', hair: 'curly', hat: 'bandana', bandana: '#c8302a', shirt: '#c9a227', pattern: '#7a3b12' };
const SOLDIER = { skin: '#f0c6a6', hair: 'fringe', hairCol: '#5a3a1e', hat: 'morion', shirt: '#3b5a8f', belts: true };
const WAYPOINTS = [ // the long relay of middlemen (lon, lat, name, who)
  [129.9, -4.5, 'Banda', SELLER], [102.25, 2.2, 'Malaka', { skin: '#c98d65', hair: 'fringe', hat: 'destar', shirt: '#2e6b4f', pattern: '#f2d39b' }],
  [75.8, 11.2, 'India', { skin: '#b9825a', hair: 'fringe', hat: 'turban', turban: '#e8a33a', shirt: '#f1ede4', beard: 'full' }], [45, 12.8, 'Arab', { skin: '#c99068', hair: 'fringe', hat: 'turban', shirt: '#efe8dc', beard: 'full', hairCol: '#2a1e16' }],
  [29.9, 31.2, 'Mesir', { skin: '#c99068', hair: 'fringe', hat: 'skullcap', shirt: '#8a5a2b', beard: 'goatee' }], [12.3, 45.4, 'Venesia', EURO],
];
const ROUTE = [[129.9, -4.5], [118, -6.5], [106, -6], [102.25, 2.2], [95, 6], [85, 7], [79, 7.5], [75.8, 11.2], [65, 13], [52, 13], [45, 12.8], [42, 15], [38, 20], [34, 27], [32.5, 30], [29.9, 31.2], [24, 34], [18, 38], [14, 41], [12.3, 45.4]];
const PT_ROUTE = [[-9.1, 38.7], [-14, 30], [-18, 20], [-20, 10], [-14, 0], [-2, -12], [8, -24], [14, -32], [18.5, -35.5], [26, -35], [36, -26], [41, -16], [41, -4], [48, 6], [60, 10], [75.8, 11.2], [80, 7], [92, 6], [98, 4], [102.25, 2.2], [106.5, -2], [114, -6], [122, -4], [127.4, .8]];

// ---------- captions ----------
const PHRASES = [
  [0.05, .66, ['Bayangin,']],
  [1.12, 3.1, ['lu harus naik kapal', '!BERBULAN-BULAN,']],
  [3.46, 5.42, ['menghadapi', '!BADAI', 'dan', '!RISIKO MATI,']],
  [5.84, 7.84, ['cuma buat mendapatkan', '!SEGENGGAM REMPAH']],
  [8.46, 11.04, ['Emangnya,', '!SEMAHAL APA', 'sih rempah dari Indonesia?']],
  [11.7, 12.4, ['Jadi gini,']],
  [12.86, 15.3, ['dulu', '!EROPA TERGILA-GILA', 'sama rempah']],
  [15.86, 19.4, ['!CENGKIH', 'dan', '!PALA', 'dari kepulauan Nusantara', 'jadi', '!KOMODITAS MAHAL']],
  [20.06, 20.8, ['Masalahnya,']],
  [21.12, 26.46, ['rempah ini harus melewati', 'banyak pedagang', 'dan', '!JALUR PERDAGANGAN PANJANG', 'sebelum sampai', 'ke Eropa']],
  [27.08, 27.44, ['Nah,']],
  [27.74, 31.22, ['!BANGSA PORTUGIS', 'akhirnya mencari', '!JALUR LAUT LANGSUNG', 'ke sumbernya']],
  [31.78, 34.6, ['Mereka sampai di', '!MALUKU', 'pada', '!AWAL ABAD KE-16|26']],
  [35.14, 35.86, ['Setelah itu,']],
  [36.04, 37.66, ['!BELANDA DAN INGGRIS', 'ikut datang']],
  [38.18, 39.46, ['Bukan cuma', 'mau beli rempah,']],
  [39.86, 42.06, ['mereka juga pengen', '!MENGUASAI PERDAGANGANNYA']],
  [42.7, 47.1, ['Tapi ternyata,', 'masalahnya', '!BUKAN SEKADAR', 'siapa yang bisa', 'membeli paling banyak']],
  [47.7, 52.04, ['Mereka ingin jadi', '!SATU-SATUNYA PIHAK', 'yang boleh', 'membeli dan menjual rempah']],
  [52.78, 58.0, ['!VOC|5', 'bahkan memakai', 'perjanjian dan', '!KEKUATAN MILITER', 'buat memaksakan', '!MONOPOLI DI MALUKU']],
  [58.54, 63.34, ['Jadi, alasan mereka', 'rela berlayar sejauh itu', '!BUKAN CUMA KARENA', '!REMPAHNYA WANGI']],
  [63.92, 65.4, ['Di balik', 'cengkih dan pala,']],
  [65.6, 69.0, ['ada', '!KEUNTUNGAN BESAR', 'dan', '!PEREBUTAN KENDALI', '!PERDAGANGAN DUNIA']],
  [69.52, 72.9, ['Dan salah satu', 'sumber kekayaan itu', 'ada di', '!TANAH INDONESIA']],
  [73.52, 75.2, ['!MASIH BANYAK CERITA', 'yang belum lu tahu']],
  [75.66, 77.3, ['!FOLLOW', '!BIAR NGGAK KETINGGALAN!']],
];
export const CAPS = [];
PHRASES.forEach(([s, e, chunks], pi) => {
  const parsed = chunks.map(ch => { const hl = ch[0] === '!', [txt0, wt] = (hl ? ch.slice(1) : ch).split('|'); return { text: txt0, hl, w: (wt ? +wt : txt0.length) + 4 }; });
  const total = parsed.reduce((n, x) => n + x.w, 0); let acc = s; const next = PHRASES[pi + 1] ? PHRASES[pi + 1][0] : DUR;
  parsed.forEach((p, i) => { const d = (e - s) * p.w / total; CAPS.push({ s: acc, e: i === parsed.length - 1 ? Math.min(next, e + .6) : acc + d, text: p.text, hl: p.hl }); acc += d; });
});
const capStart = (text, from = 0) => (CAPS.find(q => q.text.startsWith(text) && q.s >= from) || { s: 0 }).s;
const T_MONO = capStart('MONOPOLI'), T_PROFIT = capStart('KEUNTUNGAN'), T_REBUT = capStart('PEREBUTAN'), T_TANAH = capStart('TANAH INDONESIA'), T_CRAZY = capStart('EROPA TERGILA');
function drawCaption(c, t) {
  const cap = CAPS.find(q => t >= q.s && t < q.e); if (!cap) return;
  if (cap.hl) txt(c, cap.text, W / 2, 1385, { size: cap.text.length > 24 ? 52 : 60, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 9, sc: back(pr(t, cap.s, cap.s + .2)) });
  else txt(c, cap.text, W / 2, 1385, { size: 52, font: SANS, weight: 500, a: pr(t, cap.s, cap.s + .1) });
}

// ---------- camera (map scenes) ----------
const CAM = [
  [11.7, 62, 26, 330, 'h'], [15.4, 64, 23, 345, 'l'], [16.5, 126.5, -2, 2200, 'io'], [17.7, 126.8, -2.4, 2380, 'l'],
  [20.0, 129, -3.5, 1500, 'h'], [21.2, 116, -2, 820, 'io'], [22.2, 100, 3, 760, 'io'], [23.2, 78, 10, 700, 'io'], [24.3, 50, 16, 660, 'io'], [25.3, 32, 29, 660, 'io'], [26.3, 16, 41, 690, 'io'], [27.0, 15, 42, 720, 'l'],
  [27.0, 52, 6, 330, 'h'], [31.3, 58, 2, 345, 'l'], [32.4, 127.4, .8, 6000, 'in'],
  [35.0, 127.6, -1.6, 2350, 'h'], [40.0, 127.8, -1.8, 2550, 'l'],
  [55.5, 128.3, -2.2, 2900, 'h'], [58.4, 128.4, -2.4, 3250, 'l'],
  [65.5, 92, 14, 330, 'h'], [69.4, 94, 12, 345, 'l'],
  [69.4, 128, -2, 3400, 'h'], [72.4, 118, -2.5, 1150, 'io'], [73.4, 118, -2.5, 1180, 'l'], [77.6, 118, -1.8, 1000, 'io'],
];
const EASE = { l: x => x, io, in: x => x * x * x, out: outC, h: () => 1 };
export function camAt(t) {
  let i = 1; while (i < CAM.length - 1 && CAM[i][0] < t) i++;
  const a = CAM[i - 1], b = CAM[i], p = EASE[b[4]](pr(t, a[0], b[0]));
  return { lon: lerp(a[1], b[1], p), lat: lerp(a[2], b[2], p), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)) };
}
const projector = (cam, w, h) => { const cx = cam.lon * D2R, cy = mY(cam.lat), k = cam.k; return (lon, lat) => [w / 2 + (lon * D2R - cx) * k, h / 2 - (mY(lat) - cy) * k]; };

function mapExtra(c, P, cam, w, h, st, pat, olw, t) {
  const pxDeg = cam.k * D2R;
  if (st.washes && st.washes.length) {
    c.save(); c.beginPath(); pathRings(c, cam.k < 700 ? LANDW : LANDR, cam, w, h); c.clip('evenodd');
    for (const [lon, lat, r, col, a] of st.washes) { if (a <= 0) continue; const [x, y] = P(lon, lat); c.globalAlpha = a; c.beginPath(); c.arc(x, y, r * pxDeg, 0, TAU); c.fillStyle = col; c.fill(); c.globalAlpha = a * .8; c.lineWidth = olw; c.strokeStyle = INK; c.stroke(); }
    c.restore();
  }
}
function trail(c, P, pts, prog, t, col = '#fff') { if (prog <= 0) return null; const head = polyline(c, P, pts, prog); c.save(); c.setLineDash([18, 12]); c.lineDashOffset = -t * 40; c.lineCap = 'round'; c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.lineWidth = 6; c.strokeStyle = col; c.stroke(); c.restore(); return head; }
function mapState(t) {
  const st = { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, deep: 0, wallace: 0, plates: 0, washes: [] };
  const L = (s, lon, lat, a, o) => { if (a > 0) st.labels.push([s, lon, lat, a, o]); };
  L('Eropa', 15, 52, win(t, 11.8, 15.6), { size: 64, weight: 600 }); L('Asia', 90, 45, win(t, 11.8, 15.6), { size: 64, weight: 600 }); L('Afrika', 20, 5, win(t, 11.8, 15.6), { size: 60 });
  L('Eropa', 28, 56, win(t, 27.1, 32), { size: 58, weight: 600 }); L('Afrika', 20, 3, win(t, 27.1, 32), { size: 56 }); L('Asia', 95, 40, win(t, 27.1, 32), { size: 56 });
  L('Ternate', 127.4, 2.1, win(t, 35.1, 40.2), { size: 40 }); L('Ambon', 128.2, -2.6, win(t, 35.1, 40.2), { size: 40 }); L('Banda', 129.9, -5.6, win(t, 35.1, 40.2), { size: 40 });
  if (t > 55.4 && t < 58.6) [[129.9, -4.5, .9], [128.2, -3.6, 1.0], [127.4, .8, .8], [127.5, -.4, .7]].forEach(([lon, lat, r], i) => st.washes.push([lon, lat, r * outC(pr(t, 55.7 + i * .25, 56.2 + i * .25)), '#e07a1f', .9]));
  if (t > 69.4) { const p = pr(t, T_TANAH - .1, T_TANAH + .6); if (p > 0) st.fills.push({ g: 'indo', col: RED, a: 1, wipe: p < 1 ? [118, -2.5, io(p) * 1500] : null }); }
  L('Indonesia', 118, -10.6, t > 73.4 ? win(t, 73.5, 99) : 0, { size: 70, weight: 600 });
  return st;
}
function mapScene(c, t) {
  const cam = camAt(t), st = mapState(t), P = drawMap(c, W, H, cam, st, t);
  // Europe falls for spices
  if (t < 15.7) { const [x, y] = P(12, 47); drawChar(c, x, y + 40, 260, { ...EURO, expr: t > T_CRAZY ? 'happy' : 'neutral' }, env(t, 12.6, 15.6)); nutmeg(c, x + 140, y - 160, 46, t); if (t > T_CRAZY) for (let i = 0; i < 4; i++) { const p = ((t - T_CRAZY) * .9 + i * .25) % 1; txt(c, '♥', x - 60 + i * 50, y - 260 - p * 140, { size: 56, col: '#e8322c', stroke: INK, sw: 4, a: 1 - p, shadow: false }); } }
  // Maluku & Banda highlighted
  if (t > 15.6 && t < 17.9) { const a = win(t, 16.3, 17.9, .1, .2), [mx, my] = P(128.3, -1.8); c.save(); c.globalAlpha = a; yellowEllipse(c, mx, my, 330, 520, .15, pr(t, 16.3, 16.8)); c.restore(); txt(c, 'Maluku', mx - 30, my - 590, { size: 86, weight: 600, col: YEL, stroke: INK, sw: 6, sc: env(t, 16.4, 17.9) }); const [bx, by] = P(129.9, -4.5); txt(c, 'Kep. Banda', bx + 40, by + 90, { size: 50, weight: 600, sc: env(t, 16.7, 17.9) }); }
  // the long relay of middlemen
  if (t > 20.0 && t < 27.1) {
    const prog = pr(t, 20.3, 26.4), head = trail(c, P, ROUTE, prog, t);
    WAYPOINTS.forEach(([lon, lat, n, who], i) => { const ti = 20.4 + i * 1.02; const [x, y] = P(lon, lat), s = env(t, ti, 27.05); if (s <= 0) return; drawChar(c, x, y - 10, 170, who, s); txt(c, n, x, y + 50, { size: 42, weight: 600, sc: s }); for (let k = 0; k <= i; k++) coin(c, x + 100, y - 30 - k * 22, 20 * s); });
    if (head) { const [hx, hy] = head.at(-1); junkMini(c, hx, hy, 70, t); }
  }
  // Portuguese sail around Africa
  if (t > 27.0 && t < 32.5) {
    const head = trail(c, P, PT_ROUTE, io(pr(t, 27.6, 31.3)), t, '#ffe900'); if (head) { const [hx, hy] = head.at(-1); galleon(c, hx, hy, 120, t, { flag: 'pt' }); }
    const [lx, ly] = P(-9.1, 38.7); txt(c, 'Portugis', lx + 30, ly - 80, { size: 50, weight: 600, col: YEL, stroke: INK, sw: 5, sc: env(t, 27.3, 32.4) });
  }
  // three nations around Maluku
  if (t > 35.0 && t < 40.1) {
    for (const [k, lon, lat, lab, t0, ph] of [['pt', 121.8, .6, 'Portugis', 35.1, 0], ['nl', 133.2, .4, 'Belanda', capStart('BELANDA DAN'), 1], ['en', 127.6, -8.2, 'Inggris', capStart('BELANDA DAN') + .7, 2]]) {
      const [x, y] = P(lon, lat), s = env(t, t0, 40.05); galleon(c, x, y, 140, t, { flag: k, sc: s, ph }); flagBadge(c, k, x - 30, y - 220 * s, lab, t, s);
    }
  }
  // VOC monopoly
  if (t > 55.4 && t < 58.6) {
    [[129.9, -4.5], [128.2, -3.6], [127.4, .8]].forEach(([lon, lat], i) => { const [x, y] = P(lon, lat); lock(c, x, y - 60, 60, env(t, 56.0 + i * .25, 58.5)); });
    const p = pr(t, T_MONO, T_MONO + .25); if (p > 0) txt(c, 'MONOPOLI', W / 2, 430, { size: 150, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 12, sc: lerp(2.6, 1, outC(p)) * (1 + .01 * (t - T_MONO)), a: Math.min(1, p * 3) });
  }
  // world trade: profit & rivalry
  if (t > 65.5 && t < 69.5) {
    const [mx, my] = P(128, -3);
    [[4.9, 52.4], [-9.1, 38.7], [-0.1, 51.5], [113, 23], [75.8, 15], [45, 12.8]].forEach((d, i) => trail(c, P, [[128, -3], [lerp(128, d[0], .5), lerp(-3, d[1], .5) + 8], d], pr(t, 65.7 + i * .15, 66.9 + i * .15), t, '#f2c43a'));
    if (t > T_PROFIT) for (let i = 0; i < 12; i++) { const p = ((t - T_PROFIT) * .8 + i / 12) % 1, a = i / 12 * TAU; coin(c, mx + Math.cos(a) * p * 330, my + Math.sin(a) * p * 330 - p * 120, 26 * (1 - p * .5)); }
    if (t > T_REBUT) [['pt', -150], ['nl', 0], ['en', 150]].forEach(([k, dx], i) => flagBadge(c, k, mx + dx - 40, my - 120, '', t, env(t, T_REBUT + i * .12, 69.45)));
    if (t > T_REBUT + .4) { bolt(c, mx - 150, my - 240, mx, my - 240, win(t, T_REBUT + .4, 69.4, .1, .1), t); bolt(c, mx, my - 240, mx + 150, my - 240, win(t, T_REBUT + .5, 69.4, .1, .1), t); }
  }
  // final: spices in the foreground, narrator + follow
  if (t > 73.3) { const s = env(t, 73.45); for (const [x, y, r, rot] of [[110, 1830, 140, .4], [260, 1880, 100, 2]]) nutmeg(c, x, y + (1 - s) * 300, r, rot); const R = rng(4); for (let i = 0; i < 14; i++) clove(c, 880 + (R() - .5) * 300, 1820 + (R() - .5) * 120 + (1 - s) * 300, 110, R() * 6); }
  if (t > 73.4) { const y = lerp(2500, 1960, outC(pr(t, 73.5, 73.75))); drawChar(c, 540, y, 760, { ...PROT, expr: t > 76.5 ? 'happy' : 'smug' }); followUI(c, t, 75.6); }
}
function junkMini(c, x, y, s, t) { c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2) * .05); c.scale(s, s); c.lineWidth = 3 / s; c.strokeStyle = INK; c.beginPath(); c.moveTo(-.5, -.1); c.lineTo(.5, -.1); c.quadraticCurveTo(.4, .15, 0, .15); c.quadraticCurveTo(-.4, .15, -.5, -.1); c.closePath(); c.fillStyle = '#7a4a26'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, -.1); c.lineTo(0, -.9); c.stroke(); c.beginPath(); c.moveTo(.02, -.85); c.lineTo(.4, -.2); c.lineTo(.02, -.2); c.closePath(); c.fillStyle = '#efe3c6'; c.fill(); c.stroke(); c.restore(); }
function lock(c, x, y, s, sc) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(s * sc / 60, s * sc / 60); c.lineWidth = 7; c.strokeStyle = INK; c.beginPath(); c.arc(0, -30, 28, Math.PI, 0); c.stroke(); c.lineWidth = 5; c.beginPath(); c.roundRect(-42, -30, 84, 70, 12); c.fillStyle = '#f2c43a'; c.fill(); c.stroke(); c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fillStyle = INK; c.fill(); c.fillRect(-4, 0, 8, 22); c.restore(); }
function followUI(c, t, t0) {
  const s = env(t, t0); if (s <= 0) return; c.save(); c.translate(W / 2, 560); c.scale(s, s);
  c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.roundRect(-400, -130, 800, 260, 60); c.fill(); c.shadowColor = 'transparent';
  c.save(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.fillStyle = '#e8d8b5'; c.fill(); c.clip(); drawChar(c, -260, 260, 380, PROT); c.restore(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.lineWidth = 7; c.strokeStyle = INK; c.stroke();
  const on = t > t0 + .8; c.beginPath(); c.roundRect(-130, -62, 360, 124, 62); c.fillStyle = on ? '#3a3a3a' : '#e8322c'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  txt(c, on ? 'Following ✓' : 'Follow', 50, 2, { size: 58, font: SANS, weight: 700, shadow: false, sc: on ? 1 : 1 + .06 * Math.max(0, Math.sin(t * 9)) });
  c.save(); c.translate(320, -10); c.rotate(on ? Math.sin(t * 22) * .3 * (1 - pr(t, t0 + .8, t0 + 1.5)) : 0); c.beginPath(); c.moveTo(-30, 30); c.quadraticCurveTo(-30, -38, 0, -40); c.quadraticCurveTo(30, -38, 30, 30); c.closePath(); c.fillStyle = '#f2c43a'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, 38, 9, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.restore();
  const gp = pr(t, t0 + .25, t0 + .7), b2 = pr(t, t0 + .85, t0 + 1.2); drawGlove(c, W / 2 + 120 + lerp(240, 0, outC(gp)) + b2 * 200, 560 + lerp(320, 70, outC(gp)) + b2 * 260 + (t > t0 + .7 && t < t0 + .85 ? 14 : 0), 140, -.5, env(t, t0 + .2, 99));
}

// ---------- plates ----------
function spiceDetail(c, t) { // 17.7–20.0 floating close-ups
  c.fillStyle = '#1a100a'; c.fillRect(0, 0, W, H); const sp = c.createRadialGradient(W / 2, 900, 80, W / 2, 900, 900); sp.addColorStop(0, 'rgba(255,214,150,.38)'); sp.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = sp; c.fillRect(0, 0, W, H);
  const f1 = Math.sin(t * 1.6) * 20, f2 = Math.cos(t * 1.4) * 20;
  for (let i = 0; i < 5; i++) clove(c, 300 + i * 40, 560 + f1 + (i % 2) * 30, 170, -.5 + i * .25);
  nutmeg(c, 720, 1000 + f2, 210, t * .2);
  txt(c, 'Cengkih', 340, 380, { size: 80, weight: 600, sc: env(t, 17.8) }); txt(c, 'Pala', 720, 760, { size: 80, weight: 600, sc: env(t, 18.0) });
  const s = env(t, capStart('KOMODITAS'), 20.05); if (s > 0) { for (let i = 0; i < 6; i++) coin(c, 240 + i * 120, 1650 - Math.abs(Math.sin(t * 4 + i)) * 30, 46 * s); }
}
function harbor(c, t) { // Ternate harbor with Gamalama volcano, Portuguese ship arriving (32.4–35.0)
  plateSky(c, '#78acd6', '#eaf0ef', 980, t);
  c.fillStyle = '#5f7a5a'; c.beginPath(); c.moveTo(80, 990); c.lineTo(470, 430); c.quadraticCurveTo(540, 390, 610, 430); c.lineTo(1000, 990); c.closePath(); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  smoke(c, 540, 400, 60, t, 3, .6);
  plateSea(c, 980, H, t);
  c.fillStyle = '#c9b27a'; c.beginPath(); c.moveTo(-80, 1010); c.quadraticCurveTo(300, 960, 620, 1020); c.lineTo(-80, 1110); c.closePath(); c.fill();
  palm(c, 80, 1000, 200, t); palm(c, 520, 1010, 170, t + 2); stiltHouse(c, 230, 995, 150); stiltHouse(c, 380, 990, 140);
  galleon(c, lerp(1500, 760, outC(pr(t, 32.5, 34.3))), 1260, 420, t, { flag: 'pt' });
  txt(c, 'Ternate, Maluku', W / 2, 260, { size: 72, weight: 600, sc: env(t, 32.6) });
  const s = env(t, capStart('AWAL ABAD'), 35.05); if (s > 0) bigText(c, 'awal abad ke-16', W / 2, 1620, { size: 96, stroke: INK, sw: 8, sc: s });
}
function market(c, t, phase) { // competitive spice trade; phase: 'rivals' | 'voc'
  plateSky(c, '#7fb0d8', '#eaf0ef', 900, t); plateSea(c, 900, 1120, t); galleon(c, 860, 1020, 160, t, { flag: 'nl' }); galleon(c, 220, 1030, 140, t, { flag: 'en', ph: 2 });
  woodFloor(c, 1120, '#9a6a3c', '#6a4424');
  sack(c, 540, 1560, 250, false, 1); for (let i = 0; i < 8; i++) nutmeg(c, 470 + (i % 4) * 45, 1400 - Math.floor(i / 4) * 30, 26, i);
  drawChar(c, 540, 1300, 360, { ...SELLER, expr: phase === 'voc' && t > 45.6 ? 'worried' : 'happy' });
  const rivals = [[PORTU, 170, 'smug'], [DUTCHM, 360, 'angry'], [ENGL, 900, 'angry']];
  rivals.forEach(([who, x, e], i) => drawChar(c, x, 1780, 380, { ...who, expr: e, flip: i === 2 }, phase === 'voc' && t > 45.6 ? 1 - io(pr(t, 45.6, 46.0)) : env(t, 40.0 + i * .12)));
  for (let i = 0; i < 6; i++) { const p = ((t * .9 + i / 6) % 1), from = rivals[i % 3][1]; coin(c, lerp(from, 540, p), 1500 - Math.sin(p * Math.PI) * 280, 26); }
  if (phase === 'rivals' || t < 45.6) { bolt(c, 220, 1250, 400, 1250, win(t, 40.6, 47.0, .1, .2), t); bolt(c, 680, 1250, 880, 1250, win(t, 40.8, 47.0, .1, .2), t); }
  if (phase === 'voc') { const s = env(t, 45.6); drawChar(c, 820, 1800, 470, { ...VOCO, expr: 'smug' }, s); drawGlove(c, 600, 1450, 120, -1.2, s); txt(c, 'Pejabat VOC', 820, 1050, { size: 56, weight: 600, col: YEL, stroke: INK, sw: 5, sc: s }); }
}
function contract(c, t) { // 47.5–52.4
  c.fillStyle = '#4a3322'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < W; x += 140) c.fillRect(x, 0, 8, 1150);
  drawChar(c, 880, 1250, 620, { ...VOCO, expr: 'smug', flip: true });
  woodFloor(c, 1150, '#8a5a32', '#4e301a');
  const z = 1 + .03 * (t - 47.5); c.save(); c.translate(390, 1000); c.scale(z, z); c.rotate(-.04);
  c.fillStyle = '#f3e7c9'; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 24; c.fillRect(-300, -560, 600, 1000); c.shadowColor = 'transparent'; c.lineWidth = 4; c.strokeStyle = '#5a4630'; c.strokeRect(-275, -535, 550, 950);
  vocLogo(c, 0, -420, 150); c.fillStyle = '#2b2018'; c.textAlign = 'center'; c.font = `600 52px ${SERIF}`; c.fillText('PERJANJIAN', 0, -250);
  c.font = `italic 500 38px ${SERIF}`; ['Rempah hanya boleh', 'dijual kepada', 'VOC'].forEach((l, i) => { c.globalAlpha = pr(t, 48.3 + i * .35, 48.7 + i * .35); c.fillStyle = i === 2 ? '#a3201c' : '#2b2018'; if (i === 2) c.font = `700 70px ${SERIF}`; c.fillText(l, 0, -150 + i * 62 + (i === 2 ? 20 : 0)); }); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-240, 100 + i * 48); c.lineTo(240, 100 + i * 48); c.stroke(); }
  c.restore();
  waxSeal(c, 560, 1380, 56, env(t, 50.6));
  drawGlove(c, 690 - 40 * io(pr(t, 47.7, 48.3)), 920 + Math.sin(t * 5) * 8, 140, -1.9);
  txt(c, '1', 900, 290, { size: 230, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 12, sc: env(t, capStart('SATU-SATUNYA'), 52.45) });
}
function military(c, t) { // 52.4–55.5
  const z = 1 + .1 * io(pr(t, 53.6, 54.0)); c.save(); c.translate(W / 2, 1300); c.scale(z, z); c.translate(-W / 2, -1300);
  plateSky(c, '#78acd6', '#e2edf2', 1100, t); plateSea(c, 1100, 1260, t); galleon(c, 820, 1180, 300, t, { flag: 'nl' });
  c.fillStyle = '#c9b27a'; c.fillRect(-80, 1260, W + 160, H);
  fort(c, 330, 1300, 480, t, env(t, 52.5));
  for (let i = 0; i < 5; i++) drawChar(c, 180 + i * 175, 1760, 300, { ...SOLDIER, expr: i === 2 ? 'smug' : 'neutral' }, env(t, 53.2 + i * .1));
  c.restore();
}
function spiceCinema(c, t) { spiceHero(c, t, { glow: 1.2, rays: pr(t, 58.4, 59.4), aroma: pr(t, capStart('REMPAHNYA WANGI') - .3, capStart('REMPAHNYA WANGI') + .3), zoom: 1 + .03 * (t - 58.4) }); txt(c, 'cuma wangi?', W / 2, 420, { size: 76, italic: true, sc: env(t, capStart('REMPAHNYA WANGI'), 63.65) }); }
function cargoShip(c, t) { // 63.6–65.5
  plateSky(c, '#f2b77a', '#f6dcb0', 980, t); plateSea(c, 980, H, t); hills(c, 985, '#9a8a7a', 40, .008, 2);
  galleon(c, lerp(-300, 560, outC(pr(t, 63.6, 64.8))), 1250, 520, t, { flag: 'nl', cargo: true });
  txt(c, 'Kapal penuh rempah', W / 2, 330, { size: 74, weight: 600, sc: env(t, 63.8) });
}

// ---------- scene list & transitions ----------
const SCENES = [
  [0, 6.6, stormScene, 'cut'], [6.6, 11.7, spiceHook, 'whip'], [11.7, 17.7, mapScene, 'zoom'], [17.7, 20.0, spiceDetail, 'zoom'],
  [20.0, 27.0, mapScene, 'zoom'], [27.0, 32.4, mapScene, 'whip'], [32.4, 35.0, harbor, 'whip'], [35.0, 40.0, mapScene, 'zoom'], [40.0, 42.7, (c, t) => market(c, t, 'rivals'), 'cut'],
  [42.7, 47.5, (c, t) => market(c, t, 'voc'), 'whip'], [47.5, 52.4, contract, 'whip'], [52.4, 55.5, military, 'zoom'], [55.5, 58.4, mapScene, 'zoom'],
  [58.4, 63.6, spiceCinema, 'whip'], [63.6, 65.5, cargoShip, 'zoom'], [65.5, 69.4, mapScene, 'zoom'], [69.4, 99, mapScene, 'none'],
];
const SHAKES = [[1.25, 1.7, 10], [4.55, 5.0, 10], [T_MONO, T_MONO + .5, 18], [capStart('KEKUATAN MILITER'), capStart('KEKUATAN MILITER') + .4, 8]];
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

// ---------- sound effects (mixed under the VO, kept quieter than last time) ----------
export function sfx(sr, n) {
  const out = new Float32Array(n), R = rng(91);
  const add = (t0, dur, f) => { const i0 = Math.max(0, Math.floor(t0 * sr)), i1 = Math.min(n, Math.floor((t0 + dur) * sr)); for (let i = i0; i < i1; i++) out[i] += f((i - i0) / sr); };
  const boom = (t0, amp, len = 1.6) => { let ph = 0; add(t0, len, x => { const f = lerp(70, 34, Math.min(1, x / .6)); ph += TAU * f / sr; return amp * Math.sin(ph) * Math.exp(-x * 2.6); }); let lp = 0; add(t0, .25, x => { lp += .25 * ((R() * 2 - 1) - lp); return amp * .9 * lp * Math.exp(-x * 18); }); };
  const thud = (t0, amp) => { let ph = 0; add(t0, .35, x => { ph += TAU * lerp(140, 60, x / .35) / sr; return amp * Math.sin(ph) * Math.exp(-x * 11); }); };
  const whoosh = (t0, amp) => { let lp = 0, bp = 0; add(t0 - .18, .42, x => { const e = Math.sin(Math.PI * x / .42) ** 2, k = .02 + .3 * Math.sin(Math.PI * x / .42); lp += k * ((R() * 2 - 1) - lp); bp += .5 * (lp - bp); return amp * e * (lp - bp) * 3; }); };
  const thunder = (t0, amp) => { let lp = 0; add(t0, 2.2, x => { lp += .015 * ((R() * 2 - 1) - lp); return amp * lp * 6 * Math.exp(-x * 1.6) * (x < .05 ? x / .05 : 1); }); boom(t0, amp * .6, 1.2); };
  const storm = (t0, dur, amp) => { let lp = 0, lp2 = 0; add(t0, dur, x => { lp += .01 * ((R() * 2 - 1) - lp); lp2 += .08 * ((R() * 2 - 1) - lp2); const sw = .6 + .4 * Math.sin(x * 1.8); return amp * (lp * 5 * sw + lp2 * .5) * Math.min(1, x * 2, (dur - x) * 4); }); };
  const clink = (t0, amp) => add(t0, .25, x => amp * (Math.sin(TAU * 2600 * x) + .5 * Math.sin(TAU * 3900 * x)) * Math.exp(-x * 22));
  storm(0, 6.7, .07); thunder(1.25, .25); thunder(4.55, .25);
  SCENES.slice(1).forEach(([a], i) => { if (!['cut', 'none'].includes(SCENES[i][3])) whoosh(a, .07); });
  thud(6.6, .2); thud(40.0, .15);
  for (let i = 0; i < 6; i++) clink(20.4 + i * 1.02, .05);
  for (let i = 0; i < 5; i++) clink(T_PROFIT + i * .15, .05);
  thud(50.6, .2); boom(T_MONO, .3); thud(T_MONO, .2);
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
