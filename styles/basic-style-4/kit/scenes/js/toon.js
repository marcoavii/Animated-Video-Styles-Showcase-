// Basic style 4: flat vector cartoon characters and props drawn on canvas, placed as cutouts in a 3D set.
// The look (from the reference): flat fills with one soft shade, thick black outline, and a warm cream glow just
// outside every outline, so each part reads as a sticker. Faces are drawn, not modelled.
import * as THREE from "three";

export const OL = 15;            // black outline width, design units
const GLOW = "rgba(236,214,148,0.8)";
const INKC = "#14100d";

// ---------- colour helpers ----------
export function shade(hex, k) {
  const c = new THREE.Color(hex); c.r = Math.min(1, c.r * k); c.g = Math.min(1, c.g * k); c.b = Math.min(1, c.b * k);
  return "#" + c.getHexString();
}
const css = (hex) => (typeof hex === "string" ? hex : "#" + new THREE.Color(hex).getHexString());

// ---------- the sticker stroke: glow, fill, outline ----------
// path(g) builds the path; fill may be a colour or a function(g) that paints inside the clipped shape.
export function sticker(g, path, fill, o = {}) {
  const ol = o.ol ?? OL, glow = o.glow ?? 1;
  if (glow > 0) {
    g.save(); path(g);
    g.lineJoin = "round"; g.lineCap = "round";
    g.strokeStyle = GLOW; g.lineWidth = ol + 6 * glow; g.shadowColor = GLOW; g.shadowBlur = 5 * glow * (g.__k || 1);
    g.stroke(); g.restore();
  }
  g.save(); path(g);
  if (typeof fill === "function") { g.save(); g.clip(); fill(g); g.restore(); path(g); } // fill may build its own paths: rebuild the outline
  else if (fill) { g.fillStyle = css(fill); g.fill(); }
  if (ol > 0) { g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = o.ink ?? INKC; g.lineWidth = ol; g.stroke(); }
  g.restore();
}
// a tube along a polyline (arms, legs, stick limbs): glow, outline and fill done with three strokes
export function tube(g, pts, w, col, o = {}) {
  const ol = o.ol ?? OL, glow = o.glow ?? 1;
  const p = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  g.save(); g.lineJoin = "round"; g.lineCap = o.cap ?? "round";
  if (glow > 0) { p(); g.strokeStyle = GLOW; g.lineWidth = w + ol + 6 * glow; g.shadowColor = GLOW; g.shadowBlur = 5 * glow * (g.__k || 1); g.stroke(); g.shadowBlur = 0; }
  p(); g.strokeStyle = o.ink ?? INKC; g.lineWidth = w + ol; g.stroke();
  p(); g.strokeStyle = css(col); g.lineWidth = w; g.stroke();
  if (o.hi) { g.globalAlpha = 0.35; g.translate(-w * 0.18, -w * 0.05); p(); g.strokeStyle = "#ffffff"; g.lineWidth = w * 0.22; g.stroke(); }
  g.restore();
}
export const rrect = (x, y, w, h, r) => (g) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export const circ = (x, y, r) => (g) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
export const ell = (x, y, rx, ry, rot = 0) => (g) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };

// ---------- expressions ----------
// brow: inner-end tilt (+ angry, - worried), by: brow height, eyes: dot|big|small|arc|closed|half|line, mouth: line|smile|grin|frown|o|open|wavy|smirk|tiny
export const EXPR = {
  neutral: { brow: 0, by: 0, eyes: "dot", mouth: "line" },
  happy: { brow: -6, by: -4, eyes: "dot", mouth: "smile" },
  joy: { brow: -10, by: -10, eyes: "arc", mouth: "open" },
  laugh: { brow: -10, by: -12, eyes: "arc", mouth: "laugh" },
  angry: { brow: 26, by: 10, eyes: "dot", mouth: "frown" },
  smug: { brow: 18, by: 6, eyes: "half", mouth: "smirk" },
  shock: { brow: -16, by: -26, eyes: "big", mouth: "o" },
  terror: { brow: -26, by: -24, eyes: "small", mouth: "scream" },
  worried: { brow: -24, by: -10, eyes: "dot", mouth: "wavy" },
  sad: { brow: -22, by: -4, eyes: "half", mouth: "frown" },
  sleepy: { brow: 0, by: 6, eyes: "half", mouth: "tiny" },
  sleep: { brow: 0, by: 4, eyes: "closed", mouth: "tiny" },
  sing: { brow: -10, by: -8, eyes: "arc", mouth: "o" },
  hum: { brow: -8, by: -6, eyes: "arc", mouth: "smile" },
  shout: { brow: 22, by: 4, eyes: "big", mouth: "scream" },
  stern: { brow: 20, by: 8, eyes: "dot", mouth: "line" },
};

function drawFace(g, ex, o, look, blink, fs) {
  const e = EXPR[ex] || EXPR.neutral;
  g.save(); g.scale(fs, fs);
  // cheeks
  g.fillStyle = "rgba(232,118,104,0.26)";
  [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(s * 104, 58, 30, 22, 0, 0, 7); g.fill(); });
  // eyes
  const eyes = blink && (e.eyes === "dot" || e.eyes === "half" || e.eyes === "big" || e.eyes === "small") ? "line" : e.eyes;
  [-1, 1].forEach((s) => {
    const x = s * 64, y = -2;
    g.save();
    if (eyes === "dot" || eyes === "half") {
      g.fillStyle = INKC; g.beginPath(); g.ellipse(x + look[0] * 6, y + look[1] * 5, 20, 27, 0, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 7 + look[0] * 6, y - 10 + look[1] * 5, 7.5, 0, 7); g.fill();
      if (eyes === "half") { g.fillStyle = o.skinC; g.fillRect(x - 32, y - 40, 64, 38); g.strokeStyle = INKC; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(x - 26, y - 2); g.lineTo(x + 26, y - 2); g.stroke(); }
    } else if (eyes === "big" || eyes === "small") {
      sticker(g, circ(x, y - 4, 44), "#ffffff", { ol: 9, glow: 0 });
      g.fillStyle = INKC; g.beginPath(); g.arc(x + look[0] * 14, y - 4 + look[1] * 12, eyes === "small" ? 11 : 19, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x + 6 + look[0] * 14, y - 11 + look[1] * 12, eyes === "small" ? 3.5 : 6, 0, 7); g.fill();
    } else if (eyes === "arc") {
      g.strokeStyle = INKC; g.lineWidth = 11; g.lineCap = "round"; g.beginPath(); g.arc(x, y + 10, 22, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
    } else if (eyes === "closed") {
      g.strokeStyle = INKC; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.arc(x, y - 12, 22, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    } else if (eyes === "line") {
      g.strokeStyle = INKC; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.moveTo(x - 20, y + 2); g.lineTo(x + 20, y + 2); g.stroke();
    }
    g.restore();
    // brow
    const bx = s * 68, byy = -70 + (e.by || 0);
    g.strokeStyle = o.browC; g.lineWidth = 17; g.lineCap = "round";
    g.beginPath(); g.moveTo(bx + s * 36, byy - (e.brow || 0) * 0.35); g.lineTo(bx - s * 36, byy + (e.brow || 0) * 0.65); g.stroke();
  });
  // nose
  g.strokeStyle = shade(o.skin, 0.62); g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.arc(0, 30, 13, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
  // mouth
  const mc = "#5e2a1c"; g.strokeStyle = mc; g.lineCap = "round"; g.lineJoin = "round";
  const m = e.mouth, my = 92;
  if (m === "line") { g.lineWidth = 13; g.beginPath(); g.moveTo(-30, my); g.lineTo(30, my); g.stroke(); }
  else if (m === "tiny") { g.lineWidth = 11; g.beginPath(); g.moveTo(-14, my); g.lineTo(14, my); g.stroke(); }
  else if (m === "smile") { g.lineWidth = 12; g.beginPath(); g.arc(0, my - 30, 40, Math.PI * 0.22, Math.PI * 0.78); g.stroke(); }
  else if (m === "frown") { g.lineWidth = 12; g.beginPath(); g.arc(0, my + 28, 34, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
  else if (m === "smirk") { g.lineWidth = 12; g.beginPath(); g.moveTo(-24, my + 4); g.quadraticCurveTo(10, my + 8, 32, my - 10); g.stroke(); }
  else if (m === "wavy") { g.lineWidth = 11; g.beginPath(); g.moveTo(-32, my); g.quadraticCurveTo(-16, my - 12, 0, my); g.quadraticCurveTo(16, my + 12, 32, my); g.stroke(); }
  else if (m === "o") { sticker(g, ell(0, my + 4, 17, 21), "#4a1712", { ol: 9, glow: 0, ink: mc }); }
  else if (m === "open" || m === "laugh" || m === "scream") {
    const w = m === "laugh" ? 56 : m === "scream" ? 34 : 44, h = m === "scream" ? 50 : 40;
    const path = m === "scream" ? ell(0, my + 8, w, h) : (gg) => { gg.beginPath(); gg.moveTo(-w, my - 8); gg.quadraticCurveTo(0, my - 14, w, my - 8); gg.quadraticCurveTo(w * 0.8, my + h, 0, my + h); gg.quadraticCurveTo(-w * 0.8, my + h, -w, my - 8); gg.closePath(); };
    sticker(g, path, (gg) => { gg.fillStyle = "#4a1712"; gg.fillRect(-80, my - 40, 160, 120); gg.fillStyle = "#e0606a"; gg.beginPath(); gg.ellipse(0, my + h + 4, w * 0.6, h * 0.45, 0, 0, 7); gg.fill(); if (m !== "scream") { gg.fillStyle = "#fff"; gg.fillRect(-w, my - 14, w * 2, 12); } }, { ol: 9, glow: 0, ink: mc });
  }
  g.restore();
}

// ---------- the character ----------
const DW = 768, DH = 1024, GROUND = 975, C = DW / 2;
export const UNIT = 2.4 / 945; // metres per design unit: a character is 2.4 m tall

export class Puppet {
  constructor(parent, o = {}) {
    this.o = { skin: 0xc48d5c, shirt: 0x8a8f96, sleeve: null, sleeveLen: 1, pants: 0x4a4038, shoe: 0x3a2a20, hair: "short", hairC: 0x15120f, hijab: null, glasses: false, pattern: null, patternC: 0xe8c86a, res: 1536, seed: 1, buttons: false, ...o };
    const a = this.o;
    a.sleeve = a.sleeve ?? a.shirt;
    a.skinC = css(a.skin); a.browC = css(a.browC ?? (a.hair === "bald" || a.hair === "none" ? 0x3a2418 : a.hairC));
    this.k = a.res / DH;
    this.cv = document.createElement("canvas"); this.cv.width = Math.round(DW * this.k); this.cv.height = a.res;
    this.g = this.cv.getContext("2d"); this.g.__k = this.k;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.tex.minFilter = THREE.LinearMipmapLinearFilter; this.tex.generateMipmaps = true;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, depthWrite: true });
    const pw = DW * UNIT, ph = DH * UNIT;
    const geo = new THREE.PlaneGeometry(pw, ph); geo.translate(0, (DH / 2 - (DH - GROUND)) * UNIT, 0);
    this.root = new THREE.Group(); parent.add(this.root);
    this.plane = new THREE.Mesh(geo, this.mat); this.plane.castShadow = false; this.plane.receiveShadow = false; this.root.add(this.plane);
    // soft contact shadow
    if (o.shadow !== false) {
      const st = shadowTex();
      this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false, opacity: 0.45, color: 0x000000 }));
      this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = 0.012; this.root.add(this.blob);
    }
    this.key = "";
    this.seed = a.seed;
  }
  tint(c) { this.mat.color.set(c); }
  // all angles in degrees. armL/armR: 0 = hanging, + = raised away from the body. elbow: + = forearm folds toward the body
  pose(p = {}) {
    const { x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, t = 0, visible = true, scale = 1, hop = 0, squash = 0 } = p;
    this.root.visible = visible;
    if (!visible) return;
    this.root.position.set(x, y + hop, z); this.root.rotation.set(rx, ry, rz); this.root.scale.set(scale * (1 + squash * 0.5), scale * (1 - squash), scale);
    if (this.blob) this.blob.visible = rx === 0 && p.blob !== false;
    const per = 3.1 + (this.seed % 5) * 0.37, ph = (t + this.seed * 0.71) % per;
    const blink = p.blink !== false && ph < 0.12;
    const walk = p.walk ? Math.sin(t * 9 * (p.walkRate ?? 1) + this.seed) : 0;
    const d = {
      expr: p.expr ?? "neutral", look: (p.look ?? [0, 0]).map((v) => Math.round(v * 20) / 20), blink,
      armL: Math.round((p.armL ?? 8) + (p.walk ? -walk * 26 * p.walk : 0)), armR: Math.round((p.armR ?? 8) + (p.walk ? walk * 26 * p.walk : 0)),
      elbowL: Math.round(p.elbowL ?? 0), elbowR: Math.round(p.elbowR ?? 0),
      tilt: Math.round((p.headTilt ?? 0) * 2) / 2, turn: Math.round((p.headTurn ?? 0) * 20) / 20, legs: p.walk ? Math.round(walk * 16 * p.walk) : Math.round(p.legs ?? 0),
      bob: Math.round(((p.walk ? Math.abs(walk) * 14 * p.walk : 0) + Math.sin(t * 2.2 + this.seed) * 3 * (p.breath ?? 1))), sweat: p.sweat ? 1 : 0,
      holdL: p.holdL || "", holdR: p.holdR || "", kneel: p.kneel ? 1 : 0, wave: Math.round(p.wave ?? 0), back: p.back ? 1 : 0,
    };
    const key = JSON.stringify(d);
    if (key !== this.key) { this.key = key; this.draw(d, p); this.tex.needsUpdate = true; }
  }
  // world position of a hand (for attaching 3D props)
  handWorld(side = "R") {
    const h = this._hands?.[side] || [C, 600];
    const v = new THREE.Vector3((h[0] - C) * UNIT, (GROUND - h[1]) * UNIT, 0.02);
    this.root.updateMatrixWorld(true);
    return this.root.localToWorld(v);
  }
  draw(d, p) {
    const g = this.g, a = this.o, k = this.k;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    const bob = d.bob, kneel = d.kneel;
    const hipY = 712 + bob + kneel * 150, torsoTop = 392 + bob + kneel * 150;
    const headC = [C + d.turn * 10, 222 + bob + kneel * 150];
    const R = 208;
    // legs
    if (!kneel) {
      [-1, 1].forEach((s) => {
        const hip = [C + s * 56, hipY - 10];
        const sw = s * d.legs;
        g.save(); g.translate(hip[0], hip[1]); g.rotate((sw * Math.PI) / 180);
        sticker(g, rrect(-48, 0, 96, 238, 14), (gg) => { gg.fillStyle = css(a.pants); gg.fillRect(-60, 0, 120, 240); gg.fillStyle = shade(a.pants, 0.82); gg.fillRect(18, 0, 32, 240); });
        sticker(g, (gg) => { gg.beginPath(); gg.roundRect(-60 + s * 8, 220, 124, 58, [32, 32, 12, 12]); }, (gg) => { gg.fillStyle = css(a.shoe); gg.fillRect(-80, 200, 160, 90); gg.fillStyle = 'rgba(255,255,255,.18)'; gg.beginPath(); gg.ellipse(-14 + s * 8, 236, 26, 8, 0, 0, 7); gg.fill(); });
        g.restore();
      });
    } else {
      sticker(g, rrect(C - 150, hipY - 30, 300, 110, 40), a.pants);
    }
    // arms behind? no: the reference keeps arms in front of the torso
    // torso
    const tw = 330, th = hipY - torsoTop + 20;
    sticker(g, rrect(C - tw / 2, torsoTop, tw, th, 52), (gg) => {
      gg.fillStyle = css(a.shirt); gg.fillRect(0, 0, DW, DH);
      if (a.pattern === "check") { gg.strokeStyle = css(a.patternC); gg.globalAlpha = 0.85; gg.lineWidth = 10; gg.setLineDash([14, 8]); for (let i = 0; i < 8; i++) { gg.beginPath(); gg.moveTo(C - tw / 2 + 30 + i * 34, torsoTop); gg.lineTo(C - tw / 2 + 30 + i * 34, torsoTop + th); gg.stroke(); gg.beginPath(); gg.moveTo(C - tw / 2, torsoTop + 30 + i * 40); gg.lineTo(C + tw / 2, torsoTop + 30 + i * 40); gg.stroke(); } gg.setLineDash([]); gg.globalAlpha = 1; }
      if (a.pattern === "flower") { gg.fillStyle = css(a.patternC); for (let i = 0; i < 26; i++) { const xx = C - tw / 2 + 20 + ((i * 53) % (tw - 30)), yy = torsoTop + 30 + ((i * 37) % (th - 40)); for (let q = 0; q < 5; q++) { gg.beginPath(); gg.arc(xx + Math.cos(q * 1.257) * 9, yy + Math.sin(q * 1.257) * 9, 6, 0, 7); gg.fill(); } } }
      if (a.pattern === "stripes") { gg.fillStyle = css(a.patternC); for (let i = 0; i < 12; i++) gg.fillRect(C - tw / 2, torsoTop + 10 + i * 34, tw, 14); }
      gg.fillStyle = "rgba(255,255,255,0.13)"; gg.fillRect(C - tw / 2, torsoTop, 70, th);
      gg.fillStyle = "rgba(0,0,0,0.13)"; gg.fillRect(C + tw / 2 - 80, torsoTop, 80, th);
      if (a.buttons) { gg.fillStyle = "#f4f0e4"; for (let i = 0; i < 4; i++) { gg.beginPath(); gg.arc(C, torsoTop + 70 + i * 62, 8, 0, 7); gg.fill(); } }
    });
    // head behind-parts: hijab back, bun, ears
    const hx = headC[0], hy = headC[1];
    g.save(); g.translate(hx, hy); g.rotate((d.tilt * Math.PI) / 180);
    if (a.hijab) {
      sticker(g, (gg) => { gg.beginPath(); gg.moveTo(-R - 30, 40); gg.arc(0, 10, R + 40, Math.PI, 0); gg.lineTo(R + 60, R + 120); gg.quadraticCurveTo(0, R + 175, -R - 60, R + 120); gg.closePath(); }, (gg) => { gg.fillStyle = css(a.hijab); gg.fillRect(-400, -400, 800, 900); gg.fillStyle = "rgba(0,0,0,0.12)"; gg.fillRect(60, -400, 400, 900); });
    } else {
      if (a.hair === "bun") sticker(g, circ(0, -R - 18, 66), a.hairC);
      [-1, 1].forEach((s) => sticker(g, circ(s * (R - 6), 22, 38), shade(a.skin, 0.93)));
    }
    // head
    const faceR = a.hijab ? R * 0.84 : R, faceY = a.hijab ? 26 : 0;
    if (d.back) {
      sticker(g, circ(0, 0, a.hijab ? R + 34 : R), (gg) => { gg.fillStyle = css(a.hijab || a.hairC); gg.fillRect(-R - 60, -R - 60, 2 * R + 120, 2 * R + 160); gg.strokeStyle = a.hijab ? "rgba(255,255,255,.18)" : (a.hairHi ?? "#59606a"); gg.lineWidth = 16; gg.lineCap = "round"; gg.beginPath(); gg.arc(0, 0, R - 26, Math.PI * 1.28, Math.PI * 1.72); gg.stroke(); });
      g.restore();
    } else {
    sticker(g, circ(0, faceY, faceR), (gg) => {
      gg.fillStyle = shade(a.skin, 0.86); gg.fillRect(-R - 20, -R - 20, 2 * R + 40, 2 * R + 40);
      gg.fillStyle = a.skinC; gg.beginPath(); gg.arc(-14, faceY - 18, faceR * 0.97, 0, 7); gg.fill();
      if (!a.hijab && a.hair !== "bald" && a.hair !== "none") {
        gg.fillStyle = css(a.hairC); gg.beginPath();
        gg.moveTo(-R - 20, 10); gg.lineTo(-R + 26, 10); gg.lineTo(-R + 26, -40); gg.lineTo(-R + 46, -52); gg.quadraticCurveTo(0, -150, R - 46, -52); gg.lineTo(R - 26, -40); gg.lineTo(R - 26, 10); gg.lineTo(R + 20, 10); gg.lineTo(R + 20, -R - 30); gg.lineTo(-R - 20, -R - 30); gg.closePath(); gg.fill();
        gg.strokeStyle = a.hairHi ?? "#59606a"; gg.globalAlpha = 0.85; gg.lineWidth = 16; gg.lineCap = "round"; gg.beginPath(); gg.arc(0, 0, R - 26, Math.PI * 1.28, Math.PI * 1.72); gg.stroke(); gg.globalAlpha = 1;
      }
    });
    if (a.hijab) {
      // front band over the forehead
      sticker(g, (gg) => { gg.beginPath(); gg.arc(0, faceY + 10, faceR + 6, Math.PI * 1.08, Math.PI * 1.92); gg.arc(0, faceY + 60, faceR * 0.9, Math.PI * 1.85, Math.PI * 1.15, true); gg.closePath(); }, a.hijab, { glow: 0 });
    }
    g.save(); g.translate(d.turn * 22, faceY + (a.hijab ? 14 : 0));
    drawFace(g, d.expr, a, d.look, d.blink, (a.hijab ? 0.8 : 1) * R / 175);
    if (a.glasses) { g.strokeStyle = INKC; g.lineWidth = 9; [-1, 1].forEach((s) => { g.beginPath(); g.arc(s * 64, -2, 46, 0, 7); g.stroke(); }); g.beginPath(); g.moveTo(-18, -6); g.lineTo(18, -6); g.stroke(); }
    g.restore();
    if (d.sweat) sticker(g, (gg) => { gg.beginPath(); gg.moveTo(R * 0.86, -R * 0.42); gg.quadraticCurveTo(R * 0.86 + 30, -R * 0.08, R * 0.86, -R * 0.04); gg.quadraticCurveTo(R * 0.86 - 30, -R * 0.08, R * 0.86, -R * 0.42); }, "#8fd2f0", { ol: 8, glow: 0.6 });
    g.restore();
    }
    // arms (in front of the torso)
    this._hands = {};
    [["L", -1], ["R", 1]].forEach(([side, s]) => {
      let ang = d["arm" + side], elb = d["elbow" + side];
      if (side === "R" && d.wave) { ang = 150; elb = -20 + d.wave; }
      const sh = [C + s * 138, torsoTop + 60];
      const a1 = (ang * Math.PI) / 180, a2 = ((ang - elb) * Math.PI) / 180;
      const L1 = 124, L2 = 118;
      const el = [sh[0] + s * Math.sin(a1) * L1, sh[1] + Math.cos(a1) * L1];
      const hd = [el[0] + s * Math.sin(a2) * L2, el[1] + Math.cos(a2) * L2];
      this._hands[side] = hd;
      tube(g, [sh, el, hd], 74, a.skin, { hi: false });
      if (a.sleeveLen > 0) { const f = a.sleeveLen; const sl = f <= 0.5 ? [sh, [sh[0] + (el[0] - sh[0]) * f * 2, sh[1] + (el[1] - sh[1]) * f * 2]] : [sh, el, [el[0] + (hd[0] - el[0]) * (f - 0.5) * 2, el[1] + (hd[1] - el[1]) * (f - 0.5) * 2]]; tube(g, sl, 74, a.sleeve, { glow: 0, hi: true }); }
      const hold = d["hold" + side];
      if (hold && HOLD[hold]) { g.save(); g.translate(hd[0], hd[1]); HOLD[hold](g, s); g.restore(); }
      sticker(g, circ(hd[0], hd[1], 40), a.skin, { glow: 0.6 });
    });
  }
}

// things a hand can hold, drawn in hand-local design units
export const HOLD = {
  bucket: (g) => {
    g.strokeStyle = INKC; g.lineWidth = 9; g.beginPath(); g.arc(0, 40, 62, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    sticker(g, (gg) => { gg.beginPath(); gg.moveTo(-70, 30); gg.lineTo(70, 30); gg.lineTo(54, 150); gg.lineTo(-54, 150); gg.closePath(); }, (gg) => { gg.fillStyle = "#2f80d0"; gg.fillRect(-90, 0, 180, 200); gg.fillStyle = "rgba(255,255,255,.25)"; gg.fillRect(-60, 30, 22, 120); gg.fillStyle = "rgba(0,0,0,.15)"; gg.fillRect(30, 30, 40, 120); });
    sticker(g, rrect(-76, 22, 152, 20, 10), "#3f92e0", { glow: 0 });
  },
};

let SHADOW = null;
function shadowTex() {
  if (SHADOW) return SHADOW;
  const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 64, 0, 128, 64, 128); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.scale(1, 0.5); g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
  SHADOW = new THREE.CanvasTexture(c);
  return SHADOW;
}

// ---------- 2D cutout props ----------
// draw(g, t, state) paints in a w x h design box; call cut.update(t, state) to redraw (only if state key changes).
export class Cutout {
  constructor(parent, w, h, worldH, draw, o = {}) {
    this.w = w; this.h = h; this.draw = draw; this.k = (o.res ?? 1024) / Math.max(w, h);
    this.cv = document.createElement("canvas"); this.cv.width = Math.round(w * this.k); this.cv.height = Math.round(h * this.k);
    this.g = this.cv.getContext("2d"); this.g.__k = this.k;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: o.alphaTest ?? 0.04, side: THREE.DoubleSide, depthWrite: o.depthWrite ?? true, opacity: 1 });
    const geo = new THREE.PlaneGeometry((w / h) * worldH, worldH);
    if (o.anchor === "bottom") geo.translate(0, worldH / 2, 0);
    this.mesh = new THREE.Mesh(geo, this.mat); parent.add(this.mesh);
    this.key = null;
    this.update(0, o.state ?? {});
  }
  update(t, state = {}) {
    const key = JSON.stringify(state);
    if (key === this.key) return;
    this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height); g.setTransform(this.k, 0, 0, this.k, 0, 0);
    this.draw(g, state, this.w, this.h);
    this.tex.needsUpdate = true;
  }
}
