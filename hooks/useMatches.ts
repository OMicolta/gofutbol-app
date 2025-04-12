// hooks/useMatches.ts
import { useEffect, useState } from "react";
import { useMatchStore, Match, TeamType } from "@/store/matchStore";
import { useAuth } from "./useAuth";
import { useNotification } from "@/context/NotificationContext";

export function useMatches() {
  const matchStore = useMatchStore();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isInitializing, setIsInitializing] = useState(true);
  const [indexError, setIndexError] = useState(false);

  // Cargar partidos al montar componente
  useEffect(() => {
    const loadMatches = async () => {
      if (user) {
        try {
          await matchStore.fetchMatches(user.uid, true);
          setIndexError(false);
        } catch (error) {
          console.error("Error al cargar partidos:", error);

          // Detectar error específico de índice de Firebase
          if (
            error instanceof Error &&
            error.message.includes("The query requires an index")
          ) {
            setIndexError(true);

            // Extraer la URL del índice si está disponible en el mensaje de error
            const indexUrlMatch = error.message.match(/(https?:\/\/[^\s]+)/);
            if (indexUrlMatch && indexUrlMatch[0]) {
              const indexUrl = indexUrlMatch[0];
              console.log("URL del índice requerido:", indexUrl);

              // Aquí podrías implementar algún mecanismo para notificar al usuario
              // sobre cómo crear el índice o incluso abrir la URL automáticamente
              // si la app está en modo de desarrollo
            }
          }
        } finally {
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };

    if (user) {
      loadMatches();
    } else {
      setIsInitializing(false);
    }
  }, [user?.uid]);

  // Función para obtener detalles de un partido específico con mejor manejo de errores
  const getMatchDetails = async (matchId: string): Promise<Match | null> => {
    try {
      return await matchStore.getMatchById(matchId);
    } catch (error) {
      console.error("Error al obtener detalles del partido:", error);
      handleFirebaseError(error);
      return null;
    }
  };

  // Función para crear un partido con mejor manejo de errores
  const createMatch = async (matchData: Partial<Match>): Promise<string> => {
    try {
      return await matchStore.createMatch(matchData);
    } catch (error) {
      console.error("Error al crear partido:", error);
      handleFirebaseError(error);
      throw error;
    }
  };

  // Función para unirse a un partido con mejor manejo de errores
  const joinMatch = async (matchId: string, teamPreference?: TeamType) => {
    try {
      if (!user)
        throw new Error("Debes iniciar sesión para unirte a un partido");
      await matchStore.joinMatch(matchId, user.uid, teamPreference);
    } catch (error) {
      console.error("Error al unirse al partido:", error);
      handleFirebaseError(error);
      throw error;
    }
  };

  // Función para abandonar un partido con mejor manejo de errores
  const leaveMatch = async (matchId: string) => {
    try {
      if (!user)
        throw new Error("Debes iniciar sesión para abandonar un partido");
      await matchStore.leaveMatch(matchId, user.uid);
    } catch (error) {
      console.error("Error al abandonar partido:", error);
      handleFirebaseError(error);
      throw error;
    }
  };

  // Función para invitar a un jugador con mejor manejo de errores
  const invitePlayer = async (matchId: string, invitedUserId: string) => {
    try {
      if (!user)
        throw new Error("Debes iniciar sesión para invitar a un jugador");
      await matchStore.invitePlayer(matchId, invitedUserId, user.uid);
    } catch (error) {
      console.error("Error al invitar jugador:", error);
      handleFirebaseError(error);
      throw error;
    }
  };

  // Función para cambiar de equipo con mejor manejo de errores
  const changeTeam = async (
    matchId: string,
    playerId: string,
    newTeam: TeamType
  ) => {
    try {
      if (!user) throw new Error("Debes iniciar sesión para cambiar de equipo");
      await matchStore.changeTeam(matchId, playerId, newTeam);
    } catch (error) {
      console.error("Error al cambiar equipo:", error);
      handleFirebaseError(error);
      throw error;
    }
  };

  // Función para cancelar un partido con mejor manejo de errores
  const cancelMatch = async (matchId: string) => {
    try {
      if (!user)
        throw new Error("Debes iniciar sesión para cancelar un partido");
      await matchStore.cancelMatch(matchId);
    } catch (error) {
      console.error("Error al cancelar partido:", error);
      handleFirebaseError(error);
      throw error;
    }
  };

  // Función para actualizar un partido con mejor manejo de errores
  const updateMatch = async (matchId: string, matchData: Partial<Match>) => {
    try {
      if (!user)
        throw new Error("Debes iniciar sesión para actualizar un partido");
      await matchStore.updateMatch(matchId, matchData);
    } catch (error) {
      console.error("Error al actualizar partido:", error);
      handleFirebaseError(error);
      throw error;
    }
  };

  // Función para aplicar filtros a los partidos
  const applyFilters = (filters: any) => {
    try {
      matchStore.setFilters(filters);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      handleFirebaseError(error);
    }
  };

  // Función para cargar más partidos (paginación)
  const loadMoreMatches = async () => {
    if (user) {
      try {
        await matchStore.fetchMoreMatches(user.uid);
      } catch (error) {
        console.error("Error al cargar más partidos:", error);
        handleFirebaseError(error);
      }
    }
  };

  // Función para manejar errores específicos de Firebase
  const handleFirebaseError = (error: any) => {
    if (error instanceof Error) {
      // Detectar error de índice
      if (error.message.includes("The query requires an index")) {
        setIndexError(true);
        showNotification(
          "Se requiere configuración adicional en la base de datos. Por favor, contacta al administrador.",
          "error"
        );
      } else {
        showNotification(error.message, "error");
      }
    } else {
      showNotification("Ha ocurrido un error inesperado", "error");
    }
  };

  // Función para intentar cargar de nuevo específicamente cuando hay error de índice
  const retryLoadAfterIndexError = async () => {
    if (!user) return;

    try {
      setIsInitializing(true);
      await matchStore.fetchMatches(user.uid, true);
      setIndexError(false);
    } catch (error) {
      console.error("Error al reintentar carga:", error);
      // Si sigue fallando después de crear el índice, podría ser otro problema
      if (
        !(
          error instanceof Error &&
          error.message.includes("The query requires an index")
        )
      ) {
        setIndexError(false);
        showNotification(
          "Ocurrió un error diferente al cargar los partidos",
          "error"
        );
      }
    } finally {
      setIsInitializing(false);
    }
  };

  return {
    ...matchStore,
    isInitializing,
    indexError,
    getMatchDetails,
    createMatch,
    joinMatch,
    leaveMatch,
    invitePlayer,
    changeTeam,
    cancelMatch,
    updateMatch,
    applyFilters,
    loadMoreMatches,
    retryLoadAfterIndexError,
  };
}
