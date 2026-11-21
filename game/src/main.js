// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between title, play, paused, level-clear and game-over screens.
//
// ?seed=N fixes the scene layouts. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createSound } from './audio.js';
import { createWorld, SCREEN_LEVEL_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { HINT_BUTTON, MUTE_BUTTON, createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
void seed; // Scenes carry their own per-level seeds; the query seed stays for parity with the kit.

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const sound = createSound();
const input = createInput(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

world.state.best = readBest();

function inButton(p, b) {
  return p !== null && p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  world.state.screen = scene.screen;
  let painted = 0;
  function paint() {
    const now = performance.now() / 1000;
    renderer.draw(world, input.cursor, now, { hoverButton: null, soundMuted: sound.muted });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const ui = { hoverButton: null, soundMuted: sound.muted };
  let accumulator = 0;
  let last = performance.now() / 1000;

  function announce(message) {
    status.textContent = message;
  }

  function endGame() {
    if (world.state.score > world.state.best) {
      world.state.best = world.state.score;
      saveBest(world.state.best);
    }
    announce(`Game over. Score ${world.state.score}. Best ${world.state.best}.`);
  }

  /** Route one click: header buttons first, then a panel spot, then the crosshair. */
  function handleClick(p, now) {
    if (inButton(p, HINT_BUTTON)) {
      const res = world.useHint(now);
      if (res !== null && res.kind === 'hint') {
        sound.hint();
        announce(`Hint: look near the ${res.diff.label}.`);
      } else if (res !== null && res.kind === 'no-hints') {
        announce('No hints left.');
      }
      return;
    }
    if (inButton(p, MUTE_BUTTON)) {
      ui.soundMuted = sound.toggleMute();
      return;
    }
    const hit = input.panelAt(p.x, p.y);
    if (hit !== null) {
      const res = world.clickAt(hit.sceneX, hit.sceneY, hit.panel, now);
      if (res !== null && res.kind === 'found') {
        sound.find();
        if (res.remaining === 0) sound.levelWin();
        announce(`Found ${res.diff.label}. ${res.remaining} left.`);
      } else if (res !== null && res.kind === 'miss') {
        sound.miss();
        announce(`Not there. ${res.hearts} hearts left.`);
      } else if (res !== null && res.kind === 'gameover') {
        sound.miss();
        endGame();
      }
      return;
    }
    // A click anywhere else confirms, like Space does.
    if (world.state.screen === SCREEN_TITLE || world.state.screen === SCREEN_OVER) {
      world.startGame(now);
      announce('Playing. Find 7 differences.');
    } else if (world.state.screen === SCREEN_LEVEL_CLEAR) {
      const res = world.nextLevel(now);
      if (res.finished) sound.gameWin();
      else sound.levelWin();
    } else if (world.state.screen === SCREEN_PAUSED) {
      world.state.screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function handleActions(now) {
    const actions = input.takeActions();
    const screen = world.state.screen;
    if (actions & ACTION_MUTE) ui.soundMuted = sound.toggleMute();
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      world.startGame(now);
      announce('Playing. Find 7 differences.');
      return;
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      const res = world.useHint(now);
      if (res !== null && res.kind === 'hint') {
        sound.hint();
        announce(`Hint: look near the ${res.diff.label}.`);
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        world.state.screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        world.state.screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        if (screen === SCREEN_OVER) endGame();
        world.startGame(now);
        sound.unlock();
        sound.click();
        announce('Playing. Find 7 differences.');
      } else if (screen === SCREEN_LEVEL_CLEAR) {
        const res = world.nextLevel(now);
        if (res.finished) {
          endGame();
          sound.gameWin();
        } else {
          sound.levelWin();
        }
      } else if (screen === SCREEN_PAUSED) {
        world.state.screen = SCREEN_PLAY;
        announce('Playing.');
      } else if (screen === SCREEN_PLAY) {
        // Keyboard play: check the crosshair's spot.
        const hit = input.panelAt(input.cursor.x, input.cursor.y);
        if (hit !== null) {
          const res = world.clickAt(hit.sceneX, hit.sceneY, hit.panel, now);
          if (res !== null && res.kind === 'found') {
            sound.find();
            announce(`Found ${res.diff.label}. ${res.remaining} left.`);
          } else if (res !== null && res.kind === 'miss') {
            sound.miss();
            announce(`Not there. ${res.hearts} hearts left.`);
          } else if (res !== null && res.kind === 'gameover') {
            sound.miss();
            endGame();
          }
        }
      }
    }
  }

  function frame(nowMs) {
    requestAnimationFrame(frame);
    const now = nowMs / 1000;
    accumulator += Math.min(now - last, MAX_FRAME);
    last = now;
    handleActions(now);
    // Hover state for the header buttons.
    const m = input.cursor;
    ui.hoverButton = inButton(m, HINT_BUTTON) ? 'hint' : inButton(m, MUTE_BUTTON) ? 'mute' : null;
    const click = input.takeClick();
    if (click !== null) {
      sound.unlock();
      handleClick(click, now);
    }
    if (world.state.screen === SCREEN_PLAY) {
      while (accumulator >= STEP && world.state.screen === SCREEN_PLAY) {
        const event = world.step(STEP, now);
        accumulator -= STEP;
        if (event !== null && event.kind === 'timeup') {
          sound.timeUp();
          endGame();
        } else if (event !== null && event.kind === 'level-clear') {
          sound.levelWin();
        }
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, input.cursor, now, ui);
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.state.screen === SCREEN_PLAY) {
      world.state.screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Spot the Difference. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
