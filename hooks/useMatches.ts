// hooks/useMatches.ts
import { useEffect, useState } from "react";
import { useMatchStore, Match, TeamType } from "@/store/matchStore";
import { useAuth } from "./useAuth";

export function useMatches() {
  const matchStore = useMatchStore();
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  // Cargar partidos al montar componente
  useEffect(() => {
    const loadMatches = async () => {
      if (user) {
        try {
          await matchStore.fetchMatches(user.uid, true);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    if (user) {
      loadMatches();
    } else {
      setIsInitializing(false);
    }
  }, [user?.uid]);

  // Función para obtener detalles de un partido específico
  const getMatchDetails = async (matchId: string): Promise<Match | null> => {
    try {
      return await matchStore.getMatchById(matchId);
    } catch (error) {
      console.error("Error al obtener detalles del partido:", error);
      return null;
    }
  };

  // Función para crear un partido
  const createMatch = async (matchData: Partial<Match>): Promise<string> => {
    return await matchStore.createMatch(matchData);
  };

  // Función para unirse a un partido
  const joinMatch = async (matchId: string, teamPreference?: TeamType) => {
    if (!user) throw new Error("Debes iniciar sesión para unirte a un partido");
    await matchStore.joinMatch(matchId, user.uid, teamPreference);
  };

  // Función para abandonar un partido
  const leaveMatch = async (matchId: string) => {
    if (!user)
      throw new Error("Debes iniciar sesión para abandonar un partido");
    await matchStore.leaveMatch(matchId, user.uid);
  };

  // Función para invitar a un jugador
  const invitePlayer = async (matchId: string, invitedUserId: string) => {
    if (!user)
      throw new Error("Debes iniciar sesión para invitar a un jugador");
    await matchStore.invitePlayer(matchId, invitedUserId, user.uid);
  };

  // Función para cambiar de equipo
  const changeTeam = async (
    matchId: string,
    playerId: string,
    newTeam: TeamType
  ) => {
    if (!user) throw new Error("Debes iniciar sesión para cambiar de equipo");

    // Si no se proporciona playerId, se usa el ID del usuario actual
    const targetPlayerId = playerId || user.uid;
    await matchStore.changeTeam(matchId, targetPlayerId, newTeam);
  };

  // Función para cancelar un partido
  const cancelMatch = async (matchId: string) => {
    if (!user) throw new Error("Debes iniciar sesión para cancelar un partido");
    await matchStore.cancelMatch(matchId);
  };

  // Función para aplicar filtros a los partidos
  const applyFilters = (filters: any) => {
    matchStore.setFilters(filters);
  };

  // Función para cargar más partidos (paginación)
  const loadMoreMatches = async () => {
    if (user) {
      await matchStore.fetchMoreMatches(user.uid);
    }
  };

  return {
    ...matchStore,
    isInitializing,
    getMatchDetails,
    createMatch,
    joinMatch,
    leaveMatch,
    invitePlayer,
    changeTeam,
    cancelMatch,
    applyFilters,
    loadMoreMatches,
  };
}
