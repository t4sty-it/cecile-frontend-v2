import { useEffect } from "react";

export function useWindowEvent(e: keyof WindowEventMap, cb: (ev: Event) => {}) {
  useEffect(() => {
    window.addEventListener(e, cb)
    return () => window.removeEventListener(e, cb)
  }, [])
}