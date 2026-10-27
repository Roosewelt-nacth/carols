import React from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

// The Star of Bethlehem: a slowly pulsing glow with a gentle turn.
export function Star({ size = 120 }: { size?: number }) {
  const pulse = useSharedValue(0);
  const turn = useSharedValue(0);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })),
      -1,
    );
    turn.value = withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1);
  }, []);
  const glow = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.45, transform: [{ scale: 0.92 + pulse.value * 0.18 }] }));
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? 50 : 14;
    const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <Animated.View style={[{ width: size, height: size }, glow]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.goldSoft} stopOpacity="0.9" />
            <Stop offset="0.6" stopColor={colors.gold} stopOpacity="0.25" />
            <Stop offset="1" stopColor={colors.gold} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#g)" />
      </Svg>
      <Animated.View style={[{ width: size, height: size }, spin]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Polygon points={pts} fill={colors.goldSoft} />
          <Circle cx="50" cy="50" r="6" fill="#fff" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
