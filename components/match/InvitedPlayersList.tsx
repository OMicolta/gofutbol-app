// components/match/InvitedPlayersList.tsx
import React from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { PlayerEntry } from "@/store/matchStore";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface InvitedPlayersListProps {
  players: PlayerEntry[]; // Jugadores invitados
  emptyMessage?: string;
}

export function InvitedPlayersList({
  players,
  emptyMessage = "No hay jugadores invitados",
}: InvitedPlayersListProps) {
  const colorScheme = useColorScheme();

  // Si no hay jugadores invitados, mostrar mensaje
  if (players.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer} variant="secondary" rounded>
        <ThemedText type="body" secondary style={styles.emptyText}>
          {emptyMessage}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={players}
      keyExtractor={(item, index) => `${item.userId}-${index}`}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <ThemedView style={styles.playerItem} variant="secondary" rounded>
          <View style={styles.playerInfo}>
            {item.photoURL ? (
              <Image
                source={{ uri: item.photoURL }}
                style={styles.playerAvatar}
                contentFit="cover"
              />
            ) : (
              <ThemedView style={styles.avatarPlaceholder} rounded>
                <ThemedText style={styles.avatarText}>
                  {item.displayName?.substring(0, 1).toUpperCase() || "?"}
                </ThemedText>
              </ThemedView>
            )}
            <View>
              <ThemedText type="body" weight="semiBold">
                {item.displayName}
              </ThemedText>
              <ThemedText type="caption" secondary>
                Invitado
                {item.invitedAt
                  ? ` el ${formatDate(item.invitedAt.toDate())}`
                  : ""}
              </ThemedText>
            </View>
          </View>

          <ThemedView
            style={styles.statusBadge}
            variant="secondary"
            rounded="s"
          >
            <ThemedText style={styles.statusText}>Pendiente</ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    />
  );
}

// Formatear fecha
const formatDate = (date: Date) => {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
};

const styles = StyleSheet.create({
  emptyContainer: {
    padding: Spacing.m,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
    marginBottom: Spacing.s,
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.s,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primary + "40",
    marginRight: Spacing.s,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.light.warning + "30",
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.warning,
    fontWeight: "600",
  },
});
