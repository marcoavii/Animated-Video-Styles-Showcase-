// Starter exterior: sky, optional sea, ground, sun. Build once per mood so each light is tuned on its own.
import * as THREE from "three";
import { M, plane, makeSky, makeSea, sun, gradientEnv, dust, plasterTex } from "./kit.js";

const MOODS = {
  day: { top: 0x2a7fc4, mid: 0x7cc0e6, hor: 0xd8eef0, sunDir: [0.55, 0.62, 0.3], sunCol: 0xfff4dc, sunGlow: 0.5, clouds: 0.62, cloudCol: 0xffffff, cloudShade: 0x9fb4cc, deep: 0x0f5d7e, shallow: 0x2a9db0, sky: 0xbfe2ee, fog: 0xd8eef0, glint: 1.1, foam: 0xf4fbfb, keyC: 0xfff0d8, keyI: 3.0, hemi: [0xbfe0ff, 0x8a7a60, 1.05], env: [0xcfe9ff, 0xa8cfe6, 0x4d6a78], envI: 0.55, grade: { exposure: 1.0, tint: [1, 1, 0.98], sat: 1.06, bloom: 0.42, thresh: 1.5, lift: [0, 0.004, 0.008], edgeColor: [0.2, 0.2, 0.24] } },
  night: { top: 0x050a1c, mid: 0x0d1a38, hor: 0x24406b, sunDir: [-0.2, 0.42, -0.95], sunCol: 0xcfe0ff, sunGlow: 0.14, sunSize: 0.9992, clouds: 0.38, cloudCol: 0x4a5c80, cloudShade: 0x121c34, stars: 1, deep: 0x041226, shallow: 0x0d2b4a, sky: 0x1d3660, fog: 0x1c3358, glint: 0.9, foam: 0x7f9cc4, keyC: 0xa8c0ff, keyI: 1.5, hemi: [0x5a7ab8, 0x141c2e, 0.85], env: [0x2b3f6c, 0x18243f, 0x060a14], envI: 0.5, grade: { exposure: 1.1, tint: [0.92, 0.98, 1.12], sat: 1.05, bloom: 0.8, thresh: 0.9, lift: [0.004, 0.008, 0.018], edgeColor: [0.3, 0.3, 0.4] } },
  dawn: { top: 0x2b4f8a, mid: 0xe29a8c, hor: 0xffcf8a, sunDir: [0.75, 0.1, 0.6], sunCol: 0xffc070, sunGlow: 1.1, clouds: 0.5, cloudCol: 0xffd0a8, cloudShade: 0x9a6a7e, deep: 0x214a6e, shallow: 0x7a6a78, sky: 0xeab090, fog: 0xf3b58a, glint: 1.6, foam: 0xffe8d0, keyC: 0xffbd80, keyI: 2.6, hemi: [0xffc8a8, 0x4a4060, 0.7], env: [0xffd0a0, 0xc08070, 0x30304a], envI: 0.5, grade: { exposure: 1.02, tint: [1.04, 0.98, 0.92], sat: 1.08, bloom: 0.72, thresh: 1.1, edgeColor: [0.25, 0.16, 0.16] } },
};

export function buildOutdoor(engine, mood = "day", o = {}) {
  const mo = MOODS[mood];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(mo.hor);
  scene.environment = gradientEnv(engine.r, ...mo.env);
  scene.environmentIntensity = mo.envI;
  const sky = makeSky(scene, mo);
  const sea = o.sea ? makeSea(scene, { ...mo, islands: o.islands || [], far: 1400, size: 3000 }) : null;
  if (o.ground !== false) plane(2000, 2000, new THREE.MeshStandardMaterial({ map: plasterTex(o.groundColor || "#7a8a52", 31, 40, 40), roughness: 1 }), 0, 0, 0, scene, -Math.PI / 2, 0, { cast: false });
  scene.add(new THREE.HemisphereLight(...mo.hemi));
  sun(scene, mo.keyC, mo.keyI, mo.sunDir[0] * 150, mo.sunDir[1] * 150 + 10, mo.sunDir[2] * 150, 0, 2, 0, o.shadowSpan ?? 42, 4096);
  if (mood === "night") { const f = new THREE.DirectionalLight(0x8fa8e8, 1.9); f.position.set(0.4, 0.5, 1); scene.add(f); } // the moon usually sits behind the subject
  const motes = dust(scene, 200, 60, 20, 60, 0, 8, 0, mood === "night" ? 0xbfd4ff : 0xfff0d0, 0.06, 21);
  return {
    scene, sky, sea, mood: mo,
    grade: mo.grade, dof: null,
    reset() {},
    update(t) { sky.set(t); if (sea) sea.set(t); motes.set(t); },
  };
}
