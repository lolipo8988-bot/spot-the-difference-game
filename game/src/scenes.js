// The two hand-drawn scenes. Everything is painted with canvas paths:
// no image files, no borrowed art. Each scene paints the same picture twice
// (left panel, right panel) and the `variant` object flips its differences
// on for the right panel only. `subtle` (level 3) makes each change smaller
// instead of removing things outright.
//
// A scene is drawn in a 580x420 scene space. Difference coordinates live
// in that same space, so a click on either panel maps to the same point.

import { createRandom } from './random.js';

/** A difference: where it is, how big its marker ring is, what it is called. */
function diff(id, label, x, y, r) {
  return { id, label, x, y, r };
}

// ---------------------------------------------------------------- helpers

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  circle(ctx, x, y, 16 * s);
  circle(ctx, x + 18 * s, y - 6 * s, 20 * s);
  circle(ctx, x + 38 * s, y, 16 * s);
  ctx.fillRect(x - 14 * s, y - 2 * s, 66 * s, 16 * s);
}

function gull(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, y);
  ctx.quadraticCurveTo(x - 5 * s, y - 8 * s, x, y);
  ctx.quadraticCurveTo(x + 5 * s, y - 8 * s, x + 12 * s, y);
  ctx.stroke();
}

/** A bright four-point star. */
function sparkle(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

function flower(ctx, x, y, petal, center, s = 1) {
  ctx.fillStyle = petal;
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    circle(ctx, x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 6.5 * s);
  }
  ctx.fillStyle = center;
  circle(ctx, x, y, 5.5 * s);
}

function butterfly(ctx, x, y, s, flap = 0) {
  ctx.fillStyle = '#ff9ecf';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(flap);
  ellipse(ctx, -7 * s, -5 * s, 8 * s, 6 * s);
  ellipse(ctx, -7 * s, 6 * s, 7 * s, 5 * s);
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-flap);
  ellipse(ctx, 7 * s, -5 * s, 8 * s, 6 * s);
  ellipse(ctx, 7 * s, 6 * s, 7 * s, 5 * s);
  ctx.restore();
  ctx.fillStyle = '#5b3a29';
  ellipse(ctx, x, y, 2.5 * s, 8 * s);
}

function bee(ctx, x, y, s) {
  ctx.fillStyle = '#ffd23e';
  ellipse(ctx, x, y, 9 * s, 7 * s);
  ctx.fillStyle = '#22242a';
  ctx.fillRect(x - 3 * s, y - 7 * s, 3 * s, 14 * s);
  ctx.fillRect(x + 3 * s, y - 7 * s, 3 * s, 14 * s);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.ellipse(x - 2 * s, y - 9 * s, 6 * s, 4 * s, -0.5, 0, Math.PI * 2);
  ctx.stroke();
}

function snail(ctx, x, y, s) {
  ctx.fillStyle = '#e07840';
  ctx.beginPath();
  ctx.arc(x, y, 10 * s, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b3542a';
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  ctx.arc(x, y, 5.5 * s, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#f2d8a7';
  ctx.fillRect(x - 12 * s, y - 1 * s, 26 * s, 5 * s);
  ctx.beginPath();
  ctx.arc(x + 14 * s, y - 1 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
}

function mushroom(ctx, x, y, s) {
  ctx.fillStyle = '#f4ead8';
  ctx.fillRect(x - 3 * s, y - 2 * s, 6 * s, 12 * s);
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.arc(x, y - 2 * s, 12 * s, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  circle(ctx, x - 5 * s, y - 8 * s, 2.2 * s);
  circle(ctx, x + 4 * s, y - 11 * s, 2.6 * s);
}

function boat(ctx, x, y, s, sailColor) {
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.moveTo(x - 22 * s, y);
  ctx.lineTo(x + 22 * s, y);
  ctx.lineTo(x + 14 * s, y + 9 * s);
  ctx.lineTo(x - 14 * s, y + 9 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5b3a29';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 26 * s);
  ctx.stroke();
  ctx.fillStyle = sailColor;
  ctx.beginPath();
  ctx.moveTo(x + 2 * s, y - 25 * s);
  ctx.lineTo(x + 2 * s, y - 2 * s);
  ctx.lineTo(x + 18 * s, y - 2 * s);
  ctx.closePath();
  ctx.fill();
}

function anchor(ctx, x, y, s, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = '#3d4451';
  ctx.lineWidth = 3.4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x * 0, -8 * s, 4 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -6 * s);
  ctx.lineTo(0, 12 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-11 * s, -2 * s);
  ctx.lineTo(11 * s, -2 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 2 * s, 11 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- lighthouse

const LIGHTHOUSE_DIFFS = [
  diff('gull', 'a seagull in the sky', 430, 70, 22),
  diff('lamp', 'the lighthouse lamp colour', 170, 82, 20),
  diff('window', 'the tower window light', 170, 200, 20),
  diff('boat', 'a little sailboat', 400, 312, 26),
  diff('cloud', 'a cloud over the sea', 90, 55, 26),
  diff('anchor', 'an anchor on the dock', 505, 372, 22),
  diff('star', 'a bright star', 300, 45, 18),
];

/** The midnight harbour: moon, lighthouse, dock, boat and gulls. */
function drawLighthouse(ctx, variant, seed, subtle) {
  const rng = createRandom(seed);
  const stars = [];
  for (let i = 0; i < 42; i += 1) {
    stars.push({ x: rng.range(8, 572), y: rng.range(6, 210), r: rng.range(0.8, 2.2), a: rng.range(0.35, 0.95) });
  }
  const waves = [];
  for (let i = 0; i < 9; i += 1) waves.push({ x: rng.range(20, 560), y: rng.range(275, 405), len: rng.range(24, 60) });

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#0a1030');
  sky.addColorStop(1, '#1d2f5e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 580, 262);
  // Stars.
  for (const s of stars) {
    ctx.save();
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#dfe8ff';
    circle(ctx, s.x, s.y, s.r);
    ctx.restore();
  }
  if (!variant.star) sparkle(ctx, 300, 45, 11, '#fff7c0');
  else if (subtle) sparkle(ctx, 300, 45, 6, '#fff7c0', 0.35);
  // Moon.
  ctx.fillStyle = '#f4ead0';
  circle(ctx, 480, 60, 27);
  ctx.fillStyle = '#e2d3ac';
  circle(ctx, 472, 54, 6);
  circle(ctx, 490, 68, 4);
  // Clouds.
  ctx.fillStyle = '#2c3d63';
  cloud(ctx, 250, 40, 1, '#2c3d63');
  cloud(ctx, 360, 110, 0.8, '#2c3d63');
  if (!variant.cloud) cloud(ctx, 90, 55, 0.9, '#2c3d63');
  else if (subtle) cloud(ctx, 65, 62, 0.6, '#2c3d63');

  // Sea.
  const sea = ctx.createLinearGradient(0, 260, 0, 420);
  sea.addColorStop(0, '#16324a');
  sea.addColorStop(1, '#0a1a2c');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 260, 580, 160);
  // Moon reflection.
  ctx.fillStyle = 'rgba(244, 234, 208, 0.35)';
  for (let i = 0; i < 5; i += 1) ctx.fillRect(468 - i * 3, 268 + i * 26, 24 + i * 8, 5);
  // Waves.
  ctx.strokeStyle = 'rgba(140, 190, 230, 0.5)';
  ctx.lineWidth = 2;
  for (const w of waves) {
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    ctx.quadraticCurveTo(w.x + w.len / 2, w.y - 5, w.x + w.len, w.y);
    ctx.stroke();
  }

  // Lighthouse beam (behind the tower's lamp glow).
  const lampColor = variant.lamp ? (subtle ? '#ffb347' : '#7dff9a') : '#ffd166';
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = lampColor;
  ctx.beginPath();
  ctx.moveTo(170, 82);
  ctx.lineTo(560, 30);
  ctx.lineTo(560, 130);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Lighthouse tower (striped).
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.moveTo(136, 332);
  ctx.lineTo(150, 96);
  ctx.lineTo(190, 96);
  ctx.lineTo(204, 332);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d64545';
  for (const [y0, y1] of [[150, 178], [214, 242], [278, 306]]) {
    ctx.beginPath();
    const t0 = (y0 - 96) / (332 - 96);
    const t1 = (y1 - 96) / (332 - 96);
    const x0a = 150 - (150 - 136) * t0;
    const x0b = 190 + (204 - 190) * t0;
    const x1a = 150 - (150 - 136) * t1;
    const x1b = 190 + (204 - 190) * t1;
    ctx.moveTo(x0a, y0);
    ctx.lineTo(x0b, y0);
    ctx.lineTo(x1b, y1);
    ctx.lineTo(x1a, y1);
    ctx.closePath();
    ctx.fill();
  }
  // Tower window.
  if (!variant.window) {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(162, 190, 16, 22);
  } else if (subtle) {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(162, 190, 16, 11);
    ctx.fillStyle = '#1c2739';
    ctx.fillRect(162, 201, 16, 11);
  } else {
    ctx.fillStyle = '#1c2739';
    ctx.fillRect(162, 190, 16, 22);
  }
  ctx.strokeStyle = '#5b3a29';
  ctx.lineWidth = 2;
  ctx.strokeRect(162, 190, 16, 22);
  // Gallery + lamp room.
  ctx.fillStyle = '#3d4451';
  ctx.fillRect(142, 88, 56, 9);
  ctx.fillStyle = '#2c3340';
  ctx.fillRect(148, 66, 44, 23);
  ctx.fillStyle = lampColor;
  circle(ctx, 170, 78, 11);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = lampColor;
  circle(ctx, 170, 78, 20);
  ctx.restore();
  ctx.fillStyle = '#3d4451';
  ctx.beginPath();
  ctx.moveTo(144, 66);
  ctx.lineTo(196, 66);
  ctx.lineTo(188, 54);
  ctx.lineTo(152, 54);
  ctx.closePath();
  ctx.fill();
  // Rocks at the base.
  ctx.fillStyle = '#3a4152';
  ellipse(ctx, 120, 336, 46, 16);
  ellipse(ctx, 205, 338, 40, 13);
  ellipse(ctx, 165, 342, 52, 12);

  // Dock on the right.
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(430, 348, 150, 12);
  ctx.fillStyle = '#54371f';
  ctx.fillRect(445, 360, 10, 34);
  ctx.fillRect(520, 360, 10, 34);
  ctx.fillRect(565, 360, 10, 34);
  if (!variant.anchor) anchor(ctx, 505, 372, 1);
  else if (subtle) anchor(ctx, 505, 372, 1, 0.5);

  // Boat on the sea.
  if (!variant.boat) boat(ctx, 400, 312, 1, '#f4f1e8');
  else if (subtle) boat(ctx, 400, 312, 1, '#ff8a80');

  // Gulls.
  gull(ctx, 300, 80, 1, '#dfe8ff');
  gull(ctx, 350, 58, 0.85, '#dfe8ff');
  if (!variant.gull) gull(ctx, 430, 70, 1, '#dfe8ff');
  else if (subtle) gull(ctx, 455, 88, 0.6, '#dfe8ff');
}

// ---------------------------------------------------------------- garden

const GARDEN_DIFFS = [
  diff('butterfly', 'a pink butterfly', 140, 150, 22),
  diff('apple', 'an apple on the tree', 500, 150, 18),
  diff('flower', 'one flower\'s colour', 280, 335, 20),
  diff('bee', 'a busy bee', 360, 170, 20),
  diff('sunray', 'a ray of the sun', 80, 22, 18),
  diff('mushroom', 'a red mushroom', 530, 370, 20),
  diff('snail', 'a snail on the grass', 190, 375, 22),
];

/** A sunny garden: sun, tree, flower bed and small creatures. */
function drawGarden(ctx, variant, seed, subtle) {
  const rng = createRandom(seed);
  const petals = [];
  for (let i = 0; i < 7; i += 1) petals.push({ x: rng.range(30, 550), y: rng.range(300, 395), c: rng.pick(['#ff6b9d', '#ffd23e', '#c77dff', '#ff8a5c']) });
  const tufts = [];
  for (let i = 0; i < 14; i += 1) tufts.push({ x: rng.range(10, 570), y: rng.range(250, 410) });

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 250);
  sky.addColorStop(0, '#8ed0ff');
  sky.addColorStop(1, '#dff3ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 580, 252);
  // Sun with rays.
  ctx.fillStyle = '#ffd23e';
  circle(ctx, 80, 70, 34);
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i += 1) {
    if (variant.sunray && i === 0) continue;
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(80 + Math.cos(a) * 42, 70 + Math.sin(a) * 42);
    ctx.lineTo(80 + Math.cos(a) * 54, 70 + Math.sin(a) * 54);
    ctx.stroke();
  }
  // Clouds.
  cloud(ctx, 300, 50, 1, '#ffffff');
  cloud(ctx, 450, 100, 0.8, '#ffffff');
  // Hills.
  ctx.fillStyle = '#7cc46a';
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.quadraticCurveTo(180, 190, 360, 248);
  ctx.quadraticCurveTo(480, 280, 580, 235);
  ctx.lineTo(580, 420);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();
  // Grass.
  ctx.fillStyle = '#5db35a';
  ctx.fillRect(0, 252, 580, 168);
  // Grass tufts.
  ctx.strokeStyle = '#4a9e4d';
  ctx.lineWidth = 2;
  for (const t of tufts) {
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x - 3, t.y - 7);
    ctx.moveTo(t.x + 3, t.y);
    ctx.lineTo(t.x + 5, t.y - 6);
    ctx.stroke();
  }
  // Path.
  ctx.fillStyle = '#e8d5a7';
  ctx.beginPath();
  ctx.moveTo(250, 420);
  ctx.quadraticCurveTo(270, 330, 250, 252);
  ctx.lineTo(310, 252);
  ctx.quadraticCurveTo(330, 330, 350, 420);
  ctx.closePath();
  ctx.fill();

  // Tree on the right.
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(472, 190, 18, 90);
  ctx.fillStyle = '#4a9e4d';
  circle(ctx, 480, 150, 52);
  circle(ctx, 440, 180, 38);
  circle(ctx, 520, 180, 38);
  ctx.fillStyle = '#3d8a3f';
  circle(ctx, 460, 130, 26);
  circle(ctx, 505, 128, 24);
  // Apples.
  ctx.fillStyle = '#e5534b';
  circle(ctx, 452, 168, 7);
  circle(ctx, 512, 178, 7);
  circle(ctx, 478, 118, 7);
  if (!variant.apple) circle(ctx, 500, 150, 7);

  // Flower bed.
  const flowerSpots = [[70, 330], [150, 350], [210, 325], [280, 335], [360, 352], [430, 330], [520, 345]];
  for (let i = 0; i < flowerSpots.length; i += 1) {
    const [fx, fy] = flowerSpots[i];
    const petal = i === 3 ? (variant.flower ? '#5aa9ff' : '#ff5d5d') : petals[i % petals.length].c;
    flower(ctx, fx, fy, petal, '#ffd23e');
    ctx.strokeStyle = '#3d8a3f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 8);
    ctx.lineTo(fx, fy + 30);
    ctx.stroke();
  }

  // Creatures.
  if (!variant.butterfly) butterfly(ctx, 140, 150, 1, 0.25);
  if (!variant.bee) bee(ctx, 360, 170, 1);
  if (!variant.snail) snail(ctx, 190, 375, 1);
  if (!variant.mushroom) mushroom(ctx, 530, 370, 1);
}

// ---------------------------------------------------------------- scenes

/** All scenes, by id: their painter and their differences. */
export const SCENES = {
  lighthouse: { name: 'Midnight Lighthouse', differences: LIGHTHOUSE_DIFFS, draw: drawLighthouse },
  garden: { name: 'Sunny Garden', differences: GARDEN_DIFFS, draw: drawGarden },
};

/** A variant object with every difference flipped on (the right panel). */
export function changedVariant(differences) {
  const v = {};
  for (const d of differences) v[d.id] = true;
  return v;
}

/** A variant object with every difference off (the left panel). */
export function baseVariant(differences) {
  const v = {};
  for (const d of differences) v[d.id] = false;
  return v;
}
