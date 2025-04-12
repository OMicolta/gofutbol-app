// hooks/useColorScheme.ts
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import {
  ColorSchemeName,
  useColorScheme as useNativeColorScheme,
} from "react-native";

/**
 * Un hook personalizado que unifica el manejo del tema en toda la aplicación
 * Devuelve el tema activo actual ('light' o 'dark') considerando:
 * 1. La preferencia del usuario configurada en la app
 * 2. El tema del sistema si el usuario eligió "sistema"
 * 3. Una fallback a "light" si no se puede determinar por alguna razón
 */
export function useColorScheme(): "light" | "dark" {
  // Estado para mantener el sistema fallback
  const [fallbackTheme, setFallbackTheme] = useState<"light" | "dark">("light");

  // Obtenemos el tema del sistema (native)
  const nativeTheme = useNativeColorScheme();

  // Intentar usar el ThemeProvider de nuestra aplicación
  try {
    // Usamos nuestro hook de tema personalizado que se actualiza más fiablemente
    const { theme } = useTheme();
    return theme;
  } catch (error) {
    // Si el contexto no está disponible (por ejemplo, durante la inicialización)
    // usamos el tema del sistema o fallback a "light"

    // Actualizar el fallback basado en el tema del sistema
    useEffect(() => {
      if (nativeTheme) {
        setFallbackTheme(nativeTheme === "dark" ? "dark" : "light");
      }
    }, [nativeTheme]);

    return nativeTheme === "dark" ? "dark" : fallbackTheme;
  }
}

/**
 * Versión para web, maneja la hidratación correctamente
 */
export function useColorSchemeWeb(): "light" | "dark" {
  const [hasHydrated, setHasHydrated] = useState(false);
  const theme = useColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return theme;
  }

  return "light"; // Default para web antes de hidratar
}
