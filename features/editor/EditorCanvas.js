"use client";

import { memo, useCallback, useEffect, useRef } from "react";

/**
 * A single canvas cell. Memoised so that painting one pixel doesn't re-render
 * the other size² − 1 cells — which matters a lot now that grids go up to
 * 128×128 (16,384 cells).
 */
const Pixel = memo(function Pixel({ color, index, onDown, onEnter }) {
  return (
    <div
      className="pixel"
      style={{ backgroundColor: color }}
      onPointerDown={(event) => onDown(index, event)}
      onPointerEnter={() => onEnter(index)}
    />
  );
});

export default function EditorCanvas({
  pixels,
  gridSize,
  showGrid,
  dense = false,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
}) {
  // Keep the latest handlers reachable through stable callbacks, so the
  // memoised cells never see a changed prop just because a parent re-rendered.
  const downRef = useRef(onPointerDown);
  const enterRef = useRef(onPointerEnter);

  useEffect(() => {
    downRef.current = onPointerDown;
  }, [onPointerDown]);

  useEffect(() => {
    enterRef.current = onPointerEnter;
  }, [onPointerEnter]);

  const handleDown = useCallback((index, event) => {
    downRef.current?.(index, event);
  }, []);

  const handleEnter = useCallback((index) => {
    enterRef.current?.(index);
  }, []);

  return (
    <div
      className={`pixel-canvas${showGrid ? " show-grid" : ""}${
        dense ? " dense" : ""
      }`}
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      onPointerLeave={onPointerLeave}
    >
      {pixels.map((color, index) => (
        <Pixel
          key={index}
          index={index}
          color={color}
          onDown={handleDown}
          onEnter={handleEnter}
        />
      ))}
    </div>
  );
}
