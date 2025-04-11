// app/field/[id].tsx

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
import { AvailabilityCalendar } from "@/components/field/AvailabilityCalendar";
import { useFields } from "@/hooks/useFields";
import { Field } from "@/store/fieldStore";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function FieldDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const { getFieldDetails, isLoading, error } = useFields();

  const [field, setField] = useState<Field | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  useEffect(() => {
    const loadField = async () => {
      if (id) {
        const fieldData = await getFieldDetails(id);
        setField(fieldData);
      }
    };

    loadField();
  }, [id]);

  // Manejar selección de fecha y hora
  const handleTimeSelected = (date: Date, timeSlot: string) => {
    setSelectedDateTime(date);
  };

  // Manejar apertura de mapa
  const handleOpenMap = () => {
    if (field?.location) {
      const { latitude, longitude } = field.location;
      const url = Platform.select({
        ios: `maps:?q=${field.name}@${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${field.name}`,
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

  // Manejar reserva
  const handleReservation = () => {
    if (selectedDateTime) {
      // Aquí podríamos navegar a una pantalla de confirmación de reserva
      router.push({
        pathname: "/field/book" as any,
        params: {
          fieldId: field?.id,
          dateTime: selectedDateTime.toISOString(),
        },
      });
    } else {
      Alert.alert(
        "Selecciona un horario",
        "Por favor selecciona un horario para continuar con la reserva."
      );
    }
  };

  if (isLoading || !field) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={styles.loadingText}>
          Cargando información de la cancha...
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

  // Placeholder si no hay imágenes
  const images =
    field.photos && field.photos.length > 0
      ? field.photos
      : [require("@/assets/images/field-placeholder.png")];

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
        {/* Galería de imágenes */}
        <View style={styles.imageGalleryContainer}>
          {typeof images[selectedImageIndex] === "string" ? (
            <Image
              source={{ uri: images[selectedImageIndex] as string }}
              style={styles.mainImage}
              contentFit="cover"
            />
          ) : (
            <Image
              source={images[selectedImageIndex]}
              style={styles.mainImage}
              contentFit="cover"
            />
          )}

          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  {typeof image === "string" ? (
                    <Image
                      source={{ uri: image }}
                      style={[
                        styles.thumbnail,
                        selectedImageIndex === index &&
                          styles.selectedThumbnail,
                      ]}
                      contentFit="cover"
                    />
                  ) : (
                    <Image
                      source={image}
                      style={[
                        styles.thumbnail,
                        selectedImageIndex === index &&
                          styles.selectedThumbnail,
                      ]}
                      contentFit="cover"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Información principal */}
        <View style={styles.detailsContainer}>
          <ThemedText type="title" style={styles.fieldName}>
            {field.name}
          </ThemedText>

          <View style={styles.ratingContainer}>
            <ThemedText type="body" weight="semiBold">
              ⭐ {field.rating.toFixed(1)}
            </ThemedText>
            <ThemedText type="body" secondary>
              ({field.reviewCount} reseñas)
            </ThemedText>
          </View>

          <ThemedText type="body" style={styles.address}>
            {field.address}
          </ThemedText>

          <View style={styles.infoRow}>
            <ThemedText type="body" secondary>
              Zona: {field.zone}
            </ThemedText>
            {field.distance && (
              <ThemedText type="body" secondary>
                {field.distance} km de distancia
              </ThemedText>
            )}
          </View>

          <View style={styles.infoRow}>
            <ThemedText type="body" secondary>
              Tipo: {field.types.join(", ")}
            </ThemedText>
            <ThemedText type="subheading" style={styles.price}>
              {field.priceFormatted}
            </ThemedText>
          </View>

          {/* Descripción */}
          {field.description && (
            <View style={styles.descriptionContainer}>
              <ThemedText type="subtitle">Descripción</ThemedText>
              <ThemedText type="body" secondary style={styles.description}>
                {field.description}
              </ThemedText>
            </View>
          )}

          {/* Instalaciones */}
          {field.facilities && field.facilities.length > 0 && (
            <View style={styles.facilitiesContainer}>
              <ThemedText type="subtitle" style={styles.facilitiesTitle}>
                Instalaciones
              </ThemedText>
              <View style={styles.facilitiesGrid}>
                {field.facilities.map((facility, index) => (
                  <ThemedView key={index} style={styles.facilityItem} rounded>
                    <ThemedText type="body">{facility}</ThemedText>
                  </ThemedView>
                ))}
              </View>
            </View>
          )}

          {/* Mapa */}
          {field.location &&
            field.location.latitude &&
            field.location.longitude && (
              <View style={styles.mapContainer}>
                <ThemedText type="subtitle" style={styles.mapTitle}>
                  Ubicación
                </ThemedText>
                <View style={styles.mapWrapper}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: field.location.latitude,
                      longitude: field.location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    showsUserLocation
                  >
                    <Marker
                      coordinate={{
                        latitude: field.location.latitude,
                        longitude: field.location.longitude,
                      }}
                      title={field.name}
                      description={field.address}
                    />
                  </MapView>
                </View>
                <Button
                  title="Ver en Mapa"
                  variant="outlined"
                  size="small"
                  onPress={handleOpenMap}
                  style={styles.mapButton}
                />
              </View>
            )}

          {/* Calendario de disponibilidad */}
          <AvailabilityCalendar
            field={field}
            onTimeSelected={handleTimeSelected}
          />
        </View>
      </ScrollView>

      {/* Botón de reserva fijo en la parte inferior */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomContainer}>
        <ThemedView style={styles.reservationBar} variant="card" shadow="m">
          <View>
            <ThemedText type="body" weight="semiBold">
              {selectedDateTime
                ? `${selectedDateTime.toLocaleDateString(
                    "es-ES"
                  )} - ${selectedDateTime.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Selecciona un horario"}
            </ThemedText>
            <ThemedText
              type="body"
              weight="semiBold"
              style={styles.reservationPrice}
            >
              {field.priceFormatted}
            </ThemedText>
          </View>
          <Button
            title="Reservar"
            size="medium"
            onPress={handleReservation}
            disabled={!selectedDateTime}
          />
        </ThemedView>
      </SafeAreaView>
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
    paddingBottom: 80,
  },
  imageGalleryContainer: {
    width: "100%",
  },
  mainImage: {
    width: "100%",
    height: 250,
  },
  thumbnailContainer: {
    flexDirection: "row",
    padding: Spacing.s,
    backgroundColor: "#f5f5f5",
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: Spacing.xs,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedThumbnail: {
    borderColor: Colors.light.primary,
  },
  detailsContainer: {
    padding: Spacing.l,
  },
  fieldName: {
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.s,
    gap: Spacing.xs,
  },
  address: {
    marginBottom: Spacing.s,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: Spacing.xs,
  },
  price: {
    color: Colors.light.primary,
  },
  descriptionContainer: {
    marginTop: Spacing.m,
  },
  description: {
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  facilitiesContainer: {
    marginTop: Spacing.m,
  },
  facilitiesTitle: {
    marginBottom: Spacing.s,
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  facilityItem: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
  },
  mapContainer: {
    marginTop: Spacing.m,
  },
  mapTitle: {
    marginBottom: Spacing.s,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: Spacing.s,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapButton: {
    alignSelf: "flex-start",
    marginTop: Spacing.xs,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  reservationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  reservationPrice: {
    color: Colors.light.primary,
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
