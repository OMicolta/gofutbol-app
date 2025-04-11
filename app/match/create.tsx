// app/match/create.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Timestamp } from "firebase/firestore";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useMatches } from "@/hooks/useMatches";
import { useFields } from "@/hooks/useFields";
import { useAuth } from "@/hooks/useAuth";
import { MatchType, MatchLevel } from "@/store/matchStore";
import { Field } from "@/store/fieldStore";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";

export default function CreateMatchScreen() {
  const colorScheme = useColorScheme();
  const { user, profile } = useAuth();
  const { createMatch, isLoading, error } = useMatches();
  const { fields, fetchFields } = useFields();
  const { showNotification } = useNotification();

  // Estado del formulario
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [matchType, setMatchType] = useState<MatchType>("5v5");
  const [matchLevel, setMatchLevel] = useState<MatchLevel>("all");
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [uniformA, setUniformA] = useState("");
  const [uniformB, setUniformB] = useState("");
  const [description, setDescription] = useState("");

  // Estados para los pickers de fecha y hora en Android
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Cargar canchas disponibles
  useEffect(() => {
    fetchFields(true);
  }, []);

  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Formatear hora para mostrar
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Manejar cambio de fecha
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Manejar cambio de hora
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  // Manejar selección de cancha
  const handleFieldSelect = (field: Field) => {
    setSelectedField(field);
    setShowFieldSelector(false);
  };

  // Manejar creación del partido
  const handleCreateMatch = async () => {
    if (!user || !profile) {
      showNotification("Debes iniciar sesión para crear un partido", "error");
      return;
    }

    try {
      // Verificar datos mínimos
      if (date < new Date()) {
        Alert.alert("Error", "La fecha del partido debe ser futura");
        return;
      }

      // Combinar fecha y hora
      const matchDateTime = new Date(date);
      matchDateTime.setHours(time.getHours(), time.getMinutes());

      // Crear objeto del partido
      const matchData = {
        date: Timestamp.fromDate(matchDateTime),
        time: formatTime(time),
        type: matchType,
        level: matchLevel,
        isPrivate,
        fieldId: selectedField?.id || null,
        fieldName: selectedField?.name || null,
        address: selectedField?.address || null,
        location: selectedField?.location || null,
        description,
        uniformA: uniformA || null,
        uniformB: uniformB || null,
      };

      // Crear partido
      const matchId = await createMatch(matchData);

      showNotification("Partido creado correctamente", "success");

      // Navegar al detalle del partido
      router.replace(`/match/${matchId}` as any);
    } catch (error) {
      console.error("Error al crear partido:", error);
      showNotification(
        `Error al crear partido: ${(error as Error).message}`,
        "error"
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol
                name="chevron.right"
                size={24}
                color={Colors[colorScheme].text}
              />
            </TouchableOpacity>
            <ThemedText type="title">Crear Partido</ThemedText>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Selector de fecha */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Fecha y hora
              </ThemedText>

              <TouchableOpacity
                style={styles.dateTimePicker}
                onPress={() => setShowDatePicker(true)}
              >
                <ThemedText type="body">Fecha: {formatDate(date)}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimePicker}
                onPress={() => setShowTimePicker(true)}
              >
                <ThemedText type="body">Hora: {formatTime(time)}</ThemedText>
              </TouchableOpacity>

              {(showDatePicker || Platform.OS === "ios") && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={styles.dateTimePickerComponent}
                />
              )}

              {(showTimePicker || Platform.OS === "ios") && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  onChange={handleTimeChange}
                  minuteInterval={15}
                  style={styles.dateTimePickerComponent}
                />
              )}
            </View>

            {/* Tipo de partido */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Tipo de partido
              </ThemedText>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchType === "5v5" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchType("5v5")}
                >
                  <ThemedText
                    style={matchType === "5v5" ? styles.optionTextActive : null}
                  >
                    5 vs 5
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchType === "6v6" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchType("6v6")}
                >
                  <ThemedText
                    style={matchType === "6v6" ? styles.optionTextActive : null}
                  >
                    6 vs 6
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchType === "7v7" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchType("7v7")}
                >
                  <ThemedText
                    style={matchType === "7v7" ? styles.optionTextActive : null}
                  >
                    7 vs 7
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchType === "11v11" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchType("11v11")}
                >
                  <ThemedText
                    style={
                      matchType === "11v11" ? styles.optionTextActive : null
                    }
                  >
                    11 vs 11
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Nivel */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Nivel
              </ThemedText>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchLevel === "beginner" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchLevel("beginner")}
                >
                  <ThemedText
                    style={
                      matchLevel === "beginner" ? styles.optionTextActive : null
                    }
                  >
                    Principiante
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchLevel === "intermediate" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchLevel("intermediate")}
                >
                  <ThemedText
                    style={
                      matchLevel === "intermediate"
                        ? styles.optionTextActive
                        : null
                    }
                  >
                    Intermedio
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchLevel === "advanced" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchLevel("advanced")}
                >
                  <ThemedText
                    style={
                      matchLevel === "advanced" ? styles.optionTextActive : null
                    }
                  >
                    Avanzado
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    matchLevel === "all" && styles.optionButtonActive,
                  ]}
                  onPress={() => setMatchLevel("all")}
                >
                  <ThemedText
                    style={
                      matchLevel === "all" ? styles.optionTextActive : null
                    }
                  >
                    Todos
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cancha */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Ubicación
              </ThemedText>

              {selectedField ? (
                <ThemedView
                  style={styles.selectedFieldContainer}
                  variant="secondary"
                  rounded
                >
                  <View>
                    <ThemedText type="body" weight="semiBold">
                      {selectedField.name}
                    </ThemedText>
                    <ThemedText type="caption" secondary>
                      {selectedField.address}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => setShowFieldSelector(true)}
                  >
                    <ThemedText type="caption" style={styles.changeButtonText}>
                      Cambiar
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <Button
                  title="Seleccionar cancha"
                  size="medium"
                  variant={showFieldSelector ? "filled" : "outlined"}
                  onPress={() => setShowFieldSelector(!showFieldSelector)}
                />
              )}

              {showFieldSelector && (
                <ThemedView
                  style={styles.fieldSelectorContainer}
                  variant="secondary"
                  rounded
                >
                  <ThemedText
                    type="body"
                    weight="semiBold"
                    style={styles.fieldSelectorTitle}
                  >
                    Selecciona una cancha
                  </ThemedText>

                  {fields.length > 0 ? (
                    <ScrollView
                      style={styles.fieldsList}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {fields.map((field) => (
                        <TouchableOpacity
                          key={field.id}
                          style={styles.fieldItem}
                          onPress={() => handleFieldSelect(field)}
                        >
                          <View>
                            <ThemedText type="body" weight="semiBold">
                              {field.name}
                            </ThemedText>
                            <ThemedText type="caption" secondary>
                              {field.address}
                            </ThemedText>
                            <ThemedText type="caption" secondary>
                              {field.zone} • {field.priceFormatted}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyFieldsList}>
                      <ActivityIndicator
                        size="small"
                        color={Colors[colorScheme].primary}
                      />
                      <ThemedText
                        type="body"
                        secondary
                        style={styles.emptyFieldsText}
                      >
                        Cargando canchas disponibles...
                      </ThemedText>
                    </View>
                  )}

                  <Button
                    title="Por definir"
                    size="small"
                    variant="ghost"
                    onPress={() => {
                      setSelectedField(null);
                      setShowFieldSelector(false);
                    }}
                    style={styles.skipButton}
                  />
                </ThemedView>
              )}
            </View>

            {/* Privacidad */}
            <View style={styles.formSection}>
              <View style={styles.privacyHeader}>
                <ThemedText type="subtitle">Privacidad</ThemedText>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      !isPrivate && styles.toggleActive,
                    ]}
                    onPress={() => setIsPrivate(false)}
                  >
                    <ThemedText
                      style={!isPrivate ? styles.toggleActiveText : null}
                    >
                      Público
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      isPrivate && styles.toggleActive,
                    ]}
                    onPress={() => setIsPrivate(true)}
                  >
                    <ThemedText
                      style={isPrivate ? styles.toggleActiveText : null}
                    >
                      Privado
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <ThemedText type="caption" secondary style={styles.privacyInfo}>
                {isPrivate
                  ? "Los jugadores solo podrán unirse por invitación."
                  : "Cualquier jugador podrá unirse al partido."}
              </ThemedText>
            </View>

            {/* Uniforme */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Colores de uniforme (opcional)
              </ThemedText>

              <View style={styles.uniformsContainer}>
                <View style={styles.uniformField}>
                  <ThemedText type="body">Equipo A:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={uniformA}
                    onChangeText={setUniformA}
                    placeholder="Ej: Camiseta blanca"
                    placeholderTextColor="#9E9E9E"
                  />
                </View>

                <View style={styles.uniformField}>
                  <ThemedText type="body">Equipo B:</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={uniformB}
                    onChangeText={setUniformB}
                    placeholder="Ej: Camiseta azul"
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>
            </View>

            {/* Descripción */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Descripción (opcional)
              </ThemedText>

              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Agrega detalles adicionales sobre el partido..."
                placeholderTextColor="#9E9E9E"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Botón de crear */}
            <Button
              title={isLoading ? "Creando..." : "Crear Partido"}
              size="large"
              fullWidth
              onPress={handleCreateMatch}
              disabled={isLoading}
              style={styles.createButton}
            />

            {error && (
              <ThemedText type="caption" style={styles.errorText}>
                {error}
              </ThemedText>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.l,
    gap: Spacing.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: Spacing.l,
    paddingBottom: Spacing.xxl,
  },
  formSection: {
    marginBottom: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  dateTimePicker: {
    padding: Spacing.m,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: Spacing.s,
  },
  dateTimePickerComponent: {
    marginVertical: Spacing.s,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  optionButton: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minWidth: 80,
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  optionButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  optionTextActive: {
    color: "white",
    fontWeight: "600",
  },
  selectedFieldContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
  },
  changeButton: {
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.light.primary + "20",
    borderRadius: 4,
  },
  changeButtonText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  fieldSelectorContainer: {
    marginTop: Spacing.s,
    padding: Spacing.m,
    maxHeight: 300,
  },
  fieldSelectorTitle: {
    marginBottom: Spacing.s,
  },
  fieldsList: {
    maxHeight: 200,
  },
  fieldItem: {
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  emptyFieldsList: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyFieldsText: {
    marginTop: Spacing.s,
    textAlign: "center",
  },
  skipButton: {
    alignSelf: "center",
    marginTop: Spacing.s,
  },
  privacyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  toggleContainer: {
    flexDirection: "row",
  },
  toggleButton: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  toggleActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  toggleActiveText: {
    color: "white",
    fontWeight: "600",
  },
  privacyInfo: {
    marginTop: Spacing.xs,
  },
  uniformsContainer: {
    gap: Spacing.m,
  },
  uniformField: {
    gap: Spacing.xs,
  },
  textInput: {
    padding: Spacing.m,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    padding: Spacing.m,
  },
  createButton: {
    marginTop: Spacing.l,
  },
  errorText: {
    color: Colors.light.danger,
    marginTop: Spacing.s,
    textAlign: "center",
  },
});
