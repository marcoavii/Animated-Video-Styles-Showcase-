// Page entry: load fonts + timing, build sets and shots, expose window.seek(frame) for the renderer.
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { Engine, DEFAULT_GRADE, mixGrade } from "./engine.js";
import { setFont3D, gradientEnv } from "./kit.js";
import { buildStory } from "./story.js";

const q = new URLSearchParams(location.search);
const W = +(q.get("w") || 1920), H = +(q.get("h") || 1080);
export const FPS = 60;
document.documentElement.style.setProperty("--w", W + "px");
document.documentElement.style.setProperty("--h", H + "px");
const PORTRAIT = H > W;
window.__portrait = PORTRAIT;
if (PORTRAIT) document.documentElement.classList.add("portrait");
const vfovFor = (fov, k) => (Math.atan((k * (16 / 9)) * Math.tan((fov * Math.PI) / 360)) * 360) / Math.PI;

async function boot() {
  await Promise.all([document.fonts.load('800 60px "Plus Jakarta Sans"'), document.fonts.load('700 60px "Plus Jakarta Sans"'), document.fonts.load('500 60px "Plus Jakarta Sans"')]);
  const font = await new Promise((res, rej) => new FontLoader().load("/node_modules/three/examples/fonts/helvetiker_bold.typeface.json", res, undefined, rej));
  setFont3D(font);
  const timing = await (await fetch("/vo/timing.json")).json();
  const engine = new Engine(document.getElementById("gl"), W, H);
  const story = await buildStory(engine, timing);
  const { shots, captions, dur, cues } = story;

  const cap = document.getElementById("cap");
  const camA = new THREE.PerspectiveCamera(40, W / H, 0.1, 3000);
  const camB = new THREE.PerspectiveCamera(40, W / H, 0.1, 3000);

  function evalCam(shot, tau, cam) {
    const span = shot.t1 - shot.t0;
    const u = (tau - shot.t0) / span;
    const k = (PORTRAIT && shot.pcam) || shot.cam;
    let a = k[0], b = k[k.length - 1], su = 0;
    if (u <= k[0][0]) { a = k[0]; b = k[1]; su = (u - a[0]) / (b[0] - a[0]); }
    else if (u >= k[k.length - 1][0]) { a = k[k.length - 2]; b = k[k.length - 1]; su = (u - a[0]) / (b[0] - a[0]); }
    else for (let i = 1; i < k.length; i++) if (u < k[i][0]) { a = k[i - 1]; b = k[i]; su = (u - a[0]) / (b[0] - a[0]); break; }
    const ease = shot.ease || b[4];
    const inRange = su >= 0 && su <= 1;
    let v = su;
    if (ease === "io" && inRange) v = su * su * (3 - 2 * su);
    else if (ease === "out" && inRange) v = 1 - Math.pow(1 - su, 2.4);
    else if (ease === "in" && inRange) v = su * su;
    else if (ease === "io" || ease === "out" || ease === "in") v = su < 0 ? 0 : 1;
    const L = (x, y) => x + (y - x) * v;
    const p = [L(a[1][0], b[1][0]), L(a[1][1], b[1][1]), L(a[1][2], b[1][2])];
    const l = [L(a[2][0], b[2][0]), L(a[2][1], b[2][1]), L(a[2][2], b[2][2])];
    const fov = L(a[3] ?? 40, b[3] ?? 40);
    // gentle operator sway: the camera in the reference is never locked off
    const sw = shot.sway ?? 1;
    const s = shot.seed ?? 1;
    p[0] += Math.sin(tau * 0.9 + s) * 0.012 * sw + Math.sin(tau * 2.3 + s * 2) * 0.004 * sw;
    p[1] += Math.sin(tau * 1.1 + s * 3) * 0.009 * sw;
    l[0] += Math.sin(tau * 0.7 + s * 5) * 0.01 * sw;
    l[1] += Math.sin(tau * 0.8 + s * 7) * 0.007 * sw;
    cam.position.set(p[0], p[1], p[2]);
    cam.up.set(0, 1, 0);
    cam.lookAt(l[0], l[1], l[2]);
    if (shot.roll) cam.rotateZ(typeof shot.roll === "function" ? shot.roll(tau) : shot.roll);
    cam.fov = PORTRAIT ? vfovFor(fov, shot.pk ?? 1.0) : fov;
    cam.near = shot.near ?? 0.1; cam.far = shot.far ?? 3000;
    const dist = Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]);
    // camera shake from impacts
    const sh = story.shake ? story.shake(tau) : 0;
    if (sh > 0) {
      cam.rotateX(Math.sin(tau * 61) * sh * 0.012 + Math.sin(tau * 37) * sh * 0.008);
      cam.rotateY(Math.sin(tau * 53) * sh * 0.012);
      cam.rotateZ(Math.sin(tau * 47) * sh * 0.006);
    }
    // transition offsets: whip / push, into and out of the shot
    const inT = shot.trans, outT = shot.next?.trans;
    if (inT) applyTrans(cam, inT, Math.max(0, 1 - (tau - (shot.t0 - inT.d / 2)) / inT.d), -1, tau < shot.t0 + inT.d / 2);
    if (outT) applyTrans(cam, outT, Math.max(0, (tau - (shot.t1 - outT.d / 2)) / outT.d), 1, tau > shot.t1 - outT.d / 2);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    return dist;
  }
  function applyTrans(cam, tr, amt, sign, active) {
    if (!active) return;
    amt = Math.min(amt, 1.4);
    const k = Math.pow(amt, 2.4);
    if (tr.type === "whip") {
      const a = (tr.amt ?? 0.9) * k * sign * (tr.dir ?? 1);
      if (tr.axis === "y") cam.rotateX(a); else cam.rotateY(-a);
    } else if (tr.type === "push") {
      cam.translateZ(-(tr.amt ?? 3) * k * (sign > 0 ? 1 : -1) * -sign * sign);
      cam.fov += 10 * k;
    }
  }

  // Estimate on-screen motion to decide how many sub-frames this frame needs.
  const tmpV = new THREE.Vector3();
  const probes = [[-0.6, -0.4, 0.97], [0.6, -0.4, 0.97], [0, 0.5, 0.97], [0, 0, 0.99]];
  function motionPx(shot, T, dt) {
    evalCam(shot, T, camB);
    const pts = probes.map(([x, y, z]) => tmpV.set(x, y, z).unproject(camB).clone());
    evalCam(shot, T + dt, camB);
    let m = 0;
    probes.forEach(([x, y], i) => { const v = pts[i].clone().project(camB); m = Math.max(m, Math.hypot(v.x - x, (v.y - y) * (H / W)) * W * 0.5); });
    return m;
  }

  function activeShots(tau) {
    let i = shots.length - 1;
    for (let k = 0; k < shots.length; k++) if (tau < shots[k].t1) { i = k; break; }
    const s = shots[i], tr = s.trans, nx = s.next;
    if (tr && tau < s.t0 + tr.d / 2 && s.prev) {
      const m = tr.type === "cut" ? 1 : smooth01((tau - (s.t0 - tr.d / 2)) / tr.d, tr);
      return [s.prev, s, m];
    }
    if (nx && nx.trans && tau > nx.t0 - nx.trans.d / 2) {
      const m = nx.trans.type === "cut" ? 0 : smooth01((tau - (nx.t0 - nx.trans.d / 2)) / nx.trans.d, nx.trans);
      return [s, nx, m];
    }
    return [s, null, 0];
  }
  function smooth01(x, tr) {
    x = Math.min(1, Math.max(0, x));
    if (tr.type === "whip" || tr.type === "push") { x = Math.min(1, Math.max(0, (x - 0.32) / 0.36)); }
    return x * x * (3 - 2 * x);
  }

  function renderShot(shot, tau, cam, rt) {
    const local = tau - shot.t0;
    const u = local / (shot.t1 - shot.t0);
    shot.set.reset && shot.set.reset(tau);
    shot.do && shot.do(tau, u, local);
    shot.set.update && shot.set.update(tau, shot);
    const dist = evalCam(shot, tau, cam);
    if (shot.set.camFill) { const f = shot.set.camFill; f.position.copy(cam.position); f.translateY(0.7); f.intensity = shot.fill ?? f.userData.base; }
    const look = { ...DEFAULT_GRADE, ...shot.set.grade, ...shot.grade };
    const fx = shot.dof ?? shot.set.dof;
    look.dof = fx ? { focus: fx.focus ?? dist, aperture: fx.ap ?? 0.02, maxBlur: fx.max ?? 0.011 } : null;
    if (shot.frameGrade) Object.assign(look, shot.frameGrade(tau));
    engine.renderView(shot.set.scene, cam, look, rt);
    return look;
  }

  let frameCache = -1;
  window.__seek = function (frame) {
    const T = frame / FPS;
    const [A, B] = activeShots(T);
    const dt = 1 / FPS;
    const mp = Math.max(motionPx(A, T, dt * 0.75), B ? motionPx(B, T, dt * 0.75) : 0);
    const N = Math.min(16, Math.max(q.get("fast") ? 1 : 2, Math.ceil(mp / 5.5)));
    const shutter = (mp > 26 ? 0.95 : 0.6) * dt; // open the shutter on whips, 216 degrees otherwise
    engine.clearAccum();
    let gr = null;
    for (let i = 0; i < N; i++) {
      const tau = T + ((i + 0.5) / N - 0.5) * shutter;
      const [a, b, m] = activeShots(tau);
      const la = renderShot(a, tau, camA, engine.shotA);
      let lb = la;
      if (b) lb = renderShot(b, tau, camB, engine.shotB);
      engine.addSample(engine.shotA, b ? engine.shotB : null, b ? m : 0, 1 / N);
      if (i === (N >> 1)) gr = b ? mixGrade(la, lb, m) : la;
    }
    const fade = story.fadeAt ? story.fadeAt(T) : { a: 0, c: [0, 0, 0] };
    engine.finish(gr, frame, fade.a, fade.c);
    const c = captions.find((w) => T >= w.s && T < w.e);
    const txt = c ? c.t : "";
    if (cap.textContent !== txt) cap.textContent = txt;
    window.__lastN = N;
    return N;
  };

  window.__meta = { dur, frames: Math.round(dur * FPS), fps: FPS, shots: shots.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1, trans: s.trans?.type, amb: s.amb })), cues, acts: story.acts || [], ending: story.ending || "loop" };
  window.__ready = true;
  if (q.get("t")) window.__seek(Math.round(+q.get("t") * FPS));
}

boot().catch((e) => { console.error(e); window.__error = String(e && e.stack || e); });
