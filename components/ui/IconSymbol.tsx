// components/ui/IconSymbol.tsx

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

// Tipo de icono (Material o MaterialCommunity)
type IconType = "material" | "community";

// Mapeo de nombres de SF Symbols a Material Icons
const MAPPING = {
  // Ver MaterialIcons aquí: https://icons.expo.fyi
  // Ver SF Symbols en la app SF Symbols en Mac.
  "house.fill": { type: "material", name: "home" },
  "paperplane.fill": { type: "material", name: "send" },
  "chevron.left.forwardslash.chevron.right": { type: "material", name: "code" },
  "chevron.right": { type: "material", name: "chevron-right" },
  "soccer.ball": { type: "material", name: "sports-soccer" },
  "soccerball.circle": { type: "material", name: "sports-soccer" },
  "person.fill": { type: "material", name: "person" },
  calendar: { type: "material", name: "calendar-today" },
  "star.fill": { type: "material", name: "star" },
  gear: { type: "material", name: "settings" },
  checkmark: { type: "material", name: "check" },
  // Nuevos mappings para íconos de tema
  "sun.max.fill": { type: "material", name: "light-mode" },
  "moon.fill": { type: "material", name: "dark-mode" },
  "light.beacon.max.fill": { type: "material", name: "light-mode" },
  "lock.fill": { type: "material", name: "lock" },
  globe: { type: "material", name: "public" },
  "bell.fill": { type: "material", name: "notifications" },
  "trash.fill": { type: "material", name: "delete" },
  pencil: { type: "material", name: "edit" },
  "arrow.left": { type: "material", name: "arrow-back" },
  "arrow.right": { type: "material", name: "arrow-forward" },
  plus: { type: "material", name: "add" },
  minus: { type: "material", name: "remove" },
  xmark: { type: "material", name: "close" },
  logout: { type: "material", name: "logout" },
  // Nuevos iconos añadidos
  "camera.fill": { type: "material", name: "camera-alt" },
  "location.fill": { type: "material", name: "location-on" },
  // Nuevos iconos para canchas de fútbol
  "field.soccer": { type: "material", name: "stadium" },
  "soccer.field": { type: "community", name: "soccer-field" },
  "search.field": { type: "material", name: "search" },
  "field.map": { type: "material", name: "map" },
  "pin.field": { type: "material", name: "pin-drop" },
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Un componente de icono que utiliza Material Icons o Material Community Icons.
 * Los nombres de los iconos ('name') están basados en la nomenclatura
 * de SFSymbols y requieren un mapeo manual a los iconos correspondientes.
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
  const iconMapping = MAPPING[name];

  // Usar color del tema si se solicita
  const color = useThemeColor
    ? Colors[colorScheme].icon
    : propColor || Colors[colorScheme].icon;

  // Renderizar el icono correspondiente según su tipo
  if (iconMapping.type === "community") {
    return (
      <MaterialCommunityIcons
        color={color}
        size={size}
        name={
          iconMapping.name as React.ComponentProps<
            typeof MaterialCommunityIcons
          >["name"]
        }
        style={style}
      />
    );
  }

  // Por defecto, usar Material Icons
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={
        iconMapping.name as React.ComponentProps<typeof MaterialIcons>["name"]
      }
      style={style}
    />
  );
}
