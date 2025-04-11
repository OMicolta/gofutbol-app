// components/ui/Button.tsx

import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  TextStyle,
  ViewStyle,
  TouchableOpacityProps,
  Platform,
} from "react-native";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol, IconSymbolName } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";

export type ButtonVariant = "filled" | "outlined" | "ghost";
export type ButtonColor = keyof Pick<
  (typeof Colors)["light"],
  "primary" | "secondary" | "success" | "danger" | "warning" | "info"
>;
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconSymbolName;
  rightIcon?: IconSymbolName;
  textStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "filled",
  color = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  textStyle,
  buttonStyle,
  fullWidth = false,
  ...rest
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  // Determine styles based on variant, color, and size
  const getBackgroundColor = () => {
    if (disabled) return theme.disabled;
    if (variant === "filled") return theme[color];
    return "transparent";
  };

  const getBorderColor = () => {
    if (disabled) return theme.disabled;
    if (variant === "outlined") return theme[color];
    return "transparent";
  };

  const getTextColor = () => {
    if (disabled) return theme.textDisabled;
    if (variant === "filled") return "white";
    return theme[color];
  };

  const getButtonSize = (): {
    padding: number;
    height: number;
    borderRadius: number;
  } => {
    switch (size) {
      case "small":
        return {
          padding: Spacing.xs,
          height: 32,
          borderRadius: Shape.radius.s,
        };
      case "large":
        return { padding: Spacing.m, height: 56, borderRadius: Shape.radius.m };
      case "medium":
      default:
        return { padding: Spacing.s, height: 44, borderRadius: Shape.radius.s };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case "small":
        return Typography.fontSizes.s;
      case "large":
        return Typography.fontSizes.l;
      case "medium":
      default:
        return Typography.fontSizes.m;
    }
  };

  const getIconSize = (): number => {
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

  const buttonSizeStyle = getButtonSize();
  const backgroundColor = getBackgroundColor();
  const borderColor = getBorderColor();
  const textColor = getTextColor();
  const fontSize = getFontSize();
  const iconSize = getIconSize();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === "outlined" ? 1 : 0,
          paddingHorizontal: buttonSizeStyle.padding * 2,
          height: buttonSizeStyle.height,
          borderRadius: buttonSizeStyle.borderRadius,
          width: fullWidth ? "100%" : "auto",
        },
        // Apply shadow only to filled buttons on iOS
        variant === "filled" &&
          Platform.OS === "ios" &&
          !disabled &&
          Shape.shadow.s,
        // Apply elevation only to filled buttons on Android
        variant === "filled" &&
          Platform.OS === "android" &&
          !disabled && { elevation: 2 },
        buttonStyle,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "filled" ? "white" : theme[color]}
        />
      ) : (
        <>
          {leftIcon && (
            <IconSymbol
              name={leftIcon}
              size={iconSize}
              color={textColor}
              style={styles.leftIcon}
            />
          )}
          <ThemedText
            style={[
              {
                fontSize,
                color: textColor,
              },
              textStyle,
            ]}
            weight="semiBold"
          >
            {title}
          </ThemedText>
          {rightIcon && (
            <IconSymbol
              name={rightIcon}
              size={iconSize}
              color={textColor}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: Spacing.xs,
  },
  rightIcon: {
    marginLeft: Spacing.xs,
  },
});
