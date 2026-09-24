"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import {
  imageToPixels,
  loadImageFromFile,
  loadImageFromUrl,
  RETRO_PALETTE,
} from "../lib/import/imageToPixels";
import { renderPixelsToDataUrl } from "../lib/nft/render";

export default function ImportImageModal({
  gridSize,
  onImport,
  onClose,
  onNotify,
}) {
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [limitColors, setLimitColors] = useState(false);
  const [dither, setDither] = useState(false);
  const [crisp, setCrisp] = useState(false);
  const [fit, setFit] = useState("cover");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Recompute the converted pixels whenever the image, options, or grid change.
  const { result, convertError } = useMemo(() => {
    if (!sourceImage) {
      return { result: null, convertError: "" };
    }

    try {
      return {
        result: imageToPixels(sourceImage, {
          size: gridSize,
          palette: limitColors ? RETRO_PALETTE : null,
          dither: limitColors && dither,
          fit,
          smoothing: !crisp,
        }),
        convertError: "",
      };
    } catch (err) {
      return { result: null, convertError: err.message };
    }
  }, [sourceImage, gridSize, limitColors, dither, crisp, fit]);

  const shownError = error || convertError;

  const previewUrl = useMemo(
    () => (result ? renderPixelsToDataUrl(result.pixels, result.size) : null),
    [result],
  );

  const handleFile = async (file) => {
    if (!file) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const image = await loadImageFromFile(file);
      setSourceImage(image);
      setSourceLabel(file.name);
    } catch (err) {
      setSourceImage(null);
      setSourceLabel("");
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUrlLoad = async () => {
    const url = urlInput.trim();
    if (!url) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const image = await loadImageFromUrl(url);
      setSourceImage(image);
      setSourceLabel(url);
    } catch (err) {
      setSourceImage(null);
      setSourceLabel("");
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleConfirm = () => {
    if (!result) {
      return;
    }
    onImport(result);
    onNotify?.(`imported "${sourceLabel}"`);
    onClose();
  };

  return (
    <div className="import-overlay" onClick={onClose}>
      <div
        className="import-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Import image"
      >
        <div className="import-head">
          <span className="panel-label" style={{ marginBottom: 0 }}>
            Import image → canvas
          </span>
          <button
            type="button"
            className="gallery-close"
            onClick={onClose}
            aria-label="Close import"
          >
            <X strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="import-body">
          <div className="import-source">
            <div
              className={`drop-zone${dragging ? " dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="drop-icon" strokeWidth={1.5} aria-hidden="true" />
              <span className="drop-text">
                drop an image here, or click to choose a file
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  // Allow re-selecting the same file.
                  e.target.value = "";
                }}
              />
            </div>

            <div className="import-divider">
              <span>or paste an image URL</span>
            </div>

            <div className="url-row">
              <input
                type="url"
                className="url-input"
                placeholder="https://…/artwork.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUrlLoad();
                  }
                }}
              />
              <button
                type="button"
                className="action-btn"
                onClick={handleUrlLoad}
                disabled={busy || !urlInput.trim()}
              >
                load
              </button>
            </div>

            <div className="import-options">
              <div className="import-field">
                <span className="import-field-label">non-square images</span>
                <div className="segmented">
                  <button
                    type="button"
                    className={`segmented-btn${fit === "cover" ? " active" : ""}`}
                    onClick={() => setFit("cover")}
                    title="Center-crop to a square (keeps proportions)"
                  >
                    crop
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn${fit === "stretch" ? " active" : ""}`}
                    onClick={() => setFit("stretch")}
                    title="Squash the whole image to fit (keeps everything)"
                  >
                    stretch
                  </button>
                </div>
              </div>

              <label className="import-check">
                <input
                  type="checkbox"
                  checked={limitColors}
                  onChange={(e) => setLimitColors(e.target.checked)}
                />
                limit colors (retro palette)
              </label>

              <label
                className={`import-check${limitColors ? "" : " disabled"}`}
                title={
                  limitColors
                    ? "Spread quantization error for smoother gradients"
                    : "Turn on “limit colors” first"
                }
              >
                <input
                  type="checkbox"
                  checked={dither && limitColors}
                  disabled={!limitColors}
                  onChange={(e) => setDither(e.target.checked)}
                />
                dither (smoother gradients)
              </label>

              <label className="import-check">
                <input
                  type="checkbox"
                  checked={crisp}
                  onChange={(e) => setCrisp(e.target.checked)}
                />
                crisp (nearest-neighbour)
              </label>
            </div>
          </div>

          <div className="import-preview">
            <p className="panel-label">
              {gridSize}×{gridSize} preview
            </p>
            <div className="preview-frame">
              {previewUrl ? (
                <img
                  className="preview-img"
                  src={previewUrl}
                  alt="Converted preview"
                />
              ) : (
                <span className="preview-empty">
                  {busy ? "loading…" : "no image yet"}
                </span>
              )}
            </div>
            {sourceLabel ? (
              <p className="preview-source" title={sourceLabel}>
                {sourceLabel}
              </p>
            ) : null}
            <p className="preview-hint">
              {gridSize >= 96
                ? "high detail"
                : gridSize >= 48
                  ? "raise the grid for more detail"
                  : "low grid — raise it to keep detail"}
            </p>
          </div>
        </div>

        {shownError ? <p className="import-error">{shownError}</p> : null}

        <div className="import-actions">
          <button
            type="button"
            className="action-btn save"
            onClick={handleConfirm}
            disabled={!result || busy}
          >
            ✎ draw on canvas
          </button>
          <button type="button" className="action-btn" onClick={onClose}>
            cancel
          </button>
        </div>
      </div>
    </div>
  );
}
