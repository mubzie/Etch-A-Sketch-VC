/* ─────────────────────────────────────────────────────────────
   Etch·A·Sketch Studio — index.js
   ───────────────────────────────────────────────────────────── */

/* ─── State ────────────────────────────────────────────────── */
let currentMode = "draw";
let isDrawing = false;
let gridSize = 16;
let canvasData = [];

/* ─── DOM References ───────────────────────────────────────── */
const canvas      = document.getElementById("pixel-canvas");
const colorPick   = document.getElementById("color-pick");
const modeLabel   = document.getElementById("mode-label");
const gridSlider  = document.getElementById("grid-size");
const gridLabel   = document.getElementById("grid-label");
const gridToggle  = document.getElementById("grid-toggle");
const saveBtn     = document.getElementById("save-btn");
const clearBtn    = document.getElementById("clear-btn");
const refreshBtn  = document.getElementById("refresh-btn");
const nftGrid     = document.getElementById("nft-grid");
const yearSpan    = document.getElementById("year");

/* ─── Init ─────────────────────────────────────────────────── */
yearSpan.textContent = new Date().getFullYear();
buildGrid(gridSize);
generateNFTs();
bindKeyboardShortcuts();

/* ═══════════════════════════════════════════════════════════
   GRID / CANVAS
   ═══════════════════════════════════════════════════════════ */

function buildGrid(size) {
  gridSize = size;
  canvasData = Array(size * size).fill("#0a0a0c");
  canvas.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  canvas.innerHTML = "";

  for (let i = 0; i < size * size; i++) {
    const px = document.createElement("div");
    px.className = "pixel";
    px.dataset.idx = i;
    px.style.backgroundColor = "#0a0a0c";
    canvas.appendChild(px);
  }

  attachDrawEvents();
}

function attachDrawEvents() {
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mouseover", onMouseOver);
  document.addEventListener("mouseup", () => { isDrawing = false; });
}

function onMouseDown(e) {
  if (e.target.classList.contains("pixel")) {
    e.preventDefault();
    isDrawing = true;
    paint(e.target);
  }
}

function onMouseOver(e) {
  if (isDrawing && e.target.classList.contains("pixel")) {
    paint(e.target);
  }
}

/* ─── Paint ────────────────────────────────────────────────── */
function paint(px) {
  const idx = parseInt(px.dataset.idx);

  switch (currentMode) {
    case "draw": {
      const color = colorPick.value;
      applyColor(idx, color);
      break;
    }
    case "erase": {
      applyColor(idx, "#0a0a0c");
      break;
    }
    case "rainbow": {
      const color = randomHex();
      applyColor(idx, color);
      break;
    }
    case "fill": {
      const target = canvasData[idx];
      const fill = colorPick.value;
      if (target !== fill) floodFill(idx, target, fill);
      break;
    }
  }
}

function applyColor(idx, color) {
  canvasData[idx] = color;
  canvas.children[idx].style.backgroundColor = color;
}

/* ─── Flood Fill (iterative, avoids stack overflow) ────────── */
function floodFill(startIdx, target, fill) {
  const stack = [startIdx];
  const visited = new Set();

  while (stack.length) {
    const idx = stack.pop();
    if (idx < 0 || idx >= gridSize * gridSize) continue;
    if (visited.has(idx)) continue;
    if (canvasData[idx] !== target) continue;

    visited.add(idx);
    applyColor(idx, fill);

    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;

    if (col > 0)               stack.push(idx - 1);
    if (col < gridSize - 1)    stack.push(idx + 1);
    if (row > 0)               stack.push(idx - gridSize);
    if (row < gridSize - 1)    stack.push(idx + gridSize);
  }
}

/* ─── Clear ────────────────────────────────────────────────── */
function clearCanvas() {
  buildGrid(gridSize);
}

/* ─── Save / Download ──────────────────────────────────────── */
function saveCanvas() {
  const scale = 20;
  const offscreen = document.createElement("canvas");
  offscreen.width  = gridSize * scale;
  offscreen.height = gridSize * scale;
  const ctx = offscreen.getContext("2d");

  canvasData.forEach((color, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    ctx.fillStyle = color;
    ctx.fillRect(col * scale, row * scale, scale, scale);
  });

  const link = document.createElement("a");
  link.download = `etch-sketch-${Date.now()}.png`;
  link.href = offscreen.toDataURL("image/png");
  link.click();
}

/* ─── Toggle Grid Lines ────────────────────────────────────── */
function toggleGrid(on) {
  canvas.classList.toggle("show-grid", on);
}

/* ─── Set Tool Mode ────────────────────────────────────────── */
function setMode(mode) {
  currentMode = mode;
  modeLabel.textContent = "● " + mode;

  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

/* ─── Keyboard Shortcuts ───────────────────────────────────── */
function bindKeyboardShortcuts() {
  const map = { d: "draw", e: "erase", f: "fill", r: "rainbow" };
  document.addEventListener("keydown", (ev) => {
    if (document.activeElement.tagName === "INPUT") return;
    const mode = map[ev.key.toLowerCase()];
    if (mode) setMode(mode);
  });
}

/* ═══════════════════════════════════════════════════════════
   NFT GENERATOR
   ═══════════════════════════════════════════════════════════ */

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

const SHAPES     = ["geometric", "creature", "abstract", "landscape", "portrait", "pattern"];
const ADJECTIVES = ["Neon", "Void", "Pixel", "Glitch", "Rare", "Epic", "Alpha", "Fused", "Dark", "Hyper"];
const NOUNS      = ["Ghost", "Degen", "Punk", "Ape", "Bot", "Skull", "Mask", "Orb", "Shade", "Relic"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randomHex() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

/* ─── Shape generators ─────────────────────────────────────── */
function generateNFTPixels(size, palette, shape) {
  const bg = palette[palette.length - 1];
  const colors = palette.slice(0, -1);
  const pixels = Array(size * size).fill(bg);

  switch (shape) {
    case "geometric": {
      for (let n = 0; n < randInt(4, 7); n++) {
        const c  = rand(colors);
        const cx = randInt(0, size - 1);
        const cy = randInt(0, size - 1);
        const rx = randInt(1, Math.floor(size / 3));
        const ry = randInt(1, Math.floor(size / 3));
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            if (Math.abs(i - cy) <= ry && Math.abs(j - cx) <= rx) {
              pixels[i * size + j] = c;
            }
          }
        }
      }
      break;
    }
    case "creature": {
      const bodyColor = rand(colors);
      const eyeColor  = rand(colors.filter(c => c !== bodyColor)) || colors[0];
      const midX = Math.floor(size / 2);
      for (let i = 2; i < size - 2; i++) {
        for (let j = 2; j < size - 2; j++) {
          pixels[i * size + j] = bodyColor;
        }
      }
      const ey  = Math.floor(size / 3);
      const ex1 = Math.floor(size / 3);
      const ex2 = Math.floor((2 * size) / 3);
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (ey+di >= 0 && ey+di < size && ex1+dj >= 0 && ex1+dj < size)
            pixels[(ey + di) * size + (ex1 + dj)] = eyeColor;
          if (ey+di >= 0 && ey+di < size && ex2+dj >= 0 && ex2+dj < size)
            pixels[(ey + di) * size + (ex2 + dj)] = eyeColor;
        }
      }
      const my = Math.floor((2 * size) / 3);
      for (let j = ex1; j <= ex2; j++) pixels[my * size + j] = eyeColor;
      break;
    }
    case "abstract": {
      for (let i = 0; i < size * size; i++) {
        if (Math.random() > 0.52) pixels[i] = rand(colors);
      }
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const neighbors = [[i-1,j],[i+1,j],[i,j-1],[i,j+1]];
          const filled = neighbors.filter(([r,c]) =>
            r >= 0 && r < size && c >= 0 && c < size && pixels[r * size + c] !== bg
          ).length;
          if (filled > 2) pixels[i * size + j] = rand(colors);
        }
      }
      break;
    }
    case "landscape": {
      const skyColor    = rand(colors);
      const groundColor = rand(colors.filter(c => c !== skyColor)) || colors[0];
      const sunColor    = rand(colors.filter(c => c !== skyColor && c !== groundColor)) || colors[0];
      const horizon     = Math.floor(size * 0.45);
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          pixels[i * size + j] = i < horizon ? skyColor : groundColor;
        }
      }
      const sc = randInt(2, size - 4);
      const sr = randInt(1, horizon - 2);
      for (let di = -2; di <= 2; di++) {
        for (let dj = -2; dj <= 2; dj++) {
          if (sr+di >= 0 && sr+di < size && sc+dj >= 0 && sc+dj < size) {
            pixels[(sr + di) * size + (sc + dj)] = sunColor;
          }
        }
      }
      break;
    }
    case "pattern": {
      const c1 = rand(colors);
      const c2 = rand(colors.filter(c => c !== c1)) || colors[0];
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          pixels[i * size + j] = (i + j) % 2 === 0 ? c1 : c2;
          if ((i % 4 === 0 || j % 4 === 0) && Math.random() > 0.6) {
            pixels[i * size + j] = rand(colors);
          }
        }
      }
      break;
    }
    default: {
      for (let i = 0; i < size * size; i++) {
        const r   = Math.floor(i / size);
        const c   = i % size;
        const val = Math.sin(r * 0.9) * Math.cos(c * 0.7) + Math.random() * 0.4;
        pixels[i] = val > 0.3 ? rand(colors) : bg;
      }
    }
  }

  return pixels;
}

/* ─── Render NFT cards ─────────────────────────────────────── */
function generateNFTs() {
  nftGrid.innerHTML = "";
  const nftSize = 16;

  for (let n = 0; n < 4; n++) {
    const palette = rand(PALETTES);
    const shape   = rand(SHAPES);
    const pixels  = generateNFTPixels(nftSize, palette, shape);
    const name    = `${rand(ADJECTIVES)} ${rand(NOUNS)} #${randInt(100, 9999)}`;

    // Render to offscreen canvas → data URL
    const offscreen = document.createElement("canvas");
    offscreen.width  = nftSize;
    offscreen.height = nftSize;
    const ctx = offscreen.getContext("2d");
    pixels.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i % nftSize, Math.floor(i / nftSize), 1, 1);
    });

    // Build card
    const card = document.createElement("div");
    card.className = "nft-card";

    const img = document.createElement("img");
    img.className = "nft-preview";
    img.src = offscreen.toDataURL();
    img.alt = name;

    const meta = document.createElement("div");
    meta.className = "nft-meta";
    meta.innerHTML = `
      <div class="nft-name">${name}</div>
      <div class="nft-tag">${shape} · ${nftSize}px</div>
    `;

    card.appendChild(img);
    card.appendChild(meta);

    // Click to load onto canvas
    card.addEventListener("click", () => {
      document.querySelectorAll(".nft-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      loadNFTToCanvas(pixels, nftSize);
    });

    nftGrid.appendChild(card);
  }
}

function loadNFTToCanvas(pixels, nftSize) {
  if (gridSize !== nftSize) {
    gridSlider.value = nftSize;
    gridLabel.textContent = `${nftSize}×${nftSize}`;
    buildGrid(nftSize);
  }
  pixels.forEach((color, i) => {
    canvasData[i] = color;
    canvas.children[i].style.backgroundColor = color;
  });
}

/* ═══════════════════════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════════════════════ */

document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

gridSlider.addEventListener("input", (e) => {
  const val = parseInt(e.target.value);
  gridLabel.textContent = `${val}×${val}`;
  buildGrid(val);
});

gridToggle.addEventListener("change", (e) => toggleGrid(e.target.checked));
saveBtn.addEventListener("click", saveCanvas);
clearBtn.addEventListener("click", clearCanvas);
refreshBtn.addEventListener("click", generateNFTs);
