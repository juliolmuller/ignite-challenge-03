import { useCallback, useState } from 'react';

const defaultStorage = localStorage;

export function useStorage<T>(
  key: string,
  initialValue: T,
): [T, (newValue: T) => void, () => void] {
  const [value, setValue] = useState(() => {
    const item = defaultStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const actualSetValue = useCallback(
    (newValue: T) => {
      defaultStorage.setItem(key, JSON.stringify(newValue));
      setValue(newValue);
    },
    [key],
  );

  const destroyValue = useCallback(() => {
    defaultStorage.removeItem(key);
    setValue(undefined);
  }, [key]);

  return [value, actualSetValue, destroyValue];
}
