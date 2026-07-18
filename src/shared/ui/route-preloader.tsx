"use client";

import { useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { useEffect, useRef } from "react";

function getInternalHref(value: string) {
  if (!value || value.startsWith("#")) return null;

  const url = new URL(value, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return null;
  if (/\.[a-z0-9]{2,8}$/i.test(url.pathname)) return null;

  return `${url.pathname}${url.search}`;
}

/**
 * Warms every known route and any internal link rendered later by a page.
 * Next keeps the resulting RSC payloads in its client router cache, making
 * navigation behave like switching views in an installed application.
 */
export function RoutePreloader({ routes }: { routes: readonly string[] }) {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());

  useEffect(() => {
    const prefetch = (value: string) => {
      const href = getInternalHref(value);
      if (!href || prefetchedRoutes.current.has(href)) return;

      prefetchedRoutes.current.add(href);
      router.prefetch(href, {
        kind: PrefetchKind.FULL,
        onInvalidate: () => {
          prefetchedRoutes.current.delete(href);
        },
      });
    };

    const prefetchLinksWithin = (root: ParentNode) => {
      if (root instanceof HTMLAnchorElement) prefetch(root.href);
      root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => prefetch(link.href));
    };

    const prefetchEventTarget = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (link) prefetch(link.href);
    };

    const prefetchVisibleRoutes = () => {
      if (document.visibilityState !== "visible") return;
      routes.forEach(prefetch);
      prefetchLinksWithin(document);
    };

    prefetchVisibleRoutes();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) prefetchLinksWithin(node);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointerover", prefetchEventTarget, true);
    document.addEventListener("focusin", prefetchEventTarget, true);
    document.addEventListener("touchstart", prefetchEventTarget, { capture: true, passive: true });
    document.addEventListener("visibilitychange", prefetchVisibleRoutes);

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerover", prefetchEventTarget, true);
      document.removeEventListener("focusin", prefetchEventTarget, true);
      document.removeEventListener("touchstart", prefetchEventTarget, true);
      document.removeEventListener("visibilitychange", prefetchVisibleRoutes);
    };
  }, [router, routes]);

  return null;
}
