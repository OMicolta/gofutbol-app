// services\notification.ts

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  Timestamp,
  updateDoc,
  orderBy,
  limit,
  deleteDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../config/firebase";
import {
  Notification,
  NotificationPermissions,
  DEFAULT_NOTIFICATION_PERMISSIONS,
} from "../types/notification";
import { Alert } from "react-native";
import Constants from "expo-constants";

// Configurar manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Clave para almacenar el token del dispositivo
const PUSH_TOKEN_KEY = "push_notification_token";
const NOTIFICATION_PERMISSIONS_KEY = "notification_permissions";

// Registra el dispositivo para notificaciones push
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log("Las notificaciones push no están disponibles en el emulador");
    return null;
  }

  try {
    // Verificar permisos
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si no tenemos permisos, solicitarlos
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Si no obtenemos permisos, no podemos continuar
    if (finalStatus !== "granted") {
      Alert.alert(
        "Permisos requeridos",
        "Para recibir notificaciones sobre tus partidos y amigos, necesitamos tu permiso."
      );
      return null;
    }

    // Obtener directamente el token del dispositivo (sin depender del project ID)
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token = deviceToken.data;
    console.log("Token de dispositivo obtenido:", token);

    // Guardar token localmente
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Configuración específica para Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1DB954",
      });
    }

    // Si el usuario está autenticado, registrar token en Firestore
    await saveTokenToFirestore(token);

    return token;
  } catch (error) {
    console.error("Error al registrar para notificaciones push:", error);
    return null;
  }
}

// Guardar token en Firestore
export async function saveTokenToFirestore(token: string) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const tokenRef = doc(db, "userTokens", currentUser.uid);
    await setDoc(
      tokenRef,
      {
        token,
        device: Device.deviceName || "Dispositivo desconocido",
        platform: Platform.OS,
        userId: currentUser.uid,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    console.log("Token guardado en Firestore");
  } catch (error) {
    console.error("Error al guardar token en Firestore:", error);
  }
}

// Obtener token almacenado localmente
export async function getStoredPushToken() {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch (error) {
    console.error("Error al obtener token almacenado:", error);
    return null;
  }
}

// Programar una notificación local
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput = null,
  data: object = {}
) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
      },
      trigger,
    });
    return notificationId;
  } catch (error) {
    console.error("Error al programar notificación local:", error);
    return null;
  }
}

// Cancelar una notificación programada
export async function cancelScheduledNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error al cancelar notificación programada:", error);
  }
}

// Obtener todas las notificaciones programadas
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error al obtener notificaciones programadas:", error);
    return [];
  }
}

// Guardar una notificación en Firestore
export async function saveNotificationToFirestore(
  notification: Omit<Notification, "id">
) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const notificationsRef = collection(db, "notifications");
    const newNotificationRef = doc(notificationsRef);

    const notificationData: Notification = {
      ...notification,
      id: newNotificationRef.id,
      createdAt: Date.now(),
    };

    await setDoc(newNotificationRef, notificationData);
    return notificationData.id;
  } catch (error) {
    console.error("Error al guardar notificación en Firestore:", error);
    return null;
  }
}

// Obtener notificaciones del usuario desde Firestore
export async function getUserNotifications(limitCount = 20) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as Notification);
  } catch (error) {
    console.error("Error al obtener notificaciones del usuario:", error);
    return [];
  }
}

// Marcar una notificación como leída
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
  }
}

// Marcar todas las notificaciones como leídas
export async function markAllNotificationsAsRead() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", currentUser.uid),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  } catch (error) {
    console.error(
      "Error al marcar todas las notificaciones como leídas:",
      error
    );
  }
}

// Eliminar una notificación
export async function deleteNotification(notificationId: string) {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error("Error al eliminar notificación:", error);
  }
}

// Obtener el contador de notificaciones no leídas
export async function getUnreadNotificationCount() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return 0;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", currentUser.uid),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error(
      "Error al obtener contador de notificaciones no leídas:",
      error
    );
    return 0;
  }
}

// Guardar preferencias de notificaciones del usuario
export async function saveNotificationPermissions(
  permissions: NotificationPermissions
) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Guardar en AsyncStorage
    await AsyncStorage.setItem(
      NOTIFICATION_PERMISSIONS_KEY,
      JSON.stringify(permissions)
    );

    // Guardar en Firestore
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, { notificationSettings: permissions });
  } catch (error) {
    console.error("Error al guardar preferencias de notificaciones:", error);
  }
}

// Obtener preferencias de notificaciones del usuario
export async function getNotificationPermissions(): Promise<NotificationPermissions> {
  try {
    // Primero intentamos obtener de AsyncStorage para acceso rápido
    const storedPermissions = await AsyncStorage.getItem(
      NOTIFICATION_PERMISSIONS_KEY
    );

    if (storedPermissions) {
      return JSON.parse(storedPermissions);
    }

    // Si no está en AsyncStorage y el usuario está autenticado, intentamos obtener de Firestore
    const currentUser = auth.currentUser;
    if (!currentUser) return DEFAULT_NOTIFICATION_PERMISSIONS;

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();

    if (userData?.notificationSettings) {
      // Guardar en AsyncStorage para acceso rápido en el futuro
      await AsyncStorage.setItem(
        NOTIFICATION_PERMISSIONS_KEY,
        JSON.stringify(userData.notificationSettings)
      );
      return userData.notificationSettings as NotificationPermissions;
    }

    // Si no existe, devolver los valores predeterminados
    return DEFAULT_NOTIFICATION_PERMISSIONS;
  } catch (error) {
    console.error("Error al obtener preferencias de notificaciones:", error);
    return DEFAULT_NOTIFICATION_PERMISSIONS;
  }
}

// Añadir eventos de escucha para notificaciones recibidas y respondidas
export function addNotificationListeners(
  onReceive: (notification: Notifications.Notification) => void,
  onRespond: (response: Notifications.NotificationResponse) => void
) {
  const receiveSubscription =
    Notifications.addNotificationReceivedListener(onReceive);
  const respondSubscription =
    Notifications.addNotificationResponseReceivedListener(onRespond);

  return {
    remove: () => {
      receiveSubscription.remove();
      respondSubscription.remove();
    },
  };
}

// Funciones de ayuda para crear notificaciones según el tipo
export function createMatchInvitationNotification(
  userId: string,
  matchId: string,
  matchTitle: string,
  inviterName: string
) {
  const notification: Omit<Notification, "id"> = {
    userId,
    title: "¡Nueva invitación a partido!",
    body: `${inviterName} te ha invitado a jugar en "${matchTitle}"`,
    type: "match_invitation",
    read: false,
    createdAt: Date.now(),
    targetScreen: "match-details",
    targetParams: { matchId },
    data: { matchId },
  };

  return saveNotificationToFirestore(notification);
}

export function createMatchReminderNotification(
  userId: string,
  matchId: string,
  matchTitle: string,
  timeRemaining: string
) {
  const notification: Omit<Notification, "id"> = {
    userId,
    title: "Recordatorio de partido",
    body: `Tu partido "${matchTitle}" comienza en ${timeRemaining}`,
    type: "match_reminder",
    read: false,
    createdAt: Date.now(),
    targetScreen: "match-details",
    targetParams: { matchId },
    data: { matchId },
  };

  return saveNotificationToFirestore(notification);
}

export function createMatchUpdateNotification(
  userId: string,
  matchId: string,
  matchTitle: string,
  updateMessage: string
) {
  const notification: Omit<Notification, "id"> = {
    userId,
    title: "Actualización de partido",
    body: `${updateMessage} en "${matchTitle}"`,
    type: "match_update",
    read: false,
    createdAt: Date.now(),
    targetScreen: "match-details",
    targetParams: { matchId },
    data: { matchId },
  };

  return saveNotificationToFirestore(notification);
}

export function createRatingReminderNotification(
  userId: string,
  matchId: string,
  matchTitle: string
) {
  const notification: Omit<Notification, "id"> = {
    userId,
    title: "Califica a tus compañeros",
    body: `No olvides calificar a los jugadores de "${matchTitle}"`,
    type: "rating_reminder",
    read: false,
    createdAt: Date.now(),
    targetScreen: "match-ratings",
    targetParams: { matchId },
    data: { matchId },
  };

  return saveNotificationToFirestore(notification);
}
