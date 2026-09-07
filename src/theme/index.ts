export * from './colors';
export * from './spacing';
export * from './borderRadius';
export * from './paperTheme';

import { colors } from './colors';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';
import { paperTheme } from './paperTheme';

export const theme = {
  colors,
  spacing,
  borderRadius,
  paper: paperTheme,
};

export default theme;
