"use client";

import { useEffect, useRef } from "react";
import { triggerHaptic, type HapticKind } from "@/shared/utils/haptics";

const interactiveSelector = "button, a, [role='button']";

function isDisabled(element: HTMLElement) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true" ||
    element.hasAttribute("data-disabled")
  );
}

export function ButtonHaptics() {
  const lastFeedbackAt = useRef(0);

  useEffect(() => {
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;

      const origin = event.target;
      if (!(origin instanceof Element)) return;

      const control = origin.closest<HTMLElement>(interactiveSelector);
      if (!control || isDisabled(control) || control.dataset.haptic === "none") return;

      const now = performance.now();
      if (now - lastFeedbackAt.current < 45) return;
      lastFeedbackAt.current = now;

      const kind = (control.dataset.haptic as HapticKind | undefined) ?? "light";
      triggerHaptic(kind);
    };

    document.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => document.removeEventListener("pointerup", handlePointerUp);
  }, []);

  return null;
}
