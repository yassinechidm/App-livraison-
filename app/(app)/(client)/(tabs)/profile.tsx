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
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth.service';

export default function ClientProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | any | null>(null);
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
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      Alert.alert('Erreur', message);
      setIsLoggingOut(false);
    }
  }

  const displayName = user?.email?.split('@')[0] ?? 'Client';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Profile Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email || 'client@quicklivraison.ma'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>👤 Compte Client</Text>
        </View>
      </View>

      {/* Favorites Shortcut Card */}
      <Card style={styles.card}>
        <TouchableOpacity
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          onPress={() => router.push('/(app)/(client)/restaurants' as any)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 20 }}>❤️</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.textPrimary }}>
                Mes Snacks & Restos Préférés
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>
                Accédez rapidement à vos adresses préférées
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.primary }}>→</Text>
        </TouchableOpacity>
      </Card>

      {/* Account options */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Mes Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ville</Text>
          <Text style={styles.infoValue}>Oujda (وجدة)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>+212 6 XX XX XX XX</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Adresse par défaut</Text>
          <Text style={styles.infoValue}>Centre-Ville, Oujda</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Support & Aide</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>📞 Contacter le service client (Oujda)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>💬 WhatsApp Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>📄 Conditions d'utilisation</Text>
        </TouchableOpacity>
      </Card>

      {/* Logout */}
      <Button
        title="Se déconnecter"
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
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuItemText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 10,
  },
});
