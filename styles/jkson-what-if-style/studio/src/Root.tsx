import React from 'react';
import { Composition } from 'remotion';
import './engine/fonts';
import { STUDIO } from './studio.config';
import { outSize } from './engine/canvas';
import { EPISODES } from './episodes';
import { CastSheet } from './CastSheet';

// Every episode gets four compositions: <Id> (the 16:9 film), <Id>9x16 (the same timeline re-framed for vertical),
// <Id>Board and <Id>Board9x16 (one frame per shot, at its key frame, for the storyboards). Cast renders the cast
// sheet. The 9:16 render is 1080 x 1920; strips of the horizontal world through canvas.ts.
//   npx remotion studio src/index.ts --port 3430

export const Root: React.FC = () => {
  const common = { fps: STUDIO.fps };
  return (
    <>
      {EPISODES.map((e) =>
        (['', '9x16'] as const).map((suffix) => {
          const { width, height } = outSize(suffix ? '9:16' : '16:9');
          const board = `${e.id}Board${suffix ? '9x16' : ''}`;
          return (
            <React.Fragment key={e.id + suffix}>
              <Composition id={`${e.id}${suffix}`} component={suffix ? e.MainV : e.Main} durationInFrames={Math.max(1, e.total)} width={width} height={height} fps={common.fps} />
              <Composition id={board} component={suffix ? e.BoardV : e.Board} durationInFrames={Math.max(1, e.shotCount)} width={width} height={height} fps={common.fps} />
            </React.Fragment>
          );
        }),
      )}
      <Composition id="Cast" component={CastSheet} durationInFrames={1} width={STUDIO.width} height={STUDIO.height} fps={common.fps} />
    </>
  );
};
