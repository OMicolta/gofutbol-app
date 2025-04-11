// app/(tabs)/explore.tsx

import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Spacing, Shape, Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Mock data para la pantalla de exploración
const fields = [
  {
    id: "1",
    name: "El Campín",
    address: "Calle 57 #13-93",
    zone: "Chapinero",
    rating: 4.7,
    price: "$60.000/h",
    type: "5v5, 7v7",
    distance: "1.5 km",
    facilities: ["⚽ Balones", "🅿️ Parqueadero", "🚿 Duchas"],
    available: true,
  },
  {
    id: "2",
    name: "La Bombonera",
    address: "Carrera 15 #82-30",
    zone: "Zona T",
    rating: 4.5,
    price: "$55.000/h",
    type: "5v5",
    distance: "2.3 km",
    facilities: ["🧢 Petos", "🅿️ Parqueadero"],
    available: true,
  },
  {
    id: "3",
    name: "La Cancha",
    address: "Av. Calle 26 #62-47",
    zone: "Salitre",
    rating: 4.8,
    price: "$70.000/h",
    type: "5v5, 7v7, 11v11",
    distance: "3.1 km",
    facilities: ["⚽ Balones", "🅿️ Parqueadero", "🚿 Duchas", "🥤 Cafetería"],
    available: false,
  },
  {
    id: "4",
    name: "Gol Center",
    address: "Calle 80 #72-35",
    zone: "Engativá",
    rating: 4.3,
    price: "$50.000/h",
    type: "5v5",
    distance: "5.2 km",
    facilities: ["⚽ Balones", "🧢 Petos"],
    available: true,
  },
];

const filters = [
  { id: "closest", name: "Más cercanas" },
  { id: "5v5", name: "5 vs 5" },
  { id: "7v7", name: "7 vs 7" },
  { id: "11v11", name: "11 vs 11" },
  { id: "available", name: "Disponibles ahora" },
  { id: "parking", name: "Con parqueadero" },
  { id: "showers", name: "Con duchas" },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["closest"]);
  const [searchText, setSearchText] = useState("");

  const toggleFilter = (filterId: string) => {
    if (selectedFilters.includes(filterId)) {
      setSelectedFilters(selectedFilters.filter((id) => id !== filterId));
    } else {
      setSelectedFilters([...selectedFilters, filterId]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">Explorar</ThemedText>
          <ThemedText type="body" secondary>
            Encuentra las mejores canchas
          </ThemedText>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <ThemedView style={styles.searchBar} variant="secondary" rounded>
            <IconSymbol
              name="paperplane.fill"
              size={20}
              color={Colors[colorScheme].textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: Colors[colorScheme].text }]}
              placeholder="Buscar canchas por nombre o zona..."
              placeholderTextColor={Colors[colorScheme].textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <Button
                title="✕"
                variant="ghost"
                size="small"
                onPress={() => setSearchText("")}
              />
            )}
          </ThemedView>
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {filters.map((filter) => (
              <ThemedView
                key={filter.id}
                style={[
                  styles.filterChip,
                  selectedFilters.includes(filter.id) &&
                    styles.selectedFilterChip,
                ]}
                variant={
                  selectedFilters.includes(filter.id) ? "default" : "secondary"
                }
                rounded
              >
                <Button
                  title={filter.name}
                  variant="ghost"
                  size="small"
                  color={
                    selectedFilters.includes(filter.id) ? "primary" : undefined
                  }
                  onPress={() => toggleFilter(filter.id)}
                />
              </ThemedView>
            ))}
          </ScrollView>
        </View>

        {/* Lista de canchas */}
        <FlatList
          data={fields}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.fieldsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.fieldCard} onPress={() => {}} shadow="m">
              <View style={styles.fieldHeader}>
                <View>
                  <ThemedText type="heading">{item.name}</ThemedText>
                  <ThemedText type="body" secondary>
                    {item.address}
                  </ThemedText>
                  <View style={styles.fieldMeta}>
                    <ThemedText type="caption" secondary>
                      {item.zone} • {item.distance}
                    </ThemedText>
                    <ThemedText type="caption" secondary>
                      ⭐ {item.rating}
                    </ThemedText>
                  </View>
                </View>
                {item.available ? (
                  <ThemedView style={styles.availableBadge} rounded="s">
                    <ThemedText style={styles.availableText}>
                      Disponible
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.unavailableBadge} rounded="s">
                    <ThemedText style={styles.unavailableText}>
                      No disponible
                    </ThemedText>
                  </ThemedView>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldDetails}>
                <View style={styles.detailColumn}>
                  <ThemedText type="caption" secondary>
                    Tipo
                  </ThemedText>
                  <ThemedText type="body">{item.type}</ThemedText>
                </View>
                <View style={styles.detailColumn}>
                  <ThemedText type="caption" secondary>
                    Precio
                  </ThemedText>
                  <ThemedText
                    type="body"
                    weight="semiBold"
                    style={styles.priceText}
                  >
                    {item.price}
                  </ThemedText>
                </View>
                <Button
                  title="Reservar"
                  size="small"
                  disabled={!item.available}
                />
              </View>

              <View style={styles.facilitiesContainer}>
                {item.facilities.map((facility, index) => (
                  <ThemedText
                    key={index}
                    type="caption"
                    secondary
                    style={styles.facilityItem}
                  >
                    {facility}
                  </ThemedText>
                ))}
              </View>
            </Card>
          )}
        />
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
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m,
  },
  searchContainer: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.m,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.s,
    fontSize: 16,
    height: 40,
  },
  filtersContainer: {
    marginBottom: Spacing.m,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.s,
  },
  filterChip: {
    borderRadius: Shape.radius.round,
  },
  selectedFilterChip: {
    backgroundColor: "#1DB95420",
  },
  fieldsList: {
    paddingHorizontal: Spacing.l,
    paddingBottom: 120, // Extra padding at bottom for tab bar
  },
  fieldCard: {
    marginBottom: Spacing.l,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  fieldMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  availableBadge: {
    backgroundColor: "#1DB95420",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  availableText: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: "600",
  },
  unavailableBadge: {
    backgroundColor: "#F4433620",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  unavailableText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: Spacing.m,
  },
  fieldDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailColumn: {
    flex: 1,
  },
  priceText: {
    color: "#1DB954",
  },
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.m,
    gap: Spacing.s,
  },
  facilityItem: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: "#F5F5F5",
    borderRadius: Shape.radius.s,
  },
});
