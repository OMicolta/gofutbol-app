// app\profile\notification-settings.tsx

import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationPermissions } from "@/types/notification";

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const {
    notificationPermissions,
    fetchNotificationPermissions,
    updateNotificationPermissions,
    registerForPushNotifications,
    isLoading,
  } = useNotificationStore();

  // Cargar preferencias al montar
  useEffect(() => {
    fetchNotificationPermissions();
  }, []);

  // Manejar cambio de preferencia
  const handleTogglePermission = async (
    key: keyof NotificationPermissions,
    value: boolean
  ) => {
    await updateNotificationPermissions({ [key]: value });
  };

  // Solicitar permisos de notificaciones push
  const handleRegisterPushNotifications = async () => {
    const token = await registerForPushNotifications();

    if (token) {
      Alert.alert(
        "¡Notificaciones activadas!",
        "Ahora recibirás notificaciones de tus partidos y actividades.",
        [{ text: "OK" }]
      );
    }
  };

  // Color para el track del switch cuando está desactivado
  const inactiveColor = colorScheme === "dark" ? "#444" : "#D1D1D1";

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: "Configuración de notificaciones" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
          <ThemedText style={styles.loadingText}>
            Cargando configuración...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: "Configuración de notificaciones" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.section} rounded="m">
          <ThemedText weight="bold" style={styles.sectionTitle}>
            Notificaciones Push
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Recibe notificaciones incluso cuando no estás usando la aplicación.
          </ThemedText>

          <ThemedView style={styles.permissionItem} rounded="s">
            <ThemedText weight="medium">Invitaciones a partidos</ThemedText>
            <Switch
              value={notificationPermissions.matchInvitations}
              onValueChange={(value) =>
                handleTogglePermission("matchInvitations", value)
              }
              trackColor={{
                false: inactiveColor,
                true: Colors[colorScheme].primary,
              }}
            />
          </ThemedView>

          <ThemedView style={styles.permissionItem} rounded="s">
            <ThemedText weight="medium">Recordatorios de partidos</ThemedText>
            <Switch
              value={notificationPermissions.matchReminders}
              onValueChange={(value) =>
                handleTogglePermission("matchReminders", value)
              }
              trackColor={{
                false: inactiveColor,
                true: Colors[colorScheme].primary,
              }}
            />
          </ThemedView>

          <ThemedView style={styles.permissionItem} rounded="s">
            <ThemedText weight="medium">Actividad de jugadores</ThemedText>
            <Switch
              value={notificationPermissions.playerActivity}
              onValueChange={(value) =>
                handleTogglePermission("playerActivity", value)
              }
              trackColor={{
                false: inactiveColor,
                true: Colors[colorScheme].primary,
              }}
            />
          </ThemedView>

          <ThemedView style={styles.permissionItem} rounded="s">
            <ThemedText weight="medium">Calificaciones pendientes</ThemedText>
            <Switch
              value={notificationPermissions.ratings}
              onValueChange={(value) =>
                handleTogglePermission("ratings", value)
              }
              trackColor={{
                false: inactiveColor,
                true: Colors[colorScheme].primary,
              }}
            />
          </ThemedView>

          <ThemedView style={styles.permissionItem} rounded="s">
            <ThemedText weight="medium">Actualizaciones del sistema</ThemedText>
            <Switch
              value={notificationPermissions.systemUpdates}
              onValueChange={(value) =>
                handleTogglePermission("systemUpdates", value)
              }
              trackColor={{
                false: inactiveColor,
                true: Colors[colorScheme].primary,
              }}
            />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section} rounded="m">
          <ThemedText weight="bold" style={styles.sectionTitle}>
            Permisos del dispositivo
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Para recibir notificaciones, necesitas autorizar los permisos en tu
            dispositivo.
          </ThemedText>

          <ThemedView
            style={[
              styles.button,
              { backgroundColor: Colors[colorScheme].primary },
            ]}
            rounded="m"
          >
            <ThemedText
              weight="semiBold"
              style={styles.buttonText}
              onPress={handleRegisterPushNotifications}
            >
              Activar notificaciones en este dispositivo
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.m,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  section: {
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: Spacing.s,
  },
  sectionDescription: {
    marginBottom: Spacing.m,
    opacity: 0.7,
  },
  permissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
    marginBottom: Spacing.s,
  },
  button: {
    padding: Spacing.m,
    alignItems: "center",
    marginTop: Spacing.m,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
