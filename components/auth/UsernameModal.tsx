// components/auth/UsernameModal.tsx

import React, { useEffect } from "react";
import {
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  BackHandler,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UsernameSelector } from "@/components/auth/UsernameSelector";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
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
  const slideAnim = React.useRef(new Animated.Value(visible ? 0 : 100)).current;
  const fadeAnim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const { height: windowHeight } = Dimensions.get("window");

  // Use the theme color for the modal background
  const backgroundColor = Colors[colorScheme].backgroundSecondary;

  // Animation effects when visibility changes
  useEffect(() => {
    if (visible) {
      // Starting values for entrance animation
      slideAnim.setValue(100);
      fadeAnim.setValue(0);

      // Run entrance animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (visible) {
          onClose();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Handle username selection
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
      animationType="none" // Using custom animations
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen" // Make sure it covers the entire screen
    >
      <Animated.View style={[styles.overlay]}>
        <Pressable style={styles.dismissArea} onPress={onClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={20}
          >
            <Animated.View
              style={{
                ...styles.modalWrapper,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0, windowHeight * 0.2],
                    }),
                  },
                ],
                opacity: fadeAnim,
              }}
            >
              <ThemedView
                style={styles.modalContainer}
                variant="card"
                rounded="l"
                shadow="l"
                onTouchStart={(e) => e.stopPropagation()}
              >
                <View style={styles.header}>
                  <ThemedText type="subtitle" style={styles.headerTitle}>
                    Cambiar nombre de usuario
                  </ThemedText>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButtonContainer}
                    activeOpacity={0.7}
                  >
                    <ThemedView
                      style={styles.closeButton}
                      variant="secondary"
                      rounded
                    >
                      <IconSymbol
                        name="xmark"
                        size={20}
                        color={Colors[colorScheme].text}
                      />
                    </ThemedView>
                  </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                <View style={styles.contentContainer}>
                  <UsernameSelector
                    initialUsername={initialUsername}
                    displayName={displayName}
                    onUsernameSelected={handleUsernameSelected}
                    onCancel={onClose}
                    suggestionsEnabled={true}
                  />
                </View>
              </ThemedView>
            </Animated.View>
          </KeyboardAvoidingView>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    zIndex: 9999,
  },
  dismissArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoid: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrapper: {
    width: "90%",
    maxWidth: 480,
    borderRadius: Shape.radius.l,
    overflow: "hidden",
  },
  modalContainer: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: Shape.radius.l,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  headerTitle: {
    fontWeight: Typography.fontWeights.semiBold,
    fontSize: Typography.fontSizes.l,
  },
  closeButtonContainer: {
    padding: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    marginBottom: Spacing.s,
  },
  contentContainer: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.l,
  },
});
