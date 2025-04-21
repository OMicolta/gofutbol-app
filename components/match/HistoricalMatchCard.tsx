// components/match/HistoricalMatchCard.tsx

import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Match } from "@/store/matchStore";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface HistoricalMatchCardProps {
  match: Match;
  onPress?: () => void;
  compact?: boolean;
}

export function HistoricalMatchCard({
  match,
  onPress,
  compact = false,
}: HistoricalMatchCardProps) {
  const colorScheme = useColorScheme();

  // Formatear fecha
  const matchDate = match.date.toDate();
  const formattedDate = matchDate.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Formatear hora
  const formattedTime =
    match.time ||
    matchDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Obtener resultado del partido
  const getTeamCount = (team: "A" | "B") => {
    return match.players.filter(
      (p) => p.team === team && p.status === "confirmed"
    ).length;
  };

  // Buscar el MVP si existe
  const mvpPlayer = match.players.find((p) => p.rating?.isMVP);

  // Manejar navegación al detalle
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: `/match/[id]` as const,
        params: { id: match.id, isHistorical: "true" },
      });
    }
  };

  // Versión compacta para listas
  if (compact) {
    return (
      <Card onPress={handlePress} style={styles.compactCard} shadow="s">
        <View style={styles.dateLocationContainer}>
          <ThemedView style={styles.dateChip} variant="secondary" rounded>
            <ThemedText style={styles.dateChipText} weight="semiBold">
              {formattedDate}
            </ThemedText>
          </ThemedView>
          <ThemedText type="body" weight="semiBold">
            {formattedTime}
          </ThemedText>
        </View>

        <ThemedText
          type="body"
          weight="semiBold"
          numberOfLines={1}
          style={styles.fieldNameCompact}
        >
          {match.fieldName || "Ubicación no especificada"}
        </ThemedText>

        <View style={styles.compactFooter}>
          <ThemedView style={styles.typeBadge} variant="secondary" rounded="s">
            <ThemedText style={styles.typeText}>{match.type}</ThemedText>
          </ThemedView>

          <View style={styles.teamsStatsCompact}>
            <ThemedText style={styles.teamAText}>
              {getTeamCount("A")}
            </ThemedText>
            <ThemedText style={styles.vsText}>vs</ThemedText>
            <ThemedText style={styles.teamBText}>
              {getTeamCount("B")}
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  // Versión completa
  return (
    <Card onPress={handlePress} style={styles.card} shadow="s">
      <View style={styles.cardHeader}>
        {/* Fecha y tipo de partido */}
        <View style={styles.dateTypeContainer}>
          <ThemedView style={styles.dateChip} variant="secondary" rounded>
            <ThemedText style={styles.dateChipText} weight="semiBold">
              {formattedDate}
            </ThemedText>
          </ThemedView>

          <ThemedText style={styles.timeText} weight="semiBold">
            {formattedTime}
          </ThemedText>

          <ThemedView style={styles.typeBadge} variant="secondary" rounded="s">
            <ThemedText style={styles.typeText}>{match.type}</ThemedText>
          </ThemedView>
        </View>

        {/* Badge de Finalizado */}
        <ThemedView style={styles.finishedBadge} rounded="s">
          <IconSymbol
            name="checkmark"
            size={14}
            color={Colors[colorScheme].success}
          />
          <ThemedText style={styles.finishedText}>Finalizado</ThemedText>
        </ThemedView>
      </View>

      {/* Información de ubicación */}
      <View style={styles.locationContainer}>
        <ThemedText
          type="body"
          weight="semiBold"
          numberOfLines={1}
          style={styles.fieldName}
        >
          {match.fieldName || "Ubicación no especificada"}
        </ThemedText>

        {match.address && (
          <ThemedText type="caption" secondary numberOfLines={1}>
            {match.address}
          </ThemedText>
        )}
      </View>

      {/* Sección de equipos y resultado */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamBox}>
          <ThemedView style={styles.teamABadge} rounded="s">
            <ThemedText style={styles.teamABadgeText}>Equipo A</ThemedText>
          </ThemedView>
          <ThemedText style={styles.teamScore}>{getTeamCount("A")}</ThemedText>
          <ThemedText type="caption" secondary>
            {match.uniformA || "Sin uniforme"}
          </ThemedText>
        </View>

        <ThemedText style={styles.vsText}>vs</ThemedText>

        <View style={styles.teamBox}>
          <ThemedView style={styles.teamBBadge} rounded="s">
            <ThemedText style={styles.teamBBadgeText}>Equipo B</ThemedText>
          </ThemedView>
          <ThemedText style={styles.teamScore}>{getTeamCount("B")}</ThemedText>
          <ThemedText type="caption" secondary>
            {match.uniformB || "Sin uniforme"}
          </ThemedText>
        </View>
      </View>

      {/* MVP */}
      {mvpPlayer && (
        <View style={styles.mvpContainer}>
          <ThemedView style={styles.mvpBadge} rounded="s">
            <IconSymbol
              name="star.fill"
              size={16}
              color={Colors[colorScheme].warning}
            />
            <ThemedText style={styles.mvpText}>
              MVP: {mvpPlayer.displayName}
            </ThemedText>
          </ThemedView>
        </View>
      )}

      {/* Jugadores */}
      <View style={styles.playersStatsContainer}>
        <ThemedText type="caption" secondary>
          {match.players.filter((p) => p.status === "confirmed").length}{" "}
          jugadores participaron
        </ThemedText>

        <ThemedText type="caption" secondary>
          Organizado por: {match.creatorName}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.m,
    padding: Spacing.m,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  dateTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  dateChip: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  dateChipText: {
    color: Colors.light.primary,
    fontSize: Typography.fontSizes.s,
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
  finishedBadge: {
    backgroundColor: Colors.light.success + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs / 2,
  },
  finishedText: {
    color: Colors.light.success,
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.semiBold,
  },
  locationContainer: {
    marginBottom: Spacing.m,
  },
  fieldName: {
    marginBottom: Spacing.xs,
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginVertical: Spacing.m,
    paddingVertical: Spacing.m,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  teamBox: {
    alignItems: "center",
    flex: 1,
  },
  teamABadge: {
    backgroundColor: Colors.light.info + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    marginBottom: Spacing.xs,
  },
  teamABadgeText: {
    color: Colors.light.info,
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.semiBold,
  },
  teamBBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    marginBottom: Spacing.xs,
  },
  teamBBadgeText: {
    color: Colors.light.primary,
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.semiBold,
  },
  teamScore: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    marginVertical: Spacing.xs,
  },
  vsText: {
    fontSize: Typography.fontSizes.l,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.textSecondary,
    marginHorizontal: Spacing.s,
  },
  mvpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: Spacing.s,
  },
  mvpBadge: {
    backgroundColor: Colors.light.warning + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  mvpText: {
    color: Colors.light.warning,
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.semiBold,
  },
  playersStatsContainer: {
    marginTop: Spacing.s,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Versión compacta
  compactCard: {
    marginBottom: Spacing.s,
    padding: Spacing.m,
  },
  dateLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  fieldNameCompact: {
    marginVertical: Spacing.xs,
  },
  compactFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  teamsStatsCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  teamAText: {
    fontSize: Typography.fontSizes.m,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.info,
  },
  teamBText: {
    fontSize: Typography.fontSizes.m,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.primary,
  },
});
