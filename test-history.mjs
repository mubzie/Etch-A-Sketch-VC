import { createFilledPixels, CANVAS_BACKGROUND } from "./lib/editor/canvasState.js";
import { floodFillPixels } from "./lib/editor/floodFill.js";
import {
  getModeFromShortcut,
  shouldIgnoreShortcut,
} from "./lib/editor/keyboardShortcuts.js";

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

/* ── History engine simulation (matching useHistory + useCanvasPointerInteraction) ── */

function createHistoryEngine(initialState) {
  let current = initialState;
  const past = [];
  const future = [];
  let strokeStart = null;

  return {
    getCurrent: () => current,
    setCurrent: (next) => {
      current = next;
    },
    beginStroke: () => {
      strokeStart = current;
      future.length = 0;
    },
    endStroke: (finalState) => {
      const start = strokeStart;
      if (start != null && finalState != null && finalState !== start) {
        past.push(start);
      }
      strokeStart = null;
    },
    undo: () => {
      if (past.length === 0) return null;
      const previous = past.pop();
      future.unshift(current);
      current = previous;
      return previous;
    },
    redo: () => {
      if (future.length === 0) return null;
      const next = future.shift();
      past.push(current);
      current = next;
      return next;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}

// Test 1: Single stroke commit on pointer up
const engine = createHistoryEngine(createFilledPixels(4));
check("initial canUndo is false", engine.canUndo(), false);

engine.beginStroke();
const painted1 = engine.getCurrent().slice();
painted1[0] = "#ff0000";
engine.setCurrent(painted1);

// Now pointerup finishes the stroke and commits it
engine.endStroke(painted1);

check("canUndo is true after pointerup", engine.canUndo(), true);
check("current pixel 0 is red", engine.getCurrent()[0], "#ff0000");

// Undo reverts to initial canvas
const undone1 = engine.undo();
check("undo reverts pixel 0 to background", undone1[0], CANVAS_BACKGROUND);
check("current is back to background", engine.getCurrent()[0], CANVAS_BACKGROUND);
check("canRedo is true", engine.canRedo(), true);

// Redo brings red back
const redone1 = engine.redo();
check("redo brings back red", redone1[0], "#ff0000");
check("current is back to red", engine.getCurrent()[0], "#ff0000");

// Test 2: Multiple strokes in succession
const multiEngine = createHistoryEngine(createFilledPixels(4));

// Stroke 1: paint pixel 0
multiEngine.beginStroke();
let state = multiEngine.getCurrent().slice();
state[0] = "#111111";
multiEngine.setCurrent(state);
multiEngine.endStroke(state);

// Stroke 2: paint pixel 1 without leaving canvas
multiEngine.beginStroke();
state = multiEngine.getCurrent().slice();
state[1] = "#222222";
multiEngine.setCurrent(state);
multiEngine.endStroke(state);

// Stroke 3: paint pixel 2
multiEngine.beginStroke();
state = multiEngine.getCurrent().slice();
state[2] = "#333333";
multiEngine.setCurrent(state);
multiEngine.endStroke(state);

check("all 3 strokes painted", multiEngine.getCurrent().slice(0, 3), [
  "#111111",
  "#222222",
  "#333333",
]);

// Undo stroke 3
multiEngine.undo();
check("undo 1 reverts pixel 2", multiEngine.getCurrent()[2], CANVAS_BACKGROUND);
check("pixel 1 is still painted", multiEngine.getCurrent()[1], "#222222");

// Undo stroke 2
multiEngine.undo();
check("undo 2 reverts pixel 1", multiEngine.getCurrent()[1], CANVAS_BACKGROUND);
check("pixel 0 is still painted", multiEngine.getCurrent()[0], "#111111");

// Undo stroke 1
multiEngine.undo();
check("undo 3 reverts pixel 0", multiEngine.getCurrent()[0], CANVAS_BACKGROUND);
check("canUndo is now false", multiEngine.canUndo(), false);

/* ── Flood Fill Tests ── */

const fillPixels = createFilledPixels(4); // 4x4 grid of CANVAS_BACKGROUND
const filled = floodFillPixels(
  fillPixels,
  0,
  CANVAS_BACKGROUND,
  "#00ff00",
  4,
);
check(
  "floodFill fills entire uniform grid",
  filled.every((c) => c === "#00ff00"),
  true,
);

// Flood fill with boundary
const walledPixels = createFilledPixels(4);
// Put a horizontal wall across row 2 (indices 8, 9, 10, 11)
for (let c = 8; c <= 11; c++) walledPixels[c] = "#ffffff";
const halfFilled = floodFillPixels(
  walledPixels,
  0,
  CANVAS_BACKGROUND,
  "#ff00ff",
  4,
);
check("top half filled", halfFilled[0], "#ff00ff");
check("top half row 1 filled", halfFilled[7], "#ff00ff");
check("wall remains unchanged", halfFilled[8], "#ffffff");
check("bottom half untouched", halfFilled[12], CANVAS_BACKGROUND);

// Flood fill same color returns same array
const same = floodFillPixels(walledPixels, 0, CANVAS_BACKGROUND, CANVAS_BACKGROUND, 4);
check("floodFill same color is no-op", same === walledPixels, true);

/* ── Keyboard Shortcuts Tests ── */

check("shortcut d -> draw", getModeFromShortcut("d"), "draw");
check("shortcut D (uppercase) -> draw", getModeFromShortcut("D"), "draw");
check("shortcut e -> erase", getModeFromShortcut("e"), "erase");
check("shortcut i -> eyedropper", getModeFromShortcut("i"), "eyedropper");
check("shortcut f -> fill", getModeFromShortcut("f"), "fill");
check("shortcut r -> rainbow", getModeFromShortcut("r"), "rainbow");
check("shortcut unknown -> null", getModeFromShortcut("x"), null);

check(
  "ignore shortcut in INPUT",
  shouldIgnoreShortcut({ tagName: "INPUT" }),
  true,
);
check(
  "ignore shortcut in TEXTAREA",
  shouldIgnoreShortcut({ tagName: "TEXTAREA" }),
  true,
);
check(
  "ignore shortcut in SELECT",
  shouldIgnoreShortcut({ tagName: "SELECT" }),
  true,
);
check(
  "ignore shortcut in contentEditable",
  shouldIgnoreShortcut({ tagName: "DIV", isContentEditable: true }),
  true,
);
check(
  "allow shortcut in button or body",
  shouldIgnoreShortcut({ tagName: "BUTTON" }),
  false,
);
check(
  "allow shortcut when null eventTarget",
  shouldIgnoreShortcut(null),
  false,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
