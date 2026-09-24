export function setPixelColor(pixels, index, color) {
  if (pixels[index] === color) {
    return pixels;
  }

  const nextPixels = pixels.slice();
  nextPixels[index] = color;
  return nextPixels;
}

export function randomHexColor() {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}
