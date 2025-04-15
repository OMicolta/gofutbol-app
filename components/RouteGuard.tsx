// components/RouteGuard.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { safeNavigate } from "@/utils/navigation";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectPath?: string;
  checkFunction?: () => boolean;
}

/**
 * Componente que protege rutas verificando si el usuario está autenticado.
 * Útil para proteger páginas individuales sin depender de layouts anidados.
 */
export function RouteGuard({
  children,
  requireAuth = true,
  redirectPath = requireAuth ? "/(auth)/login" : "/(tabs)",
  checkFunction,
}: RouteGuardProps) {
  const { user, isInitializing } = useAuth();
  const colorScheme = useColorScheme();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Solo realizar la verificación cuando la autenticación esté inicializada
    if (!isInitializing) {
      const performCheck = async () => {
        // Si hay una función de verificación personalizada, usarla
        if (checkFunction) {
          const allowed = checkFunction();
          if (!allowed) {
            await safeNavigate(redirectPath, "replace", 0);
          }
        }
        // De lo contrario, verificar según requireAuth
        else if (requireAuth && !user) {
          await safeNavigate(redirectPath, "replace", 0);
        } else if (!requireAuth && user) {
          await safeNavigate(redirectPath, "replace", 0);
        }

        setIsChecking(false);
      };

      performCheck();
    }
  }, [isInitializing, user, requireAuth, redirectPath]);

  // Mostrar indicador de carga mientras se verifica
  if (isInitializing || isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={{ marginTop: Spacing.m }}>
          {requireAuth ? "Verificando acceso..." : "Redirigiendo..."}
        </ThemedText>
      </View>
    );
  }

  // Si pasó la verificación, mostrar los hijos
  return <>{children}</>;
}
