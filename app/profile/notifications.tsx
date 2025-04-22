// app\profile\notifications.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Spacing, Typography } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotificationStore } from "@/store/notificationStore";
import { Notification } from "@/types/notification";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const {
    notifications,
    fetchNotifications,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
  } = useNotificationStore();

  // Cargar notificaciones al montar
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refrescar notificaciones
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = () => {
    Alert.alert(
      "Marcar todas como leídas",
      "¿Estás seguro de que quieres marcar todas las notificaciones como leídas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar todas",
          onPress: () => markAllAsRead(),
        },
      ]
    );
  };

  // Manejar toque en notificación
  const handleNotificationPress = async (notification: Notification) => {
    // Marcar como leída
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Navegar a la pantalla objetivo si existe
    if (notification.targetScreen) {
      router.push({
        pathname: notification.targetScreen as any,
        params:
          (notification.targetParams as Record<string, string | number>) || {},
      });
    }
  };

  // Eliminar notificación
  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que quieres eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);

    if (isToday(date)) {
      return `Hoy, ${format(date, "HH:mm")}`;
    } else if (isYesterday(date)) {
      return `Ayer, ${format(date, "HH:mm")}`;
    } else {
      return format(date, "dd MMM, HH:mm", { locale: es });
    }
  };

  // Ícono según tipo de notificación
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "match_invitation":
        return { name: "envelope.fill", color: Colors[colorScheme].primary };
      case "match_reminder":
        return { name: "bell.fill", color: Colors[colorScheme].warning };
      case "match_update":
        return { name: "info.circle.fill", color: Colors[colorScheme].info };
      case "match_cancelled":
        return { name: "xmark.circle.fill", color: Colors[colorScheme].danger };
      case "player_joined":
      case "player_left":
      case "team_changed":
        return { name: "person.fill", color: Colors[colorScheme].secondary };
      case "rating_reminder":
        return { name: "star.fill", color: Colors[colorScheme].warning };
      default:
        return { name: "bell.fill", color: Colors[colorScheme].info };
    }
  };

  // Renderizar elemento de notificación
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color }]}>
          <IconSymbol name={icon.name as any} size={20} color="white" />
        </View>

        <View style={styles.contentContainer}>
          <ThemedText weight="semiBold" style={styles.notificationTitle}>
            {item.title}
          </ThemedText>

          <ThemedText style={styles.notificationBody}>{item.body}</ThemedText>

          <ThemedText style={styles.notificationTime}>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
        >
          <IconSymbol
            name={"trash" as any}
            size={18}
            color={Colors[colorScheme].textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Renderizar contenido principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
          <ThemedText style={styles.loadingText}>
            Cargando notificaciones...
          </ThemedText>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name={"bell.slash.fill" as any}
            size={60}
            color={Colors[colorScheme].textDisabled}
          />
          <ThemedText weight="medium" style={styles.emptyText}>
            No tienes notificaciones
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Las notificaciones sobre partidos y amigos aparecerán aquí
          </ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors[colorScheme].primary]}
            tintColor={Colors[colorScheme].primary}
          />
        }
      />
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: "Notificaciones",
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleMarkAllAsRead}
              disabled={notifications.length === 0 || isLoading}
            >
              <ThemedText
                weight="medium"
                style={[
                  styles.headerButtonText,
                  (notifications.length === 0 || isLoading) &&
                    styles.disabledText,
                ]}
              >
                Marcar todas
              </ThemedText>
            </TouchableOpacity>
          ),
        }}
      />
      {renderContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: Spacing.m,
  },
  headerButtonText: {
    color: Colors.light.primary,
    fontSize: Typography.fontSizes.m,
  },
  disabledText: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.l,
  },
  emptyText: {
    fontSize: 18,
    marginTop: Spacing.m,
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: Spacing.s,
    opacity: 0.7,
  },
  listContent: {
    padding: Spacing.m,
  },
  notificationItem: {
    flexDirection: "row",
    padding: Spacing.m,
    borderRadius: 10,
    marginBottom: Spacing.m,
  },
  unreadNotification: {
    backgroundColor: "rgba(29, 185, 84, 0.1)", // Primary color with opacity
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.m,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.fontSizes.m,
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: Typography.fontSizes.s,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: Typography.fontSizes.xs,
    opacity: 0.7,
  },
  deleteButton: {
    padding: Spacing.s,
    justifyContent: "center",
  },
});
