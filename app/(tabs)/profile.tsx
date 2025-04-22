// app/(tabs)/profile.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useRatings } from "@/hooks/useRatings";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationBadge } from "@/components/ui/NotificationBadge";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const {
    user,
    profile,
    logout,
    updateUserProfile,
    isLoading,
    error,
    requireAuth,
  } = useAuth();
  const { pendingRatings, refreshPendingRatings } = useRatings();
  const { showNotification } = useNotification();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  const [uploading, setUploading] = useState(false);

  // Verificar autenticación al montar componente
  useEffect(() => {
    requireAuth();
  }, []);

  // Cargar calificaciones pendientes y notificaciones
  useEffect(() => {
    if (user) {
      refreshPendingRatings();
      fetchUnreadCount();
    }
  }, [user]);

  // Manejar cierre de sesión
  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(auth)/login" as any);
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              showNotification("Error al cerrar sesión", "error");
            }
          },
        },
      ]
    );
  };

  // Manejar cambio de imagen de perfil
  const handleChangeProfileImage = async () => {
    try {
      // Solicitar permiso para acceder a la galería
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permiso denegado",
          "Se necesita acceso a la galería para cambiar la imagen de perfil.",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Configuración",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);

        // Esta es una versión simplificada - en una implementación real
        // subiríamos la imagen a Firebase Storage y obtendríamos una URL

        // Simular una carga
        setTimeout(async () => {
          try {
            // En una implementación real, aquí actualizaríamos el perfil con la URL de la imagen
            // Aquí solo actualizamos el estado local para simular
            await updateUserProfile({
              ...profile!,
              photoURL: result.assets[0].uri,
            });

            showNotification("Imagen de perfil actualizada", "success");
          } catch (error) {
            console.error("Error al actualizar imagen:", error);
            showNotification("Error al actualizar imagen", "error");
          } finally {
            setUploading(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      showNotification("Error al seleccionar imagen", "error");
    }
  };

  // Manejar edición de perfil
  const handleEditProfile = () => {
    router.push("/profile/edit" as any);
  };

  // Navegar a calificaciones pendientes
  const handlePendingRatings = () => {
    if (pendingRatings.length > 0) {
      router.push("/ratings/pending" as any);
    }
  };

  // Agregamos las funciones para navegar a las pantallas de notificaciones
  const handleNotifications = () => {
    router.push("/profile/notifications" as any);
  };

  const handleNotificationSettings = () => {
    router.push("/profile/notification-settings" as any);
  };

  if (isLoading || !user || !profile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={styles.loadingText}>Cargando perfil...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SafeAreaView edges={["top"]}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Mi Perfil</ThemedText>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotifications}
            >
              <IconSymbol
                name="bell.fill"
                size={24}
                color={Colors[colorScheme].text}
              />
              {unreadCount > 0 && (
                <NotificationBadge
                  count={unreadCount}
                  position="topRight"
                  size="small"
                />
              )}
            </TouchableOpacity>
          </ThemedView>

          {/* Información del perfil */}
          <View style={styles.profileSection}>
            <Card style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={handleChangeProfileImage}
                  disabled={uploading}
                >
                  {profile.photoURL ? (
                    <Image
                      source={{ uri: profile.photoURL }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <ThemedView
                      style={styles.avatarPlaceholder}
                      variant="secondary"
                      rounded
                    >
                      <ThemedText style={styles.avatarText}>
                        {profile.displayName?.substring(0, 1).toUpperCase() ||
                          "U"}
                      </ThemedText>
                    </ThemedView>
                  )}

                  {uploading && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator color="white" />
                    </View>
                  )}

                  <ThemedView style={styles.changePhotoButton} rounded>
                    <ThemedText type="caption">
                      <IconSymbol name="pencil" size={16} color="white" />
                    </ThemedText>
                  </ThemedView>
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  <ThemedText type="heading">{profile.displayName}</ThemedText>

                  <ThemedText type="caption" secondary>
                    @{profile.username || "sin_username"}
                  </ThemedText>

                  <ThemedText type="body" secondary>
                    {profile.position || "Posición no especificada"}
                  </ThemedText>

                  <View style={styles.matchesBadge}>
                    <IconSymbol name="soccer.ball" size={16} color="white" />
                    <ThemedText style={styles.matchesText}>
                      {profile.stats?.totalMatches || 0} partidos
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Calificaciones pendientes (si hay) */}
          {pendingRatings.length > 0 && (
            <View style={styles.pendingRatingsSection}>
              <Card onPress={handlePendingRatings}>
                <View style={styles.pendingRatingsContent}>
                  <View>
                    <ThemedText type="body" weight="semiBold">
                      Tienes {pendingRatings.length}{" "}
                      {pendingRatings.length === 1 ? "partido" : "partidos"} por
                      calificar
                    </ThemedText>
                    <ThemedText type="caption" secondary>
                      Califica a tus compañeros de juego
                    </ThemedText>
                  </View>
                  <Button title="Calificar" size="small" variant="outlined" />
                </View>
              </Card>
            </View>
          )}

          {/* Estadísticas del jugador */}
          <View style={styles.statsSection}>
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Estadísticas
            </ThemedText>
            <Card>
              <View style={styles.statRow}>
                <ThemedText type="body">Asistencia</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {Math.round((profile.stats?.attendanceRate || 0) * 100)}%
                </ThemedText>
              </View>
              <View style={styles.divider} />

              <View style={styles.statRow}>
                <ThemedText type="body">Puntualidad</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {(profile.stats?.punctualityAvg || 0).toFixed(1)}/5
                </ThemedText>
              </View>
              <View style={styles.divider} />

              <View style={styles.statRow}>
                <ThemedText type="body">Actitud</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {(profile.stats?.attitudeAvg || 0).toFixed(1)}/5
                </ThemedText>
              </View>
              <View style={styles.divider} />

              <View style={styles.statRow}>
                <ThemedText type="body">Votos MVP</ThemedText>
                <ThemedText type="body" weight="semiBold">
                  {profile.stats?.mvpVotes || 0}
                </ThemedText>
              </View>
            </Card>
          </View>

          {/* Selector de tema */}
          <View style={styles.themeSection}>
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Preferencias
            </ThemedText>
            <ThemeSelector />
          </View>

          {/* Sección de Configuración */}
          <View style={styles.settingsSection}>
            <ThemedText type="heading" style={styles.sectionTitle}>
              Configuración
            </ThemedText>

            <Card style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleEditProfile}
              >
                <View style={styles.settingIcon}>
                  <IconSymbol
                    name="person.fill"
                    size={20}
                    color={Colors[colorScheme].primary}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <ThemedText type="body" weight="medium">
                    Editar Perfil
                  </ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={Colors[colorScheme].textSecondary}
                />
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleNotificationSettings}
              >
                <View style={styles.settingIcon}>
                  <IconSymbol
                    name="bell.fill"
                    size={20}
                    color={Colors[colorScheme].primary}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <ThemedText type="body" weight="medium">
                    Notificaciones
                  </ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={Colors[colorScheme].textSecondary}
                />
              </TouchableOpacity>

              <View style={styles.separator} />

              {/* ...otros elementos de configuración... */}
            </Card>
          </View>

          {/* Acciones de la cuenta */}
          <View style={styles.accountSection}>
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Cuenta
            </ThemedText>
            <Card>
              <Button
                title="Cerrar sesión"
                variant="ghost"
                color="danger"
                fullWidth
                onPress={handleLogout}
              />
            </Card>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.versionText} secondary>
              GoFutbol v1.0.0
            </ThemedText>

            {error && (
              <ThemedText style={styles.errorText} secondary>
                Error: {error}
              </ThemedText>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.m,
  },
  profileSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  profileCard: {
    padding: Spacing.m,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: Spacing.m,
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primary + "40",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: Colors.light.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    flex: 1,
  },
  matchesBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: Spacing.s,
  },
  matchesText: {
    color: "white",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
  },
  pendingRatingsSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  pendingRatingsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
  },
  themeSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  accountSection: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.l,
  },
  footer: {
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xl,
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.danger,
    marginTop: Spacing.s,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  notificationButton: {
    padding: Spacing.s,
    position: "relative",
  },
  settingsSection: {
    marginTop: Spacing.l,
    paddingHorizontal: Spacing.l,
  },
  settingsCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.light.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.m,
  },
  settingTextContainer: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: `${Colors.light.textDisabled}20`,
  },
});
