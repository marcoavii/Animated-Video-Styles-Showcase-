// Core drawing kit: math, ink shapes, the puppet rig and the characters.
'use strict';
// W,H = the fixed stage every shot draws on. OW,OH = the output canvas for the chosen ratio.
const W = 1920, H = 1080;
const RATIO = new URLSearchParams(location.search).get('ratio') === '9:16' ? '9:16' : '16:9';
const PORTRAIT = RATIO === '9:16';
const OW = PORTRAIT ? 1080 : 1920, OH = PORTRAIT ? 1920 : 1080;
const INK = '#07090e';
const NOW = { t: 0 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const inCubic = k => k * k * k;
const outCubic = k => 1 - Math.pow(1 - k, 3);
const outQuart = k => 1 - Math.pow(1 - k, 4);
const inOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const outBack = (k, s = 1.9) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const outElastic = k => k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * 2.094) + 1;
const pop = (t, t0, d = .22) => outBack(seg(t, t0, t0 + d));
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
function RNG(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// Smooth Catmull-Rom path through points.
function sp(pts, closed = true) {
  const p = new Path2D(), n = pts.length;
  const g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0, m = closed ? n : n - 1; i < m; i++) {
    const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2);
    p.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]);
  }
  if (closed) p.closePath();
  return p;
}
function poly(pts, closed = true) { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; }
function ell(x, y, rx, ry = rx, rot = 0) { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, 6.2832); return p; }
function rrect(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
function lin(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }
function rad(c, x, y, r, stops, r0 = 0) { const g = c.createRadialGradient(x, y, r0, x, y, r); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }

// Filled shape with optional clipped shading and an ink line.
function ink(c, path, fill, lw = 5, shade = null, stroke = INK) {
  c.fillStyle = fill; c.fill(path);
  if (shade) { c.save(); c.clip(path); shade(c); c.restore(); }
  if (lw) { c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = stroke; c.stroke(path); }
}
function line(c, pts, lw = 4, col = INK, smooth = false) {
  c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col;
  c.stroke(smooth ? sp(pts, false) : poly(pts, false));
}
function softGlow(c, x, y, r, col, a = 1) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  c.fillStyle = rad(c, x, y, r, [[0, col], [1, 'rgba(0,0,0,0)']]);
  c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
function label(c, txt, x, y, size, opt = {}) {
  c.save();
  c.font = `${opt.weight || 800} ${size}px ${opt.font || 'Rubik'}`;
  c.textAlign = opt.align || 'center'; c.textBaseline = 'middle';
  if (opt.spacing) c.letterSpacing = opt.spacing + 'px';
  if (opt.rot) { c.translate(x, y); c.rotate(opt.rot); x = 0; y = 0; }
  if (opt.stroke) { c.lineJoin = 'round'; c.lineWidth = opt.lw || size * .18; c.strokeStyle = opt.stroke; c.strokeText(txt, x, y); }
  c.fillStyle = opt.fill || '#fff'; c.fillText(txt, x, y);
  c.restore();
}

// ---------- Puppet rig: a soft dark halo around the whole silhouette, then parts in order ----------
class Rig {
  constructor(c, halo = 7) { this.c = c; this.parts = []; this.halo = halo; }
  shape(path, fill, lw = 5, shade = null) { this.parts.push({ k: 's', path, fill, lw, shade, m: this.c.getTransform() }); return this; }
  tube(pts, w, col, shadeCol = null) { this.parts.push({ k: 't', path: sp(pts, false), w, col, shadeCol, m: this.c.getTransform() }); return this; }
  fn(f) { this.parts.push({ k: 'f', f, m: this.c.getTransform() }); return this; }
  draw() {
    const c = this.c, base = c.getTransform();
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = 'rgba(10,14,22,1)';
    for (const p of this.parts) {
      if (p.k === 'f') continue;
      c.setTransform(p.m);
      if (p.k === 's') { c.lineWidth = (p.lw + this.halo) * 2; c.stroke(p.path); }
      else { c.lineWidth = p.w + (5 + this.halo) * 2; c.stroke(p.path); }
    }
    for (const p of this.parts) {
      c.setTransform(p.m);
      if (p.k === 's') ink(c, p.path, p.fill, p.lw, p.shade);
      else if (p.k === 't') {
        c.lineWidth = p.w + 10; c.strokeStyle = INK; c.stroke(p.path);
        c.lineWidth = p.w; c.strokeStyle = p.col; c.stroke(p.path);
        if (p.shadeCol) {
          c.save(); c.translate(p.w * .17, p.w * .17); c.lineWidth = p.w * .56; c.strokeStyle = p.shadeCol; c.stroke(p.path); c.restore();
        }
      } else p.f(c);
    }
    c.setTransform(base);
  }
}

// ---------- Faces ----------
function face(c, r, kind = 'neutral', o = {}) {
  const lx = (o.lookX || 0) * r * .12, ly = (o.lookY || 0) * r * .1;
  c.save(); c.translate(lx, ly + r * .04);
  const dot = (x, y, s = .075) => { c.fillStyle = INK; c.fill(ell(x * r, y * r, s * r)); };
  const brow = (x0, y0, x1, y1, w = .1) => line(c, [[x0 * r, y0 * r], [x1 * r, y1 * r]], w * r);
  const mouth = (pts, w = .05) => line(c, pts.map(q => [q[0] * r, q[1] * r]), w * r, INK, true);
  const bigEye = (x, y, s = .2, px = 0, py = 0) => {
    ink(c, ell(x * r, y * r, s * r), '#fff', r * .035);
    c.fillStyle = INK; c.fill(ell((x + px) * r, (y + py) * r, s * r * .28));
  };
  const blink = o.blink;
  switch (kind) {
    case 'angry':
      c.fillStyle = INK;
      c.fill(poly([[-.56 * r, -.3 * r], [-.12 * r, -.06 * r], [-.14 * r, .02 * r], [-.5 * r, -.14 * r]]));
      c.fill(poly([[.5 * r, -.26 * r], [.1 * r, -.06 * r], [.12 * r, .02 * r], [.46 * r, -.12 * r]]));
      if (!blink) { dot(-.27, -.02, .07); dot(.27, -.02, .07); }
      mouth([[-.16, .36], [.02, .31], [.18, .37]]);
      break;
    case 'blank':
      if (blink) { brow(-.34, -.02, -.18, -.02, .05); brow(.18, -.02, .34, -.02, .05); }
      else { dot(-.26, -.02, .06); dot(.26, -.02, .06); }
      mouth([[-.1, .32], [.1, .32]]);
      break;
    case 'worried':
      brow(-.42, -.3, -.14, -.42, .07); brow(.14, -.42, .42, -.3, .07);
      bigEye(-.27, -.04, .19, .02, .03); bigEye(.27, -.04, .19, -.02, .03);
      mouth([[-.16, .4], [-.06, .34], [.06, .4], [.16, .34]]);
      break;
    case 'shock':
      brow(-.44, -.42, -.14, -.5, .07); brow(.14, -.5, .44, -.42, .07);
      bigEye(-.27, -.1, .22, 0, 0); bigEye(.27, -.1, .22, 0, 0);
      ink(c, ell(0, .4 * r, .13 * r, .17 * r), '#3a0c10', r * .035);
      break;
    case 'smug': {
      c.fillStyle = INK; c.fill(poly([[-.52 * r, -.2 * r], [-.12 * r, -.14 * r], [-.14 * r, -.07 * r], [-.5 * r, -.1 * r]]));
      dot(-.28, 0, .065);
      const s = new Path2D(); for (let a = 0; a < 15; a += .25) { const q = a * .019 * r; const px = .28 * r + Math.cos(a) * q, py = -.02 * r + Math.sin(a) * q; a ? s.lineTo(px, py) : s.moveTo(px, py); }
      c.lineWidth = r * .03; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke(s);
      mouth([[-.16, .34], [0, .38], [.2, .28], [.27, .23]]);
      break;
    }
    case 'happy':
      line(c, [[-.38 * r, -.02 * r], [-.27 * r, -.13 * r], [-.16 * r, -.02 * r]], .07 * r, INK, true);
      line(c, [[.16 * r, -.02 * r], [.27 * r, -.13 * r], [.38 * r, -.02 * r]], .07 * r, INK, true);
      ink(c, sp([[-.24 * r, .24 * r], [0, .3 * r], [.24 * r, .24 * r], [.16 * r, .48 * r], [0, .54 * r], [-.16 * r, .48 * r]]), '#4a1218', r * .035);
      break;
    case 'think':
      c.fillStyle = INK; c.fill(poly([[-.5 * r, -.26 * r], [-.12 * r, -.14 * r], [-.14 * r, -.06 * r], [-.48 * r, -.15 * r]]));
      brow(.14, -.3, .42, -.36, .08);
      dot(-.27, -.02, .065); dot(.27, -.06, .065);
      mouth([[-.14, .38], [.04, .34], [.16, .28]]);
      break;
    case 'down':
      brow(-.42, -.3, -.14, -.36, .06); brow(.14, -.36, .42, -.3, .06);
      dot(-.26, .12, .065); dot(.26, .12, .065);
      mouth([[-.08, .42], [.08, .42]]);
      break;
    default:
      brow(-.42, -.2, -.14, -.22, .08); brow(.14, -.22, .42, -.2, .08);
      if (blink) { brow(-.34, 0, -.18, 0, .05); brow(.18, 0, .34, 0, .05); }
      else { dot(-.26, 0, .07); dot(.26, 0, .07); }
      mouth([[-.14, .36], [.12, .34]]);
  }
  if (o.mustache) {
    ink(c, sp([[0, .2 * r], [.32 * r, .2 * r], [.5 * r, .1 * r], [.42 * r, .32 * r], [0, .3 * r], [-.42 * r, .32 * r], [-.5 * r, .1 * r], [-.32 * r, .2 * r]]), o.mustache, r * .03);
  }
  c.restore();
}

function headShade(c, r) {
  c.fillStyle = '#aab3c4';
  c.fill(sp([[r * .95, -r * .55], [r * 1.25, 0], [r * .9, r * .95], [-r * .1, r * 1.2], [-r * .7, r * .95], [-r * .2, r * .9], [r * .46, r * .55], [r * .68, -r * .05]]));
  c.fillStyle = 'rgba(120,132,155,.35)';
  c.fill(ell(r * .14, r * .7, r * .9, r * .4));
  c.fillStyle = 'rgba(255,255,255,.75)';
  c.fill(ell(-r * .44, -r * .56, r * .3, r * .16, -.7));
}

// ---------- Hats ----------
function helmetBrit(R, r, col = '#5d6b3c', dk = '#39432a') {
  const brim = sp([[-r * 1.34, -r * .4], [-r * .7, -r * .62], [r * .7, -r * .62], [r * 1.34, -r * .4], [r * .8, -r * .22], [-r * .8, -r * .22]]);
  const dome = sp([[-r * .82, -r * .5], [-r * .7, -r * 1.02], [0, -r * 1.25], [r * .7, -r * 1.02], [r * .82, -r * .5], [0, -r * .4]]);
  R.shape(brim, dk, 5, c => { c.fillStyle = 'rgba(0,0,0,.28)'; c.fill(ell(0, -r * .28, r * 1.1, r * .2)); });
  R.shape(dome, col, 5, c => {
    c.fillStyle = dk; c.fill(ell(r * .55, -r * .6, r * .42, r * .75));
    c.fillStyle = 'rgba(255,255,220,.22)'; c.fill(ell(-r * .32, -r * .98, r * .3, r * .13, -.4));
    c.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 7; i++) c.fill(ell(-r * .6 + hash(i) * r * 1.2, -r * .55 - hash(i + 9) * r * .55, r * .05));
  });
}
function helmetGerman(R, r, col = '#68706f', dk = '#3e4547') {
  const shell = sp([[-r * 1.12, -r * .1], [-r * .98, -r * .58], [-r * .6, -r * 1.12], [r * .3, -r * 1.25], [r * .92, -r * .85], [r * 1.02, -r * .25], [r * .64, -r * .28], [r * .4, -r * .42], [-r * .6, -r * .4], [-r * .92, -r * .02]]);
  R.shape(shell, col, 5, c => {
    c.fillStyle = dk; c.fill(ell(r * .75, -r * .4, r * .55, r * .8));
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fill(ell(-r * .4, -r * .92, r * .28, r * .12, -.6));
  });
  R.fn(c => { c.fillStyle = INK; c.fill(ell(-r * .68, -r * .72, r * .05)); });
}
function capGeneral(R, r, col = '#6e6543', band = '#a81f1a') {
  const top = sp([[-r * 1.06, -r * .9], [-r * .5, -r * 1.34], [r * .6, -r * 1.34], [r * 1.08, -r * .92], [r * .78, -r * .55], [-r * .78, -r * .55]]);
  R.shape(top, col, 5, c => { c.fillStyle = 'rgba(0,0,0,.24)'; c.fill(ell(r * .6, -r * .86, r * .6, r * .5)); });
  R.shape(rrect(-r * .8, -r * .72, r * 1.6, r * .28, 6), band, 4);
  const visor = sp([[-r * .82, -r * .44], [0, -r * .28], [r * .82, -r * .44], [r * .94, -r * .28], [0, -r * .08], [-r * .94, -r * .28]]);
  R.shape(visor, '#1a1c20', 4, c => { c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(ell(-r * .3, -r * .28, r * .34, r * .05, .1)); });
  R.fn(c => { c.fillStyle = '#e4c063'; c.strokeStyle = INK; c.lineWidth = 3; const b = ell(0, -r * .84, r * .13); c.fill(b); c.stroke(b); });
}
function capRommel(R, r) {
  capGeneral(R, r, '#79806f', '#4d524a');
  R.fn(c => {
    c.save(); c.translate(0, -r * 1.05);
    for (const s of [-1, 1]) { ink(c, ell(s * r * .34, 0, r * .28, r * .22), rad(c, s * r * .34, 0, r * .3, [[0, '#d8ecf5'], [1, '#5f8b9f']]), 5); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(ell(s * r * .34 - r * .08, -r * .06, r * .06, r * .04)); }
    c.restore();
  });
}
function capPolish(R, r) {
  const top = poly([[-r * .95, -r * .92], [-r * .05, -r * 1.42], [r * 1.0, -r * 1.0], [r * .1, -r * .68]]);
  const band = sp([[-r * .82, -r * .78], [0, -r * .66], [r * .82, -r * .78], [r * .82, -r * .42], [0, -r * .32], [-r * .82, -r * .42]]);
  R.shape(top, '#5b6340', 5, c => { c.fillStyle = 'rgba(0,0,0,.2)'; c.fill(poly([[r * .1, -r * .68], [r, -r], [r, -r * .6]])); });
  R.shape(band, '#4b5335', 5);
  R.shape(sp([[-r * .82, -r * .42], [0, -r * .24], [r * .82, -r * .42], [r * .9, -r * .28], [0, -r * .06], [-r * .9, -r * .28]]), '#1a1c20', 4);
  R.fn(c => { c.fillStyle = '#e7e9ee'; c.fill(ell(0, -r * .56, r * .1, r * .13)); });
}
function capSoviet(R, r) {
  const dome = sp([[-r * .96, -r * .34], [-r * .82, -r * 1.0], [0, -r * 1.3], [r * .82, -r * 1.0], [r * .96, -r * .34], [0, -r * .44]]);
  R.shape(dome, '#6e7a4a', 5, c => { c.fillStyle = 'rgba(0,0,0,.25)'; c.fill(ell(r * .6, -r * .6, r * .5, r * .8)); });
  R.fn(c => { c.fillStyle = '#c22a24'; c.save(); c.translate(0, -r * .84); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -1.5708 + i * .6283, q = i % 2 ? r * .08 : r * .2; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); c.fill(); c.restore(); });
}
function capUS(R, r) {
  const dome = sp([[-r * .98, -r * .34], [-r * .86, -r * .96], [0, -r * 1.26], [r * .86, -r * .96], [r * .98, -r * .34], [0, -r * .42]]);
  R.shape(dome, '#4f5a38', 5, c => { c.fillStyle = 'rgba(0,0,0,.25)'; c.fill(ell(r * .6, -r * .6, r * .5, r * .8)); c.fillStyle = 'rgba(255,255,255,.14)'; c.fill(ell(-r * .4, -r * .96, r * .28, r * .12, -.5)); });
}

const KITS = {
  brit: { coat: '#c79a4f', coatHi: '#e3bc74', coatDk: '#8c6a34', pants: '#8d6d3a', pantsDk: '#604a24', scarf: '#c7332a', hat: helmetBrit, belt: '#3c2a1a', buckle: '#e8cf8c' },
  german: { coat: '#6b7768', coatHi: '#8b9786', coatDk: '#465045', pants: '#59625a', pantsDk: '#3c433e', scarf: '#2c3230', hat: helmetGerman, belt: '#17181b', buckle: '#a7adb0' },
  rommel: { coat: '#7b8270', coatHi: '#9aa18e', coatDk: '#565c4e', pants: '#6a6f60', pantsDk: '#484c41', scarf: '#c8a93c', hat: capRommel, belt: '#3b2c1c', buckle: '#d9c070' },
  general: { coat: '#7b6a3e', coatHi: '#a08c56', coatDk: '#544726', pants: '#6b5c36', pantsDk: '#473c22', scarf: '#a81f1a', hat: capGeneral, belt: '#3a2a1a', buckle: '#eed487' },
  polish: { coat: '#6f7650', coatHi: '#8e956a', coatDk: '#4c5236', pants: '#5d6444', pantsDk: '#3f452d', scarf: '#c7332a', hat: capPolish, belt: '#3b2c1c', buckle: '#d9c070' },
  soviet: { coat: '#8c8f5e', coatHi: '#a9ad76', coatDk: '#62653f', pants: '#6e7048', pantsDk: '#4b4d30', scarf: '#c22a24', hat: capSoviet, belt: '#3a2a1a', buckle: '#e7cc7e' },
  us: { coat: '#7c7a4e', coatHi: '#9a9866', coatDk: '#565434', pants: '#6a6843', pantsDk: '#47462c', scarf: '#d9d0ae', hat: capUS, belt: '#4a3a24', buckle: '#d8c480' },
};

function glove(R, x, y, rot, s = 1, kind = 'open') {
  const c = R.c; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  if (kind === 'fist') {
    R.shape(sp([[-17, -16], [8, -20], [22, -10], [23, 12], [8, 20], [-16, 16], [-22, 0]]), '#f3f4f6', 5, q => { q.fillStyle = '#c4cad6'; q.fill(ell(8, 16, 20, 8)); });
    R.fn(q => { for (const yy of [-8, 1, 10]) line(q, [[6, yy], [20, yy]], 3); });
  } else if (kind === 'point') {
    R.shape(sp([[-16, -14], [6, -14], [14, -6], [46, -8], [48, 2], [16, 6], [14, 16], [-8, 20], [-20, 6]]), '#f3f4f6', 5, q => { q.fillStyle = '#c4cad6'; q.fill(ell(0, 18, 18, 8)); });
  } else if (kind === 'thumb') {
    R.shape(sp([[-18, -12], [-6, -14], [-8, -38], [2, -46], [8, -34], [8, -14], [22, -8], [22, 14], [6, 22], [-16, 16]]), '#f3f4f6', 5, q => { q.fillStyle = '#c4cad6'; q.fill(ell(6, 18, 18, 8)); });
    R.fn(q => { for (const yy of [-2, 7]) line(q, [[6, yy], [20, yy]], 3); });
  } else {
    R.shape(sp([[-16, -12], [-8, -22], [-6, -36], [2, -36], [4, -22], [8, -38], [16, -36], [14, -20], [22, -32], [29, -28], [20, -8], [24, 8], [10, 20], [-12, 16]]), '#f3f4f6', 5, q => { q.fillStyle = '#c4cad6'; q.fill(ell(4, 16, 18, 8)); });
  }
  c.restore();
}

// Two-segment arm from a shoulder. a1/a2 are absolute angles (radians, 0 = right, +y down).
function armPts(sx, sy, a1, a2, l1 = 62, l2 = 62) {
  const ex = sx + Math.cos(a1) * l1, ey = sy + Math.sin(a1) * l1;
  const hx = ex + Math.cos(a2) * l2, hy = ey + Math.sin(a2) * l2;
  return { pts: [[sx, sy], [ex, ey], [hx, hy]], ex, ey, hx, hy, ang: a2 };
}

/*
  soldier(c, x, y, s, o): x,y = point between the feet. Local scale 1 = ~330 px tall.
  Options: kit, face, lookX, blink, tilt (body lean), headTilt, armL, armR ([a1,a2,handKind]),
  stance ('stand'|'sit'|'side'), holdR/holdL (callbacks drawn at the hand), mustache, sweat, glasses, halo.
*/
function soldier(c, x, y, s, o = {}) {
  const K = KITS[o.kit || 'brit'];
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
  const R = new Rig(c, o.halo === undefined ? 5 : o.halo);
  const hipY = -92;
  const legs = () => {
    if (o.stance === 'sit') {
      R.tube([[-30, hipY + 30], [18, hipY + 10], [52, hipY + 62]], 52, K.pants, K.pantsDk);
      R.tube([[34, hipY + 28], [92, hipY + 4], [112, hipY + 68]], 52, K.pants, K.pantsDk);
      boot(R, 52, hipY + 88, 1); boot(R, 118, hipY + 94, 1);
    } else {
      const st = o.stride || 0;
      R.tube([[-26, hipY], [-30 - st * 16, -40], [-30 - st * 28, -20]], 56, K.pants, K.pantsDk);
      R.tube([[26, hipY], [30 + st * 16, -40], [30 + st * 28, -20]], 56, K.pants, K.pantsDk);
      boot(R, -32 - st * 28, 0, o.footDir || -1, o.liftL || 0); boot(R, 32 + st * 28, 0, o.footDir || 1, o.liftR || 0);
    }
  };
  function boot(RR, bx, by, d, lift = 0) {
    const q = RR.c; q.save(); q.translate(bx, by - lift);
    RR.shape(sp([[-24, -36], [22, -36], [24, -14], [d * 44, -6], [d * 46, 4], [0, 8], [-d * 26, 4]].map(p => [p[0], p[1]])), '#2a2c33', 5, g => { g.fillStyle = 'rgba(255,255,255,.14)'; g.fill(ell(d * 16, -14, 18, 6)); });
    q.restore();
  }
  legs();
  const br = Math.sin(NOW.t * 2.1 + x * .013);
  c.translate(0, hipY + br * 1.4); c.rotate((o.tilt || 0) + Math.sin(NOW.t * 1.15 + x * .02) * .007);
  // back arm
  const sL = [-60, -118], sR = [60, -118];
  const armL = armPts(sL[0], sL[1], ...(o.armL || [2.1, 1.75]).slice(0, 2));
  const armR = armPts(sR[0], sR[1], ...(o.armR || [1.05, 1.35]).slice(0, 2));
  const drawArm = (A, cfg, hold) => {
    R.tube(A.pts, 40, K.coat, K.coatDk);
    if (hold) hold(R, A);
    const kind = (cfg && cfg[2]) || 'open';
    glove(R, A.hx, A.hy, kind === 'point' ? A.ang : A.ang + Math.PI / 2, 1, kind);
  };
  if (o.armLBehind) drawArm(armL, o.armL, o.holdL);
  // coat
  const coat = sp([[-62, -146], [-30, -162], [30, -162], [62, -146], [72, -30], [86, 52], [40, 64], [-40, 64], [-86, 52], [-72, -30]]);
  R.shape(coat, lin(c, -70, -100, 90, 40, [[0, K.coatHi], [.55, K.coat], [1, K.coatDk]]), 5, g => {
    g.fillStyle = K.coatDk; g.fill(sp([[72, -150], [100, -60], [100, 70], [20, 70], [52, 30], [46, -60]]));
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fill(poly([[-6, -162], [6, -162], [4, 66], [-8, 66]]));
    // pockets and seams
    g.strokeStyle = INK; g.lineWidth = 3.5;
    g.stroke(rrect(-52, -112, 36, 28, 4)); g.stroke(rrect(14, -112, 36, 28, 4));
    g.stroke(rrect(-62, 12, 44, 38, 5)); g.stroke(rrect(18, 12, 44, 38, 5));
    g.fillStyle = K.coatDk; g.fill(poly([[-52, -112], [-16, -112], [-20, -98], [-48, -98]])); g.fill(poly([[14, -112], [50, -112], [46, -98], [18, -98]]));
    g.fillStyle = '#26282d'; for (let i = 0; i < 4; i++) g.fill(ell(-1, -130 + i * 30, 5));
  });
  R.shape(sp([[-72, -24], [0, -18], [72, -24], [74, -2], [0, 4], [-74, -2]]), K.belt, 4);
  R.shape(rrect(-17, -24, 34, 26, 4), K.buckle, 4);
  // cross strap
  R.fn(g => { g.save(); g.clip(coat); line(g, [[-50, -158], [62, -24]], 11, K.belt); g.restore(); });
  // scarf / collar
  const headY = -168 + (o.headY || 0), headX = o.headX || 0, r = 66;
  R.shape(sp([[-44, -168], [0, -152], [44, -168], [52, -148], [0, -130], [-52, -148]]), K.scarf, 5, g => { g.fillStyle = 'rgba(0,0,0,.25)'; g.fill(ell(20, -136, 34, 10)); });
  // head
  c.save(); c.translate(headX, headY - r * .82); c.rotate(o.headTilt || 0);
  R.shape(ell(0, 0, r), rad(c, -r * .3, -r * .35, r * 1.5, [[0, '#ffffff'], [.6, '#eceff5'], [1, '#c2cad8']]), 5.5, g => headShade(g, r));
  R.fn(g => {
    if (o.glasses) { g.save(); g.lineWidth = 4; g.strokeStyle = INK; g.fillStyle = 'rgba(190,225,240,.35)'; for (const sx of [-1, 1]) { const q = ell(sx * r * .27, r * .02, r * .24); g.fill(q); g.stroke(q); } line(g, [[-r * .04, 0], [r * .04, 0]], 4); g.restore(); }
    face(g, r, o.face || 'neutral', o);
    if (o.sweat) sweat(g, r * .84, -r * .46, r * .42 * o.sweat);
    if (o.bandage) { }
  });
  if (o.phones) {
    R.fn(g => { line(g, [[-r * .98, -r * .1], [-r * .82, -r * .92], [0, -r * 1.22], [r * .82, -r * .92], [r * .98, -r * .1]], 8, '#22242a', true); });
  }
  if (!o.noHat) K.hat(R, r);
  if (o.phones) {
    R.shape(rrect(-r * 1.14, -r * .42, r * .34, r * .62, 10), '#2e3138', 4);
    R.shape(rrect(r * .8, -r * .42, r * .34, r * .62, 10), '#2e3138', 4);
  }
  c.restore();
  if (!o.armLBehind) drawArm(armL, o.armL, o.holdL);
  drawArm(armR, o.armR, o.holdR);
  if (o.extra) o.extra(R);
  R.draw();
  c.restore();
}

function sweat(c, x, y, s) {
  const d = sp([[x, y - s * 1.1], [x + s * .62, y + s * .1], [x + s * .46, y + s * .7], [x, y + s * .9], [x - s * .46, y + s * .7], [x - s * .62, y + s * .1]]);
  ink(c, d, rad(c, x - s * .2, y, s, [[0, '#d8f2ff'], [1, '#49a3e8']]), s * .14);
}

// Prone side-on soldier, for crawling. x,y = hip on the ground. Faces right.
function proneSoldier(c, x, y, s, o = {}) {
  const K = KITS.brit;
  c.save(); c.translate(x, y); c.scale(s, s);
  const R = new Rig(c, 5);
  const wig = o.wig || 0;
  // legs behind
  R.tube([[-40, -46], [-130, -30 + wig * 4], [-210, -32]], 50, K.pants, K.pantsDk);
  R.tube([[-30, -36], [-120, -22 - wig * 4], [-196, -16]], 50, K.pants, K.pantsDk);
  R.shape(sp([[-208, -54], [-250, -50], [-262, -22], [-246, -8], [-208, -8]]), '#2a2c33', 5);
  R.shape(sp([[-194, -38], [-236, -34], [-248, -6], [-232, 6], [-194, 6]]), '#2a2c33', 5);
  // torso
  const torso = sp([[-74, -80], [10, -104], [96, -104], [136, -74], [132, -24], [60, -4], [-40, -4], [-84, -26]]);
  R.shape(torso, lin(c, 0, -110, 0, 0, [[0, K.coatHi], [.5, K.coat], [1, K.coatDk]]), 5, g => {
    g.fillStyle = K.coatDk; g.fill(ell(30, 2, 130, 30));
    line(g, [[-60, -82], [122, -28]], 11, K.belt);
    g.strokeStyle = INK; g.lineWidth = 3.5; g.stroke(rrect(-30, -60, 40, 30, 5));
  });
  R.shape(sp([[-66, -86], [-52, -90], [-46, -6], [-62, -6]]), K.belt, 4);
  // far arm
  const fa = armPts(116, -74, o.farA || -.05, o.farB || .1, 62, 58);
  R.tube(fa.pts, 36, K.coatDk, null);
  glove(R, fa.hx, fa.hy, .9, .95, 'open');
  // head
  const r = 62;
  c.save(); c.translate(178, -108 + (o.headDy || 0)); c.rotate(.16);
  R.shape(ell(0, 0, r), rad(c, -r * .3, -r * .35, r * 1.5, [[0, '#fff'], [.6, '#eceff5'], [1, '#c2cad8']]), 5.5, g => headShade(g, r));
  R.fn(g => face(g, r, o.face || 'think', { lookX: 1, lookY: .6, blink: o.blink, sweat: 0 }));
  if (o.sweat) R.fn(g => sweat(g, -r * .78, -r * .3, r * .3));
  KITS.brit.hat(R, r);
  c.restore();
  R.shape(sp([[120, -96], [152, -82], [150, -60], [116, -60]]), K.scarf, 4);
  // near arm with a tool
  const na = armPts(112, -60, o.nearA !== undefined ? o.nearA : .5, o.nearB !== undefined ? o.nearB : .15, 70, 72);
  R.tube(na.pts, 42, K.coat, K.coatDk);
  if (o.hold) o.hold(R, na);
  glove(R, na.hx, na.hy, na.ang + Math.PI / 2, 1.02, 'fist');
  R.draw();
  c.restore();
}

// Ghost outline figure (narrative "you"), 2-frame stepping.
function ghostWalk(c, x, y, s, phase, a = 1) {
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = a;
  const k = Math.floor(phase * 2) % 2 ? 1 : -1;
  const body = sp([[-16, -66], [16, -66], [22, -30], [12, -6], [-12, -6], [-22, -30]]);
  c.fillStyle = 'rgba(190,205,225,.1)'; c.fill(body);
  c.strokeStyle = 'rgba(232,240,250,.95)'; c.lineWidth = 3.2; c.stroke(body);
  c.fillStyle = 'rgba(190,205,225,.12)'; const h = ell(0, -84, 19); c.fill(h); c.stroke(h);
  line(c, [[-10, -8], [-12 - k * 7, 16], [-14 - k * 11, 34]], 7, 'rgba(232,240,250,.9)', true);
  line(c, [[10, -8], [12 + k * 7, 16], [14 + k * 11, 34]], 7, 'rgba(232,240,250,.9)', true);
  line(c, [[-20, -56], [-30 + k * 8, -34], [-28 + k * 12, -14]], 6, 'rgba(232,240,250,.9)', true);
  line(c, [[20, -56], [30 - k * 8, -34], [28 - k * 12, -14]], 6, 'rgba(232,240,250,.9)', true);
  c.restore();
}

// ---------- Timeline shortcuts ----------
const Q = TL.c;                     // named cues from cues.json
const SC = {};                      // shot functions: SC.name = (c, t, lt, d) => { ... }
const ws = (id, i = 0) => TL.p[id].w[Math.min(i, TL.p[id].w.length - 1)].s;   // start time of word i in a phrase
const blinkAt = (t, seed = 0) => { const p = (t + seed) % 3.1; return p < .1; };
