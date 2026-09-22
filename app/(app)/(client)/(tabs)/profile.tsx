import Colors from "@/constants/Colors";
import {
    sanitizeEmail,
    sanitizeName,
    sanitizeOtp,
    sanitizeText,
} from "@/lib/sanitize";
import { authService } from "@/services/auth.service";
import { LANGUAGE_OPTIONS, useLanguage } from "@/src/context/LanguageContext";
import { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Bell,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Edit3,
    Globe,
    HelpCircle,
    Lock,
    LogOut,
    Mail,
    Phone,
    Shield,
    ShoppingBag,
    Smartphone,
    Tag,
    User as UserIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ClientProfileScreen() {
  const router = useRouter();
  const { t, selectedLanguageName, setLanguage, isRTL } = useLanguage();
  const [user, setUser] = useState<User | any | null>(null);

  // Sub-modal states
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isPersonalInfoModalVisible, setIsPersonalInfoModalVisible] =
    useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isFaqModalVisible, setIsFaqModalVisible] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] =
    useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);

  // Form states - Personal Data
  const [fullNameInput, setFullNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Form states - Email
  const [emailInput, setEmailInput] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Form states - Phone & OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+212");
  const [phoneOtpStep, setPhoneOtpStep] = useState<"input" | "otp">("input");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [lastDispatchedPhone, setLastDispatchedPhone] = useState("");
  const [isWhatsAppMethod, setIsWhatsAppMethod] = useState(false);

  // Form states - Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Form states - Promo
  const [promoCodeInput, setPromoCodeInput] = useState("");

  // Notifications toggles
  const [orderPushNotif, setOrderPushNotif] = useState(true);
  const [offersPushNotif, setOffersPushNotif] = useState(true);
  const [offersEmailNotif, setOffersEmailNotif] = useState(true);

  // Privacy toggles
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [functionalConsent, setFunctionalConsent] = useState(true);
  const [essentialConsent] = useState(true);

  // FAQ accordion active state
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsub = authService.onAuthStateChange((state) => {
      if (state.user) {
        setUser(state.user);
        const name =
          state.user.user_metadata?.full_name ||
          state.user.user_metadata?.name ||
          "";
        setFullNameInput(name);
        setEmailInput(state.user.email || "");
        if (state.user.phone) {
          const raw = state.user.phone.replace("+212", "").replace("+", "");
          setPhoneNumber(raw);
        }
      } else {
        setUser(null);
      }
    });

    authService.getSession().then((session: any) => {
      if (session?.user) {
        setUser(session.user);
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          "";
        setFullNameInput(name);
        setEmailInput(session.user.email || "");
        if (session.user.phone) {
          const raw = session.user.phone.replace("+212", "").replace("+", "");
          setPhoneNumber(raw);
        }
      }
    });

    return () => {
      unsub();
    };
  }, []);

  async function handleLogout() {
    Alert.alert(
      t("profile.logout", "Log out"),
      t("profile.logoutConfirm", "Are you sure you want to log out?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("profile.logout", "Log out"),
          style: "destructive",
          onPress: async () => {
            try {
              await authService.signOut();
            } catch (error) {
              console.warn(error);
            }
          },
        },
      ],
    );
  }

  // ── 1. Update Full Name Handler ──
  async function handleSaveFullName() {
    const clean = sanitizeName(fullNameInput);
    if (!clean) {
      Alert.alert(
        t("common.error", "Error"),
        t("profile.fullName", "Please enter a valid full name"),
      );
      return;
    }

    setIsSavingName(true);
    try {
      await authService.updateProfile({ full_name: clean });
      Alert.alert(
        t("common.success", "Success"),
        t("profile.profileUpdated", "Profile information saved!"),
      );
      setIsPersonalInfoModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        t("common.error", "Error"),
        err?.message || "Failed to update profile",
      );
    } finally {
      setIsSavingName(false);
    }
  }

  // ── 2. Update Email Handler ──
  async function handleSaveEmail() {
    const clean = sanitizeEmail(emailInput);
    if (!clean || !clean.includes("@")) {
      Alert.alert(
        t("common.error", "Error"),
        t("profile.emailInvalid", "Please enter a valid email address"),
      );
      return;
    }

    setIsSavingEmail(true);
    try {
      await authService.updateEmail(clean);
      Alert.alert(
        t("common.success", "Success"),
        t(
          "profile.emailUpdated",
          "Email updated! Please check your inbox for confirmation.",
        ),
      );
      setIsEmailModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        t("common.error", "Error"),
        err?.message || "Failed to update email address",
      );
    } finally {
      setIsSavingEmail(false);
    }
  }

  // ── 3. Dispatch Phone OTP Handler ──
  async function handleSendPhoneOtp(isWhatsApp: boolean = false) {
    const clean = phoneNumber.replace(/[\s\-\(\)]/g, "").trim();
    if (!clean) {
      Alert.alert(
        t("common.error", "Error"),
        t("profile.phoneInvalid", "Please enter a valid phone number"),
      );
      return;
    }

    const fullPhone = phonePrefix + clean;
    setIsWhatsAppMethod(isWhatsApp);
    setLastDispatchedPhone(fullPhone);
    setIsSendingPhoneOtp(true);

    try {
      if (isWhatsApp) {
        const res = await authService.requestWhatsAppOtp(fullPhone);
        Alert.alert(
          "WhatsApp",
          res.message ||
            `Code de vérification envoyé sur WhatsApp au ${fullPhone}`,
        );
      } else {
        await authService.updatePhone(fullPhone);
        Alert.alert(
          "SMS",
          `Code de vérification envoyé par SMS au ${fullPhone}`,
        );
      }
      setPhoneOtpStep("otp");
      setPhoneOtpCode("");
    } catch (err: any) {
      Alert.alert(
        t("common.error", "Error"),
        err?.message || "Impossible d'envoyer le code de vérification.",
      );
    } finally {
      setIsSendingPhoneOtp(false);
    }
  }

  // ── 4. Verify Phone OTP Handler ──
  async function handleVerifyPhoneOtp() {
    const cleanOtp = sanitizeOtp(phoneOtpCode);
    if (!cleanOtp || cleanOtp.length !== 6) {
      Alert.alert(
        t("common.error", "Error"),
        t("profile.enterOtp", "Please enter the 6-digit verification code"),
      );
      return;
    }

    setIsVerifyingPhoneOtp(true);
    try {
      if (isWhatsAppMethod) {
        await authService.verifyWhatsAppOtp(lastDispatchedPhone, cleanOtp);
      } else {
        await authService.verifyPhoneChangeOtp(lastDispatchedPhone, cleanOtp);
      }
      Alert.alert(
        t("common.success", "Success"),
        t("profile.phoneUpdated", "Phone number updated successfully!"),
      );
      setIsPhoneModalVisible(false);
      setPhoneOtpStep("input");
      setPhoneOtpCode("");
    } catch (err: any) {
      Alert.alert(
        t("common.error", "Error"),
        err?.message || "Code incorrect ou expiré.",
      );
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  }

  // ── 5. Change Password Handler ──
  async function handleSavePassword() {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "profile.passwordMinLength",
          "Password must be at least 6 characters",
        ),
      );
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      Alert.alert(
        t("common.error", "Error"),
        t("profile.passwordMismatch", "Passwords do not match"),
      );
      return;
    }

    setIsSavingPassword(true);
    try {
      await authService.updatePassword(
        newPassword,
        currentPassword || undefined,
      );
      Alert.alert(
        t("common.success", "Success"),
        t("profile.passwordUpdated", "Password updated successfully!"),
      );
      setIsPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Alert.alert(
        t("common.error", "Error"),
        err?.message || "Impossible de modifier le mot de passe.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Client";
  const initial = displayName.charAt(0).toUpperCase();
  const clientId = user?.id
    ? user.id.startsWith("client-user-")
      ? `ID: #CL-${user.id.replace("client-user-", "0")}`
      : user.id.length > 8
        ? `ID: #${user.id.slice(0, 8).toUpperCase()}`
        : `ID: #${user.id.toUpperCase()}`
    : "ID: #CL-8842";

  const userPhone =
    user?.phone || user?.user_metadata?.phone || "Non configuré";
  const userEmail = user?.email || "Non configuré";

  const FAQ_ITEMS = [
    {
      q: t("faq.q1", "Who are the couriers?"),
      a: t(
        "faq.a1",
        "Our couriers are independent delivery partners trained to bring your meals and goods safely and fast in Oujda.",
      ),
    },
    {
      q: t("faq.q2", "How do I place an order?"),
      a: t(
        "faq.a2",
        "Select your favorite store, add products to your cart, confirm your exact delivery address on the map, and tap Place Order.",
      ),
    },
    {
      q: t("faq.q3", "How much does delivery cost?"),
      a: t(
        "faq.a3",
        "Delivery fees depend on the store and distance in Oujda, starting from 0 DH on promo partners to 15 DH for express courier service.",
      ),
    },
    {
      q: t("faq.q4", "Is Quickly Livraison available in my neighborhood?"),
      a: t(
        "faq.a4",
        "We deliver across all Oujda neighborhoods: Centre-Ville, Hay Al Qods, Lazaret, Salam, Sidi Yahya, Hay Riad, and surrounding areas.",
      ),
    },
    {
      q: t("faq.q5", "When is the delivery service open?"),
      a: t(
        "faq.a5",
        "Stores are open according to their daily schedules, typically between 07:00 and 01:00. Courier delivery is available whenever partners are active.",
      ),
    },
    {
      q: t("faq.q6", "What can I order?"),
      a: t(
        "faq.a6",
        "Meals, burgers, pizzas, groceries, pharmacy items, bakery pastries, or custom courier pickups using Package Delivery.",
      ),
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── Top Header Bar ── */}
      <View style={styles.organicHeader}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          {/* Top Right Help Pill Button */}
          <View style={styles.topRightHelpRow}>
            <TouchableOpacity
              style={styles.helpPill}
              onPress={() => setIsFaqModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.helpPillText}>
                {t("profile.help", "Help")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Avatar + Client ID */}
          <View
            style={[
              styles.userProfileHero,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>

            <View
              style={[
                styles.profileInfoCol,
                isRTL && { alignItems: "flex-end" },
              ]}
            >
              <Text style={styles.userNameText}>{displayName}</Text>
              <View style={styles.clientIdBadge}>
                <Text style={styles.clientIdText}>{clientId}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Menu List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
          {t("profile.title", "Profile")}
        </Text>

        {/* 1. Order History */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => router.push("/(app)/(client)/(tabs)/orders" as any)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <ShoppingBag
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>
              {t("profile.orderHistory", "Order history")}
            </Text>
          </View>
          <View style={styles.viewInOrdersPill}>
            <Text style={styles.viewInOrdersText}>
              {t("profile.viewInOrders", "View in Orders")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 2. Account */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => setIsAccountModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <UserIcon
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>
              {t("profile.account", "Account")}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color="#9CA3AF"
            style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </TouchableOpacity>

        {/* 3. Promo Codes */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => setIsPromoModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Tag
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>
              {t("profile.promoCodes", "Promo codes")}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color="#9CA3AF"
            style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </TouchableOpacity>

        {/* 4. Language */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => setIsLanguageModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Globe
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>
              {t("profile.language", "Language")}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color="#9CA3AF"
            style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </TouchableOpacity>

        {/* 5. FAQ */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => setIsFaqModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <HelpCircle
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>{t("profile.faq", "FAQ")}</Text>
          </View>
          <ChevronRight
            size={20}
            color="#9CA3AF"
            style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </TouchableOpacity>

        {/* 6. Notifications */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => setIsNotificationsModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Bell
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>
              {t("profile.notifications", "Notifications")}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color="#9CA3AF"
            style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </TouchableOpacity>

        {/* 7. Manage Privacy */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => setIsPrivacyModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Shield
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>
              {t("profile.privacy", "Manage privacy")}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color="#9CA3AF"
            style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </TouchableOpacity>

        {/* 8. Change Password */}
        <TouchableOpacity
          style={[styles.menuRow, isRTL && { flexDirection: "row-reverse" }]}
          onPress={() => setIsPasswordModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Lock
              size={20}
              color="#3C3489"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text style={styles.menuRowTitle}>
              {t("profile.changePassword", "Change password")}
            </Text>
          </View>
          <ChevronRight
            size={20}
            color="#9CA3AF"
            style={isRTL ? { transform: [{ rotate: "180deg" }] } : undefined}
          />
        </TouchableOpacity>

        {/* 9. Log Out */}
        <TouchableOpacity
          style={[
            styles.menuRow,
            isRTL && { flexDirection: "row-reverse" },
            { borderBottomWidth: 0, marginTop: 14, marginBottom: 20 },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.menuRowLeft,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <LogOut
              size={20}
              color="#FF4D6D"
              style={isRTL ? { marginLeft: 14 } : { marginRight: 14 }}
            />
            <Text
              style={[
                styles.menuRowTitle,
                { color: "#FF4D6D", fontWeight: "700" },
              ]}
            >
              {t("profile.logout", "Log out")}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ══════════ MODAL: ACCOUNT OVERVIEW ══════════ */}
      <Modal
        visible={isAccountModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAccountModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsAccountModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.account", "Account")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.modalBody}>
            {/* 1. Full Name Card */}
            <View style={styles.accountCard}>
              <View
                style={[
                  styles.accountCardHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View
                  style={[
                    styles.accountCardIconCol,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <UserIcon size={20} color={Colors.primary} />
                  <Text
                    style={[
                      styles.accountCardLabel,
                      isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                    ]}
                  >
                    {t("profile.fullName", "Full name")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editPillBtn}
                  onPress={() => {
                    setFullNameInput(displayName);
                    setIsPersonalInfoModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Edit3 size={14} color={Colors.primary} />
                  <Text style={styles.editPillText}>
                    {t("common.edit", "Modifier")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.accountCardValue,
                  isRTL && { textAlign: "right" },
                ]}
              >
                {displayName}
              </Text>
            </View>

            {/* 2. Phone Card */}
            <View style={styles.accountCard}>
              <View
                style={[
                  styles.accountCardHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View
                  style={[
                    styles.accountCardIconCol,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <Phone size={20} color={Colors.primary} />
                  <Text
                    style={[
                      styles.accountCardLabel,
                      isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                    ]}
                  >
                    {t("profile.changePhone", "Phone number")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editPillBtn}
                  onPress={() => {
                    setPhoneOtpStep("input");
                    setIsPhoneModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Edit3 size={14} color={Colors.primary} />
                  <Text style={styles.editPillText}>
                    {t("common.edit", "Modifier")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.accountCardValue,
                  isRTL && { textAlign: "right" },
                ]}
              >
                {userPhone}
              </Text>
            </View>

            {/* 3. Email Card */}
            <View style={styles.accountCard}>
              <View
                style={[
                  styles.accountCardHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View
                  style={[
                    styles.accountCardIconCol,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <Mail size={20} color={Colors.primary} />
                  <Text
                    style={[
                      styles.accountCardLabel,
                      isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                    ]}
                  >
                    {t("profile.email", "Email address")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editPillBtn}
                  onPress={() => {
                    setEmailInput(user?.email || "");
                    setIsEmailModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Edit3 size={14} color={Colors.primary} />
                  <Text style={styles.editPillText}>
                    {t("common.edit", "Modifier")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.accountCardValue,
                  isRTL && { textAlign: "right" },
                ]}
              >
                {userEmail}
              </Text>
            </View>

            {/* 4. Password Card */}
            <View style={styles.accountCard}>
              <View
                style={[
                  styles.accountCardHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View
                  style={[
                    styles.accountCardIconCol,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <Lock size={20} color={Colors.primary} />
                  <Text
                    style={[
                      styles.accountCardLabel,
                      isRTL ? { marginRight: 8 } : { marginLeft: 8 },
                    ]}
                  >
                    {t("profile.changePassword", "Change password")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editPillBtn}
                  onPress={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setIsPasswordModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Edit3 size={14} color={Colors.primary} />
                  <Text style={styles.editPillText}>
                    {t("common.edit", "Modifier")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.accountCardValue,
                  isRTL && { textAlign: "right" },
                ]}
              >
                ••••••••••••
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: EDIT PERSONAL DATA (FULL NAME) ══════════ */}
      <Modal
        visible={isPersonalInfoModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPersonalInfoModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPersonalInfoModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.editPersonalData", "Informations personnelles")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.modalBody}>
            <Text
              style={[styles.fieldEyebrow, isRTL && { textAlign: "right" }]}
            >
              {t("profile.fullName", "Nom complet")}
            </Text>
            <TextInput
              style={[styles.underlinedInput, isRTL && { textAlign: "right" }]}
              placeholder="Ex: Yassine Chidmi"
              placeholderTextColor="#9CA3AF"
              value={fullNameInput}
              onChangeText={setFullNameInput}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                isSavingName && styles.btnDisabled,
              ]}
              onPress={handleSaveFullName}
              disabled={isSavingName}
              activeOpacity={0.8}
            >
              {isSavingName ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryActionBtnText}>
                  {t("profile.done", "Enregistrer")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: EDIT EMAIL ══════════ */}
      <Modal
        visible={isEmailModalVisible}
        animationType="slide"
        onRequestClose={() => setIsEmailModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsEmailModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.changeEmail", "Modifier l'adresse email")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.modalBody}>
            <Text
              style={[styles.fieldEyebrow, isRTL && { textAlign: "right" }]}
            >
              {t("profile.email", "Adresse email")}
            </Text>
            <TextInput
              style={[styles.underlinedInput, isRTL && { textAlign: "right" }]}
              placeholder="email@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailInput}
              onChangeText={setEmailInput}
            />

            <Text
              style={[styles.helperNotice, isRTL && { textAlign: "right" }]}
            >
              Un lien de confirmation sera envoyé à cette nouvelle adresse pour
              valider le changement.
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                isSavingEmail && styles.btnDisabled,
              ]}
              onPress={handleSaveEmail}
              disabled={isSavingEmail}
              activeOpacity={0.8}
            >
              {isSavingEmail ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryActionBtnText}>
                  {t("profile.done", "Enregistrer")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: PHONE NUMBER VERIFICATION ══════════ */}
      <Modal
        visible={isPhoneModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPhoneModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => {
                if (phoneOtpStep === "otp") {
                  setPhoneOtpStep("input");
                } else {
                  setIsPhoneModalVisible(false);
                }
              }}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {phoneOtpStep === "input"
                ? t("profile.changePhone", "Numéro de téléphone")
                : t("profile.verify", "Vérification OTP")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.phoneModalBody}>
            {phoneOtpStep === "input" ? (
              <>
                <Text
                  style={[
                    styles.phoneHelperText,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  Nous vous enverrons un code de confirmation à 6 chiffres par
                  SMS ou WhatsApp.
                </Text>

                <View
                  style={[
                    styles.phoneInputRow,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  {/* Prefix */}
                  <View style={styles.prefixBox}>
                    <Text style={styles.flagEmoji}>🇲🇦</Text>
                    <Text style={styles.prefixNumber}>{phonePrefix}</Text>
                    <ChevronDown size={16} color="#7F77DD" />
                  </View>

                  {/* Phone Input */}
                  <TextInput
                    style={[styles.phoneField, isRTL && { textAlign: "right" }]}
                    placeholder="6 00 00 00 00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>

                {/* Action Buttons: SMS vs WhatsApp */}
                <View
                  style={[
                    styles.dualDispatchRow,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.smsOutlineBtn,
                      isSendingPhoneOtp && styles.btnDisabled,
                    ]}
                    onPress={() => handleSendPhoneOtp(false)}
                    disabled={isSendingPhoneOtp}
                    activeOpacity={0.8}
                  >
                    {isSendingPhoneOtp && !isWhatsAppMethod ? (
                      <ActivityIndicator color={Colors.primary} size="small" />
                    ) : (
                      <Text style={styles.smsOutlineText}>SMS</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.whatsAppFilledBtn,
                      isSendingPhoneOtp && styles.btnDisabled,
                    ]}
                    onPress={() => handleSendPhoneOtp(true)}
                    disabled={isSendingPhoneOtp}
                    activeOpacity={0.8}
                  >
                    {isSendingPhoneOtp && isWhatsAppMethod ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.whatsAppFilledText}>WhatsApp</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.phoneHelperText,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  Saisissez le code à 6 chiffres envoyé au {lastDispatchedPhone}
                </Text>

                <TextInput
                  style={styles.otpInputField}
                  placeholder="000000"
                  placeholderTextColor="#A5A0DF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={phoneOtpCode}
                  onChangeText={setPhoneOtpCode}
                  autoFocus
                />

                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    isVerifyingPhoneOtp && styles.btnDisabled,
                  ]}
                  onPress={handleVerifyPhoneOtp}
                  disabled={isVerifyingPhoneOtp}
                  activeOpacity={0.8}
                >
                  {isVerifyingPhoneOtp ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryActionBtnText}>
                      {t("profile.verify", "Vérifier le code")}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendTextBtn}
                  onPress={() => handleSendPhoneOtp(isWhatsAppMethod)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>
                    Renvoyer un nouveau code
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: CHANGE PASSWORD ══════════ */}
      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPasswordModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.changePassword", "Change password")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.passwordModalBody}>
            <Text
              style={[styles.fieldEyebrow, isRTL && { textAlign: "right" }]}
            >
              {t("profile.currentPassword", "CURRENT PASSWORD")}
            </Text>
            <TextInput
              style={[styles.underlinedInput, isRTL && { textAlign: "right" }]}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text
              style={[
                styles.fieldEyebrow,
                { marginTop: 24 },
                isRTL && { textAlign: "right" },
              ]}
            >
              {t("profile.newPassword", "NEW PASSWORD")}
            </Text>
            <TextInput
              style={[styles.underlinedInput, isRTL && { textAlign: "right" }]}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text
              style={[
                styles.fieldEyebrow,
                { marginTop: 24 },
                isRTL && { textAlign: "right" },
              ]}
            >
              {t("profile.confirmPassword", "CONFIRM PASSWORD")}
            </Text>
            <TextInput
              style={[styles.underlinedInput, isRTL && { textAlign: "right" }]}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                isSavingPassword && styles.btnDisabled,
              ]}
              onPress={handleSavePassword}
              disabled={isSavingPassword}
              activeOpacity={0.8}
            >
              {isSavingPassword ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryActionBtnText}>
                  {t("profile.done", "Enregistrer")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: PROMO CODES ══════════ */}
      <Modal
        visible={isPromoModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPromoModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPromoModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.promoCodes", "Promo codes")}
            </Text>
            <TouchableOpacity style={styles.circleBackBtn}>
              <HelpCircle size={18} color="#3C3489" />
            </TouchableOpacity>
          </View>

          <View style={styles.promoModalBody}>
            <Text
              style={[styles.promoInputLabel, isRTL && { textAlign: "right" }]}
            >
              {t("profile.addPromoCode", "Ajouter un code promo")}
            </Text>
            <TextInput
              style={styles.promoInputCard}
              placeholder="Ex: QUICKLY20, OUJDAFREE"
              placeholderTextColor="#9CA3AF"
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.darkGreenPillBtn}
              onPress={() => {
                const cleanCode = sanitizeText(promoCodeInput, {
                  maxLength: 30,
                }).toUpperCase();
                if (!cleanCode) {
                  Alert.alert(
                    "Code promo",
                    "Veuillez saisir un code promotionnel.",
                  );
                  return;
                }
                Alert.alert(
                  "Code Appliqué ! 🎉",
                  `Le code ${cleanCode} vous offre -20% sur votre prochaine commande.`,
                );
                setIsPromoModalVisible(false);
                setPromoCodeInput("");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.darkGreenPillBtnText}>
                {t("common.apply", "Appliquer")}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: LANGUAGE ══════════ */}
      <Modal
        visible={isLanguageModalVisible}
        animationType="slide"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsLanguageModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.preferredLang", "Preferred language")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.languageListBody}>
            {LANGUAGE_OPTIONS.map((lang) => {
              const isSelected = selectedLanguageName === lang.id;
              return (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageRow,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                  onPress={async () => {
                    await setLanguage(lang.id);
                    setIsLanguageModalVisible(false);
                  }}
                >
                  <View style={isRTL && { alignItems: "flex-end" }}>
                    <Text style={styles.languageName}>{lang.label}</Text>
                    <Text style={styles.languageSub}>{lang.sub}</Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: FAQ ACCORDION ══════════ */}
      <Modal
        visible={isFaqModalVisible}
        animationType="slide"
        onRequestClose={() => setIsFaqModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsFaqModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>{t("profile.faq", "FAQ")}</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            style={styles.faqListBody}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                styles.faqCategoryHeading,
                isRTL && { textAlign: "right" },
              ]}
            >
              {t("profile.helpSupport", "Aide & Support")}
            </Text>

            {FAQ_ITEMS.map((item, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <View key={idx} style={styles.faqItemCard}>
                  <TouchableOpacity
                    style={[
                      styles.faqQuestionRow,
                      isRTL && { flexDirection: "row-reverse" },
                    ]}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.faqQuestionText,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {item.q}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#3C3489" />
                    ) : (
                      <ChevronDown size={20} color="#3C3489" />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerBox}>
                      <Text
                        style={[
                          styles.faqAnswerText,
                          isRTL && { textAlign: "right" },
                        ]}
                      >
                        {item.a}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: NOTIFICATIONS ══════════ */}
      <Modal
        visible={isNotificationsModalVisible}
        animationType="slide"
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsNotificationsModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.notifications", "Notifications")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.notificationsBody}>
            <Text
              style={[styles.notifGroupTitle, isRTL && { textAlign: "right" }]}
            >
              {t("notif.orderUpdates", "Suivi des commandes")}
            </Text>
            <Text
              style={[styles.notifGroupDesc, isRTL && { textAlign: "right" }]}
            >
              Notifications directes sur la préparation et l'arrivée de votre
              coursier.
            </Text>

            <View
              style={[
                styles.notifToggleRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.notifRowLeft,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Smartphone
                  size={20}
                  color="#3C3489"
                  style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                />
                <View style={isRTL && { alignItems: "flex-end" }}>
                  <Text style={styles.notifRowTitle}>Notifications Push</Text>
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>Recommandé</Text>
                  </View>
                </View>
              </View>
              <Switch
                value={orderPushNotif}
                onValueChange={setOrderPushNotif}
                trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                thumbColor={orderPushNotif ? Colors.cta : "#F3F4F6"}
              />
            </View>

            <Text
              style={[
                styles.notifGroupTitle,
                { marginTop: 32 },
                isRTL && { textAlign: "right" },
              ]}
            >
              {t("notif.offers", "Offres & Promotions")}
            </Text>
            <Text
              style={[styles.notifGroupDesc, isRTL && { textAlign: "right" }]}
            >
              Bons de réduction et promotions exclusives à Oujda.
            </Text>

            <View
              style={[
                styles.notifToggleRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.notifRowLeft,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Smartphone
                  size={20}
                  color="#3C3489"
                  style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                />
                <Text style={styles.notifRowTitle}>Notifications Push</Text>
              </View>
              <Switch
                value={offersPushNotif}
                onValueChange={setOffersPushNotif}
                trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                thumbColor={offersPushNotif ? Colors.cta : "#F3F4F6"}
              />
            </View>

            <View
              style={[
                styles.notifToggleRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.notifRowLeft,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Mail
                  size={20}
                  color="#3C3489"
                  style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                />
                <Text style={styles.notifRowTitle}>Emails personnalisés</Text>
              </View>
              <Switch
                value={offersEmailNotif}
                onValueChange={setOffersEmailNotif}
                trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                thumbColor={offersEmailNotif ? Colors.cta : "#F3F4F6"}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: MANAGE PRIVACY ══════════ */}
      <Modal
        visible={isPrivacyModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPrivacyModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View
            style={[
              styles.subModalHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPrivacyModalVisible(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={20}
                color="#3C3489"
                style={
                  isRTL ? { transform: [{ rotate: "180deg" }] } : undefined
                }
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.privacy", "Manage privacy")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.privacyBody}>
            <Text
              style={[styles.privacyHeading, isRTL && { textAlign: "right" }]}
            >
              {t("profile.privacy", "Paramètres de confidentialité")}
            </Text>
            <Text style={[styles.privacyDesc, isRTL && { textAlign: "right" }]}>
              Gérez votre consentement quant à l'utilisation des données pour la
              livraison et l'analyse du service.
            </Text>

            <View style={styles.consentCard}>
              <View
                style={[
                  styles.consentHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Text style={styles.consentTitle}>Marketing</Text>
                <Switch
                  value={marketingConsent}
                  onValueChange={setMarketingConsent}
                  trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                  thumbColor={marketingConsent ? Colors.cta : "#F3F4F6"}
                />
              </View>
              <Text
                style={[styles.consentSub, isRTL && { textAlign: "right" }]}
              >
                Permet de vous proposer des offres pertinentes et
                personnalisées.
              </Text>
            </View>

            <View style={styles.consentCard}>
              <View
                style={[
                  styles.consentHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Text style={styles.consentTitle}>Fonctionnel</Text>
                <Switch
                  value={functionalConsent}
                  onValueChange={setFunctionalConsent}
                  trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                  thumbColor={functionalConsent ? Colors.cta : "#F3F4F6"}
                />
              </View>
              <Text
                style={[styles.consentSub, isRTL && { textAlign: "right" }]}
              >
                Permet d'analyser l'utilisation de l'application afin d'en
                améliorer les performances.
              </Text>
            </View>

            <View style={styles.consentCard}>
              <View
                style={[
                  styles.consentHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Text style={styles.consentTitle}>Essentiel</Text>
                <Switch
                  value={essentialConsent}
                  disabled
                  trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                  thumbColor={Colors.cta}
                />
              </View>
              <Text
                style={[styles.consentSub, isRTL && { textAlign: "right" }]}
              >
                Requis pour faire fonctionner le service de livraison, le
                paiement et le suivi de position.
              </Text>
            </View>

            <View
              style={[
                styles.privacyActionsRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <TouchableOpacity
                style={styles.denyButton}
                onPress={() => {
                  setMarketingConsent(false);
                  setFunctionalConsent(false);
                  setIsPrivacyModalVisible(false);
                }}
              >
                <Text style={styles.denyText}>
                  {t("common.deny", "Refuser")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptAllButton}
                onPress={() => {
                  setMarketingConsent(true);
                  setFunctionalConsent(true);
                  setIsPrivacyModalVisible(false);
                  Alert.alert(
                    t("common.success", "Success"),
                    "Vos préférences ont été enregistrées.",
                  );
                }}
              >
                <Text style={styles.acceptAllText}>
                  {t("common.acceptAll", "Tout accepter")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  organicHeader: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerSafe: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 12 : 0,
  },
  topRightHelpRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  helpPill: {
    backgroundColor: Colors.cta,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  helpPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userProfileHero: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.primary,
  },
  profileInfoCol: {
    flex: 1,
    justifyContent: "center",
  },
  userNameText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  clientIdBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  clientIdText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 130,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#3C3489",
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C3489",
  },
  viewInOrdersPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  viewInOrdersText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3C3489",
  },

  // SubModal Global Styles
  subModalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  subModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  circleBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3C3489",
  },

  modalBody: {
    padding: 24,
  },

  // Account Card Styles
  accountCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  accountCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accountCardIconCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  accountCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7F77DD",
  },
  editPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  accountCardValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },

  // Phone screen styles
  phoneModalBody: {
    padding: 20,
  },
  phoneHelperText: {
    fontSize: 14,
    color: "#7F77DD",
    marginBottom: 20,
    lineHeight: 20,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  prefixBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  prefixNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C3489",
  },
  phoneField: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#3C3489",
  },
  dualDispatchRow: {
    flexDirection: "row",
    gap: 12,
  },
  smsOutlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
  },
  smsOutlineText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primary,
  },
  whatsAppFilledBtn: {
    flex: 1,
    backgroundColor: Colors.cta,
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
  },
  whatsAppFilledText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  otpInputField: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "800",
    color: "#3C3489",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 24,
  },
  resendTextBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },

  // Password & Inputs styles
  passwordModalBody: {
    padding: 24,
  },
  fieldEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7F77DD",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  underlinedInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.primary,
    paddingVertical: 8,
    fontSize: 16,
    color: "#3C3489",
    marginBottom: 16,
  },
  helperNotice: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
  },
  primaryActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  primaryActionBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Promo screen styles
  promoModalBody: {
    padding: 20,
  },
  promoInputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7F77DD",
    marginBottom: 8,
  },
  promoInputCard: {
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: "#3C3489",
    marginBottom: 24,
  },
  darkGreenPillBtn: {
    width: "100%",
    backgroundColor: Colors.cta,
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  darkGreenPillBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Language screen styles
  languageListBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  languageName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C3489",
  },
  languageSub: {
    fontSize: 13,
    color: "#7F77DD",
    marginTop: 2,
  },

  // FAQ accordion styles
  faqListBody: {
    paddingHorizontal: 20,
  },
  faqCategoryHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7F77DD",
    marginTop: 20,
    marginBottom: 12,
  },
  faqItemCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#3C3489",
    marginRight: 10,
  },
  faqAnswerBox: {
    paddingBottom: 16,
    paddingRight: 10,
  },
  faqAnswerText: {
    fontSize: 13,
    color: "#7F77DD",
    lineHeight: 20,
  },

  // Notifications screen styles
  notificationsBody: {
    padding: 20,
  },
  notifGroupTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 4,
  },
  notifGroupDesc: {
    fontSize: 13,
    color: "#7F77DD",
    lineHeight: 18,
    marginBottom: 16,
  },
  notifToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  notifRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notifRowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3C3489",
  },
  notifBadge: {
    backgroundColor: "#FFD166",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  notifBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3C3489",
  },

  // Privacy screen styles
  privacyBody: {
    padding: 20,
  },
  privacyHeading: {
    fontSize: 20,
    fontWeight: "900",
    color: "#3C3489",
    marginBottom: 8,
  },
  privacyDesc: {
    fontSize: 13,
    color: "#7F77DD",
    lineHeight: 18,
    marginBottom: 20,
  },
  consentCard: {
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  consentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  consentSub: {
    fontSize: 13,
    color: "#7F77DD",
    lineHeight: 18,
  },
  privacyActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  denyButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  denyText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  acceptAllButton: {
    backgroundColor: Colors.cta,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  acceptAllText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
