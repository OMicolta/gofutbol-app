// hooks/useColorScheme.ts
import { useTheme } from "@/components/ThemeProvider";

export function useColorScheme() {
  // Usamos nuestro hook de tema personalizado que se actualiza más fiablemente
  const { theme } = useTheme();
  return theme;
}
