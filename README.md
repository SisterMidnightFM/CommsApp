# SMFM Instagram Comms App

A browser-based tool for generating Instagram post images (1080×1350px, 4:5 aspect ratio) for Sister Midnight FM radio shows.

## What it does

- Two modes: **Artist Image** (upload a photo + SMFM branding overlay) and **SMFM Art Template** (colour + illustration-based posts)
- Upload a photo, zoom and drag to position it on the canvas
- Add show name, artist name, date/time, and show length
- Choose text/accent colour
- Export a full-resolution PNG ready to post

## How to run

Open `index.html` directly in a browser, or serve locally (e.g. `python3 -m http.server`).

No build step, no dependencies, no bundler.

## Project structure

```
index.html          — app shell and controls UI
app.js              — entry point: config loading, main event listeners
styles.css          — layout and UI styling
config.json         — all tuneable layout values (canvas size, font sizes, positions)

js/
  state.js          — shared global state (settings, canvas refs, image holders)
  canvas.js         — canvas drawing logic (redrawCanvas, fitTextToWidth, etc.)
  imageLoader.js    — image loading functions (title, paper effect, drawings, user photo)
  position.js       — image position/zoom logic and drag-to-reposition mouse events
  dateTime.js       — date/time picker logic and event listeners
  mode.js           — mode switching (Artist Image vs SMFM Template) and related listeners

assets/
  Text Title.svg        — SMFM title logo (artist-image mode)
  Text Title 2.svg      — SMFM title logo (template mode)
  PAPER EFFECT.png      — paper texture overlay (multiply blend)
  drawings/             — SVG illustrations for template mode
  Font.otf              — CustomFont (show name)
  Font2.otf             — Font2 (date/time, UI)
  favicon.png
```

## Customising layout

Edit `config.json` to adjust canvas dimensions, font sizes, zoom slider ranges, and text positions — no JS changes needed.

## Exporting

Click **Export Image** to download a full 1080×1350px PNG. The canvas always renders at full resolution regardless of how it appears scaled in the browser preview.
