// The output canvas. The world the sets live in is always drawn as a 1920 x 1080 picture (every set, shot, camera
// and overlay is authored in those coordinates). A 9:16 episode re-frames that world as a centered vertical slice,
// 608 world units wide, with a per-shot camera x-offset written in episode.json (reframe). The HUD draws in the
// canvas itself, so its positions adapt through ui helpers. Each composition calls setAspect once, before it
// renders; a worker only ever renders one composition at a time, so the module state is never shared across two.

export type Aspect = '16:9' | '9:16';
let aspect: Aspect = '16:9';

export const setAspect = (a: Aspect) => {
  aspect = a;
};
export const getAspect = (): Aspect => aspect;

/** The world the sets are drawn in, whatever the output size. */
export const WORLD = { w: 1920, h: 1080 };

/** The output pixel size of an aspect: 1920 x 1080 for 16:9, 1080 x 1920 for 9:16. */
export const outSize = (a: Aspect = aspect) => (a === '16:9' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 });

/** The visible strip of the world, in world coordinates. 16:9 sees it all; 9:16 sees a 608-wide crop centred on
 *  `center` (the composition's reframe shifts it per shot). */
export const worldView = (center = 960) => (getAspect() === '16:9' ? { x: 0, w: 1920 } : { x: Math.round(center - 304), w: 608 });

/** The pixel size of the render canvas for the current composition. */
export const CANVAS = () => outSize();

/** The largest font size a centred title line still fits in the visible strip. The estimate is conservative -
 *  a heavy grotesque runs about 0.7-0.8 em per glyph, plus the letter tracking. */
export const fitW = (text: string, size: number, margin = 60) =>
  getAspect() === '9:16' ? Math.min(size, Math.floor((worldView().w - margin) / (0.78 * text.length))) : size;
