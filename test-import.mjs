import {
  hexToRgb,
  rgbToHex,
  nearestPaletteColor,
  RETRO_PALETTE,
  imageDataToPixels,
} from "./lib/import/imageToPixels.js";
import { CANVAS_BACKGROUND } from "./lib/editor/canvasState.js";
import { computeExportScale } from "./lib/editor/exportPng.js";

let pass = 0;
let fail = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${
      ok ? "" : `\n      got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`
    }`,
  );
};

// hexToRgb
check("hexToRgb #5a5aff", hexToRgb("#5a5aff"), { r: 90, g: 90, b: 255 });
check("hexToRgb 3-digit #f00", hexToRgb("#f00"), { r: 255, g: 0, b: 0 });
check("hexToRgb no-hash", hexToRgb("0a0a0c"), { r: 10, g: 10, b: 12 });

// rgbToHex (clamping + rounding + padding)
check("rgbToHex 90,90,255", rgbToHex(90, 90, 255), "#5a5aff");
check("rgbToHex clamps >255", rgbToHex(300, 0, 0), "#ff0000");
check("rgbToHex clamps <0", rgbToHex(-5, 0, 0), "#000000");
check("rgbToHex rounds", rgbToHex(10.6, 10.4, 12.5), "#0b0a0d");
check("rgbToHex pads zeros", rgbToHex(0, 0, 0), "#000000");

// round trip
check(
  "round-trip #123456",
  rgbToHex(...Object.values(hexToRgb("#123456"))),
  "#123456",
);

// nearestPaletteColor
const paletteRgb = RETRO_PALETTE.map(hexToRgb);
check("nearest black -> darkest", nearestPaletteColor(5, 5, 6, paletteRgb), {
  r: 10,
  g: 10,
  b: 12,
});
check("nearest white -> #ffffff", nearestPaletteColor(250, 250, 250, paletteRgb), {
  r: 255,
  g: 255,
  b: 255,
});
const nearRed = nearestPaletteColor(240, 60, 90, paletteRgb);
console.log(
  `      (240,60,90) snaps to ${rgbToHex(nearRed.r, nearRed.g, nearRed.b)}`,
);

// palette sanity
check("palette length", RETRO_PALETTE.length, 19);
check(
  "palette entries are valid hex",
  RETRO_PALETTE.every((h) => /^#[0-9a-f]{6}$/.test(h)),
  true,
);

/* ── imageDataToPixels: compositing + quantization ────────── */

// Helper: build a fake ImageData from an array of [r,g,b,a] tuples.
const fakeImageData = (rgba) => ({
  data: rgba.flat(),
  width: Math.sqrt(rgba.length),
  height: Math.sqrt(rgba.length),
});

// Opaque colors pass straight through.
check(
  "opaque red -> #ff0000",
  imageDataToPixels(fakeImageData([[255, 0, 0, 255]]), { size: 1 }),
  ["#ff0000"],
);

// Fully transparent composites to the canvas background.
check(
  "transparent -> background",
  imageDataToPixels(fakeImageData([[255, 255, 255, 0]]), { size: 1 }),
  [CANVAS_BACKGROUND],
);

// Explicit background override is respected.
check(
  "transparent -> custom background",
  imageDataToPixels(fakeImageData([[255, 255, 255, 0]]), {
    size: 1,
    background: "#ffffff",
  }),
  ["#ffffff"],
);

// 50% white over black background -> mid gray (~#7f7f80).
check(
  "50% alpha blends toward background",
  imageDataToPixels(fakeImageData([[255, 255, 255, 128]]), {
    size: 1,
    background: "#000000",
  }),
  ["#808080"],
);

// Quantization snaps to the nearest palette entry.
check(
  "quantize pure red -> nearest of black/white",
  imageDataToPixels(fakeImageData([[255, 0, 0, 255]]), {
    size: 1,
    palette: ["#000000", "#ffffff"],
  }),
  ["#000000"],
);

// Quantization with the retro palette returns a palette member.
const quantized = imageDataToPixels(
  fakeImageData([
    [12, 200, 90, 255],
    [240, 240, 240, 255],
  ]),
  { size: 2, palette: RETRO_PALETTE },
);
check(
  "quantized output only contains palette colors",
  quantized.every((c) => RETRO_PALETTE.includes(c)),
  true,
);

// Output length always matches size * size, even for partial input.
check(
  "output length = size * size",
  imageDataToPixels(
    fakeImageData([
      [1, 2, 3, 255],
      [4, 5, 6, 255],
      [7, 8, 9, 255],
      [10, 11, 12, 255],
    ]),
    { size: 2 },
  ).length,
  4,
);

/* ── Dithering ────────────────────────────────────────────── */

const uniformGray = (n, value = 128) =>
  fakeImageData(Array.from({ length: n }, () => [value, value, value, 255]));

const BW = ["#000000", "#ffffff"];

// Without dithering, a uniform mid-gray collapses to a single flat color.
const flat = imageDataToPixels(uniformGray(4), { size: 2, palette: BW });
check("no dither -> single flat color", new Set(flat).size, 1);

// With Floyd–Steinberg, the same input breaks up into a blend of both
// palette entries — that's what makes gradients readable.
const dithered = imageDataToPixels(uniformGray(4), {
  size: 2,
  palette: BW,
  dither: true,
});
check("dither -> uses more than one color", new Set(dithered).size > 1, true);
check(
  "dither output only contains palette colors",
  dithered.every((c) => BW.includes(c)),
  true,
);
check(
  "dither output has correct length",
  dithered.length,
  4,
);

// Dithering must not change anything when there's no palette to snap to.
const exact = imageDataToPixels(uniformGray(4), { size: 2, dither: true });
check("dither without palette -> exact colors", new Set(exact), new Set(["#808080"]));

// Dithering should also respect the retro palette.
const retroDithered = imageDataToPixels(uniformGray(16, 100), {
  size: 4,
  palette: RETRO_PALETTE,
  dither: true,
});
check(
  "retro dither stays within palette",
  retroDithered.every((c) => RETRO_PALETTE.includes(c)),
  true,
);

/* ── Export resolution ────────────────────────────────────── */

// A fixed per-cell scale made small grids export tiny (16×16 -> 320×320).
// The scale is now derived from a target resolution instead.
check("export scale @ grid 8", computeExportScale(8), 256);
check("export scale @ grid 16", computeExportScale(16), 128);
check("export scale @ grid 32", computeExportScale(32), 64);
check("export scale @ grid 48", computeExportScale(48), 42);
check("export scale @ grid 128", computeExportScale(128), 16);

// Every grid size should land at (or near) the 2048px target, and never
// smaller than the old fixed-scale behaviour.
const grids = [8, 12, 16, 24, 32, 48, 64, 96, 128];
const sizes = grids.map((g) => g * computeExportScale(g));
check(
  "all grids export >= 1900px",
  sizes.every((s) => s >= 1900),
  true,
);
check(
  "all grids export <= 2048px",
  sizes.every((s) => s <= 2048),
  true,
);
console.log(`      grid -> export px: ${grids.map((g, i) => `${g}:${sizes[i]}`).join(", ")}`);

// Integer scales only, so cells stay exact squares with no seams.
check(
  "all scales are integers",
  grids.every((g) => Number.isInteger(computeExportScale(g))),
  true,
);

// Guards against nonsense input.
check("export scale @ grid 0", computeExportScale(0), 1);
check("export scale @ grid -5", computeExportScale(-5), 1);
check("export scale @ NaN", computeExportScale(NaN), 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
