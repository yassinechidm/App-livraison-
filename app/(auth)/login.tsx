import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Colors from "../../constants/Colors";
import { authService } from "../../services/auth.service";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoadingSms, setIsLoadingSms] = useState(false);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    phone?: string;
  }>({});
  const router = useRouter();

  const isBusy = isLoadingSms || isLoadingWhatsApp || isLoadingSocial;

  function validateEmail(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email invalide";
    }
    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validatePhone(): string | null {
    const clean = phone.trim();
    if (!clean) {
      Alert.alert(
        "Numéro requis",
        "Veuillez saisir votre numéro de téléphone.",
      );
      return null;
    }
    const normalized = authService.normalizePhoneNumber(clean);
    if (!normalized) {
      Alert.alert(
        "Numéro invalide",
        "Veuillez saisir un numéro de téléphone mobile valide (ex: 6 00 00 00 00).",
      );
      return null;
    }
    return normalized;
  }

  function redirectByRole() {
    const role = authService.getUserRole()?.toLowerCase();
    if (role === "admin") {
      router.replace("/(app)/(admin)/(tabs)" as any);
    } else if (role === "delivery") {
      router.replace("/(app)/(delivery)/(tabs)" as any);
    } else {
    }
  }

  async function handleSmsLogin() {
    const cleanPhone = validatePhone();
    if (!cleanPhone) return;

    setIsLoadingSms(true);
    try {
      await authService.signInWithPhone(cleanPhone);
      router.push({
        pathname: "/(auth)/otp" as any,
        params: { phone: cleanPhone, isWhatsApp: "false" },
      });
    } catch (err: any) {
      Alert.alert(
        "Envoi SMS",
        err?.message || "Impossible d'envoyer le code SMS. Veuillez réessayer.",
      );
    } finally {
      setIsLoadingSms(false);
    }
  }

  async function handleWhatsAppLogin() {
    const cleanPhone = validatePhone();
    if (!cleanPhone) return;

    setIsLoadingWhatsApp(true);
    try {
      await authService.requestWhatsAppOtp(cleanPhone);
      router.push({
        pathname: "/(auth)/otp" as any,
        params: { phone: cleanPhone, isWhatsApp: "true" },
      });
    } catch (err: any) {
      Alert.alert(
        "WhatsApp",
        err?.message ||
          "La vérification WhatsApp est temporairement indisponible. Veuillez essayer par SMS.",
      );
    } finally {
      setIsLoadingWhatsApp(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "apple") {
    setIsLoadingSocial(true);
    try {
      const session = await authService.signInWithSocial(provider);
      if (session) {
        redirectByRole();
      }
    } catch (err: any) {
      Alert.alert(
        "Connexion Google",
        err?.message || "Impossible de compléter la connexion Google.",
      );
    } finally {
      setIsLoadingSocial(false);
    }
  }

  async function handleEmailLogin() {
    if (!validateEmail()) return;
    setIsLoadingSocial(true);
    try {
      await authService.signIn({ email: email.trim(), password });
      redirectByRole();
    } catch {
      Alert.alert("Erreur de connexion", "Identifiants invalides");
    } finally {
      setIsLoadingSocial(false);
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
        style={{ flex: 1, width: "100%", maxWidth: "100%" }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Background (purple header with brand logo) */}
        <View style={styles.topHeader}>
          {/* Logo Brand Title */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>QuickL</Text>
            <View style={styles.locationPin}>
              <Text style={styles.locationPinText}>📍</Text>
            </View>
          </View>
        </View>

        {/* White bottom authentication sheet */}
        <View style={styles.sheet}>
          <Text style={styles.welcomeText}>Bienvenue</Text>
          <Text style={styles.subtitleText}>
            Commençons avec votre numéro de téléphone
          </Text>

          {/* Split Phone Fields */}
          <View style={styles.phoneInputRow}>
            {/* Prefix Selector */}
            <View style={styles.prefixCard}>
              <Text style={styles.prefixLabel}>Préfixe</Text>
              <View style={styles.prefixContent}>
                <Text style={styles.flagText}>🇲🇦</Text>
                <Text style={styles.prefixNumber}>+212</Text>
                <Text style={styles.dropdownArrow}>∨</Text>
              </View>
            </View>

            {/* Phone Input Box */}
            <View style={styles.phoneInputBox}>
              <Text style={styles.phoneLabel}>Numéro de téléphone</Text>
              <TextInput
                style={styles.phoneTextInput}
                placeholder="6 00 00 00 00"
                placeholderTextColor="#7F77DD"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!isBusy}
              />
            </View>
          </View>

          {/* Separate Phone Actions */}
          {/* Action 1: Continue with SMS */}
          <TouchableOpacity
            style={[styles.smsButton, isBusy && styles.buttonDisabled]}
            onPress={handleSmsLogin}
            activeOpacity={0.85}
            disabled={isBusy}
          >
            <Text style={styles.smsButtonText}>
              {isLoadingSms ? "Envoi du SMS..." : "Continuer par SMS"}
            </Text>
          </TouchableOpacity>

          {/* Action 2: Continue with WhatsApp */}
          <TouchableOpacity
            style={[styles.whatsAppButton, isBusy && styles.buttonDisabled]}
            onPress={handleWhatsAppLogin}
            activeOpacity={0.85}
            disabled={isBusy}
          >
            <View style={styles.whatsAppContentRow}>
              <Text style={styles.whatsAppIconText}>💬</Text>
              <Text style={styles.whatsAppButtonText}>
                {isLoadingWhatsApp
                  ? "Envoi du code..."
                  : "Continuer avec WhatsApp"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Or With Divider */}
          <View style={styles.orDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>ou avec</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Logins (Google) */}
          <TouchableOpacity
            style={[styles.socialPill, isBusy && styles.buttonDisabled]}
            onPress={() => handleSocialLogin("google")}
            disabled={isBusy}
            activeOpacity={0.85}
          >
            <Image
              source={require("../../assets/images/google_custom.png")}
              style={styles.socialImageIcon}
              resizeMode="contain"
            />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          {/* Other methods Toggle */}
          <TouchableOpacity
            style={styles.otherMethodsBtn}
            onPress={() => setShowEmailForm(!showEmailForm)}
            activeOpacity={0.7}
          >
            <Text style={styles.otherMethodsText}>
              Autres méthodes {showEmailForm ? "∧" : "∨"}
            </Text>
          </TouchableOpacity>

          {showEmailForm && (
            <View style={styles.emailContainer}>
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
                label="Mot de passe"
                placeholder="Saisissez votre mot de passe"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                isPassword
              />

              <Button
                title="Se connecter"
                onPress={handleEmailLogin}
                isLoading={isLoadingSocial}
                variant="primary"
                style={{ backgroundColor: Colors.cta, borderRadius: 25 }}
              />
            </View>
          )}

          {/* Sign up / Register Link */}
          <View style={styles.signUpPromptRow}>
            <Text style={styles.signUpPromptText}>Pas encore de compte ? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.7}
            >
              <Text style={styles.signUpPromptLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Legals Footer */}
          <Text style={styles.footerText}>
            En continuant, vous acceptez nos{" "}
            <Link href="/(auth)/legal-terms" asChild>
              <Text style={styles.footerLink}>Conditions Générales</Text>
            </Link>
            , notre{" "}
            <Link href="/(auth)/legal-terms" asChild>
              <Text style={styles.footerLink}>
                Politique de Confidentialité
              </Text>
            </Link>{" "}
            et l'utilisation des cookies.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: Colors.primary,
  },
  topHeader: {
    height: Math.max(SCREEN_HEIGHT * 0.32, 250),
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === "android" ? 30 : 20,
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "android" ? 36 : 48,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C3489",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 46,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1.5,
  },
  locationPin: {
    marginLeft: 6,
  },
  locationPinText: {
    fontSize: 34,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#3C3489",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: "#7F77DD",
    textAlign: "center",
    marginBottom: 18,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    width: "100%",
  },
  prefixCard: {
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    justifyContent: "center",
    width: 95,
    flexShrink: 0,
  },
  prefixLabel: {
    fontSize: 11,
    color: "#7F77DD",
    fontWeight: "600",
    marginBottom: 2,
  },
  prefixContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flagText: {
    fontSize: 16,
  },
  prefixNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3C3489",
  },
  dropdownArrow: {
    fontSize: 10,
    color: "#7F77DD",
    fontWeight: "700",
    marginLeft: 2,
  },
  phoneInputBox: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    justifyContent: "center",
  },
  phoneLabel: {
    fontSize: 11,
    color: "#7F77DD",
    fontWeight: "600",
    marginBottom: 2,
  },
  phoneTextInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C3489",
    padding: 0,
    height: 22,
    width: "100%",
  },
  smsButton: {
    backgroundColor: Colors.cta,
    borderRadius: 28,
    height: 50,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  smsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  whatsAppButton: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderRadius: 28,
    height: 50,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  whatsAppContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  whatsAppIconText: {
    fontSize: 18,
  },
  whatsAppButtonText: {
    color: "#15803D",
    fontSize: 15,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#CECBF6",
  },
  orText: {
    fontSize: 12,
    color: "#7F77DD",
    paddingHorizontal: 14,
    fontWeight: "600",
  },
  socialPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 28,
    height: 48,
    width: "100%",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  socialImageIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C3489",
  },
  otherMethodsBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 6,
  },
  otherMethodsText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "800",
  },
  emailContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.background,
  },
  signUpPromptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 4,
  },
  signUpPromptText: {
    fontSize: 14,
    color: "#5C54A4",
    fontWeight: "500",
  },
  signUpPromptLink: {
    fontSize: 14,
    color: Colors.cta,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  footerText: {
    fontSize: 11,
    color: "#7F77DD",
    textAlign: "center",
    lineHeight: 15,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  footerLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
    color: "#7F77DD",
  },
});
