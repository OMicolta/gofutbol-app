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
import { useHistoricalMatches } from "@/hooks/useHistoricalMatches";
import { useAuth } from "@/hooks/useAuth";
import { Match, PlayerEntry, TeamType } from "@/store/matchStore";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";
import { InvitePlayersModal } from "@/components/match/InvitePlayersModal";
import { InvitedPlayersList } from "@/components/match/InvitedPlayersList";

export default function MatchDetailScreen() {
  const { id, isHistorical } = useLocalSearchParams<{
    id: string;
    isHistorical?: string;
  }>();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const {
    getMatchDetails,
    joinMatch,
    leaveMatch,
    changeTeam,
    removePlayer,
    cancelMatch,
    isLoading: isCurrentLoading,
    error: currentError,
  } = useMatches();

  const {
    getHistoricalMatchById,
    isLoading: isHistoricalLoading,
    error: historicalError,
  } = useHistoricalMatches();

  const { showNotification } = useNotification();

  const [match, setMatch] = useState<Match | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // "details" o "players"

  // Determinar si se está viendo un partido histórico
  const isHistoricalMatch = isHistorical === "true";

  // Estado combinado para carga y errores
  const isLoading = isCurrentLoading || isHistoricalLoading;
  const error = currentError || historicalError;

  //Añadir estado para controlar el modal de invitaciones
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Obtener la lista de jugadores invitados y confirmados cuando se carga el partido
  const [invitedPlayers, setInvitedPlayers] = useState<PlayerEntry[]>([]);
  const [confirmedPlayersIds, setConfirmedPlayersIds] = useState<string[]>([]);

  useEffect(() => {
    const loadMatch = async () => {
      if (id) {
        if (isHistoricalMatch) {
          // Cargar partido histórico
          const matchData = await getHistoricalMatchById(id);
          setMatch(matchData);
        } else {
          // Cargar partido actual
          const matchData = await getMatchDetails(id);
          setMatch(matchData);
        }
      }
    };

    loadMatch();
  }, [id, isHistoricalMatch]);

  // Al cargar los datos del partido, actualizar las listas de jugadores
  useEffect(() => {
    if (match) {
      // Filtrar jugadores invitados
      const invited = match.players.filter(
        (player) => player.status === "invited"
      );
      setInvitedPlayers(invited);

      // Obtener IDs de jugadores confirmados y el creador para filtrar en la búsqueda
      const confirmedIds = match.players
        .filter((player) => player.status === "confirmed")
        .map((player) => player.userId);

      setConfirmedPlayersIds(confirmedIds);
    }
  }, [match]);

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
    ? new Date(match.date.toDate()) < new Date() || isHistoricalMatch
    : false;

  // Manejar unirse al partido
  const handleJoin = async () => {
    try {
      if (!match || isHistoricalMatch) return;
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
      if (!match || isHistoricalMatch) return;

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
      if (!match || !user || isHistoricalMatch) return;

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
      if (!match || !user || match.createdBy !== user.uid || isHistoricalMatch)
        return;

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
              try {
                await removePlayer(match.id, playerId);
                showNotification("Jugador removido correctamente", "success");

                // Actualizar datos del partido
                const updatedMatch = await getMatchDetails(match.id);
                setMatch(updatedMatch);
              } catch (error) {
                console.error("Error al remover jugador:", error);
                showNotification(
                  `Error al remover jugador: ${(error as Error).message}`,
                  "error"
                );
              }
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
    if (!match || !user || match.createdBy !== user.uid || isHistoricalMatch)
      return;

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
            try {
              await cancelMatch(match.id);
              showNotification("Partido cancelado correctamente", "success");

              // Redirigir a la pantalla de partidos
              router.replace("/(tabs)/matches");
            } catch (error) {
              console.error("Error al cancelar partido:", error);
              showNotification(
                `Error al cancelar partido: ${(error as Error).message}`,
                "error"
              );
            }
          },
        },
      ]
    );
  };

  // función para actualizar después de enviar invitaciones
  const handleInvitationsSent = async () => {
    // Recargar datos del partido para mostrar los nuevos invitados
    if (id) {
      const updatedMatch = await getMatchDetails(id);
      setMatch(updatedMatch);
    }
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
      {/* Header con botón de volver y título */}
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.header,
          {
            backgroundColor: Colors[colorScheme].backgroundSecondary,
            borderBottomColor: Colors[colorScheme].border,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              name="arrow.left"
              size={24}
              color={Colors[colorScheme].text}
            />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Partido {match.type}
          </ThemedText>
          <View style={styles.headerRightPlaceholder} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sección de fecha y hora */}
        <View
          style={[
            styles.dateContainer,
            {
              backgroundColor:
                colorScheme === "dark" ? "rgba(0, 200, 83, 0.15)" : "#E8F5E9",
            },
          ]}
        >
          <IconSymbol
            name="calendar"
            size={20}
            color="#00C853"
            style={styles.dateIcon}
          />
          <ThemedText style={styles.dateText} weight="semiBold">
            {formattedDate} - {formattedTime}
          </ThemedText>
        </View>

        {/* Sección de ubicación */}
        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <IconSymbol
              name="location.fill"
              size={20}
              color="#00C853"
              style={styles.locationIcon}
            />
            <ThemedText style={styles.locationTitle} weight="semiBold">
              Ubicación
            </ThemedText>
          </View>

          {match.fieldName && (
            <ThemedText weight="semiBold" style={styles.fieldName}>
              {match.fieldName}
            </ThemedText>
          )}

          {match.address && (
            <ThemedText
              style={[
                styles.addressText,
                { color: Colors[colorScheme].textSecondary },
              ]}
            >
              {match.address}
            </ThemedText>
          )}

          {match.location?.latitude && match.location?.longitude && (
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
              <Image
                source={{
                  uri: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Google_Maps_icon.svg",
                }}
                style={styles.googleLogo}
              />
            </View>
          )}
        </View>

        {/* Tabs de navegación */}
        <View
          style={[
            styles.tabContainer,
            {
              borderColor: Colors[colorScheme].border,
              backgroundColor: Colors[colorScheme].backgroundSecondary,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "details" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("details")}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: Colors[colorScheme].textSecondary },
                activeTab === "details" && styles.activeTabText,
              ]}
              weight={activeTab === "details" ? "semiBold" : "regular"}
            >
              Detalles
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "players" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("players")}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: Colors[colorScheme].textSecondary },
                activeTab === "players" && styles.activeTabText,
              ]}
              weight={activeTab === "players" ? "semiBold" : "regular"}
            >
              Jugadores
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Contenido según la tab activa */}
        {activeTab === "details" ? (
          <View style={styles.tabContent}>
            <View style={styles.detailsSection}>
              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: Colors[colorScheme].border },
                ]}
              >
                <ThemedText
                  style={[
                    styles.detailLabel,
                    { color: Colors[colorScheme].textSecondary },
                  ]}
                >
                  Organizador:
                </ThemedText>
                <ThemedText weight="semiBold">{match.creatorName}</ThemedText>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: Colors[colorScheme].border },
                ]}
              >
                <ThemedText
                  style={[
                    styles.detailLabel,
                    { color: Colors[colorScheme].textSecondary },
                  ]}
                >
                  Nivel:
                </ThemedText>
                <ThemedText>
                  {match.level === "beginner"
                    ? "Principiante"
                    : match.level === "intermediate"
                    ? "Intermedio"
                    : match.level === "advanced"
                    ? "Avanzado"
                    : "Todos los niveles"}
                </ThemedText>
              </View>

              <View
                style={[
                  styles.detailRow,
                  { borderBottomColor: Colors[colorScheme].border },
                ]}
              >
                <ThemedText
                  style={[
                    styles.detailLabel,
                    { color: Colors[colorScheme].textSecondary },
                  ]}
                >
                  Jugadores:
                </ThemedText>
                <ThemedText weight="semiBold">
                  {confirmedPlayers}/{match.maxPlayers}
                </ThemedText>
              </View>

              {match.description && (
                <View
                  style={[
                    styles.descriptionSection,
                    { borderBottomColor: Colors[colorScheme].border },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.detailLabel,
                      { color: Colors[colorScheme].textSecondary },
                    ]}
                  >
                    Descripción:
                  </ThemedText>
                  <ThemedText>{match.description}</ThemedText>
                </View>
              )}

              <View style={styles.uniformsSection}>
                <ThemedText
                  style={[
                    styles.detailLabel,
                    { color: Colors[colorScheme].textSecondary },
                  ]}
                >
                  Colores de uniforme:
                </ThemedText>
                <View style={styles.uniformsRow}>
                  <View
                    style={[
                      styles.uniformBox,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? Colors.dark.card : "#F5F5F5",
                      },
                    ]}
                  >
                    <ThemedText weight="semiBold" style={styles.teamLabel}>
                      Equipo A
                    </ThemedText>
                    <ThemedText>
                      {match.uniformA || "No especificado"}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.uniformBox,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? Colors.dark.card : "#F5F5F5",
                      },
                    ]}
                  >
                    <ThemedText weight="semiBold" style={styles.teamLabel}>
                      Equipo B
                    </ThemedText>
                    <ThemedText>
                      {match.uniformB || "No especificado"}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.playersHeader}>
              <ThemedText style={styles.playersCount} weight="semiBold">
                Jugadores ({confirmedPlayers})
              </ThemedText>
              {isCreator && !isMatchPast && (
                <Button
                  title="+ Invitar Jugadores"
                  size="small"
                  variant="outlined"
                  onPress={() => setShowInviteModal(true)}
                  style={[
                    styles.inviteButton,
                    {
                      backgroundColor: Colors[colorScheme].backgroundSecondary,
                    },
                  ]}
                />
              )}
            </View>

            <PlayerList
              players={match.players}
              matchCreatorId={match.createdBy}
              isEditable={!isMatchPast && (isCreator || isPlayerConfirmed)}
              onChangeTeam={handleChangeTeam}
              onRemovePlayer={isCreator ? handleRemovePlayer : undefined}
            />

            {isCreator && invitedPlayers.length > 0 && (
              <View style={styles.invitedPlayersSection}>
                <ThemedText
                  weight="semiBold"
                  style={styles.invitedPlayersTitle}
                >
                  Invitaciones pendientes ({invitedPlayers.length})
                </ThemedText>
                <InvitedPlayersList players={invitedPlayers} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Botones de acción fijos en la parte inferior */}
      <SafeAreaView
        edges={["bottom"]}
        style={[
          styles.bottomContainer,
          {
            backgroundColor: Colors[colorScheme].backgroundSecondary,
            borderTopColor: Colors[colorScheme].border,
          },
        ]}
      >
        {isCreator && !isMatchPast ? (
          <View style={styles.creatorButtons}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(255, 59, 48, 0.15)"
                      : "#FFEBEE",
                },
              ]}
              onPress={handleCancelMatch}
            >
              <IconSymbol name="trash.fill" size={18} color="#FF3B30" />
              <ThemedText style={styles.cancelButtonText}>
                Cancelar Partido
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editButton,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(0, 200, 83, 0.15)"
                      : "#E8F5E9",
                },
              ]}
              onPress={() => router.push(`/match/edit/${match.id}` as any)}
            >
              <IconSymbol name="pencil" size={18} color="#00C853" />
              <ThemedText style={styles.editButtonText}>
                Editar Partido
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : !isCreator && !isMatchPast && match.status !== "cancelled" ? (
          isPlayerConfirmed ? (
            <TouchableOpacity
              style={[
                styles.leaveButton,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(255, 59, 48, 0.15)"
                      : "#FFEBEE",
                  borderWidth: 1,
                  borderColor: "#FF3B30",
                },
              ]}
              onPress={handleLeave}
            >
              <ThemedText style={styles.leaveButtonText}>
                Abandonar Partido
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
              <ThemedText style={styles.joinButtonText}>
                Unirme al Partido
              </ThemedText>
            </TouchableOpacity>
          )
        ) : null}
      </SafeAreaView>

      {/* Modal para invitar jugadores */}
      <InvitePlayersModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        matchId={match.id}
        existingPlayers={confirmedPlayersIds}
        onInvitationsSent={handleInvitationsSent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para botones fijos en la parte inferior
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    color: "#00C853", // Verde
    fontSize: 14,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationTitle: {
    fontSize: 16,
    color: "#00C853", // Verde
  },
  fieldName: {
    fontSize: 16,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  mapContainer: {
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  googleLogo: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
  },
  tabContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#00C853", // Verde
  },
  tabText: {
    fontSize: 14,
  },
  activeTabText: {
    color: "#00C853", // Verde
  },
  tabContent: {
    flex: 1,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {},
  descriptionSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  uniformsSection: {
    marginTop: 16,
  },
  uniformsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  uniformBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  teamLabel: {
    marginBottom: 4,
  },
  playersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  playersCount: {
    fontSize: 16,
  },
  inviteButton: {
    borderColor: "#00C853",
    borderWidth: 1,
  },
  invitedPlayersSection: {
    marginTop: 24,
  },
  invitedPlayersTitle: {
    marginBottom: 12,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
  },
  creatorButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF3B30", // Rojo
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#FF3B30", // Rojo
    marginLeft: 8,
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#00C853", // Verde
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 8,
  },
  editButtonText: {
    color: "#00C853", // Verde
    marginLeft: 8,
    fontWeight: "600",
  },
  joinButton: {
    backgroundColor: "#00C853", // Verde
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  leaveButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "#FF3B30", // Rojo
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorTitle: {
    marginBottom: 16,
  },
  errorText: {
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    minWidth: 120,
  },
});
