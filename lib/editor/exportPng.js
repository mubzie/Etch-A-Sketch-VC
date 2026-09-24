/**
 * PNG export.
 *
 * The export resolution is deliberately decoupled from the grid size. Using a
 * fixed per-cell scale means a 16×16 canvas exports at 320×320 — smaller than
 * the editor renders it on screen, so the file looks soft. Instead we aim for
 * a consistent target resolution and derive an integer scale from it.
 */

const DEFAULT_TARGET_SIZE = 2048;
const MAX_SCALE = 256;

/**
 * Largest integer scale (px per cell) that keeps the export within
 * `targetSize`. Integer scales keep every cell an exact square, so there are
 * no seams or half-pixel resampling.
 */
export function computeExportScale(
  gridSize,
  targetSize = DEFAULT_TARGET_SIZE,
  maxScale = MAX_SCALE,
) {
  if (!Number.isFinite(gridSize) || gridSize <= 0) {
    return 1;
  }

  return Math.max(1, Math.min(maxScale, Math.floor(targetSize / gridSize)));
}

/**
 * Render the pixel array to a canvas at export resolution.
 * Exported separately from the download so it can be reasoned about/tested.
 */
export function renderPixelsToCanvas(pixels, gridSize, options = {}) {
  const { targetSize = DEFAULT_TARGET_SIZE } = options;
  const scale = computeExportScale(gridSize, targetSize);

  const canvas = document.createElement("canvas");
  canvas.width = gridSize * scale;
  canvas.height = gridSize * scale;

  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;

  for (let index = 0; index < pixels.length; index++) {
    const row = Math.floor(index / gridSize);
    const column = index % gridSize;
    context.fillStyle = pixels[index];
    context.fillRect(column * scale, row * scale, scale, scale);
  }

  return { canvas, scale };
}

/**
 * Export the canvas as a downloadable PNG.
 * Resolves with { width, height, scale } once the download is triggered.
 */
export function exportPixelsAsPng(pixels, gridSize, options = {}) {
  const { filename, targetSize = DEFAULT_TARGET_SIZE } = options;
  const { canvas, scale } = renderPixelsToCanvas(pixels, gridSize, {
    targetSize,
  });

  const name = filename ?? `etch-sketch-${Date.now()}.png`;

  return new Promise((resolve) => {
    const triggerDownload = (href, revoke) => {
      const link = document.createElement("a");
      link.download = name;
      link.href = href;
      link.click();

      if (revoke) {
        // Give the browser a moment to start the download before releasing
        // the object URL, otherwise some browsers cancel it.
        setTimeout(() => URL.revokeObjectURL(href), 1000);
      }

      resolve({ width: canvas.width, height: canvas.height, scale });
    };

    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => {
        if (blob) {
          triggerDownload(URL.createObjectURL(blob), true);
        } else {
          triggerDownload(canvas.toDataURL("image/png"), false);
        }
      }, "image/png");
    } else {
      triggerDownload(canvas.toDataURL("image/png"), false);
    }
  });
}
