import Colors from '@/constants/Colors';
import React from 'react';
import { ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  rounded?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  showText?: boolean;
}

export default function Logo({
  size = 56,
  rounded = true,
  style,
  showText = false,
}: LogoProps) {
  const borderRadius = rounded ? Math.round(size * 0.28) : 8;
  const earHeight = Math.round(size * 0.38);
  const earWidth = Math.round(size * 0.18);
  const eyeSize = Math.max(3, Math.round(size * 0.08));

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
      >
        {/* Deliveroo Roo Silhouette */}
        <View style={styles.rooHead}>
          {/* Ears */}
          <View style={styles.earsRow}>
            <View style={[styles.ear, { width: earWidth, height: earHeight, transform: [{ rotate: '-10deg' }] }]} />
            <View style={[styles.ear, { width: earWidth, height: earHeight, transform: [{ rotate: '12deg' }] }]} />
          </View>
          {/* Snout & Eyes */}
          <View style={styles.face}>
            <View style={[styles.eye, { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 }]} />
            <View style={[styles.eye, { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2 }]} />
          </View>
        </View>
      </View>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>deliveroo</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  rooHead: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  earsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: -2,
  },
  ear: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  face: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  eye: {
    backgroundColor: Colors.primary,
  },
  textContainer: {
    marginLeft: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.6,
  },
});

