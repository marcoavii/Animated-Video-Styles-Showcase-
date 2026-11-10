// Props, backgrounds, effects and on-screen UI gags.
'use strict';
// Backdrops paint past the stage edge: camera margin in 16:9, extra sky and ground in 9:16.
const OVER = PORTRAIT ? 480 : 170;
const _bg = {};
// Moonlit grade for painted backdrops: characters stay brighter than the world, and each moon is
// repainted after the grade so it stays the brightest thing in the sky. Keys come from VIDEO.bgGrade.
const BG_GRADE = (window.VIDEO_BG_GRADE || {});
let _moons = null;
// Oversized cached background painted in 1920x1080 world coords (with margin for camera moves).
function bg(key, fn) {
  if (!_bg[key]) {
    const cv = mkCanvas(W + OVER * 2, H + OVER * 2), g = cv.getContext('2d');
    g.translate(OVER, OVER);
    _moons = [];
    fn(g, RNG(key.length * 7919 + key.charCodeAt(0) * 13));
    const col = BG_GRADE[key];
    if (col) {
      const list = _moons; _moons = null;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = col;
      // keep transparent parts of foreground layers transparent
      if (key.endsWith('Fg')) g.globalCompositeOperation = 'source-atop', g.fillStyle = 'rgba(14,22,40,.34)';
      g.fillRect(0, 0, cv.width, cv.height); g.restore();
      list.forEach(m => moon(g, m[0], m[1], m[2]));
    }
    _moons = null; _bg[key] = cv;
  }
  return _bg[key];
}
const drawBg = (c, key, fn) => c.drawImage(bg(key, fn), -OVER, -OVER);
function fullRect(c, style) { c.fillStyle = style; c.fillRect(-OVER * 3, -OVER * 3, W + OVER * 6, H + OVER * 6); }

// Camera: slow continuous move, with parallax by depth (0 = fixed, 1 = full).
function camAt(lt, d, z0, z1, x0 = 0, x1 = 0, y0 = 0, y1 = 0) {
  const k = clamp(lt / d, -.2, 1.25);
  return { z: lerp(z0, z1, k), x: lerp(x0, x1, k), y: lerp(y0, y1, k) };
}
function layer(c, cam, depth, fn) {
  c.save();
  const z = 1 + (cam.z - 1) * depth;
  c.translate(W / 2 + cam.x * depth, H / 2 + cam.y * depth); c.scale(z, z); c.translate(-W / 2, -H / 2);
  fn(c); c.restore();
}

// ---------- Painted night desert ----------
function sky(g, top = '#0c141f', mid = '#1b2836', low = '#2c3a44', hz = 560) {
  g.fillStyle = lin(g, 0, -OVER, 0, hz, [[0, top], [.65, mid], [1, low]]);
  g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
}
function clouds(g, r, y, n = 7, col = 'rgba(92,112,132,.2)') {
  g.save(); g.filter = 'blur(9px)';
  for (let i = 0; i < n; i++) {
    const x = -100 + r() * (W + 200), yy = y + r() * 140, w = 180 + r() * 340;
    g.fillStyle = col;
    g.fill(sp([[x - w, yy + 10], [x - w * .6, yy - 12 - r() * 16], [x - w * .1, yy - 26 - r() * 18], [x + w * .5, yy - 12 - r() * 18], [x + w, yy + 8], [x + w * .3, yy + 22], [x - w * .4, yy + 22]]));
  }
  g.restore();
}
function moon(g, x, y, r) {
  if (_moons) _moons.push([x, y, r]);
  g.save();
  g.fillStyle = rad(g, x, y, r * 4.2, [[0, 'rgba(200,222,240,.42)'], [.3, 'rgba(160,190,215,.16)'], [1, 'rgba(120,150,180,0)']]);
  g.fillRect(x - r * 4.2, y - r * 4.2, r * 8.4, r * 8.4);
  const m = ell(x, y, r);
  g.fillStyle = rad(g, x - r * .3, y - r * .3, r * 1.5, [[0, '#f8fbf5'], [.7, '#e2eae6'], [1, '#bccdd4']]); g.fill(m);
  g.save(); g.clip(m);
  const rr = RNG(911);
  for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(150,172,185,.22)'; g.fill(ell(x - r + rr() * r * 2, y - r + rr() * r * 2, r * (.06 + rr() * .14))); }
  g.restore();
  g.lineWidth = 5; g.strokeStyle = INK; g.stroke(m);
  g.restore();
}
function ridge(g, r, y, amp, col, seed, step = 180, lw = 4) {
  const pts = [[-OVER - 40, H + OVER]];
  for (let x = -OVER - 40; x <= W + OVER + 40 + step; x += step) pts.push([x, y - (.5 + .5 * Math.sin(x * .0041 + seed)) * amp - hash(x + seed) * amp * .24]);
  pts.push([W + OVER + 60, H + OVER]);
  const s = sp(pts.slice(1, -1), false);
  g.fillStyle = col; g.lineWidth = lw; g.strokeStyle = INK;
  // close the shape down to the bottom edge
  const closed = new Path2D(); closed.addPath(s); closed.lineTo(W + OVER + 60, H + OVER); closed.lineTo(-OVER - 40, H + OVER); closed.closePath();
  g.fill(closed); g.stroke(s);
}
function sandSpecks(g, r, x0, y0, x1, y1, n, cols) {
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), y = lerp(y0, y1, Math.pow(r(), 1.2));
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    g.fill(ell(x, y, 2 + r() * 9, 1 + r() * 3));
  }
}
function tuft(g, x, y, s, col = '#20281e') {
  g.lineCap = 'round';
  for (const a of [-.55, -.2, .15, .5]) { g.lineWidth = 4 * s; g.strokeStyle = INK; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + a * 14 * s, y - 16 * s, x + a * 26 * s, y - 28 * s); g.stroke(); g.lineWidth = 2 * s; g.strokeStyle = col; g.stroke(); }
}
function rock(g, x, y, s, col = '#39403f') {
  const p = sp([[x - 62 * s, y], [x - 48 * s, y - 34 * s], [x - 8 * s, y - 56 * s], [x + 34 * s, y - 40 * s], [x + 66 * s, y], [x, y + 10 * s]]);
  ink(g, p, col, 4, c => { c.fillStyle = 'rgba(0,0,0,.3)'; c.fill(ell(x + 30 * s, y - 8 * s, 50 * s, 34 * s)); c.fillStyle = 'rgba(190,210,225,.14)'; c.fill(ell(x - 22 * s, y - 36 * s, 22 * s, 10 * s, -.5)); });
}
function wirePost(g, x, y, s, crooked = 0) {
  ink(g, poly([[x - 7 * s, y], [x + 7 * s, y], [x + 6 * s + crooked, y - 96 * s], [x - 6 * s + crooked, y - 98 * s]]), '#322a22', 3.5);
}
function barbed(g, x0, y0, x1, y1, sag = 16, seed = 1) {
  g.strokeStyle = INK; g.lineWidth = 3;
  for (let w = 0; w < 2; w++) {
    g.beginPath();
    const n = 22;
    for (let i = 0; i <= n; i++) { const k = i / n, x = lerp(x0, x1, k), y = lerp(y0, y1, k) + Math.sin(k * 3.14) * sag + w * 22; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    for (let i = 1; i < n; i += 2) { const k = i / n, x = lerp(x0, x1, k), y = lerp(y0, y1, k) + Math.sin(k * 3.14) * sag + w * 22; line(g, [[x - 5, y - 6], [x + 5, y + 6]], 2.4); line(g, [[x + 5, y - 6], [x - 5, y + 6]], 2.4); }
  }
}
function desertBack(g, r, opt = {}) {
  sky(g);
  clouds(g, r, 60, 8);
  moon(g, opt.mx === undefined ? 1420 : opt.mx, opt.my === undefined ? 170 : opt.my, opt.mr || 92);
  clouds(g, r, 200, 5, 'rgba(70,90,110,.2)');
  ridge(g, r, (opt.hz || 500) - 40, 60, '#2e3f50', 1.3, 210, 2.5);
  ridge(g, r, (opt.hz || 500) + 10, 46, '#3a4448', 4.1, 160, 3);
}
function sandGround(g, r, y, opt = {}) {
  const hi = opt.hi || '#58523c', mid = opt.mid || '#3b3829', lo = opt.lo || '#1e1d17';
  const s = new Path2D();
  const pts = [];
  for (let x = -OVER - 40; x <= W + OVER + 60; x += 170) pts.push([x, y + Math.sin(x * .0052 + (opt.seed || 0)) * (opt.amp === undefined ? 16 : opt.amp)]);
  const top = sp(pts, false); s.addPath(top); s.lineTo(W + OVER + 60, H + OVER); s.lineTo(-OVER - 40, H + OVER); s.closePath();
  g.fillStyle = lin(g, 0, y, 0, H + 40, [[0, hi], [.32, mid], [1, lo]]); g.fill(s);
  g.lineWidth = 5; g.strokeStyle = INK; g.stroke(top);
  g.save(); g.clip(s);
  sandSpecks(g, r, -OVER, y, W + OVER, H + OVER, 900, ['rgba(0,0,0,.14)', 'rgba(0,0,0,.08)', 'rgba(190,190,150,.05)', 'rgba(220,215,170,.05)']);
  // moon pool of soft light
  if (opt.pool !== false) { g.fillStyle = rad(g, opt.px || 960, y + 170, 720, [[0, 'rgba(180,185,160,.13)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-OVER, y, W + OVER * 2, H); }
  g.restore();
}

// ---------- Mines ----------
function tellerMine(c, x, y, s = 1, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const body = sp([[-92, 0], [-84, -26], [-42, -44], [42, -44], [84, -26], [92, 0], [84, 26], [42, 40], [-42, 40], [-84, 26]]);
  c.lineJoin = 'round';
  ink(c, body, o.wood ? '#8a6535' : lin(c, 0, -44, 0, 40, [[0, '#6c7650'], [1, '#3a4230']]), 6);
  ink(c, ell(0, -8, 74, 26), o.wood ? '#a57c45' : '#535c40', 4);
  ink(c, ell(0, -14, 44, 15), o.wood ? '#5a4326' : '#8b9460', 4);
  ink(c, ell(0, -18, 15, 6), o.plate || '#c23b2c', 3);
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fill(ell(-22, -22, 13, 3));
  if (o.face) { c.fillStyle = INK; c.fill(ell(-10, 18, 3.4)); c.fill(ell(10, 18, 3.4)); line(c, [[-5, 26], [5, 26]], 2.4); }
  c.restore();
}
// Side-on cut through a Teller mine, for the 30 degree diagram.
function mineSide(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  ink(c, rrect(-190, -46, 380, 106, 26), lin(c, 0, -46, 0, 60, [[0, '#6f7a50'], [1, '#384030']]), 8, g => {
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-190, 20, 380, 50);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(-180, -38, 360, 10);
    g.strokeStyle = INK; g.lineWidth = 4; for (const q of [-120, -40, 40, 120]) { g.fillStyle = '#2a2f24'; g.fill(ell(q, 14, 7)); }
  });
  ink(c, rrect(-94, -74, 188, 32, 10), '#c23b2c', 7, g => { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-90, -72, 180, 7); });
  c.restore();
}
function sMine(c, x, y, s = 1, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s); if (o.rot) c.rotate(o.rot);
  const m = rrect(-46, -62, 92, 124, 14);
  ink(c, m, lin(c, -46, 0, 46, 0, [[0, '#95a071'], [.45, '#6c7650'], [1, '#2e3425']]), 6);
  ink(c, sp([[-46, -30], [0, -22], [46, -30], [46, -18], [0, -8], [-46, -18]]), '#3a4230', 3);
  c.fillStyle = '#20241c'; for (let i = 0; i < 5; i++) c.fill(ell(-30 + i * 15, 26, 4.6));
  ink(c, rrect(-13, -92, 26, 32, 5), '#4a5040', 5);
  for (const a of [-.5, 0, .5]) line(c, [[0, -90], [Math.sin(a) * 26, -90 - Math.cos(a) * 46]], 6, '#c9cfd4');
  c.restore();
}
function woodMine(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  ink(c, poly([[-84, -42], [84, -42], [92, 42], [-92, 42]]), lin(c, 0, -42, 0, 42, [[0, '#b58c52'], [1, '#6e4f29']]), 6, g => {
    g.strokeStyle = 'rgba(40,24,10,.55)'; g.lineWidth = 3;
    for (const yy of [-16, 10]) { g.beginPath(); g.moveTo(-90, yy); g.lineTo(90, yy); g.stroke(); }
    g.fillStyle = 'rgba(50,30,12,.5)'; g.fill(ell(-34, 26, 7, 4)); g.fill(ell(44, -30, 6, 3));
    g.fillStyle = '#17181a'; for (const px of [-70, 70]) for (const py of [-30, 30]) g.fill(ell(px, py, 3.6));
  });
  ink(c, poly([[-92, -42], [92, -42], [78, -66], [-78, -66]]), '#c09a5e', 6);
  c.restore();
}
function glassMine(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const jar = sp([[-58, -34], [-34, -60], [34, -60], [58, -34], [58, 36], [34, 56], [-34, 56], [-58, 36]]);
  ink(c, jar, 'rgba(182,226,226,.55)', 6, g => { g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(ell(-28, -18, 9, 28, .2)); g.fillStyle = 'rgba(60,110,110,.34)'; g.fill(ell(26, 28, 34, 26)); });
  ink(c, rrect(-34, -80, 68, 24, 6), 'rgba(200,236,236,.8)', 5);
  c.restore();
}

// ---------- Effects ----------
function sparkle(c, x, y, r, a = 1, col = '#fff') {
  c.save(); c.translate(x, y); c.globalAlpha = a;
  softGlow(c, 0, 0, r * 2.3, 'rgba(255,255,240,.4)', a);
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 16; i++) { const an = i * .3927, q = i % 2 ? r * .12 : (i % 4 ? r * .55 : r); c.lineTo(Math.cos(an) * q, Math.sin(an) * q); }
  c.closePath(); c.fill(); c.restore();
}
// Stepped twinkle at 12 fps, which keeps the hand-animated feel on a 60 fps timeline.
const stepped = (t, f = 12) => Math.floor(t * f) / f;
const twinkle = (t, seed = 0) => .55 + .45 * Math.abs(Math.sin(stepped(t) * 9 + seed));

function puffs(c, x, y, age, o = {}) {
  // Rising, thinning smoke made of soft inked blobs.
  const n = o.n || 12, seed = o.seed || 1, life = o.life || 3.2, scale = o.s || 1;
  if (age < 0) return;
  for (let i = 0; i < n; i++) {
    const d = hash(seed + i) * .5, a = age - d; if (a < 0 || a > life) continue;
    const k = a / life, dir = (hash(seed + i * 3) - .5) * (o.spread || 1.2);
    const px = x + dir * 340 * outCubic(k) * scale, py = y - (60 + hash(seed + i * 7) * 300) * outCubic(k) * scale;
    const r = (34 + hash(seed + i * 5) * 62) * (.45 + k * 1.3) * scale;
    c.globalAlpha = (1 - k) * (o.a || .62);
    c.fillStyle = rad(c, px - r * .25, py - r * .25, r * 1.2, [[0, o.c1 || '#59584f'], [.7, o.c2 || '#2c2c28'], [1, 'rgba(20,20,18,0)']]);
    c.fill(ell(px, py, r));
  }
  c.globalAlpha = 1;
}
// Layered fireball: flash core, blooming fire, inked debris and shock ring.
function explosion(c, x, y, age, o = {}) {
  if (age < 0) return;
  const s = o.s || 1, seed = o.seed || 3, life = o.life || 1.2;
  c.save();
  if (age < .3) {
    const k = age / .3;
    c.lineWidth = (26 - 22 * k) * s; c.strokeStyle = `rgba(255,245,225,${(1 - k) * .75})`;
    c.stroke(ell(x, y - 30 * s, (70 + 620 * outCubic(k)) * s, (40 + 300 * outCubic(k)) * s));
  }
  puffs(c, x, y - 30 * s, age - .08, { n: o.smoke || 18, seed, s: s * 1.3, life: 3.6, a: .72 });
  if (age < life) {
    const k = age / life, q = outQuart(clamp(k * 1.25));
    const parts = [];
    for (let i = 0; i < 54; i++) parts.push({ a: hash(seed + i) * 6.283, d: Math.pow(hash(seed + i * 2.3), .7), z: hash(seed + i * 3.7), h: hash(seed + i * 5.1) });
    parts.sort((u, v) => v.d - u.d);
    for (const f of parts) {
      const dist = f.d * 310 * s * q;
      const px = x + Math.cos(f.a) * dist * 1.2, py = y - 90 * s * q + Math.sin(f.a) * dist * .8 - 120 * k * k * s;
      const r = (48 + f.z * 74) * s * (.55 + q * .75) * (1 - k * .34);
      const heat = clamp(1.16 - k * 1.3 - f.d * .62 + f.h * .16);
      const col0 = heat > .72 ? '#fffbe6' : heat > .5 ? '#ffe08a' : heat > .3 ? '#ffa93f' : heat > .14 ? '#e05b18' : '#6e2a12';
      const col1 = heat > .72 ? '#ffd46a' : heat > .5 ? '#ff9a2e' : heat > .3 ? '#e04f12' : heat > .14 ? '#7f2a0d' : '#241410';
      c.globalAlpha = clamp((1 - k) * 2.1);
      c.fillStyle = rad(c, px - r * .18, py - r * .2, r * 1.08, [[0, col0], [.62, col1], [1, 'rgba(36,14,6,0)']]);
      c.fill(ell(px, py, r));
    }
    c.globalAlpha = 1;
    softGlow(c, x, y - 90 * s, 300 * s * (.6 + q * .6), 'rgba(255,230,170,.95)', Math.pow(1 - k, 2.2));
    softGlow(c, x, y - 60 * s, 760 * s, 'rgba(255,150,60,.6)', (1 - k) * .9);
  }
  // debris
  for (let i = 0; i < 16; i++) {
    const a0 = -1.5708 + (hash(seed + i * 11) - .5) * 2.4, v = (480 + hash(seed + i * 13) * 720) * s, g = 1050 * s;
    const px = x + Math.cos(a0) * v * age, py = y - 30 * s + Math.sin(a0) * v * age + g * age * age * .9;
    if (py > y + 90 * s || age > 1.8) continue;
    c.save(); c.translate(px, py); c.rotate(age * (8 + i));
    ink(c, poly([[-9 * s, -5 * s], [8 * s, -7 * s], [11 * s, 6 * s], [-7 * s, 8 * s]]), '#2a2520', 3); c.restore();
  }
  c.restore();
}
function dustKick(c, x, y, age, s = 1, seed = 5) {
  if (age < 0 || age > 1) return;
  for (let i = 0; i < 7; i++) {
    const k = age, dir = -1 + 2 * (i / 6), px = x + dir * 120 * s * outCubic(k), py = y - 40 * s * outCubic(k) * hash(seed + i);
    const r = (18 + hash(seed + i) * 20) * s * (.6 + k);
    c.globalAlpha = (1 - k) * .6; c.fillStyle = '#7d7661'; c.fill(ell(px, py, r, r * .7));
  }
  c.globalAlpha = 1;
}

// ---------- On-screen gags and game UI ----------
function bubble(c, x, y, s, txt, o = {}) {
  if (s <= .01) return;
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(o.rot || -.03);
  const w = o.w || 112, h = o.h || 92, tx = o.tail === undefined ? -44 : o.tail;
  const b = sp([[-w, 0], [-w * .78, -h * .72], [0, -h], [w * .78, -h * .72], [w, 0], [w * .78, h * .72], [tx + 34, h * .92], [tx - 2, h * 1.5], [tx - 12, h * .92], [-w * .78, h * .72]]);
  c.lineJoin = 'round'; c.lineWidth = 24; c.strokeStyle = '#14305a'; c.stroke(b);
  c.lineWidth = 8; c.strokeStyle = INK; c.stroke(b);
  c.fillStyle = '#fff'; c.fill(b);
  label(c, txt, 0, 2, o.size || 76, { fill: '#14233f', weight: 900 });
  c.restore();
}
function thoughtDots(c, x, y, t, t0, n = 3, s = 1, gap = .38) {
  for (let i = 0; i < n; i++) {
    const k = pop(t, t0 + i * gap, .16);
    if (k <= 0) continue;
    const q = rrect(x + i * 46 * s - 13 * s * k, y - 13 * s * k, 26 * s * k, 26 * s * k, 3);
    ink(c, q, '#fff', 6);
  }
}
// Curved red arrow that draws itself on.
function redArrow(c, x0, y0, cx, cy, x1, y1, k, o = {}) {
  if (k <= 0) return;
  const lw = o.lw || 20, col = o.col || '#ff4a1e';
  const P = q => { const u = 1 - q; return [u * u * x0 + 2 * u * q * cx + q * q * x1, u * u * y0 + 2 * u * q * cy + q * q * y1]; };
  const n = 26, pts = []; for (let i = 0; i <= n * k; i++) pts.push(P(i / n));
  const e = P(k), e0 = P(Math.max(0, k - .05)), a = Math.atan2(e[1] - e0[1], e[0] - e0[0]);
  const head = new Path2D(); const hs = lw * 1.75;
  head.moveTo(e[0] + Math.cos(a) * hs, e[1] + Math.sin(a) * hs);
  head.lineTo(e[0] + Math.cos(a + 2.25) * hs, e[1] + Math.sin(a + 2.25) * hs);
  head.lineTo(e[0] + Math.cos(a - 2.25) * hs, e[1] + Math.sin(a - 2.25) * hs); head.closePath();
  const path = poly(pts, false);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = INK; c.lineWidth = lw + 14; c.stroke(path); c.lineWidth = 14; c.stroke(head);
  c.strokeStyle = col; c.lineWidth = lw; c.stroke(path);
  c.fillStyle = col; c.fill(head);
  c.strokeStyle = 'rgba(255,190,150,.65)'; c.lineWidth = lw * .22; c.stroke(path);
}
function skull(c, x, y, s, col = '#f2f3ee') {
  c.save(); c.translate(x, y); c.scale(s, s);
  ink(c, sp([[-20, -6], [-16, -22], [0, -28], [16, -22], [20, -6], [12, 8], [12, 20], [-12, 20], [-12, 8]]), col, 3.5);
  c.fillStyle = INK; c.fill(ell(-8, -6, 5.6, 6.4)); c.fill(ell(8, -6, 5.6, 6.4)); c.fill(poly([[0, 2], [4, 9], [-4, 9]]));
  line(c, [[-5, 14], [-5, 20]], 2); line(c, [[5, 14], [5, 20]], 2);
  c.restore();
}
// HUD helpers draw in output pixels, unaffected by framing, so UI stays on screen in both ratios.
const HUD_TOP = PORTRAIT ? 130 : 30;
function hud(c, fn) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); fn(c); c.restore(); }
// Black caption strip. k = pop amount 0..1; x,y = position in 16:9 (9:16 centres it near the top).
function hudStrip(c, k, txt, x, y, o = {}) {
  if (k <= 0) return;
  hud(c, g => {
    const size = o.size || 50, px = PORTRAIT ? OW / 2 : x, py = PORTRAIT ? (o.yP || 190) : y;
    g.save(); g.translate(px, py); g.scale(k, k);
    g.font = `${o.font === 'Rubik' ? '900 ' : ''}${size}px ${o.font || 'Stencil'}`;
    const w = g.measureText(txt).width + size * 1.1, h = size * 1.6;
    g.fillStyle = 'rgba(10,8,6,.86)'; g.fill(rrect(-w / 2, -h / 2, w, h, 5));
    if (o.border) { g.lineWidth = 3; g.strokeStyle = o.border; g.stroke(rrect(-w / 2, -h / 2, w, h, 5)); }
    label(g, txt, 0, size * .05, size, { font: o.font || 'Stencil', weight: o.font === 'Rubik' ? 900 : 400, fill: '#f2e4bb' });
    g.restore();
  });
}
// Game-style kill feed, slid in from the top.
function killFeed(c, t, t0, left, right, o = {}) {
  const k = outCubic(seg(t, t0, t0 + .18)); if (k <= 0) return;
  const x = o.x === undefined ? 34 : o.x, y = lerp(-80, o.y === undefined ? HUD_TOP : o.y, k), w = 470, h = 58;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = 'rgba(18,8,6,.8)'; c.fill(rrect(x, y, w, h, 4));
  c.lineWidth = 3; c.strokeStyle = '#c23a2a'; c.stroke(rrect(x, y, w, h, 4));
  label(c, left, x + 18, y + h / 2 + 1, 25, { align: 'left', fill: '#e7a44a', weight: 800 });
  label(c, right, x + w - 18, y + h / 2 + 1, 25, { align: 'right', fill: '#7cb3ff', weight: 800 });
  // mine + skull icon in the middle
  tellerMine(c, x + w * .52, y + h / 2 + 2, .22, {});
  skull(c, x + w * .63, y + h / 2 + 1, .62);
  c.restore();
}
// Rubber stamp slam.
function stamp(c, t, t0, x, y, txt, o = {}) {
  const k = seg(t, t0, t0 + .09); if (k <= 0) return;
  const size = o.size || 110, rot = o.rot === undefined ? -.14 : o.rot;
  c.save(); c.translate(x, y); c.rotate(rot); const sc = lerp(2.4, 1, k * k); c.scale(sc, sc); c.globalAlpha = lerp(.15, .94, k);
  c.font = `${size}px Stencil`; const w = c.measureText(txt).width + size * .7, h = size * 1.45;
  c.lineWidth = size * .09; c.strokeStyle = o.col || '#d6241b'; c.stroke(rrect(-w / 2, -h / 2, w, h, size * .14));
  c.fillStyle = o.col || '#d6241b'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, size * .05);
  c.restore();
}
// Game UI progress bar.
function progressBar(c, x, y, w, k, txt, pct) {
  c.save();
  c.fillStyle = 'rgba(8,10,14,.82)'; c.fill(rrect(x, y, w, 90, 8));
  c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.6)'; c.stroke(rrect(x, y, w, 90, 8));
  label(c, txt, x + 22, y + 28, 27, { align: 'left', fill: '#fff' });
  label(c, pct, x + w - 22, y + 28, 27, { align: 'right', fill: '#7cf0a1' });
  c.fillStyle = '#20252e'; c.fill(rrect(x + 22, y + 54, w - 44, 20, 5));
  c.fillStyle = '#58d97f'; c.fill(rrect(x + 22, y + 54, Math.max(8, (w - 44) * k), 20, 5));
  c.restore();
}

// ---------- Tools ----------
function bayonet(R, A, len = 170, o = {}) {
  // Blade pointing along the forearm direction.
  const c = R.c; c.save(); c.translate(A.hx, A.hy); c.rotate(o.rot === undefined ? A.ang : o.rot);
  R.shape(rrect(-30, -9, 48, 18, 5), '#402d1d', 4);
  R.shape(rrect(14, -14, 11, 28, 3), '#878d94', 3.5);
  R.shape(poly([[24, -8], [len - 28, -7], [len, 0], [len - 28, 8], [24, 8]]), lin(c, 0, -8, 0, 8, [[0, '#f4f6f8'], [.5, '#c5ccd3'], [1, '#737b84']]), 3.5);
  c.restore();
}
function detectorTool(R, A, sweep = 0) {
  // Shaft from the hand down to a flat search coil.
  const c = R.c; c.save(); c.translate(A.hx, A.hy); c.rotate(sweep);
  R.tube([[-24, -14], [90, 66], [176, 126]], 9, '#3a3d42');
  R.fn(g => { line(g, [[-12, 0], [60, 40]], 4, '#a33', true); });
  c.translate(186, 132);
  R.shape(ell(0, 0, 72, 21), 'rgba(160,200,170,.12)', 8);
  R.fn(g => { g.lineWidth = 6; g.strokeStyle = '#d2d5c0'; g.stroke(ell(0, 0, 72, 21)); });
  c.restore();
}
function plunger(c, x, y, s, down) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const H0 = lerp(66, 12, down);
  ink(c, rrect(-9, -H0 - 70, 18, H0 + 34, 2), '#b7bcc2', 4);
  ink(c, rrect(-54, -H0 - 84, 108, 22, 8), '#3b2d22', 5);
  ink(c, rrect(-52, -44, 104, 62, 7), lin(c, 0, -44, 0, 18, [[0, '#a74a2b'], [1, '#5a2312']]), 6);
  label(c, 'TNT', 0, -13, 30, { font: 'Stencil', fill: '#f3e7c5' });
  c.restore();
}

// ---------- Scorpion flail tank (side view). x,y = ground under hull centre ----------
function flailTank(c, x, y, s, t, o = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const R = new Rig(c, 6);
  const wheelPhase = (o.dist || 0) * .02;
  // boom arms + drum first so the hull overlaps them
  const drumX = 372, drumY = -106, ang = t * 13;
  // chains: whipping out from the drum
  R.fn(g => {
    for (let i = 0; i < 11; i++) {
      const a = ang + i * .571, wob = Math.sin(t * 19 + i) * .1;
      const len = 96 + hash(i) * 26;
      const ex = Math.cos(a + wob) * len, ey = Math.sin(a + wob) * len;
      const bx = drumX + Math.cos(a) * 20, by = drumY + Math.sin(a) * 20;
      const tx = drumX + ex * 1.02, ty = Math.min(drumY + ey, 6 + hash(i * 3) * 4);
      const mx = (bx + tx) / 2 + Math.cos(a + 1.57) * 22, my = (by + ty) / 2 + Math.sin(a + 1.57) * 22;
      g.lineCap = 'round';
      g.lineWidth = 11; g.strokeStyle = INK; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(mx, my, tx, ty); g.stroke();
      g.lineWidth = 5; g.setLineDash([9, 6]); g.strokeStyle = '#a6acb4'; g.stroke(); g.setLineDash([]);
    }
  });
  R.shape(poly([[118, -198], [132, -212], [388, -116], [372, -94]]), '#50592f', 5);
  R.shape(ell(drumX, drumY, 26), '#7c8287', 5, g => { g.fillStyle = 'rgba(0,0,0,.3)'; g.fill(ell(drumX + 7, drumY + 8, 20)); });
  R.fn(g => { g.save(); g.translate(drumX, drumY); g.rotate(ang); line(g, [[-20, 0], [20, 0]], 4); line(g, [[0, -20], [0, 20]], 4); g.restore(); });
  // tracks
  const trk = sp([[-268, -26], [-256, -82], [-120, -96], [170, -96], [262, -74], [276, -22], [240, 2], [-236, 2]]);
  R.shape(trk, '#25272c', 6, g => {
    g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(-300, -96, 620, 14);
    for (let i = 0; i < 30; i++) { const px = -290 + ((i * 22 + wheelPhase * 22 * 8) % 660); g.fillStyle = '#17181c'; g.fillRect(px, -100, 7, 110); }
  });
  // road wheels
  R.fn(g => {
    for (let i = 0; i < 7; i++) {
      const wx = -204 + i * 68, wy = -36;
      ink(g, ell(wx, wy, 30), '#4a4f53', 5);
      ink(g, ell(wx, wy, 13), '#2a2d31', 4);
      g.save(); g.translate(wx, wy); g.rotate(wheelPhase * 4); line(g, [[-22, 0], [22, 0]], 3.5, '#17181c'); line(g, [[0, -22], [0, 22]], 3.5, '#17181c'); g.restore();
    }
  });
  // hull with armoured skirt
  const hull = sp([[-288, -96], [-262, -166], [-120, -188], [122, -188], [244, -156], [310, -104], [290, -72], [-268, -70]]);
  R.shape(hull, lin(c, 0, -190, 0, -70, [[0, '#a79a64'], [.55, '#7d7648'], [1, '#4c4a2c']]), 6, g => {
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fill(sp([[-300, -96], [320, -104], [320, -60], [-300, -60]]));
    g.fillStyle = 'rgba(70,84,44,.55)'; g.fill(sp([[-170, -168], [-70, -176], [-40, -130], [-130, -106], [-220, -120]])); g.fill(sp([[60, -170], [160, -154], [190, -120], [90, -110], [40, -130]]));
    g.fillStyle = '#17181a'; for (let i = 0; i < 14; i++) g.fill(ell(-250 + i * 40, -84, 4));
  });
  // turret
  const turret = sp([[-120, -194], [-96, -262], [60, -272], [120, -226], [112, -188], [-110, -186]]);
  R.tube([[110, -228], [262, -236]], 20, '#5c5a38');
  R.shape(turret, lin(c, 0, -272, 0, -186, [[0, '#b2a56d'], [1, '#6a643b']]), 6, g => {
    g.fillStyle = 'rgba(70,84,44,.55)'; g.fill(sp([[-70, -262], [10, -262], [30, -220], [-30, -200], [-90, -214]]));
    g.fillStyle = '#f0f0ea'; g.font = '700 32px Stencil'; g.textAlign = 'center'; g.fillText('SCORPION', 8, -212);
  });
  // commander in hatch
  c.save(); c.translate(-16, -318);
  const r = 44;
  R.shape(rrect(-40, 12, 80, 36, 10), '#8c6a34', 5);
  R.shape(ell(0, 0, r), rad(c, -r * .3, -r * .35, r * 1.5, [[0, '#fff'], [1, '#c2cad8']]), 5, g => headShade(g, r));
  R.fn(g => face(g, r, o.face || 'neutral', { lookX: 1 }));
  KITS.brit.hat(R, r);
  c.restore();
  R.draw();
  c.restore();
}

// Out-of-focus dark foreground that frames a shot; moves faster than the scene for depth.
const _fg = {};
function fgFrame(c, cam, seed = 1, opt = {}) {
  const key = seed;
  if (!_fg[key]) {
    const cv = mkCanvas(OW + 500, OH + 300), g = cv.getContext('2d'), r = RNG(seed * 7001 + 3);
    g.translate(250, 150); g.filter = 'blur(13px)';
    const col = opt.col || '#07090c';
    g.fillStyle = col;
    g.fill(sp([[-260, OH - 120 + r() * 50], [120, OH - 70 - r() * 60], [430, OH + 30], [520, OH + 170], [-260, OH + 170]]));
    g.fill(sp([[OW + 260, OH - 150 - r() * 50], [OW - 180, OH - 60 - r() * 60], [OW - 520, OH + 40], [OW - 620, OH + 170], [OW + 260, OH + 170]]));
    if (opt.top !== false) { g.globalAlpha = .9; g.fill(sp([[-260, -160], [OW * .36, -160], [OW * .18, -46 + r() * 22], [-30, 80 + r() * 50], [-260, 170]])); }
    g.globalAlpha = 1;
    g.filter = 'blur(5px)'; g.strokeStyle = col; g.lineWidth = 9;
    for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(OW - 640, OH - 124 + i * 40); g.quadraticCurveTo(OW - 330, OH - 190 + i * 46, OW + 60, OH - 200 + i * 42); g.stroke(); }
    _fg[key] = cv;
  }
  hud(c, g => {
    const z = 1 + (cam.z - 1) * 1.35;
    g.translate(OW / 2 + cam.x * 1.35, OH / 2 + cam.y * 1.35); g.scale(z, z); g.translate(-OW / 2, -OH / 2);
    g.drawImage(_fg[key], -250, -150);
  });
}
