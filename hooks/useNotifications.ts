// hooks/useNotifications.ts
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useNotificationStore } from "@/store/notificationStore";
import * as NotificationService from "@/services/notification";

/**
 * Hook personalizado para manejar las notificaciones en la aplicación
 *
 * Proporciona funcionalidad para:
 * - Registrar el dispositivo para notificaciones push
 * - Manejar notificaciones recibidas mientras la app está abierta
 * - Manejar toques en notificaciones
 * - Actualizar contador de notificaciones no leídas
 */
export function useNotifications() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  const { fetchUnreadCount, unreadCount } = useNotificationStore();

  // Inicializar notificaciones
  useEffect(() => {
    // Registrar el dispositivo para notificaciones push
    registerForPushNotifications();

    // Configurar listeners para notificaciones
    setupNotificationListeners();

    // Cargar contador de notificaciones no leídas
    fetchUnreadCount();

    // Escuchar cambios en el estado de la app
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      // Limpiar listeners de notificaciones
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }

      // Limpiar listener de estado de la app
      subscription.remove();
    };
  }, []);

  // Registrar el dispositivo para notificaciones push
  const registerForPushNotifications = async () => {
    try {
      const token = await NotificationService.getStoredPushToken();

      if (token) {
        // Ya tenemos un token almacenado
        setExpoPushToken(token);
      } else {
        // Solicitar un nuevo token
        const newToken =
          await NotificationService.registerForPushNotifications();
        if (newToken) {
          setExpoPushToken(newToken);
        }
      }
    } catch (error) {
      console.error("Error al registrar para notificaciones push:", error);
    }
  };

  // Configurar listeners para notificaciones
  const setupNotificationListeners = () => {
    // Listener para notificaciones recibidas mientras la app está abierta
    notificationListener.current = NotificationService.addNotificationListeners(
      // Cuando se recibe una notificación
      (notification) => {
        setNotification(notification);
        // Actualizar contador de notificaciones no leídas
        fetchUnreadCount();
      },
      // Cuando se toca una notificación
      (response) => {
        handleNotificationResponse(response);
      }
    );
  };

  // Manejar cambios en el estado de la aplicación
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // La app pasó a primer plano, actualizar contador de notificaciones
      fetchUnreadCount();
    }

    appState.current = nextAppState;
  };

  // Manejar toque en notificación
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;

    // Si hay una pantalla objetivo, navegar a ella
    if (data.targetScreen) {
      let targetParams = {};

      // Intentar parsear los parámetros si están en formato JSON
      if (data.targetParams && typeof data.targetParams === "string") {
        try {
          targetParams = JSON.parse(data.targetParams);
        } catch (error) {
          console.error("Error al parsear targetParams:", error);
        }
      } else if (data.targetParams && typeof data.targetParams === "object") {
        targetParams = data.targetParams;
      }

      // Navegar a la pantalla objetivo
      router.push({
        pathname: data.targetScreen as any,
        params: targetParams,
      });
    }
  };

  return {
    expoPushToken,
    notification,
    unreadCount,
  };
}

export default useNotifications;
