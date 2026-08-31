import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Category } from '@/types/product.types';

interface CategoryBubbleProps {
  category: Category;
  isSelected?: boolean;
  onPress: () => void;
}

export default function CategoryBubble({
  category,
  isSelected = false,
  onPress,
}: CategoryBubbleProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.circle,
          isSelected && styles.circleSelected,
        ]}
      >
        <Text style={styles.emoji}>{category.emoji || '📦'}</Text>
      </View>
      <Text
        style={[styles.title, isSelected && styles.titleSelected]}
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
    marginRight: 10,
  },
  containerSelected: {
    transform: [{ scale: 1.03 }],
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  circleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  titleSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
