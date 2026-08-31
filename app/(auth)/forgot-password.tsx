import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  function validate(): boolean {
    if (!email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email invalide');
      return false;
    }
    setError('');
    return true;
  }

  async function handleReset() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setIsSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      Alert.alert('Erreur', message);
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
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, isSent && styles.iconCircleSuccess]}>
            <Text style={styles.emoji}>{isSent ? '✅' : '🔐'}</Text>
          </View>
          <Text style={styles.title}>
            {isSent ? 'Email envoyé !' : 'Mot de passe oublié'}
          </Text>
          <Text style={styles.subtitle}>
            {isSent
              ? 'Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.'
              : 'Entrez votre email et nous vous enverrons un lien de réinitialisation.'}
          </Text>
        </View>

        {/* Form or Success */}
        {!isSent ? (
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              error={error}
              keyboardType="email-address"
              autoComplete="email"
            />

            <Button
              title="Envoyer le lien"
              onPress={handleReset}
              isLoading={isLoading}
              style={styles.resetButton}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>📬</Text>
              <Text style={styles.successText}>
                Un email a été envoyé à{'\n'}
                <Text style={styles.successEmail}>{email}</Text>
              </Text>
            </View>
            <Button
              title="Renvoyer l'email"
              onPress={handleReset}
              variant="secondary"
              isLoading={isLoading}
            />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Link href="/(auth)/login">
            <Text style={styles.footerLink}>← Retour à la connexion</Text>
          </Link>
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
    marginBottom: 36,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.backgroundOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircleSuccess: {
    backgroundColor: Colors.statusDeliveredBg,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  form: {
    marginBottom: 32,
  },
  resetButton: {
    marginTop: 8,
  },
  successCard: {
    backgroundColor: Colors.statusDeliveredBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.secondary + '20',
  },
  successEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
