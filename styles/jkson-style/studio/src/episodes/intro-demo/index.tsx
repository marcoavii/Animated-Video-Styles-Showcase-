import React from 'react';
import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, T1 } from './shots';

// The 5-second intro sample, no voice. The same dusk-lit look as the examples.
export const introDemo = defineEpisode('IntroDemo', {
  timeline: timeline as Timeline,
  shots: { S1, S2, T1 },
});
