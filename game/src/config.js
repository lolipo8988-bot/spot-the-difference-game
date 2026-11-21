// Every tuning number, colour and layout constant in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it
// to the window, so no rule below depends on the screen size.

/** The simulation's fixed step, in seconds. */
export const STEP = 1 / 60;

/** The logical canvas size. */
export const FIELD = { width: 1280, height: 720 };

/** One picture panel (each scene is drawn in a 580x420 scene space). */
export const PANEL = { width: 580, height: 420, y: 118 };
export const PANEL_LEFT = { x: 40, y: PANEL.y };
export const PANEL_RIGHT = { x: 660, y: PANEL.y };

/** Header and footer bands. */
export const HEADER = { height: 96 };
export const FOOTER = { y: 556, height: 150 };

/** Click tolerance (scene pixels) per level: later levels are pickier. */
export const CLICK_RADIUS = [30, 26, 20];

/** Hearts lost on a wrong click; a level ends at zero hearts. */
export const HEARTS_PER_LEVEL = 3;
/** Hints per level. */
export const HINTS_PER_LEVEL = 3;
/** Countdown seconds for the final (timed) level; earlier levels count up. */
export const FINAL_LEVEL_SECONDS = 120;

/** Scoring. */
export const SCORE = {
  find: 100,
  miss: -25,
  hint: -50,
  levelClearBase: 200,
  levelClearPerSecond: 2,
  finalLevelPerSecondLeft: 5,
};

/** The three levels: scene, name and how hard it plays. */
export const LEVELS = [
  { scene: 'lighthouse', name: 'Midnight Lighthouse', sub: 'Level 1 · 7 differences · take your time', timed: false, subtle: false, seed: 11 },
  { scene: 'garden', name: 'Sunny Garden', sub: 'Level 2 · 7 differences · smaller targets', timed: false, subtle: false, seed: 23 },
  { scene: 'lighthouse', name: 'Storm Lighthouse', sub: 'Level 3 · 7 differences · 120 seconds · subtle changes', timed: true, subtle: true, seed: 47 },
];

export const PALETTE = {
  backdrop: '#0d1320',
  panel: '#141c2e',
  panelBorder: '#3a4a68',
  header: '#101827',
  text: '#f2f5fa',
  muted: '#93a0b8',
  accent: '#ffd166',
  good: '#5ee6a8',
  bad: '#ff5d5d',
  mark: '#ff3b30',
  hint: '#ffd166',
  button: '#2b3a55',
  buttonHover: '#3a4f78',
  overlay: 'rgba(8, 12, 22, 0.82)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'spot-the-difference.best';
