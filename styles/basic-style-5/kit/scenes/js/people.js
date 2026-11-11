// Basic style 5 villagers: 3D toy figures with a big cream sphere head and a thick black outline, a face drawn
// on the head (dot or ring eyes, pink blush, red lips, optional mustache), a black peci or a bowl haircut,
// a bean body in batik or a plain shirt with buttons, thin black stick arms and legs, small dark feet.
// Everything is a pure function of time through pose().
import * as THREE from "three";
import { M, mesh, sph, cyl, group, drawTex, clamp } from "./kit.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// Screen-constant outline (inverted hull pushed out in proportion to depth): the reference's line stays the same
// pixel width from wide shot to extreme close-up. f = line width as a share of the view height at fov 40.
const OUTLINE = new Map();
function outline(m, f = 0.007, color = 0x0b0705) {
  const k = f + "|" + color;
  if (!OUTLINE.has(k)) OUTLINE.set(k, new THREE.ShaderMaterial({
    uniforms: { w: { value: f * 0.73 }, c: { value: new THREE.Color(color) } },
    vertexShader: `uniform float w; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vec3 n=normalize(normalMatrix*normal); mv.xyz+=n*w*max(0.3,-mv.z); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 c; void main(){ gl_FragColor=vec4(c,1.); }`,
    side: THREE.BackSide, toneMapped: false,
  }));
  let g = m.geometry;
  if (!g.userData.smoothed) { const c = g.clone(); c.deleteAttribute("uv"); const mg = mergeVertices(c, 1e-3); mg.computeVertexNormals(); g.userData.smoothed = mg; }
  const o = new THREE.Mesh(g.userData.smoothed, OUTLINE.get(k)); o.userData.ink = true; o.castShadow = false; m.add(o);
  return m;
}

const HEAD_R = 0.42;
const SKIN = 0xf9e7c2;
const faceCache = new Map(), shirtCache = new Map(), emoteCache = new Map();

// ---------- face texture: canvas 1024x1024 mapped on a sphere cap (140 x 120 degrees), centre = front of the face
function drawFace(key, o) {
  if (faceCache.has(key)) return faceCache.get(key);
  const t = drawTex(1024, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.lineCap = "round"; g.lineJoin = "round";
    const ex = 190, ey = 425 + (o.eyeY ?? 0), cx = 512;
    // blush
    if (o.blush !== false) {
      g.fillStyle = "rgba(242,150,150,0.42)";
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 245, 548, 52, 33, 0, 0, 7); g.fill(); }
    }
    // brows
    const brow = o.brow || "flat";
    if (brow !== "none") {
      g.strokeStyle = "#2a1408"; g.lineWidth = 15;
      for (const s of [-1, 1]) {
        const x0 = cx + s * (ex - 62), x1 = cx + s * (ex + 58);
        let y0 = 322, y1 = 322, ym = 310;
        if (brow === "angry") { y0 = 345; y1 = 302; ym = 318; }
        if (brow === "worried") { y0 = 302; y1 = 335; ym = 310; }
        if (brow === "up") { y0 = 292; y1 = 292; ym = 274; }
        if (brow === "sly") { if (s < 0) { y0 = 335; y1 = 320; } else { y0 = 295; y1 = 310; } ym = (y0 + y1) / 2 - 10; }
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, ym, x1, y1); g.stroke();
      }
    }
    // eyes
    const eyes = o.eyes || "dot";
    for (const s of [-1, 1]) {
      const x = cx + s * ex;
      if (eyes === "dot") {
        g.fillStyle = "#120a06"; g.beginPath(); g.ellipse(x, ey, 30, 44, 0, 0, 7); g.fill();
        g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x + 9, ey - 16, 10, 0, 7); g.fill();
      } else if (eyes === "ring") {
        g.fillStyle = "#ffffff"; g.strokeStyle = "#120a06"; g.lineWidth = 11;
        g.beginPath(); g.arc(x, ey, 84, 0, 7); g.fill(); g.stroke();
        g.fillStyle = "#120a06"; g.beginPath(); g.arc(x + (o.look ?? 0) * 26, ey + 6, 32, 0, 7); g.fill();
      } else if (eyes === "happy") {
        g.strokeStyle = "#120a06"; g.lineWidth = 13;
        g.beginPath(); g.arc(x, ey + 22, 40, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
      } else if (eyes === "closed") {
        g.strokeStyle = "#120a06"; g.lineWidth = 13;
        g.beginPath(); g.moveTo(x - 30, ey + 6); g.quadraticCurveTo(x, ey + 22, x + 30, ey + 6); g.stroke();
      } else if (eyes === "side") {
        g.fillStyle = "#120a06"; g.beginPath(); g.ellipse(x + 14, ey, 24, 34, 0, 0, 7); g.fill();
        g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x + 21, ey - 12, 7, 0, 7); g.fill();
      }
    }
    // mustache: two black curls meeting under the nose
    if (o.mustache) {
      g.fillStyle = "#120a06";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(cx, 535);
        g.bezierCurveTo(cx + s * 50, 502, cx + s * 135, 506, cx + s * 168, 554);
        g.bezierCurveTo(cx + s * 176, 572, cx + s * 154, 584, cx + s * 138, 564);
        g.bezierCurveTo(cx + s * 110, 540, cx + s * 55, 556, cx, 572);
        g.closePath(); g.fill();
      }
    }
    // mouth
    const m = o.mouth || "smile";
    const my = o.mustache ? 600 : 585;
    if (m === "lips" || m === "grin") {
      // thick red lips, the reference's talking/smiling mouth
      g.fillStyle = "#7d1612"; g.strokeStyle = "#2a0806"; g.lineWidth = 8;
      g.beginPath(); g.moveTo(cx - 105, my - 8);
      g.bezierCurveTo(cx - 60, my - 34, cx - 20, my - 22, cx, my - 14);
      g.bezierCurveTo(cx + 20, my - 22, cx + 60, my - 34, cx + 105, my - 8);
      g.bezierCurveTo(cx + 70, my + (m === "grin" ? 70 : 40), cx - 70, my + (m === "grin" ? 70 : 40), cx - 105, my - 8);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#b8322a"; g.beginPath(); g.ellipse(cx, my + (m === "grin" ? 28 : 14), 52, m === "grin" ? 18 : 10, 0, 0, 7); g.fill();
    } else if (m === "smile") {
      g.strokeStyle = "#5a120e"; g.lineWidth = 12;
      g.beginPath(); g.moveTo(cx - 52, my); g.quadraticCurveTo(cx, my + 34, cx + 52, my); g.stroke();
    } else if (m === "flat") {
      g.strokeStyle = "#5a120e"; g.lineWidth = 12;
      g.beginPath(); g.moveTo(cx - 38, my + 6); g.lineTo(cx + 38, my + 6); g.stroke();
    } else if (m === "frown") {
      g.strokeStyle = "#5a120e"; g.lineWidth = 12;
      g.beginPath(); g.moveTo(cx - 45, my + 18); g.quadraticCurveTo(cx, my - 10, cx + 45, my + 18); g.stroke();
    } else if (m === "open") {
      g.fillStyle = "#5e0f0b"; g.strokeStyle = "#2a0806"; g.lineWidth = 7;
      g.beginPath(); g.ellipse(cx, my + 12, 40, 30, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#c2443a"; g.beginPath(); g.ellipse(cx, my + 26, 24, 10, 0, 0, 7); g.fill();
    } else if (m === "o") {
      g.fillStyle = "#5e0f0b"; g.beginPath(); g.ellipse(cx, my + 10, 20, 24, 0, 0, 7); g.fill();
    }
  });
  t.anisotropy = 8;
  faceCache.set(key, t);
  return t;
}

// ---------- shirt textures (lathe UV: u around, front = 0.5)
function shirtTex(kind, color) {
  const key = kind + color;
  if (shirtCache.has(key)) return shirtCache.get(key);
  const t = drawTex(1024, 512, (g, w, h) => {
    if (kind === "batik") {
      g.fillStyle = "#5a2a0c"; g.fillRect(0, 0, w, h);
      // four-petal gold flowers in a staggered grid
      const cols = 26, rows = 11;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = (c + (r % 2) * 0.5) * (w / cols), y = (r + 0.5) * (h / rows);
        g.save(); g.translate(x, y);
        g.rotate(Math.PI / 4);
        for (let k = 0; k < 4; k++) {
          g.rotate(Math.PI / 2);
          g.fillStyle = "#eaa923"; g.beginPath(); g.ellipse(0, -9.5, 6.5, 9, 0, 0, 7); g.fill();
          g.fillStyle = "#8a4c0c"; g.fillRect(-1, -14, 2, 9);
        }
        g.restore();
      }
      // placket: darker seam and gold buttons down the front
      g.fillStyle = "rgba(40,14,2,.55)"; g.fillRect(w * 0.5 - 4, 0, 8, h);
      g.fillStyle = "#f0c43a"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * 0.5, 40 + i * 70, 11, 0, 7); g.fill(); }
    } else {
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      // a soft fold shade and a row of white buttons off-centre (the reference's teal smock)
      const gr = g.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, "rgba(0,0,0,.12)"); gr.addColorStop(0.5, "rgba(255,255,255,.05)"); gr.addColorStop(1, "rgba(0,0,0,.12)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "#f4f4ee"; g.strokeStyle = "#1a2a26"; g.lineWidth = 2;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(w * 0.56, 70 + i * 80, 10, 0, 7); g.fill(); g.stroke(); }
    }
  });
  t.wrapS = THREE.RepeatWrapping;
  shirtCache.set(key, t);
  return t;
}

function emoteTex(kind) {
  if (emoteCache.has(kind)) return emoteCache.get(kind);
  const t = drawTex(256, 256, (g, w, h) => {
    if (kind === "sweat") {
      g.fillStyle = "#7cc8f2"; g.strokeStyle = "#1c3b52"; g.lineWidth = 9;
      g.beginPath(); g.moveTo(128, 30); g.bezierCurveTo(150, 80, 200, 130, 190, 170); g.arc(128, 170, 62, 0, Math.PI); g.bezierCurveTo(56, 130, 106, 80, 128, 30); g.fill(); g.stroke();
      g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(150, 175, 14, 24, -0.3, 0, 7); g.fill();
    } else if (kind === "stink") {
      g.strokeStyle = "rgba(196,150,40,.75)"; g.lineWidth = 26; g.lineCap = "round";
      for (const x of [70, 128, 186]) { g.beginPath(); g.moveTo(x, 250); g.bezierCurveTo(x - 40, 180, x + 40, 110, x - 10, 10); g.stroke(); }
    }
  });
  emoteCache.set(kind, t);
  return t;
}

// bean body profile (LatheGeometry), a little wider at the hem
function beanGeo(rad, hgt) {
  const p = [[0, 0], [0.7, 0.01], [0.93, 0.06], [1, 0.2], [0.99, 0.45], [0.95, 0.7], [0.85, 0.86], [0.6, 0.97], [0, 1]].map(([r, y]) => new THREE.Vector2(r * rad, y * hgt));
  return new THREE.LatheGeometry(p, 40);
}

function limb(parent, len, rad, mat) {
  // a pivot at the joint, the tube hanging down -Y
  const pivot = group(parent);
  const m = mesh(new THREE.CylinderGeometry(rad, rad, len, 10), mat, 0, -len / 2, 0, pivot);
  const end = group(pivot, 0, -len, 0);
  sph(rad * 1.02, mat, 0, 0, 0, end);
  return { pivot, end, mesh: m };
}

export class Villager {
  /**
   * o: { shirt: "batik" | "#0d9a86" (any colour), top: "peci" | "hair" | "none", hairColor, mustache, scale, seed }
   */
  constructor(scene, o = {}) {
    this.o = o;
    const root = (this.root = group(scene));
    const s = o.scale ?? 1;
    root.scale.setScalar(s);
    const black = M(0x0e0907, { r: 0.6 });
    // legs
    this.legs = [-1, 1].map((side) => {
      const L = limb(root, 0.74, 0.028, black);
      L.pivot.position.set(side * 0.1, 0.8, 0);
      const foot = sph(0.07, M(0x24140c, { r: 0.6 }), 0, -0.01, 0.04, L.end); foot.scale.set(0.8, 0.55, 1.35);
      return L;
    });
    // body
    const body = (this.body = group(root, 0, 0.72, 0));
    const shirt = o.shirt ?? "batik";
    const smat = new THREE.MeshStandardMaterial({ map: shirtTex(shirt === "batik" ? "batik" : "plain", shirt === "batik" ? "" : shirt), roughness: 0.85 });
    const torso = mesh(beanGeo(0.34, 0.78), smat, 0, 0, 0, body);
    torso.rotation.y = Math.PI; // texture front (u = 0.5) faces +Z
    outline(torso, 0.0045);
    // arms
    this.arms = [-1, 1].map((side) => {
      const sh = group(body, side * 0.3, 0.6, 0);
      const up = limb(sh, 0.3, 0.03, black);
      const lo = limb(up.end, 0.3, 0.03, black);
      sph(0.048, black, 0, 0, 0, lo.end);
      return { side, sh, up, lo, hand: lo.end };
    });
    // head
    const head = (this.head = group(body, 0, 0.78 + HEAD_R * 0.86, 0));
    const skin = sph(HEAD_R, new THREE.MeshStandardMaterial({ color: o.skin ?? SKIN, emissive: o.skin ?? SKIN, emissiveIntensity: 0.5, roughness: 0.95, envMapIntensity: 0.2 }), 0, 0, 0, head);
    skin.geometry = new THREE.SphereGeometry(HEAD_R, 48, 36);
    outline(skin, 0.0065);
    const span = (140 * Math.PI) / 180, tspan = (120 * Math.PI) / 180;
    this.faceMat = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, envMapIntensity: 0.2 });
    const face = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.004, 48, 36, Math.PI / 2 - span / 2, span, Math.PI / 2 - tspan / 2, tspan), this.faceMat);
    face.renderOrder = 2; head.add(face);
    this.face = face;
    const top = o.top ?? "peci";
    if (top === "peci") {
      const pc = group(head, 0, HEAD_R * 0.68, -0.01);
      pc.rotation.x = -0.12;
      const p = cyl(HEAD_R * 0.88, HEAD_R * 0.92, 0.2, M(0x23150e, { r: 0.32 }), 0, 0, 0, pc, 40);
      outline(p, 0.0055);
      // the glossy top the reference shows when the camera looks down
      const cap = mesh(new THREE.CircleGeometry(HEAD_R * 0.6, 40), M(0x4a3a30, { r: 0.25 }), 0, 0.101, 0, pc);
      cap.rotation.x = -Math.PI / 2;
    } else if (top === "hair") {
      const hr = mesh(new THREE.SphereGeometry(HEAD_R * 1.035, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), M(o.hairColor ?? 0x3a2312, { r: 0.42 }), 0, 0, 0, head);
      hr.rotation.x = -0.42; hr.position.set(0, 0.015, -0.02);
      outline(hr, 0.0055);
    }
    // emotes
    this.sweat = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: emoteTex("sweat"), transparent: true, depthWrite: false }));
    this.sweat.position.set(HEAD_R * 0.62, 0.08, HEAD_R * 0.8); head.add(this.sweat);
    this.stink = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.6), new THREE.MeshBasicMaterial({ map: emoteTex("stink"), transparent: true, depthWrite: false }));
    this.stink.position.set(-0.05, -0.32, HEAD_R + 0.15); this.stink.rotation.z = 0.5; head.add(this.stink);
    this.root.traverse((m) => { if (m.isMesh && !m.userData.ink) m.castShadow = true; });
  }

  /**
   * p: { x, y, z, ry, t, expr: {eyes, brow, mouth, look}, yaw, pitch, tilt,
   *      armL / armR: [raise, forward, elbow] in degrees (raise 0 = hanging, 90 = straight out to the side),
   *      walk (cycles per second, 0 = stand), lean, bob, sweat (0-1), stink (0-1), talk (mouth flaps 0-1) }
   */
  pose(p) {
    const t = p.t ?? 0, d2r = Math.PI / 180;
    this.root.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
    this.root.rotation.y = p.ry ?? 0;
    const walk = p.walk ?? 0, ph = t * walk * Math.PI * 2;
    const bob = (p.bob ?? 1) * (walk ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(t * 2.1 + (this.o.seed ?? 0)) * 0.006);
    this.body.position.y = 0.72 + bob;
    this.body.rotation.x = (p.lean ?? 0) * d2r;
    this.body.rotation.z = (p.tilt ?? 0) * d2r;
    this.legs[0].pivot.rotation.x = walk ? Math.sin(ph) * 0.45 : 0;
    this.legs[1].pivot.rotation.x = walk ? -Math.sin(ph) * 0.45 : 0;
    this.legs.forEach((L) => (L.pivot.position.y = 0.8 + bob));
    const arm = (A, v, swing) => {
      const [raise = 6, fwd = 0, elbow = 10] = v || [];
      A.up.pivot.rotation.set(-fwd * d2r + swing, 0, A.side * raise * d2r);
      A.lo.pivot.rotation.set(-elbow * d2r, 0, 0);
    };
    arm(this.arms[0], p.armL, walk ? -Math.sin(ph) * 0.4 : 0);
    arm(this.arms[1], p.armR, walk ? Math.sin(ph) * 0.4 : 0);
    this.head.rotation.set((p.pitch ?? 0) * d2r, (p.yaw ?? 0) * d2r, (p.headTilt ?? 0) * d2r);
    const e = { ...(p.expr || {}) };
    if (p.talk && !e.mouth?.startsWith?.("lips")) {
      const flap = Math.sin(t * 17 + (this.o.seed ?? 0)) > 0.1;
      e.mouth = flap ? (e.mouth === "smile" ? "open" : "o") : e.mouth || "smile";
    }
    const key = JSON.stringify([e, !!this.o.mustache]);
    if (this._faceKey !== key) { this.faceMat.map = drawFace(key, { ...e, mustache: this.o.mustache }); this.faceMat.needsUpdate = true; this._faceKey = key; }
    this.sweat.visible = (p.sweat ?? 0) > 0.01; this.sweat.scale.setScalar(clamp(p.sweat ?? 0)); this.sweat.position.y = 0.08 - ((t * 0.25) % 0.1);
    this.stink.visible = (p.stink ?? 0) > 0.01; this.stink.material.opacity = clamp(p.stink ?? 0) * (0.8 + 0.2 * Math.sin(t * 6));
    return this;
  }
}
