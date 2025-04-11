// app/(tabs)/matches.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { MatchCard } from "@/components/match/MatchCard";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";

type TabType = "myMatches" | "openMatches";

export default function MatchesScreen() {
  const colorScheme = useColorScheme();
  const { user, requireAuth } = useAuth();
  const {
    matches,
    filteredMatches,
    myMatches,
    myCreatedMatches,
    fetchMatches,
    setFilters,
    resetFilters,
    isLoading,
    error,
  } = useMatches();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<TabType>("myMatches");
  const [refreshing, setRefreshing] = useState(false);

  // Verificar autenticación al montar componente
  useEffect(() => {
    requireAuth();
  }, []);

  // Cargar partidos al montar componente
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Actualizar cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // Actualizar partidos en segundo plano
        fetchMatches(user.uid, true);
      }
    }, [user])
  );

  // Cargar datos iniciales
  const loadData = async () => {
    if (!user) return;

    try {
      await fetchMatches(user.uid, true);
    } catch (error) {
      console.error("Error al cargar partidos:", error);
      showNotification("Error al cargar partidos. Intenta de nuevo.", "error");
    }
  };

  // Cambiar entre pestañas
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    // Aplicar filtros según la pestaña
    if (tab === "myMatches") {
      // Combinar mis partidos creados y aquellos en los que participo
      setFilters({ onlyMine: true, onlyJoined: true });
    } else {
      // Mostrar todos los partidos abiertos (resetear filtros)
      resetFilters();
    }
  };

  // Manejar refresh
  const onRefresh = async () => {
    if (!user) return;

    setRefreshing(true);
    await fetchMatches(user.uid, true);
    setRefreshing(false);
  };

  // Navegación a crear partido
  const handleCreateMatch = () => {
    router.push("/match/create" as any);
  };

  // Determinar qué datos mostrar según la pestaña activa
  const getDisplayMatches = () => {
    if (activeTab === "myMatches") {
      // Combinar partidos creados y partidos en los que participo
      return [
        ...myCreatedMatches,
        ...myMatches.filter(
          (match) => !myCreatedMatches.some((m) => m.id === match.id)
        ),
      ];
    } else {
      return filteredMatches;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title">Partidos</ThemedText>
            <ThemedText type="body" secondary>
              Organiza y únete a partidos
            </ThemedText>
          </View>

          <Button
            title="Crear"
            leftIcon="soccer.ball"
            size="small"
            onPress={handleCreateMatch}
          />
        </View>

        {/* Tabs de navegación */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "myMatches" && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange("myMatches")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "myMatches" && styles.activeTabText,
              ]}
            >
              Mis Partidos
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "openMatches" && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange("openMatches")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "openMatches" && styles.activeTabText,
              ]}
            >
              Partidos Abiertos
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Lista de partidos */}
        {isLoading && matches.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors[colorScheme].primary}
            />
            <ThemedText style={styles.loadingText}>
              Cargando partidos...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText type="subtitle" style={styles.errorTitle}>
              Error al cargar partidos
            </ThemedText>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Button
              title="Reintentar"
              onPress={loadData}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <FlatList
            data={getDisplayMatches()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.matchesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText type="body" secondary style={styles.emptyText}>
                  {activeTab === "myMatches"
                    ? "No tienes partidos. ¡Crea uno o únete a partidos existentes!"
                    : "No hay partidos disponibles en este momento."}
                </ThemedText>
                {activeTab === "myMatches" ? (
                  <Button
                    title="Crear partido"
                    size="small"
                    onPress={handleCreateMatch}
                    style={styles.emptyButton}
                  />
                ) : (
                  <Button
                    title="Actualizar"
                    size="small"
                    onPress={onRefresh}
                    style={styles.emptyButton}
                  />
                )}
              </View>
            }
            renderItem={({ item }) => <MatchCard match={item} />}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.m,
  },
  tabButton: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    marginRight: Spacing.s,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  matchesList: {
    paddingHorizontal: Spacing.l,
    paddingBottom: 120, // Extra padding for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  loadingText: {
    marginTop: Spacing.m,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  errorTitle: {
    marginBottom: Spacing.m,
  },
  errorText: {
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  retryButton: {
    minWidth: 120,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginBottom: Spacing.m,
    textAlign: "center",
  },
  emptyButton: {
    minWidth: 150,
  },
});
