
// =====================================================================
// JUDUL VIDEO — story (tempel ke engine.js lewat build.sh)
// Salin pola dari examples/ kalau butuh scene sejenis. Nama di engine tidak boleh dideklarasi ulang.
// =====================================================================
export const DUR = 10.0; // durasi VO dalam detik, dari words.json

// ---------- cast (karakter video ini) ----------
const PROT = { skin: '#d9a07a', hair: 'fringe', shirt: '#8a4b25', pattern: '#ecc88f' }; // narator seri, jangan diganti

// ---------- captions: kata persis VO; '!' = highlight (maks 3 kata); '|n' = bobot durasi lisan ----------
// [mulai, selesai, [potongan...]] — mulai/selesai diambil dari words.json, potong di jeda kalimat
const PHRASES = [
  [0.1, 2.0, ['Ini contoh', '!KATA PENTING']],
  [2.4, 5.0, ['tahun', '!1602|27', 'dibaca lebih panjang']],
  [5.4, 8.0, ['jadi bobotnya', 'dinaikkan']],
  [8.4, 9.9, ['!FOLLOW', 'biar nggak', '!KETINGGALAN!']],
];
export const CAPS = [];
PHRASES.forEach(([s, e, chunks], pi) => {
  const parsed = chunks.map(ch => { const hl = ch[0] === '!', [txt0, wt] = (hl ? ch.slice(1) : ch).split('|'); return { text: txt0, hl, w: (wt ? +wt : txt0.length) + 4 }; });
  const total = parsed.reduce((n, x) => n + x.w, 0); let acc = s; const next = PHRASES[pi + 1] ? PHRASES[pi + 1][0] : DUR;
  parsed.forEach((p, i) => { const d = (e - s) * p.w / total; CAPS.push({ s: acc, e: i === parsed.length - 1 ? Math.min(next, e + .6) : acc + d, text: p.text, hl: p.hl }); acc += d; });
});
const capStart = (text, from = 0) => (CAPS.find(q => q.text.startsWith(text) && q.s >= from) || { s: 0 }).s;
// momen kunci dibaca dari caption, supaya visual jatuh tepat di katanya
const T_KUNCI = capStart('KATA PENTING');
function drawCaption(c, t) {
  const cap = CAPS.find(q => t >= q.s && t < q.e); if (!cap) return;
  if (cap.hl) txt(c, cap.text, W / 2, 1385, { size: cap.text.length > 24 ? 54 : 64, font: SANS, weight: 700, col: YEL, stroke: INK, sw: 10, sc: back(pr(t, cap.s, cap.s + .2)) });
  else txt(c, cap.text, W / 2, 1385, { size: 54, font: SANS, weight: 700, stroke: INK, sw: 7, a: pr(t, cap.s, cap.s + .1) });
}

// ---------- camera untuk scene peta: [waktu, lon, lat, zoom k, ease] ----------
// ease: 'l' drift pelan, 'io' terbang, 'in' zoom cepat, 'out' mendarat, 'h' lompat (pakai saat scene peta baru mulai)
const CAM = [
  [0, 108, 5, 600, 'l'], [1.4, 106.8, -6.2, 5000, 'in'], [5.0, 106.8, -6.2, 5400, 'l'],
  [8.0, 118, -2.5, 1150, 'h'], [10.5, 118, -2.5, 1000, 'l'],
];
const EASE = { l: x => x, io, in: x => x * x * x, out: outC, h: () => 1 };
export function camAt(t) {
  let i = 1; while (i < CAM.length - 1 && CAM[i][0] < t) i++;
  const a = CAM[i - 1], b = CAM[i], p = EASE[b[4]](pr(t, a[0], b[0]));
  return { lon: lerp(a[1], b[1], p), lat: lerp(a[2], b[2], p), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)) };
}

// ---------- isi peta ----------
// dipanggil drawMap setelah fill negara, sebelum label: tempat wilayah custom, garis rute, dll
function mapExtra(c, P, cam, w, h, st, pat, olw, t) {
  for (const [ring, col, a] of st.regions || []) { // wilayah custom (toRing) yang dipotong mengikuti daratan
    if (a <= 0) continue; c.save(); c.beginPath(); pathRings(c, cam.k < 700 || cam.lon < 88 ? LANDW : LANDR, cam, w, h); c.clip('evenodd');
    c.beginPath(); pathRings(c, [ring], cam, w, h); c.globalAlpha = a; c.fillStyle = col; c.fill(); c.lineWidth = olw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.restore();
  }
}
function mapState(t) {
  const st = { labels: [], fills: [], shelf: 0, ghost: 0, ice: 0, flood: 0, deep: 0, wallace: 0, plates: 0, regions: [] };
  const L = (s, lon, lat, a, o) => { if (a > 0) st.labels.push([s, lon, lat, a, o]); };
  // gid(kode ISO numerik) mengambil negara mana pun, mis. '360' Indonesia, '840' AS, '250' Prancis
  st.fills.push({ rs: gid('360'), col: RED, a: pr(t, 1.2, 1.6) });
  L('Indonesia', 118, -10.6, pr(t, 8.2, 8.6), { size: 70, weight: 600 });
  return st;
}
function mapScene(c, t) {
  const cam = camAt(t), st = mapState(t), P = drawMap(c, W, H, cam, st, t);
  const [x, y] = P(106.8, -6.2); drawChar(c, x, y + 40, 300, { ...PROT, expr: 'smug' }, env(t, 1.5, 5.2));
  if (t > 8.2) { const yy = lerp(2500, 1960, outC(pr(t, 8.3, 8.55))); drawChar(c, 540, yy, 760, { ...PROT, expr: 'happy' }); followUI(c, t, 8.4); }
}

// ---------- kartu Follow: kirim logo channel ke LOGO kalau sudah ada, kalau belum pakai wajah narator ----------
const LOGO = null; // isi dengan Image yang sudah dimuat, lihat references/produksi.md
function followUI(c, t, t0, cy = 560) {
  const s = env(t, t0); if (s <= 0) return; c.save(); c.translate(W / 2, cy); c.scale(s, s);
  c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.fillStyle = 'rgba(255,255,255,.96)'; c.beginPath(); c.roundRect(-400, -130, 800, 260, 60); c.fill(); c.shadowColor = 'transparent';
  c.save(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.fillStyle = '#e8d8b5'; c.fill(); c.clip(); if (LOGO) c.drawImage(LOGO, -352, -92, 184, 184); else drawChar(c, -260, 260, 380, PROT); c.restore(); c.beginPath(); c.arc(-260, 0, 92, 0, TAU); c.lineWidth = 7; c.strokeStyle = INK; c.stroke();
  const on = t > t0 + .8; c.beginPath(); c.roundRect(-130, -62, 360, 124, 62); c.fillStyle = on ? '#3a3a3a' : '#e8322c'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  txt(c, on ? 'Following ✓' : 'Follow', 50, 2, { size: 58, font: SANS, weight: 700, shadow: false, sc: on ? 1 : 1 + .06 * Math.max(0, Math.sin(t * 9)) });
  c.save(); c.translate(320, -10); c.rotate(on ? Math.sin(t * 22) * .3 * (1 - pr(t, t0 + .8, t0 + 1.5)) : 0); c.beginPath(); c.moveTo(-30, 30); c.quadraticCurveTo(-30, -38, 0, -40); c.quadraticCurveTo(30, -38, 30, 30); c.closePath(); c.fillStyle = '#f2c43a'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, 38, 9, 0, TAU); c.fill(); c.stroke(); c.restore();
  c.restore();
  const gp = pr(t, t0 + .25, t0 + .7), b2 = pr(t, t0 + .85, t0 + 1.2); drawGlove(c, W / 2 + 120 + lerp(240, 0, outC(gp)) + b2 * 200, cy + lerp(320, 70, outC(gp)) + b2 * 260 + (t > t0 + .7 && t < t0 + .85 ? 14 : 0), 140, -.5, env(t, t0 + .2, 99));
}

// ---------- scene plate (ilustrasi non-peta) ----------
function contohPlate(c, t) {
  plateSky(c, '#78acd6', '#e6eef0', 980, t); plateSea(c, 980, H, t);
  galleon(c, lerp(1500, 540, outC(pr(t, 5, 6.6))), 1250, 420, t, { flag: 'nl' });
  bigText(c, '1602', W / 2, 400, { size: 220, stroke: INK, sw: 10, sc: env(t, 5.4) });
}

// ---------- daftar scene: [mulai, selesai, fungsi, transisi ke scene berikutnya] ----------
// transisi: 'whip' geser cepat, 'zoom' fast zoom, 'cut' potong langsung, 'none' untuk scene terakhir
const SCENES = [[0, 5, mapScene, 'whip'], [5, 8, contohPlate, 'zoom'], [8, 99, mapScene, 'none']];
const SHAKES = [[T_KUNCI, T_KUNCI + .4, 12]]; // [mulai, selesai, kekuatan px] untuk momen impact
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
  else { const sa = 1 + p * .8, sb = .6 + .4 * p; c.drawImage(BUF_A, W / 2 * (1 - sa), H * .45 * (1 - sa), W * sa, H * sa); c.globalAlpha = p; c.drawImage(BUF_B, W / 2 * (1 - sb), H * .45 * (1 - sb), W * sb, H * sb); c.globalAlpha = 1;
    for (let k = 1; k <= 4; k++) { const s = 1 + Math.sin(p * Math.PI) * .04 * k; c.globalAlpha = .18; c.drawImage(c.canvas, W / 2 * (1 - s), H * .45 * (1 - s), W * s, H * s); } c.globalAlpha = 1; }
}

// ---------- suara: SFX + musik pelan yang turun saat narator bicara ----------
const MUSIC = true; // false kalau brief tidak mau musik
export function sfx(sr, n, vo) {
  const out = new Float32Array(n), R = rng(63);
  const add = (t0, dur, f) => { const i0 = Math.max(0, Math.floor(t0 * sr)), i1 = Math.min(n, Math.floor((t0 + dur) * sr)); for (let i = i0; i < i1; i++) out[i] += f((i - i0) / sr); };
  const boom = (t0, amp, len = 1.6) => { let ph = 0; add(t0, len, x => { const f = lerp(70, 34, Math.min(1, x / .6)); ph += TAU * f / sr; return amp * Math.sin(ph) * Math.exp(-x * 2.6); }); };
  const thud = (t0, amp) => { let ph = 0; add(t0, .35, x => { ph += TAU * lerp(140, 60, x / .35) / sr; return amp * Math.sin(ph) * Math.exp(-x * 11); }); };
  const whoosh = (t0, amp) => { let lp = 0, bp = 0; add(t0 - .18, .42, x => { const e = Math.sin(Math.PI * x / .42) ** 2, k = .02 + .3 * Math.sin(Math.PI * x / .42); lp += k * ((R() * 2 - 1) - lp); bp += .5 * (lp - bp); return amp * e * (lp - bp) * 3; }); };
  const clink = (t0, amp) => add(t0, .25, x => amp * (Math.sin(TAU * 2600 * x) + .5 * Math.sin(TAU * 3900 * x)) * Math.exp(-x * 22));
  const water = (t0, dur, amp) => { let lp = 0; add(t0, dur, x => { lp += .06 * ((R() * 2 - 1) - lp); return amp * lp * 2 * Math.min(1, x * 3, (dur - x) * 3); }); };
  SCENES.slice(1).forEach(([a], i) => { if (!['cut', 'none'].includes(SCENES[i][3])) whoosh(a, .06); });
  boom(T_KUNCI, .25); thud(T_KUNCI, .2);
  if (MUSIC) {
    const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 164.8, 196], [196, 246.9, 293.7]], bar = 3.6, gain = .045; let env = 0; const k = Math.exp(-1 / (sr * .12));
    for (let i = 0; i < n; i++) {
      const x = i / sr, ci = Math.floor(x / bar) % 4, cx = (x % bar) / bar, ch = chords[ci], att = Math.min(1, cx * 4) * Math.min(1, (1 - cx) * 6 + .35);
      let s = 0; for (const f of ch) s += Math.sin(TAU * f * x) * .5 + Math.sin(TAU * f * 1.003 * x) * .5;
      s = s / 3 * att + .6 * Math.sin(TAU * ch[0] / 2 * x) * att;
      const v = vo ? Math.abs(vo[i]) : 0; env = Math.max(v, env * k);
      out[i] += s * gain * (1 - .6 * Math.min(1, env / .12)) * Math.max(0, Math.min(1, x / 1.5, (DUR - x) / 1.5));
    }
  }
  return out;
}

// ---------- compositing (jarang perlu diubah) ----------
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
