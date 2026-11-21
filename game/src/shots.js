// The screenshot scenes behind ?shot=start|play|end. Each one plays the
// real rules forward from a fresh game, so the frame is what a short game
// really looks like and the same seed always gives the same frame:
//   start — the title screen over the untouched lighthouse scene;
//   play  — mid-hunt: 3 of 7 differences found and ringed, 4 still hidden,
//           the counter reading FOUND 3 / 7, one heart already lost;
//   end   — the win screen: all 7 found, the final score on show.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

/** The three differences the play scene has already found. */
const PLAY_FOUND = ['gull', 'lamp', 'window'];

/**
 * Set the world to the named scene (start, play or end; any other name is
 * start) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  const s = world.state;
  if (name !== 'play' && name !== 'end') {
    return { screen: SCREEN_TITLE };
  }
  world.startGame(0);
  const lv = world.level();
  lv.elapsed = 83;
  if (name === 'play') {
    for (const id of PLAY_FOUND) lv.found.add(id);
    lv.hearts = 2;
    lv.mistakes = 1;
    s.totalFound = PLAY_FOUND.length;
    s.totalMistakes = 1;
    s.score = 300;
    s.message = 'Found: the tower window light!';
    s.messageUntil = 999;
    return { screen: SCREEN_PLAY };
  }
  // end: the final level won — every difference found, the game won.
  world.setLevel(2);
  const endLv = world.level();
  for (const d of endLv.scene.differences) endLv.found.add(d.id);
  endLv.elapsed = 96;
  s.totalFound = 21;
  s.totalMistakes = 1;
  s.score = 2140;
  s.finished = true;
  s.screen = SCREEN_OVER;
  return { screen: SCREEN_OVER };
}
