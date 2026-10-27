import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Card, Chip, Field, H, P } from './ui';
import { useLang } from '../i18n';
import { Household, useStore } from '../store';
import { HouseMap } from './HouseMap';
import { colors, fonts } from '../theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[dow]} ${d} ${MONTHS[m - 1]}`;
};

// One short page. Only the first four fields are needed. Everything else is tucked under "More details".
// The team decides the anbiyam day later and publishes it.
export function EnrolForm({ via = 'app', staff = false, defaultArea = '', onDone }: { via?: Household['via']; staff?: boolean; defaultArea?: string; onDone?: (h: Household) => void }) {
  const { t, lang } = useLang();
  const { areas, songs, dates, enrol, mapCenter } = useStore();
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [done, setDone] = useState<Household | null>(null);
  const [more, setMore] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', address: '', area: defaultArea, landmark: '', prayer: '', blessing: false, priority: false, consent: staff });
  const [songIds, setSongIds] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [customs, setCustoms] = useState<string[]>([]);
  const [away, setAway] = useState<string[]>([]);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const missing = useMemo(() => {
    const m: string[] = [];
    if (f.name.trim().length < 2) m.push('your family name');
    if (!staff && f.phone.replace(/\D/g, '').length < 10) m.push('a 10 digit phone number');
    if (f.address.trim().length < 4) m.push('your house number and street (at least 4 characters)');
    if (!f.consent) m.push('your OK at the bottom');
    return m;
  }, [f, staff]);

  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const submit = async () => {
    if (busy || missing.length) return;
    setBusy(true);
    setProblem('');
    try {
      const h = await enrol({
        name: f.name.trim(), phone: f.phone, lang, adults: 0, kids: 0, address: f.address.trim(), area: f.area, landmark: f.landmark.trim(), notes: '', prayer: f.prayer.trim(),
        blessing: f.blessing, away, priority: f.priority, free: {}, songIds, customSongs: customs, via, lat: pin?.[0], lng: pin?.[1],
      });
      setDone(h);
      onDone?.(h);
    } catch (e: any) {
      setProblem(e?.message || 'Could not save. Check the internet and try again.');
    }
    setBusy(false);
  };

  if (done) {
    return (
      <Animated.View entering={FadeInDown.duration(500)}>
        <Card>
          <H size={24}>{t.thanks}</H>
          <View style={{ height: 12 }} />
          {done.code ? (
            <>
              <P>{t.yourCode}</P>
              <H size={44}>{done.code}</H>
              <View style={{ height: 8 }} />
              <P>{t.keepCode}</P>
            </>
          ) : null}
          <View style={{ height: 14 }} />
          <Button label="Add another family" tone="ghost" onPress={() => { setDone(null); setF({ name: '', phone: '', address: '', area: defaultArea, landmark: '', prayer: '', blessing: false, priority: false, consent: staff }); setPin(null); setSongIds([]); setCustoms([]); setAway([]); setMore(false); }} />
        </Card>
      </Animated.View>
    );
  }

  return (
    <View>
      <Card>
        <Field label={t.name} value={f.name} onChangeText={(v) => set('name', v)} />
        <Field label={staff ? `${t.phone} (optional)` : t.phone} value={f.phone} keyboardType="phone-pad" onChangeText={(v) => set('phone', v)} />
        <Field label={t.address} value={f.address} onChangeText={(v) => set('address', v)} />
        <PinPicker center={mapCenter} pin={pin} onChange={setPin} />
        <P>{t.area}</P>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {areas.map((a) => (<Chip key={a} label={a} on={f.area === a} onPress={() => set('area', a)} />))}
          <Chip label={t.areaNotSure} on={f.area === ''} onPress={() => set('area', '')} />
        </View>
      </Card>

      <Pressable onPress={() => setMore(!more)} style={{ paddingVertical: 14, paddingHorizontal: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 16 }}>{more ? t.extrasHide : t.extras}</Text>
        <Text style={{ color: colors.gold, fontSize: 18 }}>{more ? '▴' : '▾'}</Text>
      </Pressable>

      {more && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Card>
            <Field label={t.landmark} value={f.landmark} onChangeText={(v) => set('landmark', v)} />
            <Field label={t.prayer} value={f.prayer} multiline onChangeText={(v) => set('prayer', v)} />
            <P>{t.blessing}</P>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 10 }}>
              <Chip label={t.blessingYes} on={f.blessing} onPress={() => set('blessing', !f.blessing)} />
              <Chip label={t.elderly} on={f.priority} onPress={() => set('priority', !f.priority)} />
            </View>
            <P>{t.requestSong}</P>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 6 }}>
              {songs.map((s) => (
                <Chip key={s.id} small label={s.title} on={songIds.includes(s.id)} onPress={() => setSongIds((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))} />
              ))}
              {customs.map((c) => (<Chip key={c} small label={c} on onPress={() => setCustoms((p) => p.filter((x) => x !== c))} />))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <View style={{ flex: 1, marginRight: 8 }}><Field label="Another carol" value={custom} onChangeText={setCustom} /></View>
              <View style={{ marginBottom: 14 }}><Button label={t.add} tone="ghost" onPress={() => { if (custom.trim()) { setCustoms((p) => [...p, custom.trim()]); setCustom(''); } }} /></View>
            </View>
            <P>{t.away}</P>
            <P size={13}>{t.awayHint}</P>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
              {dates.map((d) => (<Chip key={d} small label={dayLabel(d)} on={away.includes(d)} onPress={() => setAway((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))} />))}
            </View>
          </Card>
        </Animated.View>
      )}

      <View style={{ height: 14 }} />
      {!staff && <Chip label={t.consent} on={f.consent} onPress={() => set('consent', !f.consent)} />}
      <View style={{ height: 14 }} />
      {missing.length > 0 && !problem ? <View style={{ marginBottom: 10 }}><P size={13}>To continue, add {missing.join(', ')}.</P></View> : null}
      {problem ? <View style={{ marginBottom: 10 }}><P>{problem}</P></View> : null}
      <Button label={t.submit} onPress={submit} disabled={missing.length > 0 || busy} />
    </View>
  );
}

// The map opens full screen, so it never fights the form for finger scrolling.
function PinPicker({ center, pin, onChange }: { center: [number, number]; pin: [number, number] | null; onChange: (p: [number, number]) => void }) {
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState<[number, number] | null>(pin);
  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => { setTmp(pin); setOpen(true); }}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: pin ? colors.fill : colors.chipOn }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: pin ? colors.ok : 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontFamily: fonts.bodyBold }}>{pin ? '✓' : '⌖'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: pin ? colors.text : colors.onPrimary, fontFamily: fonts.bodyBold, fontSize: 16 }}>{pin ? 'Your home is on the map' : 'Mark your home on the map'}</Text>
          <Text style={{ color: pin ? colors.textSoft : 'rgba(255,255,255,0.85)', fontFamily: fonts.body, fontSize: 13, marginTop: 2 }}>{pin ? 'Tap to move the pin' : 'Helps the carollers find your gate, even at night'}</Text>
        </View>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.skyTop, padding: 14, paddingTop: 40 }}>
          <H size={22}>Drop a pin on your house</H>
          <P size={13}>Tap the map where your gate is, or press the arrow when you are at home. Drag the pin to adjust.</P>
          <View style={{ height: 10 }} />
          <View style={{ flex: 1 }}>
            <HouseMap mode="pick" center={tmp || pin || center} pin={tmp} height={560} onPick={(la, ln) => setTmp([la, ln])} />
          </View>
          <View style={{ height: 10 }} />
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 8 }}><Button label="Cancel" tone="ghost" onPress={() => setOpen(false)} /></View>
            <View style={{ flex: 1 }}><Button label="Use this pin" disabled={!tmp} onPress={() => { if (tmp) onChange(tmp); setOpen(false); }} /></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
