import Colors from "@/constants/Colors";
import { ReactNode } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export default function Card({
  children,
  style,
  noPadding = false,
}: CardProps) {
  return (
    <View style={[styles.card, noPadding ? styles.noPadding : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: {
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
      } as any,
      default: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  noPadding: {
    padding: 0,
  },
});
