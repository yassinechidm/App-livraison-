import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';
import { borderRadius } from './borderRadius';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: borderRadius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.textInverse,
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.primaryDark,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    error: colors.error,
    errorContainer: colors.errorLight,
    onError: colors.textInverse,
  },
};

export type AppTheme = typeof paperTheme;
