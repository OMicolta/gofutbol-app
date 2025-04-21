// app/invitations/index.tsx
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { InvitationsList } from "@/components/match/InvitationsList";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function InvitationsScreen() {
  const colorScheme = useColorScheme();
  const { user, requireAuth } = useAuth();
  const { pendingInvitations, loadPendingInvitations, isLoading, error } =
    useInvitations();

  const [refreshing, setRefreshing] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    requireAuth();
  }, []);

  // Manejar refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingInvitations();
    setRefreshing(false);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
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
          <ThemedText type="title">Invitaciones</ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Invitaciones pendientes
          </ThemedText>

          {isLoading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={Colors[colorScheme].primary}
              />
              <ThemedText style={styles.loadingText}>
                Cargando invitaciones...
              </ThemedText>
            </View>
          ) : error ? (
            <ThemedView
              style={styles.errorContainer}
              variant="secondary"
              rounded
            >
              <ThemedText type="body" style={styles.errorText}>
                {error}
              </ThemedText>
              <Button
                title="Reintentar"
                size="small"
                onPress={loadPendingInvitations}
              />
            </ThemedView>
          ) : (
            <InvitationsList
              invitations={pendingInvitations}
              onUpdate={loadPendingInvitations}
            />
          )}

          {pendingInvitations.length > 0 && (
            <ThemedText type="caption" secondary style={styles.hintText}>
              Puedes ver los detalles de cada partido o responder directamente a
              las invitaciones. Cuando aceptes una invitación, serás añadido
              automáticamente al partido.
            </ThemedText>
          )}
        </ScrollView>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m,
    gap: Spacing.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  scrollContent: {
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  loadingContainer: {
    padding: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
    textAlign: "center",
  },
  errorContainer: {
    padding: Spacing.m,
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    marginBottom: Spacing.m,
  },
  hintText: {
    marginTop: Spacing.m,
    textAlign: "center",
    fontStyle: "italic",
  },
});
