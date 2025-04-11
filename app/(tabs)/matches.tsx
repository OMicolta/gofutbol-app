// app/(tabs)/matches.tsx

import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { MatchesMockData, Match, MyMatch, OpenMatch } from "@/types/match";

// Mock data para la pantalla de partidos
const matchesMockData: MatchesMockData = {
  myMatches: [
    {
      id: "1",
      date: "2025-04-12T18:00:00",
      location: "Cancha El Campín",
      type: "5v5",
      organizer: "Juan Pérez",
      players: {
        confirmed: 8,
        total: 10,
      },
      status: "pending",
    },
    {
      id: "2",
      date: "2025-04-15T20:00:00",
      location: "Cancha La Bombonera",
      type: "7v7",
      organizer: "Carlos Rodriguez",
      players: {
        confirmed: 12,
        total: 14,
      },
      status: "confirmed",
    },
  ],
  openMatches: [
    {
      id: "3",
      date: "2025-04-13T17:00:00",
      location: "Cancha Gol Center",
      type: "5v5",
      organizer: "Andrea Gómez",
      players: {
        confirmed: 8,
        total: 10,
      },
      distance: "3.2 km",
      level: "Intermedio",
    },
    {
      id: "4",
      date: "2025-04-14T19:00:00",
      location: "La Cancha",
      type: "7v7",
      organizer: "Miguel Torres",
      players: {
        confirmed: 10,
        total: 14,
      },
      distance: "1.8 km",
      level: "Avanzado",
    },
    {
      id: "5",
      date: "2025-04-16T21:00:00",
      location: "SportCenter",
      type: "11v11",
      organizer: "Laura Sánchez",
      players: {
        confirmed: 15,
        total: 22,
      },
      distance: "4.5 km",
      level: "Todos los niveles",
    },
  ],
};

type TabType = "myMatches" | "openMatches";

export default function MatchesScreen() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<TabType>("myMatches");

  const renderMatchItem = ({ item, type }: { item: Match; type: TabType }) => {
    const matchDate = new Date(item.date);
    const formattedDate = matchDate.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const formattedTime = matchDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Card style={styles.matchCard} onPress={() => {}} shadow="m">
        <View style={styles.matchHeader}>
          <View style={styles.dateTimeContainer}>
            <ThemedText type="body" weight="semiBold">
              {formattedDate}
            </ThemedText>
            <ThemedText type="body">{formattedTime}</ThemedText>
          </View>

          <ThemedView style={styles.typeBadge} rounded="s">
            <ThemedText style={styles.typeText}>{item.type}</ThemedText>
          </ThemedView>
        </View>

        <View style={styles.matchDetails}>
          <ThemedText type="body" weight="semiBold">
            {item.location}
          </ThemedText>

          <View style={styles.infoRow}>
            <ThemedText type="body" secondary>
              Organizador: {item.organizer}
            </ThemedText>

            {type === "openMatches" && "distance" in item && (
              <ThemedText type="body" secondary>
                {item.distance}
              </ThemedText>
            )}
          </View>

          {type === "openMatches" && "level" in item && (
            <ThemedText type="caption" style={styles.levelText}>
              Nivel: {item.level}
            </ThemedText>
          )}

          <View style={styles.playersContainer}>
            <View style={styles.playersBar}>
              <View
                style={[
                  styles.playersProgress,
                  {
                    width: `${
                      (item.players.confirmed / item.players.total) * 100
                    }%`,
                    backgroundColor: "#1DB954",
                  },
                ]}
              />
            </View>
            <ThemedText type="caption" secondary>
              {item.players.confirmed}/{item.players.total} jugadores
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {type === "myMatches" && "status" in item ? (
            <View style={styles.myMatchActions}>
              {item.status === "pending" ? (
                <>
                  <Button
                    title="Confirmar"
                    size="small"
                    color="success"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Cancelar"
                    size="small"
                    variant="outlined"
                    color="danger"
                    style={styles.actionButton}
                  />
                </>
              ) : (
                <ThemedView style={styles.confirmedBadge} rounded="s">
                  <IconSymbol name="checkmark" size={16} color="white" />
                  <ThemedText style={styles.confirmedText}>
                    Confirmado
                  </ThemedText>
                </ThemedView>
              )}
            </View>
          ) : (
            <Button title="Unirse" size="small" style={styles.actionButton} />
          )}
        </View>
      </Card>
    );
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
            onPress={() => {}}
          />
        </View>

        {/* Tabs de navegación */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "myMatches" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("myMatches")}
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
            onPress={() => setActiveTab("openMatches")}
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
        {activeTab === "myMatches" ? (
          <FlatList
            data={matchesMockData.myMatches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              renderMatchItem({ item, type: "myMatches" })
            }
            contentContainerStyle={styles.matchesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedView style={styles.emptyContainer}>
                <ThemedText type="body" secondary style={styles.emptyText}>
                  No hay partidos disponibles
                </ThemedText>
                <Button
                  title="Crear partido"
                  size="small"
                  onPress={() => {}}
                  style={styles.emptyButton}
                />
              </ThemedView>
            }
          />
        ) : (
          <FlatList
            data={matchesMockData.openMatches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              renderMatchItem({ item, type: "openMatches" })
            }
            contentContainerStyle={styles.matchesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedView style={styles.emptyContainer}>
                <ThemedText type="body" secondary style={styles.emptyText}>
                  No hay partidos disponibles
                </ThemedText>
                <Button
                  title="Buscar partidos"
                  size="small"
                  onPress={() => {}}
                  style={styles.emptyButton}
                />
              </ThemedView>
            }
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
    borderBottomColor: "#1DB954",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1DB954",
    fontWeight: "600",
  },
  matchesList: {
    paddingHorizontal: Spacing.l,
    paddingBottom: 120, // Extra padding for tab bar
  },
  matchCard: {
    marginBottom: Spacing.m,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  dateTimeContainer: {
    flexDirection: "column",
  },
  typeBadge: {
    backgroundColor: "#1DB95420",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  typeText: {
    color: "#1DB954",
    fontWeight: "600",
    fontSize: 14,
  },
  matchDetails: {
    marginBottom: Spacing.m,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  levelText: {
    marginTop: Spacing.xs,
  },
  playersContainer: {
    marginTop: Spacing.m,
  },
  playersBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: Spacing.xs,
    overflow: "hidden",
  },
  playersProgress: {
    height: "100%",
    borderRadius: 4,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  myMatchActions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: Spacing.s,
  },
  confirmedBadge: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
  },
  confirmedText: {
    color: "white",
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginBottom: Spacing.m,
  },
  emptyButton: {
    minWidth: 150,
  },
});
