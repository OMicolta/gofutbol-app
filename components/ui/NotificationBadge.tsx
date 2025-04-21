// components/ui/NotificationBadge.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface NotificationBadgeProps {
  count: number;
  color?: string; // Color personalizado opcional
  size?: "small" | "medium" | "large";
  position?: "topRight" | "topLeft" | "bottomRight" | "bottomLeft";
}

export function NotificationBadge({
  count,
  color,
  size = "medium",
  position = "topRight",
}: NotificationBadgeProps) {
  // Si no hay notificaciones, no mostrar nada
  if (count <= 0) return null;

  const colorScheme = useColorScheme();

  // Determinar tamaño
  const getBadgeSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "large":
        return 24;
      case "medium":
      default:
        return 20;
    }
  };

  // Determinar tamaño de fuente
  const getFontSize = () => {
    switch (size) {
      case "small":
        return 10;
      case "large":
        return 14;
      case "medium":
      default:
        return 12;
    }
  };

  // Determinar posición
  const getPositionStyle = () => {
    switch (position) {
      case "topLeft":
        return {
          top: -8,
          left: -8,
        };
      case "bottomRight":
        return {
          bottom: -8,
          right: -8,
        };
      case "bottomLeft":
        return {
          bottom: -8,
          left: -8,
        };
      case "topRight":
      default:
        return {
          top: -8,
          right: -8,
        };
    }
  };

  // Estilos dinámicos
  const badgeSize = getBadgeSize();
  const fontSize = getFontSize();
  const positionStyle = getPositionStyle();
  const badgeColor = color || Colors[colorScheme].primary;

  // Para valores grandes, mostrar "9+" si excede 9
  const displayCount = count > 9 ? "9+" : count.toString();

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          backgroundColor: badgeColor,
          ...positionStyle,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.badgeText,
          {
            fontSize: fontSize,
          },
        ]}
      >
        {displayCount}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    minWidth: 16,
    minHeight: 16,
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
