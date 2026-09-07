import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import {
  Coffee,
  Flame,
  Pizza,
  Salad,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { CategoryCardProps } from './types';

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onPress,
  style,
}) => {
  const renderIcon = () => {
    const iconColor = isSelected ? colors.primary : colors.textSecondary;
    const size = 22;

    switch (category.iconName) {
      case 'Flame':
      case 'popular':
        return <Flame size={size} color={iconColor} />;
      case 'Pizza':
        return <Pizza size={size} color={iconColor} />;
      case 'Salad':
        return <Salad size={size} color={iconColor} />;
      case 'Coffee':
        return <Coffee size={size} color={iconColor} />;
      case 'ShoppingBag':
        return <ShoppingBag size={size} color={iconColor} />;
      case 'Sparkles':
        return <Sparkles size={size} color={iconColor} />;
      default:
        return <UtensilsCrossed size={size} color={iconColor} />;
    }
  };

  return (
    <Surface
      elevation={0}
      style={[
        styles.surface,
        isSelected && styles.selectedSurface,
        style,
      ]}
    >
      <TouchableRipple
        onPress={() => onPress(category)}
        style={styles.ripple}
        borderless
      >
        <>
          {renderIcon()}
          <Text
            variant="labelMedium"
            style={[styles.label, isSelected && styles.selectedLabel]}
            numberOfLines={1}
          >
            {category.name}
          </Text>
        </>
      </TouchableRipple>
    </Surface>
  );
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minWidth: 84,
    height: 72,
    marginRight: spacing.sm,
  },
  selectedSurface: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  ripple: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  selectedLabel: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
});

export default CategoryCard;
