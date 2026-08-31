// Quick Livraison color palette — light theme with blue/green accents
const Colors = {
  // Primary — Quick Livraison electric blue (from logo)
  primary: '#0066FF',
  primaryLight: '#2B7FFF',
  primaryDark: '#004ECC',

  // Secondary — Quick Livraison green (CTA, success)
  secondary: '#00B602',
  secondaryLight: '#22C55E',
  secondaryDark: '#009302',

  // Backgrounds
  background: '#F8FAFC',
  backgroundWhite: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundInput: '#FFFFFF',
  backgroundOverlay: 'rgba(2, 67, 137, 0.08)',
  backgroundMuted: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#024389',

  // Status
  success: '#00B602',
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Parcel statuses
  statusPending: '#F59E0B',
  statusPendingBg: '#FFFBEB',
  statusPickedUp: '#3B82F6',
  statusPickedUpBg: '#EFF6FF',
  statusInTransit: '#8B5CF6',
  statusInTransitBg: '#F5F3FF',
  statusDelivered: '#00B602',
  statusDeliveredBg: '#F0FDF4',
  statusReturned: '#EF4444',
  statusReturnedBg: '#FEF2F2',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#024389',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#024389',

  // Shadows
  shadowColor: '#0F172A',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  emerald: '#10B981',
  emeraldLight: '#ECFDF5',
} as const;

export default Colors;
