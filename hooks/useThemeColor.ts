// hooks/useThemeColor.ts

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

/**
 * Hook para obtener el color adecuado según el tema actual
 *
 * @param props Objeto con colores personalizados para cada tema
 * @param colorName Nombre del color en el objeto Colors
 * @returns Color adecuado para el tema actual
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
): string {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    try {
      return Colors[theme][colorName];
    } catch (error) {
      // En caso de algún error, devolver un color de fallback para evitar errores visuales
      console.warn(`Color '${colorName}' no encontrado en el tema ${theme}`);
      return theme === "dark" ? "#FFFFFF" : "#000000";
    }
  }
}
