// components/field/FieldCard.tsx

import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/store/fieldStore";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface FieldCardProps {
  field: Field;
  onPress?: () => void;
  compact?: boolean;
}

export function FieldCard({ field, onPress, compact = false }: FieldCardProps) {
  const colorScheme = useColorScheme();

  // Manejar clic en la tarjeta
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/field/${field.id}` as any);
    }
  };

  // Formato de precio para mostrar
  const formattedPrice =
    field.priceFormatted || `$${field.price?.toLocaleString("es-CO") || "0"}/h`;

  // Mostrar placeholder si no hay imagen
  const imageSource =
    field.photos && field.photos.length > 0
      ? { uri: field.photos[0] }
      : require("@/assets/images/field-placeholder.png");

  // Renderizar la versión compacta o completa
  if (compact) {
    return (
      <Card onPress={handlePress} style={styles.compactCard} shadow="s">
        <View style={styles.compactContent}>
          <Image
            source={imageSource}
            style={styles.compactImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.compactInfo}>
            <ThemedText type="body" weight="semiBold" numberOfLines={1}>
              {field.name}
            </ThemedText>
            <ThemedText type="caption" secondary numberOfLines={1}>
              {field.zone} • {field.distance ? `${field.distance} km` : ""}
            </ThemedText>
            <ThemedText type="caption" secondary>
              ⭐ {field.rating.toFixed(1)} • {formattedPrice}
            </ThemedText>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={handlePress} style={styles.card} shadow="s">
      <Image
        source={imageSource}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subheading">{field.name}</ThemedText>
          {field.distance !== undefined && (
            <ThemedView
              style={styles.distanceBadge}
              rounded="s"
              variant="secondary"
            >
              <ThemedText style={styles.distanceText}>
                {field.distance} km
              </ThemedText>
            </ThemedView>
          )}
        </View>

        <ThemedText type="caption" secondary>
          {field.address}
        </ThemedText>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <ThemedText type="caption" secondary>
              Zona: {field.zone}
            </ThemedText>
            <ThemedText type="caption" secondary>
              ⭐ {field.rating.toFixed(1)} ({field.reviewCount})
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText type="caption" secondary>
              Tipo: {field.types.join(", ")}
            </ThemedText>
            <ThemedText type="body" weight="semiBold" style={styles.priceText}>
              {formattedPrice}
            </ThemedText>
          </View>
        </View>

        {field.facilities && field.facilities.length > 0 && (
          <View style={styles.facilitiesContainer}>
            {field.facilities.slice(0, 3).map((facility, index) => (
              <ThemedView
                key={index}
                style={styles.facilityChip}
                rounded="s"
                variant="secondary"
              >
                <ThemedText type="caption">{facility}</ThemedText>
              </ThemedView>
            ))}
            {field.facilities.length > 3 && (
              <ThemedText type="caption" secondary>
                +{field.facilities.length - 3} más
              </ThemedText>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Button title="Ver Detalles" size="small" variant="ghost" />
          <Button title="Reservar" size="small" />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.m,
    padding: 0,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 150,
  },
  content: {
    padding: Spacing.m,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  distanceBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  distanceText: {
    color: Colors.light.primary,
    fontSize: Typography.fontSizes.s,
    fontWeight: Typography.fontWeights.medium,
  },
  detailsContainer: {
    marginTop: Spacing.s,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: Spacing.xs / 2,
  },
  priceText: {
    color: Colors.light.primary,
  },
  facilitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.s,
    gap: Spacing.xs,
    alignItems: "center",
  },
  facilityChip: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs / 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.m,
  },
  // Estilos para versión compacta
  compactCard: {
    marginBottom: Spacing.s,
    padding: 0,
    overflow: "hidden",
  },
  compactContent: {
    flexDirection: "row",
    height: 80,
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  compactInfo: {
    flex: 1,
    padding: Spacing.s,
    justifyContent: "space-between",
  },
});
