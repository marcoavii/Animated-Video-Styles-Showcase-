// Shots for one video. Every shot is a pure function of time: SC.name = (c, t, lt, d) => { ... }
// t = absolute seconds, lt = seconds since the shot's cut, d = shot length. Never keep state between frames.
// All drawing uses the 1920x1080 stage. In 9:16 keep the subject inside the framed area, and draw UI with hud().
'use strict';
const NIGHT_BG = '#a4b1c9';
Object.assign(BG_GRADE, { field: NIGHT_BG });

function paintField(g, r) {
  desertBack(g, r, { hz: 440, mx: 1300, my: 150, mr: 90 });
  sandGround(g, r, 600, { seed: 2, px: 960 });
  for (let i = 0; i < 18; i++) tuft(g, r() * W, 640 + r() * 340, .8);
}

SC.intro = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.07, 0, -24, 0, -8);
  layer(c, cam, .9, g => drawBg(g, 'field', paintField));
  layer(c, cam, 1, g => {
    soldier(g, 960, PORTRAIT ? 1100 : 930, 1.8, { face: 'angry', blink: blinkAt(t), armR: [-.5, -1.75, 'fist'], holdR: (R, A) => bayonet(R, A, 180, { rot: -1.72 }) });
  });
  fgFrame(c, cam, 1);
};

SC.field = (c, t, lt, d) => {
  const cam = camAt(lt, d, 1, 1.08);
  layer(c, cam, .9, g => drawBg(g, 'field', paintField));
  layer(c, cam, 1, g => {
    if (t < Q.boom) tellerMine(g, 960, 790, 1.2, {});
    explosion(g, 960, 790, t - Q.boom, { s: 1.2, seed: 9 });
  });
  fgFrame(c, cam, 2);
  killFeed(c, t, Q.boom + .15, 'RANJAU', 'KAMU');
};

window.VIDEO = {
  shakes: [[Q.boom, 30, .75], [Q.bigBoom, 44, 1.3]],     // [time, px, seconds]
  flashes: [[Q.boom, .26, 'rgba(255,245,225,1)']],        // [time, seconds, colour]
  grade: { intro: '#dfe4ee', field: '#dfe4ee' },          // gentle multiply per shot
  bigWords: {},                                           // phrase id -> caption size
  framing: {                                              // shot -> [[time, stageX, stageY, zoom, moveSeconds], ...]
    '9:16': { intro: [[0, 960, 620, 1.2]], field: [[0, 960, 640, 1.2]] },
    '16:9': {},
  },
};
