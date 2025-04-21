// app/match/create.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  const [fieldSearchQuery, setFieldSearchQuery] = useState("");

  // Estados para los pickers de fecha y hora en Android
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Estado para validación del formulario
  const [formErrors, setFormErrors] = useState<{
    date?: string;
    field?: string;
  }>({});

  // Estado para rastrear si el formulario está completo
  const [isFormValid, setIsFormValid] = useState(false);

  // Cargar canchas disponibles
  useEffect(() => {
    fetchFields(true);
    // Iniciamos con la fecha de hoy pero sumando 1 hora
    const newDate = new Date();
    newDate.setHours(newDate.getHours() + 1);
    setTime(newDate);
  }, []);

  // Validar formulario cuando cambian los campos principales
  useEffect(() => {
    validateForm();
  }, [date, matchType, selectedField]);

  // Función de validación del formulario
  const validateForm = () => {
    const errors: { date?: string; field?: string } = {};
    let valid = true;

    // Validar fecha
    const now = new Date();
    if (date < now) {
      errors.date = "La fecha del partido debe ser futura";
      valid = false;
    }

    setFormErrors(errors);
    setIsFormValid(valid);
    return valid;
  };

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

    // Mostrar notificación de confirmación
    showNotification(`Cancha "${field.name}" seleccionada`, "success");
  };

  // Filtrar canchas por búsqueda
  const getFilteredFields = () => {
    if (!fieldSearchQuery.trim()) return fields;

    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
        field.zone.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
        field.address.toLowerCase().includes(fieldSearchQuery.toLowerCase())
    );
  };

  // Manejar creación del partido - CORREGIDO PARA ELIMINAR VALORES UNDEFINED
  const handleCreateMatch = async () => {
    if (!user || !profile) {
      showNotification("Debes iniciar sesión para crear un partido", "error");
      return;
    }

    // Validar formulario antes de continuar
    if (!validateForm()) {
      showNotification(
        "Por favor corrige los errores en el formulario",
        "error"
      );
      return;
    }

    try {
      // Combinar fecha y hora
      const matchDateTime = new Date(date);
      matchDateTime.setHours(time.getHours(), time.getMinutes());

      // Crear objeto del partido con valores seguros (sin undefined)
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
        description: description || "", // Asegurar que nunca sea undefined
        uniformA: uniformA || null, // Convertir string vacía a null
        uniformB: uniformB || null, // Convertir string vacía a null
        // No enviar propiedades adicionales que no se hayan definido
      };

      // Crear partido
      const matchId = await createMatch(matchData);

      showNotification(
        "¡Partido creado correctamente! Invita a tus amigos.",
        "success"
      );

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
                name="arrow.left"
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
                style={[
                  styles.dateTimePicker,
                  {
                    backgroundColor: Colors[colorScheme].card,
                    borderColor: formErrors.date
                      ? Colors[colorScheme].danger
                      : Colors[colorScheme].border,
                  },
                  formErrors.date ? styles.inputError : null,
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.inputWithIcon}>
                  <IconSymbol
                    name="calendar"
                    size={20}
                    color={Colors[colorScheme].textSecondary}
                    style={styles.inputIcon}
                  />
                  <ThemedText type="body">{formatDate(date)}</ThemedText>
                </View>
              </TouchableOpacity>

              {formErrors.date && (
                <ThemedText
                  type="caption"
                  style={[
                    styles.errorText,
                    { color: Colors[colorScheme].danger },
                  ]}
                >
                  {formErrors.date}
                </ThemedText>
              )}

              <TouchableOpacity
                style={[
                  styles.dateTimePicker,
                  { backgroundColor: Colors[colorScheme].card },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.inputWithIcon}>
                  <IconSymbol
                    name="calendar"
                    size={20}
                    color={Colors[colorScheme].textSecondary}
                    style={styles.inputIcon}
                  />
                  <ThemedText type="body">{formatTime(time)}</ThemedText>
                </View>
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
                    {
                      backgroundColor:
                        matchType === "5v5"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchType === "5v5"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchType("5v5")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchType === "5v5"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
                  >
                    5 vs 5
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        matchType === "6v6"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchType === "6v6"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchType("6v6")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchType === "6v6"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
                  >
                    6 vs 6
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        matchType === "7v7"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchType === "7v7"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchType("7v7")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchType === "7v7"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
                  >
                    7 vs 7
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        matchType === "11v11"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchType === "11v11"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchType("11v11")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchType === "11v11"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
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
                    {
                      backgroundColor:
                        matchLevel === "beginner"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchLevel === "beginner"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchLevel("beginner")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchLevel === "beginner"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
                  >
                    Principiante
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        matchLevel === "intermediate"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchLevel === "intermediate"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchLevel("intermediate")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchLevel === "intermediate"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
                  >
                    Intermedio
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        matchLevel === "advanced"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchLevel === "advanced"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchLevel("advanced")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchLevel === "advanced"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
                  >
                    Avanzado
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        matchLevel === "all"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                      borderColor:
                        matchLevel === "all"
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                    },
                  ]}
                  onPress={() => setMatchLevel("all")}
                >
                  <ThemedText
                    style={{
                      color:
                        matchLevel === "all"
                          ? "white"
                          : Colors[colorScheme].text,
                    }}
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
                    {selectedField.distance && (
                      <ThemedText type="caption" secondary>
                        {selectedField.distance} km • {selectedField.zone}
                      </ThemedText>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.changeButton,
                      { backgroundColor: Colors[colorScheme].primary + "20" },
                    ]}
                    onPress={() => setShowFieldSelector(true)}
                  >
                    <ThemedText
                      type="caption"
                      style={[
                        styles.changeButtonText,
                        { color: Colors[colorScheme].primary },
                      ]}
                    >
                      Cambiar
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                <Button
                  title="Seleccionar cancha"
                  size="medium"
                  leftIcon="paperplane.fill"
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

                  {/* Buscador de cancha */}
                  <ThemedView
                    style={styles.searchContainer}
                    variant="secondary"
                    rounded
                  >
                    <IconSymbol
                      name="paperplane.fill"
                      size={20}
                      color={Colors[colorScheme].textSecondary}
                    />
                    <TextInput
                      style={[
                        styles.searchInput,
                        { color: Colors[colorScheme].text },
                      ]}
                      placeholder="Buscar cancha por nombre o zona..."
                      placeholderTextColor={Colors[colorScheme].textSecondary}
                      value={fieldSearchQuery}
                      onChangeText={setFieldSearchQuery}
                    />
                    {fieldSearchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setFieldSearchQuery("")}
                        style={styles.clearButton}
                      >
                        <ThemedText style={styles.clearText}>✕</ThemedText>
                      </TouchableOpacity>
                    )}
                  </ThemedView>

                  {fields.length > 0 ? (
                    <ScrollView
                      style={styles.fieldsList}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {getFilteredFields().map((field) => (
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
                              {field.distance ? ` • ${field.distance} km` : ""}
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
                      {
                        backgroundColor: !isPrivate
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                        borderColor: !isPrivate
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                      },
                    ]}
                    onPress={() => setIsPrivate(false)}
                  >
                    <ThemedText
                      style={{
                        color: !isPrivate ? "white" : Colors[colorScheme].text,
                      }}
                    >
                      Público
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      {
                        backgroundColor: isPrivate
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].card,
                        borderColor: isPrivate
                          ? Colors[colorScheme].primary
                          : Colors[colorScheme].border,
                      },
                    ]}
                    onPress={() => setIsPrivate(true)}
                  >
                    <ThemedText
                      style={{
                        color: isPrivate ? "white" : Colors[colorScheme].text,
                      }}
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
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: Colors[colorScheme].card,
                        color: Colors[colorScheme].text,
                        borderColor: Colors[colorScheme].border,
                        borderWidth: 1,
                      },
                    ]}
                    value={uniformA}
                    onChangeText={setUniformA}
                    placeholder="Ej: Camiseta blanca"
                    placeholderTextColor={Colors[colorScheme].textSecondary}
                  />
                </View>

                <View style={styles.uniformField}>
                  <ThemedText type="body">Equipo B:</ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: Colors[colorScheme].card,
                        color: Colors[colorScheme].text,
                        borderColor: Colors[colorScheme].border,
                        borderWidth: 1,
                      },
                    ]}
                    value={uniformB}
                    onChangeText={setUniformB}
                    placeholder="Ej: Camiseta azul"
                    placeholderTextColor={Colors[colorScheme].textSecondary}
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
                style={[
                  styles.textInput,
                  styles.multilineInput,
                  {
                    backgroundColor: Colors[colorScheme].card,
                    color: Colors[colorScheme].text,
                    borderColor: Colors[colorScheme].border,
                    borderWidth: 1,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Agrega detalles adicionales sobre el partido..."
                placeholderTextColor={Colors[colorScheme].textSecondary}
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
              disabled={isLoading || !isFormValid}
              style={styles.createButton}
            />

            {error && (
              <ThemedText
                type="caption"
                style={[
                  styles.errorText,
                  { color: Colors[colorScheme].danger },
                ]}
              >
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
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
    borderRadius: 8,
    marginBottom: Spacing.s,
    borderWidth: 1,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: Spacing.m,
  },
  inputError: {
    borderWidth: 1,
  },
  errorText: {
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
    minWidth: 80,
    alignItems: "center",
    marginBottom: Spacing.xs,
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
    borderRadius: 4,
  },
  changeButtonText: {
    fontWeight: "600",
  },
  fieldSelectorContainer: {
    marginTop: Spacing.s,
    padding: Spacing.m,
    maxHeight: 400,
  },
  fieldSelectorTitle: {
    marginBottom: Spacing.s,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.m,
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
  fieldsList: {
    maxHeight: 250,
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
});
