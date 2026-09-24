"use client";

import { useEffect, useRef } from "react";

export function useCanvasPointerInteraction(onPaint) {
  const isPaintingRef = useRef(false);

  useEffect(() => {
    const endStroke = () => {
      isPaintingRef.current = false;
    };

    window.addEventListener("pointerup", endStroke);
    window.addEventListener("pointercancel", endStroke);
    window.addEventListener("blur", endStroke);

    return () => {
      window.removeEventListener("pointerup", endStroke);
      window.removeEventListener("pointercancel", endStroke);
      window.removeEventListener("blur", endStroke);
    };
  }, []);

  const startStroke = (index, event, isFillMode = false) => {
    event.preventDefault();

    if (isFillMode) {
      onPaint(index);
      return;
    }

    isPaintingRef.current = true;
    onPaint(index);
  };

  const continueStroke = (index) => {
    if (isPaintingRef.current) {
      onPaint(index);
    }
  };

  return {
    startStroke,
    continueStroke,
    endStroke: () => {
      isPaintingRef.current = false;
    },
  };
}
