import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import {
    Bell,
    Check,
    ChevronRight,
    Globe,
    HelpCircle,
    LogOut,
    MapPin,
    MessageSquare,
    ShieldCheck,
    ShoppingBag,
    Tag,
    Trash2,
    User as UserIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ClientProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | any | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);

  useEffect(() => {
    authService.getSession().then((session: any) => {
      if (session?.user) {
        setUser(session.user);
      }
    });
  }, []);

  async function handleLogout() {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authService.signOut();
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Une erreur est survenue";
            Alert.alert("Erreur", message);
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données personnelles et votre historique seront supprimés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Demande reçue",
              "Votre demande de suppression de compte a été soumise au support.",
            );
          },
        },
      ],
    );
  }

  function handleHelpPress() {
    Alert.alert(
      "Support Quickly Oujda",
      "Notre équipe support à Oujda est disponible 7j/7.\n\n📞 Téléphone: +212 6 00 00 00 00\n💬 WhatsApp: +212 6 00 00 00 00\n✉️ Email: support@quicklivraison.ma",
      [{ text: "Fermer" }],
    );
  }

  const displayName = user?.email?.split("@")[0] ?? "Hatim";
  const initial = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || "hatim@quicklivraison.ma";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Bar */}
        <View style={styles.topTitleRow}>
          <Text style={styles.screenMainTitle}>Espace Client</Text>
          <TouchableOpacity
            style={styles.supportPill}
            onPress={handleHelpPress}
            activeOpacity={0.8}
          >
            <MessageSquare size={15} color={Colors.primary} />
            <Text style={styles.supportPillText}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Exclusive VIP Member Card */}
        <TouchableOpacity
          style={styles.vipPassCard}
          activeOpacity={0.9}
          onPress={() => setAccountModalVisible(true)}
        >
          <View style={styles.vipPassTop}>
            <View style={styles.vipTag}>
              <Check size={13} color="#10B981" />
              <Text style={styles.vipTagText}>COMPTE CLIENT VÉRIFIÉ</Text>
            </View>
            <ShieldCheck size={20} color={Colors.primaryLight} />
          </View>

          <View style={styles.vipUserRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.vipTextWrapper}>
              <Text style={styles.vipName}>{displayName}</Text>
              <Text style={styles.vipEmail}>{userEmail}</Text>
            </View>
          </View>

          <View style={styles.vipPassFooter}>
            <View style={styles.locationBadge}>
              <MapPin size={12} color={Colors.primaryLight} />
              <Text style={styles.locationBadgeText}>Oujda (وجدة), Maroc</Text>
            </View>
            <Text style={styles.editProfileLink}>Gérer →</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Highlights / Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/(app)/(client)/(tabs)/orders" as any)}
          >
            <ShoppingBag size={20} color={Colors.primary} />
            <Text style={styles.statVal}>Mes Commandes</Text>
            <Text style={styles.statSub}>Historique & Suivi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setPromoModalVisible(true)}
          >
            <Tag size={20} color={Colors.secondary} />
            <Text style={styles.statVal}>Offres & Promos</Text>
            <Text style={styles.statSub}>Livraison Offerte</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Mon Activité */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Mon Activité</Text>
          <View style={styles.cardGroup}>
            {/* Orders */}
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() =>
                router.push("/(app)/(client)/(tabs)/orders" as any)
              }
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <ShoppingBag size={18} color={Colors.primary} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>Historique des commandes</Text>
                <Text style={styles.itemSub}>
                  Consulter vos commandes précédentes
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Promos */}
            <TouchableOpacity
              style={[styles.itemRow, { borderBottomWidth: 0 }]}
              onPress={() => setPromoModalVisible(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: Colors.secondaryMuted },
                ]}
              >
                <Tag size={18} color={Colors.secondary} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>Codes promo & réductions</Text>
                <Text style={styles.itemSub}>1 code disponible pour Oujda</Text>
              </View>
              <View style={styles.promoPill}>
                <Text style={styles.promoPillText}>Actif</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Compte & Paramètres */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Préférences & Profil</Text>
          <View style={styles.cardGroup}>
            {/* Account Details */}
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => setAccountModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <UserIcon size={18} color={Colors.primary} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>Informations du compte</Text>
                <Text style={styles.itemSub}>
                  Email, téléphone et adresse par défaut
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Language */}
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() =>
                Alert.alert("Langue", "Langue actuelle : Français (Maroc)")
              }
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <Globe size={18} color={Colors.primary} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>Langue de l'application</Text>
                <Text style={styles.itemSub}>Français (Maroc)</Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              style={[styles.itemRow, { borderBottomWidth: 0 }]}
              onPress={() =>
                Alert.alert(
                  "Notifications",
                  "Les notifications de suivi de commande sont activées.",
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <Bell size={18} color={Colors.primary} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>Notifications Push</Text>
                <Text style={styles.itemSub}>
                  Alertes de livraison et promos
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Assistance & Données */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Aide & Sécurité</Text>
          <View style={styles.cardGroup}>
            {/* FAQ */}
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => setFaqModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.iconCircle}>
                <HelpCircle size={18} color={Colors.primary} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>FAQ & Support Client</Text>
                <Text style={styles.itemSub}>
                  Questions fréquentes et assistance
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              style={[styles.itemRow, { borderBottomWidth: 0 }]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: Colors.errorLight },
                ]}
              >
                <Trash2 size={18} color={Colors.error} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={[styles.itemTitle, { color: Colors.error }]}>
                  Supprimer mon compte
                </Text>
                <Text style={styles.itemSub}>
                  Suppression définitive des données
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Distinct Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Footer Brand Label */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerBrand}>Quickly Livraison • Oujda 🇲🇦</Text>
          <Text style={styles.footerVersion}>Version 2.4.0 (Build 2026)</Text>
        </View>
      </ScrollView>

      {/* Account Info Modal */}
      <Modal visible={accountModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Informations du compte</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Email</Text>
              <Text style={styles.modalVal}>{userEmail}</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Ville</Text>
              <Text style={styles.modalVal}>Oujda (وجدة)</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Statut</Text>
              <Text style={styles.modalVal}>Client Actif</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setAccountModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Promo Code Modal */}
      <Modal visible={promoModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Codes Promo & Offres</Text>
            <View style={styles.promoBadgeBox}>
              <Text style={styles.promoBadgeTitle}>🎁 OUJDA2026</Text>
              <Text style={styles.promoBadgeSub}>
                Livraison 100% offerte sur votre commande
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPromoModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FAQ Modal */}
      <Modal visible={faqModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>FAQ Quickly Oujda</Text>
            <Text style={styles.faqQ}>
              Q: Quels sont les délais de livraison ?
            </Text>
            <Text style={styles.faqA}>
              R: En moyenne 25 minutes sur la ville d'Oujda.
            </Text>
            <Text style={styles.faqQ}>Q: Comment contacter le livreur ?</Text>
            <Text style={styles.faqA}>
              R: Le numéro du livreur apparaît dès la prise en charge de la
              commande.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setFaqModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  screenMainTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  supportPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  supportPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  vipPassCard: {
    backgroundColor: Colors.plusPurple,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: Colors.plusPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  vipPassTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  vipTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vipTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  vipUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#60A5FA",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.white,
  },
  vipTextWrapper: {
    flex: 1,
  },
  vipName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.white,
  },
  vipEmail: {
    fontSize: 13,
    color: Colors.primaryLight,
    marginTop: 2,
  },
  vipPassFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 12,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationBadgeText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: "600",
  },
  editProfileLink: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "flex-start",
  },
  statVal: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 8,
  },
  statSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  itemSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  promoPill: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  promoPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.secondaryDark,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.error,
  },
  footerContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  footerVersion: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.backgroundOverlay,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalVal: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  promoBadgeBox: {
    backgroundColor: Colors.secondaryMuted,
    borderColor: Colors.secondary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  promoBadgeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.secondaryDark,
    marginBottom: 4,
  },
  promoBadgeSub: {
    fontSize: 13,
    color: Colors.secondary,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 10,
  },
  faqA: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  modalCloseBtnText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
