import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { borderRadius, colors, spacing } from '@/src/theme';
import { AppButtonProps, ButtonVariant } from './types';

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  labelStyle,
  disabled,
  loading,
  ...props
}) => {
  const getMode = (v: ButtonVariant) => {
    switch (v) {
      case 'outline':
        return 'outlined';
      case 'ghost':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.surfaceVariant;
      case 'error':
        return colors.error;
      case 'outline':
      case 'ghost':
        return colors.transparent;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'error':
        return colors.textInverse;
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      default:
        return colors.textInverse;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 38;
      case 'lg':
        return 54;
      case 'md':
      default:
        return 46;
    }
  };

  return (
    <PaperButton
      mode={getMode(variant)}
      disabled={disabled}
      loading={loading}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? colors.primary : colors.transparent,
          height: getHeight(),
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      labelStyle={[
        styles.label,
        { color: getTextColor() },
        size === 'sm' && styles.labelSm,
        size === 'lg' && styles.labelLg,
        labelStyle,
      ]}
      contentStyle={[styles.content, { height: getHeight() }]}
      {...props}
    >
      {title}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 13,
  },
  labelLg: {
    fontSize: 16,
  },
});

export default AppButton;
