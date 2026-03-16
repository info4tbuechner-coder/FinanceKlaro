import { useState, useEffect, useRef, useCallback } from 'react';

const replacer = (_key: string, value: any) => {
  if (value instanceof Set) return { dataType: 'Set', value: Array.from(value) };
  return value;
};

const reviver = (_key: string, value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Set') return new Set(value.value);
  }
  return value;
};

function useLocalStorage<T,>(
  key: string,
  initialValue: T,
  debounceMs = 500,
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item, reviver) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const pendingRef = useRef<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback((val: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(val, replacer));
      pendingRef.current = null;
    } catch {}
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prev => {
      const next = value instanceof Function ? value(prev) : value;
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(next), debounceMs);
      return next;
    });
  }, [flush, debounceMs]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try { setStoredValue(JSON.parse(e.newValue, reviver)); } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  useEffect(() => {
    return () => {
      if (timerRef.current && pendingRef.current !== null) {
        clearTimeout(timerRef.current);
        flush(pendingRef.current);
      }
    };
  }, [flush]);

  return [storedValue, setValue];
}

export default useLocalStorage;
