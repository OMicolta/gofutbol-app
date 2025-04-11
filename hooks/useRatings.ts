// hooks/useRatings.ts
import { useEffect, useState } from "react";
import { useRatingStore } from "@/store/ratingStore";
import { useAuth } from "./useAuth";

export function useRatings() {
  const ratingStore = useRatingStore();
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Cargar calificaciones y pendientes al montar el componente
  useEffect(() => {
    const loadRatings = async () => {
      if (user) {
        try {
          await Promise.all([
            ratingStore.fetchRatings(user.uid),
            ratingStore.fetchPendingRatings(user.uid),
          ]);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    if (user) {
      loadRatings();
    } else {
      setIsInitializing(false);
    }
  }, [user?.uid]);

  // Función para calificar a un jugador
  const ratePlayer = async (
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
    await ratingStore.ratePlayer(matchId, ratedUserId, ratingData);
  };

  // Función para obtener calificaciones de un partido específico
  const getMatchRatings = async (matchId: string) => {
    return await ratingStore.fetchRatingsByMatch(matchId);
  };

  // Función para actualizar una calificación
  const updateRating = async (ratingId: string, ratingData: any) => {
    await ratingStore.updateRating(ratingId, ratingData);
  };

  // Función para recargar calificaciones pendientes
  const refreshPendingRatings = async () => {
    if (user) {
      await ratingStore.fetchPendingRatings(user.uid);
    }
  };

  return {
    ...ratingStore,
    isInitializing,
    ratePlayer,
    getMatchRatings,
    updateRating,
    refreshPendingRatings,
  };
}
