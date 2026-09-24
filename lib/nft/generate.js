const PALETTES = [
  ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#1a1a2e"],
  ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0"],
  ["#e9c46a", "#f4a261", "#e76f51", "#264653", "#2a9d8f"],
  ["#00f5d4", "#00bbf9", "#f15bb5", "#fee440", "#131313"],
  ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"],
  ["#8ecae6", "#219ebc", "#023047", "#ffb703", "#fb8500"],
  ["#d62828", "#f77f00", "#fcbf49", "#eae2b7", "#003049"],
  ["#370617", "#6a040f", "#9d0208", "#d00000", "#e85d04"],
  ["#0f3460", "#16213e", "#533483", "#e94560", "#f5f5f5"],
  ["#2d6a4f", "#40916c", "#52b788", "#b7e4c7", "#081c15"],
];

const SHAPES = [
  "geometric",
  "creature",
  "abstract",
  "landscape",
  "portrait",
  "pattern",
];
const ADJECTIVES = [
  "Neon",
  "Void",
  "Pixel",
  "Glitch",
  "Rare",
  "Epic",
  "Alpha",
  "Fused",
  "Dark",
  "Hyper",
];
const NOUNS = [
  "Ghost",
  "Degen",
  "Punk",
  "Ape",
  "Bot",
  "Skull",
  "Mask",
  "Orb",
  "Shade",
  "Relic",
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateNftPixels(size, palette, shape) {
  const background = palette[palette.length - 1];
  const colors = palette.slice(0, -1);
  const pixels = Array(size * size).fill(background);

  switch (shape) {
    case "geometric": {
      for (let n = 0; n < randomInt(4, 7); n += 1) {
        const color = pickRandom(colors);
        const centerX = randomInt(0, size - 1);
        const centerY = randomInt(0, size - 1);
        const radiusX = randomInt(1, Math.floor(size / 3));
        const radiusY = randomInt(1, Math.floor(size / 3));

        for (let row = 0; row < size; row += 1) {
          for (let column = 0; column < size; column += 1) {
            if (
              Math.abs(row - centerY) <= radiusY &&
              Math.abs(column - centerX) <= radiusX
            ) {
              pixels[row * size + column] = color;
            }
          }
        }
      }
      break;
    }

    case "creature": {
      const bodyColor = pickRandom(colors);
      const eyeColor =
        pickRandom(colors.filter((color) => color !== bodyColor)) || colors[0];
      const leftEyeX = Math.floor(size / 3);
      const rightEyeX = Math.floor((2 * size) / 3);
      const eyeY = Math.floor(size / 3);

      for (let row = 2; row < size - 2; row += 1) {
        for (let column = 2; column < size - 2; column += 1) {
          pixels[row * size + column] = bodyColor;
        }
      }

      for (let deltaY = -1; deltaY <= 1; deltaY += 1) {
        for (let deltaX = -1; deltaX <= 1; deltaX += 1) {
          if (
            eyeY + deltaY >= 0 &&
            eyeY + deltaY < size &&
            leftEyeX + deltaX >= 0 &&
            leftEyeX + deltaX < size
          ) {
            pixels[(eyeY + deltaY) * size + (leftEyeX + deltaX)] = eyeColor;
          }

          if (
            eyeY + deltaY >= 0 &&
            eyeY + deltaY < size &&
            rightEyeX + deltaX >= 0 &&
            rightEyeX + deltaX < size
          ) {
            pixels[(eyeY + deltaY) * size + (rightEyeX + deltaX)] = eyeColor;
          }
        }
      }

      const mouthY = Math.floor((2 * size) / 3);
      for (let column = leftEyeX; column <= rightEyeX; column += 1) {
        pixels[mouthY * size + column] = eyeColor;
      }
      break;
    }

    case "abstract": {
      for (let index = 0; index < size * size; index += 1) {
        if (Math.random() > 0.52) {
          pixels[index] = pickRandom(colors);
        }
      }

      for (let row = 0; row < size; row += 1) {
        for (let column = 0; column < size; column += 1) {
          const neighbors = [
            [row - 1, column],
            [row + 1, column],
            [row, column - 1],
            [row, column + 1],
          ];
          const filled = neighbors.filter(
            ([nextRow, nextColumn]) =>
              nextRow >= 0 &&
              nextRow < size &&
              nextColumn >= 0 &&
              nextColumn < size &&
              pixels[nextRow * size + nextColumn] !== background,
          ).length;

          if (filled > 2) {
            pixels[row * size + column] = pickRandom(colors);
          }
        }
      }
      break;
    }

    case "landscape": {
      const skyColor = pickRandom(colors);
      const groundColor =
        pickRandom(colors.filter((color) => color !== skyColor)) || colors[0];
      const sunColor =
        pickRandom(
          colors.filter((color) => color !== skyColor && color !== groundColor),
        ) || colors[0];
      const horizon = Math.floor(size * 0.45);

      for (let row = 0; row < size; row += 1) {
        for (let column = 0; column < size; column += 1) {
          pixels[row * size + column] = row < horizon ? skyColor : groundColor;
        }
      }

      const sunColumn = randomInt(2, size - 4);
      const sunRow = randomInt(1, horizon - 2);

      for (let deltaY = -2; deltaY <= 2; deltaY += 1) {
        for (let deltaX = -2; deltaX <= 2; deltaX += 1) {
          if (
            sunRow + deltaY >= 0 &&
            sunRow + deltaY < size &&
            sunColumn + deltaX >= 0 &&
            sunColumn + deltaX < size
          ) {
            pixels[(sunRow + deltaY) * size + (sunColumn + deltaX)] = sunColor;
          }
        }
      }
      break;
    }

    case "pattern": {
      const primary = pickRandom(colors);
      const secondary =
        pickRandom(colors.filter((color) => color !== primary)) || colors[0];

      for (let row = 0; row < size; row += 1) {
        for (let column = 0; column < size; column += 1) {
          pixels[row * size + column] =
            (row + column) % 2 === 0 ? primary : secondary;

          if ((row % 4 === 0 || column % 4 === 0) && Math.random() > 0.6) {
            pixels[row * size + column] = pickRandom(colors);
          }
        }
      }
      break;
    }

    default: {
      for (let index = 0; index < size * size; index += 1) {
        const row = Math.floor(index / size);
        const column = index % size;
        const value =
          Math.sin(row * 0.9) * Math.cos(column * 0.7) + Math.random() * 0.4;
        pixels[index] = value > 0.3 ? pickRandom(colors) : background;
      }
    }
  }

  return pixels;
}

export function generateNftCollection(count = 4, size = 16) {
  return Array.from({ length: count }, (_, index) => {
    const palette = pickRandom(PALETTES);
    const shape = pickRandom(SHAPES);
    const pixels = generateNftPixels(size, palette, shape);

    return {
      id: `${Date.now()}-${index}-${Math.floor(Math.random() * 100000)}`,
      name: `${pickRandom(ADJECTIVES)} ${pickRandom(NOUNS)} #${randomInt(100, 9999)}`,
      shape,
      size,
      palette,
      pixels,
    };
  });
}
