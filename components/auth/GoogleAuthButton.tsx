// components/auth/GoogleAuthButton.tsx
import React, { useState, useEffect } from "react";
import { Platform, StyleSheet } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Spacing } from "@/constants/Colors";
import Constants from "expo-constants";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

// Asegurarse de que el navegador se cierre automáticamente después de la autenticación
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthButtonProps {
  text?: string;
  onSuccess?: (result?: { isNewUser: boolean }) => void;
  onError?: (error: Error) => void;
}

export function GoogleAuthButton({
  text = "Continuar con Google",
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const { processGoogleCredential } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Obtener IDs de cliente de las variables de entorno
  const { firebaseWebClientId, firebaseIosClientId, firebaseAndroidClientId } =
    Constants.expoConfig?.extra || {};

  // Crear URI de redirección basado en la plataforma
  // NOTA: En Android, el URI debe usar formato exacto que coincida con lo configurado en Google Cloud
  let redirectUri;

  if (Platform.OS === "android") {
    // Usar la URI de redirección con el esquema nativo para Android APK
    // Usar la ruta que coincide con nuestra página de redirección en Expo Router
    redirectUri = "com.gofutbol.app:/auth/google-redirect";
  } else {
    // Para otros entornos, usar la URI generada por Expo
    redirectUri = makeRedirectUri({
      scheme: "gofutbol",
      path: "auth/google-redirect",
    });
  }

  console.log("URI de redirección configurado:", redirectUri);

  // Configurar solicitud de autenticación de Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: firebaseWebClientId,
    iosClientId: firebaseIosClientId,
    androidClientId: firebaseAndroidClientId,
    redirectUri: redirectUri,
    // Configuración adicional para mejorar la compatibilidad
    usePKCE: true,
    scopes: ["profile", "email"],
  });

  // Monitorear cambios en la respuesta de autenticación
  useEffect(() => {
    console.log("Respuesta de autenticación:", response);

    if (response?.type === "success" && response.authentication?.idToken) {
      console.log("Autenticación exitosa, procesando token...");
      handleGoogleAuth(response.authentication.idToken);
    } else if (response?.type === "error") {
      console.error("Error de autenticación:", response.error);
      setIsAuthenticating(false);
      if (onError) onError(new Error("Error en la autenticación con Google"));
    } else if (response?.type === "dismiss") {
      console.log("Autenticación cancelada por el usuario");
      setIsAuthenticating(false);
    }
  }, [response]);

  // Manejar autenticación con Google
  const handleGoogleAuth = async (idToken: string) => {
    try {
      console.log("Procesando token de Google...");
      // Procesar token con Firebase
      const result = await processGoogleCredential(idToken);
      setIsAuthenticating(false);
      console.log("Autenticación con Google completada:", result);
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error("Error en autenticación con Google:", error);
      setIsAuthenticating(false);
      if (onError) onError(error as Error);
    }
  };

  // Iniciar flujo de autenticación
  const handleLogin = async () => {
    try {
      console.log("Iniciando autenticación con Google...");
      setIsAuthenticating(true);
      // Mostrar opciones para mejorar la experiencia
      const result = await promptAsync({
        showInRecents: true,
      });
      console.log("Resultado de promptAsync:", result);
    } catch (error) {
      console.error("Error al iniciar autenticación:", error);
      setIsAuthenticating(false);
      if (onError) onError(error as Error);
    }
  };

  return (
    <Button
      title={isAuthenticating ? "Conectando..." : text}
      variant="outlined"
      size="large"
      fullWidth
      onPress={handleLogin}
      disabled={isAuthenticating || !request}
      leftIcon={isAuthenticating ? undefined : "google.auth"}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    marginRight: Spacing.s,
  },
});
