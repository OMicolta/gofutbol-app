// functions\src\sendNotifications.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializar la app de Firebase Admin si no está inicializada
if (!admin.apps.length) {
  admin.initializeApp();
}

// Referencia a Firestore
const db = admin.firestore();

// Interfaces para tipar los datos
interface NotificationData {
  userId: string;
  title: string;
  body: string;
  data?: any;
  type: string;
  targetScreen?: string;
  targetParams?: Record<string, any>;
}

interface PlayerEntry {
  userId: string;
  status: string;
  team?: string;
}

interface MatchData {
  title?: string;
  status: string;
  players?: PlayerEntry[];
}

/**
 * Enviar notificación push a un usuario específico
 *
 * Esta función envía una notificación push al token del dispositivo del usuario
 * y también guarda una copia de la notificación en Firestore
 */
export const sendPushNotification = functions.https.onCall(
  async (data: NotificationData, context: functions.https.CallableContext) => {
    // Verificar si el usuario está autenticado
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "La función requiere autenticación"
      );
    }

    try {
      const {
        userId, // ID del usuario que recibirá la notificación
        title, // Título de la notificación
        body, // Cuerpo de la notificación
        data: extraData = {}, // Datos adicionales para la notificación
        type, // Tipo de notificación (match_invitation, etc.)
        targetScreen, // Pantalla a la que navegar al tocar
        targetParams = {}, // Parámetros para la navegación
      } = data;

      // Verificar parámetros requeridos
      if (!userId || !title || !body || !type) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Faltan parámetros requeridos: userId, title, body, type"
        );
      }

      // Buscar token del dispositivo del usuario
      const tokenDoc = await db.collection("userTokens").doc(userId).get();

      if (!tokenDoc.exists) {
        console.log(`No se encontró token para el usuario ${userId}`);
        // Aún así guardamos la notificación en Firestore
      } else {
        const tokenData = tokenDoc.data() as { token: string };
        const token = tokenData?.token;

        if (token) {
          // Obtener preferencias de notificaciones del usuario
          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.data() || {};
          const notificationSettings = userData.notificationSettings || {};

          // Verificar si el usuario ha desactivado este tipo de notificación
          let shouldSend = true;

          if (
            type === "match_invitation" &&
            notificationSettings.matchInvitations === false
          ) {
            shouldSend = false;
          } else if (
            type === "match_reminder" &&
            notificationSettings.matchReminders === false
          ) {
            shouldSend = false;
          } else if (
            ["player_joined", "player_left", "team_changed"].includes(type) &&
            notificationSettings.playerActivity === false
          ) {
            shouldSend = false;
          } else if (
            type === "rating_reminder" &&
            notificationSettings.ratings === false
          ) {
            shouldSend = false;
          } else if (
            type === "system" &&
            notificationSettings.systemUpdates === false
          ) {
            shouldSend = false;
          }

          // Enviar notificación push si está permitido
          if (shouldSend) {
            const message: admin.messaging.Message = {
              notification: {
                title,
                body,
              },
              data: {
                ...extraData,
                targetScreen: targetScreen || "",
                targetParams: JSON.stringify(targetParams || {}),
                type,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
              },
              token,
            };

            await admin.messaging().send(message);
            console.log(`Notificación enviada al usuario ${userId}`);
          } else {
            console.log(
              `Usuario ${userId} ha desactivado las notificaciones de tipo ${type}`
            );
          }
        }
      }

      // Guardar notificación en Firestore
      const notificationRef = db.collection("notifications").doc();
      await notificationRef.set({
        id: notificationRef.id,
        userId,
        title,
        body,
        data: extraData,
        type,
        read: false,
        createdAt: Date.now(),
        targetScreen: targetScreen || null,
        targetParams: targetParams || null,
      });

      return { success: true, notificationId: notificationRef.id };
    } catch (error) {
      console.error("Error al enviar notificación:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Error al enviar notificación",
        (error as Error).message
      );
    }
  }
);

/**
 * Enviar notificaciones a todos los participantes de un partido
 *
 * Esta función se activa cuando se actualiza un documento en la colección 'matches'
 * y envía notificaciones a todos los participantes según el tipo de cambio
 */
export const notifyMatchParticipants = functions.firestore
  .document("matches/{matchId}")
  .onUpdate(
    async (
      change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
      context: functions.EventContext
    ) => {
      const matchId = context.params.matchId;
      const newData = change.after.data() as MatchData;
      const previousData = change.before.data() as MatchData;

      // No hacer nada si el partido ha sido cancelado o ya terminó
      if (newData.status === "cancelled" || newData.status === "finished") {
        return null;
      }

      try {
        // Obtener todos los jugadores para enviar notificaciones
        const players = newData.players || [];
        const confirmedPlayers = players.filter(
          (p) => p.status === "confirmed"
        );

        // Caso 1: El partido estaba abierto y ahora está lleno
        if (previousData.status === "open" && newData.status === "full") {
          // Notificar a todos los jugadores confirmados
          for (const player of confirmedPlayers) {
            await sendNotificationToPlayer(
              player.userId,
              "¡Partido confirmado!",
              `El partido ${
                newData.title || "sin título"
              } ya tiene todos los jugadores necesarios.`,
              "match_update",
              matchId,
              { matchId }
            );
          }
        }

        // Caso 2: Cambios en equipos
        const previousTeamA =
          previousData.players?.filter((p) => p.team === "A") || [];
        const previousTeamB =
          previousData.players?.filter((p) => p.team === "B") || [];
        const currentTeamA =
          newData.players?.filter((p) => p.team === "A") || [];
        const currentTeamB =
          newData.players?.filter((p) => p.team === "B") || [];

        // Si hay cambios en la composición de los equipos
        if (
          previousTeamA.length !== currentTeamA.length ||
          previousTeamB.length !== currentTeamB.length
        ) {
          // Notificar a todos los jugadores confirmados sobre el cambio de equipos
          for (const player of confirmedPlayers) {
            await sendNotificationToPlayer(
              player.userId,
              "Equipos actualizados",
              `Los equipos del partido ${
                newData.title || "sin título"
              } han sido actualizados.`,
              "team_changed",
              matchId,
              { matchId }
            );
          }
        }

        // Caso 3: Notificar a los jugadores que han sido agregados recientemente
        const newlyAddedPlayers =
          newData.players?.filter((newPlayer) => {
            return !previousData.players?.some(
              (prevPlayer) =>
                prevPlayer.userId === newPlayer.userId &&
                prevPlayer.status === newPlayer.status
            );
          }) || [];

        for (const player of newlyAddedPlayers) {
          if (player.status === "invited") {
            await sendNotificationToPlayer(
              player.userId,
              "¡Nueva invitación a partido!",
              `Has sido invitado al partido ${newData.title || "sin título"}.`,
              "match_invitation",
              matchId,
              { matchId }
            );
          }
        }

        return { success: true };
      } catch (error) {
        console.error("Error al notificar a participantes del partido:", error);
        return { error: (error as Error).message };
      }
    }
  );

/**
 * Enviar recordatorios de partidos próximos
 *
 * Esta función programada se ejecuta cada hora para enviar recordatorios
 * de partidos que empezarán en 24 horas y 1 hora
 */
export const sendMatchReminders = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async (context: functions.EventContext) => {
    try {
      const now = Date.now();
      const oneHourInMs = 60 * 60 * 1000;
      const oneDayInMs = 24 * 60 * 60 * 1000;

      // Límites de tiempo para recordatorios
      const oneHourLater = now + oneHourInMs;
      const oneHourBefore = now - oneHourInMs;
      const oneDayLater = now + oneDayInMs;

      // Buscar partidos que comienzan en aproximadamente 24 horas
      const oneDayMatches = await db
        .collection("matches")
        .where("date", ">", new Date(oneDayLater - oneHourBefore))
        .where("date", "<", new Date(oneDayLater + oneHourBefore))
        .where("status", "in", ["open", "full"])
        .get();

      // Buscar partidos que comienzan en aproximadamente 1 hora
      const oneHourMatches = await db
        .collection("matches")
        .where("date", ">", new Date(oneHourLater - 15 * 60 * 1000)) // 15 minutos de margen
        .where("date", "<", new Date(oneHourLater + 15 * 60 * 1000))
        .where("status", "in", ["open", "full"])
        .get();

      // Enviar recordatorios de 24 horas
      for (const doc of oneDayMatches.docs) {
        const match = doc.data() as MatchData;
        const confirmedPlayers = (match.players || []).filter(
          (p) => p.status === "confirmed"
        );

        for (const player of confirmedPlayers) {
          await sendNotificationToPlayer(
            player.userId,
            "Recordatorio de partido",
            `Tu partido ${match.title || "sin título"} comienza mañana.`,
            "match_reminder",
            doc.id,
            { matchId: doc.id }
          );
        }
      }

      // Enviar recordatorios de 1 hora
      for (const doc of oneHourMatches.docs) {
        const match = doc.data() as MatchData;
        const confirmedPlayers = (match.players || []).filter(
          (p) => p.status === "confirmed"
        );

        for (const player of confirmedPlayers) {
          await sendNotificationToPlayer(
            player.userId,
            "Partido próximo",
            `Tu partido ${match.title || "sin título"} comienza en 1 hora.`,
            "match_reminder",
            doc.id,
            { matchId: doc.id }
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Error al enviar recordatorios de partidos:", error);
      return { error: (error as Error).message };
    }
  });

/**
 * Enviar recordatorios para calificar jugadores después de un partido
 *
 * Esta función se activa cuando un partido cambia a estado 'finished'
 * y envía recordatorios a todos los participantes para que califiquen
 */
export const sendRatingReminders = functions.firestore
  .document("matches/{matchId}")
  .onUpdate(
    async (
      change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
      context: functions.EventContext
    ) => {
      const matchId = context.params.matchId;
      const newData = change.after.data() as MatchData;
      const previousData = change.before.data() as MatchData;

      // Verificar si el partido acaba de cambiar a 'finished'
      if (previousData.status !== "finished" && newData.status === "finished") {
        try {
          const confirmedPlayers = (newData.players || []).filter(
            (p) => p.status === "confirmed"
          );

          // Enviar recordatorio a cada jugador
          for (const player of confirmedPlayers) {
            await sendNotificationToPlayer(
              player.userId,
              "Califica a tus compañeros",
              `No olvides calificar a los jugadores de "${
                newData.title || "sin título"
              }"`,
              "rating_reminder",
              matchId,
              { matchId }
            );
          }

          return { success: true };
        } catch (error) {
          console.error(
            "Error al enviar recordatorios de calificación:",
            error
          );
          return { error: (error as Error).message };
        }
      }

      return null;
    }
  );

// Función auxiliar para enviar una notificación a un jugador
async function sendNotificationToPlayer(
  userId: string,
  title: string,
  body: string,
  type: string,
  matchId: string,
  targetParams: Record<string, any> = {}
): Promise<{ success: boolean } | { error: string }> {
  try {
    // Intentar obtener el token del usuario
    const tokenDoc = await db.collection("userTokens").doc(userId).get();

    if (!tokenDoc.exists) {
      console.log(`No hay token para el usuario ${userId}`);
      // Aún así guardar la notificación en Firestore
    } else {
      const tokenData = tokenDoc.data() as { token: string };
      const token = tokenData?.token;

      if (token) {
        // Obtener preferencias de notificaciones
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data() || {};
        const notificationSettings = userData.notificationSettings || {};

        // Verificar si el usuario permite este tipo de notificación
        let shouldSend = true;

        if (
          type === "match_invitation" &&
          notificationSettings.matchInvitations === false
        ) {
          shouldSend = false;
        } else if (
          type === "match_reminder" &&
          notificationSettings.matchReminders === false
        ) {
          shouldSend = false;
        } else if (
          type === "player_joined" ||
          type === "player_left" ||
          type === "team_changed"
        ) {
          if (notificationSettings.playerActivity === false) {
            shouldSend = false;
          }
        } else if (
          type === "rating_reminder" &&
          notificationSettings.ratings === false
        ) {
          shouldSend = false;
        }

        // Enviar notificación push si está permitido
        if (shouldSend) {
          const message: admin.messaging.Message = {
            notification: {
              title,
              body,
            },
            data: {
              matchId,
              type,
              targetScreen: "match-details",
              targetParams: JSON.stringify(targetParams),
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
            token,
          };

          await admin.messaging().send(message);
          console.log(
            `Notificación enviada al usuario ${userId} para el partido ${matchId}`
          );
        } else {
          console.log(
            `Usuario ${userId} ha desactivado las notificaciones de tipo ${type}`
          );
        }
      }
    }

    // Guardar la notificación en Firestore
    const notificationRef = db.collection("notifications").doc();
    await notificationRef.set({
      id: notificationRef.id,
      userId,
      title,
      body,
      data: { matchId },
      type,
      read: false,
      createdAt: Date.now(),
      targetScreen: "match-details",
      targetParams,
    });

    return { success: true };
  } catch (error) {
    console.error(`Error al enviar notificación al usuario ${userId}:`, error);
    return { error: (error as Error).message };
  }
}
