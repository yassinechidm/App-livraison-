import { colors } from "@/src/theme";

// Quickly Livraison Design System Palette
const Colors = {
  // Primary — Modern Vibrant Blue (#2563EB)
  primary: colors.primary,
  primaryLight: colors.primaryLight,
  primaryDark: colors.primaryDark,
  primaryDeep: colors.primaryDark,
  primaryMuted: colors.primaryLight,

  // Secondary / Accents — Fast Orange/Coral for Promos, Speed, Badges
  secondary: colors.secondary,
  secondaryLight: colors.secondaryLight,
  secondaryDark: "#E04A26",
  secondaryMuted: "#FFF0ED",

  // Quickly Plus / VIP Dark Slate
  plusPurple: "#1E293B",
  plusPurpleLight: "#F1F5F9",

  // Backgrounds
  background: colors.background,
  backgroundWhite: colors.surface,
  backgroundCard: colors.surface,
  backgroundInput: colors.surfaceVariant,
  backgroundOverlay: colors.overlay,
  backgroundMuted: "#EDF2F7",

  // Text — Modern Clean Typography
  textPrimary: colors.text,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  textInverse: colors.textInverse,
  textLink: colors.primary,

  // CTA & Highlights
  cta: colors.cta,
  badge: colors.badge,
  highlight: colors.highlight,
  darkText: colors.text,
  cardBorder: colors.border,

  // Status
  success: colors.success,
  successLight: colors.successLight,
  error: colors.error,
  errorLight: colors.errorLight,
  warning: colors.warning,
  warningLight: colors.warningLight,
  info: colors.primary,
  infoLight: colors.primaryLight,

  // Order & Courier statuses
  statusPending: colors.warning,
  statusPendingBg: colors.warningLight,
  statusPickedUp: colors.primary,
  statusPickedUpBg: colors.primaryLight,
  statusInTransit: colors.primary,
  statusInTransitBg: colors.primaryLight,
  statusDelivered: colors.success,
  statusDeliveredBg: colors.successLight,
  statusReturned: colors.error,
  statusReturnedBg: colors.errorLight,

  // Borders
  border: colors.border,
  borderLight: colors.border,
  borderFocus: colors.borderFocus,

  // Tab bar
  tabBarBackground: colors.surface,
  tabIconDefault: colors.textMuted,
  tabIconSelected: colors.primary,

  // Shadows
  shadowColor: colors.text,

  // Misc
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  emerald: colors.success,
  emeraldLight: colors.successLight,
} as const;

export default Colors;
