import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth.service';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email invalide';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }

    if (!city.trim()) {
      newErrors.city = 'La ville est requise';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'La confirmation est requise';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = await authService.signUp({ email: email.trim(), password });

      if (data.user && !data.session) {
        // Email confirmation is required
        Alert.alert(
          'Vérifiez votre email',
          'Un email de confirmation a été envoyé à votre adresse. Veuillez le vérifier pour activer votre compte.',
          [{ text: 'OK' }]
        );
      }
      // If session exists, auth guard will handle navigation automatically
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      Alert.alert('Erreur d\'inscription', message);
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
          <Logo size={64} style={styles.logo} />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez Quickly Livraison et commandez vos plats favoris
          </Text>

        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Nom complet"
            placeholder="Votre nom complet"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            autoComplete="name"
          />

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
            label="Téléphone"
            placeholder="+212 6XX XX XX XX"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Input
            label="Quartier à Oujda"
            placeholder="Centre-Ville, Lazaret, Al Qods, Salam..."
            value={city}
            onChangeText={setCity}
            error={errors.city}
          />

          <Input
            label="Nom de boutique (optionnel)"
            placeholder="Ma Boutique"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Input
            label="Mot de passe"
            placeholder="Minimum 6 caractères"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="Répétez votre mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            isPassword
          />

          <Button
            title="S'inscrire"
            onPress={handleRegister}
            isLoading={isLoading}
            variant="success"
            style={styles.registerButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Déjà un compte ?{' '}
            <Link href="/(auth)/login">
              <Text style={styles.footerLink}>Se connecter</Text>
            </Link>
          </Text>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    marginBottom: 16,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '700',
  },
  terms: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
