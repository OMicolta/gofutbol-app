// store/matchStore.ts
import { create } from "zustand";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  GeoPoint,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuthStore, UserProfile } from "./authStore";
import { Field } from "./fieldStore";

export type MatchType = "5v5" | "6v6" | "7v7" | "11v11" | "libre";
export type MatchStatus = "open" | "full" | "cancelled" | "finished";
export type TeamType = "A" | "B" | null;
export type PlayerStatus = "invited" | "confirmed" | "declined" | "removed";
export type MatchLevel = "beginner" | "intermediate" | "advanced" | "all";

export interface PlayerRating {
  attendance: boolean;
  punctuality: number; // 1-5
  attitude: number; // 1-5
  isMVP?: boolean;
}

export interface PlayerEntry {
  userId: string;
  displayName: string;
  photoURL: string | null;
  team: TeamType;
  status: PlayerStatus;
  rating?: PlayerRating;
  invitedBy?: string;
  invitedAt?: Timestamp;
  joinedAt?: Timestamp;
}

export interface Match {
  id: string;
  createdBy: string;
  creatorName: string;
  date: Timestamp;
  time: string;
  fieldId: string | null;
  fieldName: string | null;
  address: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  type: MatchType;
  level: MatchLevel;
  price: number | null;
  isPrivate: boolean;
  status: MatchStatus;
  maxPlayers: number;
  players: PlayerEntry[];
  description: string;
  uniformA: string | null;
  uniformB: string | null;
  chatEnabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  distance?: number; // Calculado en tiempo real
}

interface MatchFilters {
  date?: Date | null;
  type?: MatchType[];
  level?: MatchLevel[];
  status?: MatchStatus[];
  onlyMine?: boolean;
  onlyJoined?: boolean;
  onlyWithSpots?: boolean;
  query?: string;
  sortBy: "date" | "distance";
}

interface MatchState {
  matches: Match[];
  filteredMatches: Match[];
  myMatches: Match[];
  myCreatedMatches: Match[];
  selectedMatch: Match | null;
  filters: MatchFilters;
  isLoading: boolean;
  error: string | null;
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;

  // Acciones principales
  fetchMatches: (userId: string, fresh?: boolean) => Promise<void>;
  fetchMoreMatches: (userId: string) => Promise<void>;
  getMatchById: (id: string) => Promise<Match | null>;
  createMatch: (matchData: Partial<Match>) => Promise<string>;
  updateMatch: (id: string, data: Partial<Match>) => Promise<void>;
  cancelMatch: (id: string) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;

  // Acciones de jugadores
  joinMatch: (
    matchId: string,
    userId: string,
    teamPreference?: TeamType
  ) => Promise<void>;
  leaveMatch: (matchId: string, userId: string) => Promise<void>;
  invitePlayer: (
    matchId: string,
    invitedUserId: string,
    invitedByUserId: string
  ) => Promise<void>;
  confirmInvitation: (
    matchId: string,
    userId: string,
    teamPreference?: TeamType
  ) => Promise<void>;
  declineInvitation: (matchId: string, userId: string) => Promise<void>;
  changeTeam: (
    matchId: string,
    userId: string,
    newTeam: TeamType
  ) => Promise<void>;
  removePlayer: (
    matchId: string,
    userId: string,
    removedByUserId: string
  ) => Promise<void>;

  // Calificaciones
  ratePlayer: (
    matchId: string,
    ratedUserId: string,
    ratingUserId: string,
    rating: PlayerRating
  ) => Promise<void>;

  // Filtros
  setFilters: (newFilters: Partial<MatchFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;

  // Selección
  selectMatch: (match: Match | null) => void;
}

const defaultFilters: MatchFilters = {
  sortBy: "date",
};

export const useMatchStore = create<MatchState>()((set, get) => ({
  matches: [],
  filteredMatches: [],
  myMatches: [],
  myCreatedMatches: [],
  selectedMatch: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,
  lastVisible: null,

  // Obtener partidos con paginación
  fetchMatches: async (userId: string, fresh = false) => {
    try {
      set({ isLoading: true, error: null });

      // Si es una carga fresca, resetear lastVisible
      if (fresh) {
        set({ lastVisible: null });
      }

      // Obtener hora actual para filtrar partidos pasados
      const now = new Date();
      const timestamp = Timestamp.fromDate(now);

      // Crear query base para partidos públicos futuros
      const matchesRef = collection(db, "matches");
      let matchQuery = query(
        matchesRef,
        where("date", ">=", timestamp),
        where("isPrivate", "==", false),
        where("status", "in", ["open", "full"]),
        orderBy("date", "asc"),
        limit(20)
      );

      // Si no es una carga fresca y tenemos lastVisible, usar startAfter
      if (!fresh && get().lastVisible) {
        matchQuery = query(
          matchesRef,
          where("date", ">=", timestamp),
          where("isPrivate", "==", false),
          where("status", "in", ["open", "full"]),
          orderBy("date", "asc"),
          startAfter(get().lastVisible),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(matchQuery);

      // Guardar último documento visible para paginación
      const lastVisible =
        querySnapshot.docs[querySnapshot.docs.length - 1] || null;

      // Mapear documentos a objetos Match
      const fetchedMatches: Match[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const match: Match = {
          id: doc.id,
          createdBy: data.createdBy || "",
          creatorName: data.creatorName || "",
          date: data.date,
          time: data.time || "",
          fieldId: data.fieldId || null,
          fieldName: data.fieldName || null,
          address: data.address || null,
          location: data.location || null,
          type: data.type || "5v5",
          level: data.level || "all",
          price: data.price || null,
          isPrivate: data.isPrivate || false,
          status: data.status || "open",
          maxPlayers: data.maxPlayers || getDefaultMaxPlayers(data.type),
          players: data.players || [],
          description: data.description || "",
          uniformA: data.uniformA || null,
          uniformB: data.uniformB || null,
          chatEnabled: data.chatEnabled || true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        fetchedMatches.push(match);
      });

      // Recuperar también partidos a los que el usuario está invitado o confirmado
      const myMatchesQuery = query(
        matchesRef,
        where("players", "array-contains", {
          userId,
          status: "confirmed",
        }),
        where("date", ">=", timestamp),
        where("status", "in", ["open", "full"])
      );

      const myMatchesSnapshot = await getDocs(myMatchesQuery);
      const myMatches: Match[] = [];

      myMatchesSnapshot.forEach((doc) => {
        const data = doc.data();
        const match: Match = {
          id: doc.id,
          createdBy: data.createdBy || "",
          creatorName: data.creatorName || "",
          date: data.date,
          time: data.time || "",
          fieldId: data.fieldId || null,
          fieldName: data.fieldName || null,
          address: data.address || null,
          location: data.location || null,
          type: data.type || "5v5",
          level: data.level || "all",
          price: data.price || null,
          isPrivate: data.isPrivate || false,
          status: data.status || "open",
          maxPlayers: data.maxPlayers || getDefaultMaxPlayers(data.type),
          players: data.players || [],
          description: data.description || "",
          uniformA: data.uniformA || null,
          uniformB: data.uniformB || null,
          chatEnabled: data.chatEnabled || true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        myMatches.push(match);
      });

      // Recuperar partidos creados por el usuario
      const myCreatedMatchesQuery = query(
        matchesRef,
        where("createdBy", "==", userId),
        where("date", ">=", timestamp),
        where("status", "in", ["open", "full"])
      );

      const myCreatedMatchesSnapshot = await getDocs(myCreatedMatchesQuery);
      const myCreatedMatches: Match[] = [];

      myCreatedMatchesSnapshot.forEach((doc) => {
        const data = doc.data();
        const match: Match = {
          id: doc.id,
          createdBy: data.createdBy || "",
          creatorName: data.creatorName || "",
          date: data.date,
          time: data.time || "",
          fieldId: data.fieldId || null,
          fieldName: data.fieldName || null,
          address: data.address || null,
          location: data.location || null,
          type: data.type || "5v5",
          level: data.level || "all",
          price: data.price || null,
          isPrivate: data.isPrivate || false,
          status: data.status || "open",
          maxPlayers: data.maxPlayers || getDefaultMaxPlayers(data.type),
          players: data.players || [],
          description: data.description || "",
          uniformA: data.uniformA || null,
          uniformB: data.uniformB || null,
          chatEnabled: data.chatEnabled || true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        myCreatedMatches.push(match);
      });

      // Si es carga fresca, reemplazar los partidos
      const matches = fresh
        ? fetchedMatches
        : [...get().matches, ...fetchedMatches];

      set({
        matches,
        filteredMatches: matches,
        myMatches,
        myCreatedMatches,
        lastVisible,
        isLoading: false,
      });

      // Aplicar filtros actuales a los nuevos partidos
      get().applyFilters();
    } catch (error) {
      console.log(error);
      set({
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  // Cargar más partidos (paginación)
  fetchMoreMatches: async (userId: string) => {
    if (!get().lastVisible || get().isLoading) return;
    await get().fetchMatches(userId, false);
  },

  // Obtener partido por ID
  getMatchById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      // Primero revisar si ya lo tenemos en el estado
      const cachedMatch =
        get().matches.find((match) => match.id === id) ||
        get().myMatches.find((match) => match.id === id) ||
        get().myCreatedMatches.find((match) => match.id === id);

      if (cachedMatch) {
        set({ selectedMatch: cachedMatch, isLoading: false });
        return cachedMatch;
      }

      // Si no está en caché, buscarlo en Firestore
      const matchDoc = await getDoc(doc(db, "matches", id));

      if (matchDoc.exists()) {
        const data = matchDoc.data();
        const match: Match = {
          id: matchDoc.id,
          createdBy: data.createdBy || "",
          creatorName: data.creatorName || "",
          date: data.date,
          time: data.time || "",
          fieldId: data.fieldId || null,
          fieldName: data.fieldName || null,
          address: data.address || null,
          location: data.location || null,
          type: data.type || "5v5",
          level: data.level || "all",
          price: data.price || null,
          isPrivate: data.isPrivate || false,
          status: data.status || "open",
          maxPlayers: data.maxPlayers || getDefaultMaxPlayers(data.type),
          players: data.players || [],
          description: data.description || "",
          uniformA: data.uniformA || null,
          uniformB: data.uniformB || null,
          chatEnabled: data.chatEnabled || true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        set({ selectedMatch: match, isLoading: false });
        return match;
      }

      set({ isLoading: false });
      return null;
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      return null;
    }
  },

  // Crear un nuevo partido
  createMatch: async (matchData: Partial<Match>) => {
    try {
      set({ isLoading: true, error: null });

      const user = useAuthStore.getState().user;
      const profile = useAuthStore.getState().profile;

      if (!user || !profile) {
        throw new Error("Debes iniciar sesión para crear un partido");
      }

      // Si se proporciona un fieldId, obtener los datos de la cancha
      let fieldData = null;
      if (matchData.fieldId) {
        const fieldDoc = await getDoc(doc(db, "fields", matchData.fieldId));
        if (fieldDoc.exists()) {
          fieldData = fieldDoc.data();
        }
      }

      // Determinar el número máximo de jugadores según el tipo
      const maxPlayers =
        matchData.maxPlayers ||
        getDefaultMaxPlayers(matchData.type as MatchType);

      // Función auxiliar corregida para TypeScript
      // Usando type assertion para manejar valores null
      const ensureValidValue = <T>(
        value: T | undefined | null,
        defaultValue: T
      ): T => {
        return value === undefined ? defaultValue : (value as T);
      };

      // Crear el objeto del partido con valores seguros (sin undefined)
      const newMatch = {
        createdBy: user.uid,
        creatorName: user.displayName || "Usuario",
        date: ensureValidValue<Timestamp>(
          matchData.date,
          Timestamp.fromDate(new Date())
        ),
        time: ensureValidValue<string>(matchData.time, "18:00"),
        fieldId: ensureValidValue<string | null>(matchData.fieldId, null),
        fieldName: ensureValidValue<string | null>(
          fieldData?.name || matchData.fieldName,
          null
        ),
        address: ensureValidValue<string | null>(
          fieldData?.address || matchData.address,
          null
        ),
        location: ensureValidValue<any>(
          fieldData?.geoPoint || matchData.location,
          null
        ),
        type: ensureValidValue<MatchType>(
          matchData.type as MatchType,
          "5v5" as MatchType
        ),
        level: ensureValidValue<MatchLevel>(
          matchData.level as MatchLevel,
          "all" as MatchLevel
        ),
        price: ensureValidValue<number | null>(matchData.price, null),
        isPrivate: ensureValidValue<boolean>(matchData.isPrivate, false),
        status: "open" as MatchStatus,
        maxPlayers,
        players: [
          {
            userId: user.uid,
            displayName: user.displayName || "Usuario",
            photoURL: user.photoURL || null, // Aseguramos que photoURL nunca sea undefined
            team: "A" as TeamType,
            status: "confirmed" as PlayerStatus,
            joinedAt: Timestamp.now(),
          },
        ],
        description: ensureValidValue<string>(matchData.description, ""),
        uniformA: ensureValidValue<string | null>(matchData.uniformA, null),
        uniformB: ensureValidValue<string | null>(matchData.uniformB, null),
        chatEnabled: ensureValidValue<boolean>(
          matchData.chatEnabled !== undefined ? matchData.chatEnabled : true,
          true
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Verificar que no haya valores undefined en el objeto final
      // Esto es una comprobación de seguridad adicional
      const safeMatch = Object.fromEntries(
        Object.entries(newMatch).map(([key, value]) => [
          key,
          value === undefined ? null : value,
        ])
      );

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, "matches"), safeMatch);

      // Actualizar la lista de partidos
      await get().fetchMatches(user.uid, true);

      set({ isLoading: false });
      return docRef.id;
    } catch (error) {
      console.error("Error en createMatch:", error);
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Actualizar un partido existente
  updateMatch: async (id: string, data: Partial<Match>) => {
    try {
      set({ isLoading: true, error: null });

      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error("Debes iniciar sesión para actualizar un partido");
      }

      // Verificar si el usuario es el creador del partido
      const matchDoc = await getDoc(doc(db, "matches", id));

      if (!matchDoc.exists()) {
        throw new Error("Partido no encontrado");
      }

      const matchData = matchDoc.data();

      if (matchData.createdBy !== user.uid) {
        throw new Error("Solo el creador puede actualizar el partido");
      }

      // Actualizar el partido
      await updateDoc(doc(db, "matches", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(user.uid, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Cancelar un partido
  cancelMatch: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error("Debes iniciar sesión para cancelar un partido");
      }

      // Verificar si el usuario es el creador del partido
      const matchDoc = await getDoc(doc(db, "matches", id));

      if (!matchDoc.exists()) {
        throw new Error("Partido no encontrado");
      }

      const matchData = matchDoc.data();

      if (matchData.createdBy !== user.uid) {
        throw new Error("Solo el creador puede cancelar el partido");
      }

      // Cambiar el estado a cancelado
      await updateDoc(doc(db, "matches", id), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(user.uid, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Eliminar un partido (solo para administradores o el creador)
  deleteMatch: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error("Debes iniciar sesión para eliminar un partido");
      }

      // Verificar si el usuario es el creador del partido
      const matchDoc = await getDoc(doc(db, "matches", id));

      if (!matchDoc.exists()) {
        throw new Error("Partido no encontrado");
      }

      const matchData = matchDoc.data();

      if (matchData.createdBy !== user.uid) {
        throw new Error("Solo el creador puede eliminar el partido");
      }

      // Eliminar el partido
      await deleteDoc(doc(db, "matches", id));

      // Actualizar la lista de partidos
      await get().fetchMatches(user.uid, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Unirse a un partido
  joinMatch: async (
    matchId: string,
    userId: string,
    teamPreference: TeamType = null
  ) => {
    try {
      set({ isLoading: true, error: null });

      const userProfile = useAuthStore.getState().profile;
      const user = useAuthStore.getState().user;

      if (!user || !userProfile) {
        throw new Error("Debes iniciar sesión para unirte a un partido");
      }

      const matchRef = doc(db, "matches", matchId);

      // Usar una transacción para asegurar datos consistentes
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error("Partido no encontrado");
        }

        const matchData = matchDoc.data();

        // Verificar si el partido es privado
        if (matchData.isPrivate && matchData.createdBy !== userId) {
          // Comprobar si el usuario está invitado
          const isInvited = matchData.players.some(
            (player: PlayerEntry) =>
              player.userId === userId && player.status === "invited"
          );

          if (!isInvited) {
            throw new Error("Este partido es privado y requiere invitación");
          }
        }

        // Verificar si el usuario ya está en el partido
        const playerIndex = matchData.players.findIndex(
          (player: PlayerEntry) => player.userId === userId
        );

        if (playerIndex >= 0) {
          const player = matchData.players[playerIndex];

          if (player.status === "confirmed") {
            throw new Error("Ya estás confirmado en este partido");
          }

          if (player.status === "removed") {
            throw new Error("Has sido removido de este partido");
          }

          // Actualizar estado a confirmado
          matchData.players[playerIndex] = {
            ...player,
            status: "confirmed",
            team:
              teamPreference ||
              player.team ||
              getBalancedTeam(matchData.players),
            joinedAt: Timestamp.now(),
          };
        } else {
          // Añadir al usuario como jugador
          matchData.players.push({
            userId,
            displayName: user.displayName || "Usuario",
            photoURL: user.photoURL,
            team: teamPreference || getBalancedTeam(matchData.players),
            status: "confirmed",
            joinedAt: Timestamp.now(),
          });
        }

        // Verificar si se alcanzó el máximo de jugadores
        const confirmedPlayers = matchData.players.filter(
          (player: PlayerEntry) => player.status === "confirmed"
        );

        if (confirmedPlayers.length >= matchData.maxPlayers) {
          matchData.status = "full";
        }

        // Actualizar el partido
        transaction.update(matchRef, {
          players: matchData.players,
          status: matchData.status,
          updatedAt: serverTimestamp(),
        });
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(userId, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Abandonar un partido
  leaveMatch: async (matchId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const userProfile = useAuthStore.getState().profile;

      if (!userProfile) {
        throw new Error("Debes iniciar sesión para abandonar un partido");
      }

      const matchRef = doc(db, "matches", matchId);

      // Usar una transacción para asegurar datos consistentes
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error("Partido no encontrado");
        }

        const matchData = matchDoc.data();

        // Verificar si el usuario es el creador (no puede abandonar, solo puede cancelar)
        if (matchData.createdBy === userId) {
          throw new Error(
            "El creador no puede abandonar, debe cancelar el partido"
          );
        }

        // Encontrar al jugador
        const playerIndex = matchData.players.findIndex(
          (player: PlayerEntry) => player.userId === userId
        );

        if (playerIndex === -1) {
          throw new Error("No estás en este partido");
        }

        // Actualizar estado a declinado
        matchData.players[playerIndex] = {
          ...matchData.players[playerIndex],
          status: "declined",
          team: null,
        };

        // Si el partido estaba lleno, cambiarlo a abierto
        if (matchData.status === "full") {
          matchData.status = "open";
        }

        // Actualizar el partido
        transaction.update(matchRef, {
          players: matchData.players,
          status: matchData.status,
          updatedAt: serverTimestamp(),
        });
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(userId, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Invitar a un jugador
  invitePlayer: async (
    matchId: string,
    invitedUserId: string,
    invitedByUserId: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      // Verificar si el usuario que invita está en el partido
      const matchRef = doc(db, "matches", matchId);

      // Obtener datos del usuario invitado
      const invitedUserDoc = await getDoc(doc(db, "users", invitedUserId));

      if (!invitedUserDoc.exists()) {
        throw new Error("Usuario invitado no encontrado");
      }

      const invitedUserData = invitedUserDoc.data() as UserProfile;

      // Usar una transacción para asegurar datos consistentes
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error("Partido no encontrado");
        }

        const matchData = matchDoc.data();

        // Verificar si el que invita es el creador o está confirmado en el partido
        const invitingPlayer = matchData.players.find(
          (player: PlayerEntry) =>
            player.userId === invitedByUserId &&
            (player.status === "confirmed" ||
              matchData.createdBy === invitedByUserId)
        );

        if (!invitingPlayer) {
          throw new Error(
            "Solo el creador o jugadores confirmados pueden invitar"
          );
        }

        // Verificar si el usuario ya está en el partido
        const playerIndex = matchData.players.findIndex(
          (player: PlayerEntry) => player.userId === invitedUserId
        );

        if (playerIndex >= 0) {
          const player = matchData.players[playerIndex];

          if (player.status === "confirmed") {
            throw new Error("El usuario ya está confirmado en este partido");
          }

          if (player.status === "invited") {
            throw new Error("El usuario ya está invitado a este partido");
          }

          // Actualizar estado a invitado
          matchData.players[playerIndex] = {
            ...player,
            status: "invited",
            invitedBy: invitedByUserId,
            invitedAt: Timestamp.now(),
          };
        } else {
          // Añadir al usuario como invitado
          matchData.players.push({
            userId: invitedUserId,
            displayName: invitedUserData.displayName || "Usuario",
            photoURL: invitedUserData.photoURL,
            team: null,
            status: "invited",
            invitedBy: invitedByUserId,
            invitedAt: Timestamp.now(),
          });
        }

        // Actualizar el partido
        transaction.update(matchRef, {
          players: matchData.players,
          updatedAt: serverTimestamp(),
        });
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(invitedByUserId, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Confirmar invitación
  confirmInvitation: async (
    matchId: string,
    userId: string,
    teamPreference: TeamType = null
  ) => {
    try {
      // Reutilizamos la función de unirse
      await get().joinMatch(matchId, userId, teamPreference);
    } catch (error) {
      throw error;
    }
  },

  // Declinar invitación
  declineInvitation: async (matchId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const matchRef = doc(db, "matches", matchId);

      // Usar una transacción para asegurar datos consistentes
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error("Partido no encontrado");
        }

        const matchData = matchDoc.data();

        // Encontrar al jugador
        const playerIndex = matchData.players.findIndex(
          (player: PlayerEntry) => player.userId === userId
        );

        if (playerIndex === -1) {
          throw new Error("No estás invitado a este partido");
        }

        // Verificar si está invitado
        if (matchData.players[playerIndex].status !== "invited") {
          throw new Error("No tienes una invitación pendiente");
        }

        // Actualizar estado a declinado
        matchData.players[playerIndex] = {
          ...matchData.players[playerIndex],
          status: "declined",
          team: null,
        };

        // Actualizar el partido
        transaction.update(matchRef, {
          players: matchData.players,
          updatedAt: serverTimestamp(),
        });
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(userId, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Cambiar de equipo
  changeTeam: async (matchId: string, userId: string, newTeam: TeamType) => {
    try {
      set({ isLoading: true, error: null });

      const matchRef = doc(db, "matches", matchId);

      // Usar una transacción para asegurar datos consistentes
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error("Partido no encontrado");
        }

        const matchData = matchDoc.data();

        // Encontrar al jugador
        const playerIndex = matchData.players.findIndex(
          (player: PlayerEntry) =>
            player.userId === userId && player.status === "confirmed"
        );

        if (playerIndex === -1) {
          throw new Error("No estás confirmado en este partido");
        }

        // Verificar límites de equipo
        if (newTeam) {
          const teamCount = matchData.players.filter(
            (player: PlayerEntry) =>
              player.team === newTeam && player.status === "confirmed"
          ).length;

          const maxTeamSize = Math.ceil(matchData.maxPlayers / 2);

          if (teamCount >= maxTeamSize) {
            throw new Error(`El equipo ${newTeam} está lleno`);
          }
        }

        // Actualizar el equipo
        matchData.players[playerIndex] = {
          ...matchData.players[playerIndex],
          team: newTeam,
        };

        // Actualizar el partido
        transaction.update(matchRef, {
          players: matchData.players,
          updatedAt: serverTimestamp(),
        });
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(userId, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Remover a un jugador (solo el creador puede hacerlo)
  removePlayer: async (
    matchId: string,
    userId: string,
    removedByUserId: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      const matchRef = doc(db, "matches", matchId);

      // Usar una transacción para asegurar datos consistentes
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);

        if (!matchDoc.exists()) {
          throw new Error("Partido no encontrado");
        }

        const matchData = matchDoc.data();

        // Verificar si quien remueve es el creador
        if (matchData.createdBy !== removedByUserId) {
          throw new Error("Solo el creador puede remover jugadores");
        }

        // Encontrar al jugador
        const playerIndex = matchData.players.findIndex(
          (player: PlayerEntry) => player.userId === userId
        );

        if (playerIndex === -1) {
          throw new Error("Jugador no encontrado en este partido");
        }

        // No permitir remover al creador
        if (userId === matchData.createdBy) {
          throw new Error("No puedes remover al creador del partido");
        }

        // Actualizar estado a removido
        matchData.players[playerIndex] = {
          ...matchData.players[playerIndex],
          status: "removed",
          team: null,
        };

        // Si el partido estaba lleno, cambiarlo a abierto
        if (matchData.status === "full") {
          const confirmedPlayers = matchData.players.filter(
            (player: PlayerEntry) => player.status === "confirmed"
          );

          if (confirmedPlayers.length < matchData.maxPlayers) {
            matchData.status = "open";
          }
        }

        // Actualizar el partido
        transaction.update(matchRef, {
          players: matchData.players,
          status: matchData.status,
          updatedAt: serverTimestamp(),
        });
      });

      // Actualizar la lista de partidos
      await get().fetchMatches(removedByUserId, true);

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Calificar a un jugador
  ratePlayer: async (
    matchId: string,
    ratedUserId: string,
    ratingUserId: string,
    rating: PlayerRating
  ) => {
    try {
      set({ isLoading: true, error: null });

      const matchRef = doc(db, "matches", matchId);
      const userRef = doc(db, "users", ratedUserId);

      // Usar una transacción para asegurar datos consistentes
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        const userDoc = await transaction.get(userRef);

        if (!matchDoc.exists()) {
          throw new Error("Partido no encontrado");
        }

        if (!userDoc.exists()) {
          throw new Error("Usuario a calificar no encontrado");
        }

        const matchData = matchDoc.data();
        const userData = userDoc.data() as UserProfile;

        // Verificar si el partido ya terminó
        const matchDate = matchData.date.toDate();
        const now = new Date();
        if (matchDate > now) {
          throw new Error(
            "No puedes calificar un partido que aún no ha pasado"
          );
        }

        // Verificar que ambos usuarios estén en el partido
        const ratingPlayerIndex = matchData.players.findIndex(
          (player: PlayerEntry) =>
            player.userId === ratingUserId && player.status === "confirmed"
        );

        const ratedPlayerIndex = matchData.players.findIndex(
          (player: PlayerEntry) =>
            player.userId === ratedUserId && player.status === "confirmed"
        );

        if (ratingPlayerIndex === -1) {
          throw new Error("No estás confirmado en este partido");
        }

        if (ratedPlayerIndex === -1) {
          throw new Error(
            "El jugador a calificar no está confirmado en este partido"
          );
        }

        // Agregar la calificación al jugador
        matchData.players[ratedPlayerIndex] = {
          ...matchData.players[ratedPlayerIndex],
          rating: {
            ...matchData.players[ratedPlayerIndex].rating,
            ...rating,
          },
        };

        // Actualizar el partido
        transaction.update(matchRef, {
          players: matchData.players,
          updatedAt: serverTimestamp(),
        });

        // Actualizar las estadísticas del usuario
        const totalMatches = userData.stats.totalMatches + 1;
        const attendanceRate = rating.attendance
          ? (userData.stats.attendanceRate * userData.stats.totalMatches + 1) /
            totalMatches
          : (userData.stats.attendanceRate * userData.stats.totalMatches) /
            totalMatches;

        const punctualityAvg = rating.attendance
          ? (userData.stats.punctualityAvg * userData.stats.totalMatches +
              rating.punctuality) /
            totalMatches
          : userData.stats.punctualityAvg;

        const attitudeAvg = rating.attendance
          ? (userData.stats.attitudeAvg * userData.stats.totalMatches +
              rating.attitude) /
            totalMatches
          : userData.stats.attitudeAvg;

        const mvpVotes = rating.isMVP
          ? userData.stats.mvpVotes + 1
          : userData.stats.mvpVotes;

        transaction.update(userRef, {
          stats: {
            totalMatches,
            attendanceRate,
            punctualityAvg,
            attitudeAvg,
            mvpVotes,
          },
        });
      });

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Establecer filtros
  setFilters: (newFilters: Partial<MatchFilters>) => {
    set({
      filters: { ...get().filters, ...newFilters },
    });
    get().applyFilters();
  },

  // Resetear filtros
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },

  // Aplicar filtros (función interna)
  applyFilters: () => {
    const { matches, filters, myMatches, myCreatedMatches } = get();

    // Determinar qué conjunto de partidos usar como base
    let result = [...matches];

    if (filters.onlyMine && filters.onlyJoined) {
      // Si se seleccionan ambos, mostrar todos los relacionados con el usuario
      result = [...new Set([...myMatches, ...myCreatedMatches])];
    } else if (filters.onlyMine) {
      result = [...myCreatedMatches];
    } else if (filters.onlyJoined) {
      result = [...myMatches];
    }

    // Filtrar por fecha
    if (filters.date) {
      const filterDate = filters.date;
      result = result.filter((match) => {
        const matchDate = match.date.toDate();
        return (
          matchDate.getDate() === filterDate.getDate() &&
          matchDate.getMonth() === filterDate.getMonth() &&
          matchDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    // Filtrar por tipo
    if (filters.type && filters.type.length > 0) {
      result = result.filter((match) => filters.type!.includes(match.type));
    }

    // Filtrar por nivel
    if (filters.level && filters.level.length > 0) {
      result = result.filter((match) => filters.level!.includes(match.level));
    }

    // Filtrar por estado
    if (filters.status && filters.status.length > 0) {
      result = result.filter((match) => filters.status!.includes(match.status));
    }

    // Filtrar sólo con cupos disponibles
    if (filters.onlyWithSpots) {
      result = result.filter((match) => {
        const confirmedPlayers = match.players.filter(
          (player) => player.status === "confirmed"
        );
        return (
          confirmedPlayers.length < match.maxPlayers && match.status === "open"
        );
      });
    }

    // Filtrar por texto
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (match) =>
          match.fieldName?.toLowerCase().includes(query) ||
          match.creatorName.toLowerCase().includes(query) ||
          match.address?.toLowerCase().includes(query)
      );
    }

    // Ordenar resultados
    switch (filters.sortBy) {
      case "date":
        result.sort((a, b) => a.date.seconds - b.date.seconds);
        break;
      case "distance":
        if (result.some((match) => match.distance !== undefined)) {
          result.sort(
            (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
          );
        }
        break;
    }

    set({ filteredMatches: result });
  },

  // Seleccionar un partido
  selectMatch: (match: Match | null) => {
    set({ selectedMatch: match });
  },
}));

// Función para obtener el número máximo de jugadores según el tipo
function getDefaultMaxPlayers(type: MatchType | undefined): number {
  switch (type) {
    case "5v5":
      return 10;
    case "6v6":
      return 12;
    case "7v7":
      return 14;
    case "11v11":
      return 22;
    default:
      return 10;
  }
}

// Función para determinar a qué equipo asignar a un nuevo jugador para mantener balance
function getBalancedTeam(players: PlayerEntry[]): TeamType {
  const confirmedPlayers = players.filter(
    (player) => player.status === "confirmed"
  );

  const teamACount = confirmedPlayers.filter(
    (player) => player.team === "A"
  ).length;
  const teamBCount = confirmedPlayers.filter(
    (player) => player.team === "B"
  ).length;

  return teamACount <= teamBCount ? "A" : "B";
}
