// components/profile/ThemeModal.tsx
import React from "react";
import {
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol, IconSymbolName } from "@/components/ui/IconSymbol";
import { ThemeType } from "@/store/themeStore";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/components/ThemeProvider";

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ThemeModal({ visible, onClose }: ThemeModalProps) {
  const colorScheme = useColorScheme();
  const { themePreference, setThemePreference } = useTheme();

  const themeOptions: {
    value: ThemeType;
    label: string;
    icon: IconSymbolName;
    description: string;
  }[] = [
    {
      value: "light",
      label: "Claro",
      icon: "sun.max.fill",
      description: "Interfaz con fondo claro, ideal para uso diurno",
    },
    {
      value: "dark",
      label: "Oscuro",
      icon: "moon.fill",
      description: "Interfaz con fondo oscuro, reduce fatiga visual nocturna",
    },
    {
      value: "system",
      label: "Sistema",
      icon: "gear",
      description: "Se adapta automáticamente al tema de tu dispositivo",
    },
  ];

  const selectTheme = (theme: ThemeType) => {
    setThemePreference(theme);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <ThemedView
          style={styles.modalContainer}
          variant="card"
          rounded
          shadow="l"
          onTouchStart={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <ThemedText type="subtitle">Seleccionar tema</ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButtonContainer}
            >
              <ThemedText type="body" style={styles.closeButton}>
                ✕
              </ThemedText>
            </TouchableOpacity>
          </View>

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
                        ? Colors[colorScheme].primary + "20"
                        : "transparent",
                  },
                ]}
                onPress={() => selectTheme(option.value)}
              >
                <View style={styles.iconContainer}>
                  <IconSymbol
                    name={option.icon}
                    size={28}
                    color={
                      themePreference === option.value
                        ? Colors[colorScheme].primary
                        : Colors[colorScheme].text
                    }
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <ThemedText
                    style={[
                      styles.optionText,
                      themePreference === option.value && {
                        color: Colors[colorScheme].primary,
                        fontWeight: Typography.fontWeights.semiBold,
                      },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    secondary
                    style={styles.optionDescription}
                  >
                    {option.description}
                  </ThemedText>
                </View>
                {themePreference === option.value && (
                  <View style={styles.checkmarkContainer}>
                    <IconSymbol
                      name="checkmark"
                      size={20}
                      color={Colors[colorScheme].primary}
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
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 420,
    padding: Spacing.m,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  closeButton: {
    fontSize: Typography.fontSizes.l,
    fontWeight: Typography.fontWeights.medium,
  },
  optionsContainer: {
    marginTop: Spacing.s,
    gap: Spacing.m,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: Shape.radius.m,
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.s,
  },
  selectedOption: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  checkmarkContainer: {
    marginLeft: "auto",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  note: {
    fontSize: 12,
    marginTop: Spacing.m,
    fontStyle: "italic",
    textAlign: "center",
  },
});
