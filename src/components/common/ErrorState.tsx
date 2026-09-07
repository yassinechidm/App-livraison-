import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AlertCircle } from 'lucide-react-native';
import { colors, spacing } from '@/src/theme';
import AppButton from '../Button/AppButton';
import { ErrorStateProps } from './types';

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Une erreur est survenue',
  message,
  retryLabel = 'Réessayer',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <AlertCircle size={44} color={colors.error} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
      {onRetry && (
        <AppButton
          title={retryLabel}
          onPress={onRetry}
          variant="outline"
          size="md"
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    width: '100%',
  },
  iconContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: 9999,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  retryBtn: {
    minWidth: 140,
  },
});

export default ErrorState;
