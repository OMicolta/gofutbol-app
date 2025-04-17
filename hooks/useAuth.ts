// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { useAuthStore, UserProfile } from "@/store/authStore";
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

  // Función para verificar si el usuario está autenticado y redirigir si es necesario
  // Con protección contra navegación prematura
  const requireAuth = () => {
    if (isInitializing) {
      return false;
    }

    if (!authStore.user) {
      try {
        router.push("/(auth)/login");
        return false;
      } catch (error) {
        console.error("Error de navegación en requireAuth:", error);
        return false;
      }
    } else if (needsUsernameSetup()) {
      // Si el usuario necesita configurar username, redirigir a esa pantalla
      try {
        router.push("/setup-username");
        return false;
      } catch (error) {
        console.error("Error de navegación en requireAuth:", error);
        return false;
      }
    }
    return true;
  };

  // Función para comprobar si el usuario está autenticado
  const isUserAuthenticated = () => {
    if (isInitializing) return false;
    return !!authStore.user;
  };

  const needsUsernameSetup = () => {
    return (
      !!authStore.user &&
      (!authStore.profile?.username || authStore.profile.username === "")
    );
  };

  // Función para redirigir si el usuario ya está autenticado
  // Con protección contra navegación prematura
  const redirectIfAuthenticated = (path = "/(tabs)") => {
    if (isInitializing) {
      return false;
    }

    if (authStore.user) {
      // Si el usuario necesita configurar username, redirigir a esa pantalla
      if (needsUsernameSetup()) {
        try {
          // Usamos navegación push para evitar problemas con router.replace
          router.push("/setup-username" as any);
          return true;
        } catch (error) {
          console.error("Error de navegación:", error);
          return false;
        }
      } else {
        try {
          // Usamos navegación push para evitar problemas con router.replace
          router.push(path as any);
          return true;
        } catch (error) {
          console.error("Error de navegación:", error);
          return false;
        }
      }
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

  // Función segura para actualizar perfil con manejo de errores
  const safeUpdateProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      if (!authStore.user || !authStore.profile) {
        showNotification(
          "Debes iniciar sesión para actualizar tu perfil",
          "error"
        );
        return false;
      }

      await authStore.updateUserProfile(updatedProfile);
      showNotification("Perfil actualizado correctamente", "success");
      return true;
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      showNotification(
        `Error al actualizar perfil: ${(error as Error).message}`,
        "error"
      );
      return false;
    }
  };

  // Función para limpiar errores
  const clearAuthError = () => {
    if (authStore.clearError) {
      authStore.clearError();
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
    safeUpdateProfile,
    clearAuthError,
    needsUsernameSetup,
  };
}
