// context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useNotification } from "@/context/NotificationContext";

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
    return null; // Seguimos mostrando la splash screen mientras se inicializa
  }

  // Determinar si hay un usuario autenticado
  const isAuthenticated = !!authStore.user;

  // Redirigir según el estado de autenticación
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Proporcionar el contexto a los componentes hijos
  return (
    <AuthContext.Provider value={{ isInitialized, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
