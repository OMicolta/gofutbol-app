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
import { useNotification } from "@/context/NotificationContext";
import { useColorScheme } from "@/hooks/useColorScheme";

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
  const { showNotification } = useNotification();
  const colorScheme = useColorScheme();

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

  // Determinar si el partido es hoy
  const isToday = () => {
    const today = new Date();
    return (
      matchDate.getDate() === today.getDate() &&
      matchDate.getMonth() === today.getMonth() &&
      matchDate.getFullYear() === today.getFullYear()
    );
  };

  // Determinar si el partido es mañana
  const isTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      matchDate.getDate() === tomorrow.getDate() &&
      matchDate.getMonth() === tomorrow.getMonth() &&
      matchDate.getFullYear() === tomorrow.getFullYear()
    );
  };

  // Formatear fecha relativa
  const getRelativeDate = () => {
    if (isToday()) {
      return "Hoy";
    } else if (isTomorrow()) {
      return "Mañana";
    } else {
      return formattedDate;
    }
  };

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
        showNotification("¡Te has unido al partido correctamente!", "success");
      } catch (error) {
        console.error("Error al unirse al partido:", error);
        showNotification(`Error: ${(error as Error).message}`, "error");
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
        showNotification("Has abandonado el partido", "info");
      } catch (error) {
        console.error("Error al abandonar el partido:", error);
        showNotification(`Error: ${(error as Error).message}`, "error");
      }
    }
  };

  // Renderizar versión compacta
  if (mode === "compact") {
    return (
      <Card onPress={handlePress} style={styles.compactCard} shadow="s">
        <View style={styles.compactContent}>
          <View style={styles.compactInfo}>
            <View style={styles.compactHeader}>
              <View style={styles.dateTimeInfo}>
                <ThemedView style={styles.dateChip} rounded>
                  <ThemedText style={styles.dateChipText} weight="semiBold">
                    {getRelativeDate()}
                  </ThemedText>
                </ThemedView>
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.timeText}
                >
                  {formattedTime}
                </ThemedText>
              </View>
              <ThemedView style={styles.typeBadge} rounded="s">
                <ThemedText style={styles.typeText}>{match.type}</ThemedText>
              </ThemedView>
            </View>

            <ThemedText
              type="caption"
              secondary
              numberOfLines={1}
              style={styles.locationText}
            >
              {match.fieldName || "Ubicación por definir"}
            </ThemedText>

            <View style={styles.playerInfo}>
              <View style={styles.playerBar}>
                <View
                  style={[
                    styles.playerProgress,
                    {
                      width: `${(confirmedPlayers / match.maxPlayers) * 100}%`,
                      backgroundColor:
                        confirmedPlayers >= match.maxPlayers / 2
                          ? Colors.light.success
                          : Colors.light.warning,
                    },
                  ]}
                />
              </View>
              <View style={styles.playerStatusRow}>
                <ThemedText type="caption" secondary>
                  {confirmedPlayers}/{match.maxPlayers} jugadores
                </ThemedText>
                {availableSpots > 0 && (
                  <ThemedText
                    type="caption"
                    style={availableSpots <= 2 ? styles.urgentSpots : undefined}
                  >
                    {availableSpots} {availableSpots === 1 ? "cupo" : "cupos"}
                  </ThemedText>
                )}
              </View>
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
            <ThemedView
              style={isCreator ? styles.organizerBadge : styles.confirmedBadge}
              rounded
            >
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
    <Card onPress={handlePress} style={styles.card} shadow="s">
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <ThemedView style={styles.dateChip} rounded>
            <ThemedText style={styles.dateChipText} weight="semiBold">
              {getRelativeDate()}
            </ThemedText>
          </ThemedView>
          <ThemedText type="body" weight="semiBold" style={styles.timeText}>
            {formattedTime}
          </ThemedText>
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
          <View style={styles.infoItem}>
            <IconSymbol
              name="person.fill"
              size={16}
              color={Colors[colorScheme].textSecondary}
              style={styles.infoIcon}
            />
            <ThemedText type="caption" secondary>
              {match.creatorName}
            </ThemedText>
          </View>

          <View style={styles.infoItem}>
            <ThemedText type="caption" secondary>
              Nivel:{" "}
              {match.level === "beginner"
                ? "Principiante"
                : match.level === "intermediate"
                ? "Intermedio"
                : match.level === "advanced"
                ? "Avanzado"
                : "Todos"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.playerSection}>
          <View style={styles.playerBar}>
            <View
              style={[
                styles.playerProgress,
                {
                  width: `${(confirmedPlayers / match.maxPlayers) * 100}%`,
                  backgroundColor:
                    confirmedPlayers >= match.maxPlayers / 2
                      ? Colors.light.success
                      : Colors.light.warning,
                },
              ]}
            />
          </View>

          <View style={styles.playerText}>
            <ThemedText type="caption" secondary>
              {confirmedPlayers}/{match.maxPlayers} jugadores
            </ThemedText>

            {availableSpots > 0 && match.status !== "cancelled" && (
              <ThemedText
                type="caption"
                style={availableSpots <= 2 ? styles.urgentSpots : undefined}
              >
                {availableSpots} {availableSpots === 1 ? "cupo" : "cupos"}{" "}
                disponible{availableSpots !== 1 ? "s" : ""}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Mostrar avatares de algunos jugadores */}
        {confirmedPlayers > 0 && (
          <View style={styles.avatarsRow}>
            {match.players
              .filter((player) => player.status === "confirmed")
              .slice(0, 4)
              .map((player, index) => (
                <View
                  key={player.userId}
                  style={[styles.avatarContainer, { zIndex: 5 - index }]}
                >
                  {player.photoURL ? (
                    <Image
                      source={{ uri: player.photoURL }}
                      style={styles.avatar}
                    />
                  ) : (
                    <ThemedView style={styles.avatarFallback} rounded>
                      <ThemedText style={styles.avatarText}>
                        {player.displayName.substring(0, 1).toUpperCase()}
                      </ThemedText>
                    </ThemedView>
                  )}
                </View>
              ))}

            {confirmedPlayers > 4 && (
              <ThemedView style={styles.moreAvatars} rounded>
                <ThemedText style={styles.moreAvatarsText}>
                  +{confirmedPlayers - 4}
                </ThemedText>
              </ThemedView>
            )}
          </View>
        )}
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
            leftIcon="plus"
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
    flexDirection: "row",
    alignItems: "center",
  },
  dateChip: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    marginRight: Spacing.xs,
  },
  dateChipText: {
    color: Colors.light.primary,
    fontSize: 14,
  },
  timeText: {
    marginLeft: Spacing.xs,
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
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 4,
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
    borderRadius: 4,
  },
  playerText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  avatarsRow: {
    flexDirection: "row",
    marginTop: Spacing.m,
    height: 32,
  },
  avatarContainer: {
    marginRight: -8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "white",
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  moreAvatars: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.textSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  moreAvatarsText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
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
  statusText: {
    color: "white",
    fontWeight: "600",
  },
  urgentSpots: {
    color: Colors.light.warning,
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
  dateTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginBottom: Spacing.xs,
  },
  playerInfo: {
    marginTop: Spacing.xs,
  },
  playerStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
