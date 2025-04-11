// components/auth/GoogleAuthButton.tsx
import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/Colors";

interface GoogleAuthButtonProps {
  text?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function GoogleAuthButton({
  text = "Continuar con Google",
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const { processGoogleCredential } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Configurar solicitud de autenticación de Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Reemplaza estos valores con tus propios IDs de cliente
    clientId: "TU_WEB_CLIENT_ID",
    iosClientId: "TU_IOS_CLIENT_ID",
    androidClientId: "TU_ANDROID_CLIENT_ID",
  });

  // Monitorear cambios en la respuesta de autenticación
  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      handleGoogleAuth(response.authentication.idToken);
    } else if (response?.type === "error") {
      setIsAuthenticating(false);
      if (onError) onError(new Error("Error en la autenticación con Google"));
    }
  }, [response]);

  // Manejar autenticación con Google
  const handleGoogleAuth = async (idToken: string) => {
    try {
      // Procesar token con Firebase
      await processGoogleCredential(idToken);
      setIsAuthenticating(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      setIsAuthenticating(false);
      if (onError) onError(error as Error);
      console.error("Error en autenticación con Google:", error);
    }
  };

  // Iniciar flujo de autenticación
  const handleLogin = async () => {
    setIsAuthenticating(true);
    await promptAsync();
  };

  return (
    <Button
      title={isAuthenticating ? "Conectando..." : text}
      variant="outlined"
      size="large"
      fullWidth
      onPress={handleLogin}
      disabled={isAuthenticating || !request}
      leftIcon={isAuthenticating ? undefined : "chevron.right"}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    marginRight: Spacing.s,
  },
});
