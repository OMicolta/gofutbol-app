// app/setup-username.tsx

import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, setDoc, getDoc } from "firebase/firestore";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { UsernameSelector } from "@/components/auth/UsernameSelector";
import { useAuth } from "@/hooks/useAuth";
import { useNotification } from "@/context/NotificationContext";
import { Colors, Spacing } from "@/constants/Colors";
import { db } from "@/config/firebase";

export default function SetupUsernameScreen() {
  const { user, profile, isInitializing, safeUpdateProfile } = useAuth();
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si el usuario ya tiene un username o no está autenticado
  useEffect(() => {
    if (!isInitializing) {
      if (!user) {
        // Si no hay usuario, redirigir a login
        router.replace("/(auth)/login");
      } else if (profile?.username) {
        // Si ya tiene username, redirigir a la pantalla principal
        router.replace("/(tabs)");
      }
    }
  }, [user, profile, isInitializing]);

  // Manejar selección de username
  const handleUsernameSelected = async (username: string) => {
    if (!user || !profile) return;

    setIsSubmitting(true);
    try {
      // Verificar disponibilidad una vez más por seguridad
      const usernameDoc = await getDoc(doc(db, "usernames", username));

      if (usernameDoc.exists()) {
        showNotification(
          "Este nombre de usuario ya no está disponible",
          "error"
        );
        setIsSubmitting(false);
        return;
      }

      // Guardar username en el documento del usuario
      const success = await safeUpdateProfile({
        ...profile,
        username,
      });

      if (success) {
        // Crear documento en la colección usernames para verificar unicidad
        await setDoc(doc(db, "usernames", username), {
          uid: user.uid,
          createdAt: new Date(),
        });

        showNotification(
          "¡Nombre de usuario configurado correctamente!",
          "success"
        );

        // Redirigir a la pantalla principal
        router.replace("/(tabs)");
      } else {
        showNotification("Error al guardar el nombre de usuario", "error");
      }
    } catch (error) {
      console.error("Error al configurar username:", error);
      showNotification("Error al configurar el nombre de usuario", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar pantalla de carga mientras se inicializa
  if (isInitializing || !user || !profile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <UsernameSelector
            displayName={profile.displayName}
            onUsernameSelected={handleUsernameSelected}
          />

          {isSubmitting && (
            <ActivityIndicator
              size="large"
              color={Colors.light.primary}
              style={styles.submitIndicator}
            />
          )}
        </View>
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
  content: {
    flex: 1,
    padding: Spacing.l,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  submitIndicator: {
    marginTop: Spacing.xl,
  },
});
