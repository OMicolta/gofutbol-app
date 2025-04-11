// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";

export function useAuth() {
  const authStore = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Inicializar el auth store al montar el componente
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authStore.initialize();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Función para redirigir al usuario según su estado de autenticación
  const requireAuth = () => {
    if (!isInitializing && !authStore.user) {
      // Si ya terminó de inicializar y no hay usuario, redirigir a login
      router.replace("/(auth)/login" as any);
      return false;
    }
    return true;
  };

  // Función para redirigir si el usuario ya está autenticado
  const redirectIfAuthenticated = (path = "/(tabs)") => {
    if (!isInitializing && authStore.user) {
      // Si ya terminó de inicializar y hay usuario, redirigir al path
      router.replace(path as any);
      return true;
    }
    return false;
  };

  return {
    ...authStore,
    isInitializing,
    requireAuth,
    redirectIfAuthenticated,
  };
}
