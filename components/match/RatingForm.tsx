// components/match/RatingForm.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { PlayerEntry } from "@/store/matchStore";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useRatings } from "@/hooks/useRatings";
import { useNotification } from "@/context/NotificationContext";
import { useColorScheme } from "@/hooks/useColorScheme";

interface RatingFormProps {
  matchId: string;
  players: PlayerEntry[];
}

export function RatingForm({ matchId, players }: RatingFormProps) {
  const { user } = useAuth();
  const { ratePlayer, isLoading, error, getMatchRatings } = useRatings();
  const { showNotification } = useNotification();
  const colorScheme = useColorScheme();

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerEntry | null>(
    null
  );
  const [attendance, setAttendance] = useState(true);
  const [punctuality, setPunctuality] = useState(5);
  const [attitude, setAttitude] = useState(5);
  const [isMVP, setIsMVP] = useState(false);
  const [comment, setComment] = useState("");
  const [ratedPlayers, setRatedPlayers] = useState<string[]>([]);

  // Cargar jugadores ya calificados
  useEffect(() => {
    const loadRatings = async () => {
      try {
        const ratings = await getMatchRatings(matchId);
        const ratedPlayerIds = ratings
          .filter((rating) => rating.ratedByUserId === user?.uid)
          .map((rating) => rating.ratedUserId);

        setRatedPlayers(ratedPlayerIds);
      } catch (error) {
        console.error("Error al cargar calificaciones:", error);
      }
    };

    if (user) {
      loadRatings();
    }
  }, [matchId, user]);

  // Filtrar jugadores que se pueden calificar (solo confirmados que no sea uno mismo)
  const playersToRate = players.filter(
    (player) =>
      player.status === "confirmed" &&
      player.userId !== user?.uid &&
      !ratedPlayers.includes(player.userId)
  );

  // Reiniciar formulario al seleccionar otro jugador
  useEffect(() => {
    setAttendance(true);
    setPunctuality(5);
    setAttitude(5);
    setIsMVP(false);
    setComment("");
  }, [selectedPlayer]);

  // Manejar calificación
  const handleSubmitRating = async () => {
    if (!selectedPlayer || !user) return;

    try {
      await ratePlayer(matchId, selectedPlayer.userId, {
        attendance,
        punctuality,
        attitude,
        isMVP,
        comment,
      });

      showNotification("Jugador calificado correctamente", "success");

      // Actualizar lista de jugadores calificados
      setRatedPlayers([...ratedPlayers, selectedPlayer.userId]);
      setSelectedPlayer(null);
    } catch (error) {
      console.error("Error al calificar:", error);
      showNotification(
        `Error al calificar: ${(error as Error).message}`,
        "error"
      );
    }
  };

  // Renderizar estrellas para puntuar
  const renderStars = (
    value: number,
    onChange: (newValue: number) => void,
    disabled: boolean = false
  ) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => !disabled && onChange(star)}
            disabled={disabled}
          >
            <ThemedText
              style={[
                styles.star,
                star <= value ? styles.starActive : styles.starInactive,
                disabled && styles.starDisabled,
              ]}
            >
              ★
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Si no hay jugadores para calificar
  if (playersToRate.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer} variant="secondary" rounded="m">
        <ThemedText type="body" secondary style={styles.emptyText}>
          Ya has calificado a todos los jugadores de este partido o no hay
          jugadores para calificar.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Selector de jugador */}
      <ThemedText type="body" weight="semiBold" style={styles.sectionTitle}>
        Selecciona un jugador para calificar:
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playersList}
      >
        {playersToRate.map((player) => {
          const profileImage = player.photoURL
            ? { uri: player.photoURL }
            : require("@/assets/images/default-avatar.png");

          return (
            <TouchableOpacity
              key={player.userId}
              style={[
                styles.playerItem,
                selectedPlayer?.userId === player.userId &&
                  styles.selectedPlayer,
                selectedPlayer?.userId === player.userId && {
                  borderColor: Colors[colorScheme].primary,
                  backgroundColor: Colors[colorScheme].primary + "10",
                },
              ]}
              onPress={() => setSelectedPlayer(player)}
            >
              <Image
                source={profileImage}
                style={styles.playerAvatar}
                contentFit="cover"
              />
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={styles.playerName}
              >
                {player.displayName}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Formulario de calificación */}
      {selectedPlayer ? (
        <ThemedView
          style={styles.formContainer}
          variant="secondary"
          rounded="m"
        >
          <ThemedText type="body" weight="semiBold" style={styles.playerTitle}>
            Calificando a {selectedPlayer.displayName}
          </ThemedText>

          {/* Asistencia */}
          <View style={styles.ratingItem}>
            <ThemedText type="body">¿Asistió al partido?</ThemedText>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleYes,
                  attendance && styles.toggleActive,
                  attendance && {
                    backgroundColor: Colors[colorScheme].success,
                  },
                ]}
                onPress={() => setAttendance(true)}
              >
                <ThemedText
                  type="body"
                  style={attendance ? styles.toggleActiveText : null}
                >
                  Sí
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleNo,
                  !attendance && styles.toggleActive,
                  !attendance && {
                    backgroundColor: Colors[colorScheme].danger,
                  },
                ]}
                onPress={() => setAttendance(false)}
              >
                <ThemedText
                  type="body"
                  style={!attendance ? styles.toggleActiveText : null}
                >
                  No
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Solo mostrar las siguientes opciones si asistió */}
          {attendance && (
            <>
              {/* Puntualidad */}
              <View style={styles.ratingItem}>
                <ThemedText type="body">Puntualidad:</ThemedText>
                {renderStars(punctuality, setPunctuality)}
              </View>

              {/* Actitud */}
              <View style={styles.ratingItem}>
                <ThemedText type="body">Actitud:</ThemedText>
                {renderStars(attitude, setAttitude)}
              </View>

              {/* MVP */}
              <View style={styles.ratingItem}>
                <ThemedText type="body">¿Fue el MVP del partido?</ThemedText>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      styles.toggleYes,
                      isMVP && styles.toggleActive,
                      isMVP && { backgroundColor: Colors[colorScheme].primary },
                    ]}
                    onPress={() => setIsMVP(true)}
                  >
                    <ThemedText
                      type="body"
                      style={isMVP ? styles.toggleActiveText : null}
                    >
                      Sí
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      styles.toggleNo,
                      !isMVP && styles.toggleActive,
                    ]}
                    onPress={() => setIsMVP(false)}
                  >
                    <ThemedText
                      type="body"
                      style={!isMVP ? styles.toggleActiveText : null}
                    >
                      No
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Botón de enviar */}
          <Button
            title={isLoading ? "Enviando..." : "Enviar Calificación"}
            size="medium"
            onPress={handleSubmitRating}
            disabled={isLoading}
            style={styles.submitButton}
          />

          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Colors[colorScheme].primary}
              style={styles.loader}
            />
          )}

          {error && (
            <ThemedText type="caption" style={styles.errorText}>
              {error}
            </ThemedText>
          )}
        </ThemedView>
      ) : (
        <ThemedView
          style={styles.noPlayerContainer}
          variant="secondary"
          rounded="m"
        >
          <ThemedText type="body" secondary>
            Selecciona un jugador para calificarlo
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.m,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  playersList: {
    paddingVertical: Spacing.s,
    gap: Spacing.s,
  },
  playerItem: {
    alignItems: "center",
    width: 70,
    marginRight: Spacing.s,
    paddingVertical: Spacing.s,
    borderRadius: Shape.radius.m,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPlayer: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + "10",
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: Spacing.xs,
  },
  playerName: {
    textAlign: "center",
    width: "100%",
    paddingHorizontal: Spacing.xs,
  },
  formContainer: {
    marginTop: Spacing.m,
    padding: Spacing.m,
  },
  playerTitle: {
    marginBottom: Spacing.m,
  },
  ratingItem: {
    marginBottom: Spacing.m,
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: Spacing.xs,
  },
  star: {
    fontSize: Typography.fontSizes.xxl,
    marginRight: Spacing.xs,
  },
  starActive: {
    color: "#FFD700", // Gold
  },
  starInactive: {
    color: Colors.light.borderLight,
  },
  starDisabled: {
    opacity: 0.5,
  },
  toggleContainer: {
    flexDirection: "row",
    marginTop: Spacing.xs,
  },
  toggleButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  toggleYes: {
    borderTopLeftRadius: Shape.radius.s,
    borderBottomLeftRadius: Shape.radius.s,
  },
  toggleNo: {
    borderTopRightRadius: Shape.radius.s,
    borderBottomRightRadius: Shape.radius.s,
  },
  toggleActive: {
    borderColor: "transparent",
  },
  toggleActiveText: {
    color: "white",
    fontWeight: Typography.fontWeights.semiBold,
  },
  submitButton: {
    marginTop: Spacing.m,
  },
  loader: {
    marginTop: Spacing.s,
  },
  errorText: {
    color: Colors.light.danger,
    marginTop: Spacing.s,
    textAlign: "center",
  },
  noPlayerContainer: {
    marginTop: Spacing.m,
    padding: Spacing.m,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  emptyContainer: {
    marginTop: Spacing.m,
    padding: Spacing.m,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
  },
});
