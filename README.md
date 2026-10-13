# Etch·A·Sketch Studio

A modular pixel-art sketch pad for the browser — draw, erase, flood-fill, import real images, and export print-ready PNGs. Ships with a generator that invents procedural "pixel NFT" artwork you can preview and load straight onto the canvas.

Built with Next.js 15 (App Router) and React 19. No canvas framework, no state library — the drawing surface is just a flat array of hex colors rendered through CSS Grid.

**Live repo:** `git@github.com:mubzie/Etch-A-Sketch-VC.git`

---

## Features

### Drawing
- **Five tools** — draw, erase, eyedropper (colour picker), flood fill, and rainbow (random colour per cell).
- **Brush sizes** — 1×1, 2×2, 3×3 with edge-clamped application so brushes never wrap rows.
- **Grid sizes** — 8×8 up to 128×128 in steps of 4 (up to 16,384 cells). Grid lines auto-hide above 64×64 where they become visual noise.
- **Native colour picker** plus a `randomHexColor()` helper for rainbow mode.

### Editing
- **Stroke-aware undo/redo** — an entire drag is one undo step, not one per cell. History holds the last 100 steps.
- **Guarded destructive actions** — clearing a canvas that actually has artwork asks for confirmation.
- **Toast notifications** for download, load, and clear events, with timer cleanup so messages never leak between actions.

### Import
- Import from a **file** (click or drag-and-drop), a **URL**, or a bundled sample image.
- **Fit modes** — `cover` (crop to square) or `stretch` (squash to fit).
- **Retro palette quantisation** — snap to a 19-colour high-contrast palette for deliberate pixel-art output.
- **Floyd–Steinberg dithering** — approximates gradients and shading through error diffusion across neighbouring cells.
- **Crisp mode** — nearest-neighbour sampling instead of smooth downscaling.
- Live preview at the target grid size, with resolution-aware warnings for dense grids.

### Export
- **PNG download** at a consistent ~2048px target resolution, decoupled from grid size.
- Integer px-per-cell scaling only, so every cell stays an exact square with no seams or half-pixel resampling.
- Both a 16×16 and a 128×128 canvas export at 2048×2048 (128px and 16px per cell respectively); non-divisor sizes land just under the target, e.g. 12×12 at 2040×2040.

### NFT Gallery
- Procedurally generates collections from 10 curated palettes across 6 shape archetypes: `geometric`, `creature`, `abstract`, `landscape`, `portrait`, `pattern`.
- Randomised names (`Neon Punk`, `Void Skull`, `Hyper Ghost`, …) with shape and size metadata.
- Refresh to roll a new collection; select any card to load it onto the canvas at its native size, ready to edit.

### Interface
- Dark, phone-friendly layout with a desktop sidebar and a mobile action bar.
- Touch drawing works via `pointerrelease` handling, so a drag across cells paints continuously on phones and tablets.
- Keyboard shortcuts are disabled while a modal is open and never fire from inside inputs.

---

## Keyboard Shortcuts

| Keys | Action |
| --- | --- |
| `D` | Draw |
| `E` | Erase |
| `I` | Eyedropper |
| `F` | Fill bucket |
| `R` | Rainbow |
| `Ctrl/⌘ + Z` | Undo |
| `Ctrl/⌘ + Shift + Z` | Redo |
| `Ctrl/⌘ + Y` | Redo (alias) |
| `Esc` | Close the gallery or import modal |

---

## Getting Started

Requires **Node.js 18+** (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:3000
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm test` | Run the pure-logic test suites |

`npm test` runs `test-import.mjs` and `test-history.mjs` — dependency-free Node scripts that exercise the colour math, image-to-pixel conversion, export scaling, flood fill, history engine, and keyboard shortcut logic. No test framework required.

---

## Project Structure

```
app/                      Next.js App Router entry
  layout.js               Root layout, fonts, metadata
  page.js                 Renders <EtchStudio />
  globals.css             All styling (CSS custom properties, responsive)
components/               Presentational UI, no editor logic
  ActionButtons.js        undo / redo / import / download / clear
  ColorPicker.js          Native colour input
  GridSizeSlider.js       8–128 range control
  ToolSelector.js         Tool button grid
  BrushSize / CanvasFooterControls / KeyboardHint / ClearConfirm
  GalleryModal.js         NFT gallery overlay
  ImportImageModal.js     Import dialog: URL, file, drop, preview, options
features/                 Feature-scoped stateful modules
  editor/
    EtchStudio.js         The editor: state, painting, actions, shortcuts
    EditorCanvas.js       Memoised CSS Grid of pixel cells
    useCanvasPointerInteraction.js
    useEditorShortcuts.js
    useHistory.js
  gallery/
    NftGallery.js         Generates a collection, builds previews
    NftCard.js            Preview + metadata card
    NftGalleryHeader.js
lib/                      Pure, framework-free, unit-testable logic
  editor/
    canvasState.js        Background colour, createFilledPixels()
    pixelMutation.js      Immutable pixel writes, random colours
    floodFill.js          Iterative flood fill with visited set
    exportPng.js          Scale computation, canvas render, download
    keyboardShortcuts.js  Shortcut map + input-guard predicate
  import/
    imageToPixels.js      Decode → rasterize → quantise → dither
  nft/
    generate.js           Palettes, shapes, collection generator
    render.js             Pixels → data URL preview
legacy/                   Original vanilla HTML/CSS/JS version
test-import.mjs           Colour + import + export tests
test-history.mjs          History, flood fill, shortcut tests
```

The split is deliberate: `lib/` has no React or DOM dependence (except where it must touch `document` for export/preview), so its logic is testable in plain Node. `features/` owns state and behaviour. `components/` stays presentational.

---

## Architecture Notes

**Pixels are a flat array.** The canvas is `Array(size * size)` of hex strings in row-major order. Index `i` maps to `row = Math.floor(i / size)` and `col = i % size`. Everything — painting, filling, importing, exporting, NFT generation — speaks this one representation, which is why the modules compose so easily.

**Strokes, not cells, are undo steps.** `useHistory` exposes `beginStroke()` / `setCurrentState()` / `endStroke()`. The pre-stroke snapshot is captured on pointer-down and only committed to the undo stack if the stroke actually changed the canvas. One-shot operations (fill, clear, resize, import) call `replace()` and become a single step. A 100-step ring keeps memory bounded.

**Refs keep fast painting free of stale closures.** `EtchStudio` mirrors `pixels`, `gridSize`, `mode`, `color`, and `brushSize` into refs so rapid pointer events always read current values without re-binding handlers on every render.

**Pixel cells are memoised.** At 128×128 there are 16,384 DOM nodes, so each `Pixel` is wrapped in `memo`, and its handlers are stabilised through refs. Painting one cell does not re-render the other 16,383.

**Export resolution is independent of grid size.** `computeExportScale()` finds the largest integer scale that stays within a ~2048px target, then renders cell-by-cell with image smoothing disabled.

---

## Legacy Version

`legacy/` holds the original single-file vanilla implementation (`index.html`, `index.js`, `style.css`) that this project replaced. It is kept for reference only and is not part of the build — the Next.js app in `app/`, `components/`, and `features/` is the current codebase.

---

## License

No license file is included. Copyright © mubzie.
