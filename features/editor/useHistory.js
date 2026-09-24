"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Stroke-aware undo/redo history. Each completed stroke (or one-shot op)
 * becomes a single undo step.
 *
 *  - beginStroke()  : start a new stroke; records the current state so it can
 *                     be restored by undo. Clears the redo stack.
 *  - setCurrent()   : update the live working state during a stroke (no step
 *                     created).
 *  - endStroke()    : finalize a stroke; if it actually changed the canvas,
 *                     push the pre-stroke snapshot onto the past stack.
 *
 * Use undo()/redo() to navigate history.
 */
export function useHistory(initial) {
  const [current, setCurrent] = useState(initial);

  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const strokeStartRef = useRef(null);

  const setCurrentState = useCallback((next) => setCurrent(next), []);

  // Start a stroke. The pre-stroke state is remembered as a potential
  // undo snapshot. Redo history is cleared.
  const beginStroke = useCallback(() => {
    strokeStartRef.current = current;
    futureRef.current = [];
  }, [current]);

  // One-shot replacement (clear / resize / load artwork): the current canvas
  // is itself an undo step target, so push it onto past and replace.
  const replace = useCallback((next) => {
    if (next !== current) {
      pastRef.current = [...pastRef.current, current].slice(-100);
    }
    futureRef.current = [];
    strokeStartRef.current = null;
    setCurrent(next);
  }, [current]);

  // Finalize the current stroke. If something changed, commit the
  // pre-stroke snapshot as an undo step.
  const endStroke = useCallback((finalState) => {
    const start = strokeStartRef.current;

    // Only commit a step when the stroke actually changed the canvas.
    if (start != null && finalState != null && finalState !== start) {
      pastRef.current = [...pastRef.current, start].slice(-100);
    }

    strokeStartRef.current = null;
  }, []);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) {
      return null;
    }

    const previous = past[past.length - 1];
    futureRef.current = [current, ...futureRef.current];
    pastRef.current = past.slice(0, -1);
    strokeStartRef.current = null;
    setCurrent(previous);
    return previous;
  }, [current]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) {
      return null;
    }

    const next = future[0];
    pastRef.current = [...pastRef.current, current];
    futureRef.current = future.slice(1);
    strokeStartRef.current = null;
    setCurrent(next);
    return next;
  }, [current]);

  return {
    current,
    setCurrentState,
    beginStroke,
    replace,
    endStroke,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
