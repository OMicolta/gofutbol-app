// components/ThemeProvider.tsx

import React, { useEffect, createContext, useContext } from "react";
import {
  useColorScheme as useNativeColorScheme,
  AppState,
  AppStateStatus,
} from "react-native";
import { useThemeStore, ThemeType } from "@/store/themeStore";

// Creamos un contexto para el tema que expondrá tanto el tema como la función para cambiarlo
type ThemeContextType = {
  theme: "light" | "dark";
  themePreference: ThemeType;
  setThemePreference: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook para usar el tema en cualquier componente
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const nativeColorScheme = useNativeColorScheme();
  const { theme: themePreference, setTheme, effectiveTheme } = useThemeStore();
  const theme = effectiveTheme(nativeColorScheme);

  // Manejar cambios en el estado de la aplicación (por ej., cuando vuelve a primer plano)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          // Cuando la app vuelve a primer plano, verificamos si el tema del sistema ha cambiado
          // y forzamos una actualización si estamos en modo 'system'
          if (themePreference === "system") {
            // Forzar una actualización del store para que se propague el cambio
            setTheme("system");
          }
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [themePreference]);

  // Proporcionamos tanto el tema efectivo (light/dark) como la preferencia del usuario (light/dark/system)
  const contextValue: ThemeContextType = {
    theme,
    themePreference,
    setThemePreference: setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
