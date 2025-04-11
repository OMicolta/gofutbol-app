// components/match/PlayerList.tsx

import React from "react";
import { StyleSheet, View, TouchableOpacity, FlatList } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { PlayerEntry, TeamType } from "@/store/matchStore";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";

interface PlayerListProps {
  players: PlayerEntry[];
  matchCreatorId: string;
  isEditable?: boolean;
  onChangeTeam?: (playerId: string, newTeam: TeamType) => void;
  onRemovePlayer?: (playerId: string) => void;
}

export function PlayerList({
  players,
  matchCreatorId,
  isEditable = false,
  onChangeTeam,
  onRemovePlayer,
}: PlayerListProps) {
  const { user } = useAuth();

  // Filtrar solo jugadores confirmados
  const confirmedPlayers = players.filter(
    (player) => player.status === "confirmed"
  );

  // Separar jugadores por equipo
  const teamA = confirmedPlayers.filter((player) => player.team === "A");
  const teamB = confirmedPlayers.filter((player) => player.team === "B");
  const unassigned = confirmedPlayers.filter((player) => player.team === null);

  // Renderizar un jugador
  const renderPlayer = (
    player: PlayerEntry,
    index: number,
    teamType?: TeamType
  ) => {
    const isCreator = player.userId === matchCreatorId;
    const isCurrentUser = player.userId === user?.uid;
    const canMove =
      isEditable && (isCurrentUser || user?.uid === matchCreatorId);

    // Placeholder si no hay imagen de perfil
    const profileImage = player.photoURL
      ? { uri: player.photoURL }
      : require("@/assets/images/default-avatar.png");

    return (
      <View key={`${player.userId}-${index}`} style={styles.playerItem}>
        <View style={styles.playerInfo}>
          <Image
            source={profileImage}
            style={styles.playerAvatar}
            contentFit="cover"
          />
          <View>
            <ThemedText type="body" weight={isCreator ? "semiBold" : "regular"}>
              {player.displayName} {isCreator && "(Organizador)"}
            </ThemedText>
            {isCurrentUser && (
              <ThemedText type="caption" secondary>
                Tú
              </ThemedText>
            )}
          </View>
        </View>

        {canMove && teamType && (
          <View style={styles.actionButtons}>
            {/* Cambiar equipo */}
            {onChangeTeam && (
              <TouchableOpacity
                style={styles.teamButton}
                onPress={() => {
                  const newTeam = teamType === "A" ? "B" : "A";
                  onChangeTeam(player.userId, newTeam);
                }}
              >
                <ThemedText type="caption" style={styles.teamButtonText}>
                  → Equipo {teamType === "A" ? "B" : "A"}
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Eliminar jugador (solo para organizador) */}
            {user?.uid === matchCreatorId && !isCreator && onRemovePlayer && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemovePlayer(player.userId)}
              >
                <ThemedText type="caption" style={styles.removeButtonText}>
                  ✕
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Jugadores ({confirmedPlayers.length})
      </ThemedText>

      {/* Equipo A */}
      <ThemedView style={styles.teamContainer} variant="secondary" rounded>
        <ThemedText type="body" weight="semiBold" style={styles.teamTitle}>
          Equipo A ({teamA.length})
        </ThemedText>

        {teamA.length > 0 ? (
          <View style={styles.playersList}>
            {teamA.map((player, index) => renderPlayer(player, index, "A"))}
          </View>
        ) : (
          <ThemedText type="body" secondary style={styles.emptyTeam}>
            No hay jugadores en este equipo
          </ThemedText>
        )}
      </ThemedView>

      {/* Equipo B */}
      <ThemedView style={styles.teamContainer} variant="secondary" rounded>
        <ThemedText type="body" weight="semiBold" style={styles.teamTitle}>
          Equipo B ({teamB.length})
        </ThemedText>

        {teamB.length > 0 ? (
          <View style={styles.playersList}>
            {teamB.map((player, index) => renderPlayer(player, index, "B"))}
          </View>
        ) : (
          <ThemedText type="body" secondary style={styles.emptyTeam}>
            No hay jugadores en este equipo
          </ThemedText>
        )}
      </ThemedView>

      {/* Sin asignar */}
      {unassigned.length > 0 && (
        <ThemedView style={styles.teamContainer} variant="secondary" rounded>
          <ThemedText type="body" weight="semiBold" style={styles.teamTitle}>
            Sin equipo ({unassigned.length})
          </ThemedText>

          <View style={styles.playersList}>
            {unassigned.map((player, index) => renderPlayer(player, index))}
          </View>
        </ThemedView>
      )}

      {/* Mensaje si no hay jugadores */}
      {confirmedPlayers.length === 0 && (
        <ThemedText type="body" secondary style={styles.noPlayers}>
          No hay jugadores confirmados aún
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.m,
  },
  title: {
    marginBottom: Spacing.m,
  },
  teamContainer: {
    marginBottom: Spacing.m,
    padding: Spacing.m,
  },
  teamTitle: {
    marginBottom: Spacing.s,
  },
  playersList: {
    gap: Spacing.s,
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  teamButton: {
    backgroundColor: "#1DB95420",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: Shape.radius.s,
  },
  teamButtonText: {
    color: "#1DB954",
  },
  removeButton: {
    backgroundColor: "#F4433620",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#F44336",
  },
  emptyTeam: {
    textAlign: "center",
    marginVertical: Spacing.s,
  },
  noPlayers: {
    textAlign: "center",
    marginVertical: Spacing.m,
  },
});
