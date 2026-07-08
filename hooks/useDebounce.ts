import { useEffect, useState } from "react";

/**
 * Debounce a value by `delay` milliseconds.
 *
 * Commonly used to defer an API call until the user stops typing in a
 * search field.  Returns the most-recent value after `delay` ms of
 * inactivity.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
