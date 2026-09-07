import { ComponentProps } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends Omit<ComponentProps<typeof PaperButton>, 'mode' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}
