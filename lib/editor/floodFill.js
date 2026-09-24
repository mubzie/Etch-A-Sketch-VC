export function floodFillPixels(
  pixels,
  startIndex,
  targetColor,
  fillColor,
  gridSize,
) {
  if (targetColor === fillColor) {
    return pixels;
  }

  const nextPixels = pixels.slice();
  const stack = [startIndex];
  const visited = new Set();

  while (stack.length > 0) {
    const index = stack.pop();

    if (index < 0 || index >= nextPixels.length) {
      continue;
    }

    if (visited.has(index)) {
      continue;
    }

    if (nextPixels[index] !== targetColor) {
      continue;
    }

    visited.add(index);
    nextPixels[index] = fillColor;

    const row = Math.floor(index / gridSize);
    const column = index % gridSize;

    if (column > 0) {
      stack.push(index - 1);
    }

    if (column < gridSize - 1) {
      stack.push(index + 1);
    }

    if (row > 0) {
      stack.push(index - gridSize);
    }

    if (row < gridSize - 1) {
      stack.push(index + gridSize);
    }
  }

  return nextPixels;
}
