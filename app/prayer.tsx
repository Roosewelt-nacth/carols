import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrandBar, Button, Card, Chip, Screen, Title } from '../src/components/ui';
import { TabBar, navScroll } from '../src/components/Music';
import { useLang } from '../src/i18n';
import { openBooklet } from '../src/pdf';
import { useStore } from '../src/store';
import { CHECK_PRAYERS, CLOSING_PRAYER, OPENING_PRAYER } from '../src/data/prayers';
import { colors, fonts } from '../src/theme';

// The prayers for the visit, set large and calm so they are easy to read aloud at a door.
export default function Prayer() {
  const { t, lang } = useLang();
  const router = useRouter();
  const { songs } = useStore();
  const [pl, setPl] = useState<'en' | 'ta'>(lang);
  const text = { fontFamily: fonts.body, fontSize: pl === 'ta' ? 21 : 20, lineHeight: pl === 'ta' ? 35 : 31 } as const;
  const endings = songs.filter((s) => s.ending);

  // The order of a visit, from the booklet and the youth team.
  const steps: [string, (() => void) | null][] = [
    [t.flowEnter, null],
    [t.openingPrayer, null],
    [t.flowCarols, () => router.push('/songs')],
    [t.flowIntentions, null],
    [t.flowEnding, null],
  ];

  return (
    <Screen>
      <ScrollView onScroll={navScroll} scrollEventThrottle={16} contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <BrandBar />
        <View style={{ height: 14 }} />
        <Title sub={t.visitOrder}>{t.prayerTitle}</Title>

        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          <Chip label="English" on={pl === 'en'} onPress={() => setPl('en')} />
          <Chip label="தமிழ்" on={pl === 'ta'} onPress={() => setPl('ta')} />
        </View>

        <Card style={{ paddingVertical: 8 }}>
          {steps.map(([label, fn], i) => (
            <Pressable key={label} onPress={fn || undefined} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderColor: colors.cardBorder }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 13 }}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1, color: colors.text, fontFamily: lang === 'ta' ? fonts.body : fonts.bodyMedium, fontSize: 15.5, lineHeight: 22 }}>{label}</Text>
              {fn ? <Text style={{ color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14 }}>›</Text> : null}
            </Pressable>
          ))}
        </Card>

        {endings.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: colors.textSoft, fontFamily: fonts.bodyMedium, fontSize: 12.5, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>{t.endingSongs}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {endings.map((s) => (
                <Chip key={s.id} label={s.title} on={false} onPress={() => router.push({ pathname: '/songs', params: { open: s.id } })} />
              ))}
            </View>
          </View>
        )}

        {CHECK_PRAYERS && (
          <View style={{ backgroundColor: colors.fill, borderRadius: 12, padding: 12, marginTop: 16 }}>
            <Text style={{ color: colors.textSoft, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 }}>{pl === 'en' ? t.checkNoteEn : t.checkNote}</Text>
          </View>
        )}

        <Animated.View key={pl + 'o'} entering={FadeInDown.duration(450)} style={{ marginTop: 26 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.5 }}>{t.openingPrayer}</Text>
            <Chip small label={t.originalPage} on={false} onPress={() => openBooklet(OPENING_PRAYER.page)} />
          </View>
          <Card>
            {OPENING_PRAYER.lines.map((l, i) => (
              <View key={i} style={{ marginBottom: i === OPENING_PRAYER.lines.length - 1 ? 0 : 18, flexDirection: 'row' }}>
                <View style={{ width: 4, borderRadius: 2, marginRight: 14, backgroundColor: l.who === 'leader' ? colors.gold : colors.fill }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: l.who === 'leader' ? colors.gold : colors.textSoft, fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 }}>{l.who === 'leader' ? t.leader : t.everyone}</Text>
                  <Text style={{ ...text, color: colors.text, fontWeight: l.who === 'all' ? '700' : undefined }}>{l[pl]}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View key={pl + 'c'} entering={FadeInDown.delay(100).duration(450)} style={{ marginTop: 30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.5 }}>{t.closingPrayer}</Text>
            <Chip small label={t.originalPage} on={false} onPress={() => openBooklet(CLOSING_PRAYER.page)} />
          </View>
          <Text style={{ color: colors.textSoft, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, marginBottom: 10 }}>{t.intentionsNote}</Text>
          <Card>
            {CLOSING_PRAYER.paragraphs.map((p, i) => (
              <Text key={i} style={{ ...text, color: colors.text, marginBottom: i === CLOSING_PRAYER.paragraphs.length - 1 ? 0 : 16 }}>{p[pl]}</Text>
            ))}
          </Card>
        </Animated.View>

        <View style={{ height: 26 }} />
        <Button label={t.booklet} tone="ghost" onPress={() => openBooklet()} />
      </ScrollView>
      <TabBar active="prayer" />
    </Screen>
  );
}
