// context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotification } from "@/context/NotificationContext";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "@/components/ThemedText";

// Definir el tipo para el contexto de autenticación
type AuthContextType = {
  isInitialized: boolean;
  isAuthenticated: boolean;
};

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para acceder al contexto desde cualquier componente
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

// Propiedades del componente provider
interface AuthProviderProps {
  children: React.ReactNode;
}

// Componente provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authStore = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const { showNotification } = useNotification();
  const colorScheme = useColorScheme();

  // Inicializar autenticación al montar el componente
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authStore.initialize();
      } catch (error) {
        console.error("Error initializing auth:", error);
        showNotification("Error al inicializar la autenticación", "error");
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // No renderizar nada hasta que la autenticación esté inicializada
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={{ marginTop: 10 }}>Iniciando sesión...</ThemedText>
      </View>
    );
  }

  // Determinar si hay un usuario autenticado
  const isAuthenticated = !!authStore.user;

  // Proporcionar el contexto a los componentes hijos sin redirecciones automáticas
  return (
    <AuthContext.Provider value={{ isInitialized, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
