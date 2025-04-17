// components/auth/UsernameModal.tsx

import React from "react";
import {
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UsernameSelector } from "@/components/auth/UsernameSelector";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface UsernameModalProps {
  visible: boolean;
  onClose: () => void;
  initialUsername: string;
  displayName: string | null;
  onUsernameSelected: (username: string) => Promise<boolean>;
}

export function UsernameModal({
  visible,
  onClose,
  initialUsername,
  displayName,
  onUsernameSelected,
}: UsernameModalProps) {
  const colorScheme = useColorScheme();

  // Controlar cuando se selecciona un nombre de usuario
  const handleUsernameSelected = async (username: string) => {
    const success = await onUsernameSelected(username);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ThemedView
            style={styles.modalContainer}
            variant="card"
            rounded
            shadow="l"
            onTouchStart={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <ThemedText type="subtitle">Cambiar nombre de usuario</ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButtonContainer}
              >
                <IconSymbol
                  name="xmark"
                  size={24}
                  color={Colors[colorScheme].text}
                />
              </TouchableOpacity>
            </View>

            <UsernameSelector
              initialUsername={initialUsername}
              displayName={displayName}
              onUsernameSelected={handleUsernameSelected}
              onCancel={onClose}
              suggestionsEnabled={true}
            />
          </ThemedView>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    width: "100%",
    maxWidth: 500,
    padding: Spacing.m,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
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
    marginBottom: Spacing.s,
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
  },
});
