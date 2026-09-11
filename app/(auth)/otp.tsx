import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Colors from "../../constants/Colors";
import { authService } from "../../services/auth.service";

export default function OtpScreen() {
  const { email, phone, isWhatsApp } = useLocalSearchParams<{
    email?: string;
    phone?: string;
    isWhatsApp?: string;
  }>();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const router = useRouter();
  const target = phone || email || "";

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  async function handleVerify() {
    if (!token.trim()) {
      Alert.alert(
        "Code manquant",
        "Veuillez saisir votre code de confirmation à 6 chiffres.",
      );
      return;
    }

    setIsLoading(true);
    try {
      if (isWhatsApp === "true") {
        await authService.verifyWhatsAppOtp(target, token.trim());
      } else {
        await authService.verifyOtp(target, token.trim(), "sms");
      }

      const role = authService.getUserRole()?.toLowerCase();
      if (role === "admin") {
        router.replace("/(app)/(admin)/(tabs)" as any);
      } else if (role === "delivery") {
        router.replace("/(app)/(delivery)/(tabs)" as any);
      } else {
        router.replace("/(app)/(client)/(tabs)" as any);
      }
    } catch (err: any) {
      Alert.alert(
        "Vérification échouée",
        err?.message || "Code incorrect ou expiré.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      if (isWhatsApp === "true") {
        const res = await authService.requestWhatsAppOtp(target);
        setCooldown(res.cooldownSeconds || 60);
        Alert.alert("Code renvoyé", "Un nouveau code WhatsApp a été envoyé.");
      } else {
        await authService.signInWithPhone(target);
        setCooldown(60);
        Alert.alert("Code renvoyé", "Un nouveau code SMS a été envoyé.");
      }
    } catch (err: any) {
      Alert.alert("Erreur", err?.message || "Impossible de renvoyer le code.");
    } finally {
      setIsResending(false);
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
          {isWhatsApp === "true"
            ? "Saisissez le code à 6 chiffres envoyé sur votre WhatsApp au"
            : "Saisissez le code à 6 chiffres envoyé par SMS au"}
          {"\n"}
          <Text style={styles.targetText}>{target || "votre numéro"}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          placeholderTextColor="#A5A0DF"
          keyboardType="number-pad"
          maxLength={6}
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

        {/* Resend with cooldown */}
        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={cooldown > 0 || isResending}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.resendBtnText,
              cooldown > 0 && styles.resendBtnDisabled,
            ]}
          >
            {cooldown > 0
              ? `Renvoyer le code (${cooldown}s)`
              : isResending
                ? "Envoi en cours..."
                : "Renvoyer le code"}
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
  resendBtn: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  resendBtnText: {
    color: Colors.cta,
    fontSize: 14,
    fontWeight: "700",
  },
  resendBtnDisabled: {
    color: "#A5A0DF",
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
