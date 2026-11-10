// Basic style 1 — shared engine: parchment map, chibi cast, props, wardrobe. A video = this file + its own story.js (see build.sh).
import * as topojson from 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm';

export const W = 1080, H = 1920, FPS = 30;
const D2R = Math.PI / 180, TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const outC = t => 1 - Math.pow(1 - t, 3);
const pr = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const back = p => { if (p <= 0) return 0; if (p >= 1) return 1; const c1 = 1.9, c3 = c1 + 1, q = p - 1; return 1 + c3 * q * q * q + c1 * q * q; };
// scale envelope: pops in at a (overshoot), shrinks out before b
const env = (t, a, b = 1e9, din = .28, dout = .18) => (t < a || t > b) ? 0 : Math.min(back(pr(t, a, a + din)), 1 - io(pr(t, b - dout, b)));
// alpha envelope
const win = (t, a, b = 1e9, din = .3, dout = .3) => Math.min(pr(t, a, a + din), 1 - pr(t, b - dout, b));

// ---------- palette (from the style bible) ----------
const SEA = '#5c7b7e', LAND = '#a59875', COAST = '#6b6250', INK = '#151111';
const RED = '#be3c30', ORANGE = '#c57322', GREEN = '#35791c', PERI = '#798eb9', YEL = '#f5e50a';
const SERIF = '"EB Garamond", Georgia, serif', SANS = 'Roboto, "Segoe UI", sans-serif';

// ---------- geography ----------
const mY = lat => Math.log(Math.tan(Math.PI / 4 + clamp(lat, -85, 85) * D2R / 2));
function toRing(coords, id) {
  const n = coords.length, p = new Float64Array(n * 2);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, sx = 0, sy = 0, off = 0, prev = coords[0][0];
  for (let i = 0; i < n; i++) {
    // unwrap rings that jump across the antimeridian, otherwise they draw a band across the whole map
    const raw = coords[i][0], d = raw - prev; if (d > 180) off -= 360; else if (d < -180) off += 360; prev = raw;
    const lon = raw + off, x = lon * D2R, y = mY(coords[i][1]);
    p[2 * i] = x; p[2 * i + 1] = y;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    sx += lon; sy += coords[i][1];
  }
  return { p, bb: [x0, y0, x1, y1], lon: sx / n, lat: sy / n, span: (x1 - x0) / D2R, id, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function featRings(f) {
  const g = f.geometry; if (!g) return [];
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  const out = [];
  for (const poly of polys) for (const ring of poly) out.push(toRing(ring, String(f.id)));
  return out;
}
function classify(r) {
  const { lon, lat, id } = r, inB = (a, b, c, d) => lon >= a && lon <= b && lat >= c && lat <= d, g = [];
  if (id === '360') {
    g.push('indo');
    if (inB(94.5, 106.3, -6.3, 6.2)) g.push('sumatra');
    else if (inB(105, 114.9, -9.2, -5.6)) g.push('jawa');
    else if (inB(108.5, 119.6, -4.6, 7.6)) g.push('kalimantan');
    else if (inB(118.5, 125.6, -6.8, 2.2)) g.push('sulawesi', 'wallacea');
    else if (inB(115.7, 127.6, -11.2, -7.7)) g.push('nusra', 'wallacea');
    else if (lon >= 130.3 && lat < 1 && lat > -9.5 && (r.span > 1.5 || lon > 134.9 || lat > -2.5)) g.push('papua');
    else if (inB(124.5, 135.2, -8.5, 3)) g.push('maluku', 'wallacea');
  }
  if ((id === '458' || id === '096') && inB(108.5, 119.6, -4.6, 7.6)) g.push('kalimantan');
  if (id === '626') g.push('wallacea');
  if (id === '036') g.push('australia');
  if (id === '010') g.push('antarctica');
  return g;
}
const SUNDA = [[98.6, 13.8], [100.2, 13.3], [100.9, 12.6], [102.5, 11.6], [104.5, 10.4], [105.5, 8.6], [107, 9.2], [108.7, 10.6], [109.4, 11.2], [109.6, 9.6], [109.2, 8.0], [110.5, 7.4], [112.5, 6.6], [114, 6.6], [115.4, 6.9], [116.6, 7.6], [117.4, 7.2], [118.2, 5.8], [119.3, 5.2], [118.7, 4.0], [118.4, 2.0], [119.0, .8], [118.6, -.8], [117.4, -2.6], [116.6, -3.6], [116.3, -5.0], [115.9, -7.0], [115.75, -8.5], [115.2, -9.0], [114.2, -8.9], [112, -8.7], [110, -8.4], [107.5, -7.9], [105.9, -7.1], [105.0, -6.9], [104.2, -6.3], [102.8, -5.2], [101.2, -3.9], [100.1, -2.5], [99.2, -1.2], [98.2, .2], [97.2, 1.4], [96.1, 2.6], [95.1, 4.5], [94.9, 5.8], [95.6, 6.5], [97.2, 7.4], [97.9, 8.6], [98.2, 10.5], [98.4, 12.0], [98.6, 13.8]];
const SAHUL = [[131.2, -8.2], [132.6, -6.9], [134.0, -5.6], [136, -6.3], [138.2, -7.6], [140.5, -8.6], [142.8, -9.2], [144.6, -9.0], [145.2, -10.5], [143.8, -11.8], [142.4, -11.2], [141.6, -13.5], [141.5, -16.5], [139.5, -17.5], [137, -16], [135.6, -14.3], [136.8, -12.3], [134, -11.6], [131.5, -11.1], [129.6, -11.3], [128.2, -12.4], [126.4, -13.2], [125.2, -11.2], [126.8, -10.2], [128.6, -9.4], [130, -9.2], [131.2, -8.2]];
const ICE = [
  [[-8, 56], [-2, 52], [5, 53], [12, 52.5], [20, 52], [28, 53], [34, 56], [42, 60], [52, 62], [60, 64], [68, 66], [80, 70], [95, 74], [100, 78], [80, 81], [55, 81], [30, 80], [15, 78], [5, 72], [-5, 64], [-10, 58], [-8, 56]],
  [[-30, 74], [200, 74], [200, 85], [-30, 85]],
  [[78, 36], [84, 33.5], [90, 31.5], [96, 31], [100, 33], [96, 36], [88, 37], [80, 37.5]],
];
const BANDA = [[124.5, -5], [125.5, -6.8], [127.5, -7.3], [129.8, -6.6], [131, -5.3], [130.5, -4.3], [128.5, -4.3], [126.5, -4.6], [124.5, -5]];
const MAKASSAR = [[118.3, 1.5], [119.2, .8], [119.2, -1.5], [118.8, -3.6], [118.2, -4.2], [117.9, -2.8], [118.0, -.5], [118.3, 1.5]];
const WALLACE = [[114.5, -10], [115.8, -8.6], [116.8, -5], [118, -2], [118.9, 1], [119.5, 4], [120, 6], [121.5, 7.5]];
const PLATES = [
  [[92.5, 12], [93.0, 8], [94.2, 4.5], [95.8, 2], [97.6, -1], [99.8, -3.8], [102.2, -6.6], [105, -8.6], [108, -9.9], [111, -10.5], [114, -10.9], [117, -11.1], [120, -11], [123, -10.6], [125.5, -10.2], [127.6, -9.4], [129.8, -8.2], [131.3, -6.8], [132.2, -5.2], [131.4, -3.9], [129.6, -3.3], [128, -3.2]],
  [[126, 4.5], [128.5, 2.5], [131, .5], [134, -.3], [137.5, -1.2], [141, -2.2], [145, -3.8], [149, -5.5]],
  [[126.8, 2], [127.2, 5.5], [126.6, 9], [125.9, 12]],
];
const VOLC = [[98.4, 3.2], [101.3, -1.7], [103.6, -4.0], [105.4, -6.1], [107.7, -7.2], [110.4, -7.5], [112.9, -8.1], [115.5, -8.3], [116.5, -8.4], [118.0, -8.25], [121.7, -8.6], [125.4, 3.4], [127.9, 1.7], [124.8, 1.3]];

let ALLC = [], REGION = [], LANDR = [], LANDW = [], GROUP = {}, SHELF = [], DEEPR = [], TEX = null, MINI = null;
// ice sheets at size e (0 = gone, 1 = glacial maximum); arctic edge retreats north, sheets shrink to their cores
function iceRings(e) {
  const arc = [], amp = .3 + .9 * e; for (let lon = -40; lon <= 220; lon += 3) arc.push([lon, lerp(83, 70.5, e) + (Math.sin(lon * .11) * .8 + Math.sin(lon * .05 + 1) * .7) * amp]);
  arc.push([220, 86], [-40, 86]);
  const sc = (poly, cx, cy) => poly.map(([x, y]) => [cx + (x - cx) * e, cy + (y - cy) * e]);
  return [toRing(arc, 'ice'), toRing(sc(ICE[0], 40, 66), 'ice'), toRing(sc(ICE[2], 89, 34), 'ice')];
}

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function makeTexture() {
  const S = 512, half = cv(S, S), g = half.getContext('2d'), R = rng(11);
  g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
  for (const [n, a] of [[6, .35], [24, .28], [96, .22], [384, .16]]) {
    const s = cv(n, n), sg = s.getContext('2d'), id = sg.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = 150 + R() * 105; id.data[4 * i] = v; id.data[4 * i + 1] = v * .97; id.data[4 * i + 2] = v * .9; id.data[4 * i + 3] = 255; }
    sg.putImageData(id, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.imageSmoothingEnabled = true; g.drawImage(s, 0, 0, S, S);
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 26; i++) {
    const x = R() * S, y = R() * S, r = 20 + R() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(120,90,50,${.05 + R() * .08})`); gr.addColorStop(1, 'rgba(120,90,50,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
  // mirror into a seamless 1024 tile
  const full = cv(S * 2, S * 2), f = full.getContext('2d');
  f.drawImage(half, 0, 0); f.save(); f.translate(S * 2, 0); f.scale(-1, 1); f.drawImage(half, 0, 0); f.restore();
  f.save(); f.translate(0, S * 2); f.scale(1, -1); f.drawImage(full, 0, 0, S * 2, S, 0, 0, S * 2, S); f.restore();
  return full;
}

export async function init() {
  const base = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/';
  const [t10, t50] = await Promise.all([fetch(base + 'countries-10m.json').then(r => r.json()), fetch(base + 'countries-50m.json').then(r => r.json())]);
  for (const f of topojson.feature(t10, t10.objects.countries).features) for (const r of featRings(f)) {
    ALLC.push(r); const lo = r.bb[0] / D2R, hi = r.bb[2] / D2R;
    if (hi < 60 || lo > 175) continue;
    r.g = classify(r); REGION.push(r);
    for (const k of r.g) (GROUP[k] = GROUP[k] || []).push(r);
  }
  // base land comes from the merged land object, so no country borders show (the reference map has none)
  for (const r of featRings({ id: 'land', geometry: topojson.feature(t10, t10.objects.land).geometry || topojson.merge(t10, t10.objects.land.geometries) })) {
    if (r.bb[2] / D2R < 60 || r.bb[0] / D2R > 175) continue; LANDR.push(r);
  }
  const lw = topojson.feature(t50, t50.objects.land); for (const f of (lw.features || [lw])) for (const r of featRings({ id: 'land', geometry: f.geometry })) { LANDW.push(r); if (r.lat < -60) (GROUP.antW = GROUP.antW || []).push(r); }
  SHELF = [toRing(SUNDA, 'sunda'), toRing(SAHUL, 'sahul')];
  DEEPR = [toRing(BANDA, 'banda'), toRing(MAKASSAR, 'mak')];
  TEX = makeTexture();
  MINI = cv(800, 640);
  await document.fonts.load(`500 40px ${SERIF}`); await document.fonts.load(`600 40px ${SERIF}`);
  await document.fonts.load(`500 40px ${SANS}`); await document.fonts.load(`700 40px ${SANS}`);
  return { region: REGION.length, landR: LANDR.length, landW: LANDW.length, groups: Object.fromEntries(Object.entries(GROUP).map(([k, v]) => [k, v.length])) };
}

function pathRings(c, rings, cam, w, h, shrink = 1) {
  const cx = cam.lon * D2R, cy = mY(cam.lat), k = cam.k, m = 60;
  const vx0 = cx - (w / 2 + m) / k, vx1 = cx + (w / 2 + m) / k, vy0 = cy - (h / 2 + m) / k, vy1 = cy + (h / 2 + m) / k;
  const offs = [0]; if (vx1 > Math.PI) offs.push(TAU); if (vx0 < -Math.PI) offs.push(-TAU);
  for (const r of rings) for (const off of offs) {
    const b = r.bb;
    if (b[2] + off < vx0 || b[0] + off > vx1 || b[3] < vy0 || b[1] > vy1) continue;
    if ((b[2] - b[0]) * k < 1.5 && (b[3] - b[1]) * k < 1.5) continue;
    const p = r.p, sx = v => shrink === 1 ? v : r.cx + (v - r.cx) * shrink, sy = v => shrink === 1 ? v : r.cy + (v - r.cy) * shrink;
    let lx = w / 2 + (sx(p[0]) + off - cx) * k, ly = h / 2 - (sy(p[1]) - cy) * k; c.moveTo(lx, ly);
    for (let i = 2; i < p.length; i += 2) {
      const x = w / 2 + (sx(p[i]) + off - cx) * k, y = h / 2 - (sy(p[i + 1]) - cy) * k;
      if (Math.abs(x - lx) + Math.abs(y - ly) > .9) { c.lineTo(x, y); lx = x; ly = y; }
    }
    c.closePath();
  }
}
function polyline(c, P, pts, prog = 1) {
  const s = pts.map(q => P(q[0], q[1])); let tot = 0; const L = [0];
  for (let i = 1; i < s.length; i++) { tot += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); L.push(tot); }
  const lim = tot * prog; c.beginPath(); c.moveTo(s[0][0], s[0][1]); const out = [s[0]];
  for (let i = 1; i < s.length; i++) {
    if (L[i] <= lim) { c.lineTo(s[i][0], s[i][1]); out.push(s[i]); }
    else { const f = (lim - L[i - 1]) / (L[i] - L[i - 1]); const x = lerp(s[i - 1][0], s[i][0], f), y = lerp(s[i - 1][1], s[i][1], f); c.lineTo(x, y); out.push([x, y]); break; }
  }
  return out;
}

// ---------- text ----------
function txt(c, s, x, y, o = {}) {
  const { size = 48, font = SERIF, weight = 500, col = '#fff', a = 1, rot = 0, align = 'center', stroke = null, sw = 0, shadow = true, sc = 1, italic = false } = o;
  if (a <= 0 || sc <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot * D2R); c.scale(sc, sc); c.globalAlpha *= clamp(a, 0, 1);
  c.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`; c.textAlign = align; c.textBaseline = 'middle';
  if (shadow) { c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = size * .2; c.shadowOffsetY = size * .05; }
  if (stroke) { c.lineWidth = sw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.strokeText(s, 0, 0); c.shadowColor = 'transparent'; }
  c.fillStyle = col; c.fillText(s, 0, 0); c.restore();
}
const mapLabel = (c, P, s, lon, lat, a, o = {}) => { const [x, y] = P(lon, lat); txt(c, s, x, y, { size: 50, col: 'rgba(255,255,255,.9)', a, ...o }); };

// ---------- map ----------
function texPattern(c, cam, w, h) {
  const pat = c.createPattern(TEX, 'repeat'), s = clamp(Math.pow(cam.k / 1200, .35), .55, 1.6);
  const ox = w / 2 - cam.lon * D2R * cam.k, oy = h / 2 + mY(cam.lat) * cam.k;
  pat.setTransform(new DOMMatrix().translate(ox % (1024 * s), oy % (1024 * s)).scale(s));
  return pat;
}
export function drawMap(c, w, h, cam, st, t) {
  const P = projector(cam, w, h), k = cam.k, zs = clamp(Math.pow(k / 1200, .3), .6, 1.4), rings = (k < 700 || cam.lon < 88) ? LANDW : LANDR;
  const pat = texPattern(c, cam, w, h), olw = 4.2 * zs * (w / W > .5 ? 1 : .6);
  c.fillStyle = SEA; c.fillRect(0, 0, w, h);
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .5; c.fillStyle = pat; c.fillRect(0, 0, w, h); c.restore();
  // deep sea
  if (st.deep > 0) { c.save(); c.filter = `blur(${16 * zs}px)`; c.globalAlpha = st.deep; c.fillStyle = '#0f2a3a'; c.beginPath(); pathRings(c, DEEPR, cam, w, h); c.fill(); c.restore(); }
  // exposed ice-age shelf
  if (st.shelf > 0) {
    c.save(); c.globalAlpha = st.shelf; c.beginPath(); pathRings(c, SHELF, cam, w, h); c.fillStyle = LAND; c.fill();
    c.save(); c.clip(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .55 * st.shelf; c.fillStyle = pat; c.fillRect(0, 0, w, h); c.restore();
    if (st.flood > 0) { // water creeping in from the shelf edge
      c.save(); c.clip(); c.lineJoin = 'round'; const L = st.flood * 640 * k / 1100;
      c.strokeStyle = 'rgba(235,245,240,.55)'; c.lineWidth = L + 14; c.stroke();
      c.strokeStyle = SEA; c.lineWidth = L; c.stroke();
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = .5; c.fillStyle = pat; c.lineWidth = L; c.strokeStyle = pat; c.stroke(); c.restore();
    }
    c.restore();
  }
  // land
  c.beginPath(); pathRings(c, rings, cam, w, h); c.fillStyle = LAND; c.fill('evenodd');
  c.save(); c.clip('evenodd'); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .6; c.fillStyle = pat; c.fillRect(0, 0, w, h); c.restore();
  if (st.shelf > .5 && st.flood < .9) { c.save(); c.setLineDash([7, 7]); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.8; c.stroke(); c.restore(); }
  else { c.strokeStyle = COAST; c.lineWidth = 1.2; c.stroke(); }
  // ice sheets
  if (st.ice > 0) {
    const e = clamp(st.ice, 0, 1) * (1 - .85 * (st.iceShrink || 0));
    c.save(); c.globalAlpha = .94 * Math.min(1, st.ice * 3); c.beginPath(); pathRings(c, iceRings(Math.max(e, .02)), cam, w, h); c.strokeStyle = '#8fb6c9'; c.lineWidth = 8; c.lineJoin = 'round'; c.stroke(); c.fillStyle = '#f3f7f8'; c.fill();
    if (GROUP.antW && k < 700) { c.beginPath(); pathRings(c, GROUP.antW, cam, w, h); c.globalAlpha = .9 * st.ice * (1 - .35 * (st.iceShrink || 0)); c.fill(); }
    c.restore();
  }
  // ghost outline of the old landmass
  if (st.ghost > 0) {
    c.save(); c.globalAlpha = st.ghost; c.beginPath(); pathRings(c, SHELF, cam, w, h);
    c.fillStyle = 'rgba(121,142,185,.32)'; c.fill(); c.setLineDash([14, 10]); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke(); c.restore();
  }
  // territory highlights
  const fill = (rs, col, a, wipe, outline = true) => {
    if (a <= 0 || !rs) return; c.save();
    if (wipe) { const [x, y] = P(wipe[0], wipe[1]); c.beginPath(); c.arc(x, y, Math.max(.1, wipe[2]), 0, TAU); c.clip(); }
    c.beginPath(); pathRings(c, rs, cam, w, h); c.globalAlpha = a; c.fillStyle = col; c.fill('evenodd');
    c.save(); c.clip('evenodd'); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .45 * a; c.fillStyle = pat; c.fillRect(0, 0, w, h); c.restore();
    if (outline) { c.lineWidth = olw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); }
    c.restore();
  };
  if (st.sundaHi > 0) fill([SHELF[0]], PERI, st.sundaHi, st.sundaWipe);
  if (st.sahulHi > 0) fill([SHELF[1]], PERI, st.sahulHi, st.sahulWipe);
  for (const f of st.fills) fill(f.rs || GROUP[f.g], f.col, f.a, f.wipe, f.outline !== false);
  // merge gag (islands swelling into one blob)
  if (st.merge > 0) { c.save(); c.beginPath(); pathRings(c, GROUP.indo, cam, w, h); c.lineJoin = 'round'; c.lineWidth = st.merge + olw * 2; c.strokeStyle = INK; c.stroke(); c.lineWidth = st.merge; c.strokeStyle = RED; c.stroke(); c.fillStyle = RED; c.fill('evenodd'); c.restore(); }
  // plate boundaries
  if (st.plates > 0) {
    c.save(); c.globalAlpha = st.plateA ?? 1; c.lineJoin = 'round'; c.lineCap = 'round';
    for (const pl of PLATES) {
      const pts = polyline(c, P, pl, st.plates); c.strokeStyle = '#2b201b'; c.lineWidth = 6 * zs; c.stroke();
      c.fillStyle = '#2b201b'; let acc = 0;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0); if (L < 1) continue;
        const ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = uy, ny = -ux;
        for (let d = (40 - acc % 40); d < L; d += 40) { const x = x0 + ux * d, y = y0 + uy * d, s = 11 * zs; c.beginPath(); c.moveTo(x - ux * s, y - uy * s); c.lineTo(x + ux * s, y + uy * s); c.lineTo(x + nx * s * 1.6, y + ny * s * 1.6); c.fill(); }
        acc += L;
      }
    }
    c.restore();
  }
  // Wallace line
  if (st.wallace > 0) { c.save(); c.globalAlpha = st.wallaceA ?? 1; polyline(c, P, WALLACE, st.wallace); c.setLineDash([18, 12]); c.lineWidth = 6 * zs; c.strokeStyle = INK; c.stroke(); c.lineWidth = 4 * zs; c.strokeStyle = YEL; c.stroke(); c.restore(); }
  mapExtra(c, P, cam, w, h, st, pat, olw, t);
  for (const L of st.labels) mapLabel(c, P, L[0], L[1], L[2], L[3], L[4] || {});
  return P;
}

// ---------- characters ----------
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function bodyPath(c) {
  c.beginPath(); c.moveTo(-.29, 0); c.bezierCurveTo(-.36, -.13, -.35, -.37, -.22, -.475); c.quadraticCurveTo(-.12, -.535, 0, -.535);
  c.quadraticCurveTo(.12, -.535, .22, -.475); c.bezierCurveTo(.35, -.37, .36, -.13, .29, 0); c.quadraticCurveTo(0, .035, -.29, 0); c.closePath();
}
function outlinedBlobs(c, circles, col, lw) { // union of circles with an outer outline only
  c.fillStyle = INK; c.beginPath(); for (const [x, y, r] of circles) { c.moveTo(x + r + lw, y); c.arc(x, y, r + lw, 0, TAU); } c.fill();
  c.fillStyle = col; c.beginPath(); for (const [x, y, r] of circles) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fill();
}
export function drawChar(c, x, y, h, o = {}, sc = 1) {
  if (sc <= .001) return; h *= sc; c.save(); c.translate(x, y); c.scale(h, h); if (o.flip) c.scale(-1, 1); if (o.rot) c.rotate(o.rot);
  const lw = __lw(c, .022, 2.6); c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = INK;
  if (!o.noShadow) { c.fillStyle = 'rgba(25,12,0,.28)'; c.beginPath(); c.ellipse(.03, .012, .4, .06, 0, 0, TAU); c.fill(); }
  // body
  bodyPath(c); const gb = c.createLinearGradient(-.34, 0, .34, 0); gb.addColorStop(0, shade(o.shirt, .2)); gb.addColorStop(.55, o.shirt); gb.addColorStop(1, shade(o.shirt, -.3)); c.fillStyle = gb; c.fill();
  if (o.pattern) {
    c.save(); c.clip(); c.fillStyle = o.pattern; c.globalAlpha = .6;
    for (let yy = -.52, row = 0; yy < .03; yy += .07, row++) for (let xx = -.38; xx < .4; xx += .085) { const ox = (row % 2) * .042; c.beginPath(); c.ellipse(xx + ox, yy, .021, .012, .7, 0, TAU); c.fill(); c.beginPath(); c.arc(xx + ox + .04, yy + .035, .007, 0, TAU); c.fill(); }
    c.restore();
  }
  c.save(); c.lineWidth = lw * .6; c.strokeStyle = 'rgba(20,10,10,.5)'; c.beginPath(); c.moveTo(-.08, -.515); c.lineTo(0, -.415); c.lineTo(.08, -.515); c.stroke();
  if (o.buttons) { c.fillStyle = 'rgba(20,10,10,.55)'; for (const yy of [-.33, -.22, -.11]) { c.beginPath(); c.arc(0, yy, .014, 0, TAU); c.fill(); } }
  c.restore();
  bodyPath(c); c.stroke(); bodyWear(c, o, lw);
  const hy = -.70;
  // neck shadow
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, -.47, .2, .045, 0, 0, TAU); c.fill();
  let fy = 0;
  const skinFill = (cx, cy, rx, ry) => { const g = c.createRadialGradient(cx - rx * .3, cy - ry * .35, rx * .1, cx, cy, rx * 1.1); g.addColorStop(0, shade(o.skin, .14)); g.addColorStop(.7, o.skin); g.addColorStop(1, shade(o.skin, -.16)); return g; };
  if (o.hat === 'hijab') {
    const hc = o.hijab || '#c95f7d';
    c.beginPath(); c.moveTo(-.39, -.40); c.lineTo(-.345, hy); c.ellipse(0, hy, .345, .315, 0, Math.PI, TAU); c.lineTo(.39, -.40); c.quadraticCurveTo(0, -.32, -.39, -.40); c.closePath();
    const g = c.createLinearGradient(-.35, 0, .35, 0); g.addColorStop(0, shade(hc, .18)); g.addColorStop(1, shade(hc, -.25)); c.fillStyle = g; c.fill(); c.stroke();
    fy = .035; c.beginPath(); c.ellipse(0, hy + fy, .235, .2, 0, 0, TAU); c.fillStyle = skinFill(0, hy + fy, .235, .2); c.fill(); c.stroke();
  } else {
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * .295, hy + .02, .05, .062, 0, 0, TAU); c.fillStyle = shade(o.skin, -.06); c.fill(); c.stroke(); }
    c.beginPath(); c.ellipse(0, hy, .30, .255, 0, 0, TAU); c.fillStyle = skinFill(0, hy, .3, .255); c.fill(); c.stroke();
  }
  // hair
  const hairCol = o.hairCol || '#1d1816';
  if (o.hair === 'fringe') {
    c.beginPath(); c.ellipse(0, hy, .315, .272, 0, Math.PI, TAU);
    for (const [px, py] of [[.315, .01], [.27, -.05], [.17, -.035], [.08, -.095], [-.02, -.06], [-.12, -.1], [-.21, -.05], [-.28, -.07], [-.315, .01]]) c.lineTo(px, hy + py);
    c.closePath(); const g = c.createLinearGradient(0, hy - .27, 0, hy); g.addColorStop(0, shade(hairCol, .25)); g.addColorStop(1, hairCol); c.fillStyle = g; c.fill(); c.stroke();
  } else if (o.hair === 'curly') {
    const cs = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; cs.push([Math.cos(a) * .29, hy - .02 + Math.sin(a) * .25, .068]); }
    cs.push([0, hy - .14, .2], [-.15, hy - .12, .1], [.15, hy - .12, .1]); outlinedBlobs(c, cs, '#221a17', lw);
  }
  // face
  const ey = hy + .015 + fy, my = hy + .1 + fy, ex = o.hat === 'hijab' ? .085 : .105, e = o.expr || 'neutral';
  c.fillStyle = 'rgba(230,110,100,.22)'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * (ex + .06), my - .03, .045, .025, 0, 0, TAU); c.fill(); }
  c.fillStyle = INK; c.strokeStyle = INK;
  if (e === 'happy') { c.lineWidth = lw * 1.2; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * ex, ey + .015, .03, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
  else if (e === 'smug') { for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * ex, ey, .027, .028, 0, 0, Math.PI); c.closePath(); c.fill(); c.lineWidth = lw * .8; c.beginPath(); c.moveTo(s * ex - .04, ey - .004); c.lineTo(s * ex + .04, ey - .004); c.stroke(); } }
  else { const big = e === 'shock' ? 1.3 : 1; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * ex, ey, .025 * big, .036 * big, 0, 0, TAU); c.fill(); } }
  if (e === 'worried') { c.lineWidth = lw * .8; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * (ex + .045), ey - .06); c.lineTo(s * (ex - .025), ey - .085); c.stroke(); } }
  c.lineWidth = lw * .9;
  if (e === 'happy') { c.beginPath(); c.moveTo(-.06, my - .015); c.quadraticCurveTo(0, my + .085, .06, my - .015); c.closePath(); c.fillStyle = '#5a1a1a'; c.fill(); c.stroke(); }
  else if (e === 'smug') { c.beginPath(); c.moveTo(-.045, my); c.quadraticCurveTo(.01, my + .028, .065, my - .018); c.stroke(); }
  else if (e === 'worried') { c.beginPath(); c.moveTo(-.04, my + .01); c.quadraticCurveTo(-.015, my - .012, .005, my + .005); c.quadraticCurveTo(.025, my + .02, .045, my); c.stroke(); }
  else if (e === 'shock') {
    c.beginPath(); c.ellipse(0, my + .2, .088, .23, 0, 0, TAU); c.fillStyle = '#4a0f12'; c.fill();
    c.save(); c.clip(); c.beginPath(); c.ellipse(0, my + .36, .07, .1, 0, 0, TAU); c.fillStyle = '#e06a78'; c.fill(); c.restore();
    c.beginPath(); c.ellipse(0, my + .2, .088, .23, 0, 0, TAU); c.lineWidth = lw; c.stroke();
  }
  else { c.beginPath(); c.moveTo(-.035, my); c.lineTo(.035, my); c.stroke(); }
  c.lineWidth = lw;
  // headwear
  if (o.hat === 'beanie') {
    c.beginPath(); c.ellipse(0, hy - .02, .325, .31, 0, Math.PI, TAU); c.closePath(); const g = c.createLinearGradient(-.3, 0, .3, 0); g.addColorStop(0, '#e0483d'); g.addColorStop(1, '#a3241c'); c.fillStyle = g; c.fill(); c.stroke();
    c.save(); c.lineWidth = lw * .5; c.strokeStyle = 'rgba(0,0,0,.25)'; for (let xx = -.24; xx <= .25; xx += .08) { c.beginPath(); c.moveTo(xx, hy - .06); c.lineTo(xx * .7, hy - .3); c.stroke(); } c.restore();
    c.beginPath(); c.roundRect(-.345, hy - .07, .69, .1, .045); c.fillStyle = '#efe7da'; c.fill(); c.stroke();
    outlinedBlobs(c, [[0, hy - .35, .07]], '#f6f1e8', lw);
  } else if (o.hat === 'akubra') {
    c.beginPath(); c.moveTo(-.2, hy - .19); c.lineTo(-.18, hy - .42); c.quadraticCurveTo(0, hy - .35, .18, hy - .42); c.lineTo(.2, hy - .19); c.closePath(); c.fillStyle = '#7a5232'; c.fill(); c.stroke();
    c.fillStyle = '#3b2a1c'; c.fillRect(-.2, hy - .27, .4, .06);
    c.beginPath(); c.ellipse(0, hy - .19, .5, .075, 0, 0, TAU); c.fillStyle = '#8a6440'; c.fill(); c.stroke();
  } else if (o.hat === 'peci') {
    c.beginPath(); c.moveTo(-.22, hy - .17); c.lineTo(-.19, hy - .34); c.quadraticCurveTo(0, hy - .37, .19, hy - .34); c.lineTo(.22, hy - .17); c.quadraticCurveTo(0, hy - .13, -.22, hy - .17); c.closePath();
    c.fillStyle = '#1c1c24'; c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = lw * .6; c.beginPath(); c.moveTo(-.15, hy - .3); c.quadraticCurveTo(0, hy - .325, .15, hy - .3); c.stroke(); c.strokeStyle = INK; c.lineWidth = lw;
  }
  extraWear(c, o, hy, lw);
  if (o.scarf) {
    c.beginPath(); c.roundRect(-.26, -.56, .52, .105, .05); c.fillStyle = '#c8302a'; c.fill(); c.stroke();
    c.beginPath(); c.roundRect(.08, -.5, .115, .25, .04); c.fill(); c.stroke();
    c.save(); c.strokeStyle = '#f2eadf'; c.lineWidth = lw * .9; for (const yy of [-.43, -.36, -.29]) { c.beginPath(); c.moveTo(.09, yy); c.lineTo(.185, yy); c.stroke(); } c.restore();
  }
  c.restore();
}
export function drawGlove(c, x, y, s, rot = 0, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const lw = __lw(c, .05, 2.5); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.fillStyle = '#fbfbfb';
  for (const fx of [-.17, 0, .17]) { c.beginPath(); c.roundRect(fx - .085, -.62, .17, .42, .085); c.fill(); c.stroke(); }
  c.save(); c.translate(-.27, -.08); c.rotate(-.7); c.beginPath(); c.roundRect(-.075, -.22, .15, .3, .075); c.fill(); c.stroke(); c.restore();
  c.beginPath(); c.ellipse(0, -.1, .3, .25, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.roundRect(-.25, .1, .5, .16, .06); c.fillStyle = '#ececec'; c.fill(); c.stroke();
  c.restore();
}

// ---------- props & fx ----------
function arrow(c, x0, y0, x1, y1, w, col = '#fff', sc = 1) {
  if (sc <= .001) return; const L = Math.hypot(x1 - x0, y1 - y0) * sc; if (L < 2) return; const a = Math.atan2(y1 - y0, x1 - x0);
  c.save(); c.translate(x0, y0); c.rotate(a); const hl = Math.min(w * 2.1, L * .6);
  c.beginPath(); c.moveTo(0, -w / 2); c.lineTo(L - hl, -w / 2); c.lineTo(L - hl, -w * 1.15); c.lineTo(L, 0); c.lineTo(L - hl, w * 1.15); c.lineTo(L - hl, w / 2); c.lineTo(0, w / 2); c.closePath();
  c.fillStyle = col; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 10; c.fill(); c.shadowColor = 'transparent'; c.lineWidth = Math.max(3, w * .14); c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.restore();
}
function volcano(c, x, y, s, t, t0, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .04, 2.5); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-.62, 0); c.quadraticCurveTo(-.32, -.25, -.17, -.72); c.lineTo(.17, -.72); c.quadraticCurveTo(.32, -.25, .62, 0); c.closePath();
  const g = c.createLinearGradient(-.6, 0, .6, 0); g.addColorStop(0, '#9a7656'); g.addColorStop(1, '#5a412f'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(-.12, -.72); c.quadraticCurveTo(-.05, -.45, -.18, -.3); c.quadraticCurveTo(-.02, -.4, .02, -.72); c.fill(); c.restore();
  c.beginPath(); c.moveTo(-.62, 0); c.quadraticCurveTo(-.32, -.25, -.17, -.72); c.lineTo(.17, -.72); c.quadraticCurveTo(.32, -.25, .62, 0); c.closePath(); c.stroke();
  c.beginPath(); c.ellipse(0, -.72, .17, .045, 0, 0, TAU); c.fillStyle = '#ff9a2a'; c.fill(); c.stroke();
  const dt = t - t0; for (let i = 0; i < 4; i++) { const p = ((dt * .55 + i * .25) % 1); c.globalAlpha = (1 - p) * .85; c.fillStyle = '#ddd6cc'; c.beginPath(); c.arc(Math.sin(i * 2 + dt) * .08, -.82 - p * .7, .1 + p * .16, 0, TAU); c.fill(); }
  c.restore();
}
function boat(c, x, y, s, who, sc = 1) {
  if (sc <= .001) return; s *= sc; drawChar(c, x - .12 * s, y - .02 * s, .78 * s, { ...who, noShadow: true });
  c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .022, 2.5); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(.22, -.05); c.lineTo(.22, -.95); c.stroke();
  c.beginPath(); c.moveTo(.25, -.92); c.lineTo(.25, -.18); c.lineTo(.68, -.24); c.closePath(); c.fillStyle = '#efe2c2'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.62, -.16); c.quadraticCurveTo(-.5, .13, 0, .15); c.quadraticCurveTo(.5, .13, .68, -.2); c.lineTo(.42, -.1); c.lineTo(-.4, -.1); c.closePath();
  const g = c.createLinearGradient(0, -.15, 0, .15); g.addColorStop(0, '#a76b35'); g.addColorStop(1, '#6b4220'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.fillStyle = '#c8302a'; c.fillRect(-.7, -.06, 1.4, .045); c.fillStyle = '#f3eee4'; c.fillRect(-.7, -.015, 1.4, .03); c.restore(); c.stroke();
  c.restore();
}
function ripple(c, x, y, p, r = 70) { if (p <= 0 || p >= 1) return; c.save(); c.globalAlpha = (1 - p) * .8; c.strokeStyle = '#eef6f2'; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y, r * p, r * p * .45, 0, 0, TAU); c.stroke(); c.restore(); }
function waves(c, x, y, wdt, t, a) { if (a <= 0) return; c.save(); c.globalAlpha = a; c.strokeStyle = '#f2f6f2'; c.lineWidth = 5; c.lineCap = 'round'; for (let r = 0; r < 2; r++) { c.beginPath(); for (let i = 0; i <= 24; i++) { const xx = x - wdt / 2 + i / 24 * wdt, yy = y + r * 26 + Math.sin(i * .9 + t * 5 + r) * 7; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); } c.restore(); }
function sun(c, x, y, r, t, sc) {
  if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(sc, sc);
  const g = c.createRadialGradient(0, 0, r * .3, 0, 0, r * 2.4); g.addColorStop(0, 'rgba(255,220,90,.55)'); g.addColorStop(1, 'rgba(255,220,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 2.4, 0, TAU); c.fill();
  c.rotate(t * .8); c.fillStyle = '#ffc93a'; c.strokeStyle = INK; c.lineWidth = 4;
  for (let i = 0; i < 10; i++) { c.rotate(TAU / 10); c.beginPath(); c.moveTo(-r * .18, -r * 1.05); c.lineTo(0, -r * 1.55); c.lineTo(r * .18, -r * 1.05); c.closePath(); c.fill(); c.stroke(); }
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#ffd84a'; c.fill(); c.stroke(); c.restore();
}
function cloudPath(c, cx, cy, rx, ry, pad) {
  c.beginPath(); const n = 12, r = Math.min(rx, ry) * .36 + pad;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, x = cx + Math.cos(a) * rx * .82, y = cy + Math.sin(a) * ry * .82; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }
  c.moveTo(cx + rx * .86 + pad, cy); c.ellipse(cx, cy, rx * .86 + pad, ry * .86 + pad, 0, 0, TAU);
}
function bubble(c, cx, cy, rx, ry, tx, ty, sc, inner) {
  if (sc <= .001) return; c.save(); c.translate(tx, ty); c.scale(sc, sc); c.translate(-tx, -ty);
  c.fillStyle = 'rgba(255,255,255,.96)'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 22;
  cloudPath(c, cx, cy, rx, ry, 10); c.fill();
  for (let i = 1; i <= 3; i++) { const f = i / 4, r = 26 - i * 6; c.beginPath(); c.arc(lerp(cx, tx, .55 + f * .45), lerp(cy + ry, ty, f), r, 0, TAU); c.fill(); }
  c.shadowColor = 'transparent'; c.save(); cloudPath(c, cx, cy, rx, ry, 0); c.clip(); inner(c, cx - rx * 1.2, cy - ry * 1.2, rx * 2.4, ry * 2.4); c.restore(); c.restore();
}
function miniMap(c, x, y, w, h, cam, st) {
  if (MINI.width !== Math.round(w) || MINI.height !== Math.round(h)) { MINI.width = Math.round(w); MINI.height = Math.round(h); }
  const m = MINI.getContext('2d'); drawMap(m, MINI.width, MINI.height, cam, st, 0); c.drawImage(MINI, x, y, w, h);
}
function chevrons(c, dir, a, t) {
  if (a <= 0) return; c.save(); c.globalAlpha = a; c.translate(W / 2, H * .42);
  for (let i = -1; i <= 1; i++) {
    const pulse = .55 + .45 * Math.max(0, Math.sin(t * 14 - i * dir * 1.2)); c.save(); c.translate(i * 120, 0); c.scale(dir, 1);
    c.beginPath(); c.moveTo(-55, -62); c.lineTo(55, 0); c.lineTo(-55, 62); c.closePath(); c.fillStyle = `rgba(255,255,255,${pulse})`; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 16; c.fill(); c.restore();
  }
  c.restore();
}
function yellowEllipse(c, x, y, rx, ry, rot, p) {
  if (p <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, -1.9, -1.9 + TAU * 1.04 * p);
  c.lineWidth = 9; c.strokeStyle = INK; c.lineCap = 'round'; c.globalAlpha = .35; c.stroke(); c.globalAlpha = 1; c.lineWidth = 6; c.strokeStyle = YEL; c.stroke(); c.restore();
}
function questionMark(c, x, y, s, sc) { txt(c, '?', x, y, { size: s, weight: 600, col: '#fff', stroke: INK, sw: s * .09, sc }); }
function snow(c, t, a) {
  if (a <= 0) return; const R = rng(5); c.save(); c.globalAlpha = a; c.fillStyle = '#fff';
  for (let i = 0; i < 70; i++) { const x0 = R() * W, sp = 120 + R() * 160, r = 3 + R() * 6, y = (R() * H + t * sp) % H, x = x0 + Math.sin(t * 1.5 + i) * 20; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  c.restore();
}


// =====================================================================
// "Kenapa Belanda Bisa Menjajah Indonesia Selama Ratusan Tahun?" — story
// =====================================================================
const NL_R = '#ae1c28', NL_B = '#21468b', DUTCH = '#e07a1f', MP_R = '#ce1126';

// ---------- extra wardrobe (hooked into drawChar) ----------
function bodyWear(c, o, lw) {
  if (typeof bodyWear3 === 'function') bodyWear3(c, o, lw);
  if (o.sash) { c.save(); bodyPath(c); c.clip(); c.strokeStyle = INK; c.lineWidth = .1; c.beginPath(); c.moveTo(-.26, -.5); c.lineTo(.3, -.02); c.stroke(); c.strokeStyle = o.sash; c.lineWidth = .1 - lw * 2; c.stroke(); c.restore(); }
  if (o.belts) { c.save(); bodyPath(c); c.clip(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * -.24, -.52); c.lineTo(s * .3, -.02); c.strokeStyle = INK; c.lineWidth = .075; c.stroke(); c.strokeStyle = '#f4f1ea'; c.lineWidth = .075 - lw * 2; c.stroke(); } c.restore(); }
  if (o.ruff) { const cs = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; cs.push([Math.cos(a) * .25, -.5 + Math.sin(a) * .06, .055]); } outlinedBlobs(c, cs, '#fbfaf6', lw); }
}
function extraWear(c, o, hy, lw) {
  const fill = (col) => { c.fillStyle = col; c.fill(); c.stroke(); };
  if (o.hat === 'puritan') {
    c.beginPath(); c.moveTo(-.2, hy - .2); c.lineTo(-.165, hy - .56); c.quadraticCurveTo(0, hy - .6, .165, hy - .56); c.lineTo(.2, hy - .2); c.closePath(); fill('#22201e');
    c.fillStyle = '#5a4630'; c.fillRect(-.195, hy - .3, .39, .06); c.fillStyle = '#d9b44a'; c.fillRect(-.04, hy - .31, .08, .08);
    c.beginPath(); c.ellipse(0, hy - .2, .47, .075, 0, 0, TAU); fill('#2b2825');
  } else if (o.hat === 'tricorn') {
    c.beginPath(); c.moveTo(-.4, hy - .13); c.quadraticCurveTo(-.2, hy - .5, 0, hy - .45); c.quadraticCurveTo(.2, hy - .5, .4, hy - .13); c.quadraticCurveTo(0, hy - .25, -.4, hy - .13); c.closePath(); fill('#201e1c');
    c.save(); c.strokeStyle = '#d4a93a'; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(-.37, hy - .15); c.quadraticCurveTo(0, hy - .27, .37, hy - .15); c.stroke(); c.restore();
    c.beginPath(); c.arc(-.2, hy - .25, .045, 0, TAU); fill('#e07a1f');
  } else if (o.hat === 'turban') {
    const tc = o.turban || '#f4f0e6';
    c.beginPath(); c.ellipse(0, hy - .3, .24, .15, 0, 0, TAU); fill(shade(tc, -.05));
    c.beginPath(); c.ellipse(0, hy - .17, .335, .15, 0, Math.PI, TAU); c.lineTo(.335, hy - .1); c.quadraticCurveTo(0, hy - .02, -.335, hy - .1); c.closePath(); fill(tc);
    c.save(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = lw * .6; for (const k of [-.12, 0, .12]) { c.beginPath(); c.moveTo(-.3, hy - .1 + k * .4); c.quadraticCurveTo(0, hy - .26 + k, .3, hy - .14 + k * .4); c.stroke(); } c.restore();
  } else if (o.hat === 'bandana') {
    c.beginPath(); c.roundRect(-.315, hy - .13, .63, .085, .03); fill(o.bandana || '#c8302a');
    c.beginPath(); c.moveTo(.28, hy - .1); c.lineTo(.42, hy - .02); c.lineTo(.4, hy + .06); c.lineTo(.3, hy - .04); c.closePath(); fill(o.bandana || '#c8302a');
  } else if (o.hat === 'destar') {
    c.beginPath(); c.moveTo(-.32, hy - .1); c.lineTo(-.28, hy - .26); c.lineTo(.04, hy - .3); c.lineTo(.16, hy - .5); c.lineTo(.3, hy - .25); c.lineTo(.32, hy - .1); c.quadraticCurveTo(0, hy - .04, -.32, hy - .1); c.closePath();
    fill(o.destar || '#c9a227'); c.save(); c.clip(); c.fillStyle = 'rgba(90,40,10,.55)'; for (let x = -.3; x < .32; x += .07) for (let y = -.48; y < -.06; y += .07) { c.beginPath(); c.arc(x, hy + y + .02, .012, 0, TAU); c.fill(); } c.restore();
  } else if (o.hat === 'tophat') {
    c.beginPath(); c.roundRect(-.18, hy - .64, .36, .45, .03); fill('#1d1d22'); c.fillStyle = '#6a2a2a'; c.fillRect(-.18, hy - .29, .36, .05);
    c.beginPath(); c.ellipse(0, hy - .19, .37, .06, 0, 0, TAU); fill('#25252b');
  }
  if (typeof extraWear3 === 'function') extraWear3(c, o, hy, lw);
  if (o.expr === 'angry') {
    const fy = o.hat === 'hijab' ? .035 : 0, ey = hy + .015 + fy, ex = o.hat === 'hijab' ? .085 : .105;
    c.save(); c.lineWidth = lw * 1.1; c.strokeStyle = INK; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * (ex + .05), ey - .085); c.lineTo(s * (ex - .03), ey - .055); c.stroke(); } c.restore();
  }
}

// ---------- props ----------
function dutchFlag(c, x, y, w, h, t, ph = 0) {
  for (let i = 0; i < 12; i++) {
    const x0 = x + i / 12 * w, dy = Math.sin(t * 7 + i * .55 + ph) * h * .09 * (i / 12);
    [[NL_R, 0], ['#f4f1ea', 1], [NL_B, 2]].forEach(([col, k]) => { c.fillStyle = col; c.fillRect(x0, y + dy + k * h / 3, w / 12 * 1.08, h / 3 * 1.04); });
  }
}
function ship(c, x, y, s, t, sc = 1, ph = 0) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.6 + ph) * .025); c.scale(s, s);
  const lw = __lw(c, .018, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  // masts & sails
  for (const [mx, mh, k] of [[-.38, 1.02, 3], [.06, 1.22, 3], [.5, .9, 2]]) {
    c.beginPath(); c.moveTo(mx, -.2); c.lineTo(mx, -.2 - mh); c.stroke();
    for (let j = 0; j < k; j++) {
      const top = -.3 - mh + j * mh * .33 + .06, hgt = mh * .27, wd = .36 - j * .02 + (k - j) * .02;
      c.beginPath(); c.moveTo(mx - wd / 2, top); c.lineTo(mx + wd / 2, top); c.quadraticCurveTo(mx + wd / 2 + .06, top + hgt / 2, mx + wd / 2, top + hgt); c.lineTo(mx - wd / 2, top + hgt); c.quadraticCurveTo(mx - wd / 2 + .06, top + hgt / 2, mx - wd / 2, top); c.closePath();
      const g = c.createLinearGradient(mx - wd / 2, 0, mx + wd / 2, 0); g.addColorStop(0, '#fbf3df'); g.addColorStop(1, '#d9c9a4'); c.fillStyle = g; c.fill(); c.stroke();
    }
  }
  c.save(); c.translate(.06, -1.48); dutchFlag(c, 0, 0, .3, .17, t, ph); c.strokeStyle = INK; c.lineWidth = lw * .7; c.strokeRect(0, 0, .3, .17); c.restore();
  c.beginPath(); c.moveTo(.75, -.28); c.lineTo(1.05, -.5); c.stroke();
  // hull
  c.beginPath(); c.moveTo(-.86, -.46); c.lineTo(-.62, -.42); c.lineTo(-.58, -.28); c.lineTo(.6, -.28); c.quadraticCurveTo(.8, -.3, .9, -.38); c.quadraticCurveTo(.8, .04, .48, .12); c.lineTo(-.6, .12); c.quadraticCurveTo(-.82, 0, -.86, -.46); c.closePath();
  const g = c.createLinearGradient(0, -.45, 0, .12); g.addColorStop(0, '#9a6234'); g.addColorStop(1, '#5e3a1c'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.fillStyle = '#d4a93a'; c.fillRect(-.9, -.24, 1.9, .03); c.fillStyle = '#3a2412'; c.fillRect(-.9, -.03, 1.9, .03);
  c.fillStyle = '#1b120b'; for (let gx = -.48; gx < .6; gx += .14) c.fillRect(gx, -.17, .06, .06); c.restore(); c.stroke();
  c.restore();
}
function fort(c, x, y, s, t, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .01, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  const stone = (x0, y0, w, h) => { c.beginPath(); c.rect(x0, y0, w, h); const g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#d8cdb6'); g.addColorStop(1, '#a89a80'); c.fillStyle = g; c.fill(); c.save(); c.clip(); c.strokeStyle = 'rgba(60,45,30,.3)'; c.lineWidth = lw * .5; for (let yy = y0; yy < y0 + h; yy += .06) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy); c.stroke(); } c.restore(); c.stroke(); for (let cx = x0; cx < x0 + w - .03; cx += .08) { c.beginPath(); c.rect(cx, y0 - .045, .045, .045); c.fillStyle = '#c9bea6'; c.fill(); c.stroke(); } };
  stone(-.5, -.42, 1, .42); // curtain wall
  stone(-.68, -.55, .28, .55); stone(.4, -.55, .28, .55); // bastions
  stone(-.13, -.78, .26, .36); // keep
  c.beginPath(); c.moveTo(-.07, 0); c.lineTo(-.07, -.17); c.arc(0, -.17, .07, Math.PI, 0); c.lineTo(.07, 0); c.closePath(); c.fillStyle = '#3b2a1a'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0, -.82); c.lineTo(0, -1.12); c.stroke(); dutchFlag(c, 0, -1.12, .22, .13, t); c.strokeRect(0, -1.12, .22, .13);
  c.restore();
}
function cannon(c, x, y, s, t, fireT, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .025, 2.4); c.lineWidth = lw; c.strokeStyle = INK;
  const rec = fireT && t > fireT ? Math.max(0, .08 - (t - fireT) * .3) : 0; c.translate(-rec, 0);
  c.save(); c.rotate(-.18); c.beginPath(); c.roundRect(-.15, -.42, .82, .2, .08); const g = c.createLinearGradient(0, -.42, 0, -.22); g.addColorStop(0, '#5a5a5a'); g.addColorStop(1, '#232323'); c.fillStyle = g; c.fill(); c.stroke(); c.restore();
  c.beginPath(); c.moveTo(-.3, 0); c.lineTo(.35, 0); c.lineTo(.25, -.25); c.lineTo(-.2, -.25); c.closePath(); c.fillStyle = '#6b4220'; c.fill(); c.stroke();
  for (const wx of [-.15, .2]) { c.beginPath(); c.arc(wx, 0, .14, 0, TAU); c.fillStyle = '#4a2e16'; c.fill(); c.stroke(); }
  c.restore();
  if (fireT && t > fireT && t < fireT + 1.4) { const p = (t - fireT) / 1.4; c.save(); c.globalAlpha = 1 - p; for (let i = 0; i < 6; i++) { c.fillStyle = i < 2 && p < .15 ? '#ffd24a' : '#e9e4dc'; c.beginPath(); c.arc(x + s * (.75 + p * .6 + i * .12), y - s * (.55 + p * .3 + Math.sin(i) * .1), s * (.12 + p * .25), 0, TAU); c.fill(); } c.restore(); }
}
function nutmeg(c, x, y, r, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.lineWidth = Math.max(2, r * .12); c.strokeStyle = INK;
  c.beginPath(); c.ellipse(0, 0, r, r * .82, 0, 0, TAU); const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, '#a5703f'); g.addColorStop(1, '#5b3517'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.strokeStyle = '#c8302a'; c.lineWidth = r * .14; for (const a of [-.6, .2, 1]) { c.beginPath(); c.moveTo(-r, a * r * .5); c.bezierCurveTo(-r * .3, -r * .6 + a * r * .3, r * .3, r * .6 + a * r * .2, r, -a * r * .3); c.stroke(); } c.restore();
  c.beginPath(); c.ellipse(0, 0, r, r * .82, 0, 0, TAU); c.stroke(); c.restore();
}
function clove(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = INK; c.lineWidth = Math.max(1.5, s * .1);
  c.beginPath(); c.moveTo(-s * .08, 0); c.lineTo(-s * .03, s * .9); c.lineTo(s * .03, s * .9); c.lineTo(s * .08, 0); c.closePath(); c.fillStyle = '#5a2e14'; c.fill(); c.stroke();
  c.beginPath(); c.arc(0, -s * .08, s * .18, 0, TAU); c.fillStyle = '#7a3e1a'; c.fill(); c.stroke(); c.restore();
}
function sack(c, x, y, s, label, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .025, 2.4); c.lineWidth = lw; c.strokeStyle = INK;
  c.beginPath(); c.moveTo(-.38, 0); c.quadraticCurveTo(-.46, -.5, -.22, -.72); c.lineTo(-.12, -.82); c.lineTo(.12, -.82); c.lineTo(.22, -.72); c.quadraticCurveTo(.46, -.5, .38, 0); c.quadraticCurveTo(0, .06, -.38, 0); c.closePath();
  const g = c.createLinearGradient(-.4, 0, .4, 0); g.addColorStop(0, '#d9bf8c'); g.addColorStop(1, '#9c8150'); c.fillStyle = g; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.18, -.7); c.lineTo(.18, -.7); c.stroke();
  if (label) { c.fillStyle = '#7a1b1b'; c.font = `600 .2px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VOC', 0, -.32); }
  c.restore();
}
function coin(c, x, y, r) { c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#f2c43a'; c.fill(); c.lineWidth = Math.max(2, r * .15); c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(x, y, r * .62, 0, TAU); c.strokeStyle = '#b8860b'; c.lineWidth = r * .1; c.stroke(); c.restore(); }
function paper(c, x, y, w, h, rot, sc = 1) {
  if (sc <= .001) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.fillStyle = '#f5ecd6'; c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 10; c.fillRect(-w / 2, -h / 2, w, h); c.shadowColor = 'transparent';
  c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(-w / 2, -h / 2, w, h); c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-w * .36, -h * .3 + i * h * .14); c.lineTo(w * (i === 4 ? .05 : .36), -h * .3 + i * h * .14); c.stroke(); } c.restore();
}
function waxSeal(c, x, y, r, sc = 1) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(sc, sc); c.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = r * (i % 2 ? .92 : 1.05); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fillStyle = '#a3201c'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, 0, r * .6, 0, TAU); c.strokeStyle = '#d9584e'; c.stroke(); c.restore(); }
function crown(c, x, y, s, col = '#f2c43a', sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = Math.max(2.2, s * .07) / s; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-.5, 0); c.lineTo(-.55, -.55); c.lineTo(-.25, -.28); c.lineTo(0, -.65); c.lineTo(.25, -.28); c.lineTo(.55, -.55); c.lineTo(.5, 0); c.closePath(); c.fillStyle = col; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 8; c.fill(); c.shadowColor = 'transparent'; c.stroke();
  for (const [px, py] of [[-.55, -.55], [0, -.65], [.55, -.55]]) { c.beginPath(); c.arc(px, py, .08, 0, TAU); c.fillStyle = '#fff3c4'; c.fill(); c.stroke(); }
  c.restore();
}
function bolt(c, x0, y0, x1, y1, a, t) {
  if (a <= 0) return; c.save(); c.globalAlpha = a; c.lineJoin = 'round'; const n = 7, pts = [];
  for (let i = 0; i <= n; i++) { const f = i / n, j = (i === 0 || i === n) ? 0 : Math.sin(i * 12.9 + Math.floor(t * 12)) * 16; pts.push([lerp(x0, x1, f) + j, lerp(y0, y1, f) - j]); }
  for (const [w, col] of [[12, INK], [6, YEL]]) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  c.restore();
}
function govBuilding(c, x, y, s, t, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .008, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  const g = (a, b) => { const gg = c.createLinearGradient(-.5, 0, .5, 0); gg.addColorStop(0, a); gg.addColorStop(1, b); return gg; };
  c.beginPath(); c.rect(-.56, -.08, 1.12, .08); c.fillStyle = '#c9c1b0'; c.fill(); c.stroke();
  c.beginPath(); c.rect(-.5, -.62, 1, .54); c.fillStyle = g('#f1ebde', '#c8bfae'); c.fill(); c.stroke();
  for (let i = 0; i < 6; i++) { const cx = -.4 + i * .16; c.beginPath(); c.rect(cx - .035, -.58, .07, .5); c.fillStyle = g('#ffffff', '#d6cfc0'); c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(-.56, -.62); c.lineTo(0, -.9); c.lineTo(.56, -.62); c.closePath(); c.fillStyle = '#e9e2d3'; c.fill(); c.stroke();
  c.beginPath(); c.rect(-.09, -.3, .18, .22); c.fillStyle = '#4a3420'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0, -.9); c.lineTo(0, -1.18); c.stroke(); dutchFlag(c, 0, -1.18, .24, .14, t); c.strokeRect(0, -1.18, .24, .14);
  c.restore();
}
function vocLogo(c, x, y, s, o = {}) {
  const { a = 1, crack = 0, split = 0, ink = '#1f2f57' } = o; if (a <= 0) return;
  const r = s * .62; c.save(); c.globalAlpha = a; c.translate(x, y);
  const draw = () => {
    c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = s * .028; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.lineWidth = s * .012; c.beginPath(); c.arc(0, 0, r * .86, 0, TAU); c.stroke();
    const word = 'VEREENIGDE · OOSTINDISCHE · COMPAGNIE · '; c.font = `600 ${s * .07}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < word.length; i++) { const ang = -Math.PI / 2 + i / word.length * TAU; c.save(); c.rotate(ang + Math.PI / 2); c.fillText(word[i], 0, -r * .93); c.restore(); }
    c.font = `600 ${s * .78}px ${SERIF}`; c.fillText('V', 0, s * .06); c.font = `600 ${s * .34}px ${SERIF}`; c.fillText('O', -s * .25, -s * .14); c.fillText('C', s * .26, -s * .14);
  };
  if (split <= 0) { draw(); } else {
    for (const sd of [-1, 1]) { c.save(); c.translate(sd * split * s * .5, split * s * .3); c.rotate(sd * split * .4); c.globalAlpha = a * (1 - split); c.beginPath(); c.moveTo(0, -s); c.lineTo(s * .06, -s * .3); c.lineTo(-s * .05, 0); c.lineTo(s * .05, s * .35); c.lineTo(0, s); c.lineTo(sd * s, s); c.lineTo(sd * s, -s); c.closePath(); c.clip(); draw(); c.restore(); }
  }
  if (crack > 0 && split <= 0) {
    c.strokeStyle = '#120d0b'; c.lineWidth = s * .018; c.lineJoin = 'round';
    const paths = [[[0, -1], [.06, -.3], [-.05, 0], [.05, .35], [0, 1]], [[-.05, 0], [-.45, .15], [-.7, .1]], [[.06, -.3], [.4, -.45], [.62, -.3]], [[.05, .35], [.35, .55]]];
    paths.forEach((pp, k) => { const pr2 = clamp(crack * paths.length - k, 0, 1); if (pr2 <= 0) return; c.beginPath(); c.moveTo(pp[0][0] * s * .62, pp[0][1] * s * .62); for (let i = 1; i < pp.length; i++) { const f = clamp(pr2 * (pp.length - 1) - (i - 1), 0, 1); if (f <= 0) break; c.lineTo(lerp(pp[i - 1][0], pp[i][0], f) * s * .62, lerp(pp[i - 1][1], pp[i][1], f) * s * .62); } c.stroke(); });
  }
  c.restore();
}
function mpFlag(c, x, y, w, h, t) {
  c.save(); c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x, H + 20); c.stroke(); c.fillStyle = '#d4a93a'; c.beginPath(); c.arc(x, y - 36, 16, 0, TAU); c.fill(); c.stroke();
  const n = 40; for (let i = 0; i < n; i++) {
    const f = i / n, dx = x + 4 + f * w, wv = Math.sin(t * 5 - f * 6) * h * .09 * f, sh = Math.cos(t * 5 - f * 6) * .18 * f;
    const strip = (col, yy) => { c.fillStyle = col; c.fillRect(dx, yy + wv, w / n + 1, h / 2 + 1); c.fillStyle = `rgba(0,0,0,${Math.max(0, sh)})`; c.fillRect(dx, yy + wv, w / n + 1, h / 2 + 1); c.fillStyle = `rgba(255,255,255,${Math.max(0, -sh) * .6})`; c.fillRect(dx, yy + wv, w / n + 1, h / 2 + 1); };
    strip(MP_R, y); strip('#f7f5f0', y + h / 2);
  }
  c.restore();
}
function plateSky(c, top = '#6fa6d6', bot = '#d9e9f1', hy = 900, t = 0) {
  const g = c.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-80, -80, W + 160, hy + 80);
  c.fillStyle = 'rgba(255,255,255,.88)'; for (const [x, y, s] of [[150, 240, 1], [760, 170, 1.3], [520, 360, .8], [980, 430, .9]]) { const xx = (x + t * 14) % (W + 320) - 160; for (const [dx, dy, r] of [[0, 0, 58], [52, -24, 50], [104, 0, 56], [52, 14, 46]]) { c.beginPath(); c.arc(xx + dx * s, y + dy * s, r * s, 0, TAU); c.fill(); } }
}
function plateSea(c, y0, y1, t) {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#5b8fa8'); g.addColorStop(1, '#2d5a70'); c.fillStyle = g; c.fillRect(-80, y0, W + 160, y1 - y0);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; for (let r = 0; r < 6; r++) { const yy = y0 + 20 + r * (y1 - y0) / 6; c.beginPath(); for (let x = -80; x <= W + 80; x += 30) { const w2 = yy + Math.sin(x * .02 + t * 2 + r) * 4; x === -80 ? c.moveTo(x, w2) : c.lineTo(x, w2); } c.stroke(); }
}
function hills(c, y, col, amp, f, ph) { c.fillStyle = col; c.beginPath(); c.moveTo(-80, y + 200); for (let x = -80; x <= W + 80; x += 30) c.lineTo(x, y - amp * Math.abs(Math.sin(x * f + ph)) - amp * .5 * Math.abs(Math.sin(x * f * 2.3 + ph * 2))); c.lineTo(W + 80, y + 200); c.closePath(); c.fill(); }
function woodFloor(c, y0, col1 = '#8a5a32', col2 = '#5e3a1e') {
  const g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, col1); g.addColorStop(1, col2); c.fillStyle = g; c.fillRect(-80, y0, W + 160, H - y0 + 80);
  c.strokeStyle = 'rgba(30,15,5,.45)'; c.lineWidth = 4; for (let yy = y0 + 70; yy < H; yy += 95) { c.beginPath(); c.moveTo(-80, yy); c.lineTo(W + 80, yy); c.stroke(); }
  c.beginPath(); c.moveTo(-80, y0); c.lineTo(W + 80, y0); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
}
function bigText(c, s, x, y, o = {}) { txt(c, s, x, y, { size: 150, weight: 600, ...o }); }


// =====================================================================
// "Kenapa Jakarta Dulu Bernama Batavia?" — story
// =====================================================================
const JP_R = '#bc002d';

// ---------- wardrobe additions (hooked from bodyWear / extraWear) ----------
function bodyWear3(c, o, lw) {
  if (typeof bodyWear4 === 'function') bodyWear4(c, o, lw);
  if (o.hair === 'long') { // hair falling behind the head and shoulders
    c.beginPath(); c.moveTo(-.33, -.72); c.quadraticCurveTo(-.4, -.45, -.3, -.36); c.lineTo(.3, -.36); c.quadraticCurveTo(.4, -.45, .33, -.72); c.closePath();
    c.fillStyle = shade(o.hairCol || '#c9a35a', -.12); c.fill(); c.stroke();
  }
  if (o.cloak) { c.save(); bodyPath(c); c.clip(); c.fillStyle = o.cloak; c.beginPath(); c.moveTo(-.4, -.55); c.lineTo(-.05, -.5); c.lineTo(-.4, .05); c.closePath(); c.fill(); c.beginPath(); c.moveTo(.4, -.55); c.lineTo(.05, -.5); c.lineTo(.4, .05); c.closePath(); c.fill(); c.restore(); bodyPath(c); c.stroke(); }
}
function extraWear3(c, o, hy, lw) {
  const hc = o.hairCol || '#3a2a1c', my = hy + .1;
  if (o.hair === 'long') { c.beginPath(); c.ellipse(0, hy, .315, .272, 0, Math.PI, TAU); c.lineTo(.3, hy + .04); c.quadraticCurveTo(.14, hy - .12, 0, hy - .1); c.quadraticCurveTo(-.14, hy - .12, -.3, hy + .04); c.closePath(); c.fillStyle = hc; c.fill(); c.stroke(); }
  if (o.beard === 'goatee' || o.beard === 'full') {
    c.fillStyle = hc;
    if (o.beard === 'full') { c.beginPath(); c.moveTo(-.27, hy + .04); c.quadraticCurveTo(-.26, hy + .28, 0, hy + .33); c.quadraticCurveTo(.26, hy + .28, .27, hy + .04); c.quadraticCurveTo(.15, hy + .16, 0, hy + .15); c.quadraticCurveTo(-.15, hy + .16, -.27, hy + .04); c.closePath(); c.fill(); c.stroke(); }
    else { c.beginPath(); c.moveTo(-.05, my + .05); c.quadraticCurveTo(0, my + .2, .05, my + .05); c.closePath(); c.fill(); c.stroke(); }
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, my - .018); c.quadraticCurveTo(s * .06, my - .045, s * .1, my - .005); c.quadraticCurveTo(s * .05, my - .005, 0, my + .006); c.closePath(); c.fill(); c.stroke(); }
  }
  if (typeof extraWear4 === 'function') extraWear4(c, o, hy, lw);
  if (o.hat === 'skullcap') { c.beginPath(); c.ellipse(0, hy - .17, .27, .13, 0, Math.PI, TAU); c.closePath(); c.fillStyle = '#1f1f26'; c.fill(); c.stroke(); c.beginPath(); c.arc(0, hy - .31, .03, 0, TAU); c.fillStyle = '#c8302a'; c.fill(); c.stroke(); }
}

// ---------- city props ----------
function stiltHouse(c, x, y, s, burn = 0, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .02, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  for (const sx of [-.36, -.12, .12, .36]) { c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, -.26); c.stroke(); }
  c.beginPath(); c.rect(-.42, -.62, .84, .38); c.fillStyle = '#b98a4e'; c.fill(); c.save(); c.clip(); c.strokeStyle = 'rgba(60,35,10,.4)'; c.lineWidth = lw * .5; for (let xx = -.4; xx < .42; xx += .06) { c.beginPath(); c.moveTo(xx, -.62); c.lineTo(xx, -.24); c.stroke(); } c.restore(); c.stroke();
  c.beginPath(); c.rect(-.08, -.5, .16, .26); c.fillStyle = '#3b2412'; c.fill(); c.stroke();
  c.beginPath(); if (burn > .5) { c.moveTo(-.6, -.6); c.lineTo(-.2, -.95); c.lineTo(-.05, -.78); c.lineTo(.1, -.98); c.lineTo(.6, -.6); } else { c.moveTo(-.6, -.6); c.lineTo(0, -1.05); c.lineTo(.6, -.6); } c.closePath();
  c.fillStyle = '#8a6a3a'; c.fill(); c.save(); c.clip(); c.strokeStyle = 'rgba(50,30,10,.45)'; for (let k = -.95; k < -.6; k += .06) { c.beginPath(); c.moveTo(-.7, k + .1); c.lineTo(.7, k + .1); c.stroke(); } c.restore(); c.stroke();
  if (burn > 0) { c.globalAlpha = burn * .55; c.fillStyle = '#1a0d05'; c.fillRect(-.62, -1.05, 1.24, 1.05); }
  c.restore();
}
const HOUSE_COLS = ['#a8442e', '#d9c7a0', '#6f7d8c', '#8c5a3c', '#c98a4b', '#e6dccb'];
function dutchHouse(c, x, y, s, k = 0, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .012, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  const col = HOUSE_COLS[k % HOUSE_COLS.length];
  c.beginPath(); c.moveTo(-.25, 0); c.lineTo(-.25, -1.0); c.lineTo(-.18, -1.0); c.lineTo(-.18, -1.1); c.lineTo(-.1, -1.1); c.lineTo(-.1, -1.22); c.lineTo(-.04, -1.22); c.lineTo(-.04, -1.34); c.lineTo(.04, -1.34); c.lineTo(.04, -1.22); c.lineTo(.1, -1.22); c.lineTo(.1, -1.1); c.lineTo(.18, -1.1); c.lineTo(.18, -1.0); c.lineTo(.25, -1.0); c.lineTo(.25, 0); c.closePath();
  const g = c.createLinearGradient(-.25, 0, .25, 0); g.addColorStop(0, shade(col, .12)); g.addColorStop(1, shade(col, -.22)); c.fillStyle = g; c.fill(); c.stroke();
  for (let r = 0; r < 3; r++) for (let q = 0; q < 2; q++) { c.beginPath(); c.rect(-.15 + q * .18, -.9 + r * .24, .12, .15); c.fillStyle = '#f4efe2'; c.fill(); c.stroke(); c.fillStyle = '#2d3a4a'; c.fillRect(-.135 + q * .18, -.885 + r * .24, .09, .12); }
  c.beginPath(); c.rect(-.06, -.2, .12, .2); c.fillStyle = '#3b2412'; c.fill(); c.stroke();
  c.restore();
}
function stadhuis(c, x, y, s, t, sc = 1, flag = 'nl', flagY = 0) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .008, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.rect(-.8, -.6, 1.6, .6); const g = c.createLinearGradient(-.8, 0, .8, 0); g.addColorStop(0, '#f6f0e2'); g.addColorStop(1, '#cfc4ae'); c.fillStyle = g; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.86, -.6); c.lineTo(-.7, -.82); c.lineTo(.7, -.82); c.lineTo(.86, -.6); c.closePath(); c.fillStyle = '#a8442e'; c.fill(); c.stroke();
  for (let r = 0; r < 2; r++) for (let q = 0; q < 9; q++) { if (r === 1 && q === 4) continue; c.beginPath(); c.rect(-.72 + q * .16, -.52 + r * .26, .08, .14); c.fillStyle = '#2d3a4a'; c.fill(); c.stroke(); }
  c.beginPath(); c.rect(-.07, -.22, .14, .22); c.fillStyle = '#3b2412'; c.fill(); c.stroke();
  c.beginPath(); c.rect(-.11, -1.06, .22, .26); c.fillStyle = '#f1ebdc'; c.fill(); c.stroke(); c.beginPath(); c.ellipse(0, -1.06, .13, .12, 0, Math.PI, TAU); c.closePath(); c.fillStyle = '#5a7a6a'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0, -1.18); c.lineTo(0, -1.52); c.stroke();
  if (flag) { const fy = -1.5 + flagY * .3; if (flag === 'nl') { dutchFlag(c, 0, fy, .26, .16, t); c.strokeRect(0, fy, .26, .16); } else { c.fillStyle = '#f7f5f0'; c.fillRect(0, fy, .26, .17); c.fillStyle = JP_R; c.beginPath(); c.arc(.13, fy + .085, .05, 0, TAU); c.fill(); c.strokeRect(0, fy, .26, .17); } }
  c.restore();
}
function palm(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = __lw(c, .02, 2.4); c.strokeStyle = INK; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(.12, -.5, .05, -1); c.lineWidth = .07; c.strokeStyle = INK; c.stroke(); c.lineWidth = .05; c.strokeStyle = '#8a6a3a'; c.stroke();
  c.lineWidth = __lw(c, .02, 2.4);
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .55 + Math.sin(t * 1.5 + i) * .05; c.save(); c.translate(.05, -1); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(.25, -.12, .5, .08); c.quadraticCurveTo(.25, .02, 0, 0); c.fillStyle = '#4f7a35'; c.fill(); c.strokeStyle = INK; c.stroke(); c.restore(); }
  c.restore();
}
function flame(c, x, y, s, t, seed) {
  const f = 1 + .18 * Math.sin(t * 13 + seed * 7) + .1 * Math.sin(t * 23 + seed);
  for (const [col, k] of [['#e8430d', 1], ['#ff9a1f', .72], ['#ffe27a', .42]]) {
    const hh = s * k * f, ww = s * k * .42; c.beginPath(); c.moveTo(x - ww, y); c.quadraticCurveTo(x - ww * 1.1, y - hh * .5, x + Math.sin(t * 9 + seed) * ww * .4, y - hh); c.quadraticCurveTo(x + ww * 1.1, y - hh * .5, x + ww, y); c.closePath(); c.fillStyle = col; c.fill();
  }
}
function smoke(c, x, y, s, t, seed, a = 1) {
  c.save(); for (let i = 0; i < 6; i++) { const p = ((t * .35 + i / 6 + seed * .13) % 1); c.globalAlpha = a * (1 - p) * .6; c.fillStyle = '#4a4440'; c.beginPath(); c.arc(x + Math.sin(i * 2.1 + seed + t * .6) * s * .4 + p * s * .6, y - p * s * 3, s * (.35 + p * .7), 0, TAU); c.fill(); } c.restore();
}
function embers(c, t, a) { if (a <= 0) return; const R = rng(21); c.save(); c.globalAlpha = a; c.fillStyle = '#ffb347'; for (let i = 0; i < 50; i++) { const x0 = R() * W, sp = 80 + R() * 160, y = H - ((t * sp + R() * H) % H), x = x0 + Math.sin(t * 2 + i) * 30; c.beginPath(); c.arc(x, y, 2 + R() * 4, 0, TAU); c.fill(); } c.restore(); }
function canal(c, y0, y1, t) {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#5f8ea0'); g.addColorStop(1, '#3d6a7c'); c.fillStyle = g; c.fillRect(-80, y0, W + 160, y1 - y0);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 4; for (let i = 0; i < 9; i++) { const x = (i * 140 + t * 40) % (W + 200) - 100, yy = y0 + 20 + (i % 3) * (y1 - y0) / 3.2; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 70, yy); c.stroke(); }
  c.fillStyle = '#9a8f7c'; c.fillRect(-80, y0 - 14, W + 160, 14); c.fillRect(-80, y1, W + 160, 14); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(-80, y0 - 14, W + 160, 14); c.strokeRect(-80, y1, W + 160, 14);
}
function junk(c, x, y, s, t, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.7) * .03); c.scale(s, s); const lw = __lw(c, .02, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  for (const [mx, mh] of [[-.2, .85], [.25, .65]]) { c.beginPath(); c.moveTo(mx, -.15); c.lineTo(mx, -.15 - mh); c.stroke(); c.beginPath(); c.moveTo(mx + .02, -.18 - mh); c.lineTo(mx + .32, -.12 - mh); c.lineTo(mx + .36, -.3); c.lineTo(mx + .02, -.28); c.closePath(); c.fillStyle = '#b5482e'; c.fill(); c.stroke(); c.save(); c.clip(); c.strokeStyle = 'rgba(60,20,10,.6)'; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(mx, -.28 - k * mh * .17); c.lineTo(mx + .4, -.22 - k * mh * .17); c.stroke(); } c.restore(); }
  c.beginPath(); c.moveTo(-.62, -.25); c.lineTo(.6, -.2); c.quadraticCurveTo(.5, .08, .3, .1); c.lineTo(-.4, .1); c.quadraticCurveTo(-.6, 0, -.62, -.25); c.closePath(); c.fillStyle = '#7a4a26'; c.fill(); c.stroke();
  c.restore();
}
function jar(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = __lw(c, .04, 2.4); c.strokeStyle = INK; c.beginPath(); c.moveTo(-.2, 0); c.quadraticCurveTo(-.45, -.35, -.18, -.62); c.lineTo(-.12, -.72); c.lineTo(.12, -.72); c.lineTo(.18, -.62); c.quadraticCurveTo(.45, -.35, .2, 0); c.closePath(); c.fillStyle = '#eef0f2'; c.fill(); c.stroke(); c.strokeStyle = '#2f5aa0'; c.lineWidth = .04; c.beginPath(); c.moveTo(-.3, -.35); c.quadraticCurveTo(0, -.25, .3, -.35); c.stroke(); c.beginPath(); c.arc(0, -.42, .07, 0, TAU); c.stroke(); c.restore(); }
function windmill(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = Math.max(2, s * .02) / s; c.strokeStyle = INK;
  c.beginPath(); c.moveTo(-.2, 0); c.lineTo(-.12, -.7); c.lineTo(.12, -.7); c.lineTo(.2, 0); c.closePath(); c.fillStyle = '#8c5a3c'; c.fill(); c.stroke();
  c.save(); c.translate(0, -.72); c.rotate(t * 1.4); for (let i = 0; i < 4; i++) { c.rotate(TAU / 4); c.beginPath(); c.rect(-.04, 0, .08, .5); c.fillStyle = '#efe3c6'; c.fill(); c.stroke(); } c.restore();
  c.restore();
}
function monas(c, x, y, s, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = __lw(c, .01, 2.4); c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.rect(-.42, -.1, .84, .1); c.fillStyle = '#e9e4d8'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.3, -.1); c.lineTo(-.22, -.22); c.lineTo(.22, -.22); c.lineTo(.3, -.1); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.045, -.22); c.lineTo(-.03, -1.0); c.lineTo(.03, -1.0); c.lineTo(.045, -.22); c.closePath(); const g = c.createLinearGradient(-.05, 0, .05, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfc8b8'); c.fillStyle = g; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.06, -1.0); c.lineTo(.06, -1.0); c.lineTo(.04, -1.04); c.lineTo(-.04, -1.04); c.closePath(); c.fillStyle = '#7a6a50'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-.04, -1.04); c.quadraticCurveTo(-.07, -1.12, 0, -1.2); c.quadraticCurveTo(.07, -1.12, .04, -1.04); c.closePath(); c.fillStyle = '#f2c43a'; c.fill(); c.stroke();
  c.restore();
}
function shield(c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.lineWidth = __lw(c, .03, 2.4); c.strokeStyle = INK; c.beginPath(); c.ellipse(0, 0, .3, .5, 0, 0, TAU); c.fillStyle = '#8e3b26'; c.fill(); c.stroke(); c.beginPath(); c.arc(0, 0, .08, 0, TAU); c.fillStyle = '#c9a227'; c.fill(); c.stroke(); c.strokeStyle = '#e8d6a8'; c.lineWidth = .03; c.beginPath(); c.ellipse(0, 0, .22, .4, 0, 0, TAU); c.stroke(); c.restore(); }
function hinomaru(c, x, y, w, h) { c.fillStyle = '#f7f5f0'; c.fillRect(x, y, w, h); c.fillStyle = JP_R; c.beginPath(); c.arc(x + w / 2, y + h / 2, h * .3, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(x, y, w, h); }
// letter-flip morph between two words
function morphText(c, from, to, x, y, p, o = {}) {
  const n = Math.max(from.length, to.length), A = from.padStart(Math.ceil((n + from.length) / 2)).padEnd(n), B = to.padStart(Math.ceil((n + to.length) / 2)).padEnd(n);
  const size = o.size || 140, gap = size * .08; c.save(); c.font = `${o.weight || 700} ${size}px ${o.font || SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  // lay each word out with real glyph widths, then slide every letter between its two positions
  const layout = (s, pad) => { const ws = [...s].map(ch => c.measureText(ch).width + gap), tot = ws.reduce((a, b) => a + b, 0); let acc = x - tot / 2; const pos = ws.map(w => { const m = acc + w / 2; acc += w; return m; }); return Array.from({ length: n }, (_, i) => pos[clamp(i - pad, 0, s.length - 1)]); };
  const PA = layout(from, A.length - A.trimStart().length), PB = layout(to, B.length - B.trimStart().length);
  for (let i = 0; i < n; i++) {
    const q = clamp(p * (n + 3) - i * 1, 0, 3) / 3, ch = q < .5 ? A[i] : B[i], sy = Math.abs(Math.cos(q * Math.PI)); if (ch === ' ') continue;
    c.save(); c.translate(lerp(PA[i], PB[i], io(q)), y); c.scale(1, Math.max(.02, sy)); c.lineWidth = o.sw || 10; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(ch, 0, 0); c.fillStyle = q < .5 ? (o.colA || '#fff') : (o.colB || YEL); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 16; c.fillText(ch, 0, 0); c.restore();
  }
  c.restore();
}


// =====================================================================
// "Kenapa Bangsa Eropa Rela Berlayar Ribuan Kilometer ke Maluku?" — story
// =====================================================================

// outline width in local units for a given fraction of on-screen size, with a pixel floor
function __lw(c, f, minPx) { const m = c.getTransform(), k = Math.hypot(m.a, m.b) || 1; return Math.max(minPx, k * f) / k; }

// ---------- wardrobe additions (hooked from bodyWear3 / extraWear3) ----------
function bodyWear4(c, o, lw) {
  if (typeof bodyWear5 === 'function') bodyWear5(c, o, lw);
  if (o.stripes) { c.save(); bodyPath(c); c.clip(); c.fillStyle = o.stripes; for (let y = -.5; y < .05; y += .09) c.fillRect(-.45, y, .9, .04); c.restore(); bodyPath(c); c.stroke(); }
}
function extraWear4(c, o, hy, lw) {
  if (typeof extraWear6 === 'function') extraWear6(c, o, hy, lw);
  const f = (col) => { c.fillStyle = col; c.fill(); c.stroke(); };
  if (o.hat === 'beret') {
    c.beginPath(); c.ellipse(.03, hy - .2, .36, .11, -.12, 0, TAU); f(o.beretCol || '#1f1d22');
    c.save(); c.translate(.22, hy - .26); c.rotate(.6); c.beginPath(); c.ellipse(0, -.12, .04, .16, 0, 0, TAU); f('#f4f1ea'); c.restore();
  } else if (o.hat === 'capotain') {
    c.beginPath(); c.moveTo(-.2, hy - .2); c.lineTo(-.13, hy - .62); c.quadraticCurveTo(0, hy - .66, .13, hy - .62); c.lineTo(.2, hy - .2); c.closePath(); f('#4a3626');
    c.fillStyle = '#c9a227'; c.fillRect(-.19, hy - .3, .38, .05);
    c.save(); c.translate(.16, hy - .4); c.rotate(.5); c.beginPath(); c.ellipse(0, -.1, .035, .15, 0, 0, TAU); f('#e8e2d6'); c.restore();
    c.beginPath(); c.ellipse(0, hy - .2, .4, .065, 0, 0, TAU); f('#5a4230');
  } else if (o.hat === 'morion') {
    c.beginPath(); c.moveTo(-.44, hy - .08); c.quadraticCurveTo(-.3, hy - .2, -.24, hy - .22); c.quadraticCurveTo(-.2, hy - .52, 0, hy - .55); c.quadraticCurveTo(.2, hy - .52, .24, hy - .22); c.quadraticCurveTo(.3, hy - .2, .44, hy - .08); c.quadraticCurveTo(0, hy - .2, -.44, hy - .08); c.closePath();
    const g = c.createLinearGradient(-.4, 0, .4, 0); g.addColorStop(0, '#e9edf0'); g.addColorStop(1, '#8a949c'); c.fillStyle = g; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-.16, hy - .45); c.quadraticCurveTo(0, hy - .74, .16, hy - .45); c.closePath(); f('#b9c1c7');
  }
}

// ---------- flags & ships ----------
function flagPT(c, x, y, w, h) { c.fillStyle = '#046a38'; c.fillRect(x, y, w * .4, h); c.fillStyle = '#da291c'; c.fillRect(x + w * .4, y, w * .6, h); c.beginPath(); c.arc(x + w * .4, y + h / 2, h * .26, 0, TAU); c.fillStyle = '#ffe900'; c.fill(); }
function flagEN(c, x, y, w, h) { c.fillStyle = '#f7f5f0'; c.fillRect(x, y, w, h); c.fillStyle = '#ce1124'; c.fillRect(x + w * .4, y, w * .2, h); c.fillRect(x, y + h * .38, w, h * .24); }
function flagOf(c, kind, x, y, w, h, t) { if (kind === 'pt') flagPT(c, x, y, w, h); else if (kind === 'en') flagEN(c, x, y, w, h); else if (kind === 'fr') flagFR(c, x, y, w, h); else dutchFlag(c, x, y, w, h, t); c.strokeStyle = INK; c.lineWidth = Math.max(.004, w * .03); c.strokeRect(x, y, w, h); }
function galleon(c, x, y, s, t, o = {}) {
  const { flag = 'nl', sc = 1, ph = 0, roll = .025, crew = null, cargo = false } = o; if (sc <= .001) return; s *= sc;
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.6 + ph) * roll); c.scale(s, s);
  const lw = __lw(c, .018, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  for (const [mx, mh, k] of [[-.38, 1.02, 3], [.06, 1.22, 3], [.5, .9, 2]]) {
    c.beginPath(); c.moveTo(mx, -.2); c.lineTo(mx, -.2 - mh); c.stroke();
    for (let j = 0; j < k; j++) {
      const top = -.3 - mh + j * mh * .33 + .06, hgt = mh * .27, wd = .36 - j * .02 + (k - j) * .02;
      c.beginPath(); c.moveTo(mx - wd / 2, top); c.lineTo(mx + wd / 2, top); c.quadraticCurveTo(mx + wd / 2 + .06, top + hgt / 2, mx + wd / 2, top + hgt); c.lineTo(mx - wd / 2, top + hgt); c.quadraticCurveTo(mx - wd / 2 + .06, top + hgt / 2, mx - wd / 2, top); c.closePath();
      const g = c.createLinearGradient(mx - wd / 2, 0, mx + wd / 2, 0); g.addColorStop(0, '#fbf3df'); g.addColorStop(1, '#d9c9a4'); c.fillStyle = g; c.fill(); c.stroke();
      if (flag === 'pt' && j === 1) { c.save(); c.strokeStyle = '#c8302a'; c.lineWidth = .05; c.beginPath(); c.moveTo(mx, top + .04); c.lineTo(mx, top + hgt - .04); c.moveTo(mx - .08, top + hgt / 2); c.lineTo(mx + .08, top + hgt / 2); c.stroke(); c.restore(); }
    }
  }
  c.save(); c.translate(.06, -1.48); flagOf(c, flag, 0, 0, .3, .18, t); c.restore();
  c.beginPath(); c.moveTo(.75, -.28); c.lineTo(1.05, -.5); c.stroke();
  if (cargo) [[-.45, -.28], [-.2, -.28], [.2, -.28], [-.32, -.42]].forEach(([sx, sy]) => sack(c, sx, sy, .2, true));
  if (crew) crew(c, lw);
  c.beginPath(); c.moveTo(-.86, -.46); c.lineTo(-.62, -.42); c.lineTo(-.58, -.28); c.lineTo(.6, -.28); c.quadraticCurveTo(.8, -.3, .9, -.38); c.quadraticCurveTo(.8, .04, .48, .12); c.lineTo(-.6, .12); c.quadraticCurveTo(-.82, 0, -.86, -.46); c.closePath();
  const g = c.createLinearGradient(0, -.45, 0, .12); g.addColorStop(0, '#9a6234'); g.addColorStop(1, '#5e3a1c'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.fillStyle = '#d4a93a'; c.fillRect(-.9, -.24, 1.9, .03); c.fillStyle = '#3a2412'; c.fillRect(-.9, -.03, 1.9, .03); c.fillStyle = '#1b120b'; for (let gx = -.48; gx < .6; gx += .14) c.fillRect(gx, -.17, .06, .06); c.restore(); c.stroke();
  c.restore();
}
function flagBadge(c, kind, x, y, label, t, sc) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(sc, sc); c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -110); c.stroke(); flagOf(c, kind, 0, -110, 90, 56, t); c.restore(); txt(c, label, x + 20, y - 150 * sc, { size: 44, weight: 600, sc }); }

// ---------- spice close-ups ----------
function woodTable(c, y0) {
  const g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, '#6a4024'); g.addColorStop(1, '#2e1a0c'); c.fillStyle = g; c.fillRect(0, y0, W, H - y0);
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 5; for (let y = y0 + 90; y < H; y += 150) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + 12); c.stroke(); }
  c.strokeStyle = 'rgba(255,220,170,.06)'; c.lineWidth = 3; for (let i = 0; i < 24; i++) { const y = y0 + 30 + i * 52; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(300, y + 18, 700, y - 18, W, y + 6); c.stroke(); }
}
function spiceHero(c, t, o = {}) { // dramatic close-up of nutmeg + cloves on an old table
  const { glow = 1, rays = 0, aroma = 0, zoom = 1 } = o;
  c.fillStyle = '#120a06'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, 1150); c.scale(zoom, zoom); c.translate(-W / 2, -1150);
  woodTable(c, 820);
  const sp = c.createRadialGradient(W / 2, 1150, 60, W / 2, 1150, 820); sp.addColorStop(0, `rgba(255,214,150,${.42 * glow})`); sp.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = sp; c.fillRect(0, 0, W, H);
  if (rays > 0) { c.save(); c.globalAlpha = rays; c.translate(W / 2, -100); c.rotate(Math.sin(t * .4) * .05); for (let i = -4; i <= 4; i++) { c.save(); c.rotate(i * .09); const g = c.createLinearGradient(0, 0, 0, 1600); g.addColorStop(0, 'rgba(255,230,180,.28)'); g.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, 0); c.lineTo(110, 1600); c.lineTo(-110, 1600); c.fill(); c.restore(); } c.restore(); }
  const R = rng(33); for (let i = 0; i < 26; i++) clove(c, 640 + (R() - .5) * 360, 1240 + (R() - .5) * 120, 95, R() * 6);
  nutmeg(c, 420, 1200, 150, -.3); nutmeg(c, 260, 1290, 95, 1.2); nutmeg(c, 560, 1320, 85, 2.4);
  if (aroma > 0) { c.save(); c.globalAlpha = aroma * .55; c.strokeStyle = '#fff3d6'; c.lineWidth = 10; c.lineCap = 'round'; for (let k = 0; k < 4; k++) { c.beginPath(); for (let i = 0; i <= 30; i++) { const f = i / 30, x = 360 + k * 130 + Math.sin(f * 8 + t * 2 + k) * 40, y = 1100 - f * 650 - ((t * 60) % 60); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.restore(); }
  for (let i = 0; i < 18; i++) { const p = ((t * .12 + i / 18) % 1); c.fillStyle = `rgba(255,220,150,${.5 * Math.sin(p * Math.PI) * glow})`; c.beginPath(); c.arc(80 + ((i * 197) % 920), 1300 - p * 900, 3 + (i % 3) * 2, 0, TAU); c.fill(); }
  c.restore();
  const vg = c.createRadialGradient(W / 2, 1150, 300, W / 2, 1150, 1100); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
}

// ---------- storm ----------
function waveLayer(c, base, amp, f, sp, ph, t, col, foam) {
  c.beginPath(); c.moveTo(-80, H + 20); for (let x = -80; x <= W + 80; x += 20) c.lineTo(x, base + Math.sin(x * f + t * sp + ph) * amp + Math.sin(x * f * 2.3 - t * sp * .7 + ph) * amp * .35); c.lineTo(W + 80, H + 20); c.closePath(); c.fillStyle = col; c.fill();
  if (foam) { c.strokeStyle = 'rgba(240,248,250,.75)'; c.lineWidth = 7; c.beginPath(); for (let x = -80; x <= W + 80; x += 20) { const y = base + Math.sin(x * f + t * sp + ph) * amp + Math.sin(x * f * 2.3 - t * sp * .7 + ph) * amp * .35; x === -80 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
}
const BOLTS = [1.25, 4.55];
function stormScene(c, t) {
  const z = 1 + .9 * io(pr(t, 3.1, 5.4)), fx = 560, fy = 900;
  c.save(); c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy);
  const g = c.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, '#141b24'); g.addColorStop(1, '#4a5866'); c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400);
  c.fillStyle = 'rgba(40,48,58,.85)'; for (let i = 0; i < 7; i++) { const x = ((i * 230 + t * 30) % (W + 400)) - 200; c.beginPath(); c.ellipse(x, 160 + (i % 3) * 70, 260, 90, 0, 0, TAU); c.fill(); }
  waveLayer(c, 1000, 60, .006, 1.4, 0, t, '#24414f', true);
  const by = 1080 + Math.sin(t * 1.8) * 40;
  galleon(c, fx, by, 520, t, { flag: 'pt', roll: .14, crew: (cc, lw) => {
    drawChar(cc, -.42, -.28, .42, { skin: '#f0c6a6', hair: 'fringe', hat: 'beanie', shirt: '#2f4f7a', stripes: '#e8e2d6', expr: 'worried', noShadow: true });
    drawChar(cc, .22, -.28, .44, { skin: '#e8b48a', hair: 'fringe', hairCol: '#4a3220', beard: 'full', shirt: '#7a3a2a', stripes: '#e8d6a8', expr: 'angry', noShadow: true });
    cc.save(); cc.strokeStyle = '#d8c79f'; cc.lineWidth = .02; cc.beginPath(); cc.moveTo(.3, -.6); cc.lineTo(.06, -1.3); cc.stroke(); cc.restore(); drawGlove(cc, .33, -.56 + Math.sin(t * 6) * .02, .14, -.4);
  } });
  waveLayer(c, 1180, 80, .005, 1.9, 2, t, '#1d3644', true);
  waveLayer(c, 1330, 100, .004, 2.4, 4, t, '#162b37', true);
  c.restore();
  c.strokeStyle = 'rgba(200,215,230,.45)'; c.lineWidth = 3; for (let i = 0; i < 120; i++) { const x = (i * 97 + t * 900) % (W + 300) - 150, y = (i * 211 + t * 1700) % (H + 200) - 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 26, y + 70); c.stroke(); }
  for (const b of BOLTS) { const p = pr(t, b, b + .35); if (p > 0 && p < 1) { c.fillStyle = `rgba(230,240,255,${(1 - p) * .55})`; c.fillRect(0, 0, W, H); if (p < .5) { c.strokeStyle = '#f4f8ff'; c.lineWidth = 8; c.beginPath(); let x = 260 + b * 60, y = 0; c.moveTo(x, y); while (y < 800) { x += Math.sin(y * .07 + b) * 50; y += 70; c.lineTo(x, y); } c.stroke(); } } }
}
function spiceHook(c, t) { // 6.6–11.7
  spiceHero(c, t, { zoom: 1 + .05 * (t - 6.6) + .12 * (1 - outC(pr(t, 6.6, 7.0))), glow: 1 });
  const s = env(t, 9.3, 11.75); if (s > 0) { c.save(); c.translate(780, 640); c.rotate(.15 + Math.sin(t * 3) * .06); c.scale(s, s); c.strokeStyle = '#d9c9a4'; c.lineWidth = 6; c.beginPath(); c.moveTo(-60, -140); c.lineTo(0, -60); c.stroke(); c.beginPath(); c.moveTo(-120, -60); c.lineTo(120, -60); c.lineTo(120, 110); c.lineTo(0, 170); c.lineTo(-120, 110); c.closePath(); c.fillStyle = '#c8302a'; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.restore(); txt(c, '???', 780, 690, { size: 96, font: SANS, weight: 700, col: '#fff', stroke: INK, sw: 6, sc: s, rot: 8 }); }
  txt(c, 'segenggam rempah', W / 2, 420, { size: 70, italic: true, a: win(t, 6.8, 9.2), sc: 1 });
}


// =====================================================================
// "Mengapa Singapura Begitu Kecil Tetapi Begitu Powerful" — story
// =====================================================================
const SG = [103.82, 1.35], SG_RED = '#d6282f', MY_COL = '#3f959d', ID_COL = '#c57322';
const byId = {}; const gid = id => byId[id] || (byId[id] = ALLC.filter(r => r.id === id));

// ---------- wardrobe addition ----------
function bodyWear5(c, o, lw) {
  if (typeof bodyWear6 === 'function') bodyWear6(c, o, lw);
  if (o.tie) { c.save(); c.fillStyle = '#f4f1ea'; c.beginPath(); c.moveTo(-.09, -.515); c.lineTo(0, -.38); c.lineTo(.09, -.515); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-.03, -.47); c.lineTo(.03, -.47); c.lineTo(.045, -.2); c.lineTo(0, -.15); c.lineTo(-.045, -.2); c.closePath(); c.fillStyle = o.tie; c.fill(); c.lineWidth = lw * .7; c.strokeStyle = INK; c.stroke(); c.restore(); }
}

// ---------- props ----------
const BOX_COLS = ['#c8302a', '#2f6fa8', '#e2a72e', '#3f8a5a', '#e9e4d8', '#6a4a9e', '#d2691e'];
function containerShip(c, x, y, s, t, o = {}) {
  const { sc = 1, ph = 0, seed = 1, flip = false } = o; if (sc <= .001) return; s *= sc;
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.3 + ph) * .012); c.scale(flip ? -s : s, s); const lw = __lw(c, .008, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  const R = rng(seed);
  for (let r = 0; r < 3; r++) for (let x0 = -.62; x0 < .76; x0 += .12) { if (r === 2 && R() < .3) continue; c.beginPath(); c.rect(x0, -.12 - (r + 1) * .075, .115, .072); c.fillStyle = BOX_COLS[Math.floor(R() * BOX_COLS.length)]; c.fill(); c.stroke(); }
  c.beginPath(); c.rect(-.95, -.44, .24, .32); c.fillStyle = '#f2f0ea'; c.fill(); c.stroke(); c.fillStyle = '#2d3a4a'; c.fillRect(-.93, -.4, .2, .05);
  c.beginPath(); c.rect(-.87, -.56, .08, .12); c.fillStyle = '#c8302a'; c.fill(); c.stroke(); c.fillStyle = INK; c.fillRect(-.87, -.56, .08, .03);
  c.restore();
  c.save(); for (let i = 0; i < 4; i++) { const p = ((t * .4 + i / 4 + ph) % 1); c.globalAlpha = (1 - p) * .5; c.fillStyle = '#9a9a9a'; c.beginPath(); c.arc(x + (flip ? 1 : -1) * s * (.83 + p * .25), y - s * (.6 + p * .35), s * (.04 + p * .06), 0, TAU); c.fill(); } c.restore();
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.3 + ph) * .012); c.scale(flip ? -s : s, s); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-1, -.12); c.lineTo(.85, -.12); c.quadraticCurveTo(1.02, -.12, 1.06, -.22); c.lineTo(.95, .1); c.quadraticCurveTo(.9, .16, .8, .16); c.lineTo(-.95, .16); c.quadraticCurveTo(-1.02, .1, -1, -.12); c.closePath();
  c.save(); c.clip(); c.fillStyle = '#23395d'; c.fillRect(-1.1, -.3, 2.3, .4); c.fillStyle = '#a3201c'; c.fillRect(-1.1, .06, 2.3, .2); c.fillStyle = '#f4f1ea'; c.fillRect(-1.1, .04, 2.3, .02); c.restore(); c.stroke();
  c.restore();
}
function crane(c, x, y, s, t, ph = 0) {
  c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .006, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  const steel = '#3a6ea5', beam = (x0, y0, x1, y1, w) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = w + lw * 2; c.strokeStyle = INK; c.stroke(); c.lineWidth = w; c.strokeStyle = steel; c.stroke(); };
  beam(-.25, 0, -.25, -.78, .04); beam(.25, 0, .25, -.78, .04); beam(-.25, -.4, .25, -.4, .03); beam(-.25, 0, .25, -.4, .015); beam(-.45, -.8, 1.0, -.8, .05); beam(0, -.8, .0, -1.0, .03); beam(0, -1.0, .9, -.82, .012); beam(0, -1.0, -.4, -.82, .012);
  c.lineWidth = lw; c.strokeStyle = INK; c.beginPath(); c.rect(-.22, -.92, .3, .1); c.fillStyle = '#f2f0ea'; c.fill(); c.stroke();
  const tx = lerp(-.1, .82, (Math.sin(t * .9 + ph) + 1) / 2), dep = .25 + .2 * (Math.sin(t * 1.8 + ph * 2) + 1) / 2;
  c.beginPath(); c.rect(tx - .05, -.84, .1, .05); c.fillStyle = '#e2a72e'; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(tx, -.79); c.lineTo(tx, -.79 + dep); c.lineWidth = lw * .8; c.stroke(); c.lineWidth = lw;
  c.beginPath(); c.rect(tx - .09, -.79 + dep, .18, .07); c.fillStyle = BOX_COLS[Math.floor((t * .3 + ph) % BOX_COLS.length)]; c.fill(); c.stroke();
  c.restore();
}
function boxStack(c, x, y, s, seed) { const R = rng(seed); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { if (r === 2 && R() < .4) continue; c.beginPath(); c.rect(x + k * s * 1.02, y - (r + 1) * s * .6, s, s * .58); c.fillStyle = BOX_COLS[Math.floor(R() * BOX_COLS.length)]; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); } }
function factory(c, x, y, s, t, chim = 2, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .008, 2.4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  for (let i = 0; i < chim; i++) { c.beginPath(); c.rect(-.35 + i * .25, -.85, .1, .5); c.fillStyle = '#9a5a3a'; c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(-.5, 0); c.lineTo(-.5, -.35); for (let k = 0; k < 4; k++) { c.lineTo(-.5 + k * .25, -.55); c.lineTo(-.25 + k * .25, -.35); } c.lineTo(.5, 0); c.closePath(); c.fillStyle = '#c9c1b0'; c.fill(); c.stroke();
  c.fillStyle = '#2d3a4a'; for (let k = 0; k < 4; k++) c.fillRect(-.44 + k * .25, -.25, .12, .1);
  c.restore();
  for (let i = 0; i < chim; i++) smoke(c, x + s * (-.3 + i * .25), y - s * .88, s * .08, t, i + 7, .7);
}
function tower(c, x, y, w, h, col, sc = 1) {
  if (sc <= .001) return; const hh = h * sc; c.save(); c.beginPath(); c.rect(x - w / 2, y - hh, w, hh); const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, shade(col, .25)); g.addColorStop(1, shade(col, -.25)); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
  c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.35)'; for (let yy = y - hh + 14; yy < y - 8; yy += 22) for (let xx = x - w / 2 + 8; xx < x + w / 2 - 8; xx += 18) c.fillRect(xx, yy, 9, 11); c.restore(); c.restore();
}
function mbs(c, x, y, s, sc = 1) {
  if (sc <= .001) return; s *= sc; c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = __lw(c, .006, 2.4); c.strokeStyle = INK;
  for (const dx of [-.5, 0, .5]) { c.beginPath(); c.moveTo(dx - .16, 0); c.lineTo(dx - .1, -1); c.lineTo(dx + .1, -1); c.lineTo(dx + .16, 0); c.closePath(); const g = c.createLinearGradient(dx - .16, 0, dx + .16, 0); g.addColorStop(0, '#dfe8ee'); g.addColorStop(1, '#8aa0b0'); c.fillStyle = g; c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(-.85, -1.02); c.quadraticCurveTo(0, -1.12, .9, -1.06); c.lineTo(.9, -1.0); c.quadraticCurveTo(0, -1.06, -.78, -.98); c.closePath(); c.fillStyle = '#5f7a6a'; c.fill(); c.stroke();
  c.restore();
}
function shophouses(c, x0, y, s, n, seed, tint = 0) {
  const R = rng(seed), cols = ['#e8b4a0', '#a8d0c8', '#f2d79a', '#c9b6e0', '#f0c0c8', '#bcd6a8'];
  for (let i = 0; i < n; i++) { const x = x0 + i * s; c.save(); c.beginPath(); c.rect(x, y - s * 1.3, s, s * 1.3); c.fillStyle = cols[Math.floor(R() * cols.length)]; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(x - s * .05, y - s * 1.3); c.lineTo(x + s * .5, y - s * 1.55); c.lineTo(x + s * 1.05, y - s * 1.3); c.closePath(); c.fillStyle = '#a8442e'; c.fill(); c.stroke();
    c.fillStyle = '#4a6a5a'; for (const k of [.2, .6]) { c.fillRect(x + s * k, y - s * 1.12, s * .2, s * .3); c.strokeRect(x + s * k, y - s * 1.12, s * .2, s * .3); }
    c.fillStyle = 'rgba(40,25,15,.55)'; c.beginPath(); c.moveTo(x + s * .15, y); c.lineTo(x + s * .15, y - s * .4); c.arc(x + s * .5, y - s * .4, s * .35, Math.PI, 0); c.lineTo(x + s * .85, y); c.fill(); c.restore(); }
  if (tint) { c.fillStyle = `rgba(150,110,60,${tint})`; c.fillRect(x0, y - s * 1.6, n * s, s * 1.6); }
}
function bumboat(c, x, y, s, t) { c.save(); c.translate(x, y + Math.sin(t * 2 + x) * 3); c.scale(s, s); c.lineWidth = __lw(c, .03, 2.4); c.strokeStyle = INK; c.beginPath(); c.moveTo(-.5, -.1); c.lineTo(.5, -.1); c.quadraticCurveTo(.45, .1, .3, .12); c.lineTo(-.3, .12); c.quadraticCurveTo(-.45, .1, -.5, -.1); c.closePath(); c.fillStyle = '#8b5a2b'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-.25, -.1); c.quadraticCurveTo(0, -.4, .25, -.1); c.closePath(); c.fillStyle = '#d9c9a4'; c.fill(); c.stroke(); c.restore(); }
function redX(c, x, y, s, p) { if (p <= 0) return; c.save(); c.translate(x, y); c.lineCap = 'round'; for (const [w, col] of [[s * .24, INK], [s * .16, '#e8322c']]) { c.lineWidth = w; c.strokeStyle = col; c.beginPath(); c.moveTo(-s / 2, -s / 2); c.lineTo(-s / 2 + s * Math.min(1, p * 2), -s / 2 + s * Math.min(1, p * 2)); c.stroke(); if (p > .5) { const q = (p - .5) * 2; c.beginPath(); c.moveTo(s / 2, -s / 2); c.lineTo(s / 2 - s * q, -s / 2 + s * q); c.stroke(); } } c.restore(); }
function dropIcon(c, x, y, s, col, sc = 1) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(s * sc, s * sc); c.beginPath(); c.moveTo(0, -.6); c.bezierCurveTo(.35, -.15, .45, .1, .4, .25); c.arc(0, .25, .4, 0, Math.PI); c.bezierCurveTo(-.45, .1, -.35, -.15, 0, -.6); c.closePath(); const g = c.createLinearGradient(-.4, 0, .4, 0); g.addColorStop(0, shade(col, .35)); g.addColorStop(1, col); c.fillStyle = g; c.fill(); c.lineWidth = .06; c.strokeStyle = INK; c.stroke(); c.restore(); }
function treeIcon(c, x, y, s, sc = 1) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(s * sc, s * sc); c.lineWidth = .06; c.strokeStyle = INK; c.fillStyle = '#7a4a26'; c.beginPath(); c.rect(-.08, 0, .16, .45); c.fill(); c.stroke(); outlinedBlobs(c, [[0, -.2, .3], [-.25, .02, .22], [.25, .02, .22]], '#4f8a3a', .06); c.restore(); }
function oreIcon(c, x, y, s, sc = 1) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(s * sc, s * sc); c.beginPath(); c.moveTo(-.45, .3); c.lineTo(-.35, -.15); c.lineTo(-.05, -.4); c.lineTo(.35, -.25); c.lineTo(.45, .2); c.lineTo(.1, .4); c.closePath(); c.fillStyle = '#8a8a8a'; c.fill(); c.lineWidth = .06; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#f2c43a'; for (const [px, py] of [[-.1, -.1], [.15, .1], [-.2, .15]]) { c.beginPath(); c.arc(px, py, .07, 0, TAU); c.fill(); } c.restore(); }
function chart(c, x, y, w, h, p, up, sc = 1) {
  if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(sc, sc); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 18); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  c.strokeStyle = '#c8c3b8'; c.lineWidth = 3; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-w / 2 + 20, -h / 2 + i * h / 4); c.lineTo(w / 2 - 20, -h / 2 + i * h / 4); c.stroke(); }
  const pts = up ? [[0, .8], [.2, .7], [.4, .55], [.6, .5], [.8, .3], [1, .12]] : [[0, .2], [.2, .3], [.4, .28], [.6, .5], [.8, .62], [1, .85]], col = up ? '#2f9a4a' : '#d6282f';
  c.beginPath(); pts.forEach(([u, v], i) => { const f = Math.min(1, p * pts.length - i); if (f < 0) return; const px = -w / 2 + 30 + u * (w - 60), py = -h / 2 + 20 + v * (h - 40); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.lineWidth = 12; c.strokeStyle = col; c.lineJoin = 'round'; c.stroke();
  c.restore();
}
function briefcase(c, x, y, s) { c.save(); c.lineWidth = 3; c.strokeStyle = INK; c.fillStyle = '#7a4a26'; c.beginPath(); c.roundRect(x - s / 2, y - s * .35, s, s * .7, 6); c.fill(); c.stroke(); c.beginPath(); c.roundRect(x - s * .15, y - s * .5, s * .3, s * .17, 4); c.stroke(); c.restore(); }


// =====================================================================
// "Amerika Beli Wilayah Segede Benua, Cuma Seharga $15 Juta?!" — story
// =====================================================================
const FR_BLUE = '#244ca0', US_TEAL = '#3f959d', ES_ORANGE = '#c57322', GB_RED = '#be3c30', HT_GREEN = '#35791c';
const NOLA = [-90.07, 29.95];
const MISS = [[-95.2, 47.2], [-94.3, 46.4], [-93.1, 45.0], [-92.0, 44.6], [-91.2, 43.0], [-91.1, 41.5], [-91.4, 40.2], [-90.2, 38.6], [-89.2, 37.0], [-89.6, 36.5], [-90.1, 35.1], [-90.6, 34.4], [-91.1, 33.3], [-91.4, 32.3], [-91.6, 31.0], [-91.2, 30.4], [-90.3, 29.95], [-89.4, 29.2]];
const MISS_N = MISS.slice(0, 15); // source down to 31°N
const RG = {
  louis: toRing([[-95.2, 49.0], [-104, 49], [-114, 49], [-113.5, 47], [-112, 45], [-110, 43], [-106.5, 41], [-105.5, 38], [-103, 36], [-100, 34.6], [-96, 33.8], [-94, 33.5], [-94, 31.5], [-93.8, 29.7], [-90.8, 28.6], [-88.9, 29.0], [-89.0, 30.2], [-89.6, 30.5], ...MISS_N.slice().reverse(), [-95.2, 49.0]], 'louis'),
  usa: toRing([[-95.2, 49.0], [-89.6, 48.0], [-84.5, 46.5], [-82.4, 45.3], [-82.5, 42.3], [-79, 42.8], [-76.5, 43.6], [-75, 45], [-71.5, 45], [-69.2, 47.4], [-67.8, 47.1], [-60, 44], [-70, 34], [-79, 30.8], [-81.5, 30.7], [-84.9, 31.0], [-91.6, 31.0], ...MISS_N.slice().reverse().slice(1), [-95.2, 49.0]], 'usa'),
  spain: toRing([[-124.5, 42], [-111, 42], [-110, 43], [-106.5, 41], [-105.5, 38], [-103, 36], [-100, 34.6], [-96, 33.8], [-94, 33.5], [-94, 31.5], [-93.8, 29.7], [-97, 25], [-90, 19.5], [-86.5, 21.5], [-86, 15], [-83, 8], [-78, 7], [-95, 13], [-118, 30], [-124.5, 42]], 'spain'),
  florida: toRing([[-91.6, 31.0], [-84.9, 31.0], [-81.5, 30.7], [-79.6, 30.7], [-79.8, 24.0], [-82.5, 24.3], [-88, 29.6], [-89.6, 30.5]], 'fl'),
  brit: toRing([[-141, 70], [-141, 60], [-130, 55], [-123, 49], [-95.2, 49], [-89.6, 48], [-84.5, 46.5], [-82.4, 45.3], [-82.5, 42.3], [-79, 42.8], [-76.5, 43.6], [-75, 45], [-71.5, 45], [-69.2, 47.4], [-67.8, 47.1], [-60, 44], [-50, 50], [-60, 62], [-80, 66], [-100, 76], [-141, 70]], 'brit'),
  orleans: toRing([[-91.6, 31.0], [-89.6, 30.5], [-89.0, 30.2], [-89.3, 29.2], [-90.3, 28.9], [-90.9, 29.4], [-91.3, 30.3]], 'nola'),
  sd: toRing([[-74.6, 18.4], [-72.8, 18.0], [-71.7, 18.0], [-71.7, 19.8], [-72.8, 20.05], [-73.6, 19.9], [-73.1, 19.4], [-72.7, 19.0], [-74.5, 18.7]], 'sd'),
};

// ---------- wardrobe ----------
function bodyWear6(c, o, lw) {
  if (typeof bodyWearCustom === 'function') bodyWearCustom(c, o, lw);
  if (o.cravat) { c.save(); c.beginPath(); c.moveTo(-.12, -.53); c.quadraticCurveTo(0, -.45, .12, -.53); c.lineTo(.06, -.36); c.quadraticCurveTo(0, -.32, -.06, -.36); c.closePath(); c.fillStyle = '#fbfaf6'; c.fill(); c.lineWidth = lw * .8; c.strokeStyle = INK; c.stroke(); c.restore(); }
  if (o.epaulette) { for (const s of [-1, 1]) { c.save(); c.beginPath(); c.ellipse(s * .25, -.44, .1, .05, s * .4, 0, TAU); c.fillStyle = '#d4a93a'; c.fill(); c.lineWidth = lw * .8; c.strokeStyle = INK; c.stroke(); c.restore(); } }
}
function extraWear6(c, o, hy, lw) {
  if (typeof extraWearCustom === 'function') extraWearCustom(c, o, hy, lw);
  const f = (col) => { c.fillStyle = col; c.fill(); c.stroke(); };
  if (o.hair === 'wig') {
    const wc = o.hairCol || '#eeeae2';
    c.beginPath(); c.ellipse(0, hy, .315, .272, 0, Math.PI, TAU); c.lineTo(.3, hy - .02); c.quadraticCurveTo(0, hy - .14, -.3, hy - .02); c.closePath(); f(wc);
    outlinedBlobs(c, [[-.31, hy + .02, .07], [-.31, hy + .13, .065], [.31, hy + .02, .07], [.31, hy + .13, .065]], wc, lw);
  }
  if (o.hat === 'bicorne') {
    c.beginPath(); c.moveTo(-.5, hy - .12); c.quadraticCurveTo(-.3, hy - .2, -.2, hy - .38); c.quadraticCurveTo(0, hy - .58, .2, hy - .38); c.quadraticCurveTo(.3, hy - .2, .5, hy - .12); c.quadraticCurveTo(0, hy - .26, -.5, hy - .12); c.closePath(); f('#1d1b1a');
    c.save(); c.strokeStyle = '#d4a93a'; c.lineWidth = lw; c.beginPath(); c.moveTo(-.46, hy - .14); c.quadraticCurveTo(0, hy - .27, .46, hy - .14); c.stroke(); c.restore();
    for (const [r, col] of [[.07, FR_BLUE], [.05, '#f4f1ea'], [.03, '#c8302a']]) { c.beginPath(); c.arc(-.16, hy - .3, r, 0, TAU); c.fillStyle = col; c.fill(); } c.beginPath(); c.arc(-.16, hy - .3, .07, 0, TAU); c.stroke();
  } else if (o.hat === 'shako') {
    c.beginPath(); c.moveTo(-.24, hy - .18); c.lineTo(-.2, hy - .6); c.lineTo(.2, hy - .6); c.lineTo(.24, hy - .18); c.closePath(); f('#1d1b1a');
    c.beginPath(); c.ellipse(0, hy - .18, .3, .05, 0, 0, TAU); f('#1d1b1a');
    c.beginPath(); c.moveTo(-.06, hy - .44); c.lineTo(0, hy - .52); c.lineTo(.06, hy - .44); c.lineTo(0, hy - .32); c.closePath(); f('#d4a93a');
    c.beginPath(); c.ellipse(0, hy - .7, .05, .1, 0, 0, TAU); f('#c8302a');
  } else if (o.hat === 'headwrap') { c.beginPath(); c.ellipse(0, hy - .16, .33, .16, 0, Math.PI, TAU); c.lineTo(.33, hy - .08); c.quadraticCurveTo(0, hy, -.33, hy - .08); c.closePath(); f(o.wrap || '#c8302a'); c.beginPath(); c.ellipse(.18, hy - .3, .09, .06, .5, 0, TAU); f(o.wrap || '#c8302a'); }
}

// ---------- props ----------
function flagFR(c, x, y, w, h) { c.fillStyle = FR_BLUE; c.fillRect(x, y, w / 3, h); c.fillStyle = '#f7f5f0'; c.fillRect(x + w / 3, y, w / 3, h); c.fillStyle = '#c8302a'; c.fillRect(x + 2 * w / 3, y, w / 3, h); }
function flagUS15(c, x, y, w, h) { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#f7f5f0' : '#b22234'; c.fillRect(x, y + i * h / 13, w, h / 13 + .5); } c.fillStyle = '#3c3b6e'; c.fillRect(x, y, w * .42, h * 7 / 13); }
function flagHT(c, x, y, w, h) { c.fillStyle = '#00209f'; c.fillRect(x, y, w, h / 2); c.fillStyle = '#d21034'; c.fillRect(x, y + h / 2, w, h / 2); }
function flagPole(c, x, y, s, kind, t, sc = 1) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(sc, sc); c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s); c.stroke(); const w = s * .62, h = s * .4, wv = Math.sin(t * 6) * 4; c.save(); c.translate(0, -s + wv); if (kind === 'fr') flagFR(c, 0, 0, w, h); else if (kind === 'us') flagUS15(c, 0, 0, w, h); else flagHT(c, 0, 0, w, h); c.lineWidth = 3; c.strokeRect(0, 0, w, h); c.restore(); c.restore(); }
function keelboat(c, x, y, s, t) { c.save(); c.translate(x, y + Math.sin(t * 3 + x) * 2); c.scale(s, s); c.lineWidth = __lw(c, .04, 2.2); c.strokeStyle = INK; c.beginPath(); c.moveTo(-.5, -.08); c.lineTo(.5, -.08); c.lineTo(.42, .1); c.lineTo(-.42, .1); c.closePath(); c.fillStyle = '#8b5a2b'; c.fill(); c.stroke(); c.beginPath(); c.rect(-.25, -.3, .4, .22); c.fillStyle = '#c9a26b'; c.fill(); c.stroke(); for (const bx of [.25, .38]) { c.beginPath(); c.ellipse(bx, -.15, .06, .08, 0, 0, TAU); c.fillStyle = '#7a4a26'; c.fill(); c.stroke(); } c.restore(); }
function caneField(c, y0, t) { for (let row = 0; row < 3; row++) { const y = y0 + row * 70; for (let x = -40; x < W + 40; x += 34) { const sw = Math.sin(t * 1.5 + x * .02 + row) * 8; c.strokeStyle = row % 2 ? '#5f8f3a' : '#6fa043'; c.lineWidth = 9; c.beginPath(); c.moveTo(x, y + 90); c.quadraticCurveTo(x + sw * .5, y + 20, x + sw, y - 70); c.stroke(); c.fillStyle = '#4f7f2f'; c.beginPath(); c.ellipse(x + sw + 14, y - 60, 26, 7, -.6, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + sw - 14, y - 40, 26, 7, .6, 0, TAU); c.fill(); } } }
function coffeeShrub(c, x, y, s) { outlinedBlobs(c, [[x, y - s * .5, s * .45], [x - s * .4, y - s * .3, s * .35], [x + s * .4, y - s * .3, s * .35]], '#3f6f2f', 4); c.fillStyle = '#c8302a'; const R = rng(Math.round(x)); for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(x + (R() - .5) * s * 1.2, y - s * .2 - R() * s * .6, s * .05, 0, TAU); c.fill(); } }
function caneBundle(c, x, y, s) { c.save(); c.translate(x, y); c.rotate(-.3); c.strokeStyle = '#7a9a3a'; c.lineWidth = s * .06; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-s * .5, i * s * .05); c.lineTo(s * .5, i * s * .05); c.stroke(); } c.strokeStyle = '#8b5a2b'; c.lineWidth = s * .05; c.beginPath(); c.moveTo(0, -s * .15); c.lineTo(0, s * .15); c.stroke(); c.restore(); }
function mosquito(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = .02; c.strokeStyle = '#2b2018'; c.lineCap = 'round';
  for (const k of [-1, 0, 1]) for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(k * .08, .02); c.quadraticCurveTo(sd * .3, .1 + k * .05, sd * .55, .45 + k * .08); c.stroke(); }
  c.fillStyle = 'rgba(200,215,225,.6)'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * .25, -.18, .26, .08, sd * -.5, 0, TAU); c.fill(); c.stroke(); }
  c.fillStyle = '#3a2e26'; c.beginPath(); c.ellipse(0, 0, .07, .12, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(.0, .3, .06, .22, 0, 0, TAU); c.fill(); c.strokeStyle = '#e8e0d0'; c.lineWidth = .015; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-.05, .14 + i * .08); c.lineTo(.05, .14 + i * .08); c.stroke(); }
  c.fillStyle = '#3a2e26'; c.beginPath(); c.arc(0, -.15, .06, 0, TAU); c.fill(); c.strokeStyle = '#2b2018'; c.lineWidth = .015; c.beginPath(); c.moveTo(0, -.2); c.lineTo(0, -.42); c.stroke();
  c.restore();
}
function thermometer(c, x, y, s, p) { c.save(); c.translate(x, y); c.lineWidth = 5; c.strokeStyle = INK; c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-s * .08, -s, s * .16, s * .9, s * .08); c.fill(); c.stroke(); c.beginPath(); c.arc(0, 0, s * .16, 0, TAU); c.fillStyle = '#d6282f'; c.fill(); c.stroke(); c.fillStyle = '#d6282f'; c.fillRect(-s * .04, -s * .1 - s * .8 * p, s * .08, s * .8 * p + s * .1); c.restore(); }
function bubbleSay(c, x, y, s, text, sc) { if (sc <= .001) return; c.save(); c.translate(x, y); c.scale(sc, sc); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, s, s * .62, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(-s * .2, s * .55); c.lineTo(-s * .45, s * .95); c.lineTo(s * .05, s * .58); c.fill(); c.restore(); txt(c, text, x, y, { size: s * .55, font: SANS, weight: 700, col: INK, shadow: false, sc }); }


// =====================================================================
// Prop dari video Tambora
// =====================================================================
// ---------- warna ----------
const hexRgb = h => { if (h[0] !== '#') return h.match(/\d+/g).map(Number); const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const mixCol = (a, b, p) => { const A = hexRgb(a), B = hexRgb(b); return `rgb(${lerp(A[0], B[0], p) | 0},${lerp(A[1], B[1], p) | 0},${lerp(A[2], B[2], p) | 0})`; };

// ---------- kalender: head di pita merah, big di tengah; o: {bigSize, grid, fold} ----------
function calendar(c, x, y, w, h, head, big, sc = 1, rot = 0, o = {}) {
  if (sc <= .001) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc * (o.fold ?? 1));
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 24; c.shadowOffsetY = 8; c.fillStyle = '#f7f1e3'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, w * .04); c.fill(); c.shadowColor = 'transparent';
  c.lineWidth = Math.max(5, w * .012); c.strokeStyle = INK; c.stroke();
  c.save(); c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h * .26, w * .04); c.clip(); c.fillStyle = '#c8302a'; c.fillRect(-w / 2, -h / 2, w, h * .26); c.restore();
  c.beginPath(); c.moveTo(-w / 2, -h / 2 + h * .26); c.lineTo(w / 2, -h / 2 + h * .26); c.stroke();
  for (const k of [-.25, .25]) { c.beginPath(); c.roundRect(k * w - w * .025, -h / 2 - h * .05, w * .05, h * .1, w * .02); c.fillStyle = '#d7d2c6'; c.fill(); c.stroke(); }
  txt(c, head, 0, -h / 2 + h * .13, { size: h * .135, font: SANS, weight: 700, shadow: false });
  txt(c, big, 0, h * (o.grid ? -.02 : .13), { size: o.bigSize || h * .36, font: SANS, weight: 700, col: INK, shadow: false });
  if (o.grid) { c.fillStyle = 'rgba(30,30,30,.45)'; for (let r = 0; r < 3; r++) for (let q = 0; q < 7; q++) { c.beginPath(); c.arc(-w * .36 + q * w * .12, h * .2 + r * h * .085, w * .018, 0, TAU); c.fill(); } }
  c.restore();
}

// ---------- bumi 3D: spaceBg + globe; o: {cold 0-1, haze 0-1, hazeFrom:[lon,lat]} ----------
function spaceBg(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#070c20'); g.addColorStop(1, '#16244a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const R = rng(31); c.fillStyle = '#f4f1e2'; for (let i = 0; i < 170; i++) { const x = R() * W, y = R() * H, r = .8 + R() * 2.4, ph = R() * 7; c.globalAlpha = .45 + .45 * Math.sin(t * 2 + ph) ** 2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } c.globalAlpha = 1;
}
function droplet(c, x, y, r, a = 1) { if (r <= .5) return; c.save(); c.globalAlpha *= a; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#f4dc6a'; c.fill(); c.lineWidth = Math.max(2, r * .16); c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .26, 0, TAU); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(); c.restore(); }
let GLOBE_LAND = null, GLOBE_HAZE = null;
const globeUnit = (lon, lat) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
function globeData() {
  if (GLOBE_LAND) return GLOBE_LAND; GLOBE_LAND = [];
  for (const r of LANDW) {
    const n = r.p.length / 2; if (n < 10 || r.bb[3] < mY(-60)) continue; const st = Math.max(1, Math.floor(n / 900)), a = [];
    for (let i = 0; i < n; i += st) a.push(...globeUnit(r.p[2 * i], 2 * Math.atan(Math.exp(r.p[2 * i + 1])) - Math.PI / 2));
    GLOBE_LAND.push(new Float32Array(a));
  }
  const R = rng(55); GLOBE_HAZE = []; for (let i = 0; i < 420; i++) { const z = R() * 2 - 1, th = R() * TAU, s = Math.sqrt(1 - z * z); GLOBE_HAZE.push([s * Math.sin(th), z, s * Math.cos(th), 3 + R() * 7]); }
  return GLOBE_LAND;
}
const globeRot = (x, y, z, cl, sl, cf, sf) => { const X = x * cl - z * sl, Z = z * cl + x * sl; return [X, y * cf - Z * sf, y * sf + Z * cf]; };
function globe(c, cx, cy, R, lon0, lat0, t, o = {}) {
  const data = globeData(), l = lon0 * D2R, f = lat0 * D2R, cl = Math.cos(l), sl = Math.sin(l), cf = Math.cos(f), sf = Math.sin(f), cold = o.cold || 0, haze = o.haze || 0;
  const glow = c.createRadialGradient(cx, cy, R * .94, cx, cy, R * 1.22); const hz = Math.min(1, haze * 1.4); glow.addColorStop(0, hz > 0 ? `rgba(244,220,106,${.25 + .5 * hz})` : 'rgba(150,200,255,.5)'); glow.addColorStop(1, 'rgba(120,180,255,0)'); c.fillStyle = glow; c.beginPath(); c.arc(cx, cy, R * 1.22, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip(); c.fillStyle = mixCol(SEA, '#54789a', cold); c.fillRect(cx - R, cy - R, R * 2, R * 2);
  const pat = c.createPattern(TEX, 'repeat');
  c.beginPath();
  for (const a of data) {
    let vis = false, started = false;
    for (let i = 0; i < a.length; i += 3) { const [x, y, z] = globeRot(a[i], a[i + 1], a[i + 2], cl, sl, cf, sf); if (z > 0) { vis = true; break; } }
    if (!vis) continue;
    for (let i = 0; i < a.length; i += 3) {
      const [x, y, z] = globeRot(a[i], a[i + 1], a[i + 2], cl, sl, cf, sf); let px = x, py = y; if (z < 0) { const d = Math.hypot(x, y) || 1; px = x / d; py = y / d; }
      const X = cx + R * px, Y = cy - R * py; if (!started) { c.moveTo(X, Y); started = true; } else c.lineTo(X, Y);
    }
    c.closePath();
  }
  c.fillStyle = mixCol(LAND, '#e6eef3', cold); c.fill();
  c.save(); c.clip(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = lerp(.55, .22, cold); c.fillStyle = pat; c.fillRect(cx - R, cy - R, R * 2, R * 2); c.restore();
  c.lineWidth = Math.max(2.5, R * .007); c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
  // tudung es kutub
  for (const [poleLat, sg] of [[lerp(74, 52, cold), 1], [lerp(-68, -52, cold), -1]]) {
    c.beginPath(); let st = false; for (let d = 0; d <= 360; d += 6) { const [x, y, z] = globeRot(...globeUnit(d * D2R, (poleLat + Math.sin(d * .19) * 2.5) * D2R), cl, sl, cf, sf); let px = x, py = y; if (z < 0) { const q = Math.hypot(x, y) || 1; px = x / q; py = y / q; } const X = cx + R * px, Y = cy - R * py; st ? c.lineTo(X, Y) : c.moveTo(X, Y); st = true; }
    c.closePath(); c.fillStyle = '#f3f7f8'; c.globalAlpha = lerp(.92, .7, cold); c.fill(); c.globalAlpha = 1;
  }
  // bayangan bulat supaya terasa sebagai bola
  const sh = c.createRadialGradient(cx - R * .35, cy - R * .4, R * .2, cx, cy, R * 1.05); sh.addColorStop(0, 'rgba(255,255,255,.1)'); sh.addColorStop(.65, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(5,10,30,.55)'); c.fillStyle = sh; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  c.restore();
  // partikel aerosol menyebar dari Tambora
  if (haze > 0) {
    const hf = o.hazeFrom || [lon0, lat0], src = globeUnit(hf[0] * D2R, hf[1] * D2R);
    for (const [hx, hy, hz2, r] of GLOBE_HAZE) {
      const d = Math.acos(clamp(hx * src[0] + hy * src[1] + hz2 * src[2], -1, 1)) / Math.PI; if (d > haze) continue;
      const [x, y, z] = globeRot(hx, hy, hz2, cl, sl, cf, sf); if (z < 0) continue;
      droplet(c, cx + R * 1.02 * x, cy - R * 1.02 * y, r * (.45 + .55 * z) * R / 420 * Math.min(1, (haze - d) * 12), .9);
    }
  }
  c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.lineWidth = Math.max(5, R * .018); c.strokeStyle = INK; c.stroke();
}
function globePt(cx, cy, R, lon0, lat0, lon, lat) { const l = lon0 * D2R, f = lat0 * D2R, [x, y, z] = globeRot(...globeUnit(lon * D2R, lat * D2R), Math.cos(l), Math.sin(l), Math.cos(f), Math.sin(f)); return [cx + R * x, cy - R * y, z]; }

// ---------- letusan: gunung besar + kolom abu ----------
function stratoVolcano(c, x, y, s, lava, t) {
  c.save(); c.translate(x, y); c.scale(s, s); const lw = __lw(c, .012, 4); c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round';
  const shape = () => { c.beginPath(); c.moveTo(-1.5, 0); c.quadraticCurveTo(-.55, -.2, -.17, -.85); c.lineTo(.17, -.85); c.quadraticCurveTo(.55, -.2, 1.5, 0); c.closePath(); };
  shape(); const g = c.createLinearGradient(-.8, 0, .8, 0); g.addColorStop(0, mixCol('#8b6e52', '#6a4a36', lava)); g.addColorStop(1, mixCol('#574233', '#33241c', lava)); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.beginPath(); c.moveTo(-1.6, 0); for (let i = 0; i <= 28; i++) { const u = -1.6 + i / 28 * 3.2; c.lineTo(u, -.32 - .08 * Math.sin(u * 9) - .04 * Math.sin(u * 23)); } c.lineTo(1.6, 0); c.closePath(); c.fillStyle = mixCol('#567e3e', '#3a3b2c', lava); c.fill();
  if (lava > 0) { c.fillStyle = '#ff7a1a'; for (const [u0, u1, w] of [[-.08, -.42, .05], [.06, .34, .045], [0, -.08, .04]]) { c.beginPath(); c.moveTo(u0 - w * .6, -.85); c.quadraticCurveTo(u0 - w, -.85 + .4 * lava * .7, lerp(u0, u1, lava) - w * .4, -.85 + .75 * lava); c.lineTo(lerp(u0, u1, lava) + w * .4, -.85 + .75 * lava); c.quadraticCurveTo(u0 + w, -.85 + .4 * lava * .7, u0 + w * .6, -.85); c.fill(); } }
  c.restore(); shape(); c.stroke();
  c.beginPath(); c.ellipse(0, -.85, .17, .04, 0, 0, TAU); c.fillStyle = lava > 0 ? '#ffb02a' : '#3a2c22'; c.fill(); c.stroke(); c.restore();
}
function eruptionPlume(c, x, y, S, p, t, wk = 1) {
  if (p <= 0) return; const hTop = S * p, N = 15, col = [], top = [], gw = lerp(.4, 1, p) * wk;
  for (let i = 0; i <= N; i++) { const f = i / N, h = hTop * f, rr = lerp(.06, .14, f) * S * gw; for (let j = -1; j <= 1; j++) { const r = rr * (.62 + .2 * Math.sin(i * 3.1 + j * 2 + t * 1.3)); col.push([x + j * rr * .62 + Math.sin(i * 1.7 + t * 1.1) * rr * .25, y - h, r]); } }
  const up = pr(p, .55, 1); if (up > 0) for (let k = -10; k <= 10; k++) { const a = k / 10; top.push([x + a * S * .62 * up * lerp(1, wk, .5) + Math.sin(k * 1.9 + t * .9) * 12, y - hTop * (.97 - .1 * a * a) + Math.sin(k * 2.7) * S * .02, S * (.13 - .05 * Math.abs(a)) * (.5 + .5 * up) * (1 + .1 * Math.sin(k * 3 + t * 1.2))]); }
  const all = col.concat(top); outlinedBlobs(c, all, '#5a5350', Math.max(4, S * .004));
  c.fillStyle = '#7c746e'; c.beginPath(); for (const [bx, by, r] of all) { const m = r * .62, ox = bx - r * .22, oy = by - r * .22; c.moveTo(ox + m, oy); c.arc(ox, oy, m, 0, TAU); } c.fill();
  c.fillStyle = '#a0978f'; c.beginPath(); for (const [bx, by, r] of all) { const m = r * .28, ox = bx - r * .36, oy = by - r * .38; c.moveTo(ox + m, oy); c.arc(ox, oy, m, 0, TAU); } c.fill();
}

// ---------- shared helpers ----------
const projector = (cam, w, h) => { const cx = cam.lon * D2R, cy = mY(cam.lat), k = cam.k; return (lon, lat) => [w / 2 + (lon * D2R - cx) * k, h / 2 - (mY(lat) - cy) * k]; };
