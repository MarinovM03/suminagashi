# Suminagashi

[![CI](https://github.com/MarinovM03/suminagashi/actions/workflows/ci.yml/badge.svg)](https://github.com/MarinovM03/suminagashi/actions/workflows/ci.yml)

An interactive simulation of *suminagashi* (墨流し — "floating ink"), the
centuries-old Japanese art of marbling paper by floating ink on still water.

Ink drops spread, swirl and feather in real time on a GPU fluid simulation.
Trace the surface with your pointer to draw ink, hold to grow concentric
rings, or comb across the surface to feather the colors into waves — then
let the auto-flow mode paint on its own.

## How it works

- **Fluid solver** — Jos Stam's *Stable Fluids* method running entirely on the
  GPU (advection → vorticity confinement → pressure projection), implemented
  with Three.js using ping-pong half-float render targets. The velocity field
  runs at low resolution for speed while the dye field renders at up to 1280px.
- **Subtractive ink** — the dye field stores *absorbance*, not color. The
  display shader composites `paper × exp(−A)` (Beer–Lambert law), so
  overlapping inks darken and blend like real pigment on paper instead of
  glowing like screen colors. A procedural washi-paper fiber texture and edge
  vignette finish the look.

## Tools

- **Brush** — drag to draw ink; the ink feeds in proportion to stroke speed,
  so it spreads on the water instead of saturating like a marker. Hovering
  stirs the water without depositing ink. On touch screens every finger
  paints its own stroke in its own color — the rings and comb are
  multi-touch too.
- **Rings** — press and hold: alternating drops of ink and water push
  outward into concentric rings, the classic suminagashi technique
- **Comb** — drag a row of tines through floating ink to feather it

A **Tune** panel exposes the fluid physics live — ink flow, swirl, fade and
force — with a reset to defaults.

## Color palettes

Four switchable palettes, each with a cycle mode that rotates through its
inks on every touch:

- **Traditional** — sumi (ink black), ai (indigo), shu (vermilion), matsuba (pine green)
- **Ebru** — lapis, turquoise, oxide red, ochre, after Turkish paper marbling
- **Sunset** — violet, crimson, burnt orange, amber
- **Neon** — hot pink, cyan, lime, electric purple

**Save** downloads the current marble as a PNG; **Record** captures a video
of the ink flowing while you keep drawing — WebM, or MP4 on Safari (click
again to stop, or it caps at 30 seconds).

**Undo** (or `Ctrl+Z`) restores the marble to the moment before your last
stroke, drop, or wash — one level, for rescuing a composition from a smear.

**Keyboard:** `Space` drops ink at a random spot, `X` washes the surface,
`S` saves the current marble as a PNG, `Ctrl+Z` undoes the last action, and
`H` hides the interface for clean screenshots and screen recordings (press
`H` again to bring it back).

## Running locally

```bash
npm install
npm run dev
```

Build for production with `npm run build` (output in `dist/`).

## Deploying

The app is a fully static front-end — no server, database or accounts.
`npm run build` produces a `dist/` folder you can host on any static host
(Cloudflare Pages, Netlify, Vercel, GitHub Pages…).

`firestore.rules` is a deny-all placeholder that keeps the (currently unused)
Firebase project locked while the community gallery is shelved.

## Stack

React 18 · TypeScript · Vite · Three.js

## Roadmap

- [x] PNG export of the current marble
- [x] Video capture of the flowing ink
- [x] Switchable color palettes (traditional, ebru, sunset, neon)
- [x] Physics control panel (ink flow, swirl, fade, force)
- [ ] Community gallery with moderation — publish, browse and share marbles.
      An earlier prototype lives in the git history and will be rebuilt.
