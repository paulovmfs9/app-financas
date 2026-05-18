/**
 * ThemeProvider: theme preference (light/dark/system) persisted in AsyncStorage.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getColors, ThemeMode, Colors } from "../utils/theme";

type ThemePref = "light" | "dark" | "system";

interface ThemeCtx {
  mode: ThemeMode;
  pref: ThemePref;
  colors: Colors;
  setPref: (p: ThemePref) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "saldo_theme_pref";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setPrefState(v);
    });
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const mode: ThemeMode = pref === "system" ? (system === "dark" ? "dark" : "light") : pref;
  const colors = getColors(mode);

  return <Ctx.Provider value={{ mode, pref, colors, setPref }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}
