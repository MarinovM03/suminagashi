# Suminagashi

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

- **Brush (筆)** — drag to draw ink; hovering stirs the water without ink
- **Rings (輪)** — press and hold: alternating drops of ink and water push
  outward into concentric rings, the classic suminagashi technique
- **Comb (櫛)** — drag a row of tines through floating ink to feather it

## Color palettes

Four switchable palettes, each with a cycle mode that rotates through its
inks on every touch:

- **Traditional** — sumi (ink black), ai (indigo), shu (vermilion), matsuba (pine green)
- **Ebru** — lapis, turquoise, oxide red, ochre, after Turkish paper marbling
- **Sunset** — violet, crimson, burnt orange, amber
- **Neon** — hot pink, cyan, lime, electric purple

**Keyboard:** `Space` drops ink at a random spot, `X` washes the surface,
`S` saves the current marble as a PNG.

## Running locally

```bash
npm install
npm run dev
```

Build for production with `npm run build` (output in `dist/`).

## Stack

React 18 · TypeScript · Vite · Three.js

## Roadmap

- [x] PNG export of the current marble
- [ ] Video capture of the flowing ink
- [x] Switchable color palettes (traditional, ebru, sunset, neon)
- [ ] Physics control panel (vorticity, fade, force)
- [ ] Gallery & sharing
