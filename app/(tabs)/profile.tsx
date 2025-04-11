// app/(tabs)/profile.tsx

import React from "react";
import { StyleSheet, ScrollView, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Shape, Spacing } from "@/constants/Colors";
import { Button } from "@/components/ui/Button";

// Datos de ejemplo para la pantalla
const mockUserData = {
  name: "Juan Pérez",
  position: "Delantero",
  totalMatches: 24,
  attendanceRate: 0.92,
  punctualityAvg: 4.7,
  attitudeAvg: 4.8,
  mvpVotes: 5,
  avatar: null, // Se usaría la ruta a una imagen de perfil
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m,
  },
  profileSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  profileCard: {
    padding: Spacing.m,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: Spacing.m,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  matchesBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: Shape.radius.s,
    alignSelf: "flex-start",
    marginTop: Spacing.s,
  },
  matchesText: {
    color: "white",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
  },
  statsSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
  },
  themeSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  accountSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  footer: {
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xl,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SafeAreaView edges={["top"]}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Mi Perfil</ThemedText>
          </ThemedView>

          {/* Información del perfil del usuario */}
          <View style={styles.profileSection}>
            <Card style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {mockUserData.avatar ? (
                    <Image
                      source={{ uri: mockUserData.avatar }}
                      style={styles.avatar}
                    />
                  ) : (
                    <ThemedView
                      style={styles.avatarPlaceholder}
                      variant="secondary"
                      rounded
                    >
                      <ThemedText style={styles.avatarText}>
                        {mockUserData.name.substring(0, 1).toUpperCase()}
                      </ThemedText>
                    </ThemedView>
                  )}
                </View>

                <View style={styles.profileInfo}>
                  <ThemedText type="heading">{mockUserData.name}</ThemedText>
                  <ThemedText type="body" secondary>
                    {mockUserData.position}
                  </ThemedText>
                  <View style={styles.matchesBadge}>
                    <IconSymbol name="soccer.ball" size={16} color="white" />
                    <ThemedText style={styles.matchesText}>
                      {mockUserData.totalMatches} partidos
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Estadísticas del jugador */}
          <View style={styles.statsSection}>
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Estadísticas
            </ThemedText>
            <Card>
              <View style={styles.statRow}>
                <ThemedText type="body">Asistencia</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {Math.round(mockUserData.attendanceRate * 100)}%
                </ThemedText>
              </View>
              <View style={styles.divider} />

              <View style={styles.statRow}>
                <ThemedText type="body">Puntualidad</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {mockUserData.punctualityAvg.toFixed(1)}/5
                </ThemedText>
              </View>
              <View style={styles.divider} />

              <View style={styles.statRow}>
                <ThemedText type="body">Actitud</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {mockUserData.attitudeAvg.toFixed(1)}/5
                </ThemedText>
              </View>
              <View style={styles.divider} />

              <View style={styles.statRow}>
                <ThemedText type="body">Votos MVP</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {mockUserData.mvpVotes}
                </ThemedText>
              </View>
            </Card>
          </View>

          {/* Selector de tema */}
          <View style={styles.themeSection}>
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Preferencias
            </ThemedText>
            <ThemeSelector />
          </View>

          {/* Acciones de la cuenta */}
          <View style={styles.accountSection}>
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Cuenta
            </ThemedText>
            <Card>
              <Button
                title="Editar perfil"
                variant="ghost"
                leftIcon="person.fill"
                fullWidth
              />
              <View style={styles.divider} />
              <Button
                title="Cerrar sesión"
                variant="ghost"
                color="danger"
                fullWidth
              />
            </Card>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.versionText} secondary>
              GoFutbol v1.0.0
            </ThemedText>
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}
