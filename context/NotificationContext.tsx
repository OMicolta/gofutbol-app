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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
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
  const opacity = useState(new Animated.Value(0))[0];
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
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Configurar timeout para ocultar
    const id = setTimeout(() => {
      hideNotification();
    }, duration);

    setTimeoutId(id);
  };

  // Ocultar notificación
  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
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

  // Obtener ícono según el tipo de notificación
  const getNotificationIcon = () => {
    switch (type) {
      case "success":
        return "checkmark";
      case "error":
        return "xmark";
      case "warning":
        return "bell.fill";
      default:
        return "bell.fill";
    }
  };

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
            {
              transform: [{ translateY }],
              opacity,
              top: insets.top + 10,
            },
          ]}
        >
          <ThemedView
            style={[
              styles.notification,
              { backgroundColor: getBackgroundColor() },
            ]}
            rounded="m"
            shadow="m"
          >
            <View style={styles.iconContainer}>
              <IconSymbol
                name={getNotificationIcon()}
                size={24}
                color="white"
              />
            </View>
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
    alignItems: "center",
  },
  notification: {
    padding: Spacing.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 500,
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: 400,
      },
    }),
  },
  iconContainer: {
    width: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.s,
  },
  notificationText: {
    flex: 1,
    color: "white",
    marginHorizontal: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
    height: 30,
    width: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "white",
    fontSize: Typography.fontSizes.m,
    fontWeight: Typography.fontWeights.bold,
  },
});
