import { CANVAS_BACKGROUND } from "../editor/canvasState.js";

/**
 * Image → pixel-array conversion for importing sample artwork onto the canvas.
 *
 * The editor's canvas is just a flat array of hex colors (row-major, length
 * size * size), so importing an image means: decode it, downscale it to the
 * grid, and read back each cell's color.
 */

/**
 * A compact, high-contrast palette used when the user opts to "limit colors".
 * Snapping a photo or detailed artwork into these produces a deliberate,
 * retro pixel-art look instead of muddy 256-cell noise.
 */
export const RETRO_PALETTE = [
  "#0a0a0c",
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#7209b7",
  "#e94560",
  "#f72585",
  "#f77f00",
  "#fcbf49",
  "#ffd93d",
  "#eae2b7",
  "#2a9d8f",
  "#52b788",
  "#b7e4c7",
  "#4cc9f0",
  "#4d96ff",
  "#ffffff",
  "#999999",
];

/* ── Color helpers ────────────────────────────────────────── */

export function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Nearest palette color by squared Euclidean distance in RGB. */
export function nearestPaletteColor(r, g, b, paletteRgb) {
  let best = paletteRgb[0];
  let bestDistance = Infinity;

  for (const color of paletteRgb) {
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;
    const distance = dr * dr + dg * dg + db * db;

    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }

  return best;
}

/* ── Image loading ────────────────────────────────────────── */

/**
 * Load an image from a URL. `crossOrigin = "anonymous"` is set so the canvas
 * stays readable (untainted) when the host sends permissive CORS headers.
 */
export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "Couldn't load that image. Check the URL, or the host may block cross-origin access.",
        ),
      );

    image.src = url;
  });
}

/** Load an image from a user-selected File, cleaning up the object URL. */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("That file doesn't look like an image."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read that image file."));
    };

    image.src = objectUrl;
  });
}

/* ── Rasterization ────────────────────────────────────────── */

/** Cap the intermediate canvas so huge sources can't blow up memory. */
const MAX_STAGE = 2048;

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas, smoothing) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = smoothing;
  context.imageSmoothingQuality = "high";
  return context;
}

/**
 * Downscale an image to `size × size` and read the pixels back.
 *
 * `fit`:
 *   - "cover"   (default) center-crops to a square, preserving aspect ratio
 *   - "stretch" squashes the whole image into the square
 *
 * `smoothing: false` uses nearest-neighbour, which keeps crisp pixel art.
 *
 * When smoothing, we halve the image repeatedly rather than asking the
 * browser to jump straight from (say) 2000px to 48px in one step. A single
 * huge downscale samples the source too sparsely and aliases badly; stepping
 * down in halves approximates a proper area-average and keeps edges clean.
 */
function rasterize(image, size, { fit = "cover", smoothing = true } = {}) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  // The region of the source we actually sample from.
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (fit === "cover") {
    const side = Math.min(sourceWidth, sourceHeight);
    sx = (sourceWidth - side) / 2;
    sy = (sourceHeight - side) / 2;
    sw = side;
    sh = side;
  }

  const target = createCanvas(size, size);
  const targetContext = context2d(target, smoothing);

  if (!smoothing) {
    // Nearest-neighbour: sample straight from the source, no intermediate
    // blurring, so hard-edged artwork stays hard-edged.
    targetContext.drawImage(image, sx, sy, sw, sh, 0, 0, size, size);
  } else {
    // Step 1: lift the source region onto a bounded intermediate canvas.
    const stageScale = Math.min(1, MAX_STAGE / Math.max(sw, sh));
    let stage = createCanvas(
      Math.max(1, Math.round(sw * stageScale)),
      Math.max(1, Math.round(sh * stageScale)),
    );
    context2d(stage, true).drawImage(image, sx, sy, sw, sh, 0, 0, stage.width, stage.height);

    // Step 2: halve repeatedly until we're within 2× of the target.
    while (stage.width > size * 2 && stage.height > size * 2) {
      const nextWidth = Math.max(size, Math.round(stage.width / 2));
      const nextHeight = Math.max(size, Math.round(stage.height / 2));

      if (nextWidth >= stage.width && nextHeight >= stage.height) {
        break;
      }

      const next = createCanvas(nextWidth, nextHeight);
      context2d(next, true).drawImage(
        stage,
        0,
        0,
        stage.width,
        stage.height,
        0,
        0,
        nextWidth,
        nextHeight,
      );
      stage = next;
    }

    // Step 3: final, gentle draw into the grid.
    targetContext.drawImage(stage, 0, 0, stage.width, stage.height, 0, 0, size, size);
  }

  try {
    return targetContext.getImageData(0, 0, size, size);
  } catch {
    throw new Error(
      "This image blocked pixel access (CORS). Try uploading the file instead of linking it.",
    );
  }
}

/**
 * Pure color-mapping step: turn raw RGBA pixel data into hex colors.
 *
 * Transparent pixels are composited onto `background`, and an optional
 * `palette` snaps each result to its nearest palette entry so the output
 * reads as deliberate pixel art rather than muddy noise.
 *
 * With `dither: true` the palette snapping uses Floyd–Steinberg error
 * diffusion, which approximates gradients and shading far better than flat
 * nearest-color snapping.
 *
 * Kept separate from the canvas work so it can be unit-tested.
 */
export function imageDataToPixels(imageData, options = {}) {
  const {
    size = 16,
    background = CANVAS_BACKGROUND,
    palette = null,
    dither = false,
  } = options;

  const { data } = imageData;
  const backgroundRgb = hexToRgb(background);
  const paletteRgb = palette ? palette.map(hexToRgb) : null;

  const pixelCount = size * size;

  // Composite onto the background first, into a float buffer. Working in
  // floats matters for dithering: quantization error is carried to
  // neighbouring cells and would be lost on 8-bit integers.
  const buffer = new Float32Array(pixelCount * 3);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const alpha = data[offset + 3] / 255;

    buffer[i * 3] = data[offset] * alpha + backgroundRgb.r * (1 - alpha);
    buffer[i * 3 + 1] = data[offset + 1] * alpha + backgroundRgb.g * (1 - alpha);
    buffer[i * 3 + 2] = data[offset + 2] * alpha + backgroundRgb.b * (1 - alpha);
  }

  const pixels = new Array(pixelCount);

  // No palette: keep the exact composited color.
  if (!paletteRgb) {
    for (let i = 0; i < pixelCount; i++) {
      pixels[i] = rgbToHex(buffer[i * 3], buffer[i * 3 + 1], buffer[i * 3 + 2]);
    }
    return pixels;
  }

  // Palette without dithering: snap each cell to its nearest entry.
  if (!dither) {
    for (let i = 0; i < pixelCount; i++) {
      const nearest = nearestPaletteColor(
        buffer[i * 3],
        buffer[i * 3 + 1],
        buffer[i * 3 + 2],
        paletteRgb,
      );
      pixels[i] = rgbToHex(nearest.r, nearest.g, nearest.b);
    }
    return pixels;
  }

  // Floyd–Steinberg error diffusion. Spreading the quantization error across
  // neighbours lets a small palette approximate gradients and shading far
  // more convincingly than flat nearest-color snapping.
  const distribute = (x, y, weight, error) => {
    if (x < 0 || x >= size || y < 0 || y >= size) {
      return;
    }
    const at = (y * size + x) * 3;
    buffer[at] += error[0] * weight;
    buffer[at + 1] += error[1] * weight;
    buffer[at + 2] += error[2] * weight;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const r = buffer[i * 3];
      const g = buffer[i * 3 + 1];
      const b = buffer[i * 3 + 2];

      const nearest = nearestPaletteColor(r, g, b, paletteRgb);
      pixels[i] = rgbToHex(nearest.r, nearest.g, nearest.b);

      const error = [r - nearest.r, g - nearest.g, b - nearest.b];

      distribute(x + 1, y, 7 / 16, error);
      distribute(x - 1, y + 1, 3 / 16, error);
      distribute(x, y + 1, 5 / 16, error);
      distribute(x + 1, y + 1, 1 / 16, error);
    }
  }

  return pixels;
}

/**
 * Convert a decoded image into a flat pixel array.
 *
 * Options:
 *   - size       grid dimension (defaults to 16)
 *   - background hex used to composite transparent pixels (default canvas bg)
 *   - palette    optional array of hex colors to quantize into
 *   - dither     boolean, Floyd–Steinberg error diffusion (needs a palette)
 *   - fit        "cover" | "stretch"
 *   - smoothing  boolean (false = nearest neighbour)
 *
 * Returns { pixels, size }.
 */
export function imageToPixels(image, options = {}) {
  const {
    size = 16,
    background = CANVAS_BACKGROUND,
    palette = null,
    dither = false,
    fit = "cover",
    smoothing = true,
  } = options;

  const imageData = rasterize(image, size, { fit, smoothing });

  return {
    pixels: imageDataToPixels(imageData, {
      size,
      background,
      palette,
      // Dithering only means anything when we're snapping to a palette.
      dither: dither && Boolean(palette),
    }),
    size,
  };
}

/**
 * Convenience wrapper: load (from File or URL) + convert in one call.
 */
export async function importImage(source, options = {}) {
  const image =
    typeof source === "string"
      ? await loadImageFromUrl(source)
      : await loadImageFromFile(source);

  return imageToPixels(image, options);
}
