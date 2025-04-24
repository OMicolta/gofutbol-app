import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/Colors";

// Esta función asegura que el navegador web se cierre cuando llegamos a esta página
WebBrowser.maybeCompleteAuthSession();

export default function GoogleRedirectScreen() {
  const router = useRouter();
  const { user, needsUsernameSetup, isUserAuthenticated } = useAuth();

  useEffect(() => {
    console.log("Google Redirect Screen - montado");
    console.log(
      "Estado de autenticación:",
      isUserAuthenticated() ? "Autenticado" : "No autenticado"
    );
    console.log("Usuario:", user?.uid || "No hay usuario");

    // Forzar cierre de cualquier navegador web abierto para OAuth
    WebBrowser.maybeCompleteAuthSession();

    // Intentamos redirigir inmediatamente
    let initialRedirectAttempted = false;

    // Función para intentar redirección
    const attemptRedirect = () => {
      try {
        // Si el usuario está autenticado
        if (isUserAuthenticated()) {
          console.log("Usuario autenticado, redirigiendo...");

          // Verificar si necesita configurar su nombre de usuario
          if (needsUsernameSetup()) {
            console.log("Redirigiendo a configuración de username...");
            router.push("/setup-username");
            return true;
          } else {
            console.log("Redirigiendo a página principal...");
            router.push("/(tabs)");
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Error en la redirección:", error);
        return false;
      }
    };

    // Intentar redirección inmediata
    initialRedirectAttempted = attemptRedirect();

    // Si no se pudo redirigir inmediatamente, configurar un polling
    if (!initialRedirectAttempted) {
      console.log("Configurando polling para intentar redirección...");

      // Intervalo para intentar redirección cada 500ms
      const redirectInterval = setInterval(() => {
        console.log("Intentando redirección nuevamente...");
        const redirected = attemptRedirect();

        if (redirected) {
          clearInterval(redirectInterval);
        }
      }, 500);

      // Timeout después de 5 segundos para evitar bucles infinitos
      const redirectTimeout = setTimeout(() => {
        console.log("Timeout de redirección, volviendo a login...");
        clearInterval(redirectInterval);
        router.push("/(auth)/login");
      }, 5000);

      // Limpieza
      return () => {
        clearInterval(redirectInterval);
        clearTimeout(redirectTimeout);
      };
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.text}>Completando autenticación...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
  },
  text: {
    marginTop: 20,
    color: Colors.light.text,
    fontSize: 16,
  },
});
