import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import Colors from '@/constants/Colors';
import Logo from './Logo';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Logo size={80} style={styles.logo} />
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
