import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";
import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
      const data = await authService.signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });

      if (data.user && !data.session) {
        Alert.alert(
          "Code de confirmation",
          "Veuillez saisir le code de confirmation envoyé à votre adresse email pour activer votre compte.",
          [
            {
              text: "Saisir le code",
              onPress: () =>
                router.push({
                  pathname: "/(auth)/otp" as any,
                  params: { email: email.trim() },
                }),
            },
          ],
        );
      } else {
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
      behavior={
        Platform.OS === "web"
          ? undefined
          : Platform.OS === "ios"
            ? "padding"
            : "height"
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Logo size={56} style={styles.logo} />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez la communauté Quick Livraison à Oujda 🇲🇦
          </Text>
        </View>

        {/* Card containing Registration Form */}
        <View style={styles.card}>
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
            variant="success"
            style={styles.registerButton}
          />
        </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 45,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 10,
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: "700",
  },
  terms: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  legalHighlight: {
    color: Colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
