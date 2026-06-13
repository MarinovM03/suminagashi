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

- **Brush** — drag to draw ink; the ink feeds in proportion to stroke speed,
  so it spreads on the water instead of saturating like a marker. Hovering
  stirs the water without depositing ink.
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

**Save** downloads the current marble as a PNG; **Record** captures a WebM
video of the ink flowing while you keep drawing (click again to stop, or it
caps at 30 seconds).

**Keyboard:** `Space` drops ink at a random spot, `X` washes the surface,
`S` saves the current marble as a PNG.

## Running locally

```bash
npm install
npm run dev
```

Build for production with `npm run build` (output in `dist/`).

## Deploying

The app is a fully static front-end — no server required. `npm run build`
produces a `dist/` folder you can host on Netlify, Vercel, GitHub Pages,
Cloudflare Pages or Firebase Hosting. The shared gallery (below) is optional;
without it, everything else still works.

## Shared gallery (optional)

**Publish** records a short clip of the flowing ink and lets you scrub to the
best-looking frame before posting it, so you pick the moment rather than gamble
on the timing. **Gallery** opens the public wall of everything shared. It is
backed by Cloud Firestore alone — a downscaled preview is stored inline in each
document, so it stays on Firebase's free tier with no Cloud Storage and no
custom server. Firebase loads lazily, so it never slows the initial canvas.

To enable it:

1. Create a Firebase project and a **Web app** in the Firebase console.
2. Enable **Cloud Firestore** (Storage is not needed).
3. Copy `.env.example` to `.env` and fill in the web config values
   (`storageBucket` is optional — only `apiKey` and `projectId` are required).
4. Set Firestore rules so anyone can read and post, but not tamper:

   ```
   match /marbles/{id} {
     allow read: if true;
     allow create: if request.resource.data.image is string
                   && request.resource.data.image.size() < 1048487;
     allow update, delete: if false;
   }
   ```

The Firebase web keys are not secret (they ship in any client bundle); access
is governed entirely by these rules. For a high-traffic site, add Firebase
Anonymous Auth + App Check to curb abuse.

## Stack

React 18 · TypeScript · Vite · Three.js · Firebase (optional)

## Roadmap

- [x] PNG export of the current marble
- [x] Video capture of the flowing ink (WebM)
- [x] Switchable color palettes (traditional, ebru, sunset, neon)
- [x] Physics control panel (ink flow, swirl, fade, force)
- [x] Shared gallery (publish & browse marbles via Firebase)
- [ ] Community gallery — accounts, profiles, likes / most-loved sort, and
      per-marble share links (URL + social preview). Needs auth + moderation;
      to be decided later.
