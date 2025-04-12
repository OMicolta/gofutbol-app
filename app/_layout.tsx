// app/_layout.tsx

import { useFonts } from "expo-font";
import { Slot, Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ThemeProvider from "@/components/ThemeProvider";
import { NotificationProvider } from "@/context/NotificationContext";
import { useAuthStore } from "@/store/authStore";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const authStore = useAuthStore();
  const [authInitialized, setAuthInitialized] = useState(false);

  // Inicializar la autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authStore.initialize();
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setAuthInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Ocultar pantalla de splash cuando todo esté listo
  useEffect(() => {
    if (loaded && authInitialized) {
      SplashScreen.hideAsync().catch(() => {
        // Ignorar errores al ocultar splash screen
      });
    }
  }, [loaded, authInitialized]);

  // Mostrar nada mientras carga
  if (!loaded || !authInitialized) {
    return null;
  }

  // Determinar si hay un usuario autenticado
  const isAuthenticated = !!authStore.user;

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NotificationProvider>
          {isAuthenticated ? (
            <AuthenticatedLayout />
          ) : (
            <UnauthenticatedLayout />
          )}
        </NotificationProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

// Componente para usuarios autenticados - Este se renderiza DESPUÉS de que ThemeProvider esté disponible
function AuthenticatedLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="field/[id]" />
        <Stack.Screen name="field/book" />
        <Stack.Screen name="match/[id]" />
        <Stack.Screen name="match/create" />
        <Stack.Screen name="match/edit/[id]" />
        <Stack.Screen name="ratings/pending" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

// Componente para usuarios no autenticados - Este se renderiza DESPUÉS de que ThemeProvider esté disponible
function UnauthenticatedLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
