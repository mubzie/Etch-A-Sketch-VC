"use client";

import { useEffect, useRef, useState } from "react";
import ActionButtons from "../../components/ActionButtons";
import CanvasFooterControls from "../../components/CanvasFooterControls";
import ClearConfirm from "../../components/ClearConfirm";
import ColorPicker from "../../components/ColorPicker";
import GalleryModal from "../../components/GalleryModal";
import GridSizeSlider from "../../components/GridSizeSlider";
import ImportImageModal from "../../components/ImportImageModal";
import KeyboardHint from "../../components/KeyboardHint";
import ToolSelector from "../../components/ToolSelector";
import {
  CANVAS_BACKGROUND,
  createFilledPixels,
} from "../../lib/editor/canvasState";
import { exportPixelsAsPng } from "../../lib/editor/exportPng";
import { floodFillPixels } from "../../lib/editor/floodFill";
import { randomHexColor } from "../../lib/editor/pixelMutation";
import { Eraser, Images, PaintBucket, Pencil, Pipette, Rainbow } from "lucide-react";
import EditorCanvas from "./EditorCanvas";
import { useCanvasPointerInteraction } from "./useCanvasPointerInteraction";
import { useEditorShortcuts } from "./useEditorShortcuts";
import { useHistory } from "./useHistory";

const GRID_MIN = 8;
const GRID_MAX = 128;
const GRID_STEP = 4;
const DEFAULT_GRID_SIZE = 16;
const BRUSH_SIZES = [1, 2, 3];
/** Above this the 1px grid lines become visual noise, so we hide them. */
const DENSE_GRID_THRESHOLD = 64;

const TOOL_OPTIONS = [
  { value: "draw", label: "draw", Icon: Pencil, title: "Draw (D)" },
  { value: "erase", label: "erase", Icon: Eraser, title: "Erase (E)" },
  { value: "eyedropper", label: "pick", Icon: Pipette, title: "Eyedropper (I)" },
  { value: "fill", label: "fill", Icon: PaintBucket, title: "Fill bucket (F)" },
  { value: "rainbow", label: "rainbow", Icon: Rainbow, title: "Rainbow (R)" },
];

export default function EtchStudio() {
  const [mode, setMode] = useState("draw");
  const [color, setColor] = useState("#5a5aff");
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [showGrid, setShowGrid] = useState(true);
  const [brushSize, setBrushSize] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const {
    current: pixels,
    setCurrentState,
    beginStroke,
    replace,
    endStroke,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(() => createFilledPixels(DEFAULT_GRID_SIZE));

  // Always-fresh snapshot refs for rapid painting without stale closures.
  const pixelsRef = useRef(pixels);
  const gridSizeRef = useRef(gridSize);
  const modeRef = useRef(mode);
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);

  useEffect(() => {
    pixelsRef.current = pixels;
  }, [pixels]);
  useEffect(() => {
    gridSizeRef.current = gridSize;
  }, [gridSize]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  /* ── Painting ─────────────────────────────────────────────── */

  const applyBrush = (currentPixels, index, color, size, brush) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const startRow = Math.max(0, row - Math.floor((brush - 1) / 2));
    const endRow = Math.min(size - 1, row + Math.ceil((brush - 1) / 2));
    const startCol = Math.max(0, col - Math.floor((brush - 1) / 2));
    const endCol = Math.min(size - 1, col + Math.ceil((brush - 1) / 2));

    let next = currentPixels;
    for (let r = startRow; r <= endRow; r++) {
      for (let cc = startCol; cc <= endCol; cc++) {
        const idx = r * size + cc;
        if (next[idx] !== color) {
          if (next === currentPixels) {
            next = currentPixels.slice();
          }
          next[idx] = color;
        }
      }
    }
    return next;
  };

  const paintAtIndex = (index) => {
    const currentPixels = pixelsRef.current;
    const size = gridSizeRef.current;
    const currentMode = modeRef.current;

    let nextPixels;

    switch (currentMode) {
      case "draw":
        nextPixels = applyBrush(
          currentPixels,
          index,
          colorRef.current,
          size,
          brushSizeRef.current,
        );
        break;
      case "rainbow":
        nextPixels = applyBrush(
          currentPixels,
          index,
          randomHexColor(),
          size,
          brushSizeRef.current,
        );
        break;
      case "erase":
        nextPixels = applyBrush(
          currentPixels,
          index,
          CANVAS_BACKGROUND,
          size,
          brushSizeRef.current,
        );
        break;
      case "eyedropper": {
        const sampled = currentPixels[index];
        if (sampled !== CANVAS_BACKGROUND) {
          setColor(sampled);
        }
        setMode("draw");
        return;
      }
      case "fill": {
        const targetColor = currentPixels[index];
        if (targetColor === colorRef.current) {
          return;
        }
        nextPixels = floodFillPixels(
          currentPixels,
          index,
          targetColor,
          colorRef.current,
          size,
        );
        break;
      }
      default:
        return;
    }

    if (nextPixels !== currentPixels) {
      setCurrentState(nextPixels);
      return nextPixels;
    }
  };

  const {
    startStroke,
    continueStroke,
    endStroke: endPointerStroke,
  } = useCanvasPointerInteraction(paintAtIndex);

  const handleStrokeStart = (index, event) => {
    const mm = modeRef.current;
    // Eyedropper acts instantly and isn't a canvas edit.
    if (mm === "eyedropper") {
      paintAtIndex(index);
      return;
    }
    // Fill is a one-shot edit — give it a single undo step.
    if (mm === "fill") {
      beginStroke();
      const result = paintAtIndex(index);
      endStroke(result);
      return;
    }
    beginStroke();
    startStroke(index, event);
  };

  const handleStrokeEnd = () => {
    endPointerStroke();
    endStroke(pixelsRef.current);
  };

  /* ── Keyboard ─────────────────────────────────────────────── */

  useEditorShortcuts(setMode);

  // Undo / redo keyboard handling.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target && e.target.tagName) {
        const tag = e.target.tagName;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
          return;
        }
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  /* ── Actions ──────────────────────────────────────────────── */

  const showToast = (message) => {
    setToast(message);
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => setToast(null), 2200);
  };

  const clearCanvas = () => {
    replace(createFilledPixels(gridSizeRef.current));
    setConfirmClear(false);
    showToast("canvas cleared");
  };

  const resetCanvas = () => {
    const hasArt = pixelsRef.current.some((c) => c !== CANVAS_BACKGROUND);
    if (!hasArt) {
      clearCanvas();
      return;
    }
    setConfirmClear(true);
  };

  const handleGridSizeChange = (nextSize) => {
    if (nextSize !== gridSizeRef.current) {
      const replacement = createFilledPixels(nextSize);
      setGridSize(nextSize);
      replace(replacement);
    }
  };

  const handleSave = async () => {
    const { width } = await exportPixelsAsPng(
      pixelsRef.current,
      gridSizeRef.current,
    );
    showToast(`png downloaded · ${width}×${width}`);
  };

  const handleSelectArtwork = (artwork) => {
    if (artwork.size !== gridSizeRef.current) {
      setGridSize(artwork.size);
    }
    replace(artwork.pixels.slice());
    setGalleryOpen(false);
    showToast(`loaded "${artwork.name}"`);
  };

  const handleImportImage = (result) => {
    if (result.size !== gridSizeRef.current) {
      setGridSize(result.size);
    }
    replace(result.pixels.slice());
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Etch·A·Sketch</h1>
        <span className="header-sub">studio</span>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <ToolSelector
            label="Tools"
            options={TOOL_OPTIONS}
            value={mode}
            onChange={setMode}
          />
          <ColorPicker label="Primary" value={color} onChange={setColor} />
          <div className="panel">
            <p className="panel-label">Brush size</p>
            <div className="brush-row">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`brush-dot-btn${
                    brushSize === size ? " active" : ""
                  }`}
                  onClick={() => setBrushSize(size)}
                  title={`${size}×${size}`}
                >
                  <span
                    className="brush-dot"
                    style={{ width: 6 * size + 4, height: 6 * size + 4 }}
                  />
                </button>
              ))}
            </div>
          </div>
          <GridSizeSlider
            value={gridSize}
            min={GRID_MIN}
            max={GRID_MAX}
            step={GRID_STEP}
            onChange={handleGridSizeChange}
          />
          <ActionButtons
            onSave={handleSave}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onClear={resetCanvas}
            onImport={() => setImportOpen(true)}
          />
          <KeyboardHint />
        </aside>

        <main className="main-area">
          <ActionButtons
            onSave={handleSave}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onClear={resetCanvas}
            onImport={() => setImportOpen(true)}
            className="mobile-actions"
            showClear={false}
          />

          <div className="canvas-wrap">
            <EditorCanvas
              pixels={pixels}
              gridSize={gridSize}
              showGrid={showGrid}
              dense={gridSize > DENSE_GRID_THRESHOLD}
              onPointerDown={handleStrokeStart}
              onPointerEnter={continueStroke}
              onPointerLeave={handleStrokeEnd}
            />
            <CanvasFooterControls
              showGrid={showGrid}
              onToggleGrid={setShowGrid}
              modeLabel={mode}
            />
            {confirmClear && (
              <ClearConfirm
                onConfirm={clearCanvas}
                onCancel={() => setConfirmClear(false)}
              />
            )}
          </div>
        </main>
      </div>

      <footer className="footer">
        <p>copyright &copy; {new Date().getFullYear()} mubzie</p>
      </footer>

      <button
        type="button"
        className="gallery-fab"
        onClick={() => setGalleryOpen(true)}
        title="Browse NFT gallery"
      >
        <Images className="fab-icon" strokeWidth={2} />
        NFT
      </button>

      {galleryOpen && (
        <GalleryModal
          onClose={() => setGalleryOpen(false)}
          onSelectArtwork={handleSelectArtwork}
        />
      )}

      {importOpen && (
        <ImportImageModal
          gridSize={gridSize}
          onImport={handleImportImage}
          onNotify={showToast}
          onClose={() => setImportOpen(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
