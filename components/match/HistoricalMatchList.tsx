// components/match/HistoricalMatchList.tsx

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { HistoricalMatchCard } from "@/components/match/HistoricalMatchCard";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useHistoricalMatches } from "@/hooks/useHistoricalMatches";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";

type TabType = "all" | "participated" | "created";

export function HistoricalMatchList() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const {
    historicalMatches,
    myHistoricalMatches,
    myCreatedHistoricalMatches,
    fetchHistoricalMatches,
    fetchMoreHistoricalMatches,
    isLoading,
    error,
  } = useHistoricalMatches();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Actualizar cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      if (user) {
        refreshData(false);
      }
    }, [user])
  );

  // Refrescar datos
  const refreshData = async (showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setRefreshing(true);
    }

    try {
      await fetchHistoricalMatches(true);
    } catch (error) {
      console.error("Error al cargar historial:", error);
      showNotification("Error al cargar historial de partidos", "error");
    } finally {
      if (showLoading) {
        setRefreshing(false);
      }
    }
  };

  // Cambiar entre pestañas
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Cargar más partidos al final de la lista
  const handleEndReached = () => {
    if (!isLoading && !refreshing) {
      fetchMoreHistoricalMatches();
    }
  };

  // Determinar qué datos mostrar según la pestaña activa
  const getDisplayMatches = () => {
    switch (activeTab) {
      case "participated":
        return myHistoricalMatches;
      case "created":
        return myCreatedHistoricalMatches;
      case "all":
      default:
        return historicalMatches;
    }
  };

  // Contenido para cuando no hay partidos
  const renderEmptyContent = () => {
    if (isLoading && getDisplayMatches().length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
          <ThemedText style={styles.emptyText}>
            Cargando historial de partidos...
          </ThemedText>
        </View>
      );
    }

    let message = "No hay partidos en el historial";

    if (activeTab === "participated") {
      message = "No has participado en partidos anteriores";
    } else if (activeTab === "created") {
      message = "No has creado partidos anteriores";
    }

    return (
      <ThemedView style={styles.emptyContainer} variant="secondary" rounded>
        <IconSymbol
          name="calendar"
          size={48}
          color={Colors[colorScheme].textSecondary}
        />
        <ThemedText type="body" secondary style={styles.emptyText}>
          {message}
        </ThemedText>
        <Button
          title="Refrescar"
          size="small"
          variant="outlined"
          onPress={() => refreshData()}
          style={styles.refreshButton}
        />
      </ThemedView>
    );
  };

  // Contenido para mostrar en caso de error
  const renderErrorContent = () => {
    return (
      <ThemedView style={styles.errorContainer} variant="secondary" rounded>
        <IconSymbol name="xmark" size={48} color={Colors[colorScheme].danger} />
        <ThemedText type="subtitle" style={styles.errorTitle}>
          Error al cargar historial
        </ThemedText>
        <ThemedText style={styles.errorText}>
          {error || "No se pudo cargar el historial de partidos"}
        </ThemedText>
        <Button
          title="Reintentar"
          onPress={() => refreshData()}
          style={styles.retryButton}
        />
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Historial de Partidos</ThemedText>
          <ThemedText type="body" secondary>
            Revisa tus partidos anteriores
          </ThemedText>
        </ThemedView>

        {/* Tabs de navegación */}
        <ThemedView style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "all" && styles.activeTabButton,
              activeTab === "all" && {
                borderBottomColor: Colors[colorScheme].primary,
              },
            ]}
            onPress={() => handleTabChange("all")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "all" && styles.activeTabText,
                activeTab === "all" && { color: Colors[colorScheme].primary },
              ]}
            >
              Todos
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "participated" && styles.activeTabButton,
              activeTab === "participated" && {
                borderBottomColor: Colors[colorScheme].primary,
              },
            ]}
            onPress={() => handleTabChange("participated")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "participated" && styles.activeTabText,
                activeTab === "participated" && {
                  color: Colors[colorScheme].primary,
                },
              ]}
            >
              Participados
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "created" && styles.activeTabButton,
              activeTab === "created" && {
                borderBottomColor: Colors[colorScheme].primary,
              },
            ]}
            onPress={() => handleTabChange("created")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "created" && styles.activeTabText,
                activeTab === "created" && {
                  color: Colors[colorScheme].primary,
                },
              ]}
            >
              Creados
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Lista de partidos históricos */}
        {error ? (
          renderErrorContent()
        ) : (
          <Animated.FlatList
            entering={FadeIn.duration(300)}
            data={getDisplayMatches()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => refreshData()}
                colors={[Colors[colorScheme].primary]}
                tintColor={Colors[colorScheme].primary}
              />
            }
            ListEmptyComponent={renderEmptyContent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            renderItem={({ item }) => <HistoricalMatchCard match={item} />}
            ItemSeparatorComponent={() => (
              <View style={{ height: Spacing.s }} />
            )}
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
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  tabButton: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    marginRight: Spacing.s,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: Spacing.l,
    paddingBottom: 120, // Extra padding for tab bar
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  emptyContainer: {
    margin: Spacing.l,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: Spacing.m,
    textAlign: "center",
    marginBottom: Spacing.m,
  },
  refreshButton: {
    minWidth: 120,
  },
  errorContainer: {
    margin: Spacing.l,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    marginTop: Spacing.m,
    marginBottom: Spacing.s,
  },
  errorText: {
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  retryButton: {
    minWidth: 150,
  },
});
