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
  }[] = [
    { value: "light", label: "Claro", icon: "house.fill" },
    { value: "dark", label: "Oscuro", icon: "house.fill" },
    { value: "system", label: "Sistema", icon: "gear" },
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
            <TouchableOpacity onPress={onClose}>
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
                        ? Colors[colorScheme].tint + "20"
                        : "transparent",
                  },
                ]}
                onPress={() => selectTheme(option.value)}
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
    width: "80%",
    maxWidth: 400,
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
  },
  closeButton: {
    fontSize: Typography.fontSizes.l,
    fontWeight: Typography.fontWeights.medium,
  },
  optionsContainer: {
    marginTop: Spacing.s,
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
