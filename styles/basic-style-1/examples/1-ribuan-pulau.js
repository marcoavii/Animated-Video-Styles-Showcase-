// ---------- cast ----------
const PROT = { skin: '#d9a07a', hair: 'fringe', shirt: '#8a4b25', pattern: '#ecc88f' };
const PROT_ICE = { ...PROT, hat: 'beanie', scarf: true };
const PAPUA = { skin: '#7b492e', hair: 'curly', shirt: '#2e6b4f', pattern: '#e8c46a' };
const AUSSIE = { skin: '#f3ccaf', hair: 'fringe', hairCol: '#8a5a2b', hat: 'akubra', shirt: '#b89c66', buttons: true };
const HIJAB = { skin: '#e2ae88', hat: 'hijab', hijab: '#c95f7d', shirt: '#e58aa2' };
const PECI = { skin: '#c98d65', hair: 'fringe', hat: 'peci', shirt: '#f1ede4', buttons: true };

// ---------- captions (VO transcript, timed to the audio) ----------
const PHRASES = [
  [0.05, 1.2, ['Lu pernah mikir', 'gak sih?']],
  [1.64, 3.82, ['Kenapa Indonesia', 'pulaunya', 'banyak banget?']],
  [4.42, 6.1, ['Kenapa kagak', 'nyatu aja', 'semuanya?']],
  [6.74, 8.0, ['Nah,']],
  [8.36, 13.08, ['ternyata Indonesia', 'yang kita lihat', 'sekarang tuh', 'beda jauh', 'sama Indonesia', 'puluhan ribu', 'tahun lalu']],
  [13.64, 14.98, ['Dan percaya', 'gak percaya,']],
  [15.36, 17.46, ['beberapa pulau', 'yang sekarang', 'kepisah laut']],
  [17.8, 19.18, ['dulunya', 'malah nyambung']],
  [19.78, 20.26, ['Jadi gini,']],
  [20.8, 22.62, ['sekitar 20 ribu', 'tahun lalu,']],
  [22.86, 24.26, ['bumi masih', 'zaman es']],
  [24.8, 26.94, ['Air laut', 'waktu itu', 'jauh lebih rendah,']],
  [27.38, 30.16, ['bahkan sekitar', '120 meter', 'dibanding sekarang']],
  [30.74, 31.28, ['Makanya']],
  [31.7, 36.48, ['Sumatra,', 'Jawa,', 'dan Kalimantan', 'dulunya nyambung']],
  [36.72, 37.76, ['jadi satu', 'daratan gede', 'sampai ke Asia']],
  [38.4, 40.26, ['Papua juga', 'nyambung', 'sama Australia']],
  [40.72, 41.58, ['Kebayang nggak tuh?']],
  [42.22, 42.58, ['Nah,']],
  [42.82, 44.38, ['pas zaman es', 'mulai berakhir,']],
  [44.7, 45.66, ['esnya mencair,']],
  [46.08, 47.18, ['air laut pun naik,']],
  [47.68, 50.44, ['daratan rendah', 'yang tadinya', 'nyambungin', 'pulau-pulau itu,']],
  [50.74, 52.16, ['pelan-pelan', 'ketutup laut']],
  [52.86, 53.46, ['Tapi nih,']],
  [53.74, 56.06, ['gak semua pulau', 'Indonesia', 'dulunya nyatu,']],
  [56.52, 61.98, ['soalnya ada juga', 'pulau yang', 'terbentuk karena', 'pergerakan', 'lempeng bumi', 'selama jutaan tahun,']],
  [62.42, 65.1, ['dan beberapa wilayah', 'memang dipisahin', 'laut dalam']],
  [65.66, 66.66, ['Jadi ternyata,']],
  [66.98, 71.2, ['bentuk Indonesia', 'yang sekarang itu', 'hasil perubahan', 'bumi', 'selama jutaan tahun']],
  [71.74, 72.82, ['Dan yang', 'bikin menarik,']],
  [73.16, 74.84, ['laut yang sekarang', 'misahin kita,']],
  [75.1, 77.4, ['sebagian dulunya', 'justru daratan']],
];
export const CAPS = [];
PHRASES.forEach(([s, e, chunks], pi) => {
  const total = chunks.reduce((n, x) => n + x.length + 4, 0); let acc = s;
  const next = PHRASES[pi + 1] ? PHRASES[pi + 1][0] : DUR;
  chunks.forEach((ch, i) => { const d = (e - s) * (ch.length + 4) / total; CAPS.push({ s: acc, e: i === chunks.length - 1 ? Math.min(next, e + .6) : acc + d, text: ch }); acc += d; });
});
function drawCaption(c, t) {
  const cap = CAPS.find(q => t >= q.s && t < q.e); if (!cap) return;
  txt(c, cap.text, W / 2, 1385, { size: 52, font: SANS, weight: 500, a: pr(t, cap.s, cap.s + .1), shadow: true });
}

// ---------- cross-section scene (illustrated stand-in for the photo plates) ----------
const TER = [[-20, 1500], [60, 1290], [130, 1000], [190, 760], [235, 640], [290, 720], [350, 900], [400, 1080], [440, 1150], [520, 1168], [600, 1158], [660, 1150], [700, 1060], [760, 880], [840, 690], [880, 662], [930, 760], [990, 1000], [1040, 1250], [1100, 1450]];
const terY = x => { for (let i = 1; i < TER.length; i++) if (x <= TER[i][0]) return lerp(TER[i - 1][1], TER[i][1], (x - TER[i - 1][0]) / (TER[i][0] - TER[i - 1][0])); return 1450; };
function terPath(c) { c.beginPath(); c.moveTo(TER[0][0], H + 10); c.lineTo(TER[0][0], TER[0][1]); for (let i = 1; i < TER.length - 1; i++) { const mx = (TER[i][0] + TER[i + 1][0]) / 2, my = (TER[i][1] + TER[i + 1][1]) / 2; c.quadraticCurveTo(TER[i][0], TER[i][1], mx, my); } c.lineTo(TER.at(-1)[0], TER.at(-1)[1]); c.lineTo(TER.at(-1)[0], H + 10); c.closePath(); }
function drawXsec(c, t) {
  const z = 1 + .012 * (t - 24.8); c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
  let g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#6fa6d6'); g.addColorStop(1, '#d9e9f1'); c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120);
  c.fillStyle = 'rgba(255,255,255,.9)'; for (const [x, y, s] of [[180, 230, 1], [760, 160, 1.3], [520, 330, .8], [950, 420, .9]]) { const xx = (x + t * 12) % (W + 300) - 150; for (const [dx, dy, r] of [[0, 0, 60], [55, -25, 52], [110, 0, 58], [55, 15, 48]]) { c.beginPath(); c.arc(xx + dx * s, y + dy * s, r * s, 0, TAU); c.fill(); } }
  c.fillStyle = '#9fb5c4'; c.beginPath(); c.moveTo(-60, 905); for (let x = -60; x <= W + 60; x += 40) c.lineTo(x, 860 - 40 * Math.abs(Math.sin(x * .011)) - 25 * Math.abs(Math.sin(x * .027))); c.lineTo(W + 60, 905); c.fill();
  const wy = lerp(900, 1240, io(pr(t, 25.9, 27.3)));
  g = c.createLinearGradient(0, wy, 0, H); g.addColorStop(0, '#3f7f96'); g.addColorStop(1, '#123247'); c.fillStyle = g; c.fillRect(-60, wy, W + 120, H);
  waves(c, W / 2, wy + 6, W + 80, t, .5);
  terPath(c); g = c.createLinearGradient(0, 640, 0, H); g.addColorStop(0, '#8b6b46'); g.addColorStop(1, '#4e3828'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.strokeStyle = 'rgba(40,25,15,.35)'; c.lineWidth = 3; for (let y = 700; y < H; y += 55) { c.beginPath(); for (let x = -20; x <= W + 20; x += 30) { const yy = y + Math.sin(x * .015 + y) * 10; x === -20 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
  c.fillStyle = 'rgba(95,130,55,.9)'; c.beginPath(); c.rect(-60, 0, W + 120, wy); c.clip(); terPath(c); c.lineWidth = 34; c.strokeStyle = 'rgba(95,130,55,.95)'; c.stroke(); c.restore();
  terPath(c); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  const drop = pr(t, 25.9, 26.1);
  if (drop > 0) { c.save(); c.setLineDash([16, 12]); c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-60, 900); c.lineTo(W + 60, 900); c.stroke(); c.restore(); txt(c, 'permukaan laut sekarang', 40, 870, { size: 38, align: 'left', a: drop, italic: true }); }
  arrow(c, 600, 930, 600, 1190, 34, '#fff', win(t, 25.95, 27.5, .15, .25) > 0 ? outC(pr(t, 25.95, 27.2)) * win(t, 25.95, 27.5, .15, .25) : 0);
  // ruler
  const ra = win(t, 25.0, 31, .3, .1); if (ra > 0) {
    c.save(); c.globalAlpha = ra; c.fillStyle = 'rgba(255,255,255,.92)'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.roundRect(1000, 880, 26, 380, 8); c.fill(); c.stroke();
    for (let i = 0; i <= 6; i++) { const y = 900 + i * 340 / 6; c.beginPath(); c.moveTo(1000, y); c.lineTo(1014, y); c.stroke(); } c.restore();
    txt(c, '0 m', 985, 900, { size: 40, align: 'right', a: ra, font: SANS, weight: 700 });
  }
  txt(c, '−120 m', 985, 1240, { size: 96, align: 'right', col: YEL, font: SANS, weight: 700, sc: env(t, 28.05, 31), stroke: INK, sw: 8 });
  txt(c, 'Sumatra', 235, 560, { size: 56, a: win(t, 25.0, 31) });
  txt(c, 'Kalimantan', 860, 585, { size: 56, a: win(t, 25.0, 31) });
  // walker crossing the exposed shelf
  const wp = pr(t, 28.6, 30.4); if (t > 28.4) { const x = lerp(330, 735, io(wp)), y = terY(x) - 6 - Math.abs(Math.sin(wp * 18)) * 14; drawChar(c, x, y, 240, PROT_ICE, env(t, 28.4, 31)); }
  c.restore();
}

// ---------- the map scene ----------
const F = (g, col, a, wipe) => ({ g, col, a, wipe });
function mapState(t) {
  const st = { labels: [], fills: [], ice: 0, iceShrink: 0, shelf: 0, flood: 0, ghost: 0, deep: 0, wallace: 0, plates: 0, sundaHi: 0, sahulHi: 0, merge: 0 };
  // Indonesia (modern) red
  let indo = 0;
  if (t < 19.5) indo = t >= 1.7 ? 1 : 0; else if (t < 20.6) indo = 1 - pr(t, 19.5, 20.4);
  if (t >= 47.2) indo = pr(t, 47.3, 47.8);
  if (indo > 0) st.fills.push(F('indo', RED, indo, t < 2.6 ? [110, -7, io(pr(t, 1.7, 2.55)) * 1500] : null));
  // ice-age teaser ghost
  st.ghost = Math.max(win(t, 17.8, 19.6, .35, .3), win(t, 53.8, 56.8, .4, .5), win(t, 75.1, 99, .5, .1));
  // ice age
  if (t > 22.9 && t < 47.6) st.shelf = pr(t, 22.9, 23.6);
  if (t >= 47.6 && t < 52.6) st.shelf = 1 - pr(t, 52.2, 52.6);
  if (t > 69.0 && t < 70.1) st.shelf = Math.sin(t * 26) > 0 ? 1 : 0;
  st.flood = io(pr(t, 49.9, 52.3));
  st.ice = t < 24.8 ? io(pr(t, 22.9, 23.9)) : (t > 41.8 && t < 47.6) ? pr(t, 41.9, 42.4) * (1 - pr(t, 47.2, 47.6)) : 0;
  st.iceShrink = io(pr(t, 44.7, 46.3));
  // Sundaland / Sahul build-up
  if (t > 31 && t < 42.4) {
    st.fills.push(F('sumatra', RED, 1, null)); st.fills.at(-1).a = pr(t, 31.7, 31.9);
    st.fills.push(F('jawa', RED, pr(t, 32.8, 33.0)));
    st.fills.push(F('kalimantan', RED, pr(t, 33.7, 33.9)));
    st.fills.push(F('papua', RED, pr(t, 38.5, 38.7)));
    st.fills.push(F('australia', ORANGE, pr(t, 39.4, 39.6)));
    const fade = 1 - pr(t, 41.8, 42.3);
    st.fills.forEach(f => f.a *= fade);
    st.sundaHi = pr(t, 34.9, 35.0) * fade; st.sundaWipe = t < 35.6 ? [108, 1, io(pr(t, 34.9, 35.6)) * 1400] : null;
    st.sahulHi = pr(t, 38.7, 38.8) * fade; st.sahulWipe = t < 39.4 ? [137, -10, io(pr(t, 38.7, 39.4)) * 1300] : null;
  }
  if (t > 47.6 && t < 50) { const pu = Math.sin(pr(t, 47.8, 49.6) * Math.PI) * .85; st.sundaHi = pu; st.sahulHi = pu; }
  // Wallacea
  const wal = win(t, 54.9, 57.0, .3, .5); if (wal > 0) st.fills.push(F('wallacea', GREEN, wal));
  st.wallace = pr(t, 54.4, 55.0); st.wallaceA = t < 56.3 ? 1 : t < 62.2 ? .45 : t < 65.4 ? .85 : 1 - pr(t, 65.4, 65.9);
  // plates / deep sea
  st.plates = pr(t, 58.3, 59.3); st.plateA = t < 62.2 ? 1 : t < 65.4 ? .45 : 1 - pr(t, 65.4, 65.9); if (t > 66) st.plates = 0;
  st.deep = pr(t, 62.6, 63.3) * (1 - pr(t, 65.4, 65.9));
  // labels
  const L = (s, lon, lat, a, o) => { if (a > 0) st.labels.push([s, lon, lat, a, o]); };
  L('Indonesia', 118, -10.5, win(t, 1.9, 13.4) || win(t, 66.8, 71.6), { size: 70, weight: 600 });
  const ctx0 = (win(t, 1.2, 2.7) || win(t, 4.3, 10.9)) * .85;
  L('Asia', 103, 19, ctx0, { size: 56 });
  L('Australia', 134, -24, ctx0, { size: 56 });
  L('Sumatra', 101.4, .2, win(t, 13.9, 19.5) || win(t, 31.7, 37.9), { rot: -38, sc: env(t, 31.7) || 1 });
  L('Kalimantan', 113.6, .6, win(t, 13.9, 19.5) || win(t, 33.7, 37.9), { sc: env(t, 33.7) || 1 });
  L('Jawa', 110.2, -7.35, win(t, 13.9, 19.5) || win(t, 32.8, 37.9), { size: 42, rot: -6, sc: env(t, 32.8) || 1 });
  L('Asia', 102.5, 17.5, win(t, 37.2, 38.2), { size: 64, sc: env(t, 37.2) });
  L('Papua', 138.6, -4.3, win(t, 38.5, 41.9), { sc: env(t, 38.5) });
  L('Australia', 133, -29, win(t, 39.4, 41.9), { size: 60, sc: env(t, 39.4) });
  L('Garis Wallace', 117.3, -4.6, win(t, 54.7, 56.5), { size: 40, rot: -66, col: YEL, weight: 600 });
  L('Wallacea', 124.5, -6.6, win(t, 55.1, 56.6), { size: 58, weight: 600 });
  L('Lempeng Eurasia', 104, 9.5, win(t, 59.4, 62.4), { size: 50, italic: true, sc: env(t, 59.4) });
  L('Lempeng Indo-Australia', 116, -16.8, win(t, 59.6, 62.4), { size: 44, italic: true, sc: env(t, 59.6) });
  L('Lempeng Pasifik', 132.5, 9, win(t, 59.8, 62.4), { size: 50, italic: true, sc: env(t, 59.8) });
  L('Laut Banda', 127.8, -4.6, win(t, 63.0, 65.6), { size: 52 });
  L('Selat Makassar', 118.6, -1.2, win(t, 63.2, 65.6), { size: 36, rot: -82 });
  L('Laut Jawa', 110.9, -5.75, win(t, 72.3, 99), { size: 52, italic: true });
  L('Kalimantan', 113.5, .3, win(t, 72.3, 99) * .9, { size: 48 });
  L('Jawa', 110.2, -7.35, win(t, 72.3, 99) * .9, { size: 44, rot: -6 });
  L('Sumatra', 102, -1.6, win(t, 72.3, 99) * .9, { size: 48, rot: -38 });
  return st;
}
function drawMapScene(c, t, cam) {
  const st = mapState(t), P = drawMap(c, W, H, cam, st, t), at = (lon, lat) => P(lon, lat);
  // S1-S4 hero on Java
  if (t > .8 && t < 13.5 && !(t > 4.35 && t < 6.6)) { const [x, y] = at(110.4, -7.1); drawChar(c, x, y, 170, PROT, env(t, .85, 13.45)); if (t < 4.3) questionMark(c, x + 70, y - 205, 110, env(t, .95, 4.25)); }
  // ±17.000 pulau
  { const s = env(t, 2.7, 4.35); if (s > 0) { txt(c, '±17.000', W / 2, 470, { size: 150, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: s }); txt(c, 'pulau', W / 2, 590, { size: 80, font: SANS, weight: 700, stroke: INK, sw: 7, sc: s }); } }
  // 2026 + "dulu" polaroid
  { const s = env(t, 8.6, 11.15); if (s > 0) { txt(c, '2026', W / 2, 470, { size: 170, sc: s }); txt(c, 'sekarang', W / 2, 580, { size: 54, italic: true, sc: s }); } }
  { const s = env(t, 11.05, 13.35); if (s > 0) {
    c.save(); c.translate(W / 2, 470); c.rotate(-4 * D2R); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 24; c.fillStyle = '#f6f0e3'; c.fillRect(-300, -250, 600, 520); c.shadowColor = 'transparent';
    c.save(); c.filter = 'sepia(.85) contrast(1.05)'; miniMap(c, -275, -225, 550, 410, { lon: 118, lat: -1, k: 520 }, { labels: [], fills: [F('indo', RED, .9)], shelf: 1, ghost: 0, ice: 0, flood: 0, sundaHi: .9, sahulHi: .9 }); c.restore();
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(-275, -225, 550, 410); c.restore();
    txt(c, 'dulu?', W / 2 + 18, 470 + 228, { size: 62, col: '#3a2a1e', shadow: false, italic: true, sc: s, rot: -4 });
  } }
  // S5: seas between islands + shocked hero
  if (t > 16.4 && t < 19.6) { const a = win(t, 16.6, 19.6, .3, .3); for (const [lon, lat] of [[106.5, -4.5], [109.5, -2.5], [111.5, -5.3]]) { const [x, y] = at(lon, lat); waves(c, x, y, 150, t, a); } }
  { const s = t > 17.8 && t < 19.6 ? 1 : 0; if (s) { const x = lerp(1500, 790, outC(pr(t, 17.82, 18.0))) + lerp(0, 800, io(pr(t, 19.3, 19.6))); drawChar(c, x, 1960, 1050, { ...PROT, expr: 'shock' }); } }
  // S6: ice age world
  { const s = env(t, 20.8, 24.35, .3, .15); if (s > 0) txt(c, '20.000 tahun lalu', W / 2, 520, { size: 104, sc: s }); }
  if (t > 19.6 && t < 20.85) { const n = Math.round(io(pr(t, 19.6, 20.75)) * 20000); txt(c, n.toLocaleString('id-ID') + ' tahun lalu', W / 2, 520, { size: 92, a: .9 }); }
  if (t > 23.1 && t < 24.6) { const [x, y] = at(111, -6.5); drawChar(c, x + Math.sin(t * 60) * 3, y, 210, { ...PROT_ICE, expr: 'worried' }, env(t, 23.2, 24.6)); }
  // S8 callouts
  { const p = pr(t, 36.6, 37.1), a = win(t, 36.6, 37.95, .1, .2); if (a > 0) { const [x, y] = at(108, 2); c.save(); c.globalAlpha = a; yellowEllipse(c, x, y, 330, 470, .25, p); c.restore(); txt(c, 'Sundaland', x + 60, y - 560, { size: 92, col: YEL, weight: 600, sc: env(t, 36.75, 37.95) }); } }
  { const s = env(t, 37.2, 37.95); if (s > 0) { const [x0, y0] = at(103.5, 6), [x1, y1] = at(102.8, 13); arrow(c, x0, y0, x1, y1, 30, '#fff', s); } }
  // S9 Sahul
  if (t > 38.3 && t < 42) {
    const [px, py] = at(137.6, -3.4), [ax, ay] = at(132.5, -23.5);
    drawChar(c, px, py, 170, PAPUA, env(t, 38.6, 41.9)); drawChar(c, ax, ay, 180, { ...AUSSIE, expr: 'happy' }, env(t, 39.4, 41.9));
    const hp = io(pr(t, 39.75, 40.1)), shake = Math.sin(t * 22) * 8 * pr(t, 40.1, 40.3), [mx, my] = at(136, -12.5);
    const s = env(t, 39.7, 41.9); drawGlove(c, lerp(px, mx - 36, hp), lerp(py - 120, my, hp) + shake, 120, Math.PI / 2 + .3, s); drawGlove(c, lerp(ax, mx + 36, hp), lerp(ay - 120, my, hp) - shake, 120, -Math.PI / 2 - .3, s);
    const a = win(t, 39.75, 41.9, .1, .2); if (a > 0) { c.save(); c.globalAlpha = a; yellowEllipse(c, mx, my, 250, 170, -.2, pr(t, 39.75, 40.2)); c.restore(); txt(c, 'Sahul', mx - 280, my - 220, { size: 88, col: YEL, weight: 600, sc: env(t, 39.9, 41.9) }); }
  }
  if (t > 40.6 && t < 41.9) { const y = lerp(2600, 1950, outC(pr(t, 40.62, 40.82))) + lerp(0, 900, io(pr(t, 41.6, 41.9))); drawChar(c, 540, y, 1150, { ...PROT, expr: 'smug' }); drawGlove(c, 880, y - 1080, 150, .35); }
  // S10 melt
  { const [x, y] = [800, 380]; sun(c, x, y, 85, t, env(t, 42.85, 47.3)); }
  if (t > 44.7 && t < 46.6) { const R = rng(3), a = win(t, 44.7, 46.6); c.save(); c.globalAlpha = a; c.fillStyle = '#bfe3f2'; for (let i = 0; i < 40; i++) { const [x, y] = at(-5 + R() * 110, 55 + R() * 22), dy = ((t * 260 + R() * 300) % 300); c.beginPath(); c.ellipse(x, y + dy, 5, 9, 0, 0, TAU); c.fill(); } c.restore(); }
  if (t > 46 && t < 47.4) { for (const [i, lon, lat] of [[0, 104, -12], [1, 115, -14], [2, 126, -12]]) { const [x, y] = at(lon, lat), p = pr(t, 46.1 + i * .1, 46.6 + i * .1); arrow(c, x, y + 60 - p * 60, x, y - 120 - p * 60, 34, '#fff', env(t, 46.1 + i * .1, 47.3)); } const [x, y] = at(115, -24); txt(c, '+120 m', x, y, { size: 96, col: YEL, font: SANS, weight: 700, stroke: INK, sw: 8, sc: env(t, 46.4, 47.3) }); }
  // S11 flooding + boat
  if (t > 49.9 && t < 52.6) { for (const [i, lon, lat] of [[0, 107, -4], [1, 112, -3], [2, 104.5, 1.5], [3, 109, 4], [4, 135, -9], [5, 117.5, -6]]) { const [x, y] = at(lon, lat); ripple(c, x, y, ((t - 49.9) * .9 + i * .17) % 1, 90); } }
  if (t > 50.8 && t < 52.8) { const [x, y] = at(111.5, -5.1); boat(c, x, y + Math.sin(t * 3) * 6, 190, PROT, env(t, 50.85, 52.75)); }
  // S13 plates: arrows + volcanoes
  if (t > 59.3 && t < 62.5) {
    const s = env(t, 59.4, 62.4), push = Math.sin(t * 5) * 10;
    for (const [lon0, lat0, lon1, lat1] of [[99.5, -19.5, 99.5, -14], [132.5, -19.5, 132.5, -14.5], [143, 5, 138.5, 3.6]]) { const [x0, y0] = at(lon0, lat0), [x1, y1] = at(lon1, lat1), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); arrow(c, x0 + dx / L * push, y0 + dy / L * push, x1 + dx / L * push, y1 + dy / L * push, 46, '#fff', s); }
  }
  if (t > 59.9 && t < 66) VOLC.forEach(([lon, lat], i) => { const [x, y] = at(lon, lat); volcano(c, x, y + 10, 62, t, 60 + i * .13, env(t, 60 + i * .13, 65.95)); });
  // S14 deep sea callout
  { const s = env(t, 63.6, 65.5); if (s > 0) { const [x, y] = at(127.8, -5.7); arrow(c, x, y, x, y + 140, 30, '#fff', s); txt(c, '> 7.000 m', x, y + 220, { size: 92, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 8, sc: s }); } }
  // S15 pulse + group
  { const p = pr(t, 65.8, 66.9); if (p > 0 && p < 1) { const [x, y] = at(118, -2.5); c.save(); c.globalAlpha = 1 - p; c.strokeStyle = '#fff'; c.lineWidth = 10; c.shadowColor = 'rgba(160,210,255,.9)'; c.shadowBlur = 30; c.beginPath(); c.ellipse(x, y, 120 + p * 520, 60 + p * 260, 0, 0, TAU); c.stroke(); c.restore(); } }
  if (t > 70.2 && t < 71.9) for (const [i, who, lon, lat] of [[0, PROT, 110.4, -7.1], [1, HIJAB, 101.6, .3], [2, PECI, 114, .8], [3, PAPUA, 138.6, -4.4]]) { const [x, y] = at(lon, lat); drawChar(c, x, y, 160, { ...who, expr: 'happy' }, env(t, 70.3 + i * .14, 71.8)); }
  // S16 Java Sea finale
  if (t > 72.4) { const [x, y] = at(108.6, -4.8); boat(c, x, y + Math.sin(t * 3) * 7, 230, { ...PROT, expr: t > 76.2 ? 'happy' : 'neutral' }, env(t, 72.45)); }
  if (t > 73.2) { const a = win(t, 73.2, 99); for (const [lon, lat] of [[105.8, -4.2], [115, -5.1], [111.2, -3.7]]) { const [x, y] = at(lon, lat); waves(c, x, y, 140, t, a * .9); } }
  { const s = env(t, 74.0, 75.3); if (s > 0) { const [x0, y0] = at(113.8, -6.6), [x1, y1] = at(113.8, -3.5), mx = (x0 + x1) / 2, my = (y0 + y1) / 2; arrow(c, mx, my, x0, y0 + 10, 28, '#fff', s); arrow(c, mx, my, x1, y1 - 10, 28, '#fff', s); } }
  { const a = win(t, 76.1, 99, .1, .1); if (a > 0) { const [x, y] = at(110.3, -3.6); c.save(); c.globalAlpha = a; yellowEllipse(c, x, y, 380, 250, -.1, pr(t, 76.1, 76.6)); c.restore(); txt(c, 'dulunya daratan!', x - 150, y - 330, { size: 76, col: YEL, weight: 600, sc: env(t, 76.3) }); } }
  { const s = env(t, 76.5); if (s > 0) { const [x, y] = at(108.6, -4.8), [bx0] = at(110.3, -3.6); bubble(c, bx0 + 230, y - 790, 220, 165, x + 20, y - 250, s, (cc, bx, by, bw, bh) => miniMap(cc, bx, by, bw, bh, { lon: 111, lat: -2, k: 650 }, { labels: [], fills: [], shelf: 1, ghost: 0, ice: 0, flood: 0, sundaHi: .85, sahulHi: .85 })); } }
}
function drawScene(c, t) {
  if (t >= 24.8 && t < 30.5) { drawXsec(c, t); return; }
  const cam = camAt(t); drawMapScene(c, t, cam);
  // S3 close-up with thought bubble (islands merging)
  if (t > 4.3 && t < 6.65) {
    const y = lerp(2700, 1960, outC(pr(t, 4.32, 4.55))) + lerp(0, 900, io(pr(t, 6.35, 6.65)));
    drawChar(c, 330, y, 1060, { ...PROT, expr: 'worried' });
    const s = env(t, 4.5, 6.3);
    bubble(c, 610, 480, 380, 290, 470, y - 1050, s, (cc, bx, by, bw, bh) => miniMap(cc, bx, by, bw, bh, { lon: 118, lat: -2.5, k: 900 }, { labels: [], fills: [F('indo', RED, 1)], shelf: 0, ghost: 0, ice: 0, flood: 0, merge: io(pr(t, 4.9, 5.9)) * 70 }));
  }
}

// ---------- compositing ----------
let ACC = null, TMP = null;
function camSpeed(t) { const a = camAt(t), b = camAt(t - 1 / FPS); return Math.abs((a.lon - b.lon) * D2R * a.k) + Math.abs((mY(a.lat) - mY(b.lat)) * a.k) + Math.abs(Math.log(a.k / b.k)) * 900; }
export function renderFrame(c, t) {
  if (!ACC) { ACC = cv(W, H); TMP = cv(W, H); }
  const mapMode = !(t >= 24.8 && t < 30.5), sp = mapMode ? camSpeed(t) : 0;
  if (sp > 22) { // motion blur: average sub-frames
    const n = sp > 70 ? 5 : 3, a = ACC.getContext('2d');
    for (let i = 0; i < n; i++) { drawScene(a, t - i / FPS / n * 1.2); c.globalAlpha = 1 / (i + 1); c.drawImage(ACC, 0, 0); }
    c.globalAlpha = 1;
  } else drawScene(c, t);
  const tg = TMP.getContext('2d');
  // rewind / fast-forward grade
  const rw = win(t, 19.45, 20.85, .15, .25), ff = win(t, 68.95, 70.2, .1, .15), g = Math.max(rw, ff);
  if (g > 0) { tg.clearRect(0, 0, W, H); tg.drawImage(c.canvas, 0, 0); c.save(); c.filter = `sepia(${.75 * g}) blur(${2.2 * g}px) brightness(${1 - .12 * g})`; c.drawImage(TMP, 0, 0); c.restore(); }
  // zoom-blur into / out of the cross-section
  const zb = Math.max(pr(t, 24.45, 24.8) * (t < 24.8 ? 1 : 0), (1 - pr(t, 24.8, 25.1)) * (t >= 24.8 && t < 25.1 ? 1 : 0), pr(t, 30.2, 30.5) * (t < 30.5 && t > 30.2 ? 1 : 0), (1 - pr(t, 30.5, 30.85)) * (t >= 30.5 && t < 30.85 ? 1 : 0));
  if (zb > 0) { tg.clearRect(0, 0, W, H); tg.drawImage(c.canvas, 0, 0); for (let i = 1; i <= 6; i++) { const s = 1 + zb * .045 * i; c.globalAlpha = .32; c.drawImage(TMP, W / 2 - W * s / 2, H * .45 - H * s / 2, W * s, H * s); } c.globalAlpha = 1; }
  // paper grain + vignette
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .2; c.fillStyle = c.createPattern(TEX, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
  const vg = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${.32 + .3 * g})`); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  chevrons(c, -1, rw, t); chevrons(c, 1, ff, t);
  drawCaption(c, t);
}
