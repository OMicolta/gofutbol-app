// components/ui/IconSymbol.tsx

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // Ver MaterialIcons aquí: https://icons.expo.fyi
  // Ver SF Symbols en la app SF Symbols en Mac.
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "soccer.ball": "sports-soccer",
  "soccerball.circle": "sports-soccer",
  "person.fill": "person",
  calendar: "calendar-today",
  "star.fill": "star",
  gear: "settings",
  checkmark: "check",
  // Nuevos mappings para íconos de tema
  "sun.max.fill": "light-mode",
  "moon.fill": "dark-mode",
  "light.beacon.max.fill": "light-mode",
  "lock.fill": "lock",
  globe: "public",
  "bell.fill": "notifications",
  "trash.fill": "delete",
  pencil: "edit",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  plus: "add",
  minus: "remove",
  xmark: "close",
  logout: "logout",
  // Nuevos iconos añadidos
  "camera.fill": "camera-alt",
  "location.fill": "location-on",
  // Nuevos iconos para canchas de fútbol
  "field.soccer": "stadium",
  "search.field": "search",
  "field.map": "map",
  "pin.field": "pin-drop",
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Un componente de icono que utiliza MaterialIcons.
 * Los nombres de los iconos ('name') están basados en la nomenclatura
 * de SFSymbols y requieren un mapeo manual a MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color: propColor,
  style,
  useThemeColor = false,
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  useThemeColor?: boolean;
}) {
  const colorScheme = useColorScheme();
  const iconName = MAPPING[name] as React.ComponentProps<
    typeof MaterialIcons
  >["name"];

  // Usar color del tema si se solicita
  const color = useThemeColor
    ? Colors[colorScheme].icon
    : propColor || Colors[colorScheme].icon;

  return (
    <MaterialIcons color={color} size={size} name={iconName} style={style} />
  );
}
