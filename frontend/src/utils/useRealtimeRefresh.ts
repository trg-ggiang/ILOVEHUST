import { useEffect, useRef } from "react";

type RealtimeRefreshOptions = {
  enabled?: boolean;
  intervalMs?: number;
  runOnFocus?: boolean;
  runOnOnline?: boolean;
};

export function useRealtimeRefresh(
  callback: () => void | Promise<void>,
  {
    enabled = true,
    intervalMs = 10000,
    runOnFocus = true,
    runOnOnline = true,
  }: RealtimeRefreshOptions = {}
) {
  const callbackRef = useRef(callback);
  const runningRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    async function run() {
      if (runningRef.current || document.visibilityState === "hidden") return;

      runningRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        runningRef.current = false;
      }
    }

    const timer = window.setInterval(run, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        run();
      }
    }

    if (runOnFocus) {
      window.addEventListener("focus", run);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    if (runOnOnline) {
      window.addEventListener("online", run);
    }

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", run);
    };
  }, [enabled, intervalMs, runOnFocus, runOnOnline]);
}
