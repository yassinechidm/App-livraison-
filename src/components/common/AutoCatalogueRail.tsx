import Colors from '@/constants/Colors';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

export interface AutoCatalogueRailProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemWidth?: number;
  itemGap?: number;
  intervalMs?: number;
  showIndicators?: boolean;
  autoPlay?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export function AutoCatalogueRail<T>({
  data,
  renderItem,
  keyExtractor,
  itemWidth = 260,
  itemGap = 14,
  intervalMs = 3500,
  showIndicators = true,
  autoPlay = true,
  contentContainerStyle,
  style,
}: AutoCatalogueRailProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapInterval = itemWidth + itemGap;

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const targetIndex = Math.max(0, Math.min(index, data.length - 1));
      activeIndexRef.current = targetIndex;
      setActiveIndex(targetIndex);
      scrollRef.current?.scrollTo({
        x: targetIndex * snapInterval,
        animated,
      });
    },
    [data.length, snapInterval]
  );

  // Auto-scroll loop
  useEffect(() => {
    if (!autoPlay || data.length <= 1) return;

    const timer = setInterval(() => {
      if (isInteractingRef.current) return;

      const nextIndex = (activeIndexRef.current + 1) % data.length;
      scrollToIndex(nextIndex, true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, data.length, intervalMs, scrollToIndex]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const pauseAutoScroll = useCallback(() => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
  }, []);

  const resumeAutoScroll = useCallback((delayMs = 3500) => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, delayMs);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const computedIndex = Math.round(offsetX / snapInterval);
    const clampedIndex = Math.max(0, Math.min(computedIndex, data.length - 1));
    if (clampedIndex !== activeIndexRef.current) {
      activeIndexRef.current = clampedIndex;
      setActiveIndex(clampedIndex);
    }
  };

  const handleScrollBeginDrag = () => {
    pauseAutoScroll();
  };

  const handleScrollEndDrag = () => {
    resumeAutoScroll(3000);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event);
    resumeAutoScroll(3000);
  };

  if (!data || data.length === 0) return null;

  return (
    <View
      style={[styles.container, style]}
      {...(Platform.OS === 'web'
        ? ({
            onMouseEnter: pauseAutoScroll,
            onMouseLeave: () => resumeAutoScroll(1000),
          } as any)
        : {})}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum={Platform.OS === 'android'}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onTouchStart={pauseAutoScroll}
        onTouchEnd={() => resumeAutoScroll(3000)}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      >
        {data.map((item, index) => (
          <View
            key={keyExtractor(item, index)}
            style={{
              width: itemWidth,
              marginRight: index === data.length - 1 ? 0 : itemGap,
            }}
          >
            {renderItem(item, index)}
          </View>
        ))}
      </ScrollView>

      {showIndicators && data.length > 1 && (
        <View style={styles.indicatorContainer}>
          {data.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <TouchableOpacity
                key={`dot-${keyExtractor(item, index)}`}
                onPress={() => {
                  pauseAutoScroll();
                  scrollToIndex(index);
                  resumeAutoScroll(4000);
                }}
                activeOpacity={0.7}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
});

export default AutoCatalogueRail;

