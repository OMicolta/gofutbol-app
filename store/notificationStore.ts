// store\notificationStore.ts

import { create } from "zustand";
import {
  Notification,
  NotificationPermissions,
  DEFAULT_NOTIFICATION_PERMISSIONS,
} from "../types/notification";
import * as NotificationService from "../services/notification";

interface NotificationStore {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  notificationPermissions: NotificationPermissions;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchNotificationPermissions: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updateNotificationPermissions: (
    permissions: Partial<NotificationPermissions>
  ) => Promise<void>;
  registerForPushNotifications: () => Promise<string | null>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Estado inicial
  notifications: [],
  unreadCount: 0,
  notificationPermissions: DEFAULT_NOTIFICATION_PERMISSIONS,
  isLoading: false,
  error: null,

  // Obtener notificaciones del usuario
  fetchNotifications: async () => {
    try {
      set({ isLoading: true, error: null });
      const notifications = await NotificationService.getUserNotifications();
      set({ notifications, isLoading: false });
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      set({ error: "Error al cargar notificaciones", isLoading: false });
    }
  },

  // Obtener contador de notificaciones no leídas
  fetchUnreadCount: async () => {
    try {
      const unreadCount =
        await NotificationService.getUnreadNotificationCount();
      set({ unreadCount });
    } catch (error) {
      console.error(
        "Error al obtener contador de notificaciones no leídas:",
        error
      );
    }
  },

  // Obtener preferencias de notificaciones
  fetchNotificationPermissions: async () => {
    try {
      const permissions =
        await NotificationService.getNotificationPermissions();
      set({ notificationPermissions: permissions });
    } catch (error) {
      console.error("Error al obtener preferencias de notificaciones:", error);
    }
  },

  // Marcar notificación como leída
  markNotificationAsRead: async (notificationId: string) => {
    try {
      await NotificationService.markNotificationAsRead(notificationId);

      // Actualizar estado local
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async () => {
    try {
      await NotificationService.markAllNotificationsAsRead();

      // Actualizar estado local
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error(
        "Error al marcar todas las notificaciones como leídas:",
        error
      );
    }
  },

  // Eliminar notificación
  deleteNotification: async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);

      // Actualizar estado local
      set((state) => {
        const notification = state.notifications.find(
          (n) => n.id === notificationId
        );
        const wasUnread = notification ? !notification.read : false;

        return {
          notifications: state.notifications.filter(
            (n) => n.id !== notificationId
          ),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  },

  // Actualizar preferencias de notificaciones
  updateNotificationPermissions: async (
    permissions: Partial<NotificationPermissions>
  ) => {
    try {
      const currentPermissions = get().notificationPermissions;
      const updatedPermissions = { ...currentPermissions, ...permissions };

      await NotificationService.saveNotificationPermissions(updatedPermissions);
      set({ notificationPermissions: updatedPermissions });
    } catch (error) {
      console.error(
        "Error al actualizar preferencias de notificaciones:",
        error
      );
    }
  },

  // Registrar para notificaciones push
  registerForPushNotifications: async () => {
    try {
      set({ isLoading: true });
      const token = await NotificationService.registerForPushNotifications();
      set({ isLoading: false });
      return token;
    } catch (error) {
      console.error("Error al registrar para notificaciones push:", error);
      set({
        error: "Error al registrar para notificaciones",
        isLoading: false,
      });
      return null;
    }
  },
}));
