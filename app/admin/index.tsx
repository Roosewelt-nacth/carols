import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Appear, BackLink, BrandBar, BrandMark, Button, Card, Chip, CountUp, Field, H, LangToggle, P, ProgressBar, Screen, Swap, Tabs, Title } from '../../src/components/ui';
import { EnrolForm, dayLabel } from '../../src/components/EnrolForm';
import { HouseMap } from '../../src/components/HouseMap';
import { ThemePicker } from '../../src/components/Decor';
import { useLang } from '../../src/i18n';
import { Household, Role, VisitStatus, useStore } from '../../src/store';
import { visitsFromAreas } from '../../src/areaPlan';
import { STATUS_COLORS } from '../../src/mapHtml';
import { colors, fonts } from '../../src/theme';

type Tab = 'today' | 'families' | 'plan' | 'map' | 'more';

const stamp = (iso: string) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const STATUS_LABEL: Record<string, string> = { none: 'No evening yet', planned: 'Pending', told: 'Pending', arrived: 'Singing now', done: 'Finished', missed: 'Not available' };
const sig = (days: { date: string; houseIds: string[] }[]) => days.map((d) => `${d.date}:${d.houseIds.join(',')}`).join('|');
const wa = (phone: string, text: string) => Linking.openURL(`https://wa.me/${phone ? '91' + phone.replace(/\D/g, '').slice(-10) : ''}?text=${encodeURIComponent(text)}`);

function messageFor(h: Household, date: string, group: string) {
  const when = dayLabel(date);
  if (h.lang === 'ta') return `உங்களுக்குச் சமாதானம், ${h.name}! ${group} கரோல் குழு ${when} அன்று மாலை வருகிறது (${h.address}). மாற்றம் இருந்தால் தெரிவிக்கவும். கிறிஸ்துமஸ் வாழ்த்துகள்!`;
  return `Peace be with you, ${h.name}! The ${group} carol group will visit you on ${when} evening (${h.address}). Please reply if anything changes. Merry Christmas!`;
}

const Section = ({ children }: { children: string }) => (
  <Text style={{ color: colors.textSoft, fontFamily: fonts.bodyMedium, fontSize: 13, marginBottom: 8, marginTop: 20, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{children}</Text>
);

// One anbiyam: its name, leader and the leader's WhatsApp number.
function AnbiyamEditor({ a, onSave, onRemove, count }: { a: { name: string; leader: string; phone: string }; onSave: (n: string, l: string, p: string) => void; onRemove: () => void; count: number }) {
  const [name, setName] = useState(a.name);
  const [leader, setLeader] = useState(a.leader);
  const [phone, setPhone] = useState(a.phone);
  const dirty = name !== a.name || leader !== a.leader || phone !== a.phone;
  return (
    <Card style={{ marginBottom: 10, padding: 14 }}>
      <Field label="Anbiyam name" value={name} onChangeText={setName} />
      <Field label="Leader" value={leader} onChangeText={setLeader} />
      <Field label="Leader's WhatsApp number" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Chip small label={dirty ? 'Save' : 'Saved'} on={dirty} onPress={() => dirty && name.trim() && onSave(name, leader, phone)} />
        <Chip small label="Remove" on={false} onPress={onRemove} />
        <P size={12}>{count} families</P>
      </View>
    </Card>
  );
}

export default function Admin() {
  const { t } = useLang();
  const s = useStore();
  const [pin, setPin] = useState('');
  const [who, setWho] = useState('');
  const [bad, setBad] = useState(false);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<Tab>('today');
  const [filter, setFilter] = useState('all');
  const [openHouse, setOpenHouse] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [imported, setImported] = useState<number | null>(null);
  const [group, setGroup] = useState('Victorians Youth');
  const [mapDate, setMapDate] = useState('all');
  const [mapFilter, setMapFilter] = useState<'all' | 'pending' | 'arrived' | 'done' | 'na'>('all');
  const [sel, setSel] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [addDay, setAddDay] = useState<string | null>(null);
  const [song, setSong] = useState('');
  const [lyr, setLyr] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invName, setInvName] = useState('');
  const [invRole, setInvRole] = useState<Role>('captain');
  const [newName, setNewName] = useState('');

  // Visit lists follow the evening to anbiyam choices on their own, so there is no "update" button.
  const expected = useMemo(() => visitsFromAreas(s.houses, s.dayAreas), [s.houses, s.dayAreas]);
  const expectedSig = sig(expected.days);
  const planSig = sig((s.plan?.days || []).map((d) => ({ date: d.date, houseIds: d.houseIds })));
  const stale = expectedSig !== planSig && (Object.keys(s.dayAreas).length > 0 || !s.plan);
  useEffect(() => {
    if (!s.isAdmin || !stale) return;
    const id = setTimeout(() => s.generate(), 900);
    return () => clearTimeout(id);
  }, [s.isAdmin, stale, expectedSig]);

  const filtered = useMemo(() => s.houses.filter((h) => filter === 'all' || (filter === 'none' ? !h.area : h.area === filter)), [s.houses, filter]);
  const countBy = useMemo(() => {
    const m: Record<string, number> = {};
    s.houses.forEach((h) => (m[h.area || ''] = (m[h.area || ''] || 0) + 1));
    return m;
  }, [s.houses]);
  const asks = useMemo(() => {
    const m = new Map<string, number>();
    s.houses.forEach((h) => h.songIds.forEach((id) => m.set(id, (m.get(id) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ title: s.songs.find((x) => x.id === id)?.title || id, n }));
  }, [s.houses, s.songs]);
  const customAsks = s.houses.flatMap((h) => h.customSongs.map((c) => `${c} (${h.name})`));
  const leaderOf = (area: string) => s.anbiyams.find((a) => a.name === area);

  const dayOf = (id: string) => s.plan?.days.find((d) => d.houseIds.includes(id));
  const statusOf = (id: string): VisitStatus | 'none' => {
    const d = dayOf(id);
    return d ? s.status[`${d.date}|${id}`] || 'planned' : 'none';
  };
  const mapHouses = s.houses
    .filter((h) => mapDate === 'all' || dayOf(h.id)?.date === mapDate)
    .filter((h) => {
      const st = statusOf(h.id);
      return mapFilter === 'all' || (mapFilter === 'pending' ? st === 'planned' || st === 'told' : mapFilter === 'arrived' ? st === 'arrived' : mapFilter === 'done' ? st === 'done' : st === 'missed');
    })
    .map((h) => ({ id: h.id, name: h.name, lat: h.lat, lng: h.lng, status: statusOf(h.id), order: dayOf(h.id) ? dayOf(h.id)!.houseIds.indexOf(h.id) + 1 : undefined }));
  const route: [number, number][] =
    mapDate === 'all' || !s.plan ? [] : (s.plan.days.find((d) => d.date === mapDate)?.houseIds || []).map((id) => s.houses.find((h) => h.id === id)).filter((h) => h && h.lat != null).map((h) => [h!.lat!, h!.lng!] as [number, number]);
  const selHouse = s.houses.find((h) => h.id === sel);
  const selDay = selHouse ? dayOf(selHouse.id) : undefined;
  const selStatus = selHouse ? statusOf(selHouse.id) : 'none';
  const selLast = selHouse && selDay ? s.lastChange(selDay.date, selHouse.id) : undefined;
  const inDay = s.houses.filter((h) => mapDate === 'all' || dayOf(h.id)?.date === mapDate);
  const tally = (f: (st: string) => boolean) => inDay.filter((h) => f(statusOf(h.id))).length;
  const counts = s.houses.reduce((m: Record<string, number>, h) => ((m[statusOf(h.id)] = (m[statusOf(h.id)] || 0) + 1), m), {});

  if (!s.isAdmin) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, maxWidth: 420, width: '100%', alignSelf: 'center' }}>
          <BrandBar />
          <View style={{ height: 14 }} />
          <Title>{t.adminLogin}</Title>
          <Card>
            <Field label={s.live ? 'Email' : 'Your name (so changes show who made them)'} value={who} autoCapitalize="none" keyboardType={s.live ? 'email-address' : 'default'} onChangeText={(v) => { setWho(v); setBad(false); s.clearError(); }} />
            <Field label={s.live ? 'Password' : t.pin} value={pin} secureTextEntry keyboardType={s.live ? 'default' : 'number-pad'} onChangeText={(v) => { setPin(v); setBad(false); s.clearError(); }} />
            <Button
              label={joining ? 'Create my login' : t.login}
              onPress={async () => {
                if (joining && !(await s.signUp(who, pin))) return setBad(true);
                setBad(!(await s.login(who, pin)));
              }}
            />
            {s.live && (
              <View style={{ marginTop: 12 }}>
                <Chip small label={joining ? 'I already have a login' : 'I was invited. Create my login'} on={joining} onPress={() => { setJoining(!joining); s.clearError(); setBad(false); }} />
                {joining && <P size={12}>Use the same email the coordinator invited, and choose a password (at least 6 characters).</P>}
              </View>
            )}
            {bad && <View style={{ marginTop: 10 }}><P>{s.error || (s.live ? 'Email or password is wrong.' : 'Enter your name and the right PIN.')}</P></View>}
            {!bad && s.error ? <View style={{ marginTop: 10 }}><P>{s.error}</P></View> : null}
            {!s.live && <View style={{ marginTop: 10 }}><P size={12}>Demo PIN: 1225. Connect Supabase to give each person their own login.</P></View>}
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  const printSheet = (date: string) => {
    if (Platform.OS !== 'web') return;
    const day = s.plan?.days.find((d) => d.date === date);
    if (!day) return;
    const rows = day.houseIds.map((id, i) => {
      const h = s.houses.find((x) => x.id === id)!;
      const extra = [h.blessing ? 'House blessing' : '', h.prayer ? 'Prayer: ' + h.prayer : '', h.notes].filter(Boolean).join('<br>');
      return `<tr><td>${i + 1}</td><td>${h.name}${h.priority ? ' (elderly or unwell)' : ''}</td><td>${h.address}<br><small>${h.landmark}</small></td><td>${h.phone}</td><td>${extra}</td><td>[ ] in &nbsp; [ ] out</td></tr>`;
    }).join('');
    const w = window.open('', '_blank');
    if (w) w.document.write(`<html><body style="font-family:sans-serif"><h2>${group}: ${dayLabel(date)}, ${day.area}</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>#</th><th>Family</th><th>Address</th><th>Phone</th><th>Blessing, prayer, notes</th><th>Check</th></tr>${rows}</table><script>window.print()</script></body></html>`);
  };

  const inviteText = () => {
    const link = Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/enroll` : 'the parish carols link';
    return `Christmas carols are coming, with Victorians Youth! Tell us where to visit and which carols or prayers you would love. It takes one minute: ${link}\n\nகிறிஸ்துமஸ் கரோல் வருகிறது! உங்கள் வீட்டு முகவரியைப் பதிவு செய்யுங்கள்: ${link}`;
  };

  const leaderMessage = (date: string) => {
    const day = s.plan?.days.find((d) => d.date === date);
    if (!day) return '';
    const l = leaderOf(day.area);
    const list = day.houseIds.map((id, i) => {
      const h = s.houses.find((x) => x.id === id)!;
      return `${i + 1}. ${h.name}, ${h.address}${h.blessing ? ' (blessing)' : ''}`;
    }).join('\n');
    return `Hello ${l?.leader || ''}, the ${group} carols visit ${day.area} on ${dayLabel(date)} evening (${day.houseIds.length} houses):\n${list}`;
  };

  const act = (label: string, date: string, id: string, to: VisitStatus, action: string, on: boolean) => <Chip key={label} small label={label} on={on} onPress={() => s.setStatus(date, id, to, action)} />;

  const rowsToImport = () =>
    importText
      .split(/\r?\n/)
      .map((l) => l.split(/[,\t]/).map((x) => x.trim()))
      .filter((c) => c.length >= 3 && c[0])
      .map((c) => ({ name: c[0], phone: c[1] || '', address: c[2] || '', area: s.areas.find((a) => a.toLowerCase() === (c[3] || '').toLowerCase()) || '' }));

  const days = s.plan?.days || [];
  const today = new Date().toISOString().slice(0, 10);

  const visitList = (date: string, ids: string[]) =>
    ids.map((id, i) => {
      const h = s.houses.find((x) => x.id === id);
      if (!h) return null;
      const st = s.status[`${date}|${id}`] || 'planned';
      const last = s.lastChange(date, id);
      return (
        <View key={id} style={{ marginTop: 10, borderTopWidth: 1, borderColor: colors.cardBorder, paddingTop: 8 }}>
          <P soft={false}>{i + 1}. {h.name} · {h.address}  [{STATUS_LABEL[st]}]</P>
          {h.blessing ? <P size={12}>Would like a house blessing</P> : null}
          {h.prayer ? <P size={12}>Prayer: {h.prayer}</P> : null}
          {last && <P size={12}>Last: {last.action} by {last.who}, {stamp(last.at)}</P>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {h.phone ? <Chip small label={t.send} on={st === 'told'} onPress={() => { s.setStatus(date, id, 'told', 'told by WhatsApp'); wa(h.phone, messageFor(h, date, group)); }} /> : null}
            {act('Check in', date, id, 'arrived', 'check-in', st === 'arrived')}
            {act('Finished', date, id, 'done', 'check-out', st === 'done')}
            {act('Not available', date, id, 'missed', 'missed', st === 'missed')}
            {st !== 'planned' && act('Undo', date, id, 'planned', 'undo', false)}
          </View>
        </View>
      );
    });

  const tabItems = [['today', 'Today'], ['families', 'Families'], ['plan', 'Plan'], ['map', 'Map'], ['more', 'More']] as const;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <BackLink />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemePicker />
            <View style={{ width: 8 }} />
            <LangToggle />
          </View>
        </View>
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ marginRight: 14, marginTop: 4 }}><BrandMark size={44} /></View>
          <View style={{ flex: 1 }}><Title sub={`Victorians Youth · signed in as ${s.actor}`}>{t.admin}</Title></View>
        </View>
        {s.error ? <View style={{ marginBottom: 10 }}><P>{s.error}</P></View> : null}
        <Tabs value={tab} onChange={setTab} items={tabItems} />

        <Swap k={tab}>
          {/* ---------------------------------------------------------------- TODAY */}
          {tab === 'today' && (() => {
            const total = days.reduce((n, d) => n + d.houseIds.length, 0);
            const done = Object.values(s.status).filter((v) => v === 'done').length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const next = days.find((d) => d.date >= today) || days[0];
            const nextDone = next ? next.houseIds.filter((id) => s.status[`${next.date}|${id}`] === 'done').length : 0;
            const noPin = s.houses.filter((h) => h.lat == null).length;
            const noArea = s.houses.filter((h) => !h.area).length;
            const steps: [boolean, string, string, () => void][] = [
              [s.anbiyams.some((a) => a.leader), 'Add each anbiyam leader', 'More', () => setTab('more')],
              [s.houses.length > 0, 'Bring in families', 'Families', () => setTab('families')],
              [Object.keys(s.dayAreas).length > 0, 'Choose an anbiyam for each evening', 'Plan', () => setTab('plan')],
              [s.published, 'Publish the plan to families', 'Plan', () => setTab('plan')],
            ];
            const finished = steps.every((x) => x[0]);
            return (
              <>
                {!finished && (
                  <Card>
                    <H size={20}>Getting ready</H>
                    <View style={{ height: 6 }} />
                    {steps.map(([ok, label, go, fn], i) => (
                      <Pressable key={label} onPress={fn} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: colors.cardBorder }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? colors.ok : colors.fill }}>
                          <Text style={{ color: ok ? '#fff' : colors.textSoft, fontFamily: fonts.bodyBold, fontSize: 13 }}>{ok ? '✓' : String(i + 1)}</Text>
                        </View>
                        <Text style={{ flex: 1, color: colors.text, fontFamily: ok ? fonts.body : fonts.bodyMedium, fontSize: 16, opacity: ok ? 0.55 : 1 }}>{label}</Text>
                        {!ok && <Text style={{ color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14 }}>{go} ›</Text>}
                      </Pressable>
                    ))}
                  </Card>
                )}

                {total > 0 && (
                  <Card style={{ marginTop: finished ? 0 : 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <CountUp to={done} style={{ color: colors.text, fontSize: 34, fontFamily: fonts.display, letterSpacing: -1 }} />
                      <Text style={{ color: colors.textSoft, fontFamily: fonts.bodyMedium, fontSize: 15, marginLeft: 8 }}>of {total} houses finished</Text>
                    </View>
                    <View style={{ height: 10 }} />
                    <ProgressBar pct={pct} />
                  </Card>
                )}

                {next && (
                  <>
                    <Section>{next.date === today ? 'Tonight' : 'Next evening'}</Section>
                    <Card>
                      <H size={22}>{dayLabel(next.date)} · {next.area}</H>
                      <P>{next.houseIds.length} houses · {nextDone} done{leaderOf(next.area)?.leader ? ` · led by ${leaderOf(next.area)!.leader}` : ''}</P>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                        <Chip label="Open map" on={false} onPress={() => { setMapDate(next.date); setTab('map'); }} />
                        <Chip label="Visit list" on={false} onPress={() => { setOpenDay(next.date); setTab('plan'); }} />
                        {leaderOf(next.area)?.phone ? <Chip label="Message leader" on={false} onPress={() => wa(leaderOf(next.area)!.phone, leaderMessage(next.date))} /> : null}
                      </View>
                    </Card>
                  </>
                )}

                {(noPin > 0 || noArea > 0 || expected.away.length > 0) && (
                  <>
                    <Section>Needs attention</Section>
                    <Card>
                      {noArea > 0 && <P>{noArea} families have no anbiyam yet. Set it in Families.</P>}
                      {noPin > 0 && <P>{noPin} families have no pin, so they are missing from the map.</P>}
                      {expected.away.length > 0 && <P>{expected.away.length} families are away on their anbiyam's evening. See Plan.</P>}
                    </Card>
                  </>
                )}

                <Section>Add families</Section>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Chip label="Share sign-up link" on={false} onPress={() => wa('', inviteText())} />
                  <Chip label="Add a family" on={false} onPress={() => { setAdding(true); setTab('families'); }} />
                  <Chip label="Import a list" on={false} onPress={() => { setImporting(true); setTab('families'); }} />
                </View>
              </>
            );
          })()}

          {/* ------------------------------------------------------------- FAMILIES */}
          {tab === 'families' && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                <Chip label={adding ? 'Close' : 'Add a family'} on={adding} onPress={() => setAdding(!adding)} />
                <Chip label={importing ? 'Close import' : 'Import a list'} on={importing} onPress={() => { setImporting(!importing); setImported(null); }} />
                <Chip label="Share sign-up link" on={false} onPress={() => wa('', inviteText())} />
              </View>
              {adding && (
                <View style={{ marginBottom: 12 }}>
                  <P size={13}>For families who did not sign up. Only the name and address are needed. A phone number is optional.</P>
                  <View style={{ height: 8 }} />
                  <EnrolForm via="captain" staff />
                </View>
              )}
              {importing && (
                <Card style={{ marginBottom: 12 }}>
                  <H size={18}>Import a list</H>
                  <View style={{ height: 6 }} />
                  <P size={13}>Paste one family per line: name, phone, address, anbiyam. Copy it straight from a spreadsheet.</P>
                  <View style={{ height: 10 }} />
                  <Field label="Family list" value={importText} multiline onChangeText={(v) => { setImportText(v); setImported(null); }} style={{ minHeight: 110 }} />
                  <P size={13}>{rowsToImport().length} families found</P>
                  <View style={{ height: 10 }} />
                  <Button label="Import" disabled={!rowsToImport().length} onPress={async () => { setImported(await s.importFamilies(rowsToImport())); setImportText(''); }} />
                  {imported != null && <View style={{ marginTop: 8 }}><P>{imported} families added.</P></View>}
                </Card>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                <Chip small label={`All ${s.houses.length}`} on={filter === 'all'} onPress={() => setFilter('all')} />
                {s.areas.map((a) => (<Chip key={a} small label={`${a} ${countBy[a] || 0}`} on={filter === a} onPress={() => setFilter(a)} />))}
                {(countBy[''] || 0) > 0 && <Chip small label={`No anbiyam ${countBy['']}`} on={filter === 'none'} onPress={() => setFilter('none')} />}
              </View>
              {filtered.length === 0 && (
                <Card>
                  <P>{s.houses.length ? 'No families in this anbiyam yet.' : s.live ? 'No families yet. They appear here as they sign up.' : 'No families yet. Load demo families to try it out.'}</P>
                  {!s.live && !s.houses.length && <><View style={{ height: 10 }} /><Button label="Load demo families" onPress={s.loadDemo} /></>}
                </Card>
              )}
              {filtered.map((h) => {
                const open = openHouse === h.id;
                const picked = h.songIds.map((id) => s.songs.find((x) => x.id === id)?.title).filter(Boolean).concat(h.customSongs);
                return (
                  <Card key={h.id} style={{ marginBottom: 8, padding: 14 }}>
                    <Pressable onPress={() => setOpenHouse(open ? null : h.id)}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <P soft={false} size={16}>{h.name}{h.priority ? '  ★' : ''}</P>
                        <P size={12}>{h.area || 'No anbiyam'}  {open ? '▴' : '▾'}</P>
                      </View>
                      <P size={13}>{h.address}</P>
                      <P size={12}>{[h.lat != null ? 'Pin ✓' : 'No pin', h.blessing ? 'Blessing' : '', (h.away || []).length ? `Away ${(h.away || []).length} evening${(h.away || []).length > 1 ? 's' : ''}` : '', h.via !== 'app' ? `added by ${h.via}` : ''].filter(Boolean).join(' · ')}</P>
                    </Pressable>
                    {open && (
                      <View style={{ marginTop: 8 }}>
                        {h.phone ? <P size={13}>{h.phone}</P> : <P size={13}>No phone number</P>}
                        {h.landmark ? <P size={13}>Gate: {h.landmark}</P> : null}
                        {picked.length > 0 && <P size={13}>Carols: {picked.join(', ')}</P>}
                        {h.prayer ? <P size={13}>Prayer: {h.prayer}</P> : null}
                        {(h.away || []).length > 0 && <P size={13}>Away: {(h.away || []).map(dayLabel).join(', ')}</P>}
                        <View style={{ height: 6 }} />
                        <P size={12}>Anbiyam</P>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {s.areas.map((a) => (<Chip key={a} small label={a} on={h.area === a} onPress={() => s.setHouseArea(h.id, h.area === a ? '' : a)} />))}
                        </View>
                      </View>
                    )}
                  </Card>
                );
              })}
            </>
          )}

          {/* ----------------------------------------------------------------- PLAN */}
          {tab === 'plan' && (
            <>
              <Card>
                <H size={20}>One anbiyam each evening</H>
                <View style={{ height: 6 }} />
                <P>Pick the anbiyam for each evening. Visit lists build themselves. Families see nothing until you publish.</P>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
                  <Chip label="Suggest evenings" on={false} onPress={s.autoAssign} />
                  <Chip label={s.published ? 'Published to families' : 'Draft, not published'} on={s.published} onPress={() => s.publish(!s.published)} />
                </View>
              </Card>
              {expected.away.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Card>
                    <H size={16}>Away on their anbiyam's evening</H>
                    {expected.away.map((a) => (<P key={a.houseId + a.date} size={13}>{s.houses.find((h) => h.id === a.houseId)?.name} · {dayLabel(a.date)}</P>))}
                    <P size={12}>Give their anbiyam another evening, or visit them on their own.</P>
                  </Card>
                </View>
              )}
              <View style={{ height: 12 }} />
              {s.dates.map((date) => {
                const d = days.find((x) => x.date === date);
                const a = s.dayAreas[date] || '';
                const l = leaderOf(a);
                const open = openDay === date && !!d;
                return (
                  <Card key={date} style={{ marginBottom: 10, padding: 14 }}>
                    <Pressable onPress={() => setOpenDay(open ? null : d ? date : null)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <H size={17}>{dayLabel(date)}</H>
                      <P size={13}>{a || 'Rest day'}{d ? ` · ${d.houseIds.length} houses  ${open ? '▴' : '▾'}` : ''}</P>
                    </Pressable>
                    {a && l?.leader ? <P size={12}>Led by {l.leader}</P> : null}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {s.areas.map((ar) => (<Chip key={ar} small label={`${ar} · ${countBy[ar] || 0}`} on={a === ar} onPress={() => s.setDayArea(date, a === ar ? '' : ar)} />))}
                    </ScrollView>
                    {open && d && (
                      <View style={{ marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                          {l?.phone ? <Chip small label="Message leader" on={false} onPress={() => wa(l.phone, leaderMessage(date))} /> : null}
                          {Platform.OS === 'web' && <Chip small label="Print sheet" on={false} onPress={() => printSheet(date)} />}
                          <Chip small label={addDay === date ? 'Close' : 'Add a house on the spot'} on={addDay === date} onPress={() => setAddDay(addDay === date ? null : date)} />
                        </View>
                        {addDay === date && (
                          <View style={{ marginTop: 10 }}>
                            <EnrolForm via="captain" staff defaultArea={a} />
                          </View>
                        )}
                        {visitList(date, d.houseIds)}
                      </View>
                    )}
                  </Card>
                );
              })}
            </>
          )}

          {/* ------------------------------------------------------------------ MAP */}
          {tab === 'map' && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <Chip small label="All houses" on={mapDate === 'all'} onPress={() => setMapDate('all')} />
                {days.map((d) => (<Chip key={d.date} small label={`${dayLabel(d.date)} · ${d.area}`} on={mapDate === d.date} onPress={() => setMapDate(d.date)} />))}
              </ScrollView>
              <HouseMap center={s.mapCenter} houses={mapHouses} selectedId={sel} route={route} height={380} onSelect={setSel} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {([
                  ['all', 'All', colors.textSoft, inDay.length],
                  ['pending', 'Pending', STATUS_COLORS.planned, tally((x) => x === 'planned' || x === 'told')],
                  ['arrived', 'Singing now', STATUS_COLORS.arrived, tally((x) => x === 'arrived')],
                  ['done', 'Finished', STATUS_COLORS.done, tally((x) => x === 'done')],
                  ['na', 'Not available', STATUS_COLORS.missed, tally((x) => x === 'missed')],
                ] as const).map(([k, label, dot, n]) => (
                  <Pressable key={k} onPress={() => setMapFilter(k)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, marginRight: 8, backgroundColor: mapFilter === k ? colors.text : colors.fill }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot, marginRight: 7 }} />
                    <Text style={{ color: mapFilter === k ? colors.skyTop : colors.text, fontFamily: fonts.bodyBold, fontSize: 13 }}>{label} {n}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              {!s.live && s.houses.length === 0 && <View style={{ marginTop: 10 }}><Button label="Load demo families" onPress={s.loadDemo} /></View>}
              {selHouse && (
                <Card style={{ marginTop: 12 }}>
                  <H size={20}>{selHouse.name}{selHouse.priority ? '  ★' : ''}</H>
                  <P>{selHouse.address}{selHouse.area ? `, ${selHouse.area}` : ''}</P>
                  {selHouse.landmark ? <P size={13}>Gate: {selHouse.landmark}</P> : null}
                  {selHouse.blessing ? <P size={13}>Would like a house blessing</P> : null}
                  {selHouse.prayer ? <P size={13}>Prayer: {selHouse.prayer}</P> : null}
                  <View style={{ height: 8 }} />
                  {selDay ? (
                    <>
                      <P soft={false}>{dayLabel(selDay.date)} · {STATUS_LABEL[selStatus]}</P>
                      {selLast && <P size={12}>Last change: {selLast.action} by {selLast.who}, {stamp(selLast.at)}</P>}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                        {act('Check in', selDay.date, selHouse.id, 'arrived', 'check-in', selStatus === 'arrived')}
                        {act('Finished', selDay.date, selHouse.id, 'done', 'check-out', selStatus === 'done')}
                        {act('Not available', selDay.date, selHouse.id, 'missed', 'missed', selStatus === 'missed')}
                        {selStatus !== 'planned' && act('Undo', selDay.date, selHouse.id, 'planned', 'undo', false)}
                      </View>
                    </>
                  ) : (
                    <P>Not on an evening yet. Choose their anbiyam's evening in Plan.</P>
                  )}
                  <View style={{ height: 8 }} />
                  <Chip small label="Open in Google Maps" on={false} onPress={() => selHouse.lat != null && Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selHouse.lat},${selHouse.lng}`)} />
                </Card>
              )}
            </>
          )}

          {/* ----------------------------------------------------------------- MORE */}
          {tab === 'more' && (
            <>
              <Section>Anbiyams and leaders</Section>
              {s.anbiyams.map((a) => (
                <AnbiyamEditor
                  key={a.name}
                  a={a}
                  count={countBy[a.name] || 0}
                  onSave={(n, l, p) => s.saveAnbiyam({ oldName: a.name, name: n, leader: l, phone: p })}
                  onRemove={() => s.removeAnbiyam(a.name)}
                />
              ))}
              <Card>
                <Field label="Add an anbiyam" value={newName} onChangeText={setNewName} />
                <Button label="Add" tone="ghost" disabled={!newName.trim()} onPress={() => { s.saveAnbiyam({ name: newName, leader: '', phone: '' }); setNewName(''); }} />
              </Card>

              <Section>Messages</Section>
              <Card>
                <Field label="Group name used in messages" value={group} onChangeText={setGroup} />
              </Card>

              <Section>Carols</Section>
              <Card>
                <H size={16}>Most asked for</H>
                {asks.length === 0 ? <P size={13}>No requests yet.</P> : asks.slice(0, 6).map((a) => (<P key={a.title} soft={false} size={14}>{a.title}: {a.n}</P>))}
                {customAsks.length > 0 && (<><View style={{ height: 8 }} /><H size={16}>Not on the list</H>{customAsks.slice(0, 8).map((c) => (<P key={c} size={13}>{c}</P>))}</>)}
                <View style={{ height: 12 }} />
                <Field label="Add a carol to the list" value={song} onChangeText={setSong} />
                <Field label="Lyrics (optional, families can read them)" value={lyr} multiline onChangeText={setLyr} style={{ minHeight: 100 }} />
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, marginRight: 8 }}><Button label="Add (English)" tone="ghost" onPress={() => { if (song.trim()) { s.addSong(song.trim(), 'en', lyr.trim()); setSong(''); setLyr(''); } }} /></View>
                  <View style={{ flex: 1 }}><Button label="Add (Tamil)" tone="ghost" onPress={() => { if (song.trim()) { s.addSong(song.trim(), 'ta', lyr.trim()); setSong(''); setLyr(''); } }} /></View>
                </View>
              </Card>

              <Section>Team</Section>
              {!s.live && <Card><P size={13}>Team logins need the live database.</P></Card>}
              {s.live && (
                <>
                  {s.team.map((m) => (
                    <Card key={m.userId} style={{ marginBottom: 8, padding: 12 }}>
                      <P soft={false} size={16}>{m.name}{m.name === s.actor ? ' (you)' : ''}</P>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                        {(['priest', 'coordinator', 'captain'] as Role[]).map((r) => (
                          <Chip key={r} small label={r} on={m.role === r} onPress={() => s.canManage && m.role !== r && s.setMemberRole(m.userId, r)} />
                        ))}
                        {s.canManage && m.name !== s.actor && <Chip small label="Remove" on={false} onPress={() => s.removeMember(m.userId)} />}
                      </View>
                    </Card>
                  ))}
                  {s.invites.map((i) => (
                    <Card key={i.email} style={{ marginBottom: 8, padding: 12 }}>
                      <P soft={false}>{i.name} · {i.role} · waiting to join</P>
                      <P size={13}>{i.email}</P>
                      {s.canManage && <View style={{ flexDirection: 'row', marginTop: 6 }}><Chip small label="Cancel invite" on={false} onPress={() => s.removeInvite(i.email)} /></View>}
                    </Card>
                  ))}
                  {s.canManage ? (
                    <Card>
                      <H size={16}>Invite someone</H>
                      <View style={{ height: 8 }} />
                      <Field label="Their name" value={invName} onChangeText={setInvName} />
                      <Field label="Their email" value={invEmail} autoCapitalize="none" keyboardType="email-address" onChangeText={setInvEmail} />
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                        {(['priest', 'coordinator', 'captain'] as Role[]).map((r) => (<Chip key={r} small label={r} on={invRole === r} onPress={() => setInvRole(r)} />))}
                      </View>
                      <Button label="Send invite" disabled={invName.trim().length < 2 || !invEmail.includes('@')} onPress={async () => { await s.invite(invEmail, invName, invRole); setInvEmail(''); setInvName(''); }} />
                      <View style={{ marginTop: 10 }}>
                        <P size={12}>They open this app, choose Parish team, tap "I was invited" and sign up with that email. Give each anbiyam leader a captain login so they can check houses in and out.</P>
                      </View>
                    </Card>
                  ) : (
                    <P size={13}>Only a priest or coordinator can invite or remove people.</P>
                  )}
                </>
              )}

              <Section>Activity</Section>
              {s.audit.length === 0 && <P size={13}>Nothing yet.</P>}
              {s.audit.slice(0, showLog ? 100 : 6).map((a) => (
                <View key={a.id} style={{ marginBottom: 8 }}>
                  <P soft={false} size={14}>{a.houseName}: {a.action}{a.from && a.to ? ` (${a.from} to ${a.to})` : ''}</P>
                  <P size={12}>{a.who} · {stamp(a.at)}</P>
                </View>
              ))}
              {s.audit.length > 6 && <Chip small label={showLog ? 'Show less' : 'Show all'} on={false} onPress={() => setShowLog(!showLog)} />}

              <View style={{ height: 24 }} />
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 10 }}><Button label="Log out" tone="ghost" onPress={s.logout} /></View>
                {!s.live && <View style={{ flex: 1 }}><Button label="Reset demo data" tone="ghost" onPress={s.resetAll} /></View>}
              </View>
            </>
          )}
        </Swap>
      </ScrollView>
    </Screen>
  );
}
