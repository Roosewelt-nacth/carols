import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

function Flake({ x, size, delay, dur, drift }: { x: number; size: number; delay: number; dur: number; drift: number }) {
  const y = useSharedValue(-20);
  const sway = useSharedValue(0);
  React.useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(H + 20, { duration: dur, easing: Easing.linear }), -1, false));
    sway.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(drift, { duration: dur / 3, easing: Easing.inOut(Easing.sin) }),
          withTiming(-drift, { duration: dur / 3, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { translateX: sway.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x, top: 0, width: size, height: size, borderRadius: size, backgroundColor: colors.flake }, style]}
    />
  );
}

export function Snow({ count = 36 }: { count?: number }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        k: i,
        x: Math.random() * W,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 6000,
        dur: 7000 + Math.random() * 9000,
        drift: 6 + Math.random() * 18,
      })),
    [count],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {flakes.map((f) => (
        <Flake key={f.k} x={f.x} size={f.size} delay={f.delay} dur={f.dur} drift={f.drift} />
      ))}
    </View>
  );
}
