// app\(tabs)\index.tsx

import React from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Spacing, Shape } from "@/constants/Colors";

// Mock data para la pantalla de inicio
const upcomingMatches = [
  {
    id: "1",
    date: "2025-04-12T18:00:00",
    location: "Cancha El Campín",
    spotsLeft: 3,
    type: "5v5",
  },
  {
    id: "2",
    date: "2025-04-15T20:00:00",
    location: "Cancha La Bombonera",
    spotsLeft: 1,
    type: "7v7",
  },
];

const nearbyFields = [
  {
    id: "1",
    name: "El Campín",
    distance: "1.5 km",
    rating: 4.7,
    price: "$60.000",
  },
  {
    id: "2",
    name: "La Bombonera",
    distance: "2.3 km",
    rating: 4.5,
    price: "$55.000",
  },
];

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <ThemedText type="title">GoFutbol</ThemedText>
            <ThemedText type="body" secondary>
              Bienvenido de vuelta
            </ThemedText>
          </View>

          {/* Sección de acciones rápidas */}
          <View style={styles.actionsSection}>
            <View style={styles.actionsRow}>
              <Card style={styles.actionCard} onPress={() => {}} shadow="s">
                <IconSymbol name="soccer.ball" size={24} color="#1DB954" />
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.actionText}
                >
                  Nuevo Partido
                </ThemedText>
              </Card>

              <Card style={styles.actionCard} onPress={() => {}} shadow="s">
                <IconSymbol name="paperplane.fill" size={24} color="#1DB954" />
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.actionText}
                >
                  Buscar Canchas
                </ThemedText>
              </Card>

              <Card style={styles.actionCard} onPress={() => {}} shadow="s">
                <IconSymbol name="person.fill" size={24} color="#1DB954" />
                <ThemedText
                  type="body"
                  weight="semiBold"
                  style={styles.actionText}
                >
                  Invitar Amigos
                </ThemedText>
              </Card>
            </View>
          </View>

          {/* Próximos partidos */}
          <View style={styles.upcomingSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subheading">Próximos Partidos</ThemedText>
              <Button title="Ver todos" variant="ghost" size="small" />
            </View>

            {upcomingMatches.map((match) => {
              const matchDate = new Date(match.date);
              const formattedDate = matchDate.toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const formattedTime = matchDate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card
                  key={match.id}
                  style={styles.matchCard}
                  onPress={() => {}}
                >
                  <View style={styles.matchCardContent}>
                    <View style={styles.matchInfo}>
                      <ThemedText type="body" weight="semiBold">
                        {formattedDate} • {formattedTime}
                      </ThemedText>
                      <ThemedText type="body" secondary>
                        {match.location}
                      </ThemedText>
                      <View style={styles.matchDetail}>
                        <ThemedView style={styles.typeBadge}>
                          <ThemedText style={styles.typeText}>
                            {match.type}
                          </ThemedText>
                        </ThemedView>
                        <ThemedText
                          type="caption"
                          secondary
                          style={styles.spotsText}
                        >
                          {match.spotsLeft} cupos disponibles
                        </ThemedText>
                      </View>
                    </View>
                    <Button title="Unirse" size="small" color="primary" />
                  </View>
                </Card>
              );
            })}
          </View>

          {/* Canchas cercanas */}
          <View style={styles.fieldsSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subheading">Canchas Cercanas</ThemedText>
              <Button title="Ver mapa" variant="ghost" size="small" />
            </View>

            {nearbyFields.map((field) => (
              <Card key={field.id} style={styles.fieldCard} onPress={() => {}}>
                <View style={styles.fieldCardContent}>
                  <View style={styles.fieldInfo}>
                    <ThemedText type="body" weight="semiBold">
                      {field.name}
                    </ThemedText>
                    <ThemedText type="body" secondary>
                      {field.distance} • {field.rating} ⭐
                    </ThemedText>
                    <ThemedText
                      type="body"
                      weight="semiBold"
                      style={styles.priceText}
                    >
                      {field.price}
                    </ThemedText>
                  </View>
                  <Button title="Reservar" size="small" color="primary" />
                </View>
              </Card>
            ))}
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

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
  actionsSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "31%",
    alignItems: "center",
    padding: Spacing.m,
  },
  actionText: {
    marginTop: Spacing.xs,
    textAlign: "center",
    fontSize: 12,
  },
  upcomingSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  matchCard: {
    marginBottom: Spacing.m,
  },
  matchCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchInfo: {
    flex: 1,
  },
  matchDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  typeBadge: {
    backgroundColor: "#1DB95420",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Shape.radius.s,
  },
  typeText: {
    color: "#1DB954",
    fontWeight: "600",
    fontSize: 12,
  },
  spotsText: {
    marginLeft: Spacing.s,
  },
  fieldsSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.xl,
  },
  fieldCard: {
    marginBottom: Spacing.m,
  },
  fieldCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldInfo: {
    flex: 1,
  },
  priceText: {
    marginTop: Spacing.xs,
    color: "#1DB954",
  },
});
