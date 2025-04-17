// app/profile/edit.tsx

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
  Image,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";
import { Card } from "@/components/ui/Card";
import { UsernameModal } from "@/components/auth/UsernameModal";

// Lista de posiciones de jugador disponibles
const POSITIONS = [
  { id: "portero", name: "Portero" },
  { id: "defensa", name: "Defensa" },
  { id: "mediocampista", name: "Mediocampista" },
  { id: "delantero", name: "Delantero" },
  { id: "multiposicion", name: "Multiposición" },
];

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const {
    user,
    profile,
    updateUserProfile,
    isLoading,
    error,
    clearError,
    clearAuthError,
    safeUpdateProfile,
  } = useAuth();
  const { showNotification } = useNotification();

  // Estados para los campos del formulario
  const [displayName, setDisplayName] = useState("");
  const [position, setPosition] = useState("");
  const [zone, setZone] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isPhotoChanged, setIsPhotoChanged] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Estado para validación
  const [formErrors, setFormErrors] = useState<{
    displayName?: string;
  }>({});

  // Cargar datos actuales del perfil cuando el componente se monta
  useEffect(() => {
    // Limpiar cualquier error previo
    clearAuthError();
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPosition(profile.position || "");
      setZone(profile.zone || "");
      setPhotoURL(profile.photoURL);
    }
  }, [profile]);

  // Validar formulario
  const validateForm = () => {
    const errors: { displayName?: string } = {};
    let isValid = true;

    if (!displayName.trim()) {
      errors.displayName = "El nombre es obligatorio";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Manejar cambio de foto de perfil
  const handleChangePhoto = async () => {
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
              onPress: () => {
                // Abrir configuración del dispositivo
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
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
        setPhotoURL(result.assets[0].uri);
        setIsPhotoChanged(true);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      showNotification("Error al seleccionar imagen", "error");
    }
  };

  // Función para manejar la actualización del nombre de usuario
  const handleUpdateUsername = async (username: string) => {
    if (!user || !profile) return false;

    try {
      // Actualizar perfil con el nuevo username
      const success = await safeUpdateProfile({
        ...profile,
        username,
      });

      if (success) {
        showNotification(
          "Nombre de usuario actualizado correctamente",
          "success"
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al actualizar nombre de usuario:", error);
      showNotification(`Error: ${(error as Error).message}`, "error");
      return false;
    }
  };

  // Manejar guardar cambios
  const handleSaveChanges = async () => {
    if (!validateForm()) {
      showNotification(
        "Por favor corrige los errores en el formulario",
        "error"
      );
      return;
    }

    if (!user || !profile) {
      showNotification(
        "Error: No se pudo acceder a la información del perfil",
        "error"
      );
      return;
    }

    try {
      // Preparar datos actualizados
      const updatedProfile = {
        ...profile,
        displayName,
        position,
        zone,
      };

      // Si la foto ha cambiado, simular carga
      if (isPhotoChanged && photoURL) {
        setUploadingPhoto(true);

        // En una implementación real, aquí subiríamos la foto a Storage
        // y obtendríamos la URL para actualizar el perfil

        // Simulamos un pequeño delay para mostrar la carga
        await new Promise((resolve) => setTimeout(resolve, 1000));

        updatedProfile.photoURL = photoURL;
        setUploadingPhoto(false);
      }

      // Actualizar perfil
      await updateUserProfile(updatedProfile);

      showNotification("Perfil actualizado correctamente", "success");

      // Regresar a la pantalla de perfil
      router.back();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      showNotification(
        `Error al actualizar perfil: ${(error as Error).message}`,
        "error"
      );
    }
  };

  if (isLoading && !profile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={styles.loadingText}>
          Cargando información del perfil...
        </ThemedText>
      </ThemedView>
    );
  }

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
            <ThemedText type="title">Editar Perfil</ThemedText>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Foto de perfil */}
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={handleChangePhoto}
                disabled={uploadingPhoto}
              >
                {photoURL ? (
                  <Image
                    source={{ uri: photoURL }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <ThemedView style={styles.photoPlaceholder} rounded>
                    <ThemedText style={styles.photoPlaceholderText}>
                      {displayName.substring(0, 1).toUpperCase()}
                    </ThemedText>
                  </ThemedView>
                )}

                {uploadingPhoto && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="white" />
                  </View>
                )}

                <View style={styles.editPhotoButton}>
                  <IconSymbol name="pencil" size={18} color="white" />
                </View>
              </TouchableOpacity>
              <ThemedText type="caption" secondary style={styles.photoHint}>
                Toca para cambiar tu foto de perfil
              </ThemedText>
            </View>

            {/* Campos del formulario */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Información personal
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText type="body">Nombre completo</ThemedText>
                <ThemedView
                  style={[
                    styles.inputContainer,
                    formErrors.displayName ? styles.inputError : null,
                  ]}
                  variant="secondary"
                  rounded
                >
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholder="Ingresa tu nombre completo"
                    placeholderTextColor={Colors[colorScheme].textSecondary}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </ThemedView>
                {formErrors.displayName && (
                  <ThemedText type="caption" style={styles.errorText}>
                    {formErrors.displayName}
                  </ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body">Posición preferida</ThemedText>
                <ThemedView
                  style={styles.positionsContainer}
                  variant="secondary"
                  rounded
                >
                  {POSITIONS.map((pos) => (
                    <TouchableOpacity
                      key={pos.id}
                      style={[
                        styles.positionChip,
                        position === pos.id && styles.selectedPosition,
                      ]}
                      onPress={() => setPosition(pos.id)}
                    >
                      <ThemedText
                        style={
                          position === pos.id
                            ? styles.selectedPositionText
                            : undefined
                        }
                      >
                        {pos.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body">Zona donde juegas</ThemedText>
                <ThemedView
                  style={styles.inputContainer}
                  variant="secondary"
                  rounded
                >
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholder="Ej: Norte, Sur, Centro"
                    placeholderTextColor={Colors[colorScheme].textSecondary}
                    value={zone}
                    onChangeText={setZone}
                  />
                </ThemedView>
              </View>
            </View>

            {/* Sección de nombre de usuario */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Nombre de usuario
              </ThemedText>

              <ThemedView
                style={styles.usernameDisplay}
                variant="secondary"
                rounded
              >
                <View style={styles.usernameRow}>
                  <ThemedText type="body" weight="semiBold">
                    @{profile?.username || "Sin nombre de usuario"}
                  </ThemedText>
                  <Button
                    title="Cambiar"
                    size="small"
                    variant="ghost"
                    onPress={() => setShowUsernameModal(true)}
                  />
                </View>
                <ThemedText
                  type="caption"
                  secondary
                  style={styles.usernameHint}
                >
                  Tu identificador único en la plataforma
                </ThemedText>
              </ThemedView>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
              <Button
                title="Cancelar"
                variant="outlined"
                size="medium"
                onPress={() => router.back()}
                style={styles.actionButton}
              />
              <Button
                title={isLoading ? "Guardando..." : "Guardar cambios"}
                size="medium"
                onPress={handleSaveChanges}
                disabled={isLoading}
                style={styles.actionButton}
              />
            </View>

            {error && (
              <ThemedText type="caption" style={styles.errorText}>
                {error}
              </ThemedText>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal para cambiar nombre de usuario */}
      <UsernameModal
        visible={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        initialUsername={profile?.username || ""}
        displayName={profile?.displayName || ""}
        onUsernameSelected={handleUpdateUsername}
      />
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
  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  photoContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.s,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primary + "40",
  },
  photoPlaceholderText: {
    fontSize: 48,
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
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  photoHint: {
    marginTop: Spacing.xs,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  inputGroup: {
    marginBottom: Spacing.m,
  },
  inputContainer: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.m,
    paddingVertical: Platform.OS === "ios" ? Spacing.s : 0,
  },
  input: {
    fontSize: 16,
    height: 50,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.light.danger,
  },
  errorText: {
    color: Colors.light.danger,
    marginTop: Spacing.xs,
  },
  positionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
    padding: Spacing.m,
    marginTop: Spacing.xs,
  },
  positionChip: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: Spacing.xs,
  },
  selectedPosition: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  selectedPositionText: {
    color: "white",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.m,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  usernameSection: {
    marginBottom: Spacing.m,
  },
  usernameDisplay: {
    padding: Spacing.m,
  },
  usernameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usernameHint: {
    marginTop: Spacing.xs,
  },
});
