// store/ratingStore.ts
import { create } from "zustand";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuthStore } from "./authStore";
import { useMatchStore, Match, PlayerEntry, PlayerRating } from "./matchStore";

interface Rating {
  id: string;
  matchId: string;
  ratedUserId: string;
  ratedByUserId: string;
  attendance: boolean;
  punctuality: number; // 1-5
  attitude: number; // 1-5
  isMVP: boolean;
  comment?: string;
  createdAt: Timestamp;
}

interface PendingRating {
  matchId: string;
  matchDate: Date;
  fieldName: string | null;
  players: PlayerEntry[];
}

interface RatingState {
  ratings: Rating[];
  pendingRatings: PendingRating[];
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchRatings: (userId: string) => Promise<void>;
  fetchPendingRatings: (userId: string) => Promise<void>;
  fetchRatingsByMatch: (matchId: string) => Promise<Rating[]>;
  ratePlayer: (
    matchId: string,
    ratedUserId: string,
    ratingData: {
      attendance: boolean;
      punctuality: number;
      attitude: number;
      isMVP: boolean;
      comment?: string;
    }
  ) => Promise<void>;
  updateRating: (
    ratingId: string,
    ratingData: Partial<Rating>
  ) => Promise<void>;
}

export const useRatingStore = create<RatingState>()((set, get) => ({
  ratings: [],
  pendingRatings: [],
  isLoading: false,
  error: null,

  // Obtener calificaciones dadas o recibidas por un usuario
  fetchRatings: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Crear query para calificaciones recibidas
      const ratingsRef = collection(db, "ratings");
      const ratingsQuery = query(
        ratingsRef,
        where("ratedUserId", "==", userId)
      );

      const querySnapshot = await getDocs(ratingsQuery);

      // Mapear documentos a objetos Rating
      const fetchedRatings: Rating[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const rating: Rating = {
          id: doc.id,
          matchId: data.matchId,
          ratedUserId: data.ratedUserId,
          ratedByUserId: data.ratedByUserId,
          attendance: data.attendance,
          punctuality: data.punctuality,
          attitude: data.attitude,
          isMVP: data.isMVP || false,
          comment: data.comment,
          createdAt: data.createdAt,
        };

        fetchedRatings.push(rating);
      });

      set({
        ratings: fetchedRatings,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  // Obtener partidos pendientes de calificar
  fetchPendingRatings: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Obtener partidos pasados donde el usuario participó
      const matchesRef = collection(db, "matches");
      const matchesQuery = query(
        matchesRef,
        where("players", "array-contains", {
          userId,
          status: "confirmed",
        }),
        where("date", "<=", Timestamp.fromDate(oneDayAgo)), // Al menos un día después del partido
        where("date", ">=", Timestamp.fromDate(oneWeekAgo)) // No más de una semana atrás
      );

      const matchesSnapshot = await getDocs(matchesQuery);

      // Mapear documentos a objetos PendingRating
      const pendingRatings: PendingRating[] = [];

      for (const matchDoc of matchesSnapshot.docs) {
        const matchData = matchDoc.data() as Match;

        // Verificar si el usuario ya calificó a todos los jugadores
        const ratingsRef = collection(db, "ratings");
        const ratingsQuery = query(
          ratingsRef,
          where("matchId", "==", matchDoc.id),
          where("ratedByUserId", "==", userId)
        );

        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratedUserIds = new Set(
          ratingsSnapshot.docs.map((doc) => doc.data().ratedUserId)
        );

        // Filtrar jugadores que asistieron y no han sido calificados
        const playersToRate = matchData.players.filter(
          (player) =>
            player.status === "confirmed" &&
            player.userId !== userId && // No se puede calificar a sí mismo
            !ratedUserIds.has(player.userId)
        );

        if (playersToRate.length > 0) {
          pendingRatings.push({
            matchId: matchDoc.id,
            matchDate: matchData.date.toDate(),
            fieldName: matchData.fieldName,
            players: playersToRate,
          });
        }
      }

      set({
        pendingRatings,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  // Obtener calificaciones de un partido específico
  fetchRatingsByMatch: async (matchId: string): Promise<Rating[]> => {
    try {
      set({ isLoading: true, error: null });

      // Crear query para calificaciones del partido
      const ratingsRef = collection(db, "ratings");
      const ratingsQuery = query(ratingsRef, where("matchId", "==", matchId));

      const querySnapshot = await getDocs(ratingsQuery);

      // Mapear documentos a objetos Rating
      const fetchedRatings: Rating[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const rating: Rating = {
          id: doc.id,
          matchId: data.matchId,
          ratedUserId: data.ratedUserId,
          ratedByUserId: data.ratedByUserId,
          attendance: data.attendance,
          punctuality: data.punctuality,
          attitude: data.attitude,
          isMVP: data.isMVP || false,
          comment: data.comment,
          createdAt: data.createdAt,
        };

        fetchedRatings.push(rating);
      });

      set({ isLoading: false });
      return fetchedRatings;
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      return [];
    }
  },

  // Calificar a un jugador
  ratePlayer: async (
    matchId: string,
    ratedUserId: string,
    ratingData: {
      attendance: boolean;
      punctuality: number;
      attitude: number;
      isMVP: boolean;
      comment?: string;
    }
  ) => {
    try {
      set({ isLoading: true, error: null });

      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error("Debes iniciar sesión para calificar a un jugador");
      }

      // Verificar si el partido existe
      const matchDoc = await getDoc(doc(db, "matches", matchId));

      if (!matchDoc.exists()) {
        throw new Error("Partido no encontrado");
      }

      const matchData = matchDoc.data() as Match;

      // Verificar si ambos usuarios participaron en el partido
      const ratingPlayerIndex = matchData.players.findIndex(
        (player) => player.userId === user.uid && player.status === "confirmed"
      );

      const ratedPlayerIndex = matchData.players.findIndex(
        (player) =>
          player.userId === ratedUserId && player.status === "confirmed"
      );

      if (ratingPlayerIndex === -1) {
        throw new Error("No participaste en este partido");
      }

      if (ratedPlayerIndex === -1) {
        throw new Error("El jugador a calificar no participó en este partido");
      }

      // Verificar si ya existe una calificación
      const ratingsRef = collection(db, "ratings");
      const existingRatingQuery = query(
        ratingsRef,
        where("matchId", "==", matchId),
        where("ratedUserId", "==", ratedUserId),
        where("ratedByUserId", "==", user.uid)
      );

      const existingRatingSnapshot = await getDocs(existingRatingQuery);

      if (!existingRatingSnapshot.empty) {
        throw new Error("Ya has calificado a este jugador en este partido");
      }

      // Crear la calificación en Firestore
      const newRating = {
        matchId,
        ratedUserId,
        ratedByUserId: user.uid,
        attendance: ratingData.attendance,
        punctuality: ratingData.punctuality,
        attitude: ratingData.attitude,
        isMVP: ratingData.isMVP,
        comment: ratingData.comment || "",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "ratings"), newRating);

      // También actualizar la calificación en el partido
      await useMatchStore
        .getState()
        .ratePlayer(matchId, ratedUserId, user.uid, {
          attendance: ratingData.attendance,
          punctuality: ratingData.punctuality,
          attitude: ratingData.attitude,
          isMVP: ratingData.isMVP,
        });

      // Actualizar las calificaciones pendientes
      await get().fetchPendingRatings(user.uid);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Actualizar una calificación existente
  updateRating: async (ratingId: string, ratingData: Partial<Rating>) => {
    try {
      set({ isLoading: true, error: null });

      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error(
          "Debes iniciar sesión para actualizar una calificación"
        );
      }

      // Verificar si la calificación existe
      const ratingDoc = await getDoc(doc(db, "ratings", ratingId));

      if (!ratingDoc.exists()) {
        throw new Error("Calificación no encontrada");
      }

      const ratingInfo = ratingDoc.data();

      // Verificar si el usuario es quien hizo la calificación
      if (ratingInfo.ratedByUserId !== user.uid) {
        throw new Error(
          "No puedes editar una calificación hecha por otro usuario"
        );
      }

      // Actualizar calificación en Firestore
      await updateDoc(doc(db, "ratings", ratingId), {
        ...ratingData,
        updatedAt: serverTimestamp(),
      });

      // También actualizar la calificación en el partido si es necesario
      if (
        "attendance" in ratingData ||
        "punctuality" in ratingData ||
        "attitude" in ratingData ||
        "isMVP" in ratingData
      ) {
        const playerRating: PlayerRating = {
          attendance:
            "attendance" in ratingData
              ? ratingData.attendance!
              : ratingInfo.attendance,
          punctuality:
            "punctuality" in ratingData
              ? ratingData.punctuality!
              : ratingInfo.punctuality,
          attitude:
            "attitude" in ratingData
              ? ratingData.attitude!
              : ratingInfo.attitude,
          isMVP: "isMVP" in ratingData ? ratingData.isMVP! : ratingInfo.isMVP,
        };

        await useMatchStore
          .getState()
          .ratePlayer(
            ratingInfo.matchId,
            ratingInfo.ratedUserId,
            user.uid,
            playerRating
          );
      }

      // Actualizar las calificaciones
      await get().fetchRatings(user.uid);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },
}));
