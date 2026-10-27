import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrandBar, Button, Card, Chip, Screen, Title } from '../src/components/ui';
import { TabBar, navScroll } from '../src/components/Music';
import { useLang } from '../src/i18n';
import { openBooklet } from '../src/pdf';
import { CHECK_PRAYERS, CLOSING_PRAYER, OPENING_PRAYER } from '../src/data/prayers';
import { colors, fonts } from '../src/theme';

// Tamil prayers for the visit, set large and calm so they are easy to read aloud at a door.
const tamilText = { fontFamily: fonts.body, fontSize: 21, lineHeight: 35 } as const;

export default function Prayer() {
  const { t } = useLang();
  const router = useRouter();
  const steps: [string, () => void][] = [
    [t.openingPrayer, () => {}],
    [t.tabCarols, () => router.push('/songs')],
    [t.closingPrayer, () => {}],
  ];
  return (
    <Screen>
      <ScrollView onScroll={navScroll} scrollEventThrottle={16} contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <BrandBar />
        <View style={{ height: 14 }} />
        <Title sub="Pray at the door, sing the carols, then close with thanks.">{t.prayerTitle}</Title>

        <Card style={{ paddingVertical: 8 }}>
          <Text style={{ color: colors.textSoft, fontFamily: fonts.bodyMedium, fontSize: 12.5, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 8, marginBottom: 4 }}>{t.visitOrder}</Text>
          {steps.map(([label, fn], i) => (
            <Pressable key={label} onPress={fn} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 13 }}>{i + 1}</Text>
              </View>
              <Text style={{ color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 16 }}>{label}</Text>
            </Pressable>
          ))}
        </Card>

        {CHECK_PRAYERS && (
          <View style={{ backgroundColor: colors.fill, borderRadius: 12, padding: 12, marginTop: 14 }}>
            <Text style={{ color: colors.textSoft, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 }}>{t.checkNote}</Text>
          </View>
        )}

        <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: 26 }}>
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
                  <Text style={{ ...tamilText, color: colors.text, fontWeight: l.who === 'all' ? '700' : undefined }}>{l.text}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={{ marginTop: 30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.5 }}>{t.closingPrayer}</Text>
            <Chip small label={t.originalPage} on={false} onPress={() => openBooklet(CLOSING_PRAYER.page)} />
          </View>
          <Card>
            {CLOSING_PRAYER.paragraphs.map((p, i) => (
              <Text key={i} style={{ ...tamilText, color: colors.text, marginBottom: i === CLOSING_PRAYER.paragraphs.length - 1 ? 0 : 16 }}>{p}</Text>
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
