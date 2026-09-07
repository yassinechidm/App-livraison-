export const colors = {
  primary: '#0066FF',
  primaryLight: '#EBF3FF',
  primaryDark: '#0052CC',
  secondary: '#FF5A35',
  secondaryLight: '#FFE8DF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',
  text: '#2D3748',
  textSecondary: '#718096',
  textMuted: '#A0AEC0',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#0066FF',
  success: '#10B981',
  successLight: '#DCFCE7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  transparent: 'transparent',
  overlay: 'rgba(15, 23, 42, 0.4)',
} as const;


export type ColorToken = keyof typeof colors;
