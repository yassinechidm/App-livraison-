import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
      const role = authService.getUserRole()?.toLowerCase();
      if (role === "admin") {
        router.replace("/(app)/(admin)/(tabs)" as any);
      } else if (role === "delivery") {
        router.replace("/(app)/(delivery)/(tabs)" as any);
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
      if (role === "admin") {
        router.replace("/(app)/(admin)/(tabs)" as any);
      } else if (role === "delivery") {
        router.replace("/(app)/(delivery)/(tabs)" as any);
      } else {
        router.replace("/(app)/(client)/(tabs)" as any);
      }
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
        style={{ flex: 1, width: "100%", maxWidth: "100%" }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Background (sky blue header with brand logo) */}
        <View style={styles.topHeader}>
          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleQuickDemo("client")}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

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

          {/* Social Logins */}
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

          {/* Other methods Toggle */}
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
    width: "100%",
    overflow: "hidden",
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: "#38BDF8",
  },
  topHeader: {
    height: 140,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#38BDF8",
  },
  skipButton: {
    position: "absolute",
    top: 24,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    paddingHorizontal: 16,
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
    marginTop: 14,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1.5,
  },
  locationPin: {
    marginLeft: 6,
  },
  locationPinText: {
    fontSize: 28,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: "#718096",
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
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    width: 95,
    flexShrink: 0,
  },
  prefixLabel: {
    fontSize: 11,
    color: "#A0AEC0",
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
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
  },
  phoneLabel: {
    fontSize: 11,
    color: "#A0AEC0",
    fontWeight: "600",
    marginBottom: 2,
  },
  phoneTextInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    padding: 0,
    height: 22,
    width: "100%",
  },
  continueButton: {
    backgroundColor: "#0066FF",
    borderRadius: 28,
    height: 50,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
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
    color: "#2D3748",
  },
  otherMethodsBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 6,
  },
  otherMethodsText: {
    fontSize: 13,
    color: "#0066FF",
    fontWeight: "800",
  },
  emailContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  footerText: {
    fontSize: 11,
    color: "#718096",
    textAlign: "center",
    lineHeight: 15,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  footerLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
    color: "#718096",
  },
});
