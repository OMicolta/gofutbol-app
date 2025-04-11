// components/match/MatchCard.tsx

import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Match } from "@/store/matchStore";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  mode?: "full" | "compact";
}

export function MatchCard({
  match,
  onPress,
  onJoin,
  onLeave,
  mode = "full",
}: MatchCardProps) {
  const { user } = useAuth();
  const { joinMatch, leaveMatch } = useMatches();

  // Formatear fecha
  const matchDate = match.date.toDate();
  const formattedDate = matchDate.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // Formatear hora
  const formattedTime =
    match.time ||
    matchDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Verificar si el usuario actual está en el partido
  const isCreator = user?.uid === match.createdBy;
  const isPlayerConfirmed = match.players.some(
    (player) => player.userId === user?.uid && player.status === "confirmed"
  );

  // Contar jugadores confirmados
  const confirmedPlayers = match.players.filter(
    (player) => player.status === "confirmed"
  ).length;
  const availableSpots = match.maxPlayers - confirmedPlayers;

  // Manejar navegación al detalle
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/match/${match.id}` as any);
    }
  };

  // Manejar unirse al partido
  const handleJoin = async () => {
    if (onJoin) {
      onJoin();
    } else {
      try {
        await joinMatch(match.id);
      } catch (error) {
        console.error("Error al unirse al partido:", error);
      }
    }
  };

  // Manejar abandonar el partido
  const handleLeave = async () => {
    if (onLeave) {
      onLeave();
    } else {
      try {
        await leaveMatch(match.id);
      } catch (error) {
        console.error("Error al abandonar el partido:", error);
      }
    }
  };

  // Renderizar versión compacta
  if (mode === "compact") {
    return (
      <Card onPress={handlePress} style={styles.compactCard}>
        <View style={styles.compactContent}>
          <View style={styles.compactInfo}>
            <View style={styles.compactHeader}>
              <ThemedText type="body" weight="semiBold">
                {formattedDate} • {formattedTime}
              </ThemedText>
              <ThemedView style={styles.typeBadge} rounded="s">
                <ThemedText style={styles.typeText}>{match.type}</ThemedText>
              </ThemedView>
            </View>

            <ThemedText type="caption" secondary numberOfLines={1}>
              {match.fieldName || "Ubicación por definir"}
            </ThemedText>

            <View style={styles.playerInfo}>
              <View style={styles.playerBar}>
                <View
                  style={[
                    styles.playerProgress,
                    {
                      width: `${(confirmedPlayers / match.maxPlayers) * 100}%`,
                    },
                  ]}
                />
              </View>
              <ThemedText type="caption" secondary>
                {confirmedPlayers}/{match.maxPlayers} jugadores
              </ThemedText>
            </View>
          </View>

          {!isPlayerConfirmed && !isCreator ? (
            <Button
              title="Unirme"
              size="small"
              onPress={handleJoin}
              disabled={match.status === "full" || match.status === "cancelled"}
            />
          ) : (
            <ThemedView style={styles.statusBadge} rounded="s">
              <ThemedText type="caption" style={styles.statusText}>
                {isCreator ? "Organizador" : "Confirmado"}
              </ThemedText>
            </ThemedView>
          )}
        </View>
      </Card>
    );
  }

  // Renderizar versión completa
  return (
    <Card onPress={handlePress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <ThemedText type="body" weight="semiBold">
            {formattedDate}
          </ThemedText>
          <ThemedText type="body">{formattedTime}</ThemedText>
        </View>

        <View style={styles.typeAndStatus}>
          <ThemedView style={styles.typeBadge} rounded="s">
            <ThemedText style={styles.typeText}>{match.type}</ThemedText>
          </ThemedView>

          {match.status === "cancelled" && (
            <ThemedView style={styles.cancelledBadge} rounded="s">
              <ThemedText style={styles.cancelledText}>Cancelado</ThemedText>
            </ThemedView>
          )}

          {match.status === "full" && !isPlayerConfirmed && !isCreator && (
            <ThemedView style={styles.fullBadge} rounded="s">
              <ThemedText style={styles.fullText}>Completo</ThemedText>
            </ThemedView>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText type="body" weight="semiBold">
          {match.fieldName || "Ubicación por definir"}
        </ThemedText>

        {match.address && (
          <ThemedText type="caption" secondary>
            {match.address}
          </ThemedText>
        )}

        <View style={styles.infoRow}>
          <ThemedText type="caption" secondary>
            Organizador: {match.creatorName}
          </ThemedText>

          <ThemedText type="caption" secondary>
            Nivel: {match.level === "all" ? "Todos" : match.level}
          </ThemedText>
        </View>

        <View style={styles.playerSection}>
          <View style={styles.playerBar}>
            <View
              style={[
                styles.playerProgress,
                { width: `${(confirmedPlayers / match.maxPlayers) * 100}%` },
              ]}
            />
          </View>

          <View style={styles.playerText}>
            <ThemedText type="caption" secondary>
              {confirmedPlayers}/{match.maxPlayers} jugadores
            </ThemedText>

            {availableSpots > 0 && match.status !== "cancelled" && (
              <ThemedText type="caption" secondary>
                {availableSpots} {availableSpots === 1 ? "cupo" : "cupos"}{" "}
                disponible{availableSpots !== 1 ? "s" : ""}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {isCreator ? (
          <ThemedView style={styles.organizerBadge} rounded="s">
            <IconSymbol name="checkmark" size={16} color="white" />
            <ThemedText style={styles.organizerText}>Organizador</ThemedText>
          </ThemedView>
        ) : isPlayerConfirmed ? (
          <View style={styles.buttonContainer}>
            <ThemedView style={styles.confirmedBadge} rounded="s">
              <IconSymbol name="checkmark" size={16} color="white" />
              <ThemedText style={styles.confirmedText}>Confirmado</ThemedText>
            </ThemedView>

            {match.status !== "cancelled" && (
              <Button
                title="Cancelar"
                size="small"
                variant="outlined"
                color="danger"
                onPress={handleLeave}
              />
            )}
          </View>
        ) : (
          <Button
            title="Unirme"
            size="small"
            onPress={handleJoin}
            disabled={match.status === "full" || match.status === "cancelled"}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.m,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  dateContainer: {
    flexDirection: "column",
  },
  typeAndStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
  cancelledBadge: {
    backgroundColor: "#F4433620",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  cancelledText: {
    color: "#F44336",
    fontWeight: "600",
    fontSize: 14,
  },
  fullBadge: {
    backgroundColor: "#FF980020",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  fullText: {
    color: "#FF9800",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    marginBottom: Spacing.m,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  playerSection: {
    marginTop: Spacing.m,
  },
  playerBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: Spacing.xs,
    overflow: "hidden",
  },
  playerProgress: {
    height: "100%",
    backgroundColor: "#1DB954",
    borderRadius: 4,
  },
  playerText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  organizerBadge: {
    backgroundColor: "#1DB954",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  organizerText: {
    color: "white",
    fontWeight: "600",
  },
  confirmedBadge: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  confirmedText: {
    color: "white",
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
  },
  // Estilos para versión compacta
  compactCard: {
    marginBottom: Spacing.s,
  },
  compactContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactInfo: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  playerInfo: {
    marginTop: Spacing.s,
  },
});
