// components/profile/ProfileForm.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { UserProfile } from "@/store/authStore";

// Lista de posiciones para seleccionar
const positionOptions = [
  "Arquero",
  "Defensa",
  "Mediocampista",
  "Delantero",
  "Todoterreno",
];

// Lista de zonas fijas para seleccionar
const zoneOptions = [
  "Norte",
  "Sur",
  "Oriente",
  "Occidente",
  "Centro",
  "Noroccidente",
  "Nororiente",
  "Suroccidente",
  "Suroriente",
];

interface ProfileFormProps {
  initialData: Pick<UserProfile, "displayName" | "position" | "zone">;
  onDataChange: (data: {
    displayName: string;
    position: string;
    zone: string;
    errors: { displayName?: string };
  }) => void;
}

export function ProfileForm({ initialData, onDataChange }: ProfileFormProps) {
  const colorScheme = useColorScheme();

  // Estados para los campos del formulario
  const [displayName, setDisplayName] = useState(initialData.displayName || "");
  const [position, setPosition] = useState(initialData.position || "");
  const [zone, setZone] = useState(initialData.zone || "");

  // Estados para los selectores
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [showZoneSelector, setShowZoneSelector] = useState(false);

  // Estado para validación
  const [errors, setErrors] = useState<{
    displayName?: string;
  }>({});

  // Actualizar datos iniciales cuando cambien
  useEffect(() => {
    setDisplayName(initialData.displayName || "");
    setPosition(initialData.position || "");
    setZone(initialData.zone || "");
  }, [initialData]);

  // Validar campos y notificar al componente padre
  useEffect(() => {
    const newErrors: { displayName?: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = "El nombre es obligatorio";
    } else if (displayName.trim().length < 3) {
      newErrors.displayName = "El nombre debe tener al menos 3 caracteres";
    }

    setErrors(newErrors);

    // Notificar al componente padre sobre los cambios
    onDataChange({
      displayName,
      position,
      zone,
      errors: newErrors,
    });
  }, [displayName, position, zone, onDataChange]);

  return (
    <View style={styles.formContainer}>
      <ThemedText type="body" weight="semiBold" style={styles.fieldLabel}>
        Nombre completo *
      </ThemedText>
      <TextInput
        style={[
          styles.textInput,
          errors.displayName ? styles.inputError : null,
        ]}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Tu nombre completo"
        placeholderTextColor={Colors[colorScheme].placeholder}
      />
      {errors.displayName && (
        <ThemedText style={styles.errorText}>{errors.displayName}</ThemedText>
      )}

      <ThemedText type="body" weight="semiBold" style={styles.fieldLabel}>
        Posición en la cancha
      </ThemedText>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowPositionSelector(!showPositionSelector)}
      >
        <ThemedText>{position || "Selecciona tu posición"}</ThemedText>
        <IconSymbol
          name={showPositionSelector ? "chevron.right" : "arrow.right"}
          size={20}
          color={Colors[colorScheme].icon}
        />
      </TouchableOpacity>

      {/* Selector de posición */}
      {showPositionSelector && (
        <ThemedView style={styles.optionsContainer} variant="secondary" rounded>
          {positionOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionItem,
                position === option && styles.selectedOption,
              ]}
              onPress={() => {
                setPosition(option);
                setShowPositionSelector(false);
              }}
            >
              <ThemedText
                style={
                  position === option ? styles.selectedOptionText : undefined
                }
              >
                {option}
              </ThemedText>
              {position === option && (
                <IconSymbol
                  name="checkmark"
                  size={20}
                  color={Colors[colorScheme].primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </ThemedView>
      )}

      <ThemedText type="body" weight="semiBold" style={styles.fieldLabel}>
        Zona de la ciudad
      </ThemedText>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowZoneSelector(!showZoneSelector)}
      >
        <ThemedText>{zone || "Selecciona tu zona"}</ThemedText>
        <IconSymbol
          name={showZoneSelector ? "chevron.right" : "arrow.right"}
          size={20}
          color={Colors[colorScheme].icon}
        />
      </TouchableOpacity>

      {/* Selector de zona */}
      {showZoneSelector && (
        <ThemedView style={styles.optionsContainer} variant="secondary" rounded>
          <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
            {zoneOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionItem,
                  zone === option && styles.selectedOption,
                ]}
                onPress={() => {
                  setZone(option);
                  setShowZoneSelector(false);
                }}
              >
                <ThemedText
                  style={
                    zone === option ? styles.selectedOptionText : undefined
                  }
                >
                  {option}
                </ThemedText>
                {zone === option && (
                  <IconSymbol
                    name="checkmark"
                    size={20}
                    color={Colors[colorScheme].primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      )}

      {/* Notas sobre estadísticas */}
      <ThemedView style={styles.statsNote} variant="secondary" rounded>
        <ThemedText type="caption" secondary>
          Las estadísticas como asistencia, puntualidad y calificaciones son
          calculadas automáticamente basadas en tus partidos y no pueden ser
          editadas manualmente.
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    marginBottom: Spacing.l,
  },
  fieldLabel: {
    marginBottom: Spacing.xs,
  },
  textInput: {
    padding: Spacing.m,
    backgroundColor: "#f5f5f5",
    borderRadius: Shape.radius.m,
    fontSize: 16,
    marginBottom: Spacing.m,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.light.danger,
  },
  errorText: {
    color: Colors.light.danger,
    marginBottom: Spacing.m,
    marginTop: -Spacing.xs,
  },
  selector: {
    padding: Spacing.m,
    backgroundColor: "#f5f5f5",
    borderRadius: Shape.radius.m,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  optionsContainer: {
    marginTop: -Spacing.s,
    marginBottom: Spacing.m,
    padding: Spacing.s,
    borderRadius: Shape.radius.m,
    maxHeight: 200,
  },
  optionsScroll: {
    maxHeight: 180,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: Shape.radius.s,
  },
  selectedOption: {
    backgroundColor: Colors.light.primary + "20",
  },
  selectedOptionText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  statsNote: {
    padding: Spacing.m,
    marginBottom: Spacing.l,
    marginTop: Spacing.s,
  },
});
