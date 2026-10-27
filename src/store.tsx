import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SONGS, Song } from './data/songs';
import { live, supabase } from './supabase';
import { PlanResult, Slot, adventStart, datesBetween } from './planner';
import { autoAssignAreas, visitsFromAreas } from './areaPlan';

// Demo store: everything lives in this device (localStorage on the web). The real version swaps this file's
// functions for Supabase calls (see supabase/schema.sql). Screens only talk to the hook below.

export type Household = {
  id: string;
  name: string;
  phone: string;
  lang: 'en' | 'ta';
  adults: number;
  kids: number;
  address: string;
  area: string;
  landmark: string;
  notes: string;
  prayer: string;
  blessing: boolean; // would like the priest to bless the home
  away: string[]; // evenings the family is away
  priority: boolean;
  free: Record<string, Slot>;
  songIds: string[];
  customSongs: string[];
  code: string;
  lat?: number;
  lng?: number;
  via: 'app' | 'phone' | 'paper' | 'captain';
  createdAt: string;
};

export type VisitStatus = 'planned' | 'told' | 'arrived' | 'done' | 'missed';

// Who changed what, and when. Every status change and every pin change is written here.
export type AuditEntry = { id: string; at: string; who: string; houseId: string; houseName: string; date: string; action: string; from: string; to: string };

type State = {
  year: number;
  start: string;
  end: string;
  maxPerEvening: number;
  areas: string[];
  songs: Song[];
  houses: Household[];
  plan: PlanResult | null;
  status: Record<string, VisitStatus>; // `${date}|${houseId}`
  audit: AuditEntry[];
  mapCenter: [number, number];
  anbiyams: Anbiyam[]; // names plus the leader of each
  dayAreas: Record<string, string>; // evening -> area, decided by the team
  published: boolean; // families only see their day once this is on
  actor: string;
  isAdmin: boolean;
  error: string;
  ready: boolean;
  role: Role | '';
  team: TeamMember[];
  invites: Invite[];
};

const YEAR = 2026;
const initial: State = {
  year: YEAR,
  start: adventStart(YEAR),
  end: `${YEAR}-12-24`,
  maxPerEvening: 12,
  areas: ['Anbiyam 1', 'Anbiyam 2', 'Anbiyam 3', 'Anbiyam 4', 'Anbiyam 5', 'Anbiyam 6', 'Anbiyam 7', 'Anbiyam 8'],
  songs: SONGS,
  houses: [],
  plan: null,
  status: {},
  audit: [],
  mapCenter: [13.0735, 80.223], // near Aminjikarai, Chennai. Change it in the Map tab.
  actor: '',
  isAdmin: false,
  anbiyams: [],
  dayAreas: {},
  published: false,
  error: '',
  ready: !live,
  role: '',
  team: [],
  invites: [],
};

const KEY = 'carols-demo-v1';
function load(): State {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const extra = (saved.songs || []).filter((x: Song) => !SONGS.some((b) => b.id === x.id));
        const houses = (saved.houses || []).map((h: any) => ({ prayer: '', blessing: false, away: [], ...h }));
        return { ...initial, ...saved, houses, anbiyams: [], songs: [...SONGS, ...extra], isAdmin: false, actor: '', error: '', ready: true };
      }
    }
  } catch {}
  return initial;
}

const rid = () => Math.random().toString(36).slice(2, 10);
const makeCode = () => String(Math.floor(1000 + Math.random() * 9000));
export const cleanPhone = (p: string) => p.replace(/[^0-9]/g, '').slice(-10);

export type EnrolInput = Omit<Household, 'id' | 'code' | 'createdAt'>;

export type Anbiyam = { name: string; leader: string; phone: string };
export type Role = 'priest' | 'coordinator' | 'captain';
export type TeamMember = { userId: string; name: string; role: Role };
export type Invite = { email: string; name: string; role: Role };

export type Lookup = { id: string; name: string; address: string; area: string; visit?: { date: string; status: VisitStatus } };

type Store = State & {
  live: boolean;
  dates: string[];
  enrol: (h: EnrolInput) => Promise<Household>;
  lookup: (phone: string, code: string) => Promise<Lookup | undefined>;
  login: (id: string, secret: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  saveAnbiyam: (a: { oldName?: string; name: string; leader: string; phone: string }) => Promise<void>;
  removeAnbiyam: (name: string) => Promise<void>;
  importFamilies: (rows: { name: string; phone: string; address: string; area: string }[]) => Promise<number>;
  setDayArea: (date: string, area: string) => void;
  autoAssign: () => Promise<void>;
  publish: (on: boolean) => void;
  setHouseArea: (houseId: string, area: string) => void;
  signUp: (email: string, password: string) => Promise<boolean>;
  invite: (email: string, name: string, role: Role) => Promise<void>;
  removeInvite: (email: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  setMemberRole: (userId: string, role: Role) => Promise<void>;
  canManage: boolean;
  generate: () => Promise<void> | void;
  setStatus: (date: string, houseId: string, s: VisitStatus, action?: string) => void;
  setPin: (houseId: string, lat: number, lng: number) => void;
  setMapCenter: (c: [number, number]) => void;
  lastChange: (date: string, houseId: string) => AuditEntry | undefined;
  addSong: (title: string, lang: 'en' | 'ta', lyrics?: string) => void;
  setAreas: (a: string[]) => void;
  loadDemo: () => void;
  resetAll: () => void;
  nextVisit: (houseId: string) => { date: string; area: string; status: VisitStatus } | undefined;
};

const Ctx = createContext<Store | null>(null);

const fail = (e: any) => (e?.message ? String(e.message) : 'Something went wrong');

const rowToHouse = (r: any): Household => ({
  id: r.id, name: r.name, phone: r.phone, lang: r.lang, adults: r.adults, kids: r.kids, address: r.address, area: r.area || '',
  landmark: r.landmark || '', notes: r.notes || '', prayer: r.prayer || '', blessing: !!r.blessing, away: (r.away_dates || []).map((d: string) => String(d).slice(0, 10)), priority: !!r.priority, free: r.free || {}, songIds: r.song_ids || [], customSongs: r.custom_songs || [],
  code: r.edit_code || '', lat: r.lat ?? undefined, lng: r.lng ?? undefined, via: r.created_via || 'app', createdAt: r.created_at,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const err = useCallback((e: any) => setS((p) => ({ ...p, error: fail(e) })), []);

  // ---- demo mode: everything stays in this browser
  useEffect(() => {
    if (!live) setS(load());
  }, []);
  useEffect(() => {
    if (live) return;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify({ ...s, isAdmin: false, actor: '', error: '' }));
    } catch {}
  }, [s]);

  // ---- live mode: Supabase
  const loadPublic = useCallback(async () => {
    const [se, so] = await Promise.all([
      supabase.from('seasons').select('*').order('year', { ascending: false }).limit(1),
      supabase.from('songs').select('*').order('title'),
    ]);
    const season: any = se.data?.[0];
    const extra: Song[] = ((so.data as any[]) || []).map((r) => ({ id: r.id, title: r.title, lang: r.lang, kind: 'classic' as const, lyrics: r.lyrics || '' }));
    setS((p) => ({
      ...p,
      ready: true,
      year: season?.year ?? p.year,
      start: season?.advent_start ?? p.start,
      end: season ? `${season.year}-12-24` : p.end,
      maxPerEvening: season?.max_per_evening ?? p.maxPerEvening,
      published: season?.published ?? p.published,
      areas: season?.areas?.length ? season.areas : p.areas,
      anbiyams: (season?.areas?.length ? season.areas : p.areas).map((n: string) => p.anbiyams.find((x) => x.name === n) || { name: n, leader: '', phone: '' }),
      mapCenter: season?.map_lat != null ? [season.map_lat, season.map_lng] : p.mapCenter,
      songs: [...SONGS, ...extra],
    }));
  }, []);

  const loadAdmin = useCallback(async () => {
    const [hs, vs, ev, tm, iv, da, al] = await Promise.all([
      supabase.from('households').select('*').order('created_at'),
      supabase.from('visits').select('*').order('day').order('position'),
      supabase.from('visit_events').select('*, households(name)').order('at', { ascending: false }).limit(300),
      supabase.from('admins').select('*').order('display_name'),
      supabase.from('admin_invites').select('*').order('created_at'),
      supabase.from('day_areas').select('*'),
      supabase.from('anbiyam_leaders').select('*'),
    ]);
    const bad = hs.error || vs.error || ev.error;
    if (bad) return err(bad);
    const houses = ((hs.data as any[]) || []).map(rowToHouse);
    const byId = new Map(houses.map((h) => [h.id, h]));
    const status: Record<string, VisitStatus> = {};
    const days = new Map<string, string[]>();
    ((vs.data as any[]) || []).forEach((v) => {
      status[`${v.day}|${v.household_id}`] = v.status;
      days.set(v.day, [...(days.get(v.day) || []), v.household_id]);
    });
    const dayAreas: Record<string, string> = {};
    ((da.data as any[]) || []).forEach((r) => (dayAreas[r.day] = r.area));
    const plan: PlanResult | null = days.size
      ? { days: [...days.entries()].map(([date, houseIds]) => ({ date, houseIds, area: dayAreas[date] || byId.get(houseIds[0])?.area || '' })), unplaced: [] }
      : null;
    const audit: AuditEntry[] = ((ev.data as any[]) || []).map((e) => ({
      id: String(e.id), at: e.at, who: e.actor_name, houseId: e.household_id, houseName: e.households?.name || byId.get(e.household_id)?.name || '', date: e.day || '', action: e.action, from: e.from_status || '', to: e.to_status || '',
    }));
    const team: TeamMember[] = ((tm.data as any[]) || []).map((r) => ({ userId: r.user_id, name: r.display_name, role: r.role }));
    const invites: Invite[] = ((iv.data as any[]) || []).map((r) => ({ email: r.email, name: r.display_name, role: r.role }));
    const leaders: Record<string, { leader: string; phone: string }> = {};
    ((al.data as any[]) || []).forEach((r) => (leaders[r.name] = { leader: r.leader, phone: r.phone }));
    setS((p) => ({ ...p, houses, status, plan, audit, team, invites, dayAreas, anbiyams: p.areas.map((n) => ({ name: n, leader: leaders[n]?.leader || '', phone: leaders[n]?.phone || '' })) }));
  }, [err]);

  const applySession = useCallback(
    async (uid?: string) => {
      if (!uid) return setS((p) => ({ ...p, isAdmin: false, actor: '', role: '', houses: [], plan: null, status: {}, audit: [], team: [], invites: [] }));
      let { data } = await supabase.from('admins').select('display_name, role').eq('user_id', uid).maybeSingle();
      if (!data) {
        const claimed = await supabase.rpc('claim_invite');
        if (claimed.data === true) ({ data } = await supabase.from('admins').select('display_name, role').eq('user_id', uid).maybeSingle());
      }
      if (!data) return setS((p) => ({ ...p, isAdmin: false, actor: '', error: 'This login has not been invited yet. Ask the coordinator to invite your email.' }));
      setS((p) => ({ ...p, isAdmin: true, actor: (data as any).display_name, role: (data as any).role, error: '' }));
      await loadAdmin();
    },
    [loadAdmin],
  );

  useEffect(() => {
    if (!live) return;
    loadPublic().catch(err);
    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => applySession(session?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadPublic, applySession, err]);

  // other volunteers' check-ins show up within a few seconds
  useEffect(() => {
    if (!live || !s.isAdmin) return;
    const t = setInterval(() => loadAdmin(), 15000);
    return () => clearInterval(t);
  }, [s.isAdmin, loadAdmin]);

  const dates = useMemo(() => datesBetween(s.start, s.end), [s.start, s.end]);

  const enrol = useCallback(
    async (h: EnrolInput): Promise<Household> => {
      if (live && s.isAdmin && cleanPhone(h.phone).length < 10) {
        const code = makeCode();
        const { data, error } = await supabase
          .from('households')
          .insert({
            season: s.year, name: h.name, phone: cleanPhone(h.phone), lang: h.lang, adults: h.adults, kids: h.kids, address: h.address, area: h.area, landmark: h.landmark, notes: h.notes,
            prayer: h.prayer, priority: h.priority, blessing: h.blessing, away_dates: h.away, lat: h.lat, lng: h.lng, free: {}, song_ids: h.songIds, custom_songs: h.customSongs,
            edit_code: code, consent: true, created_via: h.via,
          } as any)
          .select('id')
          .single();
        if (error) throw error;
        loadAdmin();
        return { ...h, phone: cleanPhone(h.phone), id: (data as any).id, code, createdAt: new Date().toISOString() };
      }
      if (live) {
        const { data, error } = await supabase.rpc('enrol_household', { p: h as any });
        if (error) throw error;
        const r: any = data;
        const house: Household = { ...h, phone: r.phone, id: r.id, code: r.code, createdAt: new Date().toISOString() };
        if (s.isAdmin) loadAdmin();
        return house;
      }
      const house: Household = { ...h, phone: cleanPhone(h.phone), id: rid(), code: makeCode(), createdAt: new Date().toISOString() };
      setS((p) => ({ ...p, houses: [...p.houses, house] }));
      return house;
    },
    [s.isAdmin, s.year, loadAdmin],
  );

  const lookup = useCallback(
    async (phone: string, code: string): Promise<Lookup | undefined> => {
      if (live) {
        const { data, error } = await supabase.rpc('lookup_household', { p_phone: phone, p_code: code });
        if (error) throw error;
        const r: any = data;
        return r ? { id: r.id, name: r.name, address: r.address, area: r.area, visit: r.visit ? { date: r.visit.date, status: r.visit.status } : undefined } : undefined;
      }
      const h = s.houses.find((x) => x.phone === cleanPhone(phone) && x.code === code.trim());
      if (!h) return undefined;
      const day = s.published ? s.plan?.days.find((d) => d.houseIds.includes(h.id)) : undefined;
      return { id: h.id, name: h.name, address: h.address, area: h.area, visit: day ? { date: day.date, status: s.status[`${day.date}|${h.id}`] || 'planned' } : undefined };
    },
    [s.houses, s.plan, s.status],
  );

  const login = useCallback(
    async (id: string, secret: string) => {
      if (live) {
        const { error } = await supabase.auth.signInWithPassword({ email: id.trim(), password: secret });
        if (error) {
          err(error);
          return false;
        }
        return true; // onAuthStateChange loads the admin data
      }
      const ok = secret === '1225' && id.trim().length > 1; // demo only
      setS((p) => ({ ...p, isAdmin: ok, actor: ok ? id.trim() : '' }));
      return ok;
    },
    [err],
  );
  const logout = useCallback(() => {
    if (live) supabase.auth.signOut();
    setS((p) => ({ ...p, isAdmin: false, actor: '', role: '' as const, ...(live ? { houses: [], plan: null, status: {}, audit: [], team: [], invites: [] } : {}) }));
  }, []);
  const clearError = useCallback(() => setS((p) => ({ ...p, error: '' })), []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!live) return false;
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        err(error);
        return false;
      }
      if (!data.session) {
        setS((p) => ({ ...p, error: 'Check your email and tap the confirmation link, then log in.' }));
        return false;
      }
      return true;
    },
    [err],
  );
  const run = useCallback(
    async (q: PromiseLike<{ error: any }>) => {
      const { error } = await q;
      if (error) err(error);
      await loadAdmin();
    },
    [err, loadAdmin],
  );
  const invite = useCallback(
    (email: string, name: string, role: Role) => run(supabase.from('admin_invites').upsert({ email: email.trim().toLowerCase(), display_name: name.trim(), role } as any)),
    [run],
  );
  const removeInvite = useCallback((email: string) => run(supabase.from('admin_invites').delete().eq('email', email)), [run]);
  const removeMember = useCallback((userId: string) => run(supabase.from('admins').delete().eq('user_id', userId)), [run]);
  const setMemberRole = useCallback((userId: string, role: Role) => run(supabase.from('admins').update({ role } as any).eq('user_id', userId)), [run]);
  const canManage = s.role === 'priest' || s.role === 'coordinator';

  // Turn the evening to area choices into visit lists. Visits already checked in or out keep their status.
  const generate = useCallback(async () => {
    const p = s;
    const { days } = visitsFromAreas(p.houses, p.dayAreas);
    const plan: PlanResult = { days: days.map((d) => ({ date: d.date, area: p.dayAreas[d.date], houseIds: d.houseIds })), unplaced: [] };
    const status: Record<string, VisitStatus> = {};
    plan.days.forEach((d) => d.houseIds.forEach((id) => (status[`${d.date}|${id}`] = p.status[`${d.date}|${id}`] || 'planned')));
    if (live) {
      const gone = Object.keys(p.status).filter((k) => !(k in status));
      await Promise.all(
        gone.map((k) => {
          const [day, hid] = k.split('|');
          return supabase.from('visits').delete().eq('household_id', hid).eq('day', day);
        }),
      );
      const rows = plan.days.flatMap((d) => d.houseIds.map((id, i) => ({ household_id: id, day: d.date, position: i })));
      if (rows.length) {
        const up = await supabase.from('visits').upsert(rows as any, { onConflict: 'household_id,day' });
        if (up.error) return err(up.error);
      }
    }
    setS((q) => ({ ...q, plan, status }));
  }, [s, err]);

  const chk = useCallback((r: { error: any }) => (r.error ? err(r.error) : undefined), [err]);

  // Add, rename or edit an anbiyam and its leader. Renaming carries families and evenings along.
  const saveAnbiyam = useCallback(
    async (a: { oldName?: string; name: string; leader: string; phone: string }) => {
      const name = a.name.trim();
      if (!name) return;
      const old = a.oldName;
      const names = old ? s.areas.map((x) => (x === old ? name : x)) : s.areas.includes(name) ? s.areas : [...s.areas, name];
      setS((p) => ({
        ...p,
        areas: names,
        anbiyams: names.map((n) => (n === name ? { name, leader: a.leader, phone: a.phone } : p.anbiyams.find((x) => x.name === n) || { name: n, leader: '', phone: '' })),
        houses: old && old !== name ? p.houses.map((h) => (h.area === old ? { ...h, area: name } : h)) : p.houses,
        dayAreas: old && old !== name ? Object.fromEntries(Object.entries(p.dayAreas).map(([d, x]) => [d, x === old ? name : x])) : p.dayAreas,
      }));
      if (live) {
        if (old && old !== name) {
          chk(await supabase.from('households').update({ area: name } as any).eq('area', old));
          chk(await supabase.from('day_areas').update({ area: name } as any).eq('area', old));
          chk(await supabase.from('anbiyam_leaders').delete().eq('name', old));
        }
        chk(await supabase.from('anbiyam_leaders').upsert({ name, leader: a.leader, phone: a.phone } as any));
        chk(await supabase.from('seasons').update({ areas: names } as any).eq('year', s.year));
      }
    },
    [s.areas, s.year, chk],
  );

  const removeAnbiyam = useCallback(
    async (name: string) => {
      const names = s.areas.filter((x) => x !== name);
      setS((p) => ({
        ...p,
        areas: names,
        anbiyams: p.anbiyams.filter((x) => x.name !== name),
        houses: p.houses.map((h) => (h.area === name ? { ...h, area: '' } : h)),
        dayAreas: Object.fromEntries(Object.entries(p.dayAreas).filter(([, x]) => x !== name)),
      }));
      if (live) {
        chk(await supabase.from('households').update({ area: '' } as any).eq('area', name));
        chk(await supabase.from('day_areas').delete().eq('area', name));
        chk(await supabase.from('anbiyam_leaders').delete().eq('name', name));
        chk(await supabase.from('seasons').update({ areas: names } as any).eq('year', s.year));
      }
    },
    [s.areas, s.year, chk],
  );

  // Paste a list from the parish directory: name, phone, address, anbiyam.
  const importFamilies = useCallback(
    async (rows: { name: string; phone: string; address: string; area: string }[]) => {
      const clean = rows.filter((r) => r.name.trim() && r.address.trim());
      if (!clean.length) return 0;
      if (live) {
        const res = await supabase.from('households').insert(
          clean.map((r) => ({ season: s.year, name: r.name.trim(), phone: cleanPhone(r.phone), lang: 'en', address: r.address.trim(), area: r.area.trim(), free: {}, edit_code: makeCode(), consent: true, created_via: 'captain' })) as any,
        );
        if (res.error) {
          err(res.error);
          return 0;
        }
        await loadAdmin();
      } else {
        const made: Household[] = clean.map((r) => ({
          id: rid(), name: r.name.trim(), phone: cleanPhone(r.phone), lang: 'en', adults: 0, kids: 0, address: r.address.trim(), area: r.area.trim(), landmark: '', notes: '', prayer: '', blessing: false, away: [],
          priority: false, free: {}, songIds: [], customSongs: [], code: makeCode(), via: 'captain', createdAt: new Date().toISOString(),
        }));
        setS((p) => ({ ...p, houses: [...p.houses, ...made] }));
      }
      return clean.length;
    },
    [s.year, err, loadAdmin],
  );

  const setDayArea = useCallback(
    (date: string, area: string) => {
      setS((p) => {
        const dayAreas = { ...p.dayAreas };
        if (area) dayAreas[date] = area;
        else delete dayAreas[date];
        return { ...p, dayAreas };
      });
      if (live) {
        const q = area ? supabase.from('day_areas').upsert({ day: date, area } as any) : supabase.from('day_areas').delete().eq('day', date);
        q.then(({ error }) => error && err(error));
      }
    },
    [err],
  );

  const autoAssign = useCallback(async () => {
    const dayAreas = autoAssignAreas(s.houses, s.areas, datesBetween(s.start, s.end), s.maxPerEvening);
    setS((p) => ({ ...p, dayAreas }));
    if (live) {
      await supabase.from('day_areas').delete().gte('day', '2000-01-01');
      const rows = Object.entries(dayAreas).map(([day, area]) => ({ day, area }));
      if (rows.length) {
        const r = await supabase.from('day_areas').insert(rows as any);
        if (r.error) err(r.error);
      }
    }
  }, [s.houses, s.areas, s.start, s.end, s.maxPerEvening, err]);

  const publish = useCallback(
    (on: boolean) => {
      setS((p) => ({ ...p, published: on }));
      if (live) supabase.from('seasons').update({ published: on } as any).eq('year', s.year).then(({ error }) => error && err(error));
    },
    [s.year, err],
  );

  const setHouseArea = useCallback(
    (houseId: string, area: string) => {
      setS((p) => ({ ...p, houses: p.houses.map((h) => (h.id === houseId ? { ...h, area } : h)) }));
      if (live) supabase.from('households').update({ area } as any).eq('id', houseId).then(({ error }) => error && err(error));
    },
    [err],
  );

  const setStatus = useCallback(
    (date: string, houseId: string, st: VisitStatus, action?: string) => {
      if (live) {
        setS((p) => ({ ...p, status: { ...p.status, [`${date}|${houseId}`]: st } })); // instant; the server trigger writes the audit row
        supabase
          .from('visits')
          .update({ status: st } as any)
          .eq('household_id', houseId)
          .eq('day', date)
          .then(({ error }) => {
            if (error) err(error);
            loadAdmin();
          });
        return;
      }
      setS((p) => {
        const key = `${date}|${houseId}`;
        const from = p.status[key] || 'planned';
        const house = p.houses.find((h) => h.id === houseId);
        const entry: AuditEntry = { id: rid(), at: new Date().toISOString(), who: p.actor || 'unknown', houseId, houseName: house?.name || houseId, date, action: action || st, from, to: st };
        return { ...p, status: { ...p.status, [key]: st }, audit: [entry, ...p.audit] };
      });
    },
    [err, loadAdmin],
  );

  const setPin = useCallback(
    (houseId: string, lat: number, lng: number) => {
      if (live) {
        setS((p) => ({ ...p, houses: p.houses.map((h) => (h.id === houseId ? { ...h, lat, lng } : h)) }));
        supabase
          .from('households')
          .update({ lat, lng } as any)
          .eq('id', houseId)
          .then(({ error }) => {
            if (error) err(error);
            loadAdmin();
          });
        return;
      }
      setS((p) => {
        const house = p.houses.find((h) => h.id === houseId);
        const entry: AuditEntry = { id: rid(), at: new Date().toISOString(), who: p.actor || 'unknown', houseId, houseName: house?.name || houseId, date: '', action: 'pin-set', from: '', to: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
        return { ...p, houses: p.houses.map((h) => (h.id === houseId ? { ...h, lat, lng } : h)), audit: [entry, ...p.audit] };
      });
    },
    [err, loadAdmin],
  );

  const setMapCenter = useCallback(
    (c: [number, number]) => {
      setS((p) => ({ ...p, mapCenter: c }));
      if (live) supabase.from('seasons').update({ map_lat: c[0], map_lng: c[1] } as any).eq('year', s.year).then(({ error }) => error && err(error));
    },
    [s.year, err],
  );

  const lastChange = useCallback((date: string, houseId: string) => s.audit.find((a) => a.houseId === houseId && a.date === date), [s.audit]);

  const addSong = useCallback(
    (title: string, lang: 'en' | 'ta', lyrics = '') => {
      if (live) {
        supabase.from('songs').insert({ title, lang, lyrics } as any).then(({ error }) => (error ? err(error) : loadPublic()));
        return;
      }
      setS((p) => ({ ...p, songs: [...p.songs, { id: 'c-' + rid(), title, lang, kind: 'classic', lyrics }] }));
    },
    [err, loadPublic],
  );

  const setAreas = useCallback(
    (a: string[]) => {
      setS((p) => ({ ...p, areas: a }));
      if (live) supabase.from('seasons').update({ areas: a } as any).eq('year', s.year).then(({ error }) => error && err(error));
    },
    [s.year, err],
  );

  const resetAll = useCallback(() => {
    if (!live) setS({ ...initial, ready: true });
  }, []);

  const loadDemo = useCallback(() => {
    if (live) return;
    setS((p) => {
      const names = ['Joseph', 'Mary', 'Peter', 'Thomas', 'Anthony', 'Francis', 'Xavier', 'Rosario', 'Michael', 'Benedict', 'Lourdes', 'Selvam', 'Arul', 'Paul', 'Jacob', 'Daniel', 'Samuel', 'Martin', 'Philip', 'Gabriel', 'Raphael', 'Stephen', 'Matthew', 'Andrew'];
      const ds = datesBetween(p.start, p.end);
      const houses: Household[] = names.map((n, i) => {
        const free: Record<string, Slot> = {};
        ds.forEach((d, k) => {
          if ((i + k) % 3 !== 1) free[d] = i % 2 ? 'evening' : 'early';
        });
        return {
          id: rid(), name: `${n} family`, phone: String(9000000000 + i * 1111), lang: i % 3 === 0 ? 'ta' : 'en', adults: 2 + (i % 3), kids: i % 4,
          lat: p.mapCenter[0] + ((i * 37) % 17 - 8) * 0.0011, lng: p.mapCenter[1] + ((i * 53) % 19 - 9) * 0.0011,
          address: `${10 + i} Church Road`, area: p.areas[i % p.areas.length], landmark: 'Green gate', notes: i % 7 === 0 ? 'Elderly mother at home' : '', prayer: i % 4 === 0 ? 'For my mother\'s health' : '', blessing: i % 3 === 0, away: i % 5 === 1 ? [ds[3]] : [],
          priority: i % 7 === 0, free, songIds: [SONGS[i % SONGS.length].id], customSongs: [], code: makeCode(), via: i % 5 === 0 ? 'phone' : 'app', createdAt: new Date().toISOString(),
        };
      });
      return { ...p, houses: [...p.houses, ...houses], plan: null, status: {} };
    });
  }, []);

  const nextVisit = useCallback(
    (houseId: string) => {
      if (!s.plan) return undefined;
      const day = s.plan.days.find((d) => d.houseIds.includes(houseId));
      return day ? { date: day.date, area: day.area, status: s.status[`${day.date}|${houseId}`] || 'planned' } : undefined;
    },
    [s.plan, s.status],
  );

  const value: Store = { ...s, live, dates, enrol, lookup, login, logout, clearError, saveAnbiyam, removeAnbiyam, importFamilies, setDayArea, autoAssign, publish, setHouseArea, signUp, invite, removeInvite, removeMember, setMemberRole, canManage, generate, setStatus, setPin, setMapCenter, lastChange, addSong, setAreas, loadDemo, resetAll, nextVisit };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
};
