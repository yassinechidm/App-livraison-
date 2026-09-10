import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";

export default function OtpScreen() {
  const { email, phone } = useLocalSearchParams<{ email?: string; phone?: string }>();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const target = email || phone || "";

  async function handleVerify() {
    if (!token.trim()) {
      Alert.alert("Code manquant", "Veuillez saisir ou coller votre code de confirmation.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp(target, token.trim());
      const role = authService.getUserRole()?.toLowerCase();
      if (role === "admin") {
        router.replace("/(app)/(admin)/(tabs)" as any);
      } else if (role === "delivery") {
        router.replace("/(app)/(delivery)/(tabs)" as any);
      } else {
        router.replace("/(app)/(client)/(tabs)" as any);
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.message || "Code incorrect ou expiré.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Vérification du compte</Text>
        <Text style={styles.subtitle}>
          Saisissez ou collez le code de confirmation envoyé à{"\n"}
          <Text style={styles.targetText}>{target || "votre adresse"}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="Code / Jeton de confirmation"
          placeholderTextColor="#A5A0DF"
          autoCapitalize="none"
          autoCorrect={false}
          value={token}
          onChangeText={setToken}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.verifyBtn, isLoading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.verifyBtnText}>
            {isLoading ? "Vérification..." : "Confirmer et continuer"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(auth)/login")}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2C2375",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#7F77DD",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  targetText: {
    fontWeight: "700",
    color: "#3C3489",
  },
  otpInput: {
    width: "100%",
    height: 56,
    borderWidth: 2,
    borderColor: "#CECBF6",
    borderRadius: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#3C3489",
    textAlign: "center",
    letterSpacing: 2,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#F8F7FD",
  },
  verifyBtn: {
    width: "100%",
    height: 50,
    backgroundColor: Colors.cta,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: {
    color: "#7F77DD",
    fontSize: 14,
    fontWeight: "600",
  },
});
