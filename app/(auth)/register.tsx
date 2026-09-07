import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";
import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Le nom complet est requis";
    }

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email invalide";
    }

    if (!phone.trim()) {
      newErrors.phone = "Le téléphone est requis";
    }

    if (!city.trim()) {
      newErrors.city = "La ville/quartier est requis";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Au moins 6 caractères";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "La confirmation est requise";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await authService.signUp({ email: email.trim(), password });

      if (data.user && !data.session) {
        Alert.alert(
          "Vérifiez votre email",
          "Un email de confirmation a été envoyé à votre adresse. Veuillez le vérifier pour activer votre compte.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
        );
      } else {
        // Automatically signed in, navigate to main client app
        router.replace("/(app)/(client)/(tabs)" as any);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      Alert.alert("Erreur d'inscription", message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Background (bleu ciel / sky blue) */}
        <View style={styles.topHeader}>
          {/* Logo Brand Title (White text) */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>QuickL</Text>
            <View style={styles.locationPin}>
              <Text style={styles.locationPinText}>📍</Text>
            </View>
          </View>
        </View>

        {/* White bottom sheet */}
        <View style={styles.sheet}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez la communauté Quick Livraison à Oujda 🇲🇦
          </Text>

          <Input
            label="Nom complet"
            placeholder="Votre nom complet"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            autoComplete="name"
          />

          <Input
            label="Email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoComplete="email"
          />

          <Input
            label="Téléphone"
            placeholder="+212 6XX XX XX XX"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Input
            label="Quartier à Oujda"
            placeholder="Centre-Ville, Lazaret, Al Qods, Salam..."
            value={city}
            onChangeText={setCity}
            error={errors.city}
          />

          <Input
            label="Nom de boutique (optionnel)"
            placeholder="Ex: Ma Pâtisserie, Epicerie..."
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Input
            label="Mot de passe"
            placeholder="Minimum 6 caractères"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="Répétez votre mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            isPassword
          />

          <Button
            title="Créer mon compte"
            onPress={handleRegister}
            isLoading={isLoading}
            variant="primary"
            style={styles.registerButton}
          />

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Déjà inscrit ?{" "}
              <Link href="/(auth)/login" asChild>
                <Text style={styles.footerLink}>Se connecter</Text>
              </Link>
            </Text>
          </View>

          {/* Terms and Legal Disclaimers */}
          <Text style={styles.terms}>
            En créant un compte, vous acceptez nos{" "}
            <Link href="/(auth)/legal-terms" asChild>
              <Text style={styles.legalHighlight}>Conditions d'utilisation</Text>
            </Link>{" "}
            et notre{" "}
            <Link href="/(auth)/legal-terms" asChild>
              <Text style={styles.legalHighlight}>
                Politique de confidentialité
              </Text>
            </Link>
            .
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0066FF",
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#38BDF8",
  },
  topHeader: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#38BDF8",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  brandTitle: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1.5,
  },
  locationPin: {
    marginLeft: 6,
  },
  locationPinText: {
    fontSize: 30,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
  },
  registerButton: {
    marginTop: 10,
    backgroundColor: "#0066FF",
    borderRadius: 28,
    height: 54,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  footerText: {
    color: "#718096",
    fontSize: 13,
  },
  footerLink: {
    color: "#0066FF",
    fontWeight: "800",
  },
  terms: {
    color: "#A0AEC0",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  legalHighlight: {
    color: "#0066FF",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
