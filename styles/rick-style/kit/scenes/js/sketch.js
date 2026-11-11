// Rick Style characters: hand-inked 2D figures (white round heads, stick limbs, bean bodies) living as billboards
// in a saturated 3D world. Outlines are drawn as a variable-width ink line, steady from frame to frame (no boil).
import * as THREE from "three";

const INK = "#16120f";
export const css = (hex) => (typeof hex === "string" ? hex : "#" + new THREE.Color(hex).getHexString());
export function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); c.r = Math.min(1, c.r); c.g = Math.min(1, c.g); c.b = Math.min(1, c.b); return "#" + c.getHexString(); }

// ---------- steady hand-drawn noise ----------
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };

// point lists for shapes, with a slight hand wobble
export function circlePts(cx, cy, r, seed = 1, wob = 0.012, n = 72) {
  const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = r * (1 + (vnoise(i * 0.35 + seed * 9) - 0.5) * wob * 2); out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return out;
}
export function ellPts(cx, cy, rx, ry, seed = 1, wob = 0.012, n = 72, rot = 0) {
  const out = []; const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (vnoise(i * 0.35 + seed * 9) - 0.5) * wob * 2; const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k; out.push([cx + x * c - y * s, cy + x * s + y * c]); } return out;
}
// superellipse: the bean / egg body
export function beanPts(cx, cy, rx, ry, p = 2.6, seed = 1, n = 80) {
  const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); const k = 1 + (vnoise(i * 0.3 + seed * 7) - 0.5) * 0.02; const x = Math.sign(ca) * Math.pow(Math.abs(ca), 2 / p) * rx * k, y = Math.sign(sa) * Math.pow(Math.abs(sa), 2 / p) * ry * k * (sa > 0 ? 1.0 : 0.94); out.push([cx + x, cy + y]); } return out;
}
const pathOf = (g, pts, closed = true) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (closed) g.closePath(); };
// ink line with a living width: thicker in the middle of strokes, thinner at turns
export function inkLine(g, pts, w, closed = true, seed = 1, col = INK) {
  g.save(); g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round";
  const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    g.lineWidth = w * (0.72 + 0.56 * vnoise(i * 0.22 + seed * 3.1));
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  g.restore();
}
// filled shape + optional inside painting + ink outline
export function blob(g, pts, fill, w = 11, seed = 1) {
  g.save(); pathOf(g, pts);
  if (typeof fill === "function") { g.save(); g.clip(); fill(g); g.restore(); } else if (fill) { g.fillStyle = css(fill); g.fill(); }
  g.restore();
  if (w > 0) inkLine(g, pts, w, true, seed);
}
export function stroke(g, pts, w, seed = 1, col = INK) { inkLine(g, pts, w, false, seed, col); }

// ---------- expressions ----------
export const EXPR = {
  neutral: { eyes: "dot", brow: 0, mouth: "line" }, happy: { eyes: "arc", brow: -6, mouth: "smile" }, joy: { eyes: "arc", brow: -10, mouth: "grin" },
  laugh: { eyes: "arc", brow: -12, mouth: "laugh" }, smug: { eyes: "half", brow: 14, mouth: "smirk" }, sly: { eyes: "half", brow: 10, mouth: "grin" },
  shock: { eyes: "big", brow: -14, mouth: "o" }, terror: { eyes: "small", brow: -22, mouth: "scream" }, worried: { eyes: "dot", brow: -20, mouth: "wavy" },
  angry: { eyes: "dot", brow: 24, mouth: "teeth" }, sleep: { eyes: "closed", brow: 0, mouth: "tiny" }, sleepy: { eyes: "half", brow: 0, mouth: "tiny" },
  sing: { eyes: "arc", brow: -8, mouth: "o" }, hum: { eyes: "arc", brow: -6, mouth: "smile" }, shout: { eyes: "big", brow: 20, mouth: "scream" },
};
function face(g, e, look, blink, seed) {
  const eyes = blink && ["dot", "half", "big", "small"].includes(e.eyes) ? "line" : e.eyes;
  [-1, 1].forEach((s) => {
    const x = s * 50, y = 0;
    if (eyes === "dot" || eyes === "half") {
      g.fillStyle = INK; g.beginPath(); g.ellipse(x + look[0] * 6, y + look[1] * 5, 12, 16, 0, 0, 7); g.fill();
      if (eyes === "half") stroke(g, [[x - 20, y - 6], [x, y - 9], [x + 20, y - 6]], 9, seed + s);
    } else if (eyes === "big" || eyes === "small") {
      blob(g, circlePts(x, y - 2, 30, seed + s * 3), "#ffffff", 8, seed + s);
      g.fillStyle = INK; g.beginPath(); g.arc(x + look[0] * 10, y - 2 + look[1] * 9, eyes === "small" ? 7 : 12, 0, 7); g.fill();
    } else if (eyes === "arc") stroke(g, [[x - 18, y + 6], [x - 9, y - 6], [x + 9, y - 6], [x + 18, y + 6]], 9, seed + s);
    else if (eyes === "closed") stroke(g, [[x - 18, y - 4], [x - 9, y + 6], [x + 9, y + 6], [x + 18, y - 4]], 9, seed + s);
    else stroke(g, [[x - 16, y], [x + 16, y]], 9, seed + s);
    const b = e.brow || 0; stroke(g, [[x + s * 24, y - 42 - b * 0.3], [x - s * 18, y - 40 + b * 0.6]], 9, seed + s + 7);
  });
  const my = 62, m = e.mouth;
  if (m === "line") stroke(g, [[-22, my], [0, my + 2], [22, my]], 9, seed);
  else if (m === "tiny") stroke(g, [[-10, my], [10, my]], 8, seed);
  else if (m === "smile") stroke(g, [[-30, my - 8], [-14, my + 6], [14, my + 6], [30, my - 8]], 9, seed);
  else if (m === "smirk") stroke(g, [[-22, my + 4], [6, my + 4], [28, my - 10]], 9, seed);
  else if (m === "wavy") stroke(g, [[-26, my], [-13, my - 8], [0, my], [13, my + 8], [26, my]], 8, seed);
  else if (m === "o") blob(g, ellPts(0, my + 4, 13, 16, seed), "#3a1410", 7, seed);
  else if (m === "grin" || m === "laugh") {
    const w = m === "laugh" ? 46 : 38;
    blob(g, [[-w, my - 10], [w, my - 10], [w * 0.7, my + 22], [0, my + 30], [-w * 0.7, my + 22]], (gg) => { gg.fillStyle = "#3a1410"; gg.fillRect(-60, my - 20, 120, 60); gg.fillStyle = "#fff"; gg.fillRect(-w, my - 12, w * 2, 14); gg.fillStyle = "#e0606a"; gg.beginPath(); gg.ellipse(0, my + 28, 18, 9, 0, 0, 7); gg.fill(); }, 8, seed);
  } else if (m === "teeth") {
    blob(g, [[-30, my - 12], [30, my - 12], [30, my + 12], [-30, my + 12]], (gg) => { gg.fillStyle = "#fff"; gg.fillRect(-40, my - 20, 80, 40); gg.strokeStyle = INK; gg.lineWidth = 4; for (let i = -2; i <= 2; i++) { gg.beginPath(); gg.moveTo(i * 12, my - 12); gg.lineTo(i * 12, my + 12); gg.stroke(); } gg.beginPath(); gg.moveTo(-30, my); gg.lineTo(30, my); gg.stroke(); }, 7, seed);
  } else if (m === "scream") blob(g, ellPts(0, my + 8, 22, 30, seed), (gg) => { gg.fillStyle = "#3a1410"; gg.fillRect(-40, my - 30, 80, 80); gg.fillStyle = "#e0606a"; gg.beginPath(); gg.ellipse(0, my + 30, 14, 10, 0, 0, 7); gg.fill(); }, 8, seed);
}

// ---------- the character ----------
const DW = 768, DH = 1024, GROUND = 975, C = DW / 2;
export const UNIT = 2.4 / 945;

export class Toon {
  constructor(parent, o = {}) {
    this.o = { shirt: 0x2f9a8a, shirt2: null, pants: 0x2a2a2e, shoe: 0x16120f, hair: "tuft", hairC: 0x6a4428, hat: null, hatC: 0x222222, hijab: null, vest: null, tie: null, res: 1536, seed: 1, head: "#f6f4ee", ...o };
    this.k = this.o.res / DH;
    this.cv = document.createElement("canvas"); this.cv.width = Math.round(DW * this.k); this.cv.height = this.o.res;
    this.g = this.cv.getContext("2d");
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(DW * UNIT, DH * UNIT); geo.translate(0, (DH / 2 - (DH - GROUND)) * UNIT, 0);
    this.root = new THREE.Group(); parent.add(this.root);
    this.plane = new THREE.Mesh(geo, this.mat); this.root.add(this.plane);
    // billboard: always turn to face the camera around the vertical axis
    const tmp = new THREE.Vector3(), q = new THREE.Quaternion();
    this.plane.onBeforeRender = (r, s, cam) => {
      if (this.lying) return;
      this.root.getWorldPosition(tmp);
      const yaw = Math.atan2(cam.position.x - tmp.x, cam.position.z - tmp.z);
      this.root.getWorldQuaternion(q); const ry = new THREE.Euler().setFromQuaternion(q, "YXZ").y;
      this.plane.rotation.set(0, yaw - ry, 0); this.plane.updateMatrixWorld(true);
    };
    const st = shadowTex();
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.6), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false, opacity: 0.5, color: 0x1a0c20 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = 0.015; this.root.add(this.blob);
    this.key = ""; this.seed = this.o.seed;
  }
  tint(c) { this.mat.color.set(c); }
  pose(p = {}) {
    const { x = 0, y = 0, z = 0, t = 0, visible = true, scale = 1, hop = 0, squash = 0, lie = false } = p;
    this.root.visible = visible; if (!visible) return;
    this.lying = lie;
    this.root.position.set(x, y + hop, z); this.root.scale.set(scale * (1 + squash * 0.5), scale * (1 - squash), scale);
    this.root.rotation.set(0, p.ry ?? 0, 0);
    if (lie) { this.plane.rotation.set(-Math.PI / 2 + (p.lieTilt ?? 0.35), 0, 0); this.plane.position.set(0, 0.3, 0); this.blob.visible = false; }
    else { this.plane.position.set(0, 0, 0); this.blob.visible = p.blob !== false; }
    const per = 2.9 + (this.seed % 5) * 0.41, ph = (t + this.seed * 0.71) % per;
    const walk = p.walk ? Math.sin(t * 10 * (p.walkRate ?? 1) + this.seed) : 0;
    const d = {
      expr: p.expr ?? "neutral", look: (p.look ?? [0, 0]).map((v) => Math.round(v * 20) / 20), blink: p.blink !== false && ph < 0.11,
      armL: Math.round((p.armL ?? 10) - walk * 35 * (p.walk || 0)), armR: Math.round((p.armR ?? 10) + walk * 35 * (p.walk || 0)), elbowL: Math.round(p.elbowL ?? 10), elbowR: Math.round(p.elbowR ?? 10),
      legs: Math.round(walk * 22 * (p.walk || 0)), lift: p.walk ? Math.round(Math.abs(Math.cos(t * 10 * (p.walkRate ?? 1) + this.seed)) * 30 * p.walk) : 0,
      bob: Math.round(Math.sin(t * 2.4 + this.seed) * 4 + (p.walk ? Math.abs(walk) * 14 : 0)), tilt: Math.round((p.headTilt ?? 0) * 2) / 2,
      sweat: p.sweat ? 1 : 0, steam: p.steam ? Math.round(t * 12) % 6 : -1, back: p.back ? 1 : 0, hold: p.holdR || "", wave: p.wave ? Math.round(Math.sin(t * 14) * 20) : 999,
    };
    const key = JSON.stringify(d);
    if (key !== this.key) { this.key = key; this.draw(d); this.tex.needsUpdate = true; }
  }
  draw(d) {
    const g = this.g, a = this.o, k = this.k, sd = this.seed;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height); g.setTransform(k, 0, 0, k, 0, 0);
    const bob = d.bob;
    // legs: two inked sticks with a knee, little black shoes
    [-1, 1].forEach((s) => {
      const hip = [C + s * 46, 640 + bob], sw = (s * d.legs * Math.PI) / 180;
      const lift = s > 0 ? d.lift : 0;
      const foot = [hip[0] + Math.sin(sw) * 300 + s * 8, GROUND - 22 - lift];
      const knee = [(hip[0] + foot[0]) / 2 + s * 6 + (lift ? 26 : 0), (hip[1] + foot[1]) / 2];
      stroke(g, [hip, knee, foot], 13, sd + s * 5);
      blob(g, ellPts(foot[0] + s * 22, foot[1] + 4, 42, 20, sd + s), a.shoe, 7, sd + s);
    });
    // body
    const bodyPts = beanPts(C, 495 + bob, 128, 168, 2.4, sd);
    blob(g, bodyPts, (gg) => {
      gg.fillStyle = css(a.shirt); gg.fillRect(0, 0, DW, DH);
      if (a.vest) { gg.fillStyle = css(a.vest); gg.beginPath(); gg.moveTo(C - 140, 300); gg.lineTo(C - 40, 360 + bob); gg.lineTo(C - 20, 700); gg.lineTo(C - 140, 700); gg.fill(); gg.beginPath(); gg.moveTo(C + 140, 300); gg.lineTo(C + 40, 360 + bob); gg.lineTo(C + 20, 700); gg.lineTo(C + 140, 700); gg.fill(); }
      if (a.pattern === "flower") { gg.fillStyle = css(a.patternC ?? 0xf2d27a); for (let i = 0; i < 22; i++) { const xx = C - 110 + ((i * 53) % 220), yy = 360 + bob + ((i * 41) % 270); for (let q = 0; q < 5; q++) { gg.beginPath(); gg.arc(xx + Math.cos(q * 1.257) * 8, yy + Math.sin(q * 1.257) * 8, 5.5, 0, 7); gg.fill(); } } }
      if (a.pattern === "stripes") { gg.fillStyle = css(a.patternC ?? 0xffffff); for (let i = 0; i < 9; i++) gg.fillRect(0, 340 + bob + i * 38, DW, 14); }
      // painted shading and a few hatch marks, as in the reference
      gg.fillStyle = "rgba(20,10,40,0.18)"; gg.beginPath(); gg.ellipse(C + 120, 540 + bob, 90, 220, 0, 0, 7); gg.fill();
      gg.fillStyle = "rgba(255,255,255,0.14)"; gg.beginPath(); gg.ellipse(C - 70, 430 + bob, 40, 80, -0.3, 0, 7); gg.fill();
      gg.strokeStyle = "rgba(20,12,10,0.35)"; gg.lineWidth = 4; gg.lineCap = "round";
      for (let i = 0; i < 5; i++) { gg.beginPath(); gg.moveTo(C + 70 + i * 9, 560 + bob + i * 6); gg.lineTo(C + 90 + i * 9, 600 + bob + i * 6); gg.stroke(); }
      if (a.collar !== false && !a.hijab) { gg.fillStyle = "#f4f1ea"; gg.beginPath(); gg.moveTo(C - 50, 330 + bob); gg.lineTo(C, 390 + bob); gg.lineTo(C + 50, 330 + bob); gg.fill(); }
      if (a.tie) { gg.fillStyle = css(a.tie); gg.beginPath(); gg.moveTo(C - 16, 350 + bob); gg.lineTo(C + 16, 350 + bob); gg.lineTo(C + 10, 430 + bob); gg.lineTo(C, 445 + bob); gg.lineTo(C - 10, 430 + bob); gg.fill(); }
      if (a.buttons) { gg.fillStyle = "#e8d9a0"; for (let i = 0; i < 3; i++) { gg.beginPath(); gg.arc(C + 6, 450 + bob + i * 55, 8, 0, 7); gg.fill(); } }
    }, 11, sd);
    // head
    g.save(); g.translate(C, 215 + bob); g.rotate((d.tilt * Math.PI) / 180);
    const R = 168;
    if (a.hijab) blob(g, [...ellPts(0, 18, R + 36, R + 40, sd + 2, 0.01, 72)], (gg) => { gg.fillStyle = css(a.hijab); gg.fillRect(-300, -300, 600, 600); gg.fillStyle = "rgba(20,10,40,.2)"; gg.beginPath(); gg.ellipse(90, 40, 110, 200, 0, 0, 7); gg.fill(); }, 11, sd + 2);
    const fr = a.hijab ? R * 0.8 : R, fy = a.hijab ? 26 : 0;
    if (d.back) {
      blob(g, circlePts(0, 0, R, sd), css(a.hijab || (a.hair === "cap" ? a.hairC : a.head)), 11, sd);
      if (!a.hijab && a.hair !== "cap") blob(g, ellPts(0, -40, R * 0.92, R * 0.75, sd + 4), a.hairC, 9, sd + 4);
    } else {
      blob(g, circlePts(0, fy, fr, sd), (gg) => { gg.fillStyle = a.head; gg.fillRect(-300, -300, 600, 600); gg.fillStyle = "rgba(60,50,90,0.13)"; gg.beginPath(); gg.arc(-30, fy - 30, fr * 1.02, 0, 7); gg.rect(-300, -300, 600, 600); gg.fill("evenodd"); }, 11, sd);
      if (!a.hijab) {
        if (a.hair === "cap") blob(g, [[-R * 0.98, -20], [-R * 0.9, -R * 0.6], [-R * 0.3, -R * 1.02], [R * 0.4, -R * 1.0], [R * 0.92, -R * 0.55], [R * 0.98, -20], [R * 0.7, -70], [R * 0.4, -95], [R * 0.1, -62], [-R * 0.2, -92], [-R * 0.55, -66], [-R * 0.8, -60]], a.hairC, 10, sd + 4);
        else if (a.hair === "tuft") [-1, 1].forEach((s) => blob(g, [[s * R * 0.98, -10], [s * R * 1.04, -70], [s * R * 0.82, -88], [s * R * 0.8, -20]], a.hairC, 8, sd + s));
      }
      g.save(); g.translate(0, fy + (a.hijab ? 8 : 0)); g.scale(a.hijab ? 0.85 : 1, a.hijab ? 0.85 : 1);
      face(g, EXPR[d.expr] || EXPR.neutral, d.look, d.blink, sd);
      g.restore();
      if (d.sweat) blob(g, [[R * 0.78, -R * 0.5], [R * 0.9, -R * 0.15], [R * 0.78, -R * 0.06], [R * 0.66, -R * 0.15]], "#8fd8f6", 7, sd + 9);
    }
    // hats
    if (a.hat === "peci") blob(g, [[-R * 0.78, -R * 0.62], [-R * 0.7, -R * 1.02], [R * 0.7, -R * 1.02], [R * 0.78, -R * 0.62]], (gg) => { gg.fillStyle = css(a.hatC); gg.fillRect(-300, -300, 600, 400); gg.fillStyle = "rgba(255,255,255,.18)"; gg.fillRect(-R * 0.6, -R * 0.98, R * 0.2, R * 0.3); }, 10, sd + 6);
    if (a.hat === "cap") { blob(g, ellPts(0, -R * 0.68, R * 0.98, R * 0.42, sd + 6), (gg) => { gg.fillStyle = css(a.hatC); gg.fillRect(-300, -300, 600, 400); gg.fillStyle = "rgba(255,255,255,.75)"; for (let i = -6; i < 7; i++) gg.fillRect(i * 28, -R * 1.2, 11, R); }, 10, sd + 6); blob(g, ellPts(R * 0.3, -R * 0.42, R * 0.62, R * 0.14, sd + 8), shade(a.hatC, 0.7), 9, sd + 8); }
    if (d.steam >= 0) [-1, 1].forEach((s) => [0, 1, 2].forEach((i) => blob(g, circlePts(s * (R + 30 + i * 22), -R * 0.7 - i * 34 - ((d.steam + i * 2) % 6) * 6, 30 - i * 4, sd + i), "#ffffff", 7, sd + i)));
    g.restore();
    // arms: inked sticks with an elbow, small white hands
    [["L", -1], ["R", 1]].forEach(([side, s]) => {
      let ang = d["arm" + side], elb = d["elbow" + side];
      if (side === "R" && d.wave !== 999) { ang = 150; elb = -15 + d.wave; }
      const sh = [C + s * 112, 390 + bob], a1 = (ang * Math.PI) / 180, a2 = ((ang - elb) * Math.PI) / 180;
      const el = [sh[0] + s * Math.sin(a1) * 130, sh[1] + Math.cos(a1) * 130], hd = [el[0] + s * Math.sin(a2) * 125, el[1] + Math.cos(a2) * 125];
      stroke(g, [sh, el, hd], 12, sd + s * 11);
      if (side === "R" && d.hold && HOLD[d.hold]) { g.save(); g.translate(hd[0], hd[1]); HOLD[d.hold](g, sd); g.restore(); }
      blob(g, circlePts(hd[0], hd[1], 21, sd + s), a.head, 7, sd + s);
    });
  }
}
export const HOLD = {
  bucket: (g, sd) => { stroke(g, [[-50, 30], [-30, -10], [30, -10], [50, 30]], 7, sd); blob(g, [[-58, 24], [58, 24], [44, 130], [-44, 130]], (gg) => { gg.fillStyle = "#2f80d0"; gg.fillRect(-80, 0, 160, 160); gg.fillStyle = "rgba(255,255,255,.3)"; gg.fillRect(-40, 30, 16, 90); }, 9, sd); },
};
let SH = null;
function shadowTex() {
  if (SH) return SH; const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 64, 0, 128, 64, 128); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.scale(1, 0.5); g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
  SH = new THREE.CanvasTexture(c); return SH;
}
