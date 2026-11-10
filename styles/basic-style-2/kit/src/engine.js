// Timeline compositor for both ratios. Shots draw on a fixed 1920x1080 stage; the engine frames that
// stage onto the output canvas, then adds transitions, shake, glow, captions and the end card.
// renderFrame(t) is a pure function of t, so any worker can seek anywhere.
// Per-video data comes from window.VIDEO (set at the end of src/scenes.js).
'use strict';
const V = Object.assign({ shakes: [], flashes: [], grade: {}, bigWords: {}, framing: {} }, window.VIDEO || {});
const main = document.getElementById('c');
main.width = OW; main.height = OH;
const X = main.getContext('2d', { alpha: false });
const bufA = mkCanvas(OW, OH), bufB = mkCanvas(OW, OH), strip = mkCanvas(OW, OH), strip2 = mkCanvas(OW, OH);
const A = bufA.getContext('2d', { alpha: false }), B = bufB.getContext('2d', { alpha: false }), S = strip.getContext('2d', { alpha: false }), S2 = strip2.getContext('2d', { alpha: false });
const bloom1 = mkCanvas(OW / 4, OH / 4), bloom2 = mkCanvas(OW / 12, OH / 12);
const B1 = bloom1.getContext('2d'), B2 = bloom2.getContext('2d');
const CUTS = TL.cuts.map((c, i) => ({ ...c, end: i + 1 < TL.cuts.length ? TL.cuts[i + 1].t : TL.dur }));
for (const c of CUTS) if (!SC[c.scene]) throw new Error(`cues.json names a shot with no SC.${c.scene} in scenes.js`);
const SHAKES = V.shakes, FLASHES = V.flashes, GRADE = V.grade;

function shakeAt(t) {
  let x = 0, y = 0;
  for (const [t0, amp, d] of SHAKES) {
    const a = t - t0; if (a < 0 || a > d) continue;
    const e = Math.pow(1 - a / d, 2) * amp;
    x += noise1(a * 42 + t0) * e; y += noise1(a * 47 + t0 + 40) * e;
  }
  return [x, y];
}

// ---------- Framing: which part of the stage each shot shows ----------
const DEFAULT_FRAME = PORTRAIT ? [0, 960, 540, 1.143] : [0, 960, 540, 1];
const FR = (V.framing && V.framing[RATIO]) || {};
function frameAt(scene, t) {
  const L = FR[scene] || [DEFAULT_FRAME];
  let x = L[0][1], y = L[0][2], z = L[0][3];
  for (let i = 1; i < L.length; i++) {
    const k = L[i], d = k[4] === undefined ? .35 : k[4], u = inOut(seg(t, k[0], k[0] + d));
    x = lerp(x, k[1], u); y = lerp(y, k[2], u); z = lerp(z, k[3], u);
  }
  return { x, y, z };
}
function drawShot(ctx, cut, t) {
  const fn = SC[cut.scene];
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, OW, OH);
  const [sx, sy] = shakeAt(t), f = frameAt(cut.scene, t);
  ctx.translate(sx, sy);
  ctx.translate(OW / 2, OH / 2); ctx.scale(f.z, f.z); ctx.translate(-f.x, -f.y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  fn(ctx, t, t - cut.t, cut.end - cut.t);
  ctx.restore();
  const g = GRADE[cut.scene];
  if (g) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, OW, OH); ctx.restore(); }
}

// ---------- Transitions ----------
const WHIP = { pre: .15, post: .3 };
const whipEase = u => { const a = WHIP.pre / (WHIP.pre + WHIP.post); return u < a ? .5 * Math.pow(u / a, 3) : 1 - .5 * Math.pow(1 - (u - a) / (1 - a), 3.6); };
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
function smear(dst, src, dx, dy, n = 14) {
  dst.drawImage(src, -dx / 2, -dy / 2);
  for (let i = 1; i < n; i++) {
    dst.globalAlpha = 1 / (i + 1); const k = i / (n - 1) - .5;
    dst.drawImage(src, dx * k, dy * k);
  }
  dst.globalAlpha = 1;
}
function radial(dst, src, amount, n = 10) {
  dst.drawImage(src, 0, 0);
  for (let i = 1; i < n; i++) {
    dst.globalAlpha = 1 / (i + 1); const z = 1 + amount * (i / (n - 1));
    dst.drawImage(src, OW / 2 - OW * z / 2, OH / 2 - OH * z / 2, OW * z, OH * z);
  }
  dst.globalAlpha = 1;
}
function compose(t) {
  let idx = 0; for (let i = 0; i < CUTS.length; i++) if (t >= CUTS[i].t) idx = i;
  const next = CUTS[idx + 1], cur = CUTS[idx];
  // Whip pan spanning the boundary: render both shots side by side, smear by velocity.
  let w = null, from = null, to = null;
  if (next && next.type === 'whip' && t >= next.t - WHIP.pre) { w = next; from = cur; to = next; }
  else if (cur.type === 'whip' && t < cur.t + WHIP.post && idx > 0) { w = cur; from = CUTS[idx - 1]; to = cur; }
  if (w) {
    const dur = WHIP.pre + WHIP.post, pAt = q => whipEase(clamp((q - (w.t - WHIP.pre)) / dur));
    const p = pAt(t), [dx, dy] = DIRS[w.dir];
    const vel = (pAt(t + 1 / 120) - pAt(t - 1 / 120));
    const span = dx ? OW : OH;
    S.setTransform(1, 0, 0, 1, 0, 0);
    if (p < 1) { drawShot(A, from, t); S.drawImage(bufA, dx * span * p, dy * span * p); }
    if (p > 0) { drawShot(B, to, t); S.drawImage(bufB, dx * span * (p - 1), dy * span * (p - 1)); }
    const len = vel * span * 1.7;
    if (Math.abs(len) > 1) {
      const n1 = 9, n2 = 9;
      smear(S2, strip, dx * len, dy * len, n1);
      smear(X, strip2, dx * len / n1, dy * len / n1, n2);
    } else X.drawImage(strip, 0, 0);
    return;
  }
  const a = t - cur.t;
  if (cur.type === 'open' || cur.type === 'punch') {
    const d = cur.type === 'open' ? .24 : .2;
    if (a < d) {
      drawShot(A, cur, t);
      const k = 1 - outCubic(a / d), z = 1 + k * (cur.type === 'open' ? .26 : .34);
      S.setTransform(1, 0, 0, 1, 0, 0); S.drawImage(bufA, OW / 2 - OW * z / 2, OH / 2 - OH * z / 2, OW * z, OH * z);
      radial(X, strip, k * .16, 9);
      return;
    }
  }
  drawShot(X, cur, t);
  if (cur.type === 'flash' && a < .2) { X.fillStyle = `rgba(255,252,245,${(1 - a / .2) * .92})`; X.fillRect(0, 0, OW, OH); }
  // White-line transition: outgoing shot burns to white just before the cut.
  if (next && next.type === 'whiteline' && t > next.t - .1) { X.fillStyle = `rgba(255,255,255,${seg(t, next.t - .1, next.t)})`; X.fillRect(0, 0, OW, OH); }
  if (cur.type === 'whiteline' && a < .28) { X.fillStyle = `rgba(255,255,255,${1 - outCubic(a / .28)})`; X.fillRect(0, 0, OW, OH); }
}

// ---------- Finishing ----------
const vignette = mkCanvas(OW, OH);
{ const v = vignette.getContext('2d'); const big = Math.max(OW, OH), small = Math.min(OW, OH); const g = v.createRadialGradient(OW / 2, OH * .47, small * .42, OW / 2, OH * .5, big * .66); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(2,4,8,.3)'); g.addColorStop(1, 'rgba(0,2,6,.72)'); v.fillStyle = g; v.fillRect(0, 0, OW, OH); }
const grains = [0, 1, 2, 3].map(s => {
  const n = mkCanvas(512, 512), q = n.getContext('2d'), im = q.createImageData(512, 512), r = RNG(2024 + s * 97);
  for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 6; }
  q.putImageData(im, 0, 0); return n;
});
function finish(t) {
  // Cheap wide bloom: repeated downsample, screened back on.
  B1.imageSmoothingEnabled = B2.imageSmoothingEnabled = true; B1.imageSmoothingQuality = B2.imageSmoothingQuality = 'high';
  B1.globalCompositeOperation = 'copy'; B1.drawImage(main, 0, 0, OW / 4, OH / 4);
  B2.globalCompositeOperation = 'copy'; B2.drawImage(bloom1, 0, 0, OW / 12, OH / 12);
  X.save(); X.imageSmoothingEnabled = true; X.imageSmoothingQuality = 'high'; X.globalCompositeOperation = 'screen'; X.globalAlpha = .17; X.drawImage(bloom2, 0, 0, OW, OH); X.restore();
  X.drawImage(vignette, 0, 0);
  for (const [t0, d, col] of FLASHES) { const a = t - t0; if (a < 0 || a > d) continue; X.save(); X.globalAlpha = Math.pow(1 - a / d, 1.6); X.fillStyle = col; X.fillRect(0, 0, OW, OH); X.restore(); }
  const f = Math.floor(t * 24) % 4, g = grains[f];
  for (let y = 0; y < OH; y += 512) for (let x = 0; x < OW; x += 512) X.drawImage(g, x, y);
}

// ---------- Captions: words pop in big, settle, and accumulate until the phrase ends ----------
const CAP_Y = PORTRAIT ? 1290 : 862, CAP_SIZE = PORTRAIT ? 62 : 58, CAP_MAXW = PORTRAIT ? 900 : 1240;
function layoutOf(tokens, size) {
  // Only the words spoken so far are laid out, so the line re-centres as it grows.
  const space = size * .3, lines = [[]]; let lw = 0;
  const widths = tokens.map(k => X.measureText(k.t).width);
  tokens.forEach((k, i) => {
    if (lw + widths[i] > CAP_MAXW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(i); lw += widths[i] + space;
  });
  const pos = [];
  lines.forEach((ln, li) => {
    const total = ln.reduce((a, i) => a + widths[i], 0) + space * (ln.length - 1);
    let x = OW / 2 - total / 2;
    const y = CAP_Y - (lines.length - 1 - li) * size * 1.2;
    ln.forEach(i => { pos[i] = { x: x + widths[i] / 2, y }; x += widths[i] + space; });
  });
  return pos;
}
function captions(t) {
  let active = null;
  for (const id of TL.order) { const p = TL.p[id]; if (t >= p.tokens[0].s - .02) active = id; }
  if (!active) return;
  const p = TL.p[active], i0 = TL.order.indexOf(active), nx = TL.order[i0 + 1];
  const hideAt = nx ? TL.p[nx].s - .02 : p.e + .9;
  if (t > hideAt && !nx) return;
  if (t > p.e + 1.25) return;
  const size = V.bigWords[active] || CAP_SIZE;
  X.save();
  X.font = `800 ${size}px Rubik`; X.textAlign = 'center'; X.textBaseline = 'middle'; X.lineJoin = 'round';
  if ('letterSpacing' in X) X.letterSpacing = '1px';
  const shown = p.tokens.filter(k => t >= k.s), pos = layoutOf(shown, size);
  shown.forEach((k, i) => {
    const a = t - k.s;
    const q = 1 - outCubic(clamp(a / .1)), sc = 1 + q * .3, { x, y } = pos[i];
    X.save(); X.translate(x, y); X.scale(sc, sc);
    X.shadowColor = 'rgba(0,0,0,.65)'; X.shadowBlur = 14; X.shadowOffsetY = 3;
    X.lineWidth = size * .24; X.strokeStyle = '#080a0e'; X.strokeText(k.t, 0, 0);
    X.shadowColor = 'transparent';
    X.fillStyle = k.red ? '#ff2a1f' : '#ffffff'; X.fillText(k.t, 0, 0);
    X.restore();
  });
  X.restore();
}

// ---------- End card: blocky fire eats the frame, then the pill lands (cues: bigBoom, pill) ----------
const FW = PORTRAIT ? 108 : 192, FH = PORTRAIT ? 192 : 108, fireCv = mkCanvas(FW, FH), FX = fireCv.getContext('2d'), fireIm = FX.createImageData(FW, FH);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => hash(a * 57.31 + b * 113.7);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
const fbm = (x, y) => vnoise(x, y) * .55 + vnoise(x * 2.1, y * 2.1) * .3 + vnoise(x * 4.3, y * 4.3) * .15;
function fireOverlay(t) {
  if (Q.bigBoom === undefined) return;
  const a = t - Q.bigBoom; if (a < 0) return;
  const grow = outCubic(clamp(a / .42)) * 1.5, d = fireIm.data, cool = seg(a, .3, 2.2), burn = a * 1.2, asp = FW / FH;
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const nx = (x / FW - .73) * asp, ny = y / FH - .98;
    const r = Math.sqrt(nx * nx + ny * ny);
    const n = fbm(x * .05 + 11, y * .07 - burn);
    const edge = grow - r - (n - .5) * .58;
    const i = (x + y * FW) * 4;
    if (edge <= 0) { d[i + 3] = 0; continue; }
    const heat = clamp(edge * 2.4 + (n - .45) * 1.1 - cool * .72);
    let cr, cg, cb;
    if (heat > .72) { cr = 255; cg = 246; cb = 214; }
    else if (heat > .48) { cr = 255; cg = 203; cb = 110; }
    else if (heat > .3) { cr = 240; cg = 142; cb = 48; }
    else if (heat > .15) { cr = 176; cg = 76; cb = 20; }
    else { cr = 78; cg = 26; cb = 10; }
    d[i] = cr; d[i + 1] = cg; d[i + 2] = cb; d[i + 3] = 255;
  }
  FX.putImageData(fireIm, 0, 0);
  X.save(); X.imageSmoothingEnabled = false; X.drawImage(fireCv, 0, 0, OW, OH); X.restore();
}
function pill(t) {
  if (Q.pill === undefined) return;
  const a = t - Q.pill; if (a < 0) return;
  const k = outBack(clamp(a / .2), 1.5), rot = (1 - outCubic(clamp(a / .2))) * -.32, wob = a > .2 ? Math.sin((a - .2) * 16) * .018 * Math.exp(-(a - .2) * 4) : 0;
  const draw = (ctx, kk, r) => {
    ctx.save(); ctx.translate(OW / 2, OH / 2 - 10); ctx.rotate(r); ctx.scale(kk, kk);
    const b = rrect(-404, -92, 808, 184, 92);
    ctx.lineWidth = 26; ctx.strokeStyle = INK; ctx.stroke(b);
    ctx.fillStyle = lin(ctx, 0, -92, 0, 92, [[0, '#ff3f33'], [.55, '#dd1a14'], [1, '#a30d0b']]); ctx.fill(b);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill(rrect(-370, -80, 740, 52, 40));
    label(ctx, 'SUBSCRIBE!', 0, 6, 108, { weight: 900, fill: '#fff', stroke: 'rgba(60,0,0,.65)', lw: 8 });
    ctx.restore();
  };
  if (a < .2) { for (let i = 0; i < 5; i++) { X.save(); X.globalAlpha = .34; draw(X, k * (1 - i * .02), rot * (1 + i * .22)); X.restore(); } }
  else draw(X, k, wob);
}

window.renderFrame = function (t) {
  NOW.t = t;
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over';
  compose(t);
  finish(t);
  captions(t);
  fireOverlay(t);
  pill(t);
  const fade = seg(t, TL.dur - .3, TL.dur - .02);
  if (fade > 0) { X.fillStyle = `rgba(0,0,0,${fade})`; X.fillRect(0, 0, OW, OH); }
};
window.ready = (async () => {
  await Promise.all([
    document.fonts.load('800 40px Rubik'), document.fonts.load('900 40px Rubik'), document.fonts.load('800 40px Rubik', 'Ó'),
    document.fonts.load('40px Stencil'), document.fonts.load('40px Marker'),
  ]);
  // Paint cached art once so later frames are fast and reproducible.
  for (const c of CUTS) { const g = S; g.save(); SC[c.scene](g, c.t + .05, .05, c.end - c.t); g.restore(); }
  return true;
})();
// Live preview: open index.html?ratio=9:16 in a browser and it plays silently.
if (!navigator.webdriver) window.ready.then(() => {
  const t0 = performance.now(); const tick = () => { renderFrame(((performance.now() - t0) / 1000) % TL.dur); requestAnimationFrame(tick); }; tick();
});
