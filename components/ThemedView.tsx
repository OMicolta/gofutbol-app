// components\ThemedView.tsx

import { View, type ViewProps, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Shape } from "@/constants/Colors";

export type ViewVariant = "default" | "card" | "surface" | "secondary";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: ViewVariant;
  shadow?: keyof typeof Shape.shadow;
  rounded?: keyof typeof Shape.radius | boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = "default",
  shadow,
  rounded,
  ...otherProps
}: ThemedViewProps) {
  const colorType =
    variant === "default"
      ? "background"
      : variant === "card"
      ? "card"
      : variant === "surface"
      ? "surface"
      : "backgroundSecondary";

  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    colorType
  );

  const shadowStyle = shadow ? Shape.shadow[shadow] : undefined;

  let borderRadius;
  if (typeof rounded === "boolean") {
    borderRadius = rounded ? Shape.radius.m : undefined;
  } else if (rounded) {
    borderRadius = Shape.radius[rounded];
  }

  return (
    <View
      style={[
        { backgroundColor },
        borderRadius !== undefined && { borderRadius },
        shadowStyle,
        style,
      ]}
      {...otherProps}
    />
  );
}
