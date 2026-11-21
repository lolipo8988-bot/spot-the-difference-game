// Mouse and keyboard input. The mouse moves a crosshair over the panels;
// the arrow keys move the same crosshair, so the game is fully playable
// from the keyboard too. Enter/Space checks the crosshair's spot.

import { FIELD, PANEL_LEFT, PANEL_RIGHT, PANEL } from './config.js';

/** Action bits the main loop reads each frame. */
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

/** Create the input reader for a canvas. */
export function createInput(canvas) {
  let actions = 0;
  // Crosshair in logical canvas coordinates; starts between the panels.
  const cursor = { x: FIELD.width / 2, y: PANEL.y + PANEL.height / 2, visible: false };
  let mouse = { x: cursor.x, y: cursor.y };
  let hoverButton = null; // id of the header button under the mouse, if any
  let click = null; // a queued mouse click in logical coordinates

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    mouse = toLogical(event);
    cursor.x = mouse.x;
    cursor.y = mouse.y;
    cursor.visible = true;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toLogical(event);
    mouse = p;
    cursor.x = p.x;
    cursor.y = p.y;
    cursor.visible = true;
    click = p;
  });
  canvas.addEventListener('mouseleave', () => {
    cursor.visible = false;
  });

  window.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 48 : 12;
    if (event.key === 'ArrowLeft') {
      cursor.x = Math.max(0, cursor.x - step);
      cursor.visible = true;
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      cursor.x = Math.min(FIELD.width, cursor.x + step);
      cursor.visible = true;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      cursor.y = Math.max(0, cursor.y - step);
      cursor.visible = true;
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      cursor.y = Math.min(FIELD.height, cursor.y + step);
      cursor.visible = true;
      event.preventDefault();
    } else if (event.key === 'Enter' || event.key === ' ') {
      actions |= ACTION_CONFIRM;
      cursor.visible = true;
      event.preventDefault();
    } else if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.key === 'h' || event.key === 'H') {
      actions |= ACTION_HINT;
    } else if (event.key === 'm' || event.key === 'M') {
      actions |= ACTION_MUTE;
    } else if (event.key === 'r' || event.key === 'R') {
      actions |= ACTION_RESTART;
    }
  });

  return {
    cursor,
    /** Take and clear the actions queued since the last read. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** Take and clear a queued mouse click, if any. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
    setHoverButton(id) {
      hoverButton = id;
    },
    get hoverButton() {
      return hoverButton;
    },
    /** Which panel (if any) a logical point falls in, with scene coordinates. */
    panelAt(x, y) {
      for (const [name, origin] of [['left', PANEL_LEFT], ['right', PANEL_RIGHT]]) {
        if (x >= origin.x && x < origin.x + PANEL.width && y >= origin.y && y < origin.y + PANEL.height) {
          return { panel: name, sceneX: x - origin.x, sceneY: y - origin.y };
        }
      }
      return null;
    },
  };
}
