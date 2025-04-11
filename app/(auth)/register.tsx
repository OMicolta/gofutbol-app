// app/(auth)/register.tsx

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUpWithEmail, error, clearError, redirectIfAuthenticated } =
    useAuth();

  // Manejar registro
  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await signUpWithEmail(email, password, name);
      Alert.alert(
        "Registro exitoso",
        "Tu cuenta ha sido creada correctamente.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    } catch (error) {
      console.error("Error al registrarse:", error);
      Alert.alert(
        "Error al registrarse",
        "Ha ocurrido un error durante el registro. Por favor intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
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
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#9E9E9E"
                />
              </ThemedView>

              <ThemedView
                style={styles.inputContainer}
                variant="secondary"
                rounded
              >
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#9E9E9E"
                />
              </ThemedView>

              <ThemedView
                style={styles.inputContainer}
                variant="secondary"
                rounded
              >
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#9E9E9E"
                />
              </ThemedView>

              <ThemedView
                style={styles.inputContainer}
                variant="secondary"
                rounded
              >
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="#9E9E9E"
                />
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
