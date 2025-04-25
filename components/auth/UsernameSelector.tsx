// components/auth/UsernameSelector.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { db } from "@/config/firebase";
import { Colors, Spacing, Shape, Typography } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface UsernameSelectorProps {
  initialUsername?: string;
  displayName?: string | null;
  onUsernameSelected: (username: string) => void;
  onCancel?: () => void;
  suggestionsEnabled?: boolean;
}

// Simulación de nombres de usuario existentes para modo de prueba
const MOCK_EXISTING_USERNAMES = ["admin", "test", "usuario1", "futbolista"];

export function UsernameSelector({
  initialUsername = "",
  displayName = "",
  onUsernameSelected,
  onCancel,
  suggestionsEnabled = true,
}: UsernameSelectorProps) {
  const colorScheme = useColorScheme();
  const [username, setUsername] = useState(initialUsername);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [wasChecked, setWasChecked] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [useTestMode, setUseTestMode] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Generar sugerencias basadas en el nombre de usuario
  useEffect(() => {
    if (suggestionsEnabled && displayName) {
      const baseSuggestion = displayName
        .toLowerCase()
        .replace(/\s+/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos

      const newSuggestions = [
        baseSuggestion,
        `${baseSuggestion}${Math.floor(Math.random() * 100)}`,
        `${baseSuggestion.substring(0, 5)}${Math.floor(Math.random() * 1000)}`,
      ];

      // Si hay un nombre y apellido, crear sugerencia con iniciales
      const nameParts = displayName.split(" ");
      if (nameParts.length > 1) {
        const initials = nameParts
          .map((part) => part.charAt(0))
          .join("")
          .toLowerCase();
        newSuggestions.push(initials);
        newSuggestions.push(`${initials}${Math.floor(Math.random() * 1000)}`);
      }

      setSuggestions(Array.from(new Set(newSuggestions)));
    }
  }, [displayName, suggestionsEnabled]);

  // Verificar disponibilidad en modo de prueba
  const checkAvailabilityTestMode = (usernameToCheck: string) => {
    return !MOCK_EXISTING_USERNAMES.includes(usernameToCheck);
  };

  // Verificar disponibilidad del nombre de usuario
  const checkAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setIsAvailable(false);
      setWasChecked(true);
      return;
    }

    setIsChecking(true);
    setWasChecked(false);

    try {
      if (useTestMode) {
        // Usar modo de prueba sin acceso a Firebase
        setTimeout(() => {
          setIsAvailable(checkAvailabilityTestMode(usernameToCheck));
          setWasChecked(true);
          setIsChecking(false);
        }, 500); // Simulamos un pequeño delay
      } else {
        // Intentar verificar con Firestore
        try {
          const usernameDoc = await getDoc(
            doc(db, "usernames", usernameToCheck)
          );
          setIsAvailable(!usernameDoc.exists());
          setWasChecked(true);
        } catch (error) {
          console.error("Error al verificar nombre de usuario:", error);
          // Si hay error, cambiar a modo de prueba
          setUseTestMode(true);
          // Y volver a verificar en modo prueba
          setIsAvailable(checkAvailabilityTestMode(usernameToCheck));
          setWasChecked(true);
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Manejar cambio de nombre de usuario con debounce para la verificación automática
  const handleUsernameChange = (text: string) => {
    // Eliminar espacios y caracteres especiales, permitir letras, números y guiones bajos
    const formattedUsername = text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .trim();

    setUsername(formattedUsername);
    setWasChecked(false);
    setIsAvailable(false);

    // Limpiar el timeout anterior si existe
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Configurar un nuevo timeout para verificar automáticamente después de un breve retraso
    if (formattedUsername.length >= 3) {
      setIsChecking(true); // Mostrar indicador de carga inmediatamente
      debounceTimeout.current = setTimeout(() => {
        checkAvailability(formattedUsername);
      }, 500); // Verificar después de 500ms de inactividad
    } else {
      // Si el nombre de usuario es muy corto, marcar como verificado pero no disponible
      setIsChecking(false);
      setWasChecked(true);
      setIsAvailable(false);
    }
  };

  // Verificar disponibilidad al presionar el botón (mantenido para compatibilidad)
  const handleCheckAvailability = () => {
    if (!wasChecked || !isChecking) {
      checkAvailability(username);
    }
  };

  // Seleccionar una sugerencia
  const handleSelectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    checkAvailability(suggestion);
  };

  // Confirmar la selección del nombre de usuario
  const handleConfirm = () => {
    if (isAvailable && username) {
      onUsernameSelected(username);
    }
  };

  // Limpiar el timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Elige un nombre de usuario
      </ThemedText>

      <ThemedText type="body" secondary style={styles.subtitle}>
        Tu nombre de usuario es único y te identifica en la plataforma.
      </ThemedText>

      <ThemedView
        style={[
          styles.inputContainer,
          {
            backgroundColor: Colors[colorScheme].card,
            borderColor: Colors[colorScheme].border,
          },
        ]}
        variant="secondary"
        rounded
      >
        <ThemedText
          style={[styles.atSymbol, { color: Colors[colorScheme].primary }]}
        >
          @
        </ThemedText>
        <TextInput
          style={[styles.input, { color: Colors[colorScheme].text }]}
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="nombreusuario"
          placeholderTextColor={Colors[colorScheme].placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={handleCheckAvailability}
        />
      </ThemedView>

      {isChecking ? (
        <ActivityIndicator
          size="small"
          color={Colors[colorScheme].primary}
          style={styles.activityIndicator}
        />
      ) : wasChecked ? (
        <ThemedText
          style={[
            styles.availabilityMessage,
            {
              color: isAvailable
                ? Colors[colorScheme].success
                : Colors[colorScheme].danger,
            },
          ]}
        >
          {isAvailable
            ? "¡Nombre de usuario disponible!"
            : username.length < 3
            ? "El nombre de usuario debe tener al menos 3 caracteres"
            : "Este nombre de usuario ya está en uso"}
        </ThemedText>
      ) : null}

      {useTestMode && (
        <ThemedText
          style={[
            styles.testModeMessage,
            { color: Colors[colorScheme].textSecondary },
          ]}
        >
          Usando modo de prueba (sin conexión)
        </ThemedText>
      )}

      {suggestionsEnabled && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ThemedText type="body" secondary style={styles.suggestionsTitle}>
            Sugerencias:
          </ThemedText>
          <View style={styles.suggestionsList}>
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <ThemedView
                key={index}
                style={styles.suggestionItem}
                variant="secondary"
                rounded
              >
                <TouchableOpacity
                  onPress={() => handleSelectSuggestion(suggestion)}
                  style={styles.suggestionTouchable}
                >
                  <ThemedText>@{suggestion}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ))}
          </View>
        </View>
      )}

      <Button
        title="Confirmar"
        size="large"
        disabled={!isAvailable || !username}
        onPress={handleConfirm}
        style={styles.confirmButton}
        fullWidth
      />

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <ThemedText
            style={[styles.cancelText, { color: Colors[colorScheme].primary }]}
          >
            Cancelar
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: Spacing.m,
    textAlign: "center",
    fontSize: Typography.fontSizes.s,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Shape.radius.m,
    marginBottom: Spacing.s,
    paddingHorizontal: Spacing.m,
    height: 48,
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 16,
  },
  validInput: {
    borderColor: Colors.light.success,
  },
  invalidInput: {
    borderColor: Colors.light.danger,
  },
  activityIndicator: {
    marginVertical: Spacing.xs,
  },
  availabilityMessage: {
    textAlign: "center",
    marginBottom: Spacing.s,
    fontSize: Typography.fontSizes.xs,
  },
  testModeMessage: {
    textAlign: "center",
    marginBottom: Spacing.s,
    fontSize: Typography.fontSizes.xs,
    fontStyle: "italic",
  },
  suggestionsContainer: {
    marginBottom: Spacing.s,
  },
  suggestionsTitle: {
    marginBottom: Spacing.xs,
    textAlign: "center",
    fontSize: Typography.fontSizes.s,
  },
  suggestionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  suggestionItem: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Shape.radius.m,
    marginBottom: Spacing.xs,
  },
  suggestionTouchable: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.s,
  },
  confirmButton: {
    marginTop: Spacing.s,
  },
  cancelButton: {
    marginTop: Spacing.s,
    alignItems: "center",
  },
  cancelText: {
    fontSize: Typography.fontSizes.s,
  },
});
