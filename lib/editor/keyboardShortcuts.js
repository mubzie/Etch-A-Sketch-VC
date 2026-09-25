export const MODE_SHORTCUTS = {
  d: "draw",
  e: "erase",
  i: "eyedropper",
  f: "fill",
  r: "rainbow",
};

export function getModeFromShortcut(key) {
  return MODE_SHORTCUTS[key.toLowerCase()] ?? null;
}

export function shouldIgnoreShortcut(eventTarget) {
  if (!eventTarget || !eventTarget.tagName) {
    return false;
  }

  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(eventTarget.tagName) ||
    Boolean(eventTarget.isContentEditable)
  );
}
