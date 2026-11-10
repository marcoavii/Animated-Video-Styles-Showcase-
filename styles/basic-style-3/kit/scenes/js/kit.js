// Shared building blocks: seeded noise, painted procedural textures, materials, ink outlines, signs, sky, sea, god rays, dust.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

export const FONT_STACK = '"Plus Jakarta Sans"';

// ---------- maths ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const sstep = (a, b, x) => smooth((x - a) / (b - a));
export const E = {
  lin: (x) => x,
  io: (x) => x * x * (3 - 2 * x),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  back: (x) => { const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
  elastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -9 * x) * Math.sin((x * 8 - 0.75) * (2 * Math.PI) / 3) + 1),
};
// keyframe track: K(t,[[t0,v0],[t1,v1,easeName],...]); values may be numbers or arrays
export function K(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, en] = keys[i];
    if (t < t1) {
      const [t0, v0] = keys[i - 1];
      const u = (E[en || "io"])((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * u) : v0 + (v1 - v0) * u;
    }
  }
  return keys[keys.length - 1][1];
}
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export const wob = (t, f = 1, phase = 0) => Math.sin(t * f * 6.283 + phase) * 0.6 + Math.sin(t * f * 2.71 * 6.283 * 0.37 + phase * 1.7) * 0.4;

// ---------- painted textures ----------
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function texOf(c, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return t;
}
function speckle(g, w, h, n, alpha, seed, lo = 0, hi = 255) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const v = lo + (hi - lo) * R();
    g.fillStyle = `rgba(${v},${v},${v},${alpha * R()})`;
    const s = 0.6 + R() * 2.4;
    g.fillRect(R() * w, R() * h, s, s);
  }
}
const texCache = new Map();
export function plasterTex(hex, seed = 3, rx = 1, ry = 1) {
  const key = `pl${hex}${seed}${rx}${ry}`; if (texCache.has(key)) return texCache.get(key);
  const c = canvas(1024, 1024), g = c.getContext("2d");
  g.fillStyle = hex; g.fillRect(0, 0, 1024, 1024);
  const R = rng(seed);
  for (let i = 0; i < 70; i++) {
    const x = R() * 1024, y = R() * 1024, r = 60 + R() * 220;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const d = R() > 0.5 ? "255,240,210" : "40,20,10";
    gr.addColorStop(0, `rgba(${d},${0.03 + R() * 0.045})`); gr.addColorStop(1, `rgba(${d},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  speckle(g, 1024, 1024, 9000, 0.05, seed + 1);
  const t = texOf(c, rx, ry); texCache.set(key, t); return t;
}
export function woodTex(hex = "#8a5a33", seed = 7, rx = 1, ry = 1, planks = 6) {
  const key = `wd${hex}${seed}${rx}${ry}${planks}`; if (texCache.has(key)) return texCache.get(key);
  const c = canvas(1024, 1024), g = c.getContext("2d");
  g.fillStyle = hex; g.fillRect(0, 0, 1024, 1024);
  const R = rng(seed);
  const ph = 1024 / planks;
  for (let p = 0; p < planks; p++) {
    const v = R() * 0.14;
    g.fillStyle = R() > 0.5 ? `rgba(255,220,170,${v})` : `rgba(30,12,4,${v})`;
    g.fillRect(0, p * ph, 1024, ph);
    for (let i = 0; i < 26; i++) {
      const y = p * ph + R() * ph;
      g.strokeStyle = `rgba(35,16,6,${0.04 + R() * 0.1})`; g.lineWidth = 0.6 + R() * 1.6;
      g.beginPath(); g.moveTo(0, y);
      const a = R() * 7, b = R() * 7;
      for (let x = 0; x <= 1024; x += 48) g.lineTo(x, y + Math.sin(x * 0.006 + a) * 3 + Math.sin(x * 0.02 + b) * 1.2);
      g.stroke();
    }
    g.fillStyle = "rgba(20,8,2,.65)"; g.fillRect(0, p * ph - 1.5, 1024, 3);
  }
  const t = texOf(c, rx, ry); texCache.set(key, t); return t;
}
export function brickTex(hex = "#a9613f", mortar = "#d8c7a6", seed = 11, rx = 1, ry = 1) {
  const key = `br${hex}${mortar}${seed}${rx}${ry}`; if (texCache.has(key)) return texCache.get(key);
  const c = canvas(1024, 1024), g = c.getContext("2d");
  g.fillStyle = mortar; g.fillRect(0, 0, 1024, 1024);
  const R = rng(seed), bh = 64, bw = 128;
  for (let y = 0; y < 16; y++) for (let x = -1; x < 9; x++) {
    const o = y % 2 ? bw / 2 : 0, l = R() * 0.22 - 0.11;
    g.fillStyle = hex; g.fillRect(x * bw + o + 3, y * bh + 3, bw - 6, bh - 6);
    g.fillStyle = l > 0 ? `rgba(255,235,205,${l})` : `rgba(25,10,4,${-l})`;
    g.fillRect(x * bw + o + 3, y * bh + 3, bw - 6, bh - 6);
  }
  speckle(g, 1024, 1024, 9000, 0.07, seed + 1);
  const t = texOf(c, rx, ry); texCache.set(key, t); return t;
}
export function tileTex(a = "#d9cdb2", b = null, seed = 13, rx = 1, ry = 1, n = 4) {
  const key = `tl${a}${b}${seed}${rx}${ry}${n}`; if (texCache.has(key)) return texCache.get(key);
  const c = canvas(1024, 1024), g = c.getContext("2d");
  const R = rng(seed), s = 1024 / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    g.fillStyle = b && (x + y) % 2 ? b : a; g.fillRect(x * s, y * s, s, s);
    g.fillStyle = `rgba(${R() > 0.5 ? "255,250,235" : "30,20,10"},${R() * 0.05})`; g.fillRect(x * s, y * s, s, s);
    g.strokeStyle = "rgba(40,28,18,.45)"; g.lineWidth = 3; g.strokeRect(x * s, y * s, s, s);
  }
  speckle(g, 1024, 1024, 5000, 0.04, seed + 1);
  const t = texOf(c, rx, ry); texCache.set(key, t); return t;
}
export function rockTex(hex = "#6d6a63", seed = 17) {
  const key = `rk${hex}${seed}`; if (texCache.has(key)) return texCache.get(key);
  const c = canvas(1024, 1024), g = c.getContext("2d");
  g.fillStyle = hex; g.fillRect(0, 0, 1024, 1024);
  const R = rng(seed);
  for (let i = 0; i < 240; i++) {
    const x = R() * 1024, y = R() * 1024, r = 20 + R() * 90;
    g.fillStyle = R() > 0.5 ? `rgba(255,245,225,${R() * 0.09})` : `rgba(10,8,6,${R() * 0.14})`;
    g.beginPath(); g.ellipse(x, y, r, r * (0.3 + R() * 0.6), R() * 3, 0, 7); g.fill();
  }
  speckle(g, 1024, 1024, 16000, 0.14, seed + 1);
  const t = texOf(c, 1, 1); texCache.set(key, t); return t;
}
export function stripeTex(a, b, n = 8, vertical = false) {
  const key = `st${a}${b}${n}${vertical}`; if (texCache.has(key)) return texCache.get(key);
  const c = canvas(256, 256), g = c.getContext("2d");
  g.fillStyle = a; g.fillRect(0, 0, 256, 256); g.fillStyle = b;
  const s = 256 / n;
  for (let i = 0; i < n; i += 2) vertical ? g.fillRect(i * s, 0, s, 256) : g.fillRect(0, i * s, 256, s);
  const t = texOf(c, 1, 1); texCache.set(key, t); return t;
}

// sign/poster: draw(ctx,w,h) on a canvas -> sRGB texture
export function drawTex(w, h, draw) {
  const c = canvas(w, h), g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
export function textLines(g, lines, w, h, opts = {}) {
  const { color = "#2a2018", weight = 800, align = "center", lh = 1.2 } = opts;
  g.fillStyle = color; g.textAlign = align; g.textBaseline = "middle";
  const total = lines.reduce((s, l) => s + (l.size || opts.size || 60) * lh, 0);
  let y = (opts.top ?? (h - total) / 2);
  for (const l of lines) {
    const size = l.size || opts.size || 60;
    g.font = `${l.weight || weight} ${size}px ${FONT_STACK}`;
    g.fillStyle = l.color || color;
    if (l.spacing !== undefined && "letterSpacing" in g) g.letterSpacing = `${l.spacing}px`; else if ("letterSpacing" in g) g.letterSpacing = "0px";
    g.fillText(l.t, align === "left" ? (opts.left ?? 40) : w / 2, y + (size * lh) / 2);
    y += size * lh;
  }
}

// ---------- materials ----------
const matCache = new Map();
export function M(color, o = {}) {
  const k = JSON.stringify([color, o.r, o.m, o.e, o.ei, o.side, o.op]);
  if (!o.map && matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.72, metalness: o.m ?? 0, map: o.map || null,
    emissive: o.e || 0x000000, emissiveIntensity: o.ei ?? 1,
    side: o.side ?? THREE.FrontSide,
    transparent: o.op !== undefined, opacity: o.op ?? 1,
    depthWrite: o.op === undefined,
  });
  if (!o.map) matCache.set(k, m);
  return m;
}
export const glow = (hex, i = 6) => {
  const c = new THREE.Color(hex).multiplyScalar(i);
  return new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
};

// ---------- geometry helpers ----------
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast ?? true; m.receiveShadow = opts.recv ?? true;
  if (parent) parent.add(m);
  return m;
}
export const box = (w, h, d, mat, x, y, z, p, o) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p, o);
export const rbox = (w, h, d, r, mat, x, y, z, p, o) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2 - 1e-3)), mat, x, y, z, p, o);
export const cyl = (rt, rb, h, mat, x, y, z, p, seg = 28, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p, o);
export const sph = (r, mat, x, y, z, p, o) => mesh(new THREE.SphereGeometry(r, 32, 24), mat, x, y, z, p, o);
export function plane(w, h, mat, x, y, z, p, rx = 0, ry = 0, o = {}) {
  const m = mesh(new THREE.PlaneGeometry(w, h), mat, x, y, z, p, { cast: false, ...o });
  m.rotation.set(rx, ry, 0);
  return m;
}
export function group(parent, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; }

// a framed picture / sign on a wall
export function poster(parent, w, h, x, y, z, ry, draw, opts = {}) {
  const gr = group(parent, x, y, z); gr.rotation.y = ry;
  const t = opts.frame ?? 0.07;
  if (t > 0) rbox(w + t * 2, h + t * 2, 0.08, 0.02, M(opts.frameColor ?? 0x4a2c17, { r: 0.5 }), 0, 0, 0, gr);
  const res = opts.res ?? 512;
  const tex = drawTex(Math.round(res * (w / h)), res, draw);
  plane(w, h, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), 0, 0, 0.045, gr);
  return gr;
}

// ---------- ink outline (inverted hull) ----------
const inkMat = (width, color) => new THREE.ShaderMaterial({
  uniforms: { w: { value: width }, c: { value: new THREE.Color(color) } },
  vertexShader: `uniform float w; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vec3 n=normalize(normalMatrix*normal); mv.xyz+=n*w*clamp(-mv.z*.11,.45,1.5); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 c; void main(){ gl_FragColor=vec4(c,1.); }`,
  side: THREE.BackSide, toneMapped: false,
});
const INK = new Map();
export function ink(m, width = 0.016, color = 0x14100c) {
  const k = `${width}|${color}`;
  if (!INK.has(k)) INK.set(k, inkMat(width, color));
  let g = m.geometry;
  if (!g.userData.smoothed) {
    const c = g.clone(); c.deleteAttribute("uv"); c.deleteAttribute("tangent");
    const merged = mergeVertices(c, 1e-3); merged.computeVertexNormals();
    merged.userData.smoothed = true; g.userData.smoothed = merged;
  }
  const o = new THREE.Mesh(g.userData.smoothed, INK.get(k));
  o.castShadow = false; o.receiveShadow = false; o.userData.ink = true;
  m.add(o);
  return m;
}
export function inkAll(root, width = 0.016, color) {
  const list = []; root.traverse((o) => { if (o.isMesh && !o.userData.ink) list.push(o); });
  list.forEach((m) => ink(m, width, color));
  return root;
}

// ---------- extruded 3D text ----------
let FONT3D = null;
export function setFont3D(f) { FONT3D = f; }
export function text3D(str, size, color, o = {}) {
  const g = new TextGeometry(str, { font: FONT3D, size, depth: o.depth ?? size * 0.32, curveSegments: 6, bevelEnabled: true, bevelThickness: size * 0.05, bevelSize: size * 0.035, bevelSegments: 3 });
  g.computeBoundingBox(); const b = g.boundingBox;
  g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2);
  const m = new THREE.Mesh(g, M(color, { r: 0.35, m: 0.05, e: o.e ?? 0x000000, ei: o.ei ?? 1 }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------- sky ----------
export function makeSky(scene, o) {
  const u = {
    top: { value: new THREE.Color(o.top) }, mid: { value: new THREE.Color(o.mid) }, hor: { value: new THREE.Color(o.hor) },
    sunDir: { value: new THREE.Vector3(...o.sunDir).normalize() }, sunCol: { value: new THREE.Color(o.sunCol ?? 0xffffff) }, sunSize: { value: o.sunSize ?? 0.998 }, sunGlow: { value: o.sunGlow ?? 0.5 },
    stars: { value: o.stars ?? 0 }, clouds: { value: o.clouds ?? 0.5 }, cloudCol: { value: new THREE.Color(o.cloudCol ?? 0xffffff) }, cloudShade: { value: new THREE.Color(o.cloudShade ?? 0x8a93a8) }, time: { value: 0 }, gain: { value: o.gain ?? 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, toneMapped: false,
    vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); vec4 p=modelViewMatrix*vec4(position,0.); p.w=1.; gl_Position=projectionMatrix*vec4(p.xyz,1.); gl_Position.z=gl_Position.w*.99999; }`,
    fragmentShader: `
      varying vec3 vD; uniform vec3 top,mid,hor,sunDir,sunCol,cloudCol,cloudShade; uniform float sunSize,sunGlow,stars,clouds,time,gain;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n(p); p=p*2.03+vec2(11.3,7.1); a*=.5; } return s; }
      void main(){
        vec3 d=normalize(vD); float y=max(d.y,0.);
        vec3 c=mix(hor,mid,smoothstep(0.,.22,y)); c=mix(c,top,smoothstep(.16,.75,y));
        float sd=max(dot(d,sunDir),0.);
        c+=sunCol*pow(sd,18.)*sunGlow*.5+sunCol*pow(sd,260.)*sunGlow;
        c+=sunCol*smoothstep(sunSize,sunSize+.0006,sd)*14.;
        if(stars>0.){ vec3 q=floor(d*420.); float s=fract(sin(dot(q,vec3(12.9,78.2,37.7)))*43758.5); float tw=.6+.4*sin(time*2.+s*90.); c+=vec3(.9,.95,1.2)*step(.9975,s)*stars*tw*smoothstep(0.02,.2,y)*3.; }
        if(clouds>0.&&d.y>0.){
          vec2 uv=d.xz/(d.y+.14)*1.5+vec2(time*.012,time*.004);
          float f=fbm(uv); float k=smoothstep(.62-clouds*.3,.86-clouds*.2,f);
          float sh=smoothstep(.45,.95,fbm(uv+sunDir.xz*.32));
          vec3 cc=mix(cloudCol,cloudShade,sh);
          c=mix(c,cc,k*smoothstep(.0,.12,d.y)*.92);
        }
        if(d.y<0.) c=hor;
        gl_FragColor=vec4(c*gain,1.);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 20), mat);
  m.frustumCulled = false; m.renderOrder = -10; scene.add(m);
  return { mesh: m, u, set: (t) => { u.time.value = t; } };
}

// ---------- sea ----------
export function makeSea(scene, o) {
  const u = {
    time: { value: 0 }, deep: { value: new THREE.Color(o.deep) }, shallow: { value: new THREE.Color(o.shallow) }, sky: { value: new THREE.Color(o.sky) }, sunDir: { value: new THREE.Vector3(...o.sunDir).normalize() }, sunCol: { value: new THREE.Color(o.sunCol ?? 0xffffff) }, glint: { value: o.glint ?? 1 }, foam: { value: new THREE.Color(o.foam ?? 0xffffff) }, chop: { value: o.chop ?? 1 }, far: { value: o.far ?? 900 }, fogCol: { value: new THREE.Color(o.fog ?? o.sky) },
    beamPos: { value: new THREE.Vector3(0, 0, 0) }, beamDir: { value: new THREE.Vector3(1, 0, 0) }, beam: { value: 0 }, beamCol: { value: new THREE.Color(0xfff0c8) },
  };
  const islands = (o.islands || []).map((v) => `min(d,length(p.xz-vec2(${v[0].toFixed(1)},${v[1].toFixed(1)}))-${v[2].toFixed(1)})`).reduce((s, e) => e.replace("min(d,", `min(${s},`), "1e5");
  const mat = new THREE.ShaderMaterial({
    uniforms: u, toneMapped: false,
    vertexShader: `
      uniform float time,chop; varying vec3 vW;
      float wave(vec2 p,vec2 d,float f,float s,float a){ return sin(dot(p,d)*f+time*s)*a; }
      void main(){
        vec4 w=modelMatrix*vec4(position,1.);
        float dist=length(w.xz-cameraPosition.xz); float atten=clamp(1.-dist/260.,0.,1.);
        w.y+=(wave(w.xz,vec2(.8,.6),.32,1.25,.14)+wave(w.xz,vec2(-.5,.86),.55,1.8,.08)+wave(w.xz,vec2(.2,-.98),1.1,2.6,.035))*chop*atten;
        vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: `
      precision highp float; varying vec3 vW;
      uniform float time,glint,chop,far,beam; uniform vec3 deep,shallow,sky,sunDir,sunCol,foam,fogCol,beamPos,beamDir,beamCol;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      const mat2 ROT=mat2(.8,.6,-.6,.8); float gFar=1.;
      float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*n(p); p=ROT*p*2.1+3.1; a*=.5; } return s; }
      float H(vec2 p){
        float t=time;
        // domain-warped swell: no two wave trains line up, so no grid appears at any distance
        vec2 w=vec2(fbm(p*.021+vec2(t*.01,0.)),fbm(p*.021+vec2(7.3,t*.012)))*34.;
        vec2 q=p+w;
        float s=sin(dot(q,vec2(.83,.55))*.29+t*1.15)*.10+sin(dot(q,vec2(-.37,.93))*.47+t*1.6)*.06+sin(dot(q,vec2(.97,-.24))*.71+t*2.1)*.035+sin(dot(q,vec2(-.72,-.69))*1.13+t*2.7)*.02;
        return s*gFar+fbm(ROT*p*.62+vec2(t*.2,-t*.15))*.2+fbm(ROT*ROT*p*1.9+vec2(-t*.4,t*.31))*.07;
      }
      void main(){
        vec3 p=vW; vec3 V=normalize(cameraPosition-p); float dist=length(cameraPosition-p);
        gFar=mix(1.,.2,smoothstep(70.,240.,dist));
        float e=max(.08,dist*.006);
        vec3 N=normalize(vec3(H(p.xz-vec2(e,0.))-H(p.xz+vec2(e,0.)),2.*e/max(chop,.15),H(p.xz-vec2(0.,e))-H(p.xz+vec2(0.,e))));
        float fr=pow(1.-max(dot(N,V),0.),4.)*.92+.04;
        vec3 c=mix(deep,shallow,smoothstep(-.1,.28,H(p.xz)));
        vec3 R=reflect(-V,N);
        vec3 refl=mix(sky*.9,sky*1.25,clamp(R.y*2.,0.,1.));
        c=mix(c,refl,fr);
        float sp=pow(max(dot(R,sunDir),0.),260.)+pow(max(dot(R,sunDir),0.),45.)*.08;
        c+=sunCol*sp*glint*2.4;
        float d=${islands};
        float fo=smoothstep(7.,0.,d)*smoothstep(.34,.72,fbm(p.xz*.55+vec2(time*.12,-time*.1))+sin(d*1.1-time*1.1)*.17);
        float caps=smoothstep(.3,.42,H(p.xz))*smoothstep(.56,.74,fbm(p.xz*.9+time*.1))*.45;
        c=mix(c,foam,clamp(fo+caps,0.,1.));
        if(beam>0.){
          vec2 toP=p.xz-beamPos.xz; float l=length(toP);
          float a=dot(normalize(toP),normalize(beamDir.xz));
          c+=beamCol*smoothstep(.97,.9995,a)*beam*clamp(1.-l/300.,0.,1.)*.1;
        }
        float fog=smoothstep(far*.22,far,dist);
        c=mix(c,fogCol,fog);
        gl_FragColor=vec4(c,1.);
      }`,
  });
  const g = new THREE.PlaneGeometry(o.size ?? 2400, o.size ?? 2400, 320, 320); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0); scene.add(m);
  return { mesh: m, u, set: (t) => { u.time.value = t; } };
}

// ---------- volumetric-looking light shaft ----------
export function shaftMat(color, strength = 1, soft = 2.2) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, s: { value: strength }, soft: { value: soft }, t: { value: 0 } },
    vertexShader: `varying vec3 vN,vV; varying vec2 vUv; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN,vV; varying vec2 vUv; uniform vec3 c; uniform float s,soft,t;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float f=pow(abs(dot(normalize(vN),normalize(vV))),soft);
        float along=pow(clamp(vUv.y,0.,1.),1.3);
        float dust=.72+.28*n(vec2(vUv.x*22.,vUv.y*7.-t*.4));
        gl_FragColor=vec4(c*s*f*along*dust,1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  });
}
// a cone from apex (top of geometry) opening along -Y by default
export function shaft(parent, rTop, rBot, len, color, strength, x, y, z, soft) {
  const g = new THREE.CylinderGeometry(rTop, rBot, len, 36, 1, true);
  const m = new THREE.Mesh(g, shaftMat(color, strength, soft));
  m.position.set(x, y, z); m.frustumCulled = false; m.renderOrder = 5;
  m.castShadow = false; m.receiveShadow = false;
  parent.add(m);
  return m;
}
// soft additive sprite (lamp halo)
let HALO = null;
export function halo(parent, size, color, x, y, z, strength = 1) {
  if (!HALO) HALO = drawTex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.32)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const c = new THREE.Color(color).multiplyScalar(strength);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO, color: c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
  s.scale.set(size, size, 1); s.position.set(x, y, z); parent.add(s);
  return s;
}
let DUST_TEX = null;
// floating dust: deterministic drift from time
export function dust(parent, n, bx, by, bz, cx, cy, cz, color = 0xffe8c0, size = 0.03, seed = 5) {
  const R = rng(seed); const base = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i += 3) { base[i] = (R() - 0.5) * bx + cx; base[i + 1] = (R() - 0.5) * by + cy; base[i + 2] = (R() - 0.5) * bz + cz; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(base), 3));
  // round, soft motes: a bare point draws as a square, which shows when one drifts close to the lens
  if (!DUST_TEX) DUST_TEX = drawTex(64, 64, (ctx) => { const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64); });
  const m = new THREE.PointsMaterial({ color, size: size * 1.6, map: DUST_TEX, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, sizeAttenuation: true });
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <fog_vertex>", "#include <fog_vertex>\n  gl_PointSize = min(gl_PointSize, 16.0);"); };
  const p = new THREE.Points(g, m); p.frustumCulled = false; parent.add(p);
  return { points: p, set(t) { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { const j = i * 3, f = i * 0.37; a[j] = base[j] + Math.sin(t * 0.21 + f) * 0.24; a[j + 1] = base[j + 1] + Math.sin(t * 0.13 + f * 2.1) * 0.18; a[j + 2] = base[j + 2] + Math.cos(t * 0.17 + f) * 0.24; } g.attributes.position.needsUpdate = true; } };
}

// environment for reflections: quick gradient room
export function gradientEnv(renderer, top, mid, low) {
  const s = new THREE.Scene();
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(mid) }, c: { value: new THREE.Color(low) } }, vertexShader: `varying vec3 v; void main(){ v=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);} `, fragmentShader: `varying vec3 v; uniform vec3 a,b,c; void main(){ float y=v.y; vec3 k=y>0.?mix(b,a,smoothstep(0.,.8,y)):mix(b,c,smoothstep(0.,.6,-y)); gl_FragColor=vec4(k,1.);} ` });
  s.add(new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), m));
  const p = new THREE.PMREMGenerator(renderer); const rt = p.fromScene(s, 0.02); p.dispose();
  return rt.texture;
}
export function spot(parent, color, intensity, x, y, z, tx, ty, tz, angle, pen = 0.6, shadowSize = 2048) {
  const l = new THREE.SpotLight(color, intensity, 0, angle, pen, 1.6);
  l.position.set(x, y, z); l.target.position.set(tx, ty, tz);
  if (shadowSize) { l.castShadow = true; l.shadow.mapSize.set(shadowSize, shadowSize); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; l.shadow.radius = 5; l.shadow.camera.near = 0.5; l.shadow.camera.far = 80; }
  parent.add(l, l.target);
  return l;
}
export function sun(parent, color, intensity, x, y, z, tx, ty, tz, span = 14, shadowSize = 4096) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(x, y, z); l.target.position.set(tx, ty, tz);
  l.castShadow = true; l.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(l.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 400 });
  l.shadow.bias = -0.0003; l.shadow.normalBias = 0.025; l.shadow.radius = 4;
  parent.add(l, l.target);
  return l;
}
export function lamp(parent, color, intensity, x, y, z, dist = 12) {
  const l = new THREE.PointLight(color, intensity, dist, 1.8); l.position.set(x, y, z); parent.add(l); return l;
}
