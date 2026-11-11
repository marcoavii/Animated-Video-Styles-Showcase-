import React from 'react';
import {
  clamp, easeOut, LEG_LEN, camT, kf, poseAt, faceAt, Sparkle, Rooftop, TitleCard, LOOKS, Hero, ShotProps,
} from '../../engine';
import { S1 as S1demo, S2 as S2demo } from '../copy-paste/shots';

// The 5-second intro sample. S1 and S2 reuse the copy-paste episode's kitchen shots (the power is the same: the
// selection box, then the pop); T1 is the title card on the rooftop, written for this episode.

export const S1: React.FC<ShotProps> = ({ t, len, f }) => <S1demo t={t} len={len} f={f} />;
export const S2: React.FC<ShotProps> = ({ t, len, f }) => <S2demo t={t} len={len} f={f} />;

const PIP = LOOKS.pipHood;

// ---------- T1: the title, wide, the sun a slow wheel behind Pip ----------
export const T1: React.FC<ShotProps> = ({ t }) => {
  const spin = t < 21 ? t * 3 : 63 + (t - 21) * 30 * Math.exp(-(t - 21) / 22);
  const sunY = 690 - 50 * easeOut(clamp((t - 21) / 25));
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: 770, scale: 0.62, yaw: 0, armL: { a: 20, b: 6 }, armR: { a: 20, b: 6 } } },
    { f: 21, p: {} },
    { f: 27, p: { armL: { a: 150, b: 10 }, armR: { a: 150, b: 10 } }, ease: easeOut },
  ]);
  return (
    <g transform={camT(960, kf(t, [[0, 520], [72, 560]]), kf(t, [[0, 1.0], [72, 1.1]]))}>
      <Rooftop clock t={t} sunY={sunY} spin={spin} red={0} crack={0} />
      <Hero look={PIP} pose={{ ...pose, y: 820 - LEG_LEN * 0.62, ...faceAt(t, [[0, 'happy']]) }} shadow={0.6} rimId="rimR" />
      <Sparkle x={640} y={330} t={t - 6} s={1.2} />
      <Sparkle x={1280} y={420} t={t - 12} s={1.0} />
      <TitleCard t={t} lines={['WHAT IF YOU COULD', 'COPY ANYTHING?']} accent="ANYTHING" accentT={16} size={110} y={170} />
    </g>
  );
};
