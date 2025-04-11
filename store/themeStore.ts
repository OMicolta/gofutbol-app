// store/themeStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorSchemeName } from "react-native";

export type ThemeType = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  effectiveTheme: (systemTheme: ColorSchemeName) => "light" | "dark";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      effectiveTheme: (systemTheme) => {
        const currentTheme = get().theme;
        if (currentTheme === "system") {
          return systemTheme === "dark" ? "dark" : "light";
        }
        return currentTheme;
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
