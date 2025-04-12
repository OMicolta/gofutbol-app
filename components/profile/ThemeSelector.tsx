// components/profile/ThemeSelector.tsx
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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

  // Obtener el ícono del tema actual
  const getThemeIcon = () => {
    switch (themePreference) {
      case "light":
        return "sun.max.fill";
      case "dark":
        return "moon.fill";
      case "system":
        return "gear";
      default:
        return "gear";
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <ThemedView style={styles.container} variant="card" rounded shadow="s">
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">Tema de la Aplicación</ThemedText>
            <IconSymbol
              name={getThemeIcon()}
              size={24}
              color={Colors[colorScheme].primary}
            />
          </View>

          <ThemedView
            style={styles.selectedThemeContainer}
            variant="secondary"
            rounded
          >
            <View style={styles.themeInfo}>
              <ThemedText weight="semiBold">{getThemeName()}</ThemedText>
              <ThemedText type="caption" secondary>
                {themePreference === "system"
                  ? `Usando tema del sistema (${
                      colorScheme === "dark" ? "Oscuro" : "Claro"
                    })`
                  : `Tema seleccionado manualmente`}
              </ThemedText>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={Colors[colorScheme].icon}
            />
          </ThemedView>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  selectedThemeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: Shape.radius.m,
  },
  themeInfo: {
    flex: 1,
  },
  note: {
    fontSize: 12,
    marginTop: Spacing.s,
    fontStyle: "italic",
  },
});
