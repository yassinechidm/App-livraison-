import Colors from '@/constants/Colors';
import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  rounded?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  showText?: boolean;
  variant?: 'blue' | 'white';
}

export default function Logo({
  size = 56,
  rounded = true,
  style,
  imageStyle,
  showText = false,
  variant = 'blue',
}: LogoProps) {
  const borderRadius = rounded ? Math.round(size * 0.28) : 8;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: variant === 'blue' ? Colors.primary : Colors.white,
          },
        ]}
      >
        <Image
          source={
            variant === 'blue'
              ? require('@/assets/images/quickly-logo-transparent.png')
              : require('@/assets/images/quickly-logo-blue.png')
          }
          style={[
            {
              width: size * 0.76,
              height: size * 0.76,
            },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <View style={styles.textContainer}>
          <View style={styles.textRow}>
            <Text style={[styles.brandTitle, variant === 'white' && { color: Colors.white }]}>
              Quickly
            </Text>
            <Text style={[styles.brandBadge, variant === 'white' && { backgroundColor: Colors.white, color: Colors.primary }]}>
              EXPRESS
            </Text>
          </View>
          <Text style={[styles.brandSubtitle, variant === 'white' && { color: 'rgba(255,255,255,0.85)' }]}>
            LIVRAISON RAPIDE
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  textContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.6,
  },
  brandBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.white,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: -1,
  },
});


