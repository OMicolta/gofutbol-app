// app/match/[id].tsx

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Card } from "@/components/ui/Card";
import { PlayerList } from "@/components/match/PlayerList";
import { RatingForm } from "@/components/match/RatingForm";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { Match, TeamType } from "@/store/matchStore";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const {
    getMatchDetails,
    joinMatch,
    leaveMatch,
    changeTeam,
    isLoading,
    error,
  } = useMatches();
  const { showNotification } = useNotification();

  const [match, setMatch] = useState<Match | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    const loadMatch = async () => {
      if (id) {
        const matchData = await getMatchDetails(id);
        setMatch(matchData);
      }
    };

    loadMatch();
  }, [id]);

  // Verificar si el usuario está en el partido
  const isCreator = user && match ? user.uid === match.createdBy : false;
  const isPlayerConfirmed =
    user && match
      ? match.players.some(
          (player) =>
            player.userId === user.uid && player.status === "confirmed"
        )
      : false;

  // Verificar si el partido ya pasó
  const isMatchPast = match
    ? new Date(match.date.toDate()) < new Date()
    : false;

  // Manejar unirse al partido
  const handleJoin = async () => {
    try {
      if (!match) return;
      await joinMatch(match.id);
      showNotification("¡Te has unido al partido correctamente!", "success");

      // Actualizar datos del partido
      const updatedMatch = await getMatchDetails(match.id);
      setMatch(updatedMatch);
    } catch (error) {
      console.error("Error al unirse al partido:", error);
      showNotification(`Error al unirse: ${(error as Error).message}`, "error");
    }
  };

  // Manejar abandonar el partido
  const handleLeave = async () => {
    try {
      if (!match) return;

      Alert.alert(
        "Abandonar partido",
        "¿Estás seguro de que quieres abandonar este partido?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Abandonar",
            style: "destructive",
            onPress: async () => {
              await leaveMatch(match.id);
              showNotification("Has abandonado el partido", "info");

              // Actualizar datos del partido
              const updatedMatch = await getMatchDetails(match.id);
              setMatch(updatedMatch);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error al abandonar el partido:", error);
      showNotification(
        `Error al abandonar: ${(error as Error).message}`,
        "error"
      );
    }
  };

  // Manejar cambio de equipo
  const handleChangeTeam = async (playerId: string, newTeam: TeamType) => {
    try {
      if (!match || !user) return;

      // Solo permitir cambiar el propio equipo o si eres el creador
      if (playerId !== user.uid && match.createdBy !== user.uid) {
        return;
      }

      await changeTeam(match.id, playerId, newTeam);
      showNotification("Equipo actualizado correctamente", "success");

      // Actualizar datos del partido
      const updatedMatch = await getMatchDetails(match.id);
      setMatch(updatedMatch);
    } catch (error) {
      console.error("Error al cambiar de equipo:", error);
      showNotification(
        `Error al cambiar equipo: ${(error as Error).message}`,
        "error"
      );
    }
  };

  // Manejar eliminación de jugador (para el creador)
  const handleRemovePlayer = async (playerId: string) => {
    try {
      if (!match || !user || match.createdBy !== user.uid) return;

      Alert.alert(
        "Remover jugador",
        "¿Estás seguro de que quieres remover a este jugador del partido?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Remover",
            style: "destructive",
            onPress: async () => {
              // Esta funcionalidad se implementará en una versión futura
              showNotification("Funcionalidad en desarrollo", "info");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error al remover jugador:", error);
      showNotification(
        `Error al remover jugador: ${(error as Error).message}`,
        "error"
      );
    }
  };

  // Manejar apertura del mapa
  const handleOpenMap = () => {
    if (match?.location) {
      const { latitude, longitude } = match.location;
      const label = match.fieldName || "Ubicación del partido";

      const url = Platform.select({
        ios: `maps:?q=${label}@${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${label}`,
      });

      Linking.canOpenURL(url!).then((supported) => {
        if (supported) {
          Linking.openURL(url!);
        } else {
          Alert.alert("Error", "No se pudo abrir la aplicación de mapas.");
        }
      });
    }
  };

  // Manejar cancelación del partido (solo para el creador)
  const handleCancelMatch = () => {
    Alert.alert(
      "Cancelar partido",
      "¿Estás seguro de que quieres cancelar este partido? Esta acción no se puede deshacer.",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            // Esta funcionalidad se implementará en una versión futura
            showNotification("Funcionalidad en desarrollo", "info");
          },
        },
      ]
    );
  };

  if (isLoading || !match) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={styles.loadingText}>
          Cargando información del partido...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="subtitle" style={styles.errorTitle}>
          Error al cargar
        </ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button
          title="Volver"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </ThemedView>
    );
  }

  // Formatear fecha y hora
  const matchDate = match.date.toDate();
  const formattedDate = matchDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime =
    match.time ||
    matchDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Contar jugadores confirmados
  const confirmedPlayers = match.players.filter(
    (player) => player.status === "confirmed"
  ).length;

  return (
    <ThemedView style={styles.container}>
      {/* Header con botón de volver */}
      <SafeAreaView edges={["top"]} style={styles.safeAreaTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedView
            style={styles.backButtonCircle}
            variant="card"
            rounded
            shadow="s"
          >
            <IconSymbol
              name="arrow.left"
              size={24}
              color={Colors[colorScheme].text}
            />
          </ThemedView>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          {/* Header con título y fecha */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <ThemedText type="title" style={styles.matchTitle}>
                Partido {match.type}
              </ThemedText>
            </View>

            <View style={styles.dateContainer}>
              <ThemedView style={styles.dateChip} variant="secondary" rounded>
                <ThemedText
                  style={styles.dateText}
                  weight="semiBold"
                  type="body"
                >
                  {formattedDate} • {formattedTime}
                </ThemedText>
              </ThemedView>
            </View>

            {match.status === "cancelled" && (
              <ThemedView style={styles.statusBadge} rounded="m">
                <ThemedText style={styles.statusText} weight="semiBold">
                  Cancelado
                </ThemedText>
              </ThemedView>
            )}
          </Card>

          {/* Sección de ubicación */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                name="paperplane.fill"
                size={20}
                color={Colors[colorScheme].primary}
                style={styles.sectionIcon}
              />
              <ThemedText
                type="subtitle"
                weight="semiBold"
                style={styles.sectionTitle}
              >
                Ubicación
              </ThemedText>
            </View>

            {match.location?.latitude && match.location?.longitude ? (
              <>
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.fieldName}
                >
                  {match.fieldName || ""}
                </ThemedText>

                {match.address && (
                  <ThemedText type="body" secondary style={styles.address}>
                    {match.address}
                  </ThemedText>
                )}

                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: match.location.latitude,
                      longitude: match.location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    showsUserLocation
                  >
                    <Marker
                      coordinate={{
                        latitude: match.location.latitude,
                        longitude: match.location.longitude,
                      }}
                      title={match.fieldName || "Ubicación del partido"}
                    />
                  </MapView>

                  <Button
                    title="Ver en Mapa"
                    variant="outlined"
                    size="small"
                    leftIcon="paperplane.fill"
                    onPress={handleOpenMap}
                    style={styles.mapButton}
                  />
                </View>
              </>
            ) : (
              <ThemedView
                style={styles.noLocationContainer}
                variant="secondary"
                rounded
              >
                <ThemedText type="body" secondary style={styles.noLocationText}>
                  No hay ubicación definida para este partido
                </ThemedText>
              </ThemedView>
            )}
          </Card>

          {/* Sección de detalles */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                name="soccer.ball"
                size={20}
                color={Colors[colorScheme].primary}
                style={styles.sectionIcon}
              />
              <ThemedText
                type="subtitle"
                weight="semiBold"
                style={styles.sectionTitle}
              >
                Detalles
              </ThemedText>
            </View>

            <View style={styles.detailRows}>
              <View style={styles.detailRow}>
                <ThemedText type="body" secondary>
                  Organizador:
                </ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {match.creatorName}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="body" secondary>
                  Nivel:
                </ThemedText>
                <ThemedText type="body">
                  {match.level === "beginner"
                    ? "Principiante"
                    : match.level === "intermediate"
                    ? "Intermedio"
                    : match.level === "advanced"
                    ? "Avanzado"
                    : "Todos los niveles"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="body" secondary>
                  Jugadores:
                </ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {confirmedPlayers}/{match.maxPlayers}
                </ThemedText>
              </View>

              {match.price && (
                <View style={styles.detailRow}>
                  <ThemedText type="body" secondary>
                    Precio:
                  </ThemedText>
                  <ThemedText
                    type="body"
                    weight="semiBold"
                    style={styles.priceText}
                  >
                    ${match.price.toLocaleString("es-CO")}
                  </ThemedText>
                </View>
              )}
            </View>

            {match.description && (
              <View style={styles.descriptionContainer}>
                <ThemedText
                  type="body"
                  secondary
                  style={styles.descriptionLabel}
                >
                  Descripción:
                </ThemedText>
                <ThemedText type="body" style={styles.description}>
                  {match.description}
                </ThemedText>
              </View>
            )}

            {/* Colores de uniforme */}
            <View style={styles.uniformsContainer}>
              <ThemedText type="body" secondary style={styles.uniformsLabel}>
                Colores de uniforme:
              </ThemedText>

              <View style={styles.uniformsRow}>
                <ThemedView
                  style={styles.uniformBox}
                  variant="secondary"
                  rounded
                >
                  <ThemedText
                    type="body"
                    weight="semiBold"
                    style={styles.teamLabel}
                  >
                    Equipo A
                  </ThemedText>
                  <ThemedText type="body">
                    {match.uniformA || "No especificado"}
                  </ThemedText>
                </ThemedView>

                <ThemedView
                  style={styles.uniformBox}
                  variant="secondary"
                  rounded
                >
                  <ThemedText
                    type="body"
                    weight="semiBold"
                    style={styles.teamLabel}
                  >
                    Equipo B
                  </ThemedText>
                  <ThemedText type="body">
                    {match.uniformB || "No especificado"}
                  </ThemedText>
                </ThemedView>
              </View>
            </View>
          </Card>

          {/* Lista de jugadores */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <IconSymbol
                name="person.fill"
                size={20}
                color={Colors[colorScheme].primary}
                style={styles.sectionIcon}
              />
              <ThemedText
                type="subtitle"
                weight="semiBold"
                style={styles.sectionTitle}
              >
                Jugadores
              </ThemedText>
            </View>

            <PlayerList
              players={match.players}
              matchCreatorId={match.createdBy}
              isEditable={!isMatchPast && (isCreator || isPlayerConfirmed)}
              onChangeTeam={handleChangeTeam}
              onRemovePlayer={isCreator ? handleRemovePlayer : undefined}
            />
          </Card>

          {/* Formulario de calificación (si el partido ya pasó) */}
          {isMatchPast && isPlayerConfirmed && (
            <Card style={styles.sectionCard}>
              <View style={styles.ratingHeader}>
                <View style={styles.sectionHeader}>
                  <IconSymbol
                    name="star.fill"
                    size={20}
                    color={Colors[colorScheme].primary}
                    style={styles.sectionIcon}
                  />
                  <ThemedText type="subtitle" weight="semiBold">
                    Calificar jugadores
                  </ThemedText>
                </View>
                <Button
                  title={showRatingForm ? "Ocultar" : "Calificar"}
                  size="small"
                  variant={showRatingForm ? "outlined" : "filled"}
                  onPress={() => setShowRatingForm(!showRatingForm)}
                />
              </View>

              {showRatingForm && (
                <RatingForm matchId={match.id} players={match.players} />
              )}
            </Card>
          )}

          {/* Botones de acción para el creador */}
          {isCreator && !isMatchPast && match.status !== "cancelled" && (
            <View style={styles.creatorActions}>
              <Button
                title="Editar Partido"
                size="medium"
                variant="outlined"
                leftIcon="pencil"
                style={styles.editButton}
                onPress={() => router.push(`/match/edit/${match.id}` as any)}
              />

              <Button
                title="Cancelar Partido"
                size="medium"
                variant="outlined"
                color="danger"
                leftIcon="trash.fill"
                style={styles.cancelButton}
                onPress={handleCancelMatch}
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Botones de acción fijos en la parte inferior */}
      {!isCreator && !isMatchPast && match.status !== "cancelled" && (
        <SafeAreaView edges={["bottom"]} style={styles.bottomContainer}>
          <ThemedView style={styles.actionBar} variant="card" shadow="m">
            {isPlayerConfirmed ? (
              <Button
                title="Abandonar Partido"
                size="medium"
                variant="filled"
                color="danger"
                leftIcon="trash.fill"
                fullWidth
                onPress={handleLeave}
              />
            ) : (
              <Button
                title="Unirme al Partido"
                size="medium"
                leftIcon="plus"
                fullWidth
                disabled={match.status === "full"}
                onPress={handleJoin}
              />
            )}
          </ThemedView>
        </SafeAreaView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    margin: Spacing.m,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  scrollContent: {
    padding: Spacing.l,
    paddingTop: Spacing.xl * 2, // Espacio para el botón de volver
    paddingBottom: 100, // Espacio para botones fijos
  },
  headerCard: {
    marginBottom: Spacing.m,
    overflow: "hidden",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  headerContent: {
    alignItems: "flex-start",
  },
  matchTitle: {
    marginBottom: Spacing.xs,
  },
  dateContainer: {
    marginTop: Spacing.xs,
    alignItems: "flex-start",
  },
  dateChip: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.light.primary + "20", // Semi-transparente
  },
  dateText: {
    color: Colors.light.primary,
  },
  statusBadge: {
    backgroundColor: Colors.light.danger + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
    marginTop: Spacing.s,
  },
  statusText: {
    color: Colors.light.danger,
  },
  sectionCard: {
    marginBottom: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  sectionIcon: {
    marginRight: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.light.primary,
  },
  fieldName: {
    marginBottom: Spacing.xs,
  },
  address: {
    marginBottom: Spacing.m,
  },
  mapContainer: {
    height: 180,
    borderRadius: Shape.radius.m,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapButton: {
    alignSelf: "flex-end",
    marginTop: Spacing.s,
  },
  noLocationContainer: {
    padding: Spacing.m,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  noLocationText: {
    textAlign: "center",
  },
  detailRows: {
    marginBottom: Spacing.m,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.s,
  },
  priceText: {
    color: Colors.light.primary,
  },
  descriptionContainer: {
    marginBottom: Spacing.m,
  },
  descriptionLabel: {
    marginBottom: Spacing.xs,
  },
  description: {
    lineHeight: 22,
  },
  uniformsContainer: {
    marginTop: Spacing.s,
  },
  uniformsLabel: {
    marginBottom: Spacing.s,
  },
  uniformsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.m,
  },
  uniformBox: {
    flex: 1,
    padding: Spacing.m,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  teamLabel: {
    marginBottom: Spacing.xs,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  creatorActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.l,
  },
  editButton: {
    flex: 1,
    marginRight: Spacing.s,
  },
  cancelButton: {
    flex: 1,
    marginLeft: Spacing.s,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionBar: {
    padding: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 99, 99, 0.3)", // Color más rojizo para acción de abandonar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  errorTitle: {
    marginBottom: Spacing.m,
  },
  errorText: {
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  errorButton: {
    minWidth: 120,
  },
});
