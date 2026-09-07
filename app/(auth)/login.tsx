import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
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

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    phone?: string;
  }>({});
  const router = useRouter();

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

  function validatePhone(): boolean {
    const newErrors: { phone?: string } = {};
    if (!phone.trim()) {
      newErrors.phone = "Le numéro est requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handlePhoneLogin() {
    if (!validatePhone()) return;
    setIsLoading(true);
    try {
      await authService.signInWithPhone(phone);
      router.replace("/(app)/(client)/(tabs)" as any);
    } catch {
      Alert.alert("Erreur", "Impossible de se connecter");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "apple") {
    setIsLoading(true);
    try {
      await authService.signInWithSocial(provider);
      router.replace("/(app)/(client)/(tabs)" as any);
    } catch {
      Alert.alert("Erreur", "Connexion annulée");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEmailLogin() {
    if (!validateEmail()) return;
    setIsLoading(true);
    try {
      await authService.signIn({ email: email.trim(), password });
      const role = authService.getUserRole();
      if (role?.toLowerCase() === "admin") {
        router.replace("/(app)/(admin)/(tabs)" as any);
      } else {
        router.replace("/(app)/(client)/(tabs)" as any);
      }
    } catch {
      Alert.alert("Erreur de connexion", "Identifiants invalides");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickDemo(role: "client" | "admin" | "delivery") {
    setIsLoading(true);
    try {
      const demoEmail = `${role}@quicklivraison.ma`;
      await authService.signIn({ email: demoEmail, password: "123456" });
      router.replace("/(app)/(client)/(tabs)" as any);
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
          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleQuickDemo("client")}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          {/* Logo Brand Title (White text) */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>QuickL</Text>
            <View style={styles.locationPin}>
              <Text style={styles.locationPinText}>📍</Text>
            </View>
          </View>
        </View>

        {/* White bottom authentication sheet */}
        <View style={styles.sheet}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.subtitleText}>
            Let's start with your phone number
          </Text>

          {/* Split Phone Fields */}
          <View style={styles.phoneInputRow}>
            {/* Prefix Selector */}
            <View style={styles.prefixCard}>
              <Text style={styles.prefixLabel}>Prefix</Text>
              <View style={styles.prefixContent}>
                <Text style={styles.flagText}>🇲🇦</Text>
                <Text style={styles.prefixNumber}>+212</Text>
                <Text style={styles.dropdownArrow}>∨</Text>
              </View>
            </View>

            {/* Phone Input Box */}
            <View style={styles.phoneInputBox}>
              <Text style={styles.phoneLabel}>Phone number</Text>
              <TextInput
                style={styles.phoneTextInput}
                placeholder="6 00 00 00 00"
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Primary Blue CTA */}
          <TouchableOpacity
            style={[styles.continueButton, isLoading && styles.buttonDisabled]}
            onPress={handlePhoneLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          {/* Or With Divider */}
          <View style={styles.orDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>or with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Logins - Loaded with uploaded icons */}
          <TouchableOpacity
            style={styles.socialPill}
            onPress={() => handleSocialLogin("google")}
          >
            <Image
              source={require("../../assets/images/google_custom.png")}
              style={styles.socialImageIcon}
              resizeMode="contain"
            />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialPill}
            onPress={() => handleSocialLogin("apple")}
          >
            <Image
              source={require("../../assets/images/apple_custom.png")}
              style={styles.socialImageIcon}
              resizeMode="contain"
            />
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>

          {/* Other methods (Email Form / Accordion in Blue) */}
          <TouchableOpacity
            style={styles.otherMethodsBtn}
            onPress={() => setShowEmailForm(!showEmailForm)}
            activeOpacity={0.7}
          >
            <Text style={styles.otherMethodsText}>
              Other methods {showEmailForm ? "∧" : "∨"}
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
                label="Password"
                placeholder="Saisissez votre mot de passe"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                isPassword
              />

              <Button
                title="Log In"
                onPress={handleEmailLogin}
                isLoading={isLoading}
                variant="primary"
                style={{ backgroundColor: "#0066FF", borderRadius: 25 }}
              />
            </View>
          )}

          {/* Legals Footer */}
          <Text style={styles.footerText}>
            By continuing, you automatically accept our{" "}
            <Link href="/(auth)/legal-terms" asChild>
              <Text style={styles.footerLink}>Terms & Conditions</Text>
            </Link>
            ,{" "}
            <Link href="/(auth)/legal-terms" asChild>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Link>{" "}
            and Cookies policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0066FF", // Match continue button blue on extreme scrolls
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#38BDF8", // Stunning bleu ciel (sky blue) top background
  },
  topHeader: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#38BDF8",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A202C",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF", // Pure white brand name
    letterSpacing: -1.5,
  },
  locationPin: {
    marginLeft: 6,
  },
  locationPinText: {
    fontSize: 32,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    marginBottom: 28,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  prefixCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    minWidth: 90,
  },
  prefixLabel: {
    fontSize: 11,
    color: "#A0AEC0",
    fontWeight: "600",
    marginBottom: 4,
  },
  prefixContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flagText: {
    fontSize: 15,
  },
  prefixNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3748",
  },
  dropdownArrow: {
    fontSize: 10,
    color: "#A0AEC0",
    fontWeight: "700",
    marginLeft: 2,
  },
  phoneInputBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
  },
  phoneLabel: {
    fontSize: 11,
    color: "#A0AEC0",
    fontWeight: "600",
    marginBottom: 4,
  },
  phoneTextInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    padding: 0,
    height: 22,
  },
  continueButton: {
    backgroundColor: "#0066FF", // Matching blue continue background
    borderRadius: 28,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#FFFFFF", // Pure white continue text
    fontSize: 16,
    fontWeight: "800",
  },
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    fontSize: 12,
    color: "#A0AEC0",
    paddingHorizontal: 14,
    fontWeight: "600",
  },
  socialPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 28,
    height: 52,
    marginBottom: 12,
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
    color: "#2D3748",
  },
  otherMethodsBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  otherMethodsText: {
    fontSize: 13,
    color: "#0066FF", // Matching blue other methods toggle text
    fontWeight: "800",
  },
  emailContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },
  footerText: {
    fontSize: 11,
    color: "#718096",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 20,
    paddingHorizontal: 12,
  },
  footerLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
    color: "#718096",
  },
});
