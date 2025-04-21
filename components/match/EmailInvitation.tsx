// components/match/EmailInvitation.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors, Spacing } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useNotification } from "@/context/NotificationContext";

interface EmailInvitationProps {
  matchId: string;
  matchDate: Date;
  matchTime: string;
  matchType: string;
  fieldName?: string;
  onClose: () => void;
}

export function EmailInvitation({
  matchId,
  matchDate,
  matchTime,
  matchType,
  fieldName,
  onClose,
}: EmailInvitationProps) {
  const colorScheme = useColorScheme();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generar enlace de invitación
  const getInvitationLink = () => {
    // Aquí construiríamos un enlace deeplink real a la app
    // Por ahora, creamos un enlace simulado
    return `https://gofutbol.com/invite/${matchId}`;
  };

  // Generar asunto del email
  const getEmailSubject = () => {
    return `Invitación para partido de fútbol ${matchType}`;
  };

  // Generar cuerpo del email
  const getEmailBody = () => {
    const formattedDate = matchDate.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return `Hola,

Te invito a un partido de fútbol ${matchType} el ${formattedDate} a las ${matchTime}${
      fieldName ? ` en ${fieldName}` : ""
    }.

Para unirte al partido, descarga la app GoFutbol y usa este enlace:
${getInvitationLink()}

¡Nos vemos en la cancha!`;
  };

  // Copiar enlace al portapapeles
  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(getInvitationLink());
      setLinkCopied(true);
      showNotification("Enlace copiado al portapapeles", "success");

      // Restablecer estado después de 3 segundos
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      console.error("Error al copiar enlace:", error);
      showNotification("Error al copiar enlace", "error");
    }
  };

  // Enviar invitación por email
  const handleSendEmail = async () => {
    if (!email.trim()) {
      showNotification("Por favor ingresa un email válido", "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification("Por favor ingresa un email válido", "error");
      return;
    }

    setIsLoading(true);
    try {
      const subject = encodeURIComponent(getEmailSubject());
      const body = encodeURIComponent(getEmailBody());
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);

      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        showNotification("Abriendo aplicación de correo...", "success");
        // No cerramos el modal automáticamente para permitir enviar a más emails
      } else {
        // Intentar usar el portapapeles como alternativa
        await Clipboard.setStringAsync(getEmailBody());
        Alert.alert(
          "No se pudo abrir la aplicación de correo",
          "El texto de la invitación ha sido copiado al portapapeles. Puedes pegarlo en tu aplicación de correo favorita."
        );
      }
    } catch (error) {
      console.error("Error al enviar email:", error);
      showNotification("Error al abrir la aplicación de correo", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container} variant="card" rounded shadow="s">
      <View style={styles.header}>
        <ThemedText type="subtitle">Invitar por Email</ThemedText>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <IconSymbol name="xmark" size={20} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      </View>

      <ThemedText type="body" secondary style={styles.description}>
        Comparte un enlace de invitación por correo electrónico para que tus
        amigos puedan unirse al partido.
      </ThemedText>

      <ThemedView style={styles.linkContainer} variant="secondary" rounded>
        <ThemedText style={styles.linkText}>{getInvitationLink()}</ThemedText>
        <Button
          title={linkCopied ? "¡Copiado!" : "Copiar"}
          size="small"
          variant={linkCopied ? "filled" : "outlined"}
          onPress={handleCopyLink}
        />
      </ThemedView>

      <ThemedText type="body" weight="semiBold" style={styles.sectionTitle}>
        Enviar por correo
      </ThemedText>

      <ThemedView style={styles.inputContainer} variant="secondary" rounded>
        <TextInput
          style={[styles.input, { color: Colors[colorScheme].text }]}
          placeholder="Email del destinatario"
          placeholderTextColor={Colors[colorScheme].textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </ThemedView>

      <Button
        title={isLoading ? "Enviando..." : "Enviar Invitación"}
        size="medium"
        fullWidth
        onPress={handleSendEmail}
        disabled={isLoading || !email.trim()}
        style={styles.sendButton}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    marginTop: Spacing.m,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.m,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginBottom: Spacing.m,
  },
  linkText: {
    flex: 1,
    marginRight: Spacing.s,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  inputContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Platform.OS === "ios" ? Spacing.s : 0,
    marginBottom: Spacing.m,
  },
  input: {
    height: 50,
    fontSize: 16,
    width: "100%",
  },
  sendButton: {
    marginTop: Spacing.s,
  },
});
