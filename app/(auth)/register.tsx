import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";
import Colors from "@/constants/Colors";
import { sanitizeEmail, sanitizeName, sanitizePhone } from "@/lib/sanitize";
import { authService } from "@/services/auth.service";
import { RegistrationProvider } from "@/types/auth.types";
import { Link, useRouter } from "expo-router";
import { Mail, MessageCircle, Phone as PhoneIcon } from "lucide-react-native";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterScreen() {
  const [provider, setProvider] = useState<RegistrationProvider>("email");
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

    if (!city.trim()) {
      newErrors.city = "La ville/quartier est requis";
    }

    if (provider === "email") {
      if (!email.trim()) {
        newErrors.email = "L'email est requis";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.email = "Email invalide";
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
    } else {
      // SMS or WhatsApp registration requires valid phone number
      const clean = sanitizePhone(phone);
      if (!clean) {
        newErrors.phone = "Le numéro de téléphone est requis";
      } else {
        const normalized = authService.normalizePhoneNumber(clean);
        if (!normalized) {
          newErrors.phone = "Numéro invalide (ex: 06 12 34 56 78)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const cleanFullName = sanitizeName(fullName);
      const cleanCity = sanitizeName(city);

      if (provider === "email") {
        const cleanEmail = sanitizeEmail(email);
        const cleanPhone = sanitizePhone(phone);

        const data = await authService.signUp({
          email: cleanEmail,
          password,
          fullName: cleanFullName,
          phone: cleanPhone || undefined,
          city: cleanCity,
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
                    params: {
                      provider: "email",
                      email: cleanEmail,
                      phone: cleanPhone || undefined,
                      type: "signup",
                    },
                  }),
              },
            ],
          );
        } else {
          router.replace("/(app)/(client)/(tabs)" as any);
        }
      } else if (provider === "sms") {
        const normalizedPhone = authService.normalizePhoneNumber(phone);
        if (!normalizedPhone) throw new Error("Numéro de téléphone invalide.");

        await authService.signInWithPhone(normalizedPhone, {
          full_name: cleanFullName,
          city: cleanCity,
          role: "client",
        });

        Alert.alert(
          "Code SMS envoyé",
          `Un code de confirmation par SMS a été envoyé au ${normalizedPhone}.`,
          [
            {
              text: "Saisir le code",
              onPress: () =>
                router.push({
                  pathname: "/(auth)/otp" as any,
                  params: {
                    provider: "sms",
                    phone: normalizedPhone,
                    type: "sms",
                  },
                }),
            },
          ],
        );
      } else if (provider === "whatsapp") {
        const normalizedPhone = authService.normalizePhoneNumber(phone);
        if (!normalizedPhone) throw new Error("Numéro de téléphone invalide.");

        const res = await authService.requestWhatsAppOtp(normalizedPhone, {
          full_name: cleanFullName,
          city: cleanCity,
        });

        Alert.alert(
          "Code WhatsApp envoyé",
          res.message ||
            `Un code de confirmation a été envoyé sur WhatsApp au ${normalizedPhone}.`,
          [
            {
              text: "Saisir le code",
              onPress: () =>
                router.push({
                  pathname: "/(auth)/otp" as any,
                  params: {
                    provider: "whatsapp",
                    phone: normalizedPhone,
                    isWhatsApp: "true",
                    type: "whatsapp",
                  },
                }),
            },
          ],
        );
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
            Rejoignez la communauté Quickly Livraison à Oujda 🇲🇦
          </Text>
        </View>

        {/* Card containing Registration Form */}
        <View style={styles.card}>
          {/* Provider Selection Tabs */}
          <View style={styles.providerTabs}>
            <TouchableOpacity
              style={[
                styles.providerTab,
                provider === "email" && styles.providerTabActive,
              ]}
              onPress={() => setProvider("email")}
              activeOpacity={0.7}
            >
              <Mail
                size={16}
                color={provider === "email" ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.providerTabText,
                  provider === "email" && styles.providerTabTextActive,
                ]}
              >
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerTab,
                provider === "sms" && styles.providerTabActive,
              ]}
              onPress={() => setProvider("sms")}
              activeOpacity={0.7}
            >
              <PhoneIcon
                size={16}
                color={provider === "sms" ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.providerTabText,
                  provider === "sms" && styles.providerTabTextActive,
                ]}
              >
                SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerTab,
                provider === "whatsapp" && styles.providerTabActive,
              ]}
              onPress={() => setProvider("whatsapp")}
              activeOpacity={0.7}
            >
              <MessageCircle
                size={16}
                color={provider === "whatsapp" ? "#059669" : Colors.textMuted}
              />
              <Text
                style={[
                  styles.providerTabText,
                  provider === "whatsapp" && {
                    color: "#059669",
                    fontWeight: "800",
                  },
                ]}
              >
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>

          {/* Common Fields */}
          <Input
            label="Nom complet"
            placeholder="Votre nom complet"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            autoComplete="name"
          />

          {/* Email Provider Fields */}
          {provider === "email" && (
            <>
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
                label="Téléphone (contact)"
                placeholder="+212 6XX XX XX XX"
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </>
          )}

          {/* SMS & WhatsApp Provider Fields */}
          {(provider === "sms" || provider === "whatsapp") && (
            <Input
              label={
                provider === "whatsapp"
                  ? "Numéro WhatsApp"
                  : "Numéro de téléphone"
              }
              placeholder="06 12 34 56 78"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          )}

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

          {/* Password fields only for Email provider */}
          {provider === "email" && (
            <>
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
            </>
          )}

          <Button
            title={
              provider === "whatsapp"
                ? "S'inscrire avec WhatsApp"
                : provider === "sms"
                  ? "S'inscrire par SMS"
                  : "Créer mon compte"
            }
            onPress={handleRegister}
            isLoading={isLoading}
            variant={provider === "whatsapp" ? "primary" : "success"}
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
  providerTabs: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  providerTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  providerTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  providerTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  providerTabTextActive: {
    color: Colors.primary,
    fontWeight: "800",
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
