import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, RadioButton, Text } from 'react-native-paper';
import { Briefcase, Home, MapPin, Pencil } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { AddressCardProps } from './types';

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  style,
}) => {
  const getIcon = () => {
    const labelLower = (address.label || '').toLowerCase();
    if (labelLower.includes('maison') || labelLower.includes('domicile')) {
      return <Home size={20} color={isSelected ? colors.primary : colors.textSecondary} />;
    }
    if (labelLower.includes('travail') || labelLower.includes('bureau')) {
      return <Briefcase size={20} color={isSelected ? colors.primary : colors.textSecondary} />;
    }
    return <MapPin size={20} color={isSelected ? colors.primary : colors.textSecondary} />;
  };

  return (
    <Card
      mode="outlined"
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        style,
      ]}
      onPress={() => onSelect(address)}
    >
      <Card.Content style={styles.content}>
        <View style={styles.leftRow}>
          <RadioButton
            value={address.id}
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => onSelect(address)}
            color={colors.primary}
          />
          <View style={styles.iconContainer}>{getIcon()}</View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.label}>
                {address.label}
              </Text>
              {address.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Par défaut</Text>
                </View>
              )}
            </View>
            <Text variant="bodySmall" style={styles.addressText} numberOfLines={2}>
              {address.address}, {address.city}
            </Text>
          </View>
        </View>

        {onEdit && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onEdit(address)}
            activeOpacity={0.7}
          >
            <Pencil size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginLeft: spacing.xs,
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  label: {
    fontWeight: '800',
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  addressText: {
    color: colors.textSecondary,
  },
  editBtn: {
    padding: spacing.sm,
  },
});

export default AddressCard;
