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

The app is a fully static front-end — no server required. `npm run build`
produces a `dist/` folder you can host on Netlify, Vercel, GitHub Pages,
Cloudflare Pages or Firebase Hosting. The shared gallery (below) is optional;
without it, everything else still works.

## Shared gallery (optional)

**Publish** records a short clip of the flowing ink and lets you scrub to the
best-looking frame before posting it, so you pick the moment rather than gamble
on the timing. **Gallery** opens the public wall of everything shared, where you
can delete marbles you posted yourself. It is backed by Cloud Firestore alone —
each marble is a small inline thumbnail in the listed document plus the full
image in a subdocument fetched only when a marble is opened, so browsing stays
light (the wall also paginates with **Load more**) and everything fits
Firebase's free tier with no Cloud Storage and no custom server. Firebase loads
lazily, so it never slows the initial canvas.

Ownership uses **Anonymous Authentication**: each browser gets an invisible
identity (no login screen), so only the poster can delete their own marble, and
that ownership is enforced by the security rules — not just hidden in the UI.

To enable it:

1. Create a Firebase project and a **Web app** in the Firebase console.
2. Enable **Cloud Firestore** (Storage is not needed).
3. Under **Authentication → Sign-in method**, enable **Anonymous**.
4. Copy `.env.example` to `.env` and fill in the web config values
   (`storageBucket` is optional — only `apiKey` and `projectId` are required).
5. Deploy the Firestore security rules. The versioned copy lives in
   [`firestore.rules`](firestore.rules):

   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```

   (or paste the file's contents into **Firestore → Rules** in the console).
   The rules let anyone read, let signed-in browsers post marbles as
   themselves — JPEG data-URLs only, under ~1 MB, no extra fields, honest
   server timestamp — and let only the owner delete.

6. *(Recommended before a public launch)* Enable **App Check**: in the
   console under **App Check → Apps**, register the web app with a
   **reCAPTCHA v3** key and put the site key in `.env` as
   `VITE_FIREBASE_APPCHECK_SITE_KEY`. Once the deployed site shows verified
   traffic, turn on **Enforce** for Cloud Firestore. This curbs scripted
   spam against the publicly writable gallery. (For local dev with
   enforcement on, register a debug token under *App Check → Apps → Manage
   debug tokens* — or just leave the key blank locally.)

The Firebase web keys are not secret (they ship in any client bundle); access
is governed entirely by the security rules plus App Check.

## Stack

React 18 · TypeScript · Vite · Three.js · Firebase (optional)

## Roadmap

- [x] PNG export of the current marble
- [x] Video capture of the flowing ink (WebM)
- [x] Switchable color palettes (traditional, ebru, sunset, neon)
- [x] Physics control panel (ink flow, swirl, fade, force)
- [x] Shared gallery (publish, browse, and delete your own via Firebase)
- [ ] Community gallery — profiles, likes / most-loved sort, and per-marble
      share links (URL + social preview). Needs moderation; to be decided later.
