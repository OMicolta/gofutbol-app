// components/match/InvitationsList.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { useInvitations } from "@/hooks/useInvitations";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Match } from "@/store/matchStore";

interface InvitationsListProps {
  invitations: Match[]; // Partidos a los que el usuario ha sido invitado
  onUpdate?: () => void;
  compact?: boolean; // Versión compacta para mostrar en el dashboard
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function InvitationsList({
  invitations,
  onUpdate,
  compact = false,
  refreshing = false,
  onRefresh,
}: InvitationsListProps) {
  const colorScheme = useColorScheme();
  const { acceptInvitation, declineInvitation } = useInvitations();
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // Si no hay invitaciones, mostrar mensaje
  if (invitations.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer} variant="secondary" rounded>
        <ThemedText type="body" secondary style={styles.emptyText}>
          No tienes invitaciones pendientes
        </ThemedText>
      </ThemedView>
    );
  }

  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Formatear hora para mostrar
  const formatTime = (date: Date, timeStr?: string) => {
    if (timeStr) return timeStr;

    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Manejar aceptar invitación
  const handleAccept = async (matchId: string) => {
    setProcessingIds((prev) => [...prev, matchId]);
    try {
      const success = await acceptInvitation(matchId);
      if (success && onUpdate) {
        onUpdate();
      }
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== matchId));
    }
  };

  // Manejar rechazar invitación
  const handleDecline = async (matchId: string) => {
    setProcessingIds((prev) => [...prev, matchId]);
    try {
      const success = await declineInvitation(matchId);
      if (success && onUpdate) {
        onUpdate();
      }
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== matchId));
    }
  };

  // Navegar a los detalles del partido
  const handleViewMatch = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  // Navegar a la pantalla de invitaciones
  const handleViewAllInvitations = () => {
    router.push("/invitations" as any);
  };

  // Renderizar un elemento de invitación
  const renderInvitationItem = ({ item }: { item: Match }) => {
    const matchDate = item.date.toDate();
    const isProcessing = processingIds.includes(item.id);

    // Versión compacta para el dashboard
    if (compact) {
      return (
        <ThemedView
          style={styles.compactCard}
          variant="card"
          rounded
          shadow="s"
        >
          <View style={styles.compactHeader}>
            <View>
              <ThemedText type="body" weight="semiBold">
                {formatDate(matchDate)} • {formatTime(matchDate, item.time)}
              </ThemedText>
              <ThemedText type="caption" secondary numberOfLines={1}>
                {item.fieldName || "Ubicación por definir"}
              </ThemedText>
            </View>
            <ThemedView
              style={styles.typeBadge}
              variant="secondary"
              rounded="s"
            >
              <ThemedText style={styles.typeText}>{item.type}</ThemedText>
            </ThemedView>
          </View>

          <View style={styles.compactActions}>
            <Button
              title="Ver"
              size="small"
              variant="ghost"
              onPress={() => handleViewMatch(item.id)}
              disabled={isProcessing}
            />
            <View style={styles.responseButtons}>
              <Button
                title="✗"
                size="small"
                variant="outlined"
                color="danger"
                onPress={() => handleDecline(item.id)}
                disabled={isProcessing}
                style={styles.compactButton}
              />
              <Button
                title="✓"
                size="small"
                variant="filled"
                onPress={() => handleAccept(item.id)}
                disabled={isProcessing}
                style={styles.compactButton}
              />
            </View>
          </View>

          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={Colors[colorScheme].primary} />
            </View>
          )}
        </ThemedView>
      );
    }

    // Versión completa para la pantalla de invitaciones
    return (
      <ThemedView
        style={styles.invitationCard}
        variant="card"
        rounded
        shadow="s"
      >
        <View style={styles.invitationHeader}>
          <ThemedText type="body" weight="semiBold">
            {formatDate(matchDate)} • {formatTime(matchDate, item.time)}
          </ThemedText>

          <ThemedView style={styles.typeBadge} variant="secondary" rounded="s">
            <ThemedText style={styles.typeText}>{item.type}</ThemedText>
          </ThemedView>
        </View>

        <ThemedText type="body" style={styles.locationText}>
          {item.fieldName || "Ubicación por definir"}
        </ThemedText>

        <ThemedText type="caption" secondary>
          Organizado por: {item.creatorName}
        </ThemedText>

        <View style={styles.actionsContainer}>
          <Button
            title="Ver detalles"
            size="small"
            variant="ghost"
            onPress={() => handleViewMatch(item.id)}
            disabled={isProcessing}
          />

          <View style={styles.responseButtons}>
            <Button
              title="Rechazar"
              size="small"
              variant="outlined"
              color="danger"
              onPress={() => handleDecline(item.id)}
              disabled={isProcessing}
              style={styles.responseButton}
            />

            <Button
              title="Aceptar"
              size="small"
              variant="filled"
              onPress={() => handleAccept(item.id)}
              disabled={isProcessing}
              style={styles.responseButton}
            />
          </View>
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors[colorScheme].primary} />
          </View>
        )}
      </ThemedView>
    );
  };

  // Si es compacto, mostrar solo los primeros 2 y un botón "Ver todo"
  if (compact) {
    const displayInvitations = invitations.slice(0, 2);

    return (
      <View style={styles.compactContainer}>
        <FlatList
          data={displayInvitations}
          keyExtractor={(item) => item.id}
          renderItem={renderInvitationItem}
          scrollEnabled={false}
        />

        {invitations.length > 2 && (
          <Button
            title={`Ver todas (${invitations.length})`}
            variant="ghost"
            size="small"
            onPress={handleViewAllInvitations}
            style={styles.viewAllButton}
          />
        )}
      </View>
    );
  }

  // Versión completa con soporte para refresh
  return (
    <FlatList
      data={invitations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      renderItem={renderInvitationItem}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: Spacing.l,
  },
  emptyContainer: {
    padding: Spacing.m,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.m,
  },
  emptyText: {
    textAlign: "center",
  },
  invitationCard: {
    marginBottom: Spacing.m,
    padding: Spacing.m,
  },
  invitationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.light.primary + "20",
  },
  typeText: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  locationText: {
    marginVertical: Spacing.xs,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.m,
  },
  responseButtons: {
    flexDirection: "row",
  },
  responseButton: {
    marginLeft: Spacing.xs,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  // Estilos para la versión compacta
  compactContainer: {
    marginBottom: Spacing.m,
  },
  compactCard: {
    marginBottom: Spacing.s,
    padding: Spacing.m,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.s,
  },
  compactActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactButton: {
    width: 40,
    marginLeft: Spacing.xs,
  },
  viewAllButton: {
    alignSelf: "center",
    marginTop: Spacing.xs,
  },
});
