"use client";

import { useEffect } from "react";
import {
  getModeFromShortcut,
  shouldIgnoreShortcut,
} from "../../lib/editor/keyboardShortcuts";

export function useEditorShortcuts(onModeChange) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (shouldIgnoreShortcut(event.target)) {
        return;
      }

      const nextMode = getModeFromShortcut(event.key);
      if (nextMode) {
        onModeChange(nextMode);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onModeChange]);
}
