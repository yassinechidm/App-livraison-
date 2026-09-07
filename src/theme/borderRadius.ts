export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type BorderRadiusToken = keyof typeof borderRadius;
