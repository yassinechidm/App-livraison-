import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput as PaperTextInput } from 'react-native-paper';
import { borderRadius, colors, spacing } from '@/src/theme';
import { FormTextInputProps } from './types';

export const FormTextInput: React.FC<FormTextInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  style,
  mode = 'outlined',
  ...props
}) => {
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      <PaperTextInput
        label={label}
        mode={mode}
        error={hasError}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        textColor={colors.text}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        outlineStyle={styles.outline}
        {...props}
      />
      {hasError ? (
        <HelperText type="error" visible={hasError} style={styles.helper}>
          {error}
        </HelperText>
      ) : helperText ? (
        <HelperText type="info" visible={Boolean(helperText)} style={styles.helper}>
          {helperText}
        </HelperText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
    width: '100%',
  },
  input: {
    backgroundColor: colors.surface,
    fontSize: 15,
  },
  outline: {
    borderRadius: borderRadius.md,
  },
  helper: {
    paddingHorizontal: spacing.xs,
    marginTop: -spacing.xs,
  },
});

export default FormTextInput;
