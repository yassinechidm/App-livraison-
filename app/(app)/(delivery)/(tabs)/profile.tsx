import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { User } from "@supabase/supabase-js";
import { Bike, ShieldCheck, Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

export default function CourierProfileScreen() {
  const [user, setUser] = useState<User | any | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    authService.getSession().then((session: any) => {
      if (session?.user) {
        setUser(session.user);
      }
    });
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await authService.signOut();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      Alert.alert("Erreur", message);
      setIsLoggingOut(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Bike size={32} color={Colors.primary} />
        </View>
        <Text style={styles.name}>
          {user?.email?.split("@")[0] || "Livreur Oujda"}
        </Text>
        <Text style={styles.email}>
          {user?.email || "delivery@quicklivraison.ma"}
        </Text>
        <View style={styles.roleBadge}>
          <ShieldCheck
            size={12}
            color={Colors.white}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.roleBadgeText}>
            Livreur Partenaire • Oujda Express
          </Text>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchTitle}>Disponibilité aux courses</Text>
            <Text style={styles.switchSub}>
              {isOnline
                ? "Recevoir les commandes prêtes"
                : "Actuellement hors ligne"}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: "#CBD5E1", true: Colors.primary + "60" }}
            thumbColor={isOnline ? Colors.primary : "#94A3B8"}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>
          Informations Véhicule & Performance
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Véhicule :</Text>
          <Text style={styles.infoValue}>Scooter 125cc</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Zone affectée :</Text>
          <Text style={styles.infoValue}>
            Centre-Ville, Lazaret, Al Qods (Oujda)
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Note Livreur :</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Star
              size={12}
              color={Colors.primary}
              fill={Colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.infoValue}>4.9/5 (98% avis positifs)</Text>
          </View>
        </View>
      </Card>

      <Button
        title="Se déconnecter de l'espace Livreur"
        onPress={handleLogout}
        variant="secondary"
        isLoading={isLoggingOut}
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EBF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.primary + "30",
  },
  avatarEmoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  email: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  logoutBtn: {
    marginTop: 10,
  },
});
