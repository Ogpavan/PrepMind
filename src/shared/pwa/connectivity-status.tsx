"use client";

import { useEffect, useRef, useState } from "react";

type ConnectionState = "online" | "offline" | "restored";

export function ConnectivityStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("online");
  const wasOffline = useRef(false);

  useEffect(() => {
    let restoredTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOffline = () => {
      if (restoredTimer) clearTimeout(restoredTimer);
      wasOffline.current = true;
      setConnectionState("offline");
    };

    const handleOnline = () => {
      if (!wasOffline.current) return;
      wasOffline.current = false;
      setConnectionState("restored");
      restoredTimer = setTimeout(() => setConnectionState("online"), 2400);
    };

    if (!navigator.onLine) handleOffline();
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      if (restoredTimer) clearTimeout(restoredTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (connectionState === "online") return null;

  return (
    <div
      className={`connectivity-status connectivity-status-${connectionState}`}
      role="status"
      aria-live="polite"
    >
      <span className="connectivity-status-dot" aria-hidden="true" />
      {connectionState === "offline" ? "You’re offline" : "Back online"}
    </div>
  );
}
