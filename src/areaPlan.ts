// The team decides which anbiyam is visited on which evening (one anbiyam per evening).
// These helpers only suggest and tidy.

export type PlanHouse = { id: string; name: string; area: string; lat?: number; lng?: number; away?: string[] };

// Order a set of houses as a walking route: start at the north west corner, always walk to the nearest next house.
// Houses without a pin go last, alphabetically.
export function routeOrder<T extends PlanHouse>(houses: T[]): T[] {
  const pinned = houses.filter((h) => h.lat != null && h.lng != null);
  const loose = houses.filter((h) => h.lat == null || h.lng == null).sort((a, b) => a.name.localeCompare(b.name));
  if (!pinned.length) return loose;
  const left = [...pinned];
  let cur = left.reduce((best, h) => (h.lat! - h.lng! > best.lat! - best.lng! ? h : best), left[0]);
  const out: T[] = [];
  while (true) {
    out.push(cur);
    left.splice(left.indexOf(cur), 1);
    if (!left.length) break;
    cur = left.reduce((best, h) => (d2(cur, h) < d2(cur, best) ? h : best), left[0]);
  }
  return [...out, ...loose];
}
const d2 = (a: PlanHouse, b: PlanHouse) => (a.lat! - b.lat!) ** 2 + (a.lng! - b.lng!) ** 2;

// Suggest an anbiyam for each evening. Every anbiyam with families gets an evening (a big one gets more),
// spread across the month so no anbiyam waits too long.
export function autoAssignAreas(houses: PlanHouse[], areas: string[], dates: string[], maxPerEvening = 25): Record<string, string> {
  const count: Record<string, number> = {};
  houses.forEach((h) => h.area && (count[h.area] = (count[h.area] || 0) + 1));
  const used = areas.filter((a) => count[a]);
  if (!used.length || !dates.length) return {};
  let cap = Math.max(1, maxPerEvening);
  let need: Record<string, number> = {};
  for (;;) {
    need = Object.fromEntries(used.map((a) => [a, Math.ceil(count[a] / cap)]));
    if (used.reduce((n, a) => n + need[a], 0) <= dates.length) break;
    cap += 1;
  }
  const seq: string[] = [];
  const left = { ...need };
  while (used.some((a) => left[a] > 0)) used.forEach((a) => left[a] > 0 && (seq.push(a), left[a]--));
  const out: Record<string, string> = {};
  seq.forEach((a, k) => {
    out[dates[Math.floor((k * dates.length) / seq.length)]] = a;
  });
  return out;
}

// Which houses are visited on which evening, given the evening to anbiyam map.
// An anbiyam with several evenings is split into walking order chunks. A house that is away on its evening
// moves to another evening of the same anbiyam if there is one, otherwise it is listed in `away`.
export function visitsFromAreas<T extends PlanHouse>(houses: T[], dayAreas: Record<string, string>): { days: { date: string; houseIds: string[] }[]; away: { houseId: string; date: string }[] } {
  const byArea: Record<string, string[]> = {};
  Object.entries(dayAreas).forEach(([d, a]) => (byArea[a] = [...(byArea[a] || []), d]));
  const bucket: Record<string, string[]> = {};
  const away: { houseId: string; date: string }[] = [];
  Object.entries(byArea).forEach(([area, days]) => {
    const ds = [...days].sort();
    const ordered = routeOrder(houses.filter((h) => h.area === area));
    const per = Math.ceil(ordered.length / ds.length) || 1;
    ordered.forEach((h, i) => {
      const first = Math.min(ds.length - 1, Math.floor(i / per));
      const tries = [...ds.slice(first), ...ds.slice(0, first)];
      const day = tries.find((d) => !(h.away || []).includes(d));
      if (day) (bucket[day] = bucket[day] || []).push(h.id);
      else away.push({ houseId: h.id, date: ds[first] });
    });
  });
  const days = Object.entries(bucket)
    .map(([date, houseIds]) => ({ date, houseIds }))
    .filter((v) => v.houseIds.length)
    .sort((a, b) => a.date.localeCompare(b.date));
  return { days, away };
}
