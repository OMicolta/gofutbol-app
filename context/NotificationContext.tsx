// context/NotificationContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationContextType {
  showNotification: (
    message: string,
    type?: NotificationType,
    duration?: number
  ) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const translateY = useState(new Animated.Value(-100))[0];
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  // Mostrar notificación
  const showNotification = (
    message: string,
    type: NotificationType = "info",
    duration: number = 3000
  ) => {
    // Limpiar timeout anterior si existe
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Actualizar estado
    setMessage(message);
    setType(type);
    setVisible(true);

    // Animar entrada
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    // Configurar timeout para ocultar
    const id = setTimeout(() => {
      hideNotification();
    }, duration);

    setTimeoutId(id);
  };

  // Ocultar notificación
  const hideNotification = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // Obtener color según el tipo de notificación
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return Colors[colorScheme].success;
      case "error":
        return Colors[colorScheme].danger;
      case "warning":
        return Colors[colorScheme].warning;
      default:
        return Colors[colorScheme].info;
    }
  };

  return (
    <NotificationContext.Provider
      value={{ showNotification, hideNotification }}
    >
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.notificationContainer,
            { transform: [{ translateY }], top: insets.top },
          ]}
        >
          <ThemedView
            style={[
              styles.notification,
              { backgroundColor: getBackgroundColor() },
            ]}
            rounded
          >
            <ThemedText style={styles.notificationText} weight="semiBold">
              {message}
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideNotification}
            >
              <ThemedText style={styles.closeText}>✕</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: "absolute",
    width: "100%",
    zIndex: 9999,
    padding: Spacing.m,
  },
  notification: {
    padding: Spacing.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationText: {
    flex: 1,
    color: "white",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  closeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
