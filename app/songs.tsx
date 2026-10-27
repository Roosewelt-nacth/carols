import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandBar, Group, Screen, Title } from '../src/components/ui';
import { ART, Glyph, TabBar } from '../src/components/Music';
import { useLang } from '../src/i18n';
import { useStore } from '../src/store';
import { colors, fonts } from '../src/theme';
import type { Song } from '../src/data/songs';

const artFor = (s: Song, i: number) => (s.kind === 'quiet' ? 'navy' : s.kind === 'joyful' ? 'red' : (['green', 'gold', 'plum'] as const)[i % 3]);

// Lyrics open full screen: the cover colour on top, big italic words below, chorus set apart.
function Lyrics({ song, art, onClose }: { song: Song; art: keyof typeof ART; onClose: () => void }) {
  const stanzas = (song.lyrics || '').split(/\n\n/).filter(Boolean);
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.skyTop }}>
        <LinearGradient colors={ART[art]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 44, paddingBottom: 22, paddingHorizontal: 22 }}>
          <Pressable onPress={onClose} hitSlop={12} style={{ alignSelf: 'flex-start', marginBottom: 18, backgroundColor: 'rgba(255,255,255,0.22)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 }}>Close</Text>
          </Pressable>
          <Glyph name="note" size={26} color="rgba(255,255,255,0.85)" />
          <Text style={{ color: '#fff', fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -0.9, marginTop: 8 }}>{song.title}</Text>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          {stanzas.length === 0 && <Text style={{ color: colors.textSoft, fontFamily: fonts.body, fontSize: 16 }}>Lyrics are not added yet.</Text>}
          {stanzas.map((st, i) => {
            const chorus = st.startsWith('~');
            return (
              <View key={i} style={{ marginBottom: 26, paddingLeft: chorus ? 16 : 0, borderLeftWidth: chorus ? 3 : 0, borderColor: colors.gold }}>
                <Text style={{ color: chorus ? colors.gold : colors.text, fontFamily: fonts.displayItalic, fontSize: 21, lineHeight: 31 }}>{chorus ? st.slice(1) : st}</Text>
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
  const { songs } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const cur = open != null ? songs[open] : null;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <BrandBar />
        <View style={{ height: 14 }} />
        <Title sub="Tap a carol to read the words.">{t.tabCarols}</Title>
        <Group>
          {songs.map((s, i) => (
            <Pressable key={s.id} onPress={() => setOpen(i)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, backgroundColor: pressed ? colors.fill : 'transparent' })}>
              <LinearGradient colors={ART[artFor(s, i)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Glyph name="note" size={22} color="#fff" />
              </LinearGradient>
              <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 17, fontFamily: fonts.bodyMedium, letterSpacing: -0.2 }}>{s.title}</Text>
              <Glyph name="chevron" size={16} color={colors.placeholder} stroke={2.4} />
            </Pressable>
          ))}
        </Group>
      </ScrollView>
      {cur && <Lyrics song={cur} art={artFor(cur, open!)} onClose={() => setOpen(null)} />}
      <TabBar active="carols" />
    </Screen>
  );
}
