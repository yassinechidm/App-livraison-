import { ReactNode, RefObject } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Address } from '@/src/types/order.types';

export interface AppBottomSheetProps {
  sheetRef: RefObject<BottomSheetModal | null>;
  snapPoints?: (string | number)[];
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface AddressPickerSheetProps {
  sheetRef: RefObject<BottomSheetModal | null>;
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (address: Address) => void;
  onAddNewAddress?: () => void;
  onDismiss?: () => void;
}
