import React, { useMemo } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, palettes, themeNames } from '../theme';
import { useTheme } from '../themeContext';

const { width: SW } = Dimensions.get('window');

function Bulb({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  const o = useSharedValue(0.55);
  React.useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), withTiming(0.45, { duration: 1100, easing: Easing.inOut(Easing.quad) })), -1));
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - 5, top: y, width: 10, height: 14, borderRadius: 6, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, a]}
    />
  );
}

// A string of twinkling fairy lights along the top edge.
export function FairyLights() {
  const w = Math.min(SW, 1400);
  const n = Math.max(8, Math.round(w / 52));
  const bulbs = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const x = ((i + 0.5) / n) * w;
        const y = 8 + Math.sin(((i + 0.5) / n) * Math.PI * 2 * 3) * 0 + 10 * Math.sin(((i + 0.5) / n) * Math.PI * n * 0.5);
        return { x, y: 14 + Math.abs(y) * 0.5, i };
      }),
    [n, w],
  );
  const path = bulbs.reduce((d, b, i) => d + (i === 0 ? `M0 6 Q${b.x / 2} 6 ${b.x} ${b.y}` : ` Q${(bulbs[i - 1].x + b.x) / 2} ${Math.min(b.y, bulbs[i - 1].y) - 6} ${b.x} ${b.y}`), '');
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48 }}>
      <Svg width="100%" height={48} viewBox={`0 0 ${w} 48`} preserveAspectRatio="none">
        <Path d={path} stroke={colors.light ? 'rgba(20,35,58,0.35)' : 'rgba(255,246,230,0.28)'} strokeWidth={1.5} fill="none" />
      </Svg>
      {bulbs.map((b) => (
        <Bulb key={b.i} x={b.x} y={b.y} color={colors.lights[b.i % colors.lights.length]} delay={(b.i * 230) % 2200} />
      ))}
    </View>
  );
}

// Two layers of pines along the bottom edge.
export function Treeline({ height = 150 }: { height?: number }) {
  const w = 1000;
  const layer = (offset: number, h: number, count: number, fill: string) => {
    const step = w / count;
    const pts = [`0,${height}`];
    for (let i = 0; i < count; i++) {
      const cx = offset + i * step + step / 2;
      pts.push(`${cx - step * 0.55},${height}`, `${cx - step * 0.18},${height - h * 0.55}`, `${cx - step * 0.34},${height - h * 0.55}`, `${cx - step * 0.08},${height - h * 0.85}`, `${cx - step * 0.2},${height - h * 0.85}`, `${cx},${height - h}`, `${cx + step * 0.2},${height - h * 0.85}`, `${cx + step * 0.08},${height - h * 0.85}`, `${cx + step * 0.34},${height - h * 0.55}`, `${cx + step * 0.18},${height - h * 0.55}`, `${cx + step * 0.55},${height}`);
    }
    pts.push(`${w},${height}`);
    return <Polygon points={pts.join(' ')} fill={fill} />;
  };
  return (
    <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="xMidYMax slice">
        {layer(-20, height * 0.8, 9, colors.tree[0])}
        {layer(30, height * 0.6, 11, colors.tree[1])}
      </Svg>
    </View>
  );
}

// A thin rule with a small star in the middle, used between sections.
export function Ornament() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18 }}>
      <LinearGradient colors={['transparent', colors.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1 }} />
      <Text style={{ color: colors.gold, marginHorizontal: 12, fontSize: 16 }}>✦</Text>
      <LinearGradient colors={[colors.gold, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1 }} />
    </View>
  );
}

// Light / Dark segmented control.
export function ThemePicker({ showName = false }: { showName?: boolean }) {
  const { name, setTheme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 999, padding: 2 }}>
      {themeNames.map((k) => (
        <Pressable key={k} onPress={() => setTheme(k)} accessibilityLabel={palettes[k].name} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: k === name ? colors.card : 'transparent' }}>
          <Text style={{ color: colors.text, fontFamily: k === name ? fonts.bodyBold : fonts.body, fontSize: 13 }}>{palettes[k].name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Orb({ color, size, x, y, dx, dy, dur, id }: { color: string; size: number; x: number; y: number; dx: number; dy: number; dur: number; id: string }) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * dx }, { translateY: t.value * dy }, { scale: 1 + t.value * 0.08 }] }));
  const c = color.replace(/rgba?\(([^)]+)\)/, (_m, v) => v.split(',').slice(0, 3).join(','));
  const alpha = parseFloat(color.split(',')[3] || '0.3');
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: size, height: size }, a]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={`rgb(${c})`} stopOpacity={alpha} />
            <Stop offset="1" stopColor={`rgb(${c})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

// Three soft glows in berry red, holly green and gold drifting behind the glass cards.
export function Ambient() {
  const W = Math.min(SW, 1200);
  const H = Dimensions.get('window').height;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Orb id="o1" color={colors.orbs[0]} size={W * 0.9} x={-W * 0.25} y={-H * 0.1} dx={50} dy={40} dur={14000} />
      <Orb id="o2" color={colors.orbs[1]} size={W * 0.8} x={W * 0.45} y={H * 0.25} dx={-60} dy={30} dur={18000} />
      <Orb id="o3" color={colors.orbs[2]} size={W * 0.85} x={-W * 0.1} y={H * 0.65} dx={40} dy={-50} dur={16000} />
    </View>
  );
}

// A hairline of red, gold and green along the very top, like ribbon.
export function Ribbon() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[colors.berry, colors.light ? '#E8B04A' : '#FFD27A', colors.holly]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 }}
    />
  );
}
