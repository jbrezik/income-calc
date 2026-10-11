import { useEffect, useState } from "react";

/** State persisted to localStorage; falls back to `initial` when storage is unavailable or stale. */
export function useStoredState<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...initial, ...JSON.parse(raw) } : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked: state just won't survive reload.
    }
  }, [key, value]);
  return [value, setValue] as const;
}
