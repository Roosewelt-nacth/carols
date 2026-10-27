import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME, applyTheme, palettes } from './theme';

const KEY = 'carols-theme-v1';

type Ctx = { name: string; setTheme: (n: string) => void };
const C = createContext<Ctx>({ name: DEFAULT_THEME, setTheme: () => {} });

// Wrap the screens in <Themed> so a switch re-dresses everything at once.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState(DEFAULT_THEME);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v && palettes[v]) {
          applyTheme(v);
          setName(v);
        }
      })
      .catch(() => {});
  }, []);
  const setTheme = useCallback((n: string) => {
    applyTheme(n);
    setName(n);
    AsyncStorage.setItem(KEY, n).catch(() => {});
  }, []);
  return <C.Provider value={{ name, setTheme }}>{children}</C.Provider>;
}

export const useTheme = () => useContext(C);

export function Themed({ children }: { children: React.ReactNode }) {
  const { name } = useTheme();
  return <React.Fragment key={name}>{children}</React.Fragment>;
}
