# SMFM Instagram Comms App

A browser-based tool for generating Instagram post images (1080×1350px, 4:5 aspect ratio) for Sister Midnight FM radio shows.

## What it does

Three modes, each producing a different post style:

- **Artist Image** — upload a photo, zoom/drag to position it, overlay SMFM branding, add show name, optional artist name, date/time, and text colour
- **SMFM Art Template** — illustration-based post with a colour combo (text + background), a centred SVG drawing, show name, and date/time
- **Tracklist** — post listing the tracks played; enter track title + artist pairs, add show name and date, choose a colour combo and optional footer decorations

All modes export a full-resolution 1080×1350px PNG.

## How to run

Open `index.html` directly in a browser, or serve locally (e.g. `python3 -m http.server`).

No build step, no dependencies, no bundler.

## Project structure

```
index.html          — app shell and controls UI
app.js              — entry point: config loading, main event listeners
styles.css          — layout and UI styling; four custom @font-face declarations
config.json         — tuneable layout values (canvas size, font sizes, positions)

js/
  state.js          — shared global state (settings, canvas refs, image holders)
  canvas.js         — canvas drawing (redrawCanvas, fitTextToWidth, splitTextToLines, etc.)
  imageLoader.js    — image loading (title SVGs, paper effect, drawings, user photo,
                       tracklist flower + footer decorations)
  position.js       — image position/zoom logic and drag-to-reposition mouse events
  dateTime.js       — date/time picker logic and event listeners
  mode.js           — mode switching and per-mode UI wiring; tracklist drawing randomiser

assets/
  Text Title.svg            — SMFM title logo (artist-image mode)
  Text Title 2.svg          — SMFM title logo (template mode)
  PAPER EFFECT.png          — paper texture overlay (multiply blend)
  Artist Image Example.jpeg — mode-card thumbnail
  SMFM art template         — mode-card thumbnail
    Example.png
  Tracklist Asset Example   — mode-card thumbnail
    .png
  Font.otf                  — CustomFont (legacy, not currently used in canvas)
  Font2.otf                 — Font2 (legacy, not currently used in canvas)
  SisterMidnight-Regular    — SisterMidnight: show name, date/time, tracklist footer
    .ttf
  FOSS-Modern-Bold.otf      — FOSSModern: tracklist track/artist text
  favicon.png
  drawings/                 — SVG illustrations for template mode and tracklist decorations
```

## Customising layout

Edit `config.json` to adjust canvas dimensions, font sizes, zoom slider ranges, and text positions — no JS changes needed.

## Exporting

Click **Export Image** to download a full 1080×1350px PNG. The canvas always renders at full resolution regardless of how it appears scaled in the browser preview.
