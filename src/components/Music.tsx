import React, { useEffect, useSyncExternalStore } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { Glass } from './ui';
import { useLang } from '../i18n';
import { colors, fonts } from '../theme';

// Christmas artwork colours, used like album covers.
export const ART: Record<string, [string, string]> = {
  red: ['#E5384A', '#8E1626'],
  green: ['#2E9E6A', '#0E4A32'],
  gold: ['#F2B84B', '#C9741A'],
  navy: ['#4B5FD6', '#161B52'],
  plum: ['#B4478F', '#511C57'],
};

export type Icon = 'home' | 'note' | 'plus' | 'clock' | 'star' | 'paper' | 'chevron' | 'pray' | 'book';

export function Glyph({ name, size = 24, color = '#fff', stroke = 1.9 }: { name: Icon; size?: number; color?: string; stroke?: number }) {
  const p = { stroke: color, strokeWidth: stroke, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...p} />}
      {name === 'note' && (
        <>
          <Path d="M9 18V5l12-2v13" {...p} />
          <Circle cx="6" cy="18" r="3" {...p} />
          <Circle cx="18" cy="16" r="3" {...p} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 8v8M8 12h8" {...p} />
        </>
      )}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 7v5l3 2" {...p} />
        </>
      )}
      {name === 'paper' && (
        <>
          <Path d="M6 3h9l4 4v14H6z" {...p} />
          <Path d="M14 3v5h5M9 13h7M9 17h7" {...p} />
        </>
      )}
      {name === 'pray' && (
        <>
          <Path d="M12 3v18M7 8h10" {...p} />
        </>
      )}
      {name === 'book' && (
        <>
          <Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" {...p} />
          <Path d="M4 21V5M9 7h6" {...p} />
        </>
      )}
      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'star' && (
        <Polygon
          points={Array.from({ length: 10 }, (_, i) => {
            const r = i % 2 === 0 ? 10 : 4.2;
            const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            return `${12 + r * Math.cos(a)},${12.5 + r * Math.sin(a)}`;
          }).join(' ')}
          fill={color}
        />
      )}
    </Svg>
  );
}

// The tab bar slides away while you scroll down to read, and returns when you scroll up or reach the top.
let navHidden = false;
let lastY = 0;
const navSubs = new Set<() => void>();
const setNavHidden = (h: boolean) => {
  if (navHidden !== h) {
    navHidden = h;
    navSubs.forEach((f) => f());
  }
};
const useNavHidden = () =>
  useSyncExternalStore(
    (f) => {
      navSubs.add(f);
      return () => navSubs.delete(f);
    },
    () => navHidden,
    () => false,
  );
export const navScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  const y = e.nativeEvent.contentOffset.y;
  const dy = y - lastY;
  lastY = y;
  if (y < 40) setNavHidden(false);
  else if (dy > 7) setNavHidden(true);
  else if (dy < -7) setNavHidden(false);
};

// Floating glass tab bar at the bottom, like the Music app.
export function TabBar({ active }: { active: 'home' | 'carols' | 'prayer' | 'enrol' | 'visit' }) {
  const router = useRouter();
  const { t } = useLang();
  const hidden = useNavHidden();
  const k = useSharedValue(0);
  useEffect(() => {
    lastY = 0;
    setNavHidden(false);
  }, []);
  useEffect(() => {
    k.value = withTiming(hidden ? 1 : 0, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [hidden]);
  const slide = useAnimatedStyle(() => ({ transform: [{ translateY: k.value * 130 }, { scale: 1 - k.value * 0.06 }], opacity: 1 - k.value }));
  const items: [typeof active, string, Icon, string][] = [
    ['home', t.tabHome, 'home', '/'],
    ['carols', t.tabCarols, 'note', '/songs'],
    ['prayer', t.tabPrayer, 'pray', '/prayer'],
    ['enrol', t.tabEnrol, 'plus', '/enroll'],
    ['visit', t.myVisit, 'clock', '/my-visit'],
  ];
  return (
    <Animated.View pointerEvents={hidden ? 'none' : 'box-none'} style={[{ position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center' }, slide]}>
      <Glass style={{ width: '94%', maxWidth: 520, borderRadius: 30, flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4 }}>
        {items.map(([key, label, icon, to]) => {
          const on = key === active;
          return (
            <Pressable key={key} onPress={() => !on && router.replace(to as any)} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <Glyph name={icon} size={23} color={on ? colors.gold : colors.textSoft} />
              <Text numberOfLines={1} style={{ color: on ? colors.gold : colors.textSoft, fontFamily: on ? fonts.bodyBold : fonts.bodyMedium, fontSize: 10.5, marginTop: 3 }}>{label}</Text>
            </Pressable>
          );
        })}
      </Glass>
    </Animated.View>
  );
}

// A shelf with a title and a row of artwork that scrolls sideways.
export function Shelf({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 30 }}>
      <Pressable onPress={onAction} disabled={!onAction} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 23, letterSpacing: -0.5 }}>{title}</Text>
        {action ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 15, marginRight: 2 }}>{action}</Text>
            <Glyph name="chevron" size={16} color={colors.gold} stroke={2.4} />
          </View>
        ) : null}
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 8 }}>
        {children}
      </ScrollView>
    </View>
  );
}

// Square artwork with a title underneath.
export function Tile({ title, sub, art, icon, onPress, size = 156 }: { title: string; sub?: string; art: keyof typeof ART; icon: Icon; onPress?: () => void; size?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ width: size, marginRight: 14, opacity: pressed ? 0.75 : 1 })}>
      <LinearGradient colors={ART[art]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -size * 0.12, bottom: -size * 0.12, opacity: 0.22 }}>
          <Glyph name={icon} size={size * 0.85} color="#fff" stroke={1.2} />
        </View>
        <Glyph name={icon} size={size * 0.34} color="#fff" stroke={1.7} />
      </LinearGradient>
      <Text numberOfLines={1} style={{ color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15, marginTop: 9 }}>{title}</Text>
      {sub ? <Text numberOfLines={2} style={{ color: colors.textSoft, fontFamily: fonts.body, fontSize: 12.5, marginTop: 1, lineHeight: 17 }}>{sub}</Text> : null}
    </Pressable>
  );
}

// A carol shown as an album cover with its name across the bottom.
export function Cover({ title, art, onPress, size = 142 }: { title: string; art: keyof typeof ART; onPress?: () => void; size?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ width: size, marginRight: 14, opacity: pressed ? 0.75 : 1 })}>
      <LinearGradient colors={ART[art]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: 14, padding: 12, justifyContent: 'space-between', overflow: 'hidden' }}>
        <Glyph name="note" size={22} color="rgba(255,255,255,0.85)" />
        <Text numberOfLines={3} style={{ color: '#fff', fontFamily: fonts.display, fontSize: 17, lineHeight: 20, letterSpacing: -0.3 }}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}
