// components/ThemedText.tsx

import { Text, type TextProps, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Typography } from "@/constants/Colors";

export type TextVariant =
  | "default"
  | "title"
  | "subtitle"
  | "heading"
  | "subheading"
  | "body"
  | "caption"
  | "button"
  | "link";

export type FontWeightType = keyof typeof Typography.fontWeights;

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: TextVariant;
  weight?: FontWeightType;
  secondary?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  weight,
  secondary = false,
  ...rest
}: ThemedTextProps) {
  const colorType = secondary ? "textSecondary" : "text";
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    colorType
  );

  return (
    <Text
      style={[
        { color },
        styles[type],
        weight && { fontWeight: Typography.fontWeights[weight] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: Typography.fontSizes.m,
    lineHeight: Typography.lineHeights.m,
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    lineHeight: Typography.lineHeights.xxxl,
  },
  subtitle: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.semiBold,
    lineHeight: Typography.lineHeights.xxl,
  },
  heading: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    lineHeight: Typography.lineHeights.xl,
  },
  subheading: {
    fontSize: Typography.fontSizes.l,
    fontWeight: Typography.fontWeights.semiBold,
    lineHeight: Typography.lineHeights.l,
  },
  body: {
    fontSize: Typography.fontSizes.m,
    lineHeight: Typography.lineHeights.m,
  },
  caption: {
    fontSize: Typography.fontSizes.s,
    lineHeight: Typography.lineHeights.s,
  },
  button: {
    fontSize: Typography.fontSizes.m,
    fontWeight: Typography.fontWeights.semiBold,
    lineHeight: Typography.lineHeights.m,
  },
  link: {
    fontSize: Typography.fontSizes.m,
    lineHeight: Typography.lineHeights.m,
    textDecorationLine: "underline",
  },
});
