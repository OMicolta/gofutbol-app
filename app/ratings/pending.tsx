// app/ratings/pending.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingForm } from "@/components/match/RatingForm";
import { useAuth } from "@/hooks/useAuth";
import { useRatings } from "@/hooks/useRatings";
import { PlayerEntry } from "@/store/matchStore";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";

export default function PendingRatingsScreen() {
  const colorScheme = useColorScheme();
  const { user, requireAuth } = useAuth();
  const { pendingRatings, refreshPendingRatings, isLoading } = useRatings();
  const { showNotification } = useNotification();

  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<{
    matchId: string;
    fieldName: string | null;
    matchDate: Date;
    players: PlayerEntry[];
  } | null>(null);

  // Verificar autenticación y cargar calificaciones pendientes
  useEffect(() => {
    requireAuth();
    if (user) {
      refreshPendingRatings();
    }
  }, [user]);

  // Expandir un partido para calificar
  const handleExpandMatch = (matchId: string) => {
    // Si ya está expandido, cerrar
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
      setExpandedMatch(null);
      return;
    }

    // Buscar y expandir el partido seleccionado
    const match = pendingRatings.find((m) => m.matchId === matchId);
    if (match) {
      setExpandedMatchId(matchId);
      setExpandedMatch({
        matchId: match.matchId,
        fieldName: match.fieldName,
        matchDate: match.matchDate,
        players: match.players,
      });
    }
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText type="body">← Volver</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title">Calificaciones Pendientes</ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors[colorScheme].primary}
            />
            <ThemedText style={styles.loadingText}>
              Cargando partidos pendientes...
            </ThemedText>
          </View>
        ) : pendingRatings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              No hay calificaciones pendientes
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              ¡Estás al día! No tienes partidos pendientes por calificar.
            </ThemedText>
            <Button
              title="Volver al inicio"
              onPress={() => router.replace("/(tabs)")}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <FlatList
            data={pendingRatings}
            keyExtractor={(item) => item.matchId}
            contentContainerStyle={styles.matchesList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.matchContainer}>
                <Card
                  onPress={() => handleExpandMatch(item.matchId)}
                  style={[
                    styles.matchCard,
                    expandedMatchId === item.matchId &&
                      styles.expandedMatchCard,
                  ]}
                >
                  <View style={styles.matchHeader}>
                    <View>
                      <ThemedText type="body" weight="semiBold">
                        {formatDate(item.matchDate)}
                      </ThemedText>
                      <ThemedText type="caption" secondary>
                        {item.fieldName || "Ubicación no especificada"}
                      </ThemedText>
                    </View>
                    <Button
                      title={
                        expandedMatchId === item.matchId
                          ? "Cerrar"
                          : "Calificar"
                      }
                      size="small"
                      variant={
                        expandedMatchId === item.matchId ? "outlined" : "filled"
                      }
                    />
                  </View>

                  <View style={styles.playersInfo}>
                    <ThemedText type="caption" secondary>
                      {item.players.length} jugadores por calificar
                    </ThemedText>
                    <View style={styles.playerAvatars}>
                      {item.players.slice(0, 3).map((player, index) => {
                        const profileImage = player.photoURL
                          ? { uri: player.photoURL }
                          : require("@/assets/images/default-avatar.png");

                        return (
                          <Image
                            key={player.userId + index}
                            source={profileImage}
                            style={[
                              styles.playerAvatar,
                              { marginLeft: index > 0 ? -10 : 0 },
                            ]}
                          />
                        );
                      })}
                      {item.players.length > 3 && (
                        <ThemedView style={styles.morePlayersIndicator} rounded>
                          <ThemedText style={styles.morePlayersText}>
                            +{item.players.length - 3}
                          </ThemedText>
                        </ThemedView>
                      )}
                    </View>
                  </View>
                </Card>

                {expandedMatchId === item.matchId && expandedMatch && (
                  <ThemedView
                    style={styles.ratingFormContainer}
                    variant="secondary"
                    rounded
                  >
                    <RatingForm
                      matchId={expandedMatch.matchId}
                      players={expandedMatch.players}
                    />
                  </ThemedView>
                )}
              </View>
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
    paddingHorizontal: Spacing.l,
  },
  header: {
    paddingVertical: Spacing.m,
  },
  backButton: {
    marginBottom: Spacing.s,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  emptyTitle: {
    marginBottom: Spacing.m,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  emptyButton: {
    minWidth: 150,
  },
  matchesList: {
    paddingBottom: Spacing.xxl,
  },
  matchContainer: {
    marginBottom: Spacing.l,
  },
  matchCard: {
    // Estilo base, sin dependencias de variables de estado
  },
  // Estilo adicional para cuando un partido está expandido
  expandedMatchCard: {
    marginBottom: Spacing.xs,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playersInfo: {
    marginTop: Spacing.s,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "white",
  },
  morePlayersIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -10,
  },
  morePlayersText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  ratingFormContainer: {
    padding: Spacing.m,
    marginBottom: Spacing.s,
  },
});
