// components/match/HistoricalMatchList.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useHistoricalMatches } from "@/hooks/useHistoricalMatches";
import { Match } from "@/store/matchStore";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type Tab = "all" | "participated" | "created";

export const HistoricalMatchList = () => {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const {
    historicalMatches,
    myHistoricalMatches,
    myCreatedHistoricalMatches,
    fetchHistoricalMatches,
    fetchMoreHistoricalMatches,
    isLoading,
    error,
  } = useHistoricalMatches();

  const handleRefresh = () => {
    fetchHistoricalMatches(true);
  };

  const handleEndReached = () => {
    fetchMoreHistoricalMatches();
  };

  const handleMatchPress = (match: Match) => {
    router.push({
      pathname: `/match/[id]` as const,
      params: { id: match.id, isHistorical: "true" },
    });
  };

  // Función simple para formatear fecha
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    return (
      <TouchableOpacity
        style={[
          styles.matchCard,
          { backgroundColor: Colors[colorScheme].card },
        ]}
        onPress={() => handleMatchPress(item)}
      >
        <View style={styles.matchHeader}>
          <Text style={[styles.matchType, { color: Colors[colorScheme].text }]}>
            {item.type} · {item.level}
          </Text>
          <Text
            style={[styles.matchDate, { color: Colors[colorScheme].secondary }]}
          >
            {formatDate(item.date.toDate())}
          </Text>
        </View>

        <View style={styles.matchInfo}>
          <Text style={[styles.fieldName, { color: Colors[colorScheme].text }]}>
            {item.fieldName || "Cancha sin especificar"}
          </Text>

          <View style={styles.matchStatus}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={Colors[colorScheme].success}
              style={styles.statusIcon}
            />
            <Text
              style={[
                styles.statusText,
                { color: Colors[colorScheme].success },
              ]}
            >
              Finalizado
            </Text>
          </View>
        </View>

        <View style={styles.matchFooter}>
          <View style={styles.teamSection}>
            <Text
              style={[styles.teamLabel, { color: Colors[colorScheme].info }]}
            >
              Equipo A
            </Text>
            <Text
              style={[styles.playerCount, { color: Colors[colorScheme].text }]}
            >
              {
                item.players.filter(
                  (p) => p.team === "A" && p.status === "confirmed"
                ).length
              }{" "}
              jugadores
            </Text>
          </View>

          <View style={styles.teamSection}>
            <Text
              style={[styles.teamLabel, { color: Colors[colorScheme].primary }]}
            >
              Equipo B
            </Text>
            <Text
              style={[styles.playerCount, { color: Colors[colorScheme].text }]}
            >
              {
                item.players.filter(
                  (p) => p.team === "B" && p.status === "confirmed"
                ).length
              }{" "}
              jugadores
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getActiveMatches = () => {
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

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
          <Text
            style={[
              styles.emptyText,
              { color: Colors[colorScheme].textSecondary },
            ]}
          >
            Cargando partidos...
          </Text>
        </View>
      );
    }

    let message = "No hay partidos históricos disponibles";
    if (activeTab === "participated") {
      message = "No has participado en partidos anteriores";
    } else if (activeTab === "created") {
      message = "No has creado partidos anteriores";
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="calendar-outline"
          size={48}
          color={Colors[colorScheme].textSecondary}
        />
        <Text
          style={[
            styles.emptyText,
            { color: Colors[colorScheme].textSecondary },
          ]}
        >
          {message}
        </Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={Colors[colorScheme].danger}
        />
        <Text style={[styles.errorText, { color: Colors[colorScheme].danger }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: Colors[colorScheme].primary },
          ]}
          onPress={handleRefresh}
        >
          <Text style={[styles.retryText, { color: "#FFFFFF" }]}>
            Reintentar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "all" && {
              borderBottomColor: Colors[colorScheme].primary,
            },
          ]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "all"
                    ? Colors[colorScheme].primary
                    : Colors[colorScheme].textSecondary,
              },
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "participated" && {
              borderBottomColor: Colors[colorScheme].primary,
            },
          ]}
          onPress={() => setActiveTab("participated")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "participated"
                    ? Colors[colorScheme].primary
                    : Colors[colorScheme].textSecondary,
              },
            ]}
          >
            Participados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "created" && {
              borderBottomColor: Colors[colorScheme].primary,
            },
          ]}
          onPress={() => setActiveTab("created")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "created"
                    ? Colors[colorScheme].primary
                    : Colors[colorScheme].textSecondary,
              },
            ]}
          >
            Creados
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getActiveMatches()}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[Colors[colorScheme].primary]}
            tintColor={Colors[colorScheme].primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  matchCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  matchType: {
    fontSize: 14,
    fontWeight: "600",
  },
  matchDate: {
    fontSize: 14,
  },
  matchInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  matchStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  matchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  teamSection: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  playerCount: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HistoricalMatchList;
