"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const START_EVENT = "prepmind:navigation-start";

export function startNavigationProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

export function NavigationProgress() {
  const pathname = usePathname();
  const active = useRef(false);
  const progressTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const clearTimer = (timer: { current: number | null }) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const complete = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    if (progressTimer.current !== null) window.clearInterval(progressTimer.current);
    progressTimer.current = null;
    if (safetyTimer.current !== null) window.clearTimeout(safetyTimer.current);
    safetyTimer.current = null;
    setProgress(100);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
      hideTimer.current = null;
    }, 240);
  }, []);

  const start = useCallback(() => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
    if (safetyTimer.current !== null) window.clearTimeout(safetyTimer.current);
    active.current = true;
    setVisible(true);
    setProgress((current) => Math.max(current, 10));

    if (progressTimer.current === null) {
      progressTimer.current = window.setInterval(() => {
        setProgress((current) => current >= 92 ? current : Math.min(92, current + Math.max(1.2, (92 - current) * 0.12)));
      }, 280);
    }
    safetyTimer.current = window.setTimeout(complete, 15_000);
  }, [complete]);

  useEffect(() => complete(), [pathname, complete]);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.download || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);
    const patchedPushState: History["pushState"] = (data, unused, url) => {
      originalPushState(data, unused, url);
      window.queueMicrotask(complete);
    };
    const patchedReplaceState: History["replaceState"] = (data, unused, url) => {
      originalReplaceState(data, unused, url);
      window.queueMicrotask(complete);
    };

    window.history.pushState = patchedPushState;
    window.history.replaceState = patchedReplaceState;
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", start);
    window.addEventListener(START_EVENT, start);

    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(START_EVENT, start);
      if (window.history.pushState === patchedPushState) window.history.pushState = originalPushState;
      if (window.history.replaceState === patchedReplaceState) window.history.replaceState = originalReplaceState;
      if (progressTimer.current !== null) window.clearInterval(progressTimer.current);
      clearTimer(safetyTimer);
      clearTimer(hideTimer);
    };
  }, [complete, start]);

  return (
    <div
      className={`global-navigation-progress${visible ? " global-navigation-progress-visible" : ""}`}
      style={{ "--navigation-progress": progress / 100 } as CSSProperties}
      role="progressbar"
      aria-label="Loading page"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    />
  );
}
