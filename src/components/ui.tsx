import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGradient, Polygon, Rect, Stop } from 'react-native-svg';
import { colors, fonts, radius } from '../theme';
import { Lang, useLang } from '../i18n';
import { Snow } from './Snow';
import { Ambient, Ribbon } from './Decor';

// Soft Christmas glow, a ribbon hairline and a very faint flurry sit behind the glass.
export function Screen({ children, snow = true }: { children: React.ReactNode; snow?: boolean; lights?: boolean; trees?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.skyTop }}>
      <Ambient />
      {snow && <Snow count={14} />}
      <Ribbon />
      {children}
    </View>
  );
}

// Frosted glass: blur what is behind, a faint white edge, a soft shadow.
export function Glass({ children, style, enter }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; enter?: boolean }) {
  const entering = enter ? FadeInDown.duration(420).springify().damping(20) : undefined;
  const base: ViewStyle = { backgroundColor: colors.glass, borderColor: colors.glassEdge, borderWidth: 1, overflow: 'hidden' };
  if (Platform.OS === 'web') {
    const web: any = {
      backdropFilter: 'blur(26px) saturate(180%)',
      WebkitBackdropFilter: 'blur(26px) saturate(180%)',
      boxShadow: colors.light ? '0 8px 30px rgba(31,41,55,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' : '0 8px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    };
    return (
      <Animated.View entering={entering} style={[base, web, style as any]}>
        {children}
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={entering} style={[base, style as any]}>
      <BlurView intensity={50} tint={colors.light ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
      {children}
    </Animated.View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <Glass enter style={[{ borderRadius: radius.l + 2, padding: 18 }, style as any]}>
      {children}
    </Glass>
  );
}

// Slides up and fades in. Give each item a growing index for a gentle stagger.
export function Appear({ children, i = 0, style }: { children: React.ReactNode; i?: number; style?: ViewStyle }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(i, 12) * 55).duration(520).springify().damping(18)} style={style}>
      {children}
    </Animated.View>
  );
}

// Counts up from zero when it appears.
export function CountUp({ to, style }: { to: number; style?: any }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const dur = 700;
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / dur);
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <Text style={style}>{v}</Text>;
}

export function ProgressBar({ pct }: { pct: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(100, pct)), { duration: 900 });
  }, [pct]);
  const a = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.fill, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: colors.ok }, a]} />
    </View>
  );
}

// Page-section content that fades when the tab changes.
export function Swap({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <Animated.View key={k} entering={FadeIn.duration(260)}>
      {children}
    </Animated.View>
  );
}

// Horizontal pill tabs that scroll sideways instead of wrapping.
export function Tabs<T extends string>({ items, value, onChange }: { items: readonly (readonly [T, string])[]; value: T; onChange: (k: T) => void }) {
  return (
    <Glass style={{ borderRadius: 999, marginBottom: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 4 }}>
        {items.map(([k, l]) => (
          <Pressable key={k} onPress={() => onChange(k)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: value === k ? colors.primary : 'transparent' }}>
            <Text style={{ color: value === k ? colors.onPrimary : colors.text, fontFamily: value === k ? fonts.bodyBold : fonts.bodyMedium, fontSize: 14 }}>{l}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Glass>
  );
}

export function H({ children, size = 28 }: { children: React.ReactNode; size?: number }) {
  return <Text style={{ color: colors.text, fontSize: size, fontFamily: fonts.display, letterSpacing: size > 24 ? -0.6 : -0.2, lineHeight: size * 1.16 }}>{children}</Text>;
}

// Large title, left aligned, like a navigation bar in an iOS app.
export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={{ marginBottom: 18 }}>
      <Text style={{ color: colors.text, fontSize: 34, fontFamily: fonts.display, letterSpacing: -0.9, lineHeight: 40 }}>{children}</Text>
      {sub ? <Text style={{ color: colors.textSoft, fontSize: 16, fontFamily: fonts.body, lineHeight: 23, marginTop: 4 }}>{sub}</Text> : null}
    </Animated.View>
  );
}

export function Script({ children, size = 54 }: { children: React.ReactNode; size?: number }) {
  return <Text style={{ color: colors.text, fontSize: size, fontFamily: fonts.display, letterSpacing: -1.4, lineHeight: size * 1.1, textAlign: 'center' }}>{children}</Text>;
}

export function P({ children, soft = true, size = 15 }: { children: React.ReactNode; soft?: boolean; size?: number }) {
  return <Text style={{ color: soft ? colors.textSoft : colors.text, fontSize: size, lineHeight: size * 1.45, fontFamily: soft ? fonts.body : fonts.bodyMedium }}>{children}</Text>;
}

// "‹ Home" in the accent colour, top left, like the iOS back button.
export function BackLink({ label = 'Home', to = '/' }: { label?: string; to?: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.replace(to as any)} hitSlop={12} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <Text style={{ color: colors.gold, fontSize: 28, fontFamily: fonts.body, marginRight: 4, marginTop: -3 }}>‹</Text>
      <Text style={{ color: colors.gold, fontSize: 17, fontFamily: fonts.body }}>{label}</Text>
    </Pressable>
  );
}

const markDark = require('../../assets/brand/victorians-mark.png');
const markLight = require('../../assets/brand/victorians-mark-light.png');

// The Victorians Youth "V" in the right colour for the current theme.
export function BrandMark({ size = 28, onDark }: { size?: number; onDark?: boolean }) {
  const light = onDark ?? !colors.light;
  return <Image source={light ? markLight : markDark} style={{ width: size, height: size * 0.9 }} resizeMode="contain" />;
}

// Back link on the left, the Victorians Youth mark and name on the right.
export function BrandBar() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <BackLink />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <BrandMark size={22} />
        <Text style={{ color: colors.textSoft, fontFamily: fonts.bodyMedium, fontSize: 12.5, marginLeft: 7 }}>Victorians Youth</Text>
      </View>
    </View>
  );
}

export function Button({ label, onPress, tone = 'gold', disabled }: { label: string; onPress: () => void; tone?: 'gold' | 'ghost' | 'berry'; disabled?: boolean }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const bg = tone === 'gold' ? colors.primary : tone === 'berry' ? colors.danger : colors.fill;
  const fg = tone === 'gold' || tone === 'berry' ? colors.onPrimary : colors.gold;
  return (
    <Animated.View style={[a, { opacity: disabled ? 0.4 : 1 }]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => (s.value = withSpring(0.97, { damping: 18, stiffness: 300 }))}
        onPressOut={() => (s.value = withSpring(1, { damping: 14, stiffness: 260 }))}
        onPress={onPress}
        style={[
          { backgroundColor: bg, borderRadius: radius.m, minHeight: 50, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
          tone === 'gold' ? ({ shadowColor: bg, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } } as any) : null,
        ]}>
        <Text style={{ color: fg, fontSize: 17, fontFamily: fonts.bodyBold, letterSpacing: -0.2 }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Pill: quiet grey when off, solid accent when on. Springs a little when pressed.
export function Chip({ label, on, onPress, small }: { label: string; on: boolean; onPress: () => void; small?: boolean }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[a, { margin: 3 }]}>
      <Pressable
        onPressIn={() => (s.value = withSpring(0.94, { damping: 16, stiffness: 320 }))}
        onPressOut={() => (s.value = withSpring(1, { damping: 12, stiffness: 260 }))}
        onPress={onPress}
        style={{ paddingVertical: small ? 6 : 9, paddingHorizontal: small ? 12 : 16, borderRadius: 999, backgroundColor: on ? colors.chipOn : colors.fill }}>
        <Text style={{ color: on ? colors.onPrimary : colors.text, fontFamily: on ? fonts.bodyBold : fonts.bodyMedium, fontSize: small ? 13 : 15 }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Field({ label, ...rest }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.textSoft, fontSize: 13, marginBottom: 6, marginLeft: 2, fontFamily: fonts.bodyMedium }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.placeholder}
        {...rest}
        style={[
          { color: colors.text, borderRadius: radius.m - 2, paddingVertical: 13, paddingHorizontal: 14, fontSize: 17, fontFamily: fonts.body, backgroundColor: colors.inputBg, outlineWidth: 0 } as any,
          rest.style as any,
        ]}
      />
    </View>
  );
}

// Inset grouped list on glass: rows separated by hairlines.
export function Group({ children }: { children: React.ReactNode }) {
  const rows = React.Children.toArray(children);
  return (
    <Glass style={{ borderRadius: radius.l + 2 }}>
      {rows.map((r, i) => (
        <View key={i}>
          {i > 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.cardBorder, marginLeft: 16 }} />}
          {r}
        </View>
      ))}
    </Glass>
  );
}

export function Row({ title, sub, onPress, chevron = true }: { title: string; sub?: string; onPress?: () => void; chevron?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: pressed ? colors.fill : 'transparent' })}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontFamily: fonts.body, letterSpacing: -0.2 }}>{title}</Text>
        {sub ? <Text style={{ color: colors.textSoft, fontSize: 14, fontFamily: fonts.body, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {chevron && onPress ? <Text style={{ color: colors.placeholder, fontSize: 22, fontFamily: fonts.body, marginLeft: 8 }}>›</Text> : null}
    </Pressable>
  );
}

// The app icon: a red rounded square with a white star, like an iOS home screen icon.
export function AppIcon({ size = 88 }: { size?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 30 : 12.5;
    const ang = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    return `${50 + r * Math.cos(ang)},${52 + r * Math.sin(ang)}`;
  }).join(' ');
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withTiming(1, { duration: 900 });
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.8 + glow.value * 0.2 }] }));
  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size * 0.225, overflow: 'hidden', shadowColor: colors.gold, shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } }, a]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="ic" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.light ? '#E0394A' : '#FF6A72'} />
            <Stop offset="1" stopColor={colors.light ? '#B01826' : '#E02F3A'} />
          </SvgGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#ic)" />
        <Polygon points={pts} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 999, padding: 2 }}>
      {(['en', 'ta'] as Lang[]).map((l) => (
        <Pressable key={l} onPress={() => setLang(l)} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: lang === l ? colors.card : 'transparent' }}>
          <Text style={{ color: colors.text, fontFamily: lang === l ? fonts.bodyBold : fonts.body, fontSize: 13 }}>{l === 'en' ? 'English' : 'தமிழ்'}</Text>
        </Pressable>
      ))}
    </View>
  );
}
