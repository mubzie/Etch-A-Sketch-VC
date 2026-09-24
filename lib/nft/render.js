export function renderPixelsToDataUrl(pixels, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  pixels.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(index % size, Math.floor(index / size), 1, 1);
  });

  return canvas.toDataURL();
}
