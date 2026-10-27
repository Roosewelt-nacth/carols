import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { BrandMark, Card, LangToggle, P, Screen } from '../src/components/ui';
import { Cover, Glyph, Shelf, TabBar, Tile } from '../src/components/Music';
import { ThemePicker } from '../src/components/Decor';
import { useLang } from '../src/i18n';
import { useStore } from '../src/store';
import { colors, fonts } from '../src/theme';

const markDark = require('../assets/brand/victorians-mark.png');
const markLight = require('../assets/brand/victorians-mark-light.png');

const star = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 === 0 ? 48 : 13;
  const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
  return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
}).join(' ');

export default function Home() {
  const { t } = useLang();
  const { songs } = useStore();
  const router = useRouter();
  const kindArt = (k: string, i: number) => (k === 'quiet' ? 'navy' : k === 'joyful' ? 'red' : (['green', 'gold', 'plum'] as const)[i % 3]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 26, paddingBottom: 140, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        {/* header: date style label, big italic title, language */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: 12 }}><BrandMark size={52} /></View>
            <View>
              <Text style={{ color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' }}>{t.heroKicker}</Text>
              <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 40, letterSpacing: -1.2, lineHeight: 46 }}>{t.appName}</Text>
            </View>
          </View>
          <LangToggle />
        </View>

        {/* featured card */}
        <Animated.View entering={FadeInDown.duration(600)} style={{ marginTop: 18 }}>
          <Pressable onPress={() => router.push('/enroll')}>
            <LinearGradient colors={['#E5384A', '#A01B2D', '#5E0F1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 24, minHeight: 330, overflow: 'hidden', justifyContent: 'flex-end' }}>
              <View style={{ position: 'absolute', top: -30, right: -40, opacity: 0.2 }}>
                <Svg width={280} height={280} viewBox="0 0 100 100">
                  <Polygon points={star} fill="#fff" />
                  <Circle cx="50" cy="50" r="5" fill="#E5384A" />
                </Svg>
              </View>
              <View style={{ position: 'absolute', top: 22, left: 22, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 }}>
                <Image source={markLight} style={{ width: 16, height: 16, marginRight: 8 }} resizeMode="contain" />
                <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 12.5 }}>{t.byYouth}</Text>
              </View>
              <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: 42, lineHeight: 46, letterSpacing: -1.3, maxWidth: 420 }}>{t.heroTitle}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.88)', fontFamily: fonts.body, fontSize: 16, lineHeight: 23, marginTop: 10, maxWidth: 420 }}>{t.heroBody}</Text>
              <View style={{ flexDirection: 'row', marginTop: 20, flexWrap: 'wrap' }}>
                <Pressable onPress={() => router.push('/enroll')} style={{ backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, marginRight: 10, marginBottom: 6 }}>
                  <Text style={{ color: '#A01B2D', fontFamily: fonts.bodyBold, fontSize: 16 }}>{t.enrol}</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/songs')} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, marginBottom: 6 }}>
                  <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 16 }}>{t.tabCarols}</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          <Shelf title={t.joinIn}>
            <Tile title={t.tabEnrol} sub={t.how1} art="red" icon="plus" onPress={() => router.push('/enroll')} />
            <Tile title={t.tabCarols} sub={t.how2} art="green" icon="note" onPress={() => router.push('/songs')} />
            <Tile title={t.myVisit} sub={t.how3} art="navy" icon="clock" onPress={() => router.push('/my-visit')} />
          </Shelf>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(600)}>
          <Shelf title={t.carolsShelf} action={t.seeAll} onAction={() => router.push('/songs')}>
            {songs.slice(0, 10).map((s, i) => (
              <Cover key={s.id} title={s.title} art={kindArt(s.kind, i)} onPress={() => router.push('/songs')} />
            ))}
          </Shelf>
        </Animated.View>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <Link href="/paper-form" style={{ color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 14 }}>
            {t.noPhone}
          </Link>
          <View style={{ height: 18 }} />
          <ThemePicker />
          <View style={{ height: 14 }} />
          <Link href="/admin" style={{ color: colors.textSoft, fontFamily: fonts.bodyMedium, fontSize: 14 }}>
            {t.admin}
          </Link>
        </View>
      </ScrollView>
      <TabBar active="home" />
    </Screen>
  );
}
