// hooks/useColorScheme.ts
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

export function useColorScheme() {
  // Capturamos posibles errores en caso de que el hook se use fuera del contexto ThemeProvider
  try {
    // Usamos nuestro hook de tema personalizado que se actualiza más fiablemente
    const { theme } = useTheme();
    return theme;
  } catch (error) {
    // Si el contexto no está disponible, devolvemos "light" como valor por defecto
    // Esto previene errores pero no es una solución ideal
    console.warn(
      "useColorScheme usado fuera de ThemeProvider, devolviendo 'light'"
    );
    return "light";
  }
}
