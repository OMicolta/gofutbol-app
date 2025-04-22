// types/notification.ts

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: object;
  read: boolean;
  type: NotificationType;
  createdAt: number; // Timestamp
  targetScreen?: string; // Pantalla a la que navegar al tocar la notificación
  targetParams?: object; // Parámetros para la navegación
}

export type NotificationType =
  | "match_invitation"
  | "match_reminder"
  | "match_update"
  | "match_cancelled"
  | "player_joined"
  | "player_left"
  | "team_changed"
  | "rating_reminder"
  | "system";

// Define los permisos de notificaciones que el usuario puede configurar
export interface NotificationPermissions {
  matchInvitations: boolean;
  matchReminders: boolean;
  playerActivity: boolean;
  ratings: boolean;
  systemUpdates: boolean;
}

// Estado por defecto para los permisos de notificaciones
export const DEFAULT_NOTIFICATION_PERMISSIONS: NotificationPermissions = {
  matchInvitations: true,
  matchReminders: true,
  playerActivity: true,
  ratings: true,
  systemUpdates: true,
};
