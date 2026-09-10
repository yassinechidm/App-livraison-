import {
    AdminClientInfo,
    AdminDashboardStats,
    adminService,
} from "@/services/admin.service";
import { authService } from "@/services/auth.service";
import { User } from "@supabase/supabase-js";
import {
    LogOut,
    ShieldCheck,
    TrendingUp,
    Users
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminProfileScreen() {
  const [user, setUser] = useState<User | any | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [clients, setClients] = useState<AdminClientInfo[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    authService.getSession().then((session: any) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    adminService.getDashboardStats().then(setStats);
    adminService.getClients().then(setClients);
  }, []);

  async function handleLogout() {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir quitter l'espace Administrateur ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
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
      ],
    );
  }

  const adminId = user?.id
    ? user.id.startsWith("admin-user-")
      ? `ID: #ADMIN-${user.id.replace(/[^0-9]/g, "") || "01"}`
      : user.id.length > 8
        ? `ID: #ADMIN-${user.id.slice(0, 6).toUpperCase()}`
        : `ID: #${user.id.toUpperCase()}`
    : "ID: #ADMIN-01";

  return (
    <View style={styles.container}>
      {/* ── Top Curved Organic Header ── */}
      <View style={styles.organicHeader}>
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.userProfileHero}>
            <View style={styles.avatarCircle}>
              <ShieldCheck size={32} color="#5C5BDB" strokeWidth={2.2} />
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.userNameText}>Administrateur</Text>
              <View style={styles.adminIdBadge}>
                <Text style={styles.adminIdText}>{adminId}</Text>
              </View>
              <Text style={styles.adminRoleSubtitle}>
                Superviseur Général • Oujda & Oriental
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={styles.bodyScrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Global Performance Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <TrendingUp size={18} color="#5C5BDB" />
            <Text style={styles.cardTitle}>Performances Globales</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Chiffre d'affaires cumulé</Text>
            <Text style={styles.statValueBold}>
              {stats?.totalTurnoverMAD
                ? stats.totalTurnoverMAD.toFixed(2)
                : "0.00"}{" "}
              DH
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Commandes traitées aujourd'hui</Text>
            <Text style={styles.statValue}>{stats?.todayOrdersCount || 0}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Zone de couverture</Text>
            <Text style={styles.statValue}>Oujda & Région Oriental</Text>
          </View>
        </View>

        {/* Clients Management Overview */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Users size={18} color="#5C5BDB" />
            <Text style={styles.cardTitle}>
              Clients Inscrits ({clients.length})
            </Text>
          </View>

          {clients.length === 0 ? (
            <Text style={styles.emptyClientsText}>
              Aucun client enregistré pour l'instant.
            </Text>
          ) : (
            clients.map((c, index) => (
              <View
                key={c.id || index}
                style={[
                  styles.clientItem,
                  index === clients.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.clientName}>
                    {c.full_name || "Client"}
                  </Text>
                  <Text style={styles.clientDetails}>
                    {c.email} {c.phone ? `• ${c.phone}` : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.clientSpent}>
                    {(c.totalSpentMAD || 0).toFixed(2)} DH
                  </Text>
                  <Text style={styles.clientOrders}>
                    {c.totalOrders || 0} commandes
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Account Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Compte Superviseur</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Email superviseur :</Text>
            <Text style={styles.statValue}>
              {user?.email || "admin@quicklivraison.ma"}
            </Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Niveau d'accès :</Text>
            <View style={styles.adminRolePill}>
              <Text style={styles.adminRolePillText}>Super-Admin Total</Text>
            </View>
          </View>
        </View>

        {/* ── Log Out Row (Generous clearance above tabs) ── */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.75}
        >
          <View style={styles.logoutLeft}>
            <LogOut size={20} color="#FF4D6D" style={{ marginRight: 12 }} />
            <Text style={styles.logoutText}>
              {isLoggingOut
                ? "Déconnexion..."
                : "Se déconnecter de l'espace Admin"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FF",
  },
  organicHeader: {
    backgroundColor: "#5C5BDB",
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#3C3489",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  headerSafe: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 36 : 10,
  },
  userProfileHero: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
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
  adminIdBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  adminIdText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  adminRoleSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },

  bodyScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 130, // Generous clearance so logout is never hidden by tab bar
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#CECBF6",
    shadowColor: "#3C3489",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F7FF",
  },
  statLabel: {
    fontSize: 13,
    color: "#7F77DD",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3C3489",
  },
  statValueBold: {
    fontSize: 16,
    fontWeight: "900",
    color: "#5C5BDB",
  },

  clientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F7FF",
  },
  clientName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3C3489",
  },
  clientDetails: {
    fontSize: 11,
    color: "#7F77DD",
    marginTop: 2,
  },
  clientSpent: {
    fontSize: 13,
    fontWeight: "900",
    color: "#5C5BDB",
  },
  clientOrders: {
    fontSize: 10,
    color: "#7F77DD",
    marginTop: 1,
  },
  emptyClientsText: {
    fontSize: 13,
    color: "#7F77DD",
    fontStyle: "italic",
    paddingVertical: 8,
  },

  adminRolePill: {
    backgroundColor: "#FFD16630",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFD16680",
  },
  adminRolePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#3C3489",
  },

  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FF4D6D30",
    shadowColor: "#FF4D6D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FF4D6D",
  },
});
