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
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
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
  isHistorical?: boolean;
}

export function MatchCard({
  match,
  onPress,
  onJoin,
  onLeave,
  mode = "full",
  isHistorical = false,
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

  // Obtener resultado del partido si es histórico
  const getTeamCount = (team: "A" | "B") => {
    return match.players.filter(
      (p) => p.team === team && p.status === "confirmed"
    ).length;
  };

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
    if (isHistorical) {
      return formattedDate; // Para partidos históricos siempre mostrar la fecha completa
    } else if (isToday()) {
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
      if (isHistorical) {
        router.push({
          pathname: `/match/[id]` as const,
          params: { id: match.id, isHistorical: "true" },
        });
      } else {
        router.push(`/match/${match.id}` as any);
      }
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

  // Renderizar el MVP si existe
  const renderMVP = () => {
    if (!isHistorical) return null;

    const mvpPlayer = match.players.find((p) => p.rating?.isMVP);
    if (!mvpPlayer) return null;

    return (
      <View style={styles.mvpContainer}>
        <IconSymbol
          name="star.fill"
          size={14}
          color={Colors[colorScheme].warning}
        />
        <ThemedText style={styles.mvpText}>
          MVP: {mvpPlayer.displayName}
        </ThemedText>
      </View>
    );
  };

  // Renderizar versión compacta
  if (mode === "compact") {
    return (
      <Card onPress={handlePress} style={styles.compactCard} shadow="s">
        <View style={styles.compactContent}>
          <View style={styles.compactInfo}>
            <View style={styles.compactHeader}>
              <View style={styles.dateTimeInfo}>
                <ThemedView style={styles.dateChip} rounded variant="secondary">
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

              <View style={styles.compactBadges}>
                <ThemedView
                  style={styles.typeBadge}
                  rounded="s"
                  variant="secondary"
                >
                  <ThemedText style={styles.typeText}>{match.type}</ThemedText>
                </ThemedView>

                {isCreator && (
                  <ThemedView style={styles.miniCreatorBadge} rounded>
                    <ThemedText style={styles.miniCreatorText}>C</ThemedText>
                  </ThemedView>
                )}
              </View>
            </View>

            <ThemedText
              type="caption"
              secondary
              numberOfLines={1}
              style={styles.locationText}
            >
              {match.fieldName || "Ubicación por definir"}
            </ThemedText>

            {isHistorical ? (
              <View style={styles.historicalCompactRow}>
                <View style={styles.miniTeamsContainer}>
                  <ThemedText style={styles.miniTeamCount}>
                    {getTeamCount("A")}
                  </ThemedText>
                  <ThemedText style={styles.miniVsText}>vs</ThemedText>
                  <ThemedText style={styles.miniTeamCount}>
                    {getTeamCount("B")}
                  </ThemedText>
                </View>

                <View style={styles.finishedBadge}>
                  <ThemedText style={styles.finishedText}>
                    Finalizado
                  </ThemedText>
                </View>
              </View>
            ) : (
              <View style={styles.playerInfo}>
                <View style={styles.playerBar}>
                  <View
                    style={[
                      styles.playerProgress,
                      {
                        width: `${
                          (confirmedPlayers / match.maxPlayers) * 100
                        }%`,
                        backgroundColor:
                          confirmedPlayers >= match.maxPlayers / 2
                            ? Colors[colorScheme].success
                            : Colors[colorScheme].warning,
                      },
                    ]}
                  />
                </View>
                <View style={styles.playerStatusRow}>
                  <ThemedText type="caption" secondary>
                    {confirmedPlayers}/{match.maxPlayers} jugadores
                  </ThemedText>
                  {availableSpots > 0 && !isHistorical && (
                    <ThemedText
                      type="caption"
                      style={
                        availableSpots <= 2 ? styles.urgentSpots : undefined
                      }
                    >
                      {availableSpots} {availableSpots === 1 ? "cupo" : "cupos"}
                    </ThemedText>
                  )}
                </View>
              </View>
            )}
          </View>

          {!isHistorical && (
            <View style={styles.actionsContainer}>
              {isPlayerConfirmed ? (
                <Button
                  variant="ghost"
                  color="danger"
                  size="small"
                  title="Salir"
                  onPress={handleLeave}
                  style={styles.compactButton}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="small"
                  title="Unirme"
                  onPress={handleJoin}
                  style={styles.compactButton}
                  disabled={match.status === "full" || availableSpots <= 0}
                />
              )}
            </View>
          )}

          {isHistorical && renderMVP()}
        </View>
      </Card>
    );
  }

  // Renderizar versión completa
  return (
    <Card onPress={handlePress} style={styles.card} shadow="s">
      {/* Encabezado de la tarjeta */}
      <View style={styles.cardHeader}>
        <View style={styles.dateTimeContainer}>
          <ThemedView style={styles.dateChip} rounded variant="secondary">
            <ThemedText style={styles.dateChipText} weight="semiBold">
              {getRelativeDate()}
            </ThemedText>
          </ThemedView>
          <ThemedText style={styles.timeText} weight="semiBold">
            {formattedTime}
          </ThemedText>
        </View>

        <View style={styles.badgesContainer}>
          <ThemedView style={styles.typeBadge} rounded="s" variant="secondary">
            <ThemedText style={styles.typeText}>{match.type}</ThemedText>
          </ThemedView>

          {isHistorical && (
            <ThemedView style={styles.historicalBadge} rounded>
              <ThemedText style={styles.historicalText}>Finalizado</ThemedText>
            </ThemedView>
          )}
        </View>
      </View>

      {/* Etiqueta de creador si aplica */}
      {isCreator && (
        <View style={styles.creatorContainer}>
          <ThemedView style={styles.creatorBadge} rounded>
            <ThemedText style={styles.creatorText}>Creador</ThemedText>
          </ThemedView>
        </View>
      )}

      {/* Información de la ubicación */}
      <View style={styles.locationContainer}>
        <ThemedText
          type="body"
          weight="semiBold"
          numberOfLines={1}
          style={styles.fieldName}
        >
          {match.fieldName || "Ubicación por definir"}
        </ThemedText>

        {match.address && (
          <ThemedText
            type="caption"
            secondary
            numberOfLines={1}
            style={styles.address}
          >
            {match.address}
          </ThemedText>
        )}
      </View>

      {/* Información adicional para partidos históricos */}
      {isHistorical && (
        <View style={styles.historicalInfoContainer}>
          <View style={styles.teamsScoreContainer}>
            <View style={styles.teamScoreBox}>
              <ThemedText style={styles.teamLabel}>
                Equipo {match.uniformA || "A"}
              </ThemedText>
              <ThemedText style={styles.teamCount}>
                {getTeamCount("A")}
              </ThemedText>
            </View>
            <ThemedText style={styles.vsText}>vs</ThemedText>
            <View style={styles.teamScoreBox}>
              <ThemedText style={styles.teamLabel}>
                Equipo {match.uniformB || "B"}
              </ThemedText>
              <ThemedText style={styles.teamCount}>
                {getTeamCount("B")}
              </ThemedText>
            </View>
          </View>
          {renderMVP()}
        </View>
      )}

      {/* Información de jugadores */}
      <View style={styles.playersContainer}>
        <View style={styles.playerBar}>
          <View
            style={[
              styles.playerProgress,
              {
                width: `${(confirmedPlayers / match.maxPlayers) * 100}%`,
                backgroundColor:
                  confirmedPlayers >= match.maxPlayers / 2
                    ? Colors[colorScheme].success
                    : Colors[colorScheme].warning,
              },
            ]}
          />
        </View>

        <View style={styles.playerInfo}>
          <ThemedText type="caption" secondary>
            {confirmedPlayers}/{match.maxPlayers} jugadores confirmados
          </ThemedText>

          {!isHistorical && availableSpots > 0 && (
            <ThemedText
              type="caption"
              style={availableSpots <= 2 ? styles.urgentSpots : undefined}
            >
              {availableSpots} {availableSpots === 1 ? "lugar" : "lugares"}{" "}
              {availableSpots <= 2 ? "¡Úrgente!" : "disponibles"}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Botones de acción */}
      {!isHistorical && (
        <View style={styles.actionsContainer}>
          {isPlayerConfirmed ? (
            <Button
              title="Salir del partido"
              variant="outlined"
              color="danger"
              size="small"
              onPress={handleLeave}
            />
          ) : (
            <Button
              title="Unirme al partido"
              size="small"
              onPress={handleJoin}
              disabled={match.status === "full" || availableSpots <= 0}
              leftIcon={
                match.status === "full" || availableSpots <= 0
                  ? undefined
                  : "plus"
              }
            />
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.m,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  creatorContainer: {
    marginBottom: Spacing.s,
  },
  dateChip: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    marginRight: Spacing.xs,
  },
  dateChipText: {
    color: Colors.light.primary,
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.semiBold,
  },
  timeText: {
    marginLeft: Spacing.xs,
  },
  typeBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  typeText: {
    color: Colors.light.primary,
    fontWeight: Typography.fontWeights.semiBold,
    fontSize: Typography.fontSizes.s,
  },
  locationContainer: {
    marginBottom: Spacing.m,
  },
  fieldName: {
    marginBottom: Spacing.xs,
  },
  address: {
    marginBottom: Spacing.xs,
  },
  historicalInfoContainer: {
    marginBottom: Spacing.m,
    borderRadius: Shape.radius.s,
    backgroundColor: Colors.light.backgroundSecondary,
    padding: Spacing.s,
  },
  teamsScoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  teamScoreBox: {
    alignItems: "center",
    padding: Spacing.s,
  },
  teamLabel: {
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.xs / 2,
  },
  teamCount: {
    fontSize: Typography.fontSizes.l,
    fontWeight: Typography.fontWeights.bold,
  },
  vsText: {
    fontSize: Typography.fontSizes.m,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.textSecondary,
  },
  mvpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  mvpText: {
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.warning,
    marginLeft: Spacing.xs,
  },
  playersContainer: {
    marginBottom: Spacing.m,
  },
  playerBar: {
    height: 8,
    backgroundColor: Colors.light.borderLight,
    borderRadius: Shape.radius.xs,
    marginBottom: Spacing.xs,
    overflow: "hidden",
  },
  playerProgress: {
    height: "100%",
    borderRadius: Shape.radius.xs,
  },
  playerInfo: {
    marginTop: Spacing.xs,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  creatorBadge: {
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    gap: Spacing.xs,
  },
  creatorText: {
    color: "white",
    fontWeight: Typography.fontWeights.semiBold,
  },
  historicalBadge: {
    backgroundColor: Colors.light.danger + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Shape.radius.s,
  },
  historicalText: {
    color: Colors.light.danger,
    fontWeight: Typography.fontWeights.semiBold,
    fontSize: Typography.fontSizes.s,
  },
  urgentSpots: {
    color: Colors.light.warning,
    fontWeight: Typography.fontWeights.semiBold,
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
  compactBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dateTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginBottom: Spacing.xs,
  },
  playerStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  finishedBadge: {
    backgroundColor: Colors.light.danger + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Shape.radius.s,
    marginBottom: Spacing.xs,
  },
  finishedText: {
    color: Colors.light.danger,
    fontWeight: Typography.fontWeights.semiBold,
    fontSize: Typography.fontSizes.s,
  },
  compactButton: {
    marginHorizontal: 0,
  },
  historicalCompactInfo: {
    alignItems: "flex-end",
  },
  miniCreatorBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Shape.radius.round,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCreatorText: {
    color: "white",
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.xs,
  },
  historicalCompactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  miniTeamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  miniTeamCount: {
    fontSize: Typography.fontSizes.m,
    fontWeight: Typography.fontWeights.bold,
  },
  miniVsText: {
    fontSize: Typography.fontSizes.s,
    color: Colors.light.textSecondary,
  },
});
