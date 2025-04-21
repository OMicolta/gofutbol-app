// hooks/useInvitations.ts
import { useState, useEffect } from "react";
import { useMatchStore, Match } from "@/store/matchStore";
import { useAuth } from "@/hooks/useAuth";
import { useNotification } from "@/context/NotificationContext";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { UserProfile } from "@/store/authStore";

export function useInvitations() {
  const matchStore = useMatchStore();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Match[]>([]);

  // Cargar invitaciones pendientes para el usuario actual
  const loadPendingInvitations = async () => {
    if (!user) return [];

    setIsLoading(true);
    setError(null);

    try {
      // Obtener partidos con invitaciones pendientes
      const matchesRef = collection(db, "matches");
      const now = new Date();

      // Consulta para encontrar partidos donde el usuario está invitado
      const invitedMatchesQuery = query(
        matchesRef,
        where("players", "array-contains", {
          userId: user.uid,
          status: "invited",
        }),
        where("date", ">=", now)
      );

      const querySnapshot = await getDocs(invitedMatchesQuery);
      const invitations: Match[] = [];

      querySnapshot.forEach((doc) => {
        const matchData = doc.data();
        invitations.push({
          id: doc.id,
          ...matchData,
        } as Match);
      });

      setPendingInvitations(invitations);
      setIsLoading(false);
      return invitations;
    } catch (error) {
      console.error("Error al cargar invitaciones:", error);
      setError((error as Error).message);
      setIsLoading(false);
      return [];
    }
  };

  // Buscar usuarios para invitar
  const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
    if (!searchTerm || searchTerm.length < 2) return [];

    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const searchTermLower = searchTerm.toLowerCase();

      // Buscar por displayName
      const displayNameQuery = query(
        usersRef,
        where("displayName", ">=", searchTermLower),
        where("displayName", "<=", searchTermLower + "\uf8ff")
      );

      // Buscar por username si tiene @
      const usernameQuery = searchTerm.startsWith("@")
        ? query(
            usersRef,
            where("username", ">=", searchTermLower.substring(1)),
            where("username", "<=", searchTermLower.substring(1) + "\uf8ff")
          )
        : null;

      // Obtener resultados de la consulta por displayName
      const displayNameSnapshot = await getDocs(displayNameQuery);

      // Obtener resultados de la consulta por username (si existe)
      let usernameQueryResults: QuerySnapshot<DocumentData> | null = null;
      if (usernameQuery) {
        usernameQueryResults = await getDocs(usernameQuery);
      }

      const results: UserProfile[] = [];

      // Combinar resultados y eliminar duplicados
      const processedIds = new Set<string>();

      // Procesar resultados de displayName
      displayNameSnapshot.forEach(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const userData = doc.data() as UserProfile;
          if (!processedIds.has(userData.uid)) {
            results.push(userData);
            processedIds.add(userData.uid);
          }
        }
      );

      // Procesar resultados de username (si existen)
      if (usernameQueryResults) {
        usernameQueryResults.forEach(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const userData = doc.data() as UserProfile;
            if (!processedIds.has(userData.uid)) {
              results.push(userData);
              processedIds.add(userData.uid);
            }
          }
        );
      }

      setIsLoading(false);
      return results;
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
      setError((error as Error).message);
      setIsLoading(false);
      return [];
    }
  };

  // Invitar a un jugador
  const invitePlayer = async (matchId: string, invitedUserId: string) => {
    if (!user) {
      showNotification("Debes iniciar sesión para invitar jugadores", "error");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await matchStore.invitePlayer(matchId, invitedUserId, user.uid);
      showNotification("Invitación enviada correctamente", "success");
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      showNotification(`Error al enviar invitación: ${errorMessage}`, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Aceptar una invitación
  const acceptInvitation = async (
    matchId: string,
    teamPreference?: "A" | "B" | null
  ) => {
    if (!user) {
      showNotification(
        "Debes iniciar sesión para aceptar invitaciones",
        "error"
      );
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await matchStore.confirmInvitation(matchId, user.uid, teamPreference);
      showNotification("Has aceptado la invitación", "success");

      // Actualizar lista de invitaciones pendientes
      await loadPendingInvitations();
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      showNotification(`Error al aceptar invitación: ${errorMessage}`, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Rechazar una invitación
  const declineInvitation = async (matchId: string) => {
    if (!user) {
      showNotification(
        "Debes iniciar sesión para rechazar invitaciones",
        "error"
      );
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await matchStore.declineInvitation(matchId, user.uid);
      showNotification("Has rechazado la invitación", "success");

      // Actualizar lista de invitaciones pendientes
      await loadPendingInvitations();
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      showNotification(
        `Error al rechazar invitación: ${errorMessage}`,
        "error"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener número de invitaciones pendientes
  const getInvitationsCount = () => {
    return pendingInvitations.length;
  };

  // Cargar invitaciones al inicializar el hook
  useEffect(() => {
    if (user) {
      loadPendingInvitations();
    }
  }, [user]);

  return {
    pendingInvitations,
    loadPendingInvitations,
    searchUsers,
    invitePlayer,
    acceptInvitation,
    declineInvitation,
    getInvitationsCount,
    isLoading,
    error,
  };
}
