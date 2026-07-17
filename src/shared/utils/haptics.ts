export type HapticKind = "selection" | "light" | "medium" | "success" | "warning";

const patterns: Record<HapticKind, number | number[]> = {
  selection: 6,
  light: 9,
  medium: 16,
  success: [9, 24, 13],
  warning: [16, 32, 18],
};

export function triggerHaptic(kind: HapticKind = "light") {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function" ||
    document.visibilityState !== "visible" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  navigator.vibrate(patterns[kind]);
}
