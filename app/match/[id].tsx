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

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { PlayerList } from "@/components/match/PlayerList";
import { RatingForm } from "@/components/match/RatingForm";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { Match, TeamType } from "@/store/matchStore";
import { Colors, Spacing } from "@/constants/Colors";
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
  const isPlayer =
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

      // Corregido: Se eliminó el tercer argumento matchId que era incorrecto
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
      <SafeAreaView edges={["top"]} style={styles.safeAreaTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedView style={styles.backButtonCircle} rounded>
            <IconSymbol
              name="chevron.right"
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
        {/* Encabezado */}
        <View style={styles.header}>
          <View style={styles.dateTimeContainer}>
            <ThemedText type="title" style={styles.matchType}>
              Partido {match.type}
            </ThemedText>
            <ThemedText type="body" style={styles.dateTime}>
              {formattedDate} • {formattedTime}
            </ThemedText>
          </View>

          {match.status === "cancelled" && (
            <ThemedView style={styles.cancelledBadge} rounded="s">
              <ThemedText style={styles.cancelledText}>Cancelado</ThemedText>
            </ThemedView>
          )}
        </View>

        {/* Información del lugar */}
        <ThemedView
          style={styles.locationCard}
          variant="card"
          rounded
          shadow="s"
        >
          <ThemedText type="subtitle">Ubicación</ThemedText>

          <ThemedText type="body" weight="semiBold" style={styles.fieldName}>
            {match.fieldName || "Por definir"}
          </ThemedText>

          {match.address && (
            <ThemedText type="body" secondary style={styles.address}>
              {match.address}
            </ThemedText>
          )}

          {match.location &&
            match.location.latitude &&
            match.location.longitude && (
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
                  onPress={handleOpenMap}
                  style={styles.mapButton}
                />
              </View>
            )}
        </ThemedView>

        {/* Información del partido */}
        <ThemedView style={styles.infoCard} variant="card" rounded shadow="s">
          <ThemedText type="subtitle">Detalles</ThemedText>

          <View style={styles.infoRow}>
            <ThemedText type="body" secondary>
              Organizador:
            </ThemedText>
            <ThemedText type="body">{match.creatorName}</ThemedText>
          </View>

          <View style={styles.infoRow}>
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

          <View style={styles.infoRow}>
            <ThemedText type="body" secondary>
              Jugadores:
            </ThemedText>
            <ThemedText type="body">
              {confirmedPlayers}/{match.maxPlayers}
            </ThemedText>
          </View>

          {match.price && (
            <View style={styles.infoRow}>
              <ThemedText type="body" secondary>
                Precio:
              </ThemedText>
              <ThemedText type="body" weight="semiBold" style={styles.price}>
                ${match.price.toLocaleString("es-CO")}
              </ThemedText>
            </View>
          )}

          {match.description && (
            <View style={styles.descriptionContainer}>
              <ThemedText type="body" secondary>
                Descripción:
              </ThemedText>
              <ThemedText type="body" style={styles.description}>
                {match.description}
              </ThemedText>
            </View>
          )}

          {/* Colores de uniforme */}
          <View style={styles.uniformsContainer}>
            <ThemedText type="body" secondary>
              Colores de uniforme:
            </ThemedText>

            <View style={styles.uniformsRow}>
              <View style={styles.uniformBox}>
                <ThemedText type="body" weight="semiBold">
                  Equipo A
                </ThemedText>
                <ThemedText type="body">
                  {match.uniformA || "No especificado"}
                </ThemedText>
              </View>

              <View style={styles.uniformBox}>
                <ThemedText type="body" weight="semiBold">
                  Equipo B
                </ThemedText>
                <ThemedText type="body">
                  {match.uniformB || "No especificado"}
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedView>

        {/* Lista de jugadores */}
        <ThemedView
          style={styles.playersCard}
          variant="card"
          rounded
          shadow="s"
        >
          <PlayerList
            players={match.players}
            matchCreatorId={match.createdBy}
            isEditable={!isMatchPast && (isCreator || isPlayer)}
            onChangeTeam={handleChangeTeam}
            onRemovePlayer={isCreator ? handleRemovePlayer : undefined}
          />
        </ThemedView>

        {/* Formulario de calificación (si el partido ya pasó) */}
        {isMatchPast && isPlayer && (
          <ThemedView
            style={styles.ratingCard}
            variant="card"
            rounded
            shadow="s"
          >
            <View style={styles.ratingHeader}>
              <ThemedText type="subtitle">Calificar jugadores</ThemedText>
              <Button
                title={showRatingForm ? "Ocultar" : "Calificar"}
                size="small"
                variant="ghost"
                onPress={() => setShowRatingForm(!showRatingForm)}
              />
            </View>

            {showRatingForm && (
              <RatingForm matchId={match.id} players={match.players} />
            )}
          </ThemedView>
        )}

        {/* Botones de acción para el creador */}
        {isCreator && !isMatchPast && match.status !== "cancelled" && (
          <View style={styles.creatorActions}>
            <Button
              title="Editar Partido"
              size="medium"
              variant="outlined"
              style={styles.editButton}
              onPress={() => router.push(`/match/edit/${match.id}` as any)}
            />

            <Button
              title="Cancelar Partido"
              size="medium"
              variant="outlined"
              color="danger"
              style={styles.cancelButton}
              onPress={handleCancelMatch}
            />
          </View>
        )}
      </ScrollView>

      {/* Botones de acción fijos en la parte inferior (si no es el creador) */}
      {!isCreator && !isMatchPast && match.status !== "cancelled" && (
        <SafeAreaView edges={["bottom"]} style={styles.bottomContainer}>
          <ThemedView style={styles.actionBar} variant="card" shadow="m">
            {isPlayer ? (
              <Button
                title="Abandonar Partido"
                size="medium"
                variant="outlined"
                color="danger"
                fullWidth
                onPress={handleLeave}
              />
            ) : (
              <Button
                title="Unirme al Partido"
                size="medium"
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
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.l,
    paddingBottom: 100, // Extra espacio para botones fijos
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.l,
  },
  dateTimeContainer: {
    flex: 1,
  },
  matchType: {
    marginBottom: Spacing.xs,
  },
  dateTime: {
    color: Colors.light.primary,
  },
  cancelledBadge: {
    backgroundColor: "#F4433620",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
  },
  cancelledText: {
    color: "#F44336",
    fontWeight: "600",
  },
  locationCard: {
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  fieldName: {
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
  },
  address: {
    marginBottom: Spacing.m,
  },
  mapContainer: {
    height: 150,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapButton: {
    alignSelf: "flex-end",
    marginTop: Spacing.xs,
  },
  infoCard: {
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.s,
  },
  price: {
    color: Colors.light.primary,
  },
  descriptionContainer: {
    marginTop: Spacing.m,
  },
  description: {
    marginTop: Spacing.xs,
  },
  uniformsContainer: {
    marginTop: Spacing.m,
  },
  uniformsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.s,
  },
  uniformBox: {
    width: "48%",
    padding: Spacing.s,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  playersCard: {
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  ratingCard: {
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    borderTopColor: "#E0E0E0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  loadingText: {
    marginTop: Spacing.m,
    textAlign: "center",
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
