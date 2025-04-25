// app/(auth)/register.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useNotification } from "@/context/NotificationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    safeSignUp,
    error,
    clearError,
    redirectIfAuthenticated,
    isInitializing,
  } = useAuth();
  const { showNotification } = useNotification();

  // Verificar si ya está autenticado y redirigir si es necesario
  useEffect(() => {
    if (!isInitializing) {
      redirectIfAuthenticated();
    }
  }, [isInitializing]);

  // Manejar registro
  const handleRegister = async () => {
    if (password !== confirmPassword) {
      showNotification("Las contraseñas no coinciden", "error");
      return;
    }

    setIsSubmitting(true);
    clearError();

    // Usando el nuevo método seguro de registro
    const success = await safeSignUp(email, password, name);

    if (success) {
      showNotification(
        "¡Registro exitoso! Ahora configura tu nombre de usuario",
        "success"
      );
      router.replace("/setup-username");
    }

    setIsSubmitting(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ThemedText type="body">← Volver</ThemedText>
              </TouchableOpacity>
              <ThemedText type="title" style={styles.title}>
                Crear Cuenta
              </ThemedText>
              <ThemedText type="body" secondary style={styles.subtitle}>
                Únete a la comunidad de GoFutbol
              </ThemedText>
            </View>

            <View style={styles.formContainer}>
              <ThemedView
                style={styles.inputContainer}
                variant="secondary"
                rounded
              >
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  placeholder="Nombre completo"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor={Colors[colorScheme].placeholder}
                />
              </ThemedView>

              <ThemedView
                style={styles.inputContainer}
                variant="secondary"
                rounded
              >
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={Colors[colorScheme].placeholder}
                />
              </ThemedView>

              <ThemedView
                style={styles.inputContainer}
                variant="secondary"
                rounded
              >
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={Colors[colorScheme].placeholder}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <IconSymbol
                      name={
                        showPassword
                          ? ("eye.slash.fill" as any)
                          : ("eye.fill" as any)
                      }
                      size={22}
                      color={Colors[colorScheme].icon}
                    />
                  </TouchableOpacity>
                </View>
              </ThemedView>

              <ThemedView
                style={styles.inputContainer}
                variant="secondary"
                rounded
              >
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={Colors[colorScheme].placeholder}
                  />
                  <TouchableOpacity
                    style={styles.visibilityIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <IconSymbol
                      name={
                        showConfirmPassword
                          ? ("eye.slash.fill" as any)
                          : ("eye.fill" as any)
                      }
                      size={22}
                      color={Colors[colorScheme].icon}
                    />
                  </TouchableOpacity>
                </View>
              </ThemedView>

              <Button
                title="Registrarse"
                size="large"
                fullWidth
                loading={isSubmitting}
                onPress={handleRegister}
                style={styles.registerButton}
              />

              {error && (
                <ThemedText style={styles.errorText} type="body">
                  {error}
                </ThemedText>
              )}
            </View>

            <View style={styles.loginContainer}>
              <ThemedText type="body" secondary>
                ¿Ya tienes una cuenta?
              </ThemedText>
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push("/login" as any)}
              >
                <ThemedText type="body" style={styles.loginText}>
                  Inicia sesión
                </ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText type="caption" secondary style={styles.termsText}>
              Al registrarte, aceptas nuestros términos y condiciones y política
              de privacidad.
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  headerContainer: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.m,
  },
  title: {
    marginBottom: Spacing.s,
  },
  subtitle: {
    marginBottom: Spacing.l,
  },
  formContainer: {
    width: "100%",
    marginBottom: Spacing.l,
  },
  inputContainer: {
    marginBottom: Spacing.m,
    borderRadius: 8,
    paddingHorizontal: Spacing.m,
    paddingVertical: Platform.OS === "ios" ? Spacing.s : 0,
  },
  input: {
    height: 50,
    fontSize: 16,
    width: "100%",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  visibilityIcon: {
    padding: Spacing.xs,
    position: "absolute",
    right: 0,
    height: 50,
    justifyContent: "center",
  },
  registerButton: {
    marginTop: Spacing.s,
  },
  errorText: {
    color: Colors.light.danger,
    marginTop: Spacing.s,
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.m,
    marginBottom: Spacing.l,
  },
  loginLink: {
    marginLeft: Spacing.xs,
  },
  loginText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  termsText: {
    textAlign: "center",
    marginTop: Spacing.m,
  },
});
