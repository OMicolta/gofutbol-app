// components/profile/ThemeSelector.tsx
import React from "react";
import { StyleSheet, View, TouchableOpacity, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol, IconSymbolName } from "@/components/ui/IconSymbol";
import { ThemeType } from "@/store/themeStore";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeSelector() {
  const colorScheme = useColorScheme();
  const { themePreference, setThemePreference } = useTheme();

  const themeOptions: {
    value: ThemeType;
    label: string;
    icon: IconSymbolName;
  }[] = [
    { value: "light", label: "Claro", icon: "house.fill" },
    { value: "dark", label: "Oscuro", icon: "house.fill" },
    { value: "system", label: "Sistema", icon: "gear" },
  ];

  return (
    <ThemedView style={styles.container} variant="card" rounded>
      <ThemedText type="subtitle">Tema de la Aplicación</ThemedText>

      <View style={styles.optionsContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              themePreference === option.value && styles.selectedOption,
              {
                backgroundColor:
                  themePreference === option.value
                    ? Colors[colorScheme].tint + "20"
                    : "transparent",
              },
            ]}
            onPress={() => setThemePreference(option.value)}
          >
            <IconSymbol
              name={option.icon}
              size={24}
              color={
                themePreference === option.value
                  ? Colors[colorScheme].tint
                  : Colors[colorScheme].text
              }
            />
            <ThemedText
              style={[
                styles.optionText,
                themePreference === option.value && {
                  color: Colors[colorScheme].tint,
                },
              ]}
            >
              {option.label}
            </ThemedText>
            {themePreference === option.value && (
              <View style={styles.checkmarkContainer}>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={Colors[colorScheme].tint}
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ThemedText style={styles.note} secondary>
        {themePreference === "system"
          ? "Usando el tema del sistema: " +
            (colorScheme === "dark" ? "Oscuro" : "Claro")
          : ""}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    marginVertical: Spacing.s,
  },
  optionsContainer: {
    marginTop: Spacing.m,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: Shape.radius.s,
    marginBottom: Spacing.s,
  },
  selectedOption: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionText: {
    marginLeft: Spacing.m,
    fontSize: 16,
  },
  checkmarkContainer: {
    marginLeft: "auto",
  },
  note: {
    fontSize: 12,
    marginTop: Spacing.s,
    fontStyle: "italic",
  },
});
