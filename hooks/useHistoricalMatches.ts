// hooks/useHistoricalMatches.ts

import { useState, useEffect } from "react";
import { useMatchStore, Match } from "@/store/matchStore";
import { useAuth } from "@/hooks/useAuth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase";

export function useHistoricalMatches() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicalMatches, setHistoricalMatches] = useState<Match[]>([]);
  const [myHistoricalMatches, setMyHistoricalMatches] = useState<Match[]>([]);
  const [myCreatedHistoricalMatches, setMyCreatedHistoricalMatches] = useState<
    Match[]
  >([]);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Cargar partidos históricos (partidos ya pasados)
  const fetchHistoricalMatches = async (fresh = false) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Si es una carga fresca, resetear lastVisible
      if (fresh) {
        setLastVisible(null);
      }

      // Obtener hora actual para filtrar partidos pasados
      const now = new Date();
      const timestamp = Timestamp.fromDate(now);

      // Crear query base para partidos pasados
      const matchesRef = collection(db, "matches");
      let matchQuery = query(
        matchesRef,
        where("date", "<", timestamp),
        orderBy("date", "desc"), // Ordenado del más reciente al más antiguo
        limit(20)
      );

      // Si no es carga fresca y tenemos lastVisible, usar startAfter
      if (!fresh && lastVisible) {
        matchQuery = query(
          matchesRef,
          where("date", "<", timestamp),
          orderBy("date", "desc"),
          startAfter(lastVisible),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(matchQuery);

      // Guardar último documento visible para paginación
      const newLastVisible =
        querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      setLastVisible(newLastVisible);

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
          status: data.status || "finished",
          maxPlayers: data.maxPlayers || 10,
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

      // Partidos históricos en los que participó el usuario
      const myHistoricalQuery = query(
        matchesRef,
        where("date", "<", timestamp),
        where("players", "array-contains", {
          userId: user.uid,
          status: "confirmed",
        }),
        orderBy("date", "desc"),
        limit(20)
      );

      const myHistoricalSnapshot = await getDocs(myHistoricalQuery);
      const myHistoricalFetched: Match[] = [];

      myHistoricalSnapshot.forEach((doc) => {
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
          status: data.status || "finished",
          maxPlayers: data.maxPlayers || 10,
          players: data.players || [],
          description: data.description || "",
          uniformA: data.uniformA || null,
          uniformB: data.uniformB || null,
          chatEnabled: data.chatEnabled || true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        myHistoricalFetched.push(match);
      });

      // Partidos históricos creados por el usuario
      const myCreatedHistoricalQuery = query(
        matchesRef,
        where("date", "<", timestamp),
        where("createdBy", "==", user.uid),
        orderBy("date", "desc"),
        limit(20)
      );

      const myCreatedHistoricalSnapshot = await getDocs(
        myCreatedHistoricalQuery
      );
      const myCreatedHistoricalFetched: Match[] = [];

      myCreatedHistoricalSnapshot.forEach((doc) => {
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
          status: data.status || "finished",
          maxPlayers: data.maxPlayers || 10,
          players: data.players || [],
          description: data.description || "",
          uniformA: data.uniformA || null,
          uniformB: data.uniformB || null,
          chatEnabled: data.chatEnabled || true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        myCreatedHistoricalFetched.push(match);
      });

      // Si es carga fresca, reemplazar los partidos
      const matches = fresh
        ? fetchedMatches
        : [...historicalMatches, ...fetchedMatches];

      setHistoricalMatches(matches);
      setMyHistoricalMatches(myHistoricalFetched);
      setMyCreatedHistoricalMatches(myCreatedHistoricalFetched);
      setIsLoading(false);
    } catch (error) {
      console.error("Error al cargar partidos históricos:", error);
      setError((error as Error).message);
      setIsLoading(false);
    }
  };

  // Cargar más partidos históricos (paginación)
  const fetchMoreHistoricalMatches = async () => {
    if (!lastVisible || isLoading) return;
    await fetchHistoricalMatches(false);
  };

  // Obtener partido histórico por ID
  const getHistoricalMatchById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero revisar si ya lo tenemos en caché
      const cachedMatch =
        historicalMatches.find((match) => match.id === id) ||
        myHistoricalMatches.find((match) => match.id === id) ||
        myCreatedHistoricalMatches.find((match) => match.id === id);

      if (cachedMatch) {
        setIsLoading(false);
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
          status: data.status || "finished",
          maxPlayers: data.maxPlayers || 10,
          players: data.players || [],
          description: data.description || "",
          uniformA: data.uniformA || null,
          uniformB: data.uniformB || null,
          chatEnabled: data.chatEnabled || true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        setIsLoading(false);
        return match;
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      console.error("Error al obtener partido histórico:", error);
      setError((error as Error).message);
      setIsLoading(false);
      return null;
    }
  };

  // Cargar partidos al inicializar el hook
  useEffect(() => {
    if (user) {
      fetchHistoricalMatches(true);
    }
  }, [user]);

  return {
    historicalMatches,
    myHistoricalMatches,
    myCreatedHistoricalMatches,
    fetchHistoricalMatches,
    fetchMoreHistoricalMatches,
    getHistoricalMatchById,
    isLoading,
    error,
  };
}
