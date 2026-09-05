import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth.service';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('client@quicklivraison.ma');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authService.signIn({ email: email.trim(), password });
      const role = authService.getUserRole();
      if (role?.toLowerCase() === 'admin') {
        router.replace('/(app)/(admin)/(tabs)' as any);
      } else {
        router.replace('/(app)/(client)/(tabs)' as any);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      Alert.alert('Erreur de connexion', message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickClientDemo() {
    setEmail('client@quicklivraison.ma');
    setPassword('123456');
    setIsLoading(true);
    try {
      await authService.signIn({ email: 'client@quicklivraison.ma', password: '123456' });
      router.replace('/(app)/(client)/(tabs)' as any);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuickAdminDemo() {
    setEmail('admin@quicklivraison.ma');
    setPassword('123456');
    setIsLoading(true);
    try {
      await authService.signIn({ email: 'admin@quicklivraison.ma', password: '123456' });
      router.replace('/(app)/(admin)/(tabs)' as any);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Brand Deliveroo */}
        <View style={styles.header}>
          <Logo size={64} style={styles.logo} />
          <Text style={styles.brandName}>deliveroo</Text>
          <Text style={styles.title}>Bienvenue !</Text>
          <Text style={styles.subtitle}>
            Vos plats et courses préférés livrés chez vous
          </Text>
        </View>


        {/* Demo Accounts Banner */}
        <View style={styles.demoBanner}>
          <View style={styles.demoHeader}>
            <Text style={styles.demoIcon}>⚡</Text>
            <Text style={styles.demoTitle}>Comptes de Test</Text>
          </View>
          <Text style={styles.demoCredentials}>
            👤 <Text style={styles.demoBold}>Client</Text> : <Text style={styles.demoBold}>client@quicklivraison.ma</Text> (Mdp: 123456)
            {'\n'}
            👑 <Text style={styles.demoBold}>Admin</Text> : <Text style={styles.demoBold}>admin@quicklivraison.ma</Text> (Mdp: 123456)
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
            placeholder="Votre mot de passe"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
          </Link>

          <Button
            title="Se connecter"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginButton}
          />
        </View>

        {/* Quick Demo Buttons for Client & Admin */}
        <View style={styles.demoButtonsRow}>
          <TouchableOpacity
            style={[styles.quickDemoButton, { flex: 1, borderColor: Colors.secondary }]}
            onPress={handleQuickClientDemo}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickDemoText, { color: Colors.secondary }]}>👤 Espace Client</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickDemoButton, { flex: 1, borderColor: Colors.primary }]}
            onPress={handleQuickAdminDemo}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickDemoText, { color: Colors.primary }]}>👑 Espace Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register CTA */}
        <Link href="/(auth)/register" asChild>
          <Button
            title="Créer un compte"
            onPress={() => router.push('/(auth)/register')}
            variant="success"
            style={styles.registerButton}
          />
        </Link>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Livraison express, courses et colis à Oujda (وجدة) 🇲🇦
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    marginBottom: 14,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  demoBanner: {
    backgroundColor: Colors.backgroundOverlay,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    padding: 14,
    marginBottom: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoIcon: {
    fontSize: 16,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  demoCredentials: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  demoBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  form: {
    marginBottom: 14,
  },
  forgotPassword: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 20,
    marginTop: -8,
  },
  loginButton: {
    marginTop: 4,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickDemoButton: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 26,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickDemoText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  registerButton: {
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
