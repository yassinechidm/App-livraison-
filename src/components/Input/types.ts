import { ComponentProps, ReactNode } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Searchbar, TextInput as PaperTextInput } from 'react-native-paper';

export interface FormTextInputProps extends Omit<ComponentProps<typeof PaperTextInput>, 'error'> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export interface SearchInputProps extends ComponentProps<typeof Searchbar> {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  onClearPress?: () => void;
}
