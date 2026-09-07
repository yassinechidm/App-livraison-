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
        {/* Top Header Background (bleu ciel / sky blue) */}
        <View style={styles.topHeader}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>QuickL</Text>
            <View style={styles.locationPin}>
              <Text style={styles.locationPinText}>📍</Text>
            </View>
          </View>
        </View>

        {/* White bottom sheet */}
        <View style={styles.sheet}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#38BDF8',
  },
  topHeader: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  brandTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  locationPin: {
    marginLeft: 6,
  },
  locationPinText: {
    fontSize: 30,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircleSuccess: {
    backgroundColor: '#DCFCE7',
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  resetButton: {
    marginTop: 8,
    backgroundColor: '#0066FF',
    borderRadius: 28,
    height: 54,
  },
  successCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  successEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#2D3748',
    textAlign: 'center',
    lineHeight: 20,
  },
  successEmail: {
    fontWeight: '700',
    color: '#1A202C',
  },
  footer: {
    alignItems: 'center',
  },
  footerLink: {
    color: '#0066FF',
    fontWeight: '800',
    fontSize: 14,
  },
});
