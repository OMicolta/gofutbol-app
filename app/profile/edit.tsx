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
                    resizeMode="cover"
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
                  <IconSymbol name="camera.fill" size={16} color="white" />
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
                <ThemedText type="body" weight="semiBold">
                  Nombre completo
                </ThemedText>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <IconSymbol
                      name="person.fill"
                      size={20}
                      color={Colors[colorScheme].textSecondary}
                    />
                  </View>
                  <View style={styles.inputDivider} />
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholder="Ingresa tu nombre completo"
                    placeholderTextColor={Colors[colorScheme].textSecondary}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </View>
                {formErrors.displayName && (
                  <ThemedText type="caption" style={styles.errorText}>
                    {formErrors.displayName}
                  </ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" weight="semiBold">
                  Posición preferida
                </ThemedText>
                <View style={styles.positionsContainer}>
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
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" weight="semiBold">
                  Zona donde juegas
                </ThemedText>
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <IconSymbol
                      name="location.fill"
                      size={20}
                      color={Colors[colorScheme].textSecondary}
                    />
                  </View>
                  <View style={styles.inputDivider} />
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholder="Ej: Norte, Sur, Centro"
                    placeholderTextColor={Colors[colorScheme].textSecondary}
                    value={zone}
                    onChangeText={setZone}
                  />
                </View>
              </View>
            </View>

            {/* Sección de nombre de usuario */}
            <View style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Nombre de usuario
              </ThemedText>

              <View style={styles.usernameBox}>
                <View style={styles.usernameRow}>
                  <View style={styles.usernameInfoContainer}>
                    <ThemedText type="body" weight="semiBold">
                      @{profile?.username || "Sin nombre de usuario"}
                    </ThemedText>
                    <ThemedText
                      type="caption"
                      secondary
                      style={styles.usernameHint}
                    >
                      Tu identificador único en la plataforma
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.changeUsernameBtn}
                    onPress={() => setShowUsernameModal(true)}
                  >
                    <ThemedText
                      style={styles.changeUsernameText}
                      weight="semiBold"
                    >
                      Cambiar
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveChanges}
                disabled={isLoading}
              >
                <ThemedText style={styles.saveText}>
                  {isLoading ? "Guardando..." : "Guardar cambios"}
                </ThemedText>
              </TouchableOpacity>
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
    padding: Spacing.m,
    paddingHorizontal: Spacing.l,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.m,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.l,
    paddingVertical: Spacing.l,
  },
  photoContainer: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    marginBottom: Spacing.s,
  },
  profilePhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  photoPlaceholderText: {
    fontSize: 36,
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
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  photoHint: {
    marginTop: Spacing.s,
    fontSize: 12,
  },
  formSection: {
    marginBottom: Spacing.m,
    paddingHorizontal: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  inputGroup: {
    marginBottom: Spacing.m,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Shape.radius.m,
    marginTop: Spacing.xs,
    backgroundColor: "white",
  },
  iconContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    justifyContent: "center",
    alignItems: "center",
    width: 48,
  },
  inputDivider: {
    width: 1,
    height: "70%",
    backgroundColor: Colors.light.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 46,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.light.danger,
  },
  errorText: {
    color: Colors.light.danger,
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  positionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  positionChip: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.xs,
    backgroundColor: "white",
  },
  selectedPosition: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  selectedPositionText: {
    color: "white",
    fontWeight: "600",
  },
  usernameBox: {
    padding: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Shape.radius.m,
    marginTop: Spacing.xs,
    backgroundColor: "white",
  },
  usernameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usernameInfoContainer: {
    flex: 1,
  },
  usernameHint: {
    marginTop: Spacing.xs,
    fontSize: 12,
    opacity: 0.6,
  },
  changeUsernameBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
  },
  changeUsernameText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.l,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Shape.radius.m,
  },
  cancelText: {
    color: Colors.light.text,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Shape.radius.m,
  },
  saveText: {
    color: "white",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
});
