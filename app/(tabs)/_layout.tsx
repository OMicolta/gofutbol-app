// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NotificationBadge } from "@/components/ui/NotificationBadge";
import { useInvitations } from "@/hooks/useInvitations";
import { useNotificationStore } from "@/store/notificationStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, isInitializing, requireAuth } = useAuth();
  const { pendingInvitations, loadPendingInvitations } = useInvitations();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // Verificar autenticación al montar el componente, pero sin redirecciones automáticas
  // para evitar problemas de navegación prematura
  useEffect(() => {
    // Usamos un timeout para asegurarnos de que la redirección ocurra después del montaje
    const checkAuth = setTimeout(() => {
      requireAuth();
    }, 100);

    return () => clearTimeout(checkAuth);
  }, []);

  // Cargar invitaciones y notificaciones al inicializarse el componente
  useEffect(() => {
    if (user) {
      loadPendingInvitations();
      fetchUnreadCount();
    }
  }, [user]);

  // Mostrar pantalla de carga mientras se inicializa
  if (isInitializing) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={{ marginTop: Spacing.m }}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  // Si no hay usuario después de la inicialización, requerirá autenticación en el useEffect
  if (!user) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={{ marginTop: Spacing.m }}>
          Verificando sesión...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {
            backgroundColor: Colors[colorScheme].backgroundSecondary,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fields"
        options={{
          title: "Canchas",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="field.soccer" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Partidos",
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={28} name="soccer.ball" color={color} />
              {pendingInvitations.length > 0 && (
                <NotificationBadge count={pendingInvitations.length} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={28} name="person.fill" color={color} />
              {unreadCount > 0 && (
                <NotificationBadge
                  count={unreadCount}
                  size="small"
                  position="topRight"
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
