// app/(tabs)/index.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { FieldCard } from "@/components/field/FieldCard";
import { MatchCard } from "@/components/match/MatchCard";
import { useAuth } from "@/hooks/useAuth";
import { useFields } from "@/hooks/useFields";
import { useMatches } from "@/hooks/useMatches";
import { useRatings } from "@/hooks/useRatings";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { user, profile, requireAuth } = useAuth();
  const { fields, fetchFields, getUserLocation } = useFields();
  const { myMatches, myCreatedMatches, fetchMatches } = useMatches();
  const { pendingRatings, fetchPendingRatings } = useRatings();

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticación y cargar datos iniciales
  useEffect(() => {
    requireAuth();
    if (user) {
      loadInitialData();
    }
  }, [user?.uid]);

  // Actualizar cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // No recargar datos completos para evitar parpadeo
        // Actualizar solo lo necesario
        silentRefresh();
      }
    }, [user?.uid])
  );

  // Cargar datos iniciales
  const loadInitialData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Cargar ubicación del usuario
      await getUserLocation();

      // Cargar canchas cercanas
      await fetchFields(true);

      // Cargar partidos del usuario
      await fetchMatches(user.uid, true);

      // Cargar calificaciones pendientes
      // Corregido: Pasando el ID del usuario
      await fetchPendingRatings(user.uid);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar datos sin mostrar indicador de carga
  const silentRefresh = async () => {
    if (!user) return;

    try {
      await Promise.all([
        fetchMatches(user.uid, true),
        // Corregido: Pasando el ID del usuario
        fetchPendingRatings(user.uid),
      ]);
    } catch (error) {
      console.error("Error al actualizar datos:", error);
    }
  };

  // Manejar refresh manual
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Obtener partidos próximos (combinados creados y unidos)
  const getUpcomingMatches = () => {
    const now = new Date();
    const allMatches = [...myCreatedMatches, ...myMatches];

    // Eliminar duplicados
    const uniqueMatches = allMatches.filter(
      (match, index, self) => index === self.findIndex((m) => m.id === match.id)
    );

    // Filtrar solo partidos futuros
    return uniqueMatches
      .filter((match) => match.date.toDate() > now)
      .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
      .slice(0, 3); // Mostrar solo los 3 próximos
  };

  // Obtener canchas cercanas
  const getNearbyFields = () => {
    // Ordenar por distancia y tomar las 2 primeras
    return [...fields]
      .sort((a, b) => (a.distance || 999) - (b.distance || 999))
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  // Datos para mostrar
  const upcomingMatches = getUpcomingMatches();
  const nearbyFields = getNearbyFields();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <ThemedText type="title">GoFutbol</ThemedText>
            <ThemedText type="body" secondary>
              Bienvenido {profile?.displayName?.split(" ")[0] || ""}
            </ThemedText>
          </View>

          {/* Calificaciones pendientes */}
          {pendingRatings.length > 0 && (
            <View style={styles.pendingRatings}>
              <Card onPress={() => router.push("/ratings/pending" as any)}>
                <View style={styles.pendingRatingsContent}>
                  <View>
                    <ThemedText type="body" weight="semiBold">
                      Tienes {pendingRatings.length}{" "}
                      {pendingRatings.length === 1 ? "partido" : "partidos"} por
                      calificar
                    </ThemedText>
                    <ThemedText type="caption" secondary>
                      Califica a tus compañeros de juego
                    </ThemedText>
                  </View>
                  <Button
                    title="Calificar"
                    size="small"
                    variant="outlined"
                    color="warning"
                  />
                </View>
              </Card>
            </View>
          )}

          {/* Sección de acciones rápidas */}
          <View style={styles.actionsSection}>
            <View style={styles.actionsRow}>
              <Card
                style={styles.actionCard}
                onPress={() => router.push("/match/create" as any)}
                shadow="s"
              >
                <IconSymbol name="soccer.ball" size={24} color="#1DB954" />
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.actionText}
                >
                  Nuevo Partido
                </ThemedText>
              </Card>

              <Card
                style={styles.actionCard}
                onPress={() => router.push("/(tabs)/explore")}
                shadow="s"
              >
                <IconSymbol name="paperplane.fill" size={24} color="#1DB954" />
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.actionText}
                >
                  Buscar Canchas
                </ThemedText>
              </Card>

              <Card
                style={styles.actionCard}
                onPress={() => router.push("/(tabs)/matches")}
                shadow="s"
              >
                <IconSymbol name="person.fill" size={24} color="#1DB954" />
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.actionText}
                >
                  Ver Partidos
                </ThemedText>
              </Card>
            </View>
          </View>

          {/* Próximos partidos */}
          <View style={styles.upcomingSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subheading">Próximos Partidos</ThemedText>
              <Button
                title="Ver todos"
                variant="ghost"
                size="small"
                onPress={() => router.push("/(tabs)/matches")}
              />
            </View>

            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} mode="compact" />
              ))
            ) : (
              <ThemedView
                style={styles.emptyListContainer}
                variant="secondary"
                rounded
              >
                <ThemedText type="body" secondary style={styles.emptyListText}>
                  No tienes partidos próximos
                </ThemedText>
                <Button
                  title="Crear Partido"
                  size="small"
                  onPress={() => router.push("/match/create" as any)}
                  style={styles.emptyListButton}
                />
              </ThemedView>
            )}
          </View>

          {/* Canchas cercanas */}
          <View style={styles.fieldsSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subheading">Canchas Cercanas</ThemedText>
              <Button
                title="Ver mapa"
                variant="ghost"
                size="small"
                onPress={() => router.push("/(tabs)/explore")}
              />
            </View>

            {nearbyFields.length > 0 ? (
              nearbyFields.map((field) => (
                <FieldCard key={field.id} field={field} compact />
              ))
            ) : (
              <ThemedView
                style={styles.emptyListContainer}
                variant="secondary"
                rounded
              >
                <ThemedText type="body" secondary style={styles.emptyListText}>
                  {isLoading
                    ? "Buscando canchas cercanas..."
                    : "No hay canchas cercanas disponibles"}
                </ThemedText>
                <Button
                  title="Explorar Canchas"
                  size="small"
                  onPress={() => router.push("/(tabs)/explore")}
                  style={styles.emptyListButton}
                />
              </ThemedView>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m,
  },
  pendingRatings: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  pendingRatingsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionsSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "31%",
    alignItems: "center",
    padding: Spacing.m,
  },
  actionText: {
    marginTop: Spacing.xs,
    textAlign: "center",
    fontSize: 12,
  },
  upcomingSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  matchCard: {
    marginBottom: Spacing.m,
  },
  fieldsSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.xl,
  },
  emptyListContainer: {
    padding: Spacing.m,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.s,
  },
  emptyListText: {
    textAlign: "center",
    marginBottom: Spacing.s,
  },
  emptyListButton: {
    minWidth: 150,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
});
