// Directing helpers for story.js: word-locked timeline, transitions, hand placement, captions.
import * as THREE from "three";
import { E, clamp, sstep } from "./kit.js";

const _q = new URLSearchParams(location.search);
// True when rendering 9:16. Use it for framing and prop placement that only suits one ratio.
export const P = +(_q.get("h") || 1080) > +(_q.get("w") || 1920);

export const whip = (dir = 1, d = 0.3, amt = 1.05, axis) => ({ type: "whip", d, dir, amt, axis });
export const push = (amt = 5, d = 0.3) => ({ type: "push", d, amt });
export const diss = (d = 0.14) => ({ type: "dissolve", d });
export const pulse = (t, t0, d = 0.16) => (t < t0 || t > t0 + d ? 0 : Math.sin(((t - t0) / d) * Math.PI));
export const popIn = (t, t0, d = 0.26) => E.back(clamp((t - t0) / d));
// 1 normally, 0 while a blink at any time in `list` is active
export const blinkLevel = (t, list, d = 0.16) => { let m = 1; for (const b of list) { if (t > b && t < b + d) m = 0; else if (t >= b + d && t < b + d + 0.05) m = (t - b - d) / 0.05; } return m; };

const _v = new THREE.Vector3();
// Pose an actor, then solve one hand ("armL"/"armR") onto a world-space point.
export function reach(actor, params, side, world) {
  actor.pose(params);
  actor.root.updateMatrixWorld(true);
  actor.body.updateMatrixWorld(true);
  const l = actor.body.worldToLocal(_v.set(...world)).toArray();
  actor.pose({ ...params, [side]: l });
}
// Move a prop to an actor's hand (idx 0 left, 1 right).
export function attachToHand(obj, actor, idx = 1, off = [0, 0, 0]) {
  actor.root.updateMatrixWorld(true);
  actor.arms[idx].hand.getWorldPosition(obj.position);
  obj.position.x += off[0]; obj.position.y += off[1]; obj.position.z += off[2];
}

// 1-2 words on screen, broken at punctuation: the reference's reading rhythm.
export function chunk(words, dur) {
  const out = [];
  let i = 0;
  while (i < words.length) {
    const a = words[i];
    let t = a.w, e = a.e, j = i + 1;
    if (!/[,.?!;:]$/.test(a.w) && j < words.length && a.w.length + words[j].w.length <= 11 && words[j].s - a.e < 0.12) { t += " " + words[j].w; e = words[j].e; j++; }
    out.push({ t, s: a.s, e });
    i = j;
  }
  for (let k = 0; k < out.length - 1; k++) out[k].e = Math.min(out[k + 1].s, out[k].e + 0.45);
  out[out.length - 1].e = dur + 1;
  return out;
}

// const tl = timeline(timing, { ending: "loop" | "fade", tail });
// tl.W("A1", 3) = start of word 3 of line A1. tl.S(...) adds a shot. tl.cue(...) a sound. tl.act(...) music.
export function timeline(timing, { ending = "loop", tail = null, hi = [] } = {}) {
  const HI = new Set(hi.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "")));
  const line = Object.fromEntries(timing.lines.map((l) => [l.id, l]));
  const word = (id, k) => {
    if (!line[id]) throw new Error(`no line ${id}`);
    const w = line[id].words[k];
    if (!w) throw new Error(`no word ${k} in line ${id} (${line[id].words.length} words)`);
    return w;
  };
  const W = (id, k = 0) => word(id, k).s;
  const WE = (id, k = 0) => word(id, k).e;
  const dur = timing.dur + (tail ?? (ending === "fade" ? 3.0 : 0.1));
  const shots = [], cues = [], impacts = [], acts = [];
  const S = (id, t0, t1, set, cam, o = {}) => { const s = { id, t0, t1, set, cam, seed: shots.length * 1.7 + 1, ...o }; shots.push(s); return s; };
  const cue = (name, t, o = {}) => { cues.push({ name, t: +t.toFixed(3), ...o }); };
  const hit = (t, a = 1) => impacts.push([t, a]); // camera shake
  const act = (name, t) => acts.push({ act: name, t });
  function finish() {
    shots.forEach((s, i) => { s.prev = shots[i - 1]; s.next = shots[i + 1]; });
    // every transition gets its own whoosh, panned with the move
    shots.forEach((s, i) => {
      if (!s.trans || i === 0) return;
      if (s.trans.type === "whip") cue("whoosh", s.t0 - s.trans.d * 0.5, { dur: s.trans.d, dir: s.trans.dir, big: s.trans.d > 0.27 ? 1 : 0 });
      else if (s.trans.type === "push") cue("whoosh_push", s.t0 - s.trans.d * 0.5, { dur: s.trans.d + 0.1 });
      else if (s.trans.d >= 0.14) cue("air_soft", s.t0 - s.trans.d * 0.5, { dur: s.trans.d + 0.15 });
    });
    const words = [];
    timing.lines.forEach((l) => { const tok = l.text.split(/\s+/); l.words.forEach((w, i) => words.push({ ...w, w: tok.length === l.words.length ? tok[i] : w.w })); });
    const captions = chunk(words, dur);
    captions.forEach((c) => { c.hi = c.t.split(/\s+/).some((w) => HI.has(w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ""))); });
    if (ending === "fade") captions[captions.length - 1].e = words[words.length - 1].e + 0.5;
    const shake = (t) => { let v = 0; for (const [t0, a] of impacts) if (t > t0 && t < t0 + 0.6) v += a * Math.exp(-(t - t0) * 9); return v; };
    const fadeAt = (t) => ({ a: ending === "fade" ? sstep(dur - 1.7, dur - 0.25, t) : 0, c: [0, 0, 0] });
    return { shots, captions, dur, cues, shake, fadeAt, acts, ending };
  }
  return { line, W, WE, dur, S, cue, hit, act, finish };
}
