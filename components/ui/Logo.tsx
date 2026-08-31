import React from 'react';
import { Image, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';
import Colors from '@/constants/Colors';

interface LogoProps {
  size?: number;
  rounded?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export default function Logo({
  size = 64,
  rounded = true,
  style,
  imageStyle,
}: LogoProps) {
  const borderRadius = rounded ? Math.round(size * 0.28) : 0;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      <Image
        source={require('@/assets/images/logo.png')}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius,
          },
          imageStyle,
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
