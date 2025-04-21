// components/match/InvitePlayersModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useInvitations } from "@/hooks/useInvitations";
import { UserProfile } from "@/store/authStore";
import { Colors, Spacing, Shape } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Función de utilidad para debounce (retrasar la ejecución de una función)
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface InvitePlayersModalProps {
  visible: boolean;
  onClose: () => void;
  matchId: string;
  existingPlayers: string[]; // IDs de jugadores ya en el partido
  onInvitationsSent?: () => void;
}

export function InvitePlayersModal({
  visible,
  onClose,
  matchId,
  existingPlayers,
  onInvitationsSent,
}: InvitePlayersModalProps) {
  const colorScheme = useColorScheme();
  const { searchUsers, invitePlayer, isLoading } = useInvitations();
  const windowHeight = Dimensions.get("window").height;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  // Aplicar debounce al término de búsqueda (esperar 500ms después de escribir)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Limpiar búsqueda al cerrar el modal
  useEffect(() => {
    if (!visible) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedUsers([]);
      setHasSearched(false);
    }
  }, [visible]);

  // Efecto para realizar búsqueda automática cuando cambia el término de búsqueda debounced
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      performSearch();
    }
  }, [debouncedSearchTerm]);

  // Realizar búsqueda
  const performSearch = useCallback(async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchUsers(searchTerm);

      // Filtrar usuarios ya en el partido
      const filteredResults = results.filter(
        (user) => !existingPlayers.includes(user.uid)
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, existingPlayers, searchUsers]);

  // Seleccionar/deseleccionar un usuario
  const toggleUserSelection = (user: UserProfile) => {
    const isSelected = selectedUsers.some((u) => u.uid === user.uid);

    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Enviar invitaciones
  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) return;

    setSendingInvitations(true);
    try {
      // Enviar invitaciones en paralelo
      const promises = selectedUsers.map((user) =>
        invitePlayer(matchId, user.uid)
      );
      await Promise.all(promises);

      // Notificar que se enviaron invitaciones
      if (onInvitationsSent) {
        onInvitationsSent();
      }

      // Cerrar modal después de enviar invitaciones
      onClose();
    } catch (error) {
      console.error("Error al enviar invitaciones:", error);
    } finally {
      setSendingInvitations(false);
    }
  };

  // Calcular altura dinámica para la lista de resultados
  const getResultsListHeight = () => {
    // Usar un porcentaje de la altura de la ventana, pero con un máximo
    return Math.min(windowHeight * 0.4, 300);
  };

  // Función para limpiar el campo de búsqueda
  const clearSearch = () => {
    setSearchTerm("");
    if (!isSearching) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <ThemedView style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <SafeAreaView style={styles.safeArea}>
            <ThemedView
              style={[
                styles.modalContainer,
                { maxHeight: windowHeight * 0.8 }, // Altura máxima dinámica
              ]}
              variant="card"
              rounded="m"
              shadow="m"
            >
              {/* Encabezado del modal */}
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Invitar Jugadores
                </ThemedText>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Campo de búsqueda mejorado */}
              <View style={styles.searchWrapper}>
                <ThemedView
                  style={[
                    styles.searchContainer,
                    searchInputFocused && styles.searchContainerFocused,
                  ]}
                  variant="secondary"
                  rounded
                >
                  <IconSymbol
                    name="person.fill"
                    size={20}
                    color={Colors[colorScheme].textSecondary}
                    style={styles.searchPersonIcon}
                  />
                  <TextInput
                    style={[
                      styles.searchInput,
                      { color: Colors[colorScheme].text },
                    ]}
                    placeholder="Buscar por nombre o @username"
                    placeholderTextColor={Colors[colorScheme].textSecondary}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={performSearch}
                    onFocus={() => setSearchInputFocused(true)}
                    onBlur={() => setSearchInputFocused(false)}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchTerm.length > 0 && (
                    <TouchableOpacity
                      onPress={clearSearch}
                      style={styles.clearButton}
                    >
                      <ThemedText style={styles.clearButtonText}>✕</ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>
              </View>

              {/* Texto descriptivo con estado dinámico */}
              <ThemedText type="caption" secondary style={styles.searchHint}>
                {searchTerm.length < 2
                  ? "Escribe al menos 2 caracteres para buscar"
                  : isSearching
                  ? "Buscando..."
                  : "La búsqueda es automática mientras escribes"}
              </ThemedText>

              {/* Indicador de búsqueda */}
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={Colors[colorScheme].primary}
                  />
                </View>
              )}

              {/* Resultados de búsqueda */}
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.uid}
                  style={[
                    styles.resultsList,
                    { maxHeight: getResultsListHeight() },
                  ]}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.userItem,
                        selectedUsers.some((u) => u.uid === item.uid) &&
                          styles.selectedUserItem,
                      ]}
                      onPress={() => toggleUserSelection(item)}
                    >
                      <View style={styles.userInfo}>
                        {item.photoURL ? (
                          <Image
                            source={{ uri: item.photoURL }}
                            style={styles.userAvatar}
                            contentFit="cover"
                          />
                        ) : (
                          <ThemedView style={styles.avatarPlaceholder} rounded>
                            <ThemedText style={styles.avatarText}>
                              {item.displayName
                                ?.substring(0, 1)
                                .toUpperCase() || "U"}
                            </ThemedText>
                          </ThemedView>
                        )}
                        <View>
                          <ThemedText weight="semiBold">
                            {item.displayName}
                          </ThemedText>
                          <ThemedText type="caption" secondary>
                            @{item.username || "sin_username"}
                          </ThemedText>
                        </View>
                      </View>
                      {selectedUsers.some((u) => u.uid === item.uid) && (
                        <IconSymbol
                          name="checkmark"
                          size={20}
                          color={Colors[colorScheme].primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              ) : hasSearched && !isSearching ? (
                <View style={styles.emptyResults}>
                  <ThemedText style={styles.emptyResultsText}>
                    No se encontraron jugadores. Intenta con otro nombre.
                  </ThemedText>
                </View>
              ) : null}

              {/* Botones de acción */}
              {selectedUsers.length > 0 && (
                <View style={styles.actionButtons}>
                  <Button
                    title={`Invitar ${selectedUsers.length} jugador${
                      selectedUsers.length !== 1 ? "es" : ""
                    }`}
                    size="medium"
                    fullWidth
                    onPress={handleSendInvitations}
                    loading={sendingInvitations}
                  />
                </View>
              )}
            </ThemedView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: Spacing.l,
  },
  keyboardAvoidingView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    width: "100%",
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "white", // El color se aplicará vía ThemedView
    borderRadius: Shape.radius.m,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    width: "100%",
  },
  searchWrapper: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchContainerFocused: {
    borderColor: Colors.light.primary + "50",
  },
  searchPersonIcon: {
    marginRight: Spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
    padding: 0,
  },
  clearButton: {
    padding: 5,
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.textSecondary,
  },
  searchHint: {
    paddingHorizontal: Spacing.l,
    marginBottom: Spacing.s,
    textAlign: "center",
    fontSize: 14,
  },
  loadingContainer: {
    padding: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  resultsList: {
    width: "100%",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  selectedUserItem: {
    backgroundColor: Colors.light.primary + "10",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.m,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primary + "20",
    marginRight: Spacing.m,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  emptyResults: {
    padding: Spacing.l,
    alignItems: "center",
  },
  emptyResultsText: {
    textAlign: "center",
  },
  actionButtons: {
    padding: Spacing.l,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
});
