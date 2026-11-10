// Bean-body character: big round head, ringed eyes that move, stick limbs with 2-bone IK, ink outline, expression table.
import * as THREE from "three";
import { M, mesh, sph, cyl, rbox, box, group, ink, inkAll, clamp, lerp, rng, E, stripeTex } from "./kit.js";

const INKC = 0x14100c;
const HEAD_R = 0.56;

// project a flat shape onto the head sphere so features hug the surface
function onSphere(geo, r, zOffset = 0.004) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const zz = Math.sqrt(Math.max(0.0001, r * r - x * x - y * y));
    p.setZ(i, zz + zOffset);
  }
  geo.computeVertexNormals();
  return geo;
}
function arcTube(points, radius, mat, r = HEAD_R) {
  const pts = points.map(([x, y]) => new THREE.Vector3(x, y, Math.sqrt(Math.max(0.001, r * r - x * x - y * y)) + 0.006));
  const c = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, 22, radius, 8, false), mat);
  // round caps
  [pts[0], pts[pts.length - 1]].forEach((q) => { const s = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), mat); s.position.copy(q); m.add(s); });
  return m;
}
function mouthFilled(outline, color, r = HEAD_R, z = 0.008) {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.Mesh(onSphere(new THREE.ShapeGeometry(s, 24), r, z), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
}
function ellipsePts(cx, cy, rx, ry, n = 30, a0 = 0, a1 = Math.PI * 2) {
  const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o;
}

const MOUTHS = {
  line: () => arcTube([[-0.1, -0.2], [0, -0.205], [0.1, -0.2]], 0.014, M(INKC, { r: 0.6 })),
  smile: () => arcTube([[-0.17, -0.15], [-0.09, -0.22], [0, -0.245], [0.09, -0.22], [0.17, -0.15]], 0.015, M(INKC, { r: 0.6 })),
  smirk: () => arcTube([[-0.1, -0.23], [0.02, -0.235], [0.12, -0.2], [0.2, -0.13]], 0.015, M(INKC, { r: 0.6 })),
  frown: () => arcTube([[-0.13, -0.26], [-0.05, -0.215], [0.05, -0.215], [0.13, -0.26]], 0.015, M(INKC, { r: 0.6 })),
  wavy: () => arcTube([[-0.16, -0.22], [-0.08, -0.25], [0, -0.215], [0.08, -0.25], [0.16, -0.22]], 0.014, M(INKC, { r: 0.6 })),
  o: () => { const g = group(); const m = mouthFilled(ellipsePts(0, -0.235, 0.07, 0.09), 0x3a0c10); g.add(m); g.add(arcTube(ellipsePts(0, -0.235, 0.07, 0.09, 24), 0.012, M(INKC))); return g; },
  open: () => {
    const g = group();
    const pts = [...ellipsePts(0, -0.14, 0.2, 0.2, 24, Math.PI, Math.PI * 2)];
    g.add(mouthFilled(pts, 0x4a0e14));
    g.add(mouthFilled(ellipsePts(0, -0.3, 0.085, 0.05), 0xd8474f, HEAD_R, 0.012));
    const top = arcTube(pts.concat([pts[0]]), 0.013, M(INKC)); g.add(top);
    return g;
  },
  laugh: () => {
    const g = group();
    const pts = [...ellipsePts(0, -0.1, 0.27, 0.27, 28, Math.PI, Math.PI * 2)];
    g.add(mouthFilled(pts, 0x4a0e14));
    g.add(mouthFilled(ellipsePts(0, -0.315, 0.11, 0.055), 0xe0525a, HEAD_R, 0.012));
    const teeth = [[-0.22, -0.105], [0.22, -0.105], [0.2, -0.155], [-0.2, -0.155]];
    g.add(mouthFilled(teeth, 0xfff8ec, HEAD_R, 0.012));
    g.add(arcTube(pts.concat([pts[0]]), 0.014, M(INKC)));
    return g;
  },
  grin: () => {
    const g = group();
    const pts = [...ellipsePts(0, -0.13, 0.22, 0.14, 24, Math.PI, Math.PI * 2)];
    g.add(mouthFilled(pts, 0xfff8ec));
    g.add(arcTube(pts.concat([pts[0]]), 0.013, M(INKC)));
    return g;
  },
};

// expression presets: lid (0 open .. 1 shut), browY, browA (inner rotation), browLift (per side), mouth, pupil scale, arcs (closed happy eyes)
export const EXPR = {
  neutral: { lid: 0.08, by: 0.0, ba: 0, m: "line", ps: 1 },
  bored: { lid: 0.52, by: -0.025, ba: -0.06, m: "line", ps: 0.95 },
  happy: { lid: 0.02, by: 0.035, ba: -0.1, m: "smile", ps: 1.05 },
  joy: { arcs: 1, by: 0.05, ba: -0.14, m: "open", ps: 1 },
  bliss: { arcs: 1, by: 0.04, ba: -0.12, m: "smile", ps: 1 },
  beg: { lid: 0, by: 0.05, ba: 0.42, m: "wavy", ps: 1.3 },
  laugh: { arcs: 1, by: 0.06, ba: -0.2, m: "laugh", ps: 1 },
  shock: { lid: 0, by: 0.08, ba: 0.1, m: "o", ps: 0.55 },
  worried: { lid: 0, by: 0.04, ba: 0.35, m: "frown", ps: 0.85 },
  angry: { lid: 0.24, by: -0.04, ba: -0.46, m: "frown", ps: 0.85 },
  smirk: { lid: 0.38, by: -0.01, ba: -0.14, m: "smirk", ps: 0.9, browUp: 1 },
  sly: { lid: 0.46, by: -0.02, ba: -0.32, m: "grin", ps: 0.85 },
  shrug: { lid: 0.42, by: 0.05, ba: 0.16, m: "line", ps: 0.95 },
  squint: { lid: 0.62, by: -0.04, ba: -0.2, m: "line", ps: 0.9 },
  star: { lid: 0, by: 0.07, ba: -0.1, m: "laugh", ps: 1.4 },
  sad: { lid: 0.3, by: 0.0, ba: 0.42, m: "frown", ps: 1 },
};

function limb(parent, rad, mat) {
  const up = mesh(new THREE.CylinderGeometry(rad, rad, 1, 10), mat, 0, 0, 0, parent);
  const lo = mesh(new THREE.CylinderGeometry(rad, rad, 1, 10), mat, 0, 0, 0, parent);
  const j = sph(rad * 1.02, mat, 0, 0, 0, parent);
  return { up, lo, j };
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
function placeSeg(m, p0, p1) {
  _a.copy(p1).sub(p0); const len = Math.max(_a.length(), 1e-3);
  m.position.copy(p0).addScaledVector(_a, 0.5);
  m.scale.set(1, len, 1);
  m.quaternion.setFromUnitVectors(UP, _a.normalize());
}
const _s = new THREE.Vector3(), _t = new THREE.Vector3(), _e = new THREE.Vector3(), _d = new THREE.Vector3();
function solve(l, start, target, l1, l2, pole) {
  _s.copy(start); _t.copy(target);
  _d.copy(_t).sub(_s); let dist = _d.length();
  const maxD = (l1 + l2) * 0.999;
  if (dist > maxD) { _d.multiplyScalar(maxD / dist); _t.copy(_s).add(_d); dist = maxD; }
  _d.normalize();
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * Math.max(dist, 1e-4));
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  _e.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize();
  const elbow = _s.clone().addScaledVector(_d, a).addScaledVector(_e, h);
  placeSeg(l.up, _s, elbow); placeSeg(l.lo, elbow, _t); l.j.position.copy(elbow);
  return _t;
}

export class Actor {
  constructor(parent, o = {}) {
    const a = (this.o = { skin: 0xe6b98f, top: 0x35573f, bottom: 0x2a2a2e, limb: null, hair: 0x4a2c17, hat: null, beard: false, moustache: false, glasses: false, tie: null, stripes: null, seed: 1, scale: 1, longBody: 1, hairStyle: "cap", collar: 0xf4efe2, ...o });
    this.root = group(parent);
    this.body = group(this.root, 0, 0, 0);
    this.seed = a.seed; this.R = rng(a.seed);
    const skin = M(a.skin, { r: 0.55 });
    const shirtMat = a.stripes ? new THREE.MeshStandardMaterial({ map: stripeTex(a.stripes[0], a.stripes[1], 12), roughness: 0.75 }) : M(a.top, { r: 0.7 });
    const limbMat = M(a.limb ?? a.top, { r: 0.65 });
    this.limbMat = limbMat;

    // torso: bean profile
    const pts = [];
    const H = 1.05 * a.longBody, W = 0.42;
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const r = W * (Math.pow(Math.sin(Math.min(1, u * 1.04) * Math.PI), 0.42) * (0.88 + 0.14 * (1 - u)));
      pts.push(new THREE.Vector2(Math.max(0.0005, r), u * H));
    }
    this.torso = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), shirtMat);
    this.torso.castShadow = true; this.torso.receiveShadow = true;
    this.hip = 0.58; this.torso.position.y = this.hip - 0.05; this.body.add(this.torso);
    ink(this.torso, 0.016, INKC);
    // lower body cap in trousers colour
    const low = pts.slice(0, 8).map((p) => new THREE.Vector2(p.x + 0.003, p.y));
    const lm = new THREE.Mesh(new THREE.LatheGeometry(low, 40), M(a.bottom, { r: 0.7 })); lm.position.copy(this.torso.position); lm.castShadow = true; this.body.add(lm);
    this.torsoTop = this.hip - 0.05 + H;

    // head
    this.neck = group(this.body, 0, this.torsoTop - 0.14 + 0.4, 0);
    this.head = group(this.neck, 0, 0, 0);
    const hm = mesh(new THREE.SphereGeometry(HEAD_R, 48, 36), skin, 0, 0, 0, this.head); ink(hm, 0.018, INKC);
    this.headMesh = hm;

    // eyes
    this.eyes = [-1, 1].map((sx) => {
      const g = group(this.head, sx * 0.168, 0.055, 0);
      const z = Math.sqrt(Math.max(0.01, HEAD_R * HEAD_R - 0.205 * 0.205 - 0.075 * 0.075));
      g.position.z = z - 0.025;
      g.rotation.y = sx * Math.asin(0.168 / HEAD_R) * 0.8;
      g.rotation.x = -Math.asin(0.055 / HEAD_R) * 0.8;
      const white = sph(0.15, M(0xfdfbf4, { r: 0.22 }), 0, 0, 0, g, { cast: false }); white.scale.z = 0.5;
      const ring = mesh(new THREE.TorusGeometry(0.151, 0.019, 10, 40), M(INKC, { r: 0.5 }), 0, 0, 0.012, g, { cast: false });
      const pup = group(g, 0, 0, 0.082);
      const p = sph(0.07, M(0x0d0b09, { r: 0.18 }), 0, 0, 0, pup, { cast: false }); p.scale.z = 0.35;
      const h1 = sph(0.024, new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3), toneMapped: false }), 0.028, 0.034, 0.024, pup, { cast: false });
      const lid = mesh(new THREE.SphereGeometry(0.161, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), skin, 0, 0, 0, g, { cast: false });
      lid.scale.z = 0.86;
      const lidEdge = mesh(new THREE.TorusGeometry(0.155, 0.013, 8, 36, Math.PI), M(INKC), 0, 0, 0, g, { cast: false });
      lidEdge.rotation.x = Math.PI / 2; lidEdge.scale.set(1, 0.86, 1);
      const lidRot = group(g, 0, 0, 0); lidRot.add(lid); lidRot.add(lidEdge);
      const arc = arcTubeLocal();
      arc.position.z = 0.09; g.add(arc);
      return { g, white, ring, pup, lid, lidRot, lidEdge, arc, p, sx };
    });

    // brows
    this.brows = [-1, 1].map((sx) => {
      const b = group(this.head, sx * 0.21, 0.28, 0);
      b.position.z = Math.sqrt(Math.max(0.01, HEAD_R * HEAD_R - 0.21 * 0.21 - 0.28 * 0.28)) + 0.005;
      const g = new THREE.CapsuleGeometry(0.027, 0.17, 4, 10); g.rotateZ(Math.PI / 2);
      const m = mesh(g, M(a.browColor ?? (a.hair === null ? 0x2b1a10 : a.hair), { r: 0.6 }), 0, 0, 0, b, { cast: false });
      b.rotation.y = sx * 0.34;
      return { b, sx, m };
    });

    // mouth set
    this.mouths = {};
    for (const k in MOUTHS) { const m = MOUTHS[k](); m.visible = false; this.head.add(m); m.traverse((o) => { if (o.isMesh) { o.castShadow = false; } }); this.mouths[k] = m; }

    // hair / hats
    if (a.hairStyle === "cap" && a.hair !== null) {
      const cap = mesh(new THREE.SphereGeometry(HEAD_R + 0.012, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), M(a.hair, { r: 0.6 }), 0, 0, -0.01, this.head);
      cap.rotation.x = -0.32; ink(cap, 0.016, INKC);
    } else if (a.hairStyle === "bob") {
      const cap = mesh(new THREE.SphereGeometry(HEAD_R + 0.02, 40, 22, 0, Math.PI * 2, 0, Math.PI * 0.6), M(a.hair, { r: 0.55 }), 0, 0, -0.03, this.head);
      cap.rotation.x = -0.6; ink(cap, 0.016, INKC);
    } else if (a.hairStyle === "bald") {
      [-1, 1].forEach((s) => { const t = mesh(new THREE.SphereGeometry(0.14, 16, 12), M(a.hair, { r: 0.7 }), s * 0.5, 0.05, -0.1, this.head); t.scale.set(0.5, 0.9, 1.1); ink(t, 0.014, INKC); });
    }
    if (a.hat === "officer") this._officerHat(a.hatColor ?? 0x1f2d24);
    if (a.hat === "beanie") this._beanie(a.hatColor ?? 0xb23a2e);
    if (a.hat === "fisher") this._bucket(a.hatColor ?? 0xd7a94a);
    if (a.hat === "harbor") this._officerHat(a.hatColor ?? 0xf1ece0, 0x1b2230);
    if (a.beard) {
      const b = mesh(new THREE.SphereGeometry(HEAD_R + 0.03, 44, 22, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), M(a.beardColor ?? 0xe9e4d8, { r: 0.95 }), 0, 0.0, 0.02, this.head);
      b.rotation.x = 0.24; ink(b, 0.016, INKC); // tilted so the front rim sits just below the mouth
      this.beard = b;
      // mouth sits in beard, so nudge mouths forward
      for (const k in this.mouths) { this.mouths[k].position.z = 0.04; this.mouths[k].position.y = -0.012; }
      // sideburns
    }
    if (a.moustache) {
      const mat = M(a.moustacheColor ?? 0x241812, { r: 0.8 });
      const ms = group(this.head, 0, -0.1, Math.sqrt(HEAD_R * HEAD_R - 0.01) + 0.012);
      [-1, 1].forEach((s) => {
        const g = new THREE.CapsuleGeometry(0.046, 0.15, 4, 12); g.rotateZ(Math.PI / 2);
        const lobe = mesh(g, mat, s * 0.095, -0.012, -0.012, ms, { cast: false });
        lobe.rotation.z = s * -0.3; lobe.rotation.y = s * 0.28; ink(lobe, 0.01, INKC);
      });
      this.moustache = ms;
    }
    if (a.glasses) {
      [-1, 1].forEach((s) => {
        const r = mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 36), M(0x2a2622, { r: 0.3, m: 0.5 }), s * 0.205, 0.075, Math.sqrt(HEAD_R * HEAD_R - 0.205 * 0.205 - 0.075 * 0.075) + 0.075, this.head, { cast: false });
      });
    }

    // shirt details
    if (a.collar !== null && a.collar !== undefined) {
      const c = mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 26), M(a.collar, { r: 0.7 }), 0, this.torsoTop - 0.1, 0, this.body, { cast: false });
      c.rotation.x = Math.PI / 2; c.scale.set(1.15, 1.15, 0.8);
    }
    if (a.tie) {
      const y = this.torsoTop - 0.18;
      const t = new THREE.Shape([[0, 0], [0.05, -0.04], [0.035, -0.32], [0, -0.4], [-0.035, -0.32], [-0.05, -0.04]].map(([x, y]) => new THREE.Vector2(x, y)));
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(t, { depth: 0.012, bevelEnabled: false }), M(a.tie, { r: 0.45 }));
      m.position.set(0, y, 0.385); m.rotation.x = -0.14; this.body.add(m);
    }
    (a.details || []).forEach((fn) => fn(this));

    // limbs
    const armR = a.armRadius ?? 0.033, legR = a.legRadius ?? 0.04;
    this.arms = [-1, 1].map((sx) => {
      const l = limb(this.body, armR, limbMat);
      l.up.material = l.lo.material = l.j.material = M(a.sleeve ?? a.top, { r: 0.7 });
      const hand = sph(0.078, a.glove ? M(a.glove, { r: 0.6 }) : skin, 0, 0, 0, this.body);
      inkAll(group(), 0.01);
      ink(hand, 0.012, INKC); ink(l.up, 0.012, INKC); ink(l.lo, 0.012, INKC);
      return { l, hand, sx, tgt: new THREE.Vector3(sx * 0.52, 0.55, 0.06) };
    });
    this.legs = [-1, 1].map((sx) => {
      const l = limb(this.root, legR, M(a.bottom, { r: 0.7 }));
      const foot = sph(0.1, M(a.shoe ?? 0x1c1a18, { r: 0.45 }), 0, 0.075, 0.03, this.root); foot.scale.set(0.95, 0.72, 1.35);
      ink(foot, 0.012, INKC); ink(l.up, 0.012, INKC); ink(l.lo, 0.012, INKC);
      return { l, foot, sx };
    });
    this.pose({});
    this.root.scale.setScalar(a.scale);
  }
  _officerHat(col, band = 0x101410) {
    const g = group(this.head, 0, 0.36, -0.02); g.rotation.x = -0.08;
    const top = mesh(new THREE.CylinderGeometry(0.58, 0.46, 0.2, 40), M(col, { r: 0.6 }), 0, 0.12, 0, g); top.scale.z = 0.92; ink(top, 0.016, INKC);
    const bd = mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.11, 40), M(band, { r: 0.5 }), 0, 0, 0, g); ink(bd, 0.012, INKC);
    const vis = mesh(new THREE.SphereGeometry(0.5, 32, 12, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.46, Math.PI * 0.1), M(0x0e0f10, { r: 0.22, m: 0.2, side: THREE.DoubleSide }), 0, 0.03, 0.07, g);
    vis.rotation.y = Math.PI / 2; vis.rotation.y = 0;
    vis.scale.set(1.02, 0.6, 1.25);
    const pin = sph(0.044, M(0xd8ae4c, { r: 0.28, m: 0.8 }), 0, 0.12, 0.515, g, { cast: false }); pin.scale.z = 0.5;
    return g;
  }
  _beanie(col) {
    const g = group(this.head, 0, 0, 0);
    const b = mesh(new THREE.SphereGeometry(HEAD_R + 0.03, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.34), M(col, { r: 0.9 }), 0, 0.03, -0.02, g); b.rotation.x = -0.3; ink(b, 0.016, INKC);
    const r = mesh(new THREE.TorusGeometry(0.49, 0.062, 12, 42), M(new THREE.Color(col).multiplyScalar(0.72).getHex(), { r: 0.9 }), 0, 0.26, -0.11, g);
    r.rotation.x = Math.PI / 2 - 0.22; ink(r, 0.012, INKC);
    return g;
  }
  _bucket(col) {
    const g = group(this.head, 0, 0.36, -0.02);
    const t = mesh(new THREE.CylinderGeometry(0.34, 0.46, 0.3, 32), M(col, { r: 0.9 }), 0, 0.14, 0, g); ink(t, 0.014, INKC);
    const b = mesh(new THREE.CylinderGeometry(0.46, 0.7, 0.07, 36), M(col, { r: 0.9 }), 0, -0.02, 0, g); ink(b, 0.014, INKC);
    return g;
  }

  // pose: pure function of parameters. hands in body-local space.
  pose(p) {
    const { x = 0, y = 0, z = 0, ry = 0, lean = 0, tilt = 0, squash = 0, armL = null, armR = null, headRx = 0, headRy = 0, headRz = 0, expr = "neutral", look = [0, 0], lid = null, t = 0, hop = 0, walk = 0, kneel = 0, visible = true, mouthScale = 1, blink = true } = p;
    this.root.visible = visible;
    if (!visible) return;
    this.root.position.set(x, y + Math.max(0, hop), z);
    this.root.rotation.y = ry;
    const sq = squash; const sy = 1 - sq, sxz = 1 + sq * 0.6;
    this.body.scale.set(sxz, sy, sxz);
    this.body.rotation.set(lean, 0, tilt);
    const breath = Math.sin(t * 2.1 + this.seed) * 0.012;
    this.body.position.y = breath - kneel * 0.42;
    this.neck.position.y = this.torsoTop - 0.14 + 0.4 + breath * 0.4;
    this.head.rotation.set(headRx, headRy, headRz);

    // expression
    const ex = EXPR[expr] || EXPR.neutral;
    for (const k in this.mouths) this.mouths[k].visible = k === ex.m;
    const mo = this.mouths[ex.m]; if (mo) mo.scale.setScalar(1);
    const lidBase = lid !== null ? lid : ex.lid ?? 0;
    let bl = 0;
    if (blink) {
      const per = 2.8 + (this.seed % 5) * 0.47; const ph = (t + this.seed * 0.73) % per;
      bl = ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0;
    }
    const L = clamp(Math.max(lidBase, bl));
    this.eyes.forEach((e) => {
      const arcs = !!ex.arcs;
      e.white.visible = !arcs; e.ring.visible = !arcs; e.pup.visible = !arcs; e.lidRot.visible = !arcs;
      e.arc.visible = arcs;
      e.pup.position.x = clamp(look[0], -1, 1) * 0.078;
      e.pup.position.y = clamp(look[1], -1, 1) * 0.078;
      const ps = ex.ps ?? 1; e.pup.scale.set(ps, ps, 1);
      e.lidRot.rotation.x = -1.35 + 2.5 * L; // 0 open, .5 half-lidded, 1 shut
      if (L > 0.82) e.pup.visible = false;
    });
    this.brows.forEach((b, i) => {
      const up = ex.browUp && b.sx > 0 ? 0.07 : 0;
      b.b.position.y = 0.28 + (ex.by ?? 0) + up;
      b.b.rotation.z = -b.sx * (ex.ba ?? 0);
    });

    // arms
    this.body.updateMatrix();
    const shoulderY = this.torsoTop - 0.28;
    const shoulderX = 0.34;
    this.arms.forEach((a) => {
      const dflt = [a.sx * 0.55, shoulderY - 0.62 + Math.sin(t * 2.1 + a.sx) * 0.012, 0.03];
      const tp = (a.sx < 0 ? armL : armR) || dflt;
      a.tgt.set(tp[0], tp[1], tp[2]);
      const s = new THREE.Vector3(a.sx * shoulderX, shoulderY, 0);
      const pole = new THREE.Vector3(a.sx * 0.45, -1, -0.25);
      const end = solve(a.l, s, a.tgt, 0.42, 0.42, pole);
      a.hand.position.copy(end);
    });

    // legs (root space)
    const stride = walk;
    this.legs.forEach((l, i) => {
      const hipP = new THREE.Vector3(l.sx * 0.16, this.hip + this.body.position.y + 0.08, 0);
      const ph = t * 8.5 + (i ? Math.PI : 0);
      const fz = stride ? Math.sin(ph) * 0.26 * stride : 0;
      const fy = stride ? Math.max(0, Math.cos(ph)) * 0.13 * stride : 0;
      const ft = new THREE.Vector3(l.sx * (0.2 + kneel * 0.02), 0.09 + fy, fz + kneel * -0.26);
      const end = solve(l.l, hipP, ft, 0.4, 0.4, new THREE.Vector3(0, 0, 1));
      l.foot.position.set(end.x, end.y - 0.015, end.z + 0.03);
    });
  }
}

function arcTubeLocal() {
  const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (0.14 + 0.72 * (i / 14)); pts.push(new THREE.Vector3(Math.cos(a) * 0.145, Math.sin(a) * 0.145 - 0.07, 0)); }
  const c = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, 22, 0.021, 8, false), M(INKC));
  m.castShadow = false; m.visible = false;
  return m;
}

// Convenience poses in body-local coordinates
const SH = 1.48;
export const ARM = {
  downL: null, downR: null,
  clasp: [[-0.11, 1.46, 0.5], [0.11, 1.46, 0.5]],
  up: [[-0.6, 2.05, 0.1], [0.6, 2.05, 0.1]],
  shrug: [[-0.72, 1.18, 0.18], [0.72, 1.18, 0.18]],
  hip: [[-0.42, 0.8, 0.12], [0.42, 0.8, 0.12]],
  belly: [[-0.2, 0.88, 0.42], [0.2, 0.88, 0.42]],
  behindHead: [[-0.5, 2.0, -0.22], [0.5, 2.0, -0.22]],
};
