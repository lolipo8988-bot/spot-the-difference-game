# Spot the Difference — Midnight Lighthouse

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/lolipo8988-bot/spot-the-difference-game/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/lolipo8988-bot/spot-the-difference-game/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

An original spot-the-difference game, built for the
[make.fun "Make the best spot the difference game" bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).
Two near-identical pictures side by side, seven differences to hunt, a
counter of how many remain — all art drawn in code, all sound synthesised
in code, no borrowed images or audio.

## How to play

Serve `game/` with any static server (or `node serve.ts` and open
http://localhost:8080), then:

- **Click** a difference on either picture — or move the crosshair with the
  **arrow keys** and press **Enter**.
- A find rings the spot in red on both pictures and scores +100.
- A wrong click costs a heart (3 per level) and −25 points.
- **H** spends a hint (3 per level, −50 points) and spotlights one
  difference in gold. **P** pauses. **M** mutes. **R** restarts.

## The hunt

Three levels, each with 7 differences:

1. **Midnight Lighthouse** — a hand-drawn night harbour: moon, striped
   lighthouse, dock, sailboat and gulls. Take your time.
2. **Sunny Garden** — a bright garden: sun, tree, flower bed, butterfly,
   bee, snail and mushroom. Smaller click targets.
3. **Storm Lighthouse** — the harbour again, against a 120-second clock,
   with subtler changes (a shifted gull, a dimmer star, a half-lit window).

Clear a level to bank a time bonus and move on. Find all 21 to win.

## The differences

Level 1 & 3 (lighthouse): a seagull, the lamp colour, the tower window,
a sailboat, a cloud, an anchor on the dock, a bright star.
Level 2 (garden): a butterfly, an apple, one flower's colour, a bee,
a sun ray, a mushroom, a snail.

## Build

No build step, no network: `game/` is plain static files and
`game/index.html` opens in desktop Chrome and plays offline. `main.ts`
(the entry point) copies `game/` and `screenshots/` to `/output` and
writes `/output/dossier.json` with the vendored make.fun library.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

`screenshots/1-play.jpg` is the cover: mid-hunt with 3 differences found
and ringed, 4 still hidden, and the FOUND 3 / 7 counter on show.

<sub>Entered on [make.fun](https://make.fun/?ref=7n5rt0bc&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
