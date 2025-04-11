// components/profile/ThemeSelector.tsx
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeModal } from "@/components/profile/ThemeModal";

export function ThemeSelector() {
  const colorScheme = useColorScheme();
  const { themePreference } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Obtener el nombre del tema actual para mostrar
  const getThemeName = () => {
    switch (themePreference) {
      case "light":
        return "Claro";
      case "dark":
        return "Oscuro";
      case "system":
        return "Sistema";
      default:
        return "Sistema";
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <ThemedView style={styles.container} variant="card" rounded>
          <ThemedText type="subtitle">Tema de la Aplicación</ThemedText>

          <ThemedView
            style={styles.selectedThemeContainer}
            variant="secondary"
            rounded
          >
            <ThemedText>{getThemeName()}</ThemedText>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={Colors[colorScheme].icon}
            />
          </ThemedView>

          <ThemedText style={styles.note} secondary>
            {themePreference === "system"
              ? "Usando el tema del sistema: " +
                (colorScheme === "dark" ? "Oscuro" : "Claro")
              : ""}
          </ThemedText>
        </ThemedView>
      </TouchableOpacity>

      <ThemeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    marginVertical: Spacing.s,
  },
  selectedThemeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Shape.radius.m,
  },
  note: {
    fontSize: 12,
    marginTop: Spacing.s,
    fontStyle: "italic",
  },
});
