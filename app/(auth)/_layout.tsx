// app/(auth)/_layout.tsx

import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthLayout() {
  const { redirectIfAuthenticated } = useAuth();

  // Verificar si el usuario ya está autenticado y redirigir si es necesario
  useEffect(() => {
    redirectIfAuthenticated();
  }, []);

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
