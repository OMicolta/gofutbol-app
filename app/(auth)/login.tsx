// app/(auth)/login.tsx

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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Colors, Spacing } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useNotification } from "@/context/NotificationContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithEmail, error, clearError, redirectIfAuthenticated } =
    useAuth();
  const { showNotification } = useNotification();

  // Manejar inicio de sesión
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa tu email y contraseña");
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await signInWithEmail(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Alert.alert(
        "Error al iniciar sesión",
        "Verifica tu email y contraseña e intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar éxito del login con Google
  const handleGoogleSuccess = () => {
    router.replace("/(tabs)");
  };

  // Manejar error del login con Google
  const handleGoogleError = (error: Error) => {
    showNotification(
      `Error al iniciar sesión con Google: ${error.message}`,
      "error"
    );
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
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <ThemedText type="title" style={styles.title}>
                GoFutbol
              </ThemedText>
              <ThemedText type="body" secondary style={styles.subtitle}>
                Tu app para organizar recochas de fútbol
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

              <Button
                title="Iniciar Sesión"
                size="large"
                fullWidth
                loading={isSubmitting}
                onPress={handleLogin}
                style={styles.loginButton}
              />

              {error && (
                <ThemedText style={styles.errorText} type="body">
                  {error}
                </ThemedText>
              )}

              <TouchableOpacity
                onPress={() => router.push("/recover-password" as any)}
              >
                <ThemedText type="body" style={styles.forgotPassword}>
                  ¿Olvidaste tu contraseña?
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <ThemedText type="body" secondary style={styles.dividerText}>
                O continúa con
              </ThemedText>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </View>

            <View style={styles.registerContainer}>
              <ThemedText type="body" secondary>
                ¿No tienes una cuenta?
              </ThemedText>
              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => router.push("/register" as any)}
              >
                <ThemedText type="body" style={styles.registerText}>
                  Regístrate
                </ThemedText>
              </TouchableOpacity>
            </View>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.m,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.s,
  },
  subtitle: {
    textAlign: "center",
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
  loginButton: {
    marginTop: Spacing.s,
  },
  errorText: {
    color: Colors.light.danger,
    marginTop: Spacing.s,
    textAlign: "center",
  },
  forgotPassword: {
    textAlign: "center",
    marginTop: Spacing.m,
    textDecorationLine: "underline",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.l,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: Spacing.m,
  },
  socialButtonsContainer: {
    marginBottom: Spacing.l,
  },
  googleButton: {
    marginBottom: Spacing.m,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerLink: {
    marginLeft: Spacing.xs,
  },
  registerText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
});
