export const CANVAS_BACKGROUND = "#0a0a0c";

export function createFilledPixels(size, color = CANVAS_BACKGROUND) {
  return Array(size * size).fill(color);
}
