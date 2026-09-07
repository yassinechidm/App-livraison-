import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { PackageOpen } from 'lucide-react-native';
import { colors, spacing } from '@/src/theme';
import AppButton from '../Button/AppButton';
import { EmptyStateProps } from './types';

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        {icon || <PackageOpen size={48} color={colors.textSecondary} />}
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.actionBtn}
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
    backgroundColor: colors.surfaceVariant,
    padding: spacing.lg,
    borderRadius: 9999,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  actionBtn: {
    minWidth: 160,
  },
});

export default EmptyState;
