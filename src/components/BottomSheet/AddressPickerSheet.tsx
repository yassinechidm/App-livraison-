import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, spacing } from '@/src/theme';
import AppButton from '../Button/AppButton';
import AddressCard from '../Card/AddressCard';
import AppBottomSheet from './AppBottomSheet';
import { AddressPickerSheetProps } from './types';

export const AddressPickerSheet: React.FC<AddressPickerSheetProps> = ({
  sheetRef,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  onDismiss,
}) => {
  return (
    <AppBottomSheet
      sheetRef={sheetRef}
      snapPoints={['55%', '85%']}
      title="Choisir une adresse de livraison"
      onDismiss={onDismiss}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            isSelected={address.id === selectedAddressId}
            onSelect={(addr) => {
              onSelectAddress(addr);
              sheetRef.current?.dismiss();
            }}
          />
        ))}

        {onAddNewAddress && (
          <View style={styles.addBtnContainer}>
            <AppButton
              title="Ajouter une nouvelle adresse"
              variant="outline"
              size="md"
              icon={() => <Plus size={18} color={colors.primary} />}
              onPress={() => {
                sheetRef.current?.dismiss();
                onAddNewAddress();
              }}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  addBtnContainer: {
    marginTop: spacing.md,
  },
});

export default AddressPickerSheet;
