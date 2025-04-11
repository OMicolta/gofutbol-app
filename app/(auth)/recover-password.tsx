// app/(auth)/recover-password.tsx

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendPasswordResetEmail } from "firebase/auth";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Spacing } from "@/constants/Colors";
import { auth } from "@/config/firebase";

export default function RecoverPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Manejar recuperación de contraseña
  const handleRecoverPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "Se ha enviado un correo con instrucciones para recuperar tu contraseña."
      );
    } catch (error) {
      console.error("Error al recuperar contraseña:", error);
      Alert.alert(
        "Error",
        "No se pudo enviar el correo de recuperación. Verifica tu email e intenta nuevamente."
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
                Recuperar Contraseña
              </ThemedText>
              <ThemedText type="body" secondary style={styles.subtitle}>
                Ingresa tu email y te enviaremos instrucciones para recuperar tu
                contraseña
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

              <Button
                title="Enviar Instrucciones"
                size="large"
                fullWidth
                loading={isSubmitting}
                onPress={handleRecoverPassword}
                style={styles.recoverButton}
              />

              {message ? (
                <ThemedText style={styles.successMessage} type="body">
                  {message}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.loginContainer}>
              <ThemedText type="body" secondary>
                ¿Recordaste tu contraseña?
              </ThemedText>
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.replace("/login" as any)}
              >
                <ThemedText type="body" style={styles.loginText}>
                  Inicia sesión
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
  recoverButton: {
    marginTop: Spacing.s,
  },
  successMessage: {
    color: "#4CAF50",
    marginTop: Spacing.m,
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.m,
  },
  loginLink: {
    marginLeft: Spacing.xs,
  },
  loginText: {
    color: "#1DB954",
    fontWeight: "600",
  },
});
