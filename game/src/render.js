// The renderer: one canvas, one logical 1280x720 frame. It paints the
// header (title, counter, clock, score, hearts, buttons), the two picture
// panels with their find markers, the footer, the crosshair cursor, and
// the title / pause / level-clear / game-over overlays.

import {
  FIELD,
  FINAL_LEVEL_SECONDS,
  FONT,
  FOOTER,
  HEADER,
  LEVELS,
  PALETTE,
  PANEL,
  PANEL_LEFT,
  PANEL_RIGHT,
} from './config.js';
import { SCREEN_LEVEL_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

/** Header buttons, in logical coordinates (main.js routes clicks to them). */
export const HINT_BUTTON = { x: 1058, y: 52, w: 112, h: 34, id: 'hint' };
export const MUTE_BUTTON = { x: 1180, y: 52, w: 60, h: 34, id: 'mute' };

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A red ring with a tick: the mark a found difference wears on both panels. */
function drawFoundMark(ctx, x, y, r) {
  ctx.save();
  ctx.strokeStyle = PALETTE.mark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.4);
  ctx.lineTo(x + r * 0.5, y - r * 0.4);
  ctx.stroke();
  ctx.restore();
}

/** A pulsing gold ring: the hint's spotlight. */
function drawHintMark(ctx, x, y, r, now) {
  const pulse = 1 + 0.12 * Math.sin(now * 6);
  ctx.save();
  ctx.strokeStyle = PALETTE.hint;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A fading red X where a wrong click landed. */
function drawMissMark(ctx, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = PALETTE.bad;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 11);
  ctx.lineTo(x + 11, y + 11);
  ctx.moveTo(x + 11, y - 11);
  ctx.lineTo(x - 11, y + 11);
  ctx.stroke();
  ctx.restore();
}

/** Create the renderer for a canvas. */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  function drawHeader(world, now, ui) {
    const s = world.state;
    const lv = s.level;
    ctx.fillStyle = PALETTE.header;
    ctx.fillRect(0, 0, FIELD.width, HEADER.height);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `800 30px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('SPOT THE DIFFERENCE', 40, 38);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 15px ${FONT}`;
    ctx.fillText(`${lv.level.name}  ·  ${lv.level.sub}`, 40, 64);

    // Found counter: the number the judge looks for.
    const total = lv.scene.differences.length;
    const found = lv.found.size;
    const left = total - found;
    ctx.textAlign = 'right';
    ctx.fillStyle = left === 0 ? PALETTE.good : PALETTE.accent;
    ctx.font = `800 30px ${FONT}`;
    ctx.fillText(`FOUND ${found} / ${total}`, 1010, 40);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText(left === 0 ? 'all found!' : `${left} still hidden`, 1010, 64);

    // Score and clock.
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 17px ${FONT}`;
    const clock = lv.level.timed
      ? `TIME ${formatTime(Math.max(0, FINAL_LEVEL_SECONDS - lv.elapsed))}`
      : `TIME ${formatTime(lv.elapsed)}`;
    ctx.fillText(`SCORE ${s.score}`, 700, 38);
    ctx.fillStyle = lv.level.timed && lv.elapsed > 90 ? PALETTE.bad : PALETTE.text;
    ctx.fillText(clock, 700, 64);
    // Hearts.
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < lv.hearts ? '#ff5d7a' : '#3a4a68';
      ctx.beginPath();
      const hx = 870 + i * 26;
      const hy = 56;
      ctx.moveTo(hx, hy + 6);
      ctx.bezierCurveTo(hx - 9, hy - 3, hx - 5, hy - 11, hx, hy - 5);
      ctx.bezierCurveTo(hx + 5, hy - 11, hx + 9, hy - 3, hx, hy + 6);
      ctx.fill();
    }

    // Hint and mute buttons.
    for (const b of [HINT_BUTTON, MUTE_BUTTON]) {
      const hovered = ui.hoverButton === b.id;
      ctx.fillStyle = hovered ? PALETTE.buttonHover : PALETTE.button;
      roundRect(ctx, b.x, b.y, b.w, b.h, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = b.id === 'hint' ? `HINT (${lv.hintsLeft})` : ui.soundMuted ? 'MUTED' : 'SOUND';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.textAlign = 'left';
  }

  function drawPanels(world, now) {
    const s = world.state;
    const lv = s.level;
    const variants = world.variants();
    const panels = [
      { origin: PANEL_LEFT, variant: variants.left, tag: 'A · LEFT' },
      { origin: PANEL_RIGHT, variant: variants.right, tag: 'B · RIGHT' },
    ];
    for (const p of panels) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.origin.x, p.origin.y, PANEL.width, PANEL.height);
      ctx.clip();
      ctx.translate(p.origin.x, p.origin.y);
      lv.scene.draw(ctx, p.variant, lv.level.seed, lv.level.subtle);
      ctx.restore();
      // Frame.
      ctx.strokeStyle = PALETTE.panelBorder;
      ctx.lineWidth = 3;
      ctx.strokeRect(p.origin.x, p.origin.y, PANEL.width, PANEL.height);
      // Tag chip.
      ctx.fillStyle = 'rgba(13, 19, 32, 0.85)';
      roundRect(ctx, p.origin.x + 8, p.origin.y + 8, 86, 26, 6);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 14px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.tag, p.origin.x + 51, p.origin.y + 22);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      // Found marks on both panels.
      for (const d of lv.scene.differences) {
        if (!lv.found.has(d.id)) continue;
        drawFoundMark(ctx, p.origin.x + d.x, p.origin.y + d.y, d.r);
      }
      // Hint ring on both panels.
      if (lv.hint !== null) {
        const d = lv.scene.differences.find((x) => x.id === lv.hint.id);
        if (d) drawHintMark(ctx, p.origin.x + d.x, p.origin.y + d.y, d.r, now);
      }
      // Miss flashes on the panel they happened on.
      for (const f of s.flashes) {
        if ((f.panel === 'left') !== (p.origin === PANEL_LEFT)) continue;
        const alpha = Math.max(0, (f.until - now) / 0.9);
        drawMissMark(ctx, p.origin.x + f.x, p.origin.y + f.y, alpha);
      }
    }
  }

  function drawFooter(world, now) {
    const s = world.state;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('Click a difference on either picture  ·  Arrow keys move the crosshair, Enter checks it  ·  H hint  ·  P pause  ·  M mute', 40, FOOTER.y + 24);
    // Level dots.
    for (let i = 0; i < LEVELS.length; i += 1) {
      const cx = 640 + (i - 1) * 70;
      ctx.fillStyle = i < s.level.index ? PALETTE.good : i === s.level.index ? PALETTE.accent : '#3a4a68';
      ctx.beginPath();
      ctx.arc(cx, FOOTER.y + 56, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `600 12px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL ${i + 1}`, cx, FOOTER.y + 78);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText(`BEST ${Math.max(s.best, s.score)}`, 1240, FOOTER.y + 24);
    ctx.textAlign = 'left';
    // Transient message (found / miss / hint).
    if (s.message && now < s.messageUntil) {
      ctx.fillStyle = PALETTE.accent;
      ctx.font = `700 19px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(s.message, 640, FOOTER.y + 112);
      ctx.textAlign = 'left';
    }
  }

  function drawCursor(cursor, screen) {
    if (!cursor.visible || screen !== SCREEN_PLAY) return;
    ctx.save();
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cursor.x - 19, cursor.y);
    ctx.lineTo(cursor.x - 7, cursor.y);
    ctx.moveTo(cursor.x + 7, cursor.y);
    ctx.lineTo(cursor.x + 19, cursor.y);
    ctx.moveTo(cursor.x, cursor.y - 19);
    ctx.lineTo(cursor.x, cursor.y - 7);
    ctx.moveTo(cursor.x, cursor.y + 7);
    ctx.lineTo(cursor.x, cursor.y + 19);
    ctx.stroke();
    ctx.restore();
  }

  function overlayPanel(title, lines, accent) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#16203a';
    roundRect(ctx, 290, 130, 700, 460, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelBorder;
    ctx.lineWidth = 2;
    roundRect(ctx, 290, 130, 700, 460, 18);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = `800 44px ${FONT}`;
    ctx.fillText(title, 640, 215);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `500 19px ${FONT}`;
    lines.forEach((line, i) => ctx.fillText(line, 640, 275 + i * 34));
    ctx.textAlign = 'left';
  }

  function drawTitle(world) {
    overlayPanel('SPOT THE DIFFERENCE', [
      'Two pictures, seven differences. Find them all!',
      'Click a difference on either picture — or move the',
      'crosshair with the arrow keys and press Enter.',
      'A wrong click costs a heart. H spends a hint.',
      'Three scenes: a midnight lighthouse, a sunny garden,',
      'then the lighthouse again — in a storm, against the clock.',
      '',
      `Best score: ${world.state.best}`,
      '',
      'Click or press Space to start',
    ], PALETTE.accent);
  }

  function drawPaused() {
    overlayPanel('PAUSED', ['Take a breath. The differences will wait.', '', 'Press P or click to keep hunting'], PALETTE.text);
  }

  function drawLevelClear(world) {
    const s = world.state;
    overlayPanel(`LEVEL ${s.level.index + 1} CLEAR!`, [
      `${s.level.level.name} — all 7 differences found.`,
      `Level score: ${s.level.levelScore}`,
      `Total score: ${s.score}`,
      '',
      s.level.index + 1 >= LEVELS.length ? '' : `Next: ${LEVELS[s.level.index + 1].name}`,
      '',
      'Press Space for the next level',
    ], PALETTE.good);
  }

  function drawOver(world) {
    const s = world.state;
    const title = s.finished ? 'YOU FOUND THEM ALL!' : s.timeUp ? "TIME'S UP!" : 'OUT OF HEARTS';
    const accent = s.finished ? PALETTE.good : PALETTE.bad;
    const lines = [
      s.finished
        ? 'Every difference in all three scenes — sharp eyes!'
        : s.timeUp
          ? 'The storm clock beat you this time.'
          : 'Three wrong clicks ended the hunt.',
      '',
      `Score: ${s.score}   ·   Best: ${Math.max(s.best, s.score)}`,
      `Differences found: ${s.totalFound}   ·   Accuracy: ${world.accuracy()}%`,
      `Wrong clicks: ${s.totalMistakes}`,
      '',
      'Press Space to play again',
    ];
    overlayPanel(title, lines, accent);
  }

  return {
    /** Paint one frame. `ui` carries the hovered button id and mute state. */
    draw(world, cursor, now, ui) {
      const s = world.state;
      ctx.fillStyle = PALETTE.backdrop;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawHeader(world, now, ui);
      drawPanels(world, now);
      drawFooter(world, now);
      drawCursor(cursor, s.screen);
      if (s.screen === SCREEN_TITLE) drawTitle(world);
      else if (s.screen === SCREEN_PAUSED) drawPaused();
      else if (s.screen === SCREEN_LEVEL_CLEAR) drawLevelClear(world);
      else if (s.screen === SCREEN_OVER) drawOver(world);
    },
  };
}
