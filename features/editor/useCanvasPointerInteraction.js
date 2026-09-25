"use client";

import { useEffect, useRef } from "react";

export function useCanvasPointerInteraction(onPaint, onStrokeEnd) {
  const isPaintingRef = useRef(false);
  const onPaintRef = useRef(onPaint);
  const onStrokeEndRef = useRef(onStrokeEnd);

  useEffect(() => {
    onPaintRef.current = onPaint;
  }, [onPaint]);

  useEffect(() => {
    onStrokeEndRef.current = onStrokeEnd;
  }, [onStrokeEnd]);

  useEffect(() => {
    const finishStroke = () => {
      if (isPaintingRef.current) {
        isPaintingRef.current = false;
        onStrokeEndRef.current?.();
      }
    };

    window.addEventListener("pointerup", finishStroke);
    window.addEventListener("pointercancel", finishStroke);
    window.addEventListener("blur", finishStroke);

    return () => {
      window.removeEventListener("pointerup", finishStroke);
      window.removeEventListener("pointercancel", finishStroke);
      window.removeEventListener("blur", finishStroke);
    };
  }, []);

  const startStroke = (index, event, isFillMode = false) => {
    event.preventDefault();

    if (isFillMode) {
      onPaintRef.current?.(index);
      return;
    }

    // Release pointer capture on touch devices so dragging across cells triggers pointerenter on siblings
    if (
      event.target &&
      typeof event.target.releasePointerCapture === "function" &&
      event.pointerId !== undefined
    ) {
      try {
        event.target.releasePointerCapture(event.pointerId);
      } catch (_) {}
    }

    isPaintingRef.current = true;
    onPaintRef.current?.(index);
  };

  const continueStroke = (index) => {
    if (isPaintingRef.current) {
      onPaintRef.current?.(index);
    }
  };

  return {
    startStroke,
    continueStroke,
    endStroke: () => {
      if (isPaintingRef.current) {
        isPaintingRef.current = false;
        onStrokeEndRef.current?.();
      }
    },
  };
}
