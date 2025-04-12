// app/(tabs)/explore.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FieldCard } from "@/components/field/FieldCard";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useFields } from "@/hooks/useFields";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";

// Filtros para mostrar
const filterOptions = [
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
  const { user, isInitializing: authInitializing } = useAuth();
  const {
    fields,
    filteredFields,
    fetchFields,
    getUserLocation,
    setFilters,
    resetFilters,
    isLoading,
    error,
  } = useFields();
  const { showNotification } = useNotification();

  // Estados locales
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["closest"]);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // Cargar canchas cuando la autenticación esté lista
  useEffect(() => {
    if (!authInitializing && user) {
      loadData();
    }
  }, [authInitializing, user]);

  // Actualizar cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      // Solo intentar operaciones si hay usuario autenticado
      if (user && isLocationEnabled) {
        updateLocation();
      }
    }, [isLocationEnabled, user])
  );

  // Cargar datos iniciales
  const loadData = async () => {
    // Si no hay usuario, no intentamos cargar datos
    if (!user) {
      showNotification("Debes iniciar sesión para explorar canchas", "warning");
      return;
    }

    try {
      // Intentar obtener ubicación
      const location = await getUserLocation();
      setIsLocationEnabled(location !== null);

      // Cargar canchas
      await fetchFields(true);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showNotification("Error al cargar datos. Intenta de nuevo.", "error");
    }
  };

  // Actualizar ubicación del usuario
  const updateLocation = async () => {
    if (!user) return;

    try {
      await getUserLocation();
    } catch (error) {
      console.error("Error al actualizar ubicación:", error);
    }
  };

  // Manejar búsqueda
  const handleSearch = () => {
    if (!user) {
      showNotification("Debes iniciar sesión para buscar canchas", "warning");
      return;
    }

    setFilters({ query: searchQuery });
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery("");
    setFilters({ query: "" });
  };

  // Manejar filtros
  const toggleFilter = (filterId: string) => {
    if (!user) {
      showNotification("Debes iniciar sesión para filtrar canchas", "warning");
      return;
    }

    let newFilters: string[];

    if (selectedFilters.includes(filterId)) {
      newFilters = selectedFilters.filter((id) => id !== filterId);
    } else {
      newFilters = [...selectedFilters, filterId];
    }

    setSelectedFilters(newFilters);

    // Aplicar filtros a la tienda
    applyFilters(newFilters);
  };

  // Aplicar filtros seleccionados
  const applyFilters = (selectedFilters: string[]) => {
    // Si no hay usuario, no aplicamos filtros
    if (!user) return;

    // Reiniciar filtros
    resetFilters();

    // Crear objeto de filtros
    const filterObj: any = {};

    // Aplicar filtro de orden
    if (selectedFilters.includes("closest")) {
      filterObj.sortBy = "distance";
    } else {
      filterObj.sortBy = "rating";
    }

    // Filtrar por tipo
    const typeFilters = selectedFilters.filter((f) =>
      ["5v5", "7v7", "11v11"].includes(f)
    );
    if (typeFilters.length > 0) {
      filterObj.type = typeFilters;
    }

    // Filtrar por instalaciones
    const facilityFilters = [];
    if (selectedFilters.includes("parking"))
      facilityFilters.push("Parqueadero");
    if (selectedFilters.includes("showers")) facilityFilters.push("Duchas");

    if (facilityFilters.length > 0) {
      filterObj.facilities = facilityFilters;
    }

    // Filtrar por disponibilidad
    if (selectedFilters.includes("available")) {
      filterObj.available = true;
    }

    // Aplicar todos los filtros
    setFilters(filterObj);
  };

  // Manejar refresh
  const onRefresh = async () => {
    // Si no hay usuario, no refrescamos
    if (!user) {
      showNotification("Debes iniciar sesión para actualizar datos", "warning");
      return;
    }

    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Manejar navegación a login
  const handleGoToLogin = () => {
    router.replace("/(auth)/login");
  };

  // Si no hay usuario autenticado, mostrar pantalla de autenticación requerida
  if (!user && !authInitializing) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView style={styles.authRequiredContainer}>
          <IconSymbol
            name="lock.fill"
            size={60}
            color={Colors[colorScheme].primary}
          />
          <ThemedText type="subtitle" style={styles.authRequiredTitle}>
            Iniciar sesión requerido
          </ThemedText>
          <ThemedText style={styles.authRequiredText}>
            Necesitas iniciar sesión para explorar canchas disponibles.
          </ThemedText>
          <Button
            title="Iniciar sesión"
            size="large"
            onPress={handleGoToLogin}
            style={styles.loginButton}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

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
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
              >
                <ThemedText style={styles.clearText}>✕</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={filterOptions}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleFilter(item.id)}
                style={[
                  styles.filterChip,
                  selectedFilters.includes(item.id) &&
                    styles.selectedFilterChip,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    selectedFilters.includes(item.id) &&
                      styles.selectedFilterText,
                  ]}
                >
                  {item.name}
                </ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Lista de canchas */}
        {isLoading && fields.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={Colors[colorScheme].primary}
            />
            <ThemedText style={styles.loadingText}>
              Cargando canchas...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <ThemedText type="subtitle" style={styles.errorTitle}>
              Error al cargar canchas
            </ThemedText>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Button
              title="Reintentar"
              onPress={loadData}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <FlatList
            data={filteredFields}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.fieldsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  No se encontraron canchas
                </ThemedText>
                <ThemedText style={styles.emptyText}>
                  Intenta ajustar los filtros o la búsqueda
                </ThemedText>
                <Button
                  title="Limpiar filtros"
                  onPress={() => {
                    setSelectedFilters(["closest"]);
                    setSearchQuery("");
                    resetFilters();
                  }}
                  style={styles.clearFiltersButton}
                />
              </View>
            }
            renderItem={({ item }) => <FieldCard field={item} />}
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
  clearButton: {
    padding: Spacing.xs,
  },
  clearText: {
    fontSize: 16,
    color: "#9E9E9E",
  },
  filtersContainer: {
    marginBottom: Spacing.m,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.xs,
    gap: Spacing.s,
  },
  filterChip: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
  },
  selectedFilterChip: {
    backgroundColor: Colors.light.primary + "20",
  },
  filterText: {
    fontSize: 14,
  },
  selectedFilterText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  fieldsList: {
    paddingHorizontal: Spacing.l,
    paddingBottom: 100, // Extra padding for tab bar
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
  retryButton: {
    minWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.s,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  clearFiltersButton: {
    minWidth: 150,
  },
  // Estilos para la pantalla de autenticación requerida
  authRequiredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  authRequiredTitle: {
    marginTop: Spacing.l,
    marginBottom: Spacing.m,
  },
  authRequiredText: {
    textAlign: "center",
    marginBottom: Spacing.l,
    maxWidth: 300,
  },
  loginButton: {
    minWidth: 200,
  },
});
