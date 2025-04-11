// components/ui/Card.tsx

import React, { ReactNode } from "react";
import {
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { ThemedView, ThemedViewProps } from "@/components/ThemedView";
import { Spacing, Shape } from "@/constants/Colors";

interface CardProps extends ThemedViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  shadow?: keyof typeof Shape.shadow;
  padding?: boolean | number;
}

export function Card({
  children,
  style,
  onPress,
  shadow = "m",
  padding = true,
  ...rest
}: CardProps) {
  const cardContent = (
    <ThemedView
      variant="card"
      shadow={shadow}
      rounded="m"
      style={[
        styles.card,
        padding === true && styles.defaultPadding,
        typeof padding === "number" && { padding },
        style,
      ]}
      {...rest}
    >
      {children}
    </ThemedView>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
  },
  card: {
    overflow: "hidden",
    width: "100%",
  },
  defaultPadding: {
    padding: Spacing.m,
  },
});
