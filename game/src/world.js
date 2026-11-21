// The game state: levels, finds, hearts, hints, score and the clock.
// It knows nothing about pixels; the renderer asks it what to paint.

import {
  CLICK_RADIUS,
  FINAL_LEVEL_SECONDS,
  HEARTS_PER_LEVEL,
  HINTS_PER_LEVEL,
  LEVELS,
  SCORE,
} from './config.js';
import { SCENES, baseVariant, changedVariant } from './scenes.js';

/** Screens the game moves between. */
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL_CLEAR = 'level-clear';
export const SCREEN_OVER = 'over';

/** A fresh state for one level. */
function freshLevel(index) {
  const level = LEVELS[index];
  const scene = SCENES[level.scene];
  return {
    index,
    level,
    scene,
    found: new Set(),
    hearts: HEARTS_PER_LEVEL,
    hintsLeft: HINTS_PER_LEVEL,
    hint: null, // {id, until} while a hint ring is showing
    elapsed: 0,
    mistakes: 0,
    levelScore: 0,
  };
}

/** Create the world: score, level state and the screen. */
export function createWorld() {
  const state = {
    screen: SCREEN_TITLE,
    level: freshLevel(0),
    score: 0,
    totalFound: 0,
    totalMistakes: 0,
    best: 0,
    finished: false, // every level cleared
    timeUp: false, // the final level's clock ran out
    flashes: [], // recent wrong clicks: {x, y, panel, until}
    message: '',
    messageUntil: 0,
    startedAt: 0,
  };

  function level() {
    return state.level;
  }

  function radius() {
    return CLICK_RADIUS[level().index];
  }

  function remaining() {
    return level().scene.differences.length - level().found.size;
  }

  function secondsLeft() {
    if (!level().level.timed) return null;
    return Math.max(0, FINAL_LEVEL_SECONDS - level().elapsed);
  }

  /** Start (or restart) the whole game from level 1. */
  function startGame(now) {
    state.level = freshLevel(0);
    state.score = 0;
    state.totalFound = 0;
    state.totalMistakes = 0;
    state.finished = false;
    state.timeUp = false;
    state.flashes = [];
    state.screen = SCREEN_PLAY;
    state.startedAt = now;
  }

  /** Advance to the next level, or finish the game. */
  function nextLevel(now) {
    const bonus = level().level.timed
      ? Math.round(secondsLeft() * SCORE.finalLevelPerSecondLeft)
      : Math.max(0, SCORE.levelClearBase - Math.floor(level().elapsed) * SCORE.levelClearPerSecond);
    state.score += bonus;
    state.level.levelScore += bonus;
    if (level().index + 1 >= LEVELS.length) {
      state.finished = true;
      state.screen = SCREEN_OVER;
      return { cleared: true, bonus, finished: true };
    }
    state.level = freshLevel(level().index + 1);
    state.screen = SCREEN_PLAY;
    state.startedAt = now;
    return { cleared: true, bonus, finished: false };
  }

  /** A click in scene coordinates on one panel: find, or a miss. */
  function clickAt(sceneX, sceneY, panel, now) {
    if (state.screen !== SCREEN_PLAY) return null;
    const lv = level();
    let best = null;
    let bestDist = Infinity;
    for (const d of lv.scene.differences) {
      if (lv.found.has(d.id)) continue;
      const dist = Math.hypot(sceneX - d.x, sceneY - d.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    if (best !== null && bestDist <= radius()) {
      lv.found.add(best.id);
      state.totalFound += 1;
      state.score = Math.max(0, state.score + SCORE.find);
      lv.levelScore += SCORE.find;
      state.message = `Found: ${best.label}!`;
      state.messageUntil = now + 1.6;
      return { kind: 'found', diff: best, remaining: remaining() };
    }
    lv.hearts -= 1;
    lv.mistakes += 1;
    state.totalMistakes += 1;
    state.score = Math.max(0, state.score + SCORE.miss);
    state.flashes.push({ x: sceneX, y: sceneY, panel, until: now + 0.9 });
    state.message = 'Not there — look closer!';
    state.messageUntil = now + 1.6;
    if (lv.hearts <= 0) {
      state.screen = SCREEN_OVER;
      return { kind: 'gameover', hearts: 0 };
    }
    return { kind: 'miss', hearts: lv.hearts };
  }

  /** Reveal one unfound difference for a few seconds (costs points). */
  function useHint(now) {
    if (state.screen !== SCREEN_PLAY) return null;
    const lv = level();
    if (lv.hintsLeft <= 0) return { kind: 'no-hints' };
    const rest = lv.scene.differences.filter((d) => !lv.found.has(d.id));
    if (rest.length === 0) return null;
    const pick = rest[Math.floor(Math.random() * rest.length)];
    lv.hintsLeft -= 1;
    state.score = Math.max(0, state.score + SCORE.hint);
    lv.hint = { id: pick.id, until: now + 3 };
    state.message = `Hint: look near the ${pick.label}`;
    state.messageUntil = now + 2.4;
    return { kind: 'hint', diff: pick };
  }

  /** Advance the clock; the timed level ends at zero. */
  function step(dt, now) {
    if (state.screen !== SCREEN_PLAY) return null;
    const lv = level();
    lv.elapsed += dt;
    if (lv.hint !== null && now >= lv.hint.until) lv.hint = null;
    state.flashes = state.flashes.filter((f) => now < f.until);
    if (lv.level.timed && lv.elapsed >= FINAL_LEVEL_SECONDS) {
      state.timeUp = true;
      state.screen = SCREEN_OVER;
      return { kind: 'timeup' };
    }
    if (lv.found.size === lv.scene.differences.length) {
      state.screen = SCREEN_LEVEL_CLEAR;
      return { kind: 'level-clear' };
    }
    return null;
  }

  return {
    state,
    level,
    radius,
    remaining,
    secondsLeft,
    startGame,
    nextLevel,
    clickAt,
    useHint,
    step,
    /** Jump to a fresh level (used by the screenshot staging). */
    setLevel(index) {
      state.level = freshLevel(index);
    },
    /** The variant each panel paints with. */
    variants() {
      const diffs = level().scene.differences;
      return { left: baseVariant(diffs), right: changedVariant(diffs) };
    },
    /** Accuracy so far, as a percentage. */
    accuracy() {
      const tries = state.totalFound + state.totalMistakes;
      return tries === 0 ? 100 : Math.round((state.totalFound / tries) * 100);
    },
  };
}
