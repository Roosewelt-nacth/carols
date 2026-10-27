import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandBar, Chip, Group, Screen, Title } from '../src/components/ui';
import { ART, Glyph, TabBar, navScroll } from '../src/components/Music';
import { useLang } from '../src/i18n';
import { useStore } from '../src/store';
import { openBooklet } from '../src/pdf';
import { colors, fonts } from '../src/theme';
import type { Song } from '../src/data/songs';

const artFor = (s: Song, i: number) => (s.kind === 'quiet' ? 'navy' : s.kind === 'joyful' ? 'red' : (['green', 'gold', 'plum'] as const)[i % 3]);

// Lyrics open full screen: the cover colour on top, big words below, the refrain set apart.
function Lyrics({ song, art, onClose }: { song: Song; art: keyof typeof ART; onClose: () => void }) {
  const { t } = useLang();
  const stanzas = (song.lyrics || '').split(/\n\n/).filter(Boolean);
  const tamil = song.lang === 'ta';
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.skyTop }}>
        <LinearGradient colors={ART[art]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 44, paddingBottom: 22, paddingHorizontal: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={onClose} hitSlop={12} style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 }}>
              <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 }}>Close</Text>
            </Pressable>
            {song.page ? (
              <Pressable onPress={() => openBooklet(song.page)} hitSlop={12} style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 }}>
                <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 }}>{t.originalPage}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={{ height: 16 }} />
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: fonts.bodyBold, fontSize: 13 }}>{song.no ? `${t.tabCarols} ${song.no}` : t.tabCarols}</Text>
          <Text style={{ color: '#fff', fontFamily: tamil ? fonts.body : fonts.display, fontWeight: tamil ? '700' : undefined, fontSize: 32, lineHeight: 40, letterSpacing: -0.6, marginTop: 4 }}>{song.title}</Text>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 70, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          {song.check && tamil ? (
            <View style={{ backgroundColor: colors.fill, borderRadius: 12, padding: 12, marginBottom: 22 }}>
              <Text style={{ color: colors.textSoft, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 }}>{t.checkNote}</Text>
            </View>
          ) : null}
          {stanzas.length === 0 && <Text style={{ color: colors.textSoft, fontFamily: fonts.body, fontSize: 16 }}>Lyrics are not added yet.</Text>}
          {stanzas.map((st, i) => {
            const refrain = st.startsWith('~');
            return (
              <View key={i} style={{ marginBottom: 26, paddingLeft: refrain ? 16 : 0, borderLeftWidth: refrain ? 3 : 0, borderColor: colors.gold }}>
                <Text style={{ color: refrain ? colors.gold : colors.text, fontFamily: tamil ? fonts.body : fonts.displayItalic, fontSize: tamil ? 20 : 21, lineHeight: tamil ? 33 : 31, fontWeight: refrain && tamil ? '600' : undefined }}>{refrain ? st.slice(1) : st}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function Songs() {
  const { t } = useLang();
  const router = useRouter();
  const { songs } = useStore();
  const [lang, setLang] = useState<'all' | 'en' | 'ta'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const { open: openParam } = useLocalSearchParams<{ open?: string }>();
  useEffect(() => {
    if (openParam) setOpen(String(openParam));
  }, [openParam]);
  const shown = songs.filter((s) => lang === 'all' || s.lang === lang);
  const cur = songs.find((s) => s.id === open) || null;
  return (
    <Screen>
      <ScrollView onScroll={navScroll} scrollEventThrottle={16} contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <BrandBar />
        <View style={{ height: 14 }} />
        <Title sub="Tap a carol to read the words.">{t.tabCarols}</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
          <Chip label={t.allLang} on={lang === 'all'} onPress={() => setLang('all')} />
          <Chip label="English" on={lang === 'en'} onPress={() => setLang('en')} />
          <Chip label="தமிழ்" on={lang === 'ta'} onPress={() => setLang('ta')} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
          <Chip small label={t.tabPrayer} on={false} onPress={() => router.push('/prayer')} />
          <Chip small label={t.booklet} on={false} onPress={() => openBooklet()} />
        </View>
        <Group>
          {shown.map((s, i) => (
            <Pressable key={s.id} onPress={() => setOpen(s.id)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, backgroundColor: pressed ? colors.fill : 'transparent' })}>
              <LinearGradient colors={ART[artFor(s, i)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                {s.no ? <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: 18 }}>{s.no}</Text> : <Glyph name="note" size={22} color="#fff" />}
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: 17, fontFamily: s.lang === 'ta' ? fonts.body : fonts.bodyMedium, letterSpacing: -0.2 }}>{s.title}</Text>
                <Text style={{ color: colors.textSoft, fontSize: 12.5, fontFamily: fonts.body, marginTop: 1 }}>{s.lang === 'ta' ? 'தமிழ்' : 'English'}</Text>
              </View>
              <Glyph name="chevron" size={16} color={colors.placeholder} stroke={2.4} />
            </Pressable>
          ))}
        </Group>
      </ScrollView>
      {cur && <Lyrics song={cur} art={artFor(cur, songs.indexOf(cur))} onClose={() => setOpen(null)} />}
      <TabBar active="carols" />
    </Screen>
  );
}
