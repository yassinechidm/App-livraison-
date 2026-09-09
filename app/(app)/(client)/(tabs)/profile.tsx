import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { LANGUAGE_OPTIONS, useLanguage } from "@/src/context/LanguageContext";
import { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import {
    Bell,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Globe,
    HelpCircle,
    Info,
    Lock,
    LogOut,
    Mail,
    Shield,
    ShoppingBag,
    Smartphone,
    Tag,
    User as UserIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ClientProfileScreen() {
  const router = useRouter();
  const { t, selectedLanguageName, setLanguage } = useLanguage();
  const [user, setUser] = useState<User | any | null>(null);

  // Sub-modal states matching the screenshots
  const [isFriendsModalVisible, setIsFriendsModalVisible] = useState(false);
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isFaqModalVisible, setIsFaqModalVisible] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] =
    useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+212");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Notifications toggles (Screenshot #10)
  const [orderPushNotif, setOrderPushNotif] = useState(true);
  const [offersPushNotif, setOffersPushNotif] = useState(true);
  const [offersEmailNotif, setOffersEmailNotif] = useState(true);

  // Privacy toggles (Screenshot #9 & #20 & #21)
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [functionalConsent, setFunctionalConsent] = useState(true);
  const [essentialConsent, setEssentialConsent] = useState(true);

  // FAQ accordion active state
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    authService.getSession().then((session: any) => {
      if (session?.user) {
        setUser(session.user);
      }
    });
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

  const displayName = user?.email?.split("@")[0] ?? "Client";
  const initial = displayName.charAt(0).toUpperCase();
  const clientId = user?.id
    ? user.id.startsWith("client-user-")
      ? `ID: #CL-${user.id.replace("client-user-", "0")}`
      : user.id.length > 8
        ? `ID: #${user.id.slice(0, 8).toUpperCase()}`
        : `ID: #${user.id.toUpperCase()}`
    : "ID: #CL-8842";

  const FAQ_ITEMS = [
    {
      q: "Who are the couriers?",
      a: "Our couriers are independent delivery partners trained to bring your meals and goods safely and fast in Oujda.",
    },
    {
      q: "How do I place an order?",
      a: "Select your favorite store, add products to your cart, confirm your exact delivery address on the map, and tap Place Order.",
    },
    {
      q: "How much does delivery cost?",
      a: "Delivery fees depend on the store and distance in Oujda, starting from 0 DH on promo partners to 15 DH for express courier service.",
    },
    {
      q: "Is Glovo available in my neighborhood?",
      a: "We deliver across all Oujda neighborhoods: Centre-Ville, Hay Al Qods, Lazaret, Salam, Sidi Yahya, Hay Riad, and surrounding areas.",
    },
    {
      q: "When is Glovo open?",
      a: "Stores are open according to their daily schedules, typically between 07:00 and 01:00. Courier delivery is available whenever partners are active.",
    },
    {
      q: "How do I schedule an order and change details of my scheduled order?",
      a: "You can choose a future delivery window during checkout or contact support through the Help button.",
    },
    {
      q: "What can I order?",
      a: "Meals, burgers, pizzas, groceries, pharmacy items, bakery pastries, or custom courier pickups using Package Delivery.",
    },
    {
      q: "What type of vehicles do couriers use for delivery? How big can my orders be?",
      a: "Couriers ride motorcycles and scooters equipped with thermal insulated boxes suitable for items up to 10kg.",
    },
    {
      q: "Do you transport animals?",
      a: "No, courier transport of live animals or pets is prohibited by our safety policies.",
    },
    {
      q: "I want to return a product. What do I do?",
      a: "Please report any damaged or missing item via the Help & Support button within 24 hours of delivery.",
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── Top Yellow Header (Screenshot #8) ── */}
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
          <View style={styles.userProfileHero}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.userNameText}>{displayName}</Text>
              <View style={styles.clientIdBadge}>
                <Text style={styles.clientIdText}>{clientId}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── White Sheet Menu List (Screenshot #8) ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Profile</Text>

        {/* 1. Order History */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(app)/(client)/(tabs)/orders" as any)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <ShoppingBag
              size={20}
              color="#3C3489"
              style={{ marginRight: 14 }}
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
          style={styles.menuRow}
          onPress={() => setIsPhoneModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <UserIcon size={20} color="#3C3489" style={{ marginRight: 14 }} />
            <Text style={styles.menuRowTitle}>
              {t("profile.account", "Account")}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 3. Promo Codes */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsPromoModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <Tag size={20} color="#3C3489" style={{ marginRight: 14 }} />
            <Text style={styles.menuRowTitle}>
              {t("profile.promoCodes", "Promo codes")}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 4. Language */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsLanguageModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <Globe size={20} color="#3C3489" style={{ marginRight: 14 }} />
            <Text style={styles.menuRowTitle}>
              {t("profile.language", "Language")}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 5. FAQ */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsFaqModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <HelpCircle size={20} color="#3C3489" style={{ marginRight: 14 }} />
            <Text style={styles.menuRowTitle}>{t("profile.faq", "FAQ")}</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 6. Notifications */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsNotificationsModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <Bell size={20} color="#3C3489" style={{ marginRight: 14 }} />
            <Text style={styles.menuRowTitle}>
              {t("profile.notifications", "Notifications")}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 7. Manage Privacy */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsPrivacyModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <Shield size={20} color="#3C3489" style={{ marginRight: 14 }} />
            <Text style={styles.menuRowTitle}>
              {t("profile.privacy", "Manage privacy")}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 8. Change Password */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsPasswordModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <Lock size={20} color="#3C3489" style={{ marginRight: 14 }} />
            <Text style={styles.menuRowTitle}>
              {t("profile.changePassword", "Change password")}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 9. Log Out */}
        <TouchableOpacity
          style={[
            styles.menuRow,
            { borderBottomWidth: 0, marginTop: 14, marginBottom: 20 },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.menuRowLeft}>
            <LogOut size={20} color="#FF4D6D" style={{ marginRight: 14 }} />
            <Text
              style={[
                styles.menuRowTitle,
                { color: "#FF4D6D", fontWeight: "700" },
              ]}
            >
              Log out
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ══════════ MODAL: CONNECT WITH FRIENDS (Screenshot #7) ══════════ */}
      <Modal
        visible={isFriendsModalVisible}
        animationType="slide"
        onRequestClose={() => setIsFriendsModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsFriendsModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>Friends</Text>
            <TouchableOpacity style={styles.circleBackBtn}>
              <Info size={18} color="#3C3489" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.friendsModalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Visual Food Card Cards */}
            <View style={styles.friendsCardsGraphic}>
              <View style={[styles.graphicCard, styles.graphicCardLeft]}>
                <View style={styles.foodPlaceholderCircle}>
                  <Text style={{ fontSize: 36 }}>🍛</Text>
                </View>
                <View style={styles.graphicCardStat}>
                  <Text style={styles.graphicCardStatText}>👍 98% (410)</Text>
                </View>
              </View>

              <View style={[styles.graphicCard, styles.graphicCardRight]}>
                <View style={styles.foodPlaceholderCircle}>
                  <Text style={{ fontSize: 36 }}>🍔</Text>
                </View>
                <View style={styles.graphicCardStat}>
                  <Text style={styles.graphicCardStatText}>
                    🛍️ 500+ ordered
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.friendsHeroTitle}>
              Discover what your friends love to order
            </Text>
            <Text style={styles.friendsHeroSubtitle}>
              Connect and get inspired by your friends' food choices in Oujda
            </Text>

            <TouchableOpacity
              style={styles.darkGreenPillBtn}
              onPress={() => {
                Alert.alert(
                  "Contacts",
                  "Would you like to sync contacts to discover friends on QuickDelivery?",
                  [
                    { text: t("common.cancel", "Cancel"), style: "cancel" },
                    {
                      text: "Allow",
                      onPress: () =>
                        Alert.alert("Success", "3 friends found in Oujda!"),
                    },
                  ],
                );
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.darkGreenPillBtnText}>Add friends</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lightGreyPillBtn}
              onPress={() => setIsFriendsModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.lightGreyPillBtnText}>Learn more</Text>
            </TouchableOpacity>

            <Text style={styles.privacyDisclaimer}>
              When you tap "Add Friends", the app will ask for access to your
              contacts to help you connect with friends. Your contacts are
              processed securely and not shared with third parties.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: PHONE NUMBER VERIFICATION (Screenshot #6) ══════════ */}
      <Modal
        visible={isPhoneModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPhoneModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPhoneModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>Phone number</Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.phoneModalBody}>
            <Text style={styles.phoneHelperText}>
              We'll send a 4-digit verification code to this number.
            </Text>

            <View style={styles.phoneInputRow}>
              {/* Prefix */}
              <View style={styles.prefixBox}>
                <Text style={styles.flagEmoji}>🇲🇦</Text>
                <Text style={styles.prefixNumber}>{phonePrefix}</Text>
                <ChevronDown size={16} color="#7F77DD" />
              </View>

              {/* Phone Input */}
              <TextInput
                style={styles.phoneField}
                placeholder="6 00 00 00 00"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            {/* Action Buttons: SMS vs WhatsApp (Screenshot #6) */}
            <View style={styles.dualDispatchRow}>
              <TouchableOpacity
                style={styles.smsOutlineBtn}
                onPress={() => {
                  if (!phoneNumber.trim()) {
                    Alert.alert(
                      "Numéro requis",
                      "Veuillez entrer votre numéro de téléphone.",
                    );
                    return;
                  }
                  Alert.alert(
                    "Code SMS",
                    `Code de vérification envoyé par SMS au ${phonePrefix} ${phoneNumber}`,
                  );
                  setIsPhoneModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.smsOutlineText}>SMS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsAppFilledBtn}
                onPress={() => {
                  if (!phoneNumber.trim()) {
                    Alert.alert(
                      "Numéro requis",
                      "Veuillez entrer votre numéro de téléphone.",
                    );
                    return;
                  }
                  Alert.alert(
                    "WhatsApp",
                    `Code de vérification envoyé sur WhatsApp au ${phonePrefix} ${phoneNumber}`,
                  );
                  setIsPhoneModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.whatsAppFilledText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: CHANGE PASSWORD (Screenshot #5) ══════════ */}
      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPasswordModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.changePassword", "Change password")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.passwordModalBody}>
            <Text style={styles.fieldEyebrow}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="Current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text style={[styles.fieldEyebrow, { marginTop: 28 }]}>
              NEW PASSWORD
            </Text>
            <TextInput
              style={styles.underlinedInput}
              placeholder="New password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity
              style={styles.passwordDoneBtn}
              onPress={() => {
                if (!newPassword.trim()) {
                  Alert.alert(
                    "Erreur",
                    "Veuillez entrer un nouveau mot de passe.",
                  );
                  return;
                }
                Alert.alert(
                  "Mot de passe mis à jour",
                  "Votre nouveau mot de passe a été enregistré.",
                );
                setIsPasswordModalVisible(false);
                setCurrentPassword("");
                setNewPassword("");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.passwordDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: PROMO CODES (Screenshot #16) ══════════ */}
      <Modal
        visible={isPromoModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPromoModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPromoModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
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
            <Text style={styles.promoInputLabel}>Add promo code</Text>
            <TextInput
              style={styles.promoInputCard}
              placeholder="Enter code (ex: QUICKLY20, OUJDAFREE)"
              placeholderTextColor="#9CA3AF"
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.darkGreenPillBtn}
              onPress={() => {
                if (!promoCodeInput.trim()) {
                  Alert.alert(
                    "Code promo",
                    "Veuillez saisir un code promotionnel.",
                  );
                  return;
                }
                Alert.alert(
                  "Code Appliqué ! 🎉",
                  `Le code ${promoCodeInput.toUpperCase()} vous offre -20% sur votre prochaine commande.`,
                );
                setIsPromoModalVisible(false);
                setPromoCodeInput("");
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.darkGreenPillBtnText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: LANGUAGE (Screenshot #17 & #18) ══════════ */}
      <Modal
        visible={isLanguageModalVisible}
        animationType="slide"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsLanguageModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
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
                  style={styles.languageRow}
                  onPress={async () => {
                    await setLanguage(lang.id);
                    setIsLanguageModalVisible(false);
                  }}
                >
                  <View>
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

      {/* ══════════ MODAL: FAQ ACCORDION (Screenshot #19) ══════════ */}
      <Modal
        visible={isFaqModalVisible}
        animationType="slide"
        onRequestClose={() => setIsFaqModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsFaqModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>{t("profile.faq", "FAQ")}</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            style={styles.faqListBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.faqCategoryHeading}>Help & support</Text>

            {FAQ_ITEMS.map((item, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <View key={idx} style={styles.faqItemCard}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestionText}>{item.q}</Text>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#3C3489" />
                    ) : (
                      <ChevronDown size={20} color="#3C3489" />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswerText}>{item.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════ MODAL: NOTIFICATIONS (Screenshot #10) ══════════ */}
      <Modal
        visible={isNotificationsModalVisible}
        animationType="slide"
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsNotificationsModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>
              {t("profile.notifications", "Notifications")}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.notificationsBody}>
            {/* Section 1: Order updates */}
            <Text style={styles.notifGroupTitle}>Order updates</Text>
            <Text style={styles.notifGroupDesc}>
              Key events as they happen and messages from Support and couriers
              related to your order
            </Text>

            <View style={styles.notifToggleRow}>
              <View style={styles.notifRowLeft}>
                <Smartphone
                  size={20}
                  color="#3C3489"
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={styles.notifRowTitle}>Push notifications</Text>
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>Recommended</Text>
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

            {/* Section 2: Offers */}
            <Text style={[styles.notifGroupTitle, { marginTop: 32 }]}>
              Offers
            </Text>
            <Text style={styles.notifGroupDesc}>
              Discounts, promotions and vouchers for you
            </Text>

            <View style={styles.notifToggleRow}>
              <View style={styles.notifRowLeft}>
                <Smartphone
                  size={20}
                  color="#3C3489"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.notifRowTitle}>Push notifications</Text>
              </View>
              <Switch
                value={offersPushNotif}
                onValueChange={setOffersPushNotif}
                trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                thumbColor={offersPushNotif ? Colors.cta : "#F3F4F6"}
              />
            </View>

            <View style={styles.notifToggleRow}>
              <View style={styles.notifRowLeft}>
                <Mail size={20} color="#3C3489" style={{ marginRight: 10 }} />
                <Text style={styles.notifRowTitle}>Personalized emails</Text>
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

      {/* ══════════ MODAL: MANAGE PRIVACY (Screenshot #9 & #20 & #21) ══════════ */}
      <Modal
        visible={isPrivacyModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPrivacyModalVisible(false)}
      >
        <SafeAreaView style={styles.subModalContainer}>
          <View style={styles.subModalHeader}>
            <TouchableOpacity
              style={styles.circleBackBtn}
              onPress={() => setIsPrivacyModalVisible(false)}
            >
              <ChevronRight
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.subModalTitle}>Privacy Settings</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.privacyBody}>
            <Text style={styles.privacyHeading}>Privacy Settings</Text>
            <Text style={styles.privacyDesc}>
              This tool helps you manage consent to technologies collecting and
              processing personal data for delivery and analytics.
            </Text>

            {/* Category Cards (Screenshot #21) */}
            <View style={styles.consentCard}>
              <View style={styles.consentHeader}>
                <Text style={styles.consentTitle}>Marketing</Text>
                <Switch
                  value={marketingConsent}
                  onValueChange={setMarketingConsent}
                  trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                  thumbColor={marketingConsent ? Colors.cta : "#F3F4F6"}
                />
              </View>
              <Text style={styles.consentSub}>
                These technologies are used by advertisers to serve ads that are
                relevant to your interests.
              </Text>
            </View>

            <View style={styles.consentCard}>
              <View style={styles.consentHeader}>
                <Text style={styles.consentTitle}>Functional</Text>
                <Switch
                  value={functionalConsent}
                  onValueChange={setFunctionalConsent}
                  trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                  thumbColor={functionalConsent ? Colors.cta : "#F3F4F6"}
                />
              </View>
              <Text style={styles.consentSub}>
                These technologies enable us to analyse usage behavior in order
                to measure and improve performance.
              </Text>
            </View>

            <View style={styles.consentCard}>
              <View style={styles.consentHeader}>
                <Text style={styles.consentTitle}>Essential</Text>
                <Switch
                  value={essentialConsent}
                  disabled
                  trackColor={{ false: "#CECBF6", true: "#A7F3D0" }}
                  thumbColor={Colors.cta}
                />
              </View>
              <Text style={styles.consentSub}>
                These technologies are required to activate the core
                functionality of our delivery service.
              </Text>
            </View>

            <View style={styles.privacyActionsRow}>
              <TouchableOpacity
                style={styles.denyButton}
                onPress={() => {
                  setMarketingConsent(false);
                  setFunctionalConsent(false);
                  setIsPrivacyModalVisible(false);
                }}
              >
                <Text style={styles.denyText}>Deny</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptAllButton}
                onPress={() => {
                  setMarketingConsent(true);
                  setFunctionalConsent(true);
                  setIsPrivacyModalVisible(false);
                  Alert.alert(
                    "Preferences Saved",
                    "Your privacy settings have been updated.",
                  );
                }}
              >
                <Text style={styles.acceptAllText}>Accept All</Text>
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
    backgroundColor: Colors.primary, // Glovo signature warm yellow
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
    backgroundColor: Colors.cta, // Dark green pill button from Screenshot #8
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
    marginRight: 14,
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
    color: "#5C5BDB",
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
  friendsHeaderCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  friendsCardLeft: {
    flex: 1,
  },
  connectFriendsSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  friendsCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newBadge: {
    backgroundColor: "#FFD166",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3C3489",
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

  // Friends screen styles (Screenshot #7)
  friendsModalBody: {
    alignItems: "center",
    padding: 24,
  },
  friendsCardsGraphic: {
    flexDirection: "row",
    justifyContent: "center",
    height: 180,
    width: "100%",
    marginTop: 20,
    marginBottom: 24,
  },
  graphicCard: {
    width: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  graphicCardLeft: {
    transform: [{ rotate: "-8deg" }, { translateX: 10 }],
  },
  graphicCardRight: {
    transform: [{ rotate: "8deg" }, { translateX: -10 }],
  },
  foodPlaceholderCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  graphicCardStat: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  graphicCardStatText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3C3489",
  },
  friendsHeroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3C3489",
    textAlign: "center",
    marginBottom: 8,
  },
  friendsHeroSubtitle: {
    fontSize: 14,
    color: "#7F77DD",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  darkGreenPillBtn: {
    width: "100%",
    backgroundColor: Colors.cta, // Glovo dark green
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
  lightGreyPillBtn: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 24,
  },
  lightGreyPillBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C3489",
  },
  privacyDisclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },

  // Phone screen styles (Screenshot #6)
  phoneModalBody: {
    padding: 20,
  },
  phoneHelperText: {
    fontSize: 14,
    color: "#7F77DD",
    marginBottom: 20,
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
    borderColor: "#CECBF6",
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: "center",
  },
  smsOutlineText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
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

  // Password screen styles (Screenshot #5)
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
    fontSize: 15,
    color: "#3C3489",
  },
  passwordDoneBtn: {
    alignItems: "center",
    marginTop: 40,
  },
  passwordDoneText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primary,
  },

  // Promo screen styles (Screenshot #16)
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

  // Language screen styles (Screenshot #17 & #18)
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

  // FAQ accordion styles (Screenshot #19)
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

  // Notifications screen styles (Screenshot #10)
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

  // Privacy screen styles (Screenshot #21)
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
