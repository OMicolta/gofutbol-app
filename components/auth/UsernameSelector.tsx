// components/auth/UsernameSelector.tsx

import React, { useState, useEffect } from "react";
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
      // Verificar si el username ya existe en Firestore
      const usernameDoc = await getDoc(doc(db, "usernames", usernameToCheck));
      setIsAvailable(!usernameDoc.exists());
      setWasChecked(true);
    } catch (error) {
      console.error("Error al verificar nombre de usuario:", error);
      setIsAvailable(false);
      setWasChecked(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Manejar cambio de nombre de usuario
  const handleUsernameChange = (text: string) => {
    // Eliminar espacios y caracteres especiales, permitir letras, números y guiones bajos
    const formattedUsername = text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .trim();

    setUsername(formattedUsername);
    setWasChecked(false);
    setIsAvailable(false);
  };

  // Verificar disponibilidad al presionar el botón
  const handleCheckAvailability = () => {
    checkAvailability(username);
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
          style={[
            styles.input,
            { color: Colors[colorScheme].text },
            username.length > 0 &&
              wasChecked &&
              (isAvailable ? styles.validInput : styles.invalidInput),
          ]}
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

      {suggestionsEnabled && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ThemedText type="body" secondary>
            Sugerencias:
          </ThemedText>
          <View style={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
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
    marginBottom: Spacing.s,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: Spacing.m,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Shape.radius.m,
    paddingHorizontal: Spacing.m,
    marginBottom: Spacing.s,
    height: 56,
  },
  atSymbol: {
    fontSize: Typography.fontSizes.xl,
    marginRight: Spacing.xs,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.light.primary, // Este color se sobrescribirá con el hook useThemeColor en el componente
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizes.l,
    paddingVertical: Spacing.s,
  },
  validInput: {
    borderColor: Colors.light.success,
  },
  invalidInput: {
    borderColor: Colors.light.danger,
  },
  activityIndicator: {
    marginVertical: Spacing.s,
  },
  availabilityMessage: {
    marginBottom: Spacing.m,
    fontWeight: Typography.fontWeights.semiBold,
  },
  suggestionsContainer: {
    marginTop: Spacing.m,
    marginBottom: Spacing.m,
  },
  suggestionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.s,
    gap: Spacing.s,
  },
  suggestionItem: {
    borderRadius: 20,
    marginBottom: Spacing.xs,
  },
  suggestionTouchable: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
  },
  confirmButton: {
    marginTop: Spacing.m,
    height: 56,
    borderRadius: Shape.radius.m,
  },
  cancelButton: {
    marginTop: Spacing.m,
    alignItems: "center",
    padding: Spacing.s,
  },
  cancelText: {
    fontWeight: Typography.fontWeights.semiBold,
  },
});
