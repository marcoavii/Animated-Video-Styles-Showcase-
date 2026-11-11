// Flat vector props in the Basic style 4 look (same outline + cream glow as the characters).
// Each draw(g, state, w, h) paints into its own design box; wrap with new Cutout(parent, w, h, worldH, draw).
import { sticker, tube, rrect, circ, ell, shade, OL } from "./toon.js";

const INK = "#14100d";

// a reef fish lying on wet sand. state: { col, flop (-1..1) }
export function drawFish(g, s, w, h) {
  g.save(); g.translate(w / 2, h / 2); g.rotate((s.flop || 0) * 0.35);
  const col = s.col || "#f2b134";
  sticker(g, (gg) => { gg.beginPath(); gg.moveTo(120, 0); gg.lineTo(195, -62); gg.quadraticCurveTo(180, 0, 195, 62); gg.closePath(); }, shade(col, 0.82));
  sticker(g, ell(-20, 0, 150, 78), (gg) => { gg.fillStyle = col; gg.fillRect(-200, -100, 400, 200); gg.fillStyle = shade(col, 1.18); gg.beginPath(); gg.ellipse(-40, -30, 110, 30, 0, 0, 7); gg.fill(); gg.fillStyle = shade(col, 0.8); gg.fillRect(-200, 30, 400, 80); gg.strokeStyle = shade(col, 0.7); gg.lineWidth = 8; for (let i = 0; i < 3; i++) { gg.beginPath(); gg.arc(10 + i * 34, 0, 50, -0.8, 0.8); gg.stroke(); } });
  sticker(g, (gg) => { gg.beginPath(); gg.moveTo(-40, -70); gg.quadraticCurveTo(10, -125, 60, -72); gg.closePath(); }, shade(col, 0.85), { glow: 0 });
  sticker(g, circ(-110, -14, 24), "#ffffff", { ol: 8, glow: 0 });
  g.fillStyle = INK; g.beginPath(); g.arc(-114, -12, 11, 0, 7); g.fill();
  g.strokeStyle = "#5e2a1c"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.arc(-160, 18, 14, -0.4, 0.9); g.stroke();
  g.restore();
}

// a music note. state: { col }
export function drawNote(g, s, w, h) {
  const col = s.col || "#ffd36e";
  sticker(g, (gg) => { gg.beginPath(); gg.moveTo(150, 40); gg.quadraticCurveTo(215, 70, 205, 150); gg.quadraticCurveTo(190, 100, 150, 96); gg.closePath(); }, col);
  sticker(g, rrect(132, 40, 22, 200, 8), col, { glow: 0.5 });
  sticker(g, ell(110, 245, 52, 38, -0.35), col);
}

// a pillow, a batik blanket (drawn in the character's lying direction: wide box)
export function drawPillow(g, s, w, h) {
  sticker(g, rrect(14, 14, w - 28, h - 28, 40), (gg) => { gg.fillStyle = "#efe7d6"; gg.fillRect(0, 0, w, h); gg.fillStyle = "rgba(0,0,0,.08)"; gg.fillRect(0, h * 0.6, w, h); });
}
export function drawBlanket(g, s, w, h) {
  sticker(g, (gg) => { gg.beginPath(); gg.moveTo(20, h - 20); gg.lineTo(20, 70); gg.quadraticCurveTo(w * 0.3, 10, w * 0.62, 40); gg.quadraticCurveTo(w * 0.85, 60, w - 20, 110); gg.lineTo(w - 20, h - 20); gg.closePath(); }, (gg) => {
    gg.fillStyle = "#3d5c8a"; gg.fillRect(0, 0, w, h);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) { const cx = 40 + x * 80 + (y % 2) * 40, cy = 60 + y * 70; gg.strokeStyle = "#e9d9a8"; gg.lineWidth = 6; gg.beginPath(); gg.ellipse(cx, cy, 22, 12, 0.8, 0, 7); gg.stroke(); gg.beginPath(); gg.ellipse(cx, cy, 22, 12, -0.8, 0, 7); gg.stroke(); gg.fillStyle = "#c9573a"; gg.beginPath(); gg.arc(cx, cy, 6, 0, 7); gg.fill(); }
    gg.fillStyle = "rgba(255,255,255,.12)"; gg.fillRect(0, 0, w, 90); gg.fillStyle = "rgba(0,0,0,.14)"; gg.fillRect(0, h - 90, w, 90);
  });
}

// the reference's signature insert: a big arm and hand coming in from the side. state: { open (0 relaxed, 1 spread), skin, sleeve }
export function drawArm(g, s, w, h) {
  const skin = s.skin || "#b07448", sleeve = s.sleeve || "#d4453a";
  const hx = 300, hy = h / 2;
  tube(g, [[w + 60, hy + 40], [hx + 60, hy + 6]], 150, skin);
  tube(g, [[w + 60, hy + 40], [w - 220, hy + 26]], 150, sleeve, { glow: 0, hi: true });
  const sp = s.open ?? 1;
  // four fingers reaching left, a thumb on top, then the palm over their roots (the reference's hand)
  [[-58, 112, -0.32], [-20, 132, -0.1], [18, 128, 0.1], [52, 100, 0.3]].forEach(([dy, L, a]) => {
    const ang = Math.PI + a * (0.4 + 0.8 * sp);
    const b = [hx - 30, hy + dy];
    tube(g, [b, [b[0] + Math.cos(ang) * L, b[1] + Math.sin(ang) * L]], 46, skin, { glow: 0.6 });
  });
  tube(g, [[hx + 30, hy - 50], [hx - 20 - 30 * sp, hy - 128]], 48, skin, { glow: 0.6 });
  sticker(g, ell(hx + 20, hy + 2, 88, 84), (gg) => { gg.fillStyle = skin; gg.fillRect(0, 0, w, h); gg.fillStyle = shade(skin, 0.88); gg.beginPath(); gg.ellipse(hx + 55, hy + 45, 70, 50, 0, 0, 7); gg.fill(); }, { glow: 0.6 });
}

// the wall of water. state: { foam (0..1 phase), lip (0..1 curl) }
export function drawWave(g, s, w, h) {
  const f = s.foam || 0, lip = s.lip ?? 1;
  // three curling lobes along the wall, each rising from a trough and hooking over
  const N = 3, seg = w / N;
  const crest = (gg) => {
    gg.lineTo(0, h * 0.4);
    for (let i = 0; i < N; i++) {
      const x0 = i * seg;
      gg.bezierCurveTo(x0 + seg * 0.25, h * 0.36, x0 + seg * 0.45, h * 0.08, x0 + seg * 0.7, h * 0.07);
      gg.bezierCurveTo(x0 + seg * 0.86, h * 0.06, x0 + seg * 0.98, h * 0.14, x0 + seg * (0.97 - 0.02 * lip), h * 0.26);
      gg.bezierCurveTo(x0 + seg * 0.9, h * 0.2, x0 + seg * 0.84, h * 0.27, x0 + seg * 0.88, h * 0.34);
      gg.quadraticCurveTo(x0 + seg * 0.95, h * 0.4, x0 + seg, h * 0.4);
    }
  };
  const body = (gg) => { gg.beginPath(); gg.moveTo(0, h); crest(gg); gg.lineTo(w, h); gg.closePath(); };
  sticker(g, body, (gg) => {
    const gr = gg.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, "#0d4a63"); gr.addColorStop(0.55, "#1d7f98"); gr.addColorStop(1, "#5fc6cf");
    gg.fillStyle = gr; gg.fillRect(0, 0, w, h);
    gg.strokeStyle = "rgba(235,250,255,.75)"; gg.lineCap = "round";
    for (let i = 0; i < 14; i++) { const x = w * (0.08 + i * 0.065), off = ((i * 37 + f * 300) % 120); gg.lineWidth = 10 + (i % 3) * 5; gg.beginPath(); gg.moveTo(x, h * 0.25 + off); gg.quadraticCurveTo(x - 30, h * 0.45 + off, x - 10, h * 0.7 + off * 0.5); gg.stroke(); }
    for (let i = 0; i < N; i++) { gg.fillStyle = "rgba(0,20,40,.28)"; gg.beginPath(); gg.ellipse(i * seg + seg * 0.86, h * 0.36, seg * 0.07, h * 0.1, 0, 0, 7); gg.fill(); }
  }, { ol: 22 });
  // foam riding each crest
  for (let i = 0; i < N; i++) {
    const x0 = i * seg;
    sticker(g, (gg) => { gg.beginPath(); gg.moveTo(x0 + seg * 0.42, h * 0.16); for (let j = 0; j <= 8; j++) { const x = x0 + seg * (0.45 + j * 0.065), y = h * (0.055 + 0.06 * Math.pow(Math.abs(j - 4) / 4, 2)) - 14 - Math.sin(j * 1.9 + f * 8 + i) * 12; gg.quadraticCurveTo(x - 16, y - 34, x, y); } gg.lineTo(x0 + seg * 0.96, h * 0.25); gg.quadraticCurveTo(x0 + seg * 0.7, h * 0.15, x0 + seg * 0.42, h * 0.16); gg.closePath(); }, "#f4fbff", { ol: 14 });
  }
  // foot of churning foam
  sticker(g, (gg) => { gg.beginPath(); gg.moveTo(0, h); gg.lineTo(0, h * 0.9); for (let i = 0; i <= 16; i++) { const x = (w * i) / 16; gg.quadraticCurveTo(x - w / 32, h * 0.82 - Math.sin(i * 2.1 + f * 9) * 18, x, h * 0.88); } gg.lineTo(w, h); gg.closePath(); }, "#eef8fb", { ol: 14 });
}

// shadow of a wave on the wall (soft, no outline)
export function drawWaveShadow(g, s, w, h) {
  g.fillStyle = "rgba(10,8,20,0.82)";
  g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.72);
  g.bezierCurveTo(w * 0.2, h * 0.62, w * 0.38, h * 0.18, w * 0.6, h * 0.08);
  g.bezierCurveTo(w * 0.78, h * 0.0, w * 0.92, h * 0.1, w * 0.92, h * 0.24);
  g.bezierCurveTo(w * 0.84, h * 0.16, w * 0.76, h * 0.24, w * 0.8, h * 0.34);
  g.bezierCurveTo(w * 0.84, h * 0.5, w * 0.92, h * 0.78, w, h * 0.86); g.lineTo(w, h); g.closePath(); g.fill();
  for (let i = 0; i < 5; i++) { const x = 60 + i * (w / 5); g.fillRect(x, h * 0.84, w * 0.1, h * 0.1); g.beginPath(); g.moveTo(x - 14, h * 0.85); g.lineTo(x + w * 0.05, h * 0.77); g.lineTo(x + w * 0.1 + 14, h * 0.85); g.fill(); }
}
