import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert
} from "react-native";
import { useAuth } from "../services/auth";
import { COLORS } from "../theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos requeridos", "Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // No necesitas navegar: onAuthStateChanged detecta el login y Root re-renderiza con AppTabs
    } catch (error) {
      const msg = firebaseErrorMessage(error.code);
      Alert.alert("Error al iniciar sesión", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={styles.emoji}>🍞</Text>
      <Text style={styles.title}>Panahashi</Text>
      <Text style={styles.subtitle}>Panel de panadería</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={COLORS.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={COLORS.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Ingresar</Text>
        }
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// Traduce los códigos de error de Firebase a mensajes legibles
function firebaseErrorMessage(code) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/invalid-credential":   return "Correo o contraseña incorrectos.";
    case "auth/wrong-password":       return "Contraseña incorrecta.";
    case "auth/invalid-email":        return "El correo no tiene un formato válido.";
    case "auth/too-many-requests":    return "Demasiados intentos. Intenta más tarde.";
    case "auth/network-request-failed": return "Sin conexión. Verifica tu red.";
    default:                          return "Ocurrió un error. Intenta de nuevo.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emoji:    { fontSize: 60, marginBottom: 12 },
  title:    { fontSize: 30, fontWeight: "700", color: COLORS.brown },
  subtitle: { fontSize: 15, color: COLORS.muted, marginBottom: 36, marginTop: 4 },
  input: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.brown,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    width: "100%",
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});