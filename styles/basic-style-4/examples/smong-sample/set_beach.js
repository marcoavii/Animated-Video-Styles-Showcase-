// Simeulue beach, 26 Dec 2004 morning: village, palms, hill with a meunasah, reef that the sea uncovers, and the wave.
import * as THREE from "three";
import { M, box, rbox, cyl, sph, plane, group, mesh, makeSky, makeSea, sun, gradientEnv, dust, drawTex, rng, ink, inkAll, halo, clamp, K, wob } from "./kit.js";
import { makePalm, makeHouse, makeBoat, makeFish, rockLump, coral } from "./props.js";

const DAY = { top: 0x2477c0, mid: 0x76b8e4, hor: 0xd4ecf2, sunDir: [0.45, 0.8, 0.4], sunCol: 0xfff4dc, sunGlow: 0.5, clouds: 0.58, cloudCol: 0xffffff, cloudShade: 0x9fb4cc, deep: 0x0d5c7c, shallow: 0x2aa6b4, sky: 0xbfe2ee, fog: 0xd4ecf2, glint: 1.1, foam: 0xf4fbfb, gain: 1.05, chop: 0.9 };

// one height function for sand, reef, beach and hill: shot code places people and props with it
export function groundY(x, z) {
  const n = Math.sin(x * 0.11 + z * 0.05) * 0.12 + Math.sin(x * 0.37 - z * 0.21) * 0.05;
  if (z < 0) return z * 0.036 + n * clamp(-z / 6) + Math.sin(x * 0.9) * Math.sin(z * 0.7) * 0.04 * clamp(-z / 8);
  let y = Math.min(z, 30) * 0.028 + n * clamp(z / 20) * 0.6;
  if (z > 30) y += (z - 30) * (z - 30) * 0.0042 + Math.sin(x * 0.07) * 0.8 * clamp((z - 30) / 20);
  return y;
}
// the sea level over the film: calm, then it drains away in about a second
export const seaY = (t) => K(t, [[5.5, 0], [6.75, -2.35, "io"]]);
const shoreZ = (y) => (y < 0 ? y / 0.036 : y / 0.028);
// path from the beach up to the meunasah
export const pathAt = (p) => [4 + 6 * p + 3 * Math.sin(p * 6), 22 + 80 * p];

function groundTex() {
  const W = 2048, H = 2048;
  const px = (x) => ((x + 180) / 360) * W, pz = (z) => ((z + 230) / 360) * H;
  return drawTex(W, H, (g) => {
    const R = rng(77);
    // bands by distance from the shore
    const grd = g.createLinearGradient(0, pz(-230), 0, pz(130));
    const stop = (z, c) => grd.addColorStop((z + 230) / 360, c);
    stop(-230, "#5f5848"); stop(-80, "#6f6452"); stop(-30, "#8a7a5c"); stop(-6, "#9a8a68"); stop(-0.5, "#a89670"); stop(0.5, "#d9c494"); stop(3, "#e6d3a3"); stop(22, "#e9d7a8"); stop(27, "#a8a868"); stop(31, "#6a9442"); stop(130, "#4e7a34");
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // reef: rock flats, coral, algae, tide pools
    for (let i = 0; i < 900; i++) {
      const x = (R() - 0.5) * 200, z = -4 - Math.pow(R(), 0.8) * 90, r = 0.6 + R() * 3.2;
      const k = R();
      g.fillStyle = k < 0.45 ? `rgba(92,86,74,${0.35 + R() * 0.3})` : k < 0.65 ? `rgba(98,122,58,${0.3 + R() * 0.3})` : k < 0.8 ? `rgba(200,110,110,${0.25 + R() * 0.25})` : k < 0.9 ? `rgba(220,150,70,${0.25 + R() * 0.25})` : `rgba(80,150,170,${0.5 + R() * 0.3})`;
      g.beginPath(); g.ellipse(px(x), pz(z), (r / 360) * W, (r * (0.5 + R() * 0.6) / 360) * H, R() * 3, 0, 7); g.fill();
    }
    // ripples in the wet sand
    g.strokeStyle = "rgba(60,48,30,.18)"; g.lineWidth = 2;
    for (let i = 0; i < 260; i++) { const z = -R() * 40, x = (R() - 0.5) * 160; g.beginPath(); g.moveTo(px(x), pz(z)); g.quadraticCurveTo(px(x + 2), pz(z + 0.4), px(x + 4), pz(z)); g.stroke(); }
    // dry sand speckle and grass tufts
    for (let i = 0; i < 26000; i++) { const x = (R() - 0.5) * 360, z = -230 + R() * 360; const v = R() > 0.5 ? 255 : 30; g.fillStyle = `rgba(${v},${v},${v},${R() * 0.07})`; g.fillRect(px(x), pz(z), 2, 2); }
    for (let i = 0; i < 5000; i++) { const x = (R() - 0.5) * 360, z = 28 + R() * 100; g.fillStyle = `rgba(${30 + R() * 40},${90 + R() * 60},${20 + R() * 30},.5)`; g.fillRect(px(x), pz(z), 3, 3); }
    // dirt path to the hilltop
    g.strokeStyle = "#c9ad7a"; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = (3.4 / 360) * W;
    g.beginPath(); for (let p = 0; p <= 1.001; p += 0.02) { const [x, z] = pathAt(p); p === 0 ? g.moveTo(px(x), pz(z)) : g.lineTo(px(x), pz(z)); } g.stroke();
    g.strokeStyle = "rgba(120,90,50,.35)"; g.lineWidth = 2; g.stroke();
  });
}

function foamTex() {
  const t = drawTex(1024, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); const R = rng(5);
    for (let i = 0; i < 900; i++) { const x = R() * w, y = h * 0.5 + (R() - 0.5) * h * 0.7 * R(); g.fillStyle = `rgba(255,255,255,${0.25 + R() * 0.6})`; g.beginPath(); g.ellipse(x, y, 3 + R() * 14, 1.5 + R() * 4, 0, 0, 7); g.fill(); }
  });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(12, 1);
  return t;
}

function makeGull(parent) {
  const g = group(parent);
  const body = sph(0.3, M(0xf6f4ec, { r: 0.7 }), 0, 0, 0, g); body.scale.set(1.5, 0.75, 0.78); ink(body, 0.01);
  const head = sph(0.19, M(0xf8f6ee, { r: 0.7 }), 0.46, 0.18, 0, g); ink(head, 0.01);
  const beak = mesh(new THREE.ConeGeometry(0.06, 0.24, 10), M(0xe8a92a, { r: 0.5 }), 0.7, 0.16, 0, g); beak.rotation.z = -Math.PI / 2 - 0.1;
  const wings = [-1, 1].map((s) => {
    const w = group(g, 0, 0.1, s * 0.16);
    const sh = new THREE.Shape(); sh.moveTo(-0.32, 0); sh.lineTo(0.3, 0); sh.lineTo(0.12, 1.15); sh.lineTo(-0.34, 1.0); sh.closePath();
    const wg = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }); wg.rotateX((Math.PI / 2) * s);
    mesh(wg, M(0xe9e8e0, { r: 0.75, side: THREE.DoubleSide }), 0, 0, 0, w);
    box(0.5, 0.03, 0.24, M(0x2a2a30), -0.1, 0, s * 1.04, w, { cast: false });
    return { w, s };
  });
  g.userData.flap = (t, amp = 1) => wings.forEach(({ w, s }) => (w.rotation.x = s * (Math.sin(t * 9) * 0.65 * amp - 0.1)));
  return g;
}

// the tsunami: a long curling sheet, coloured by height, white at the lip, with spray
function makeWave(scene) {
  const pts = [[-10, 0], [-6.5, 0.12], [-4.2, 0.3], [-2.6, 0.55], [-1.3, 0.8], [-0.4, 0.96], [0.5, 1.05], [1.3, 1.07], [2.0, 1.0], [2.5, 0.87], [2.62, 0.72], [2.35, 0.64], [1.95, 0.67], [1.6, 0.6], [1.32, 0.46], [1.18, 0.28], [1.3, 0.1], [1.7, 0]];
  const sh = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
  const L = 520;
  const geo = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false, curveSegments: 24, steps: 80 });
  geo.translate(0, 0, -L / 2); geo.rotateY(-Math.PI / 2);
  // bend the ends back a little so it reads as a wall curving along the coast
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) - (x * x) / 16000); }
  geo.computeVertexNormals();
  const u = { time: { value: 0 }, fog: { value: new THREE.Color(DAY.hor) }, sunDir: { value: new THREE.Vector3(...DAY.sunDir).normalize() } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: `varying vec3 vL; varying vec3 vN; varying vec3 vW; void main(){ vL=position; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `
      varying vec3 vL; varying vec3 vN; varying vec3 vW; uniform float time; uniform vec3 fog, sunDir;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n(p); p=p*2.03+7.1; a*=.5; } return s; }
      void main(){
        float v=vL.y, u=vL.z;
        vec3 deep=vec3(.02,.14,.22), mid=vec3(.04,.38,.5), lite=vec3(.3,.78,.82);
        vec3 c=mix(deep,mid,smoothstep(0.,.75,v)); c=mix(c,lite,smoothstep(.72,1.,v)*smoothstep(-1.5,1.6,u));
        c*=1.-.32*smoothstep(.45,.8,v)*smoothstep(.9,1.6,u)*(1.-smoothstep(.85,.95,v));
        // streaks running down the face
        float st=fbm(vec2(vL.x*.35, v*3.-time*.8));
        c=mix(c,vec3(.85,.97,1.),smoothstep(.6,.78,st)*smoothstep(.5,1.8,u)*.7);
        c=mix(c,vec3(.9,.98,1.),smoothstep(.7,.9,fbm(vec2(vL.x*.12,u*1.5+v*2.)))*smoothstep(-6.,-1.,u)*.35);
        // white lip and churning foot
        float lip=smoothstep(.8,.96,v+fbm(vec2(vL.x*.5+time*.4,u*2.))*.16)*smoothstep(-1.,.4,u);
        float foot=smoothstep(.16,.0,v+fbm(vec2(vL.x*.6,time))*.08);
        c=mix(c,vec3(1.),clamp(lip+foot*.85,0.,1.));
        float lit=.62+.48*max(dot(normalize(vN),sunDir),0.);
        c*=lit;
        float d=length(vW-cameraPosition);
        c=mix(c,fog,smoothstep(160.,900.,d)*.85);
        gl_FragColor=vec4(c*1.15,1.);
      }`,
  });
  mat.side = THREE.DoubleSide;
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scene.add(m);
  const spray = dust(scene, 900, 420, 1, 4, 0, 0, 0, 0xffffff, 0.9, 31);
  spray.points.material.opacity = 0.9; spray.points.material.blending = THREE.NormalBlending;
  return {
    mesh: m, u, spray,
    // zf: where the curling lip is, hgt: crest height in metres
    set(t, zf, hgt, y0) {
      m.visible = hgt > 0.01; spray.points.visible = hgt > 3;
      const z = zf - 2.6 * hgt * 0.95;
      m.position.set(0, y0, z); m.scale.set(1, hgt, hgt * 0.95);
      u.time.value = t;
      spray.set(t * 3);
      spray.points.position.set(0, y0 + hgt * 1.1 + Math.sin(t * 2) * 0.3, z + hgt * 1.0);
      spray.points.scale.set(1, hgt / 6, hgt / 6);
    },
  };
}

export function buildBeach(engine) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(DAY.hor);
  scene.environment = gradientEnv(engine.r, 0xcfe9ff, 0xa8cfe6, 0x5d6a58);
  scene.environmentIntensity = 0.55;
  const sky = makeSky(scene, DAY);
  const sea = makeSea(scene, { ...DAY, islands: [], far: 1500, size: 3200 });

  // ground: reef, beach and hill in one displaced sheet
  const gg = new THREE.PlaneGeometry(360, 360, 360, 360); gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i) - 50; gp.setY(i, groundY(x, z)); }
  gg.computeVertexNormals();
  const ground = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ map: groundTex(), roughness: 0.82 }));
  ground.position.z = -50; ground.receiveShadow = true; scene.add(ground);

  // shore foam line that follows the water as it drains
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(360, 3.2), new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, depthWrite: false, opacity: 0.85 }));
  foam.rotation.x = -Math.PI / 2; foam.renderOrder = 3; scene.add(foam);

  const R = rng(5);
  // reef dressing
  const rockMat = M(0x6a6458, { r: 0.9 });
  for (let i = 0; i < 70; i++) { const x = (R() - 0.5) * 90, z = -8 - R() * 55; rockLump(scene, 0.4 + R() * 1.1, x, groundY(x, z), z, 100 + i, rockMat, 0.45); }
  for (let i = 0; i < 80; i++) { const x = (R() - 0.5) * 90, z = -7 - R() * 55; coral(scene, x, groundY(x, z) - 0.05, z, 300 + i); }

  // fish that the receding sea leaves behind
  const FISHC = [0xf2b134, 0x3aa0e0, 0xe0603a, 0xc0c8d0, 0x9a62d0, 0xf07aa0];
  const fish = [];
  const fishAt = [[1.6, -11.5], [2.6, -12.6], [0.4, -13.2], [-2.5, -10.8], [-4, -12.5], [3.8, -10.4], [6, -13], [-6.5, -11.4], [8, -15], [-9, -14]];
  for (let i = 0; i < 40; i++) {
    const [x, z] = i < fishAt.length ? fishAt[i] : [(R() - 0.5) * 50, -9 - R() * 30];
    const f = makeFish(scene, FISHC[i % FISHC.length], i < 3 ? 1.5 : 1 + R() * 0.6);
    f.position.set(x, groundY(x, z), z); f.rotation.y = R() * 6.28;
    fish.push({ g: f, x, z, ph: R() * 9 });
  }
  // boats moored in the shallows
  const boats = [[-12, -15, 0.4, "#7a2d22", 0xe0c24a], [7, -24, -0.3, "#2d5a7a", 0xf0f0e0], [21, -13, 1.2, "#3a7a3a", 0xe05a3a], [-26, -22, -0.8, "#8a5a2a", 0x3a8ad0]].map(([x, z, ry, c, s]) => { const b = makeBoat(scene, c, s); b.rotation.y = ry; return { b, x, z, ry }; });

  // village and palms
  [[-22, 24, 0.15], [-12, 27, -0.05], [-2, 23, 0.1], [14, 25, -0.15], [25, 28, -0.3], [-34, 29, 0.35]].forEach(([x, z, ry], i) => makeHouse(scene, x, groundY(x, z), z, Math.PI + ry, { wall: ["#9a6c40", "#a8794a", "#8a5c36", "#b08050", "#9a7048", "#a07850"][i], roof: [0x7a3a26, 0x8a8a8a, 0x6a3a22, 0x7a7a7a, 0x8a4a2a, 0x7a3a26][i], s: 1.15 }));
  for (let i = 0; i < 34; i++) { const x = (R() - 0.5) * 150, z = 7 + R() * 22; if (Math.abs(x - 4) < 4 && z > 18) continue; if (Math.abs(x) < 16 && z < 17) continue; makePalm(scene, x, groundY(x, z) - 0.1, z, 6 + R() * 4.5, 0.15 + R() * 0.35, 40 + i, R() * 6.28); }
  for (let i = 0; i < 46; i++) { const x = (R() - 0.5) * 180, z = 34 + R() * 80; const [px0] = pathAt(clamp((z - 22) / 80)); if (Math.abs(x - px0) < 5) continue; makePalm(scene, x, groundY(x, z) - 0.1, z, 6 + R() * 4, 0.1 + R() * 0.2, 120 + i, R() * 6.28); }
  // meunasah on the hilltop: where everyone runs
  const [mx, mz] = pathAt(1.04);
  const mos = group(scene, mx, groundY(mx, mz), mz + 4); mos.rotation.y = Math.PI;
  box(7, 3.6, 7, M(0xf2ece0, { r: 0.8 }), 0, 1.8, 0, mos);
  const dome = sph(2.9, M(0x2f8a5a, { r: 0.5 }), 0, 3.6, 0, mos); dome.scale.y = 0.9;
  cyl(0.06, 0.06, 1.4, M(0xd9b24a, { m: 0.8, r: 0.3 }), 0, 6.8, 0, mos, 8);
  const mn = cyl(0.55, 0.65, 8, M(0xf2ece0, { r: 0.8 }), 4.4, 4, 2.6, mos, 16);
  const mt = mesh(new THREE.ConeGeometry(0.75, 1.6, 16), M(0x2f8a5a, { r: 0.5 }), 4.4, 8.8, 2.6, mos);
  for (let i = 0; i < 3; i++) box(1.1, 1.6, 0.06, M(0x3a2a20), -2.2 + i * 2.2, 1.6, 3.52, mos);
  inkAll(mos, 0.012);

  // gulls: a few float, a few fly
  const gulls = Array.from({ length: 9 }, (_, i) => ({ g: makeGull(scene), x: (R() - 0.5) * 50, z: -10 - R() * 30, ph: R() * 6, fly: i < 4 }));

  const wave = makeWave(scene);

  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x9a8a60, 1.15));
  const key = sun(scene, 0xfff0d8, 3.1, DAY.sunDir[0] * 150, DAY.sunDir[1] * 150, DAY.sunDir[2] * 150, 0, 0, -6, 48, 4096);
  const camFill = new THREE.PointLight(0xfff0e0, 3, 12, 1.6); scene.add(camFill); camFill.userData.base = 3;
  const motes = dust(scene, 160, 60, 10, 60, 0, 4, -5, 0xfff4dc, 0.03, 21);

  const set = {
    scene, sky, sea, wave, fish, boats, gulls, ground, camFill, foam,
    grade: { exposure: 1.02, tint: [1.0, 1.0, 0.97], sat: 1.12, bloom: 0.38, thresh: 1.5, lift: [0, 0.004, 0.01], edgeColor: [0.16, 0.15, 0.16], vignette: 0.38 },
    dof: null,
    // drives the water, foam line, boats, fish and gulls from time alone
    world(t, o = {}) {
      const sy = o.seaY ?? seaY(t);
      sea.mesh.position.y = sy;
      const sz = shoreZ(sy);
      foam.position.set(0, sy + 0.04, sz - 0.6); foam.material.map.offset.x = t * 0.03; foam.material.opacity = 0.8;
      boats.forEach(({ b, x, z, ry }, i) => {
        const gy = groundY(x, z);
        const float = sy + Math.sin(t * 1.6 + i) * 0.06 - 0.25;
        const grounded = clamp((gy - float + 0.1) / 0.5);
        b.position.set(x, Math.max(float, gy - 0.12), z);
        b.rotation.set(Math.sin(t * 1.2 + i) * 0.03 * (1 - grounded), ry, 0.26 * grounded * (i % 2 ? 1 : -1));
      });
      fish.forEach((f) => {
        const gy = groundY(f.x, f.z);
        const out = clamp((gy - sy - 0.05) / 0.25);
        f.g.visible = out > 0.01;
        f.g.position.y = gy;
        f.g.userData.flop(t, out * (o.flop ?? 1), f.ph);
      });
      const scare = o.scare ?? clamp((t - 5.6) / 0.6);
      gulls.forEach((gl, i) => {
        const up = gl.fly ? 1 : scare;
        const tt = Math.max(0, t - 5.6);
        gl.g.position.set(gl.x + (gl.fly ? Math.sin(t * 0.3 + gl.ph) * 8 : tt * 3 * scare), gl.fly ? 9 + Math.sin(t * 0.7 + gl.ph) * 1.5 : sy + 0.15 + up * (tt * tt * 3 + tt * 2), gl.z + (gl.fly ? Math.cos(t * 0.3 + gl.ph) * 6 : 0));
        gl.g.rotation.y = gl.fly ? -(t * 0.3 + gl.ph) : 1.2;
        gl.g.userData.flap(t + gl.ph, up > 0.01 ? 1 : 0.05);
        gl.g.visible = o.gulls ?? true;
      });
      wave.set(t, o.waveZ ?? -900, o.waveH ?? 0, sy - 0.2);
    },
    reset() { wave.set(0, -900, 0, 0); },
    update(t) { sky.set(t); sea.set(t); motes.set(t); },
  };
  return set;
}
