// store/themeStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorSchemeName, Platform } from "react-native";

/**
 * Tipos de tema disponibles:
 * - "light": Tema claro forzado
 * - "dark": Tema oscuro forzado
 * - "system": Usa el tema del sistema del dispositivo
 */
export type ThemeType = "light" | "dark" | "system";

interface ThemeState {
  /** Preferencia de tema seleccionada por el usuario */
  theme: ThemeType;

  /** Función para cambiar la preferencia de tema */
  setTheme: (theme: ThemeType) => void;

  /**
   * Calcula el tema efectivo basado en la preferencia del usuario
   * y el tema del sistema
   */
  effectiveTheme: (systemTheme: ColorSchemeName) => "light" | "dark";

  /** Indica si el tema está inicializado desde el almacenamiento */
  isInitialized: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      isInitialized: false,

      setTheme: (theme) =>
        set({
          theme,
          isInitialized: true,
        }),

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
      // Solo persistir la preferencia de tema
      partialize: (state) => ({
        theme: state.theme,
        isInitialized: state.isInitialized,
      }),
      // No inicializar con información del almacenamiento en web
      // antes de la hidratación
      skipHydration: Platform.OS === "web",
      // Marcar como inicializado cuando se recupera del almacenamiento
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
