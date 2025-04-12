// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";
import { useNotification } from "@/context/NotificationContext";

export function useAuth() {
  const authStore = useAuthStore();
  const { showNotification } = useNotification();

  // Estado local para rastrear la inicialización
  const [isInitializing, setIsInitializing] = useState(
    authStore.initialized ? false : true
  );

  // Actualizar estado de inicialización cuando cambie en el store
  useEffect(() => {
    if (authStore.initialized) {
      setIsInitializing(false);
    }
  }, [authStore.initialized]);

  // Función para redirigir al usuario según su estado de autenticación
  const requireAuth = () => {
    if (!isInitializing && !authStore.user) {
      // Solo redirigir si ya se inicializó y no hay usuario
      router.replace("/(auth)/login");
      return false;
    }
    return true;
  };

  // Función para comprobar si el usuario está autenticado
  const isUserAuthenticated = () => {
    if (isInitializing) return false;
    return !!authStore.user;
  };

  // Función para redirigir si el usuario ya está autenticado
  const redirectIfAuthenticated = (path = "/(tabs)") => {
    if (!isInitializing && authStore.user) {
      // Solo redirigir si ya se inicializó y hay usuario
      setTimeout(() => {
        router.replace(path as any);
      }, 0);
      return true;
    }
    return false;
  };

  // Función para iniciar sesión con protección contra errores
  const safeSignIn = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        showNotification("Por favor ingresa tu email y contraseña", "error");
        return false;
      }

      await authStore.signInWithEmail(email, password);
      showNotification("Inicio de sesión exitoso", "success");
      return true;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      showNotification(
        `Error al iniciar sesión: ${(error as Error).message}`,
        "error"
      );
      return false;
    }
  };

  // Función para registro con protección contra errores
  const safeSignUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      if (!email || !password || !displayName) {
        showNotification("Por favor completa todos los campos", "error");
        return false;
      }

      if (password.length < 6) {
        showNotification(
          "La contraseña debe tener al menos 6 caracteres",
          "error"
        );
        return false;
      }

      await authStore.signUpWithEmail(email, password, displayName);
      showNotification("Registro exitoso", "success");
      return true;
    } catch (error) {
      console.error("Error al registrarse:", error);
      showNotification(
        `Error al registrarse: ${(error as Error).message}`,
        "error"
      );
      return false;
    }
  };

  return {
    ...authStore,
    isInitializing,
    requireAuth,
    redirectIfAuthenticated,
    isUserAuthenticated,
    safeSignIn,
    safeSignUp,
  };
}
