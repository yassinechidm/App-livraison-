import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { borderRadius, colors, spacing } from '@/src/theme';
import { AppBottomSheetProps } from './types';

export const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
  sheetRef,
  snapPoints: customSnapPoints,
  title,
  children,
  onDismiss,
  style,
}) => {
  const snapPoints = useMemo(
    () => customSnapPoints || ['50%', '85%'],
    [customSnapPoints]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={[styles.content, style]}>
        {title && (
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              {title}
            </Text>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  indicator: {
    backgroundColor: colors.border,
    width: 40,
    height: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
  },
});

export default AppBottomSheet;
