import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Search, X } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { SearchInputProps } from './types';

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Rechercher un restaurant, un plat...',
  value,
  onChangeText,
  onClearPress,
  containerStyle,
  style,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Searchbar
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        icon={() => <Search size={20} color={colors.textSecondary} />}
        clearIcon={() => (
          <X
            size={18}
            color={colors.textSecondary}
            onPress={onClearPress || (() => onChangeText?.(''))}
          />
        )}
        style={[styles.searchbar, style]}
        inputStyle={[styles.input, inputStyle]}
        placeholderTextColor={colors.textMuted}
        cursorColor={colors.primary}
        elevation={0}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  input: {
    minHeight: 48,
    fontSize: 14,
    color: colors.text,
    alignSelf: 'center',
  },
});

export default SearchInput;
