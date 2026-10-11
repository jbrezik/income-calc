import { useEffect, useState } from "react";

/**
 * State persisted to localStorage. `parse` validates and migrates the stored value;
 * when storage is unavailable or the value is unreadable, `initial` is used.
 */
export function useStoredState<T>(key: string, initial: T, parse: (raw: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? parse(JSON.parse(raw)) : initial;
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
