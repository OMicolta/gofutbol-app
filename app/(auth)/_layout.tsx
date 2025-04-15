// app/(auth)/_layout.tsx

import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthLayout() {
  const { isInitializing, user, redirectIfAuthenticated } = useAuth();

  // Verificar autenticación al montar el componente
  // Retrasamos la redirección para evitar problemas de navegación prematura
  useEffect(() => {
    if (!isInitializing && user) {
      // Usamos un timeout para asegurarnos de que la redirección ocurra después del montaje
      const checkAuth = setTimeout(() => {
        redirectIfAuthenticated();
      }, 100);

      return () => clearTimeout(checkAuth);
    }
  }, [isInitializing, user]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="recover-password" />
    </Stack>
  );
}
