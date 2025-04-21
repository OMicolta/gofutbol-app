// hooks/useTheme.ts
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

// Definición de tipos para los temas
export interface Theme {
  background: string;
  card: string;
  text: string;
  textLight: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  white: string;
}

export function useTheme() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";

  // Definir el tema basado en el esquema de colores
  const theme: Theme = {
    background: Colors[colorScheme].background,
    card: Colors[colorScheme].card,
    text: Colors[colorScheme].text,
    textLight: Colors[colorScheme].textSecondary,
    border: Colors[colorScheme].border,
    primary: Colors[colorScheme].primary,
    secondary: Colors[colorScheme].secondary,
    accent: Colors[colorScheme].info,
    error: Colors[colorScheme].danger,
    success: Colors[colorScheme].success,
    warning: Colors[colorScheme].warning,
    info: Colors[colorScheme].info,
    white: "#FFFFFF",
  };

  return { theme, colorScheme };
}
