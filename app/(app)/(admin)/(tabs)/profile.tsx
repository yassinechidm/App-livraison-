import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { User } from '@supabase/supabase-js';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth.service';
import { adminService, AdminDashboardStats, AdminClientInfo } from '@/services/admin.service';

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
    setIsLoggingOut(true);
    try {
      await authService.signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      Alert.alert('Erreur', message);
      setIsLoggingOut(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Admin Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👑</Text>
        </View>
        <Text style={styles.name}>Administrateur</Text>
        <Text style={styles.email}>{user?.email || 'admin@quicklivraison.ma'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Accès Superviseur • Oujda</Text>
        </View>
      </View>

      {/* Global Performance Summary */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Performances Globales</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Chiffre d'affaires cumulé</Text>
          <Text style={styles.statValueBold}>
            {stats?.totalTurnoverMAD.toFixed(2) || '0.00'} DH
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Commandes traitées</Text>
          <Text style={styles.statValue}>{stats?.todayOrdersCount || 0}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Zone de couverture</Text>
          <Text style={styles.statValue}>Oujda & Région Oriental 🇲🇦</Text>
        </View>
      </Card>

      {/* Clients Management Overview */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Clients Inscrits ({clients.length})</Text>
        {clients.map((c) => (
          <View key={c.id} style={styles.clientItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{c.full_name}</Text>
              <Text style={styles.clientDetails}>
                ✉️ {c.email} • 📞 {c.phone}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.clientSpent}>{c.totalSpentMAD.toFixed(2)} DH</Text>
              <Text style={styles.clientOrders}>{c.totalOrders} commandes</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Logout */}
      <Button
        title="Se déconnecter de l'espace Admin"
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
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
    fontWeight: '800',
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statValueBold: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  clientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  clientDetails: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  clientSpent: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  clientOrders: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  logoutBtn: {
    marginTop: 10,
  },
});
