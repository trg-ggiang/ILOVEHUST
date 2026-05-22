import { useEffect, useRef } from "react";
import { getSocket } from "./socket";

export function useSocketEvent(eventName, handler, enabled = true) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = getSocket();
    if (!socket) return undefined;

    function wrappedHandler(payload) {
      handlerRef.current?.(payload);
    }

    socket.on(eventName, wrappedHandler);
    return () => {
      socket.off(eventName, wrappedHandler);
    };
  }, [eventName, enabled]);
}
