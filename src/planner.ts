// Plans the carol month: which area on which evening, which houses, in what order.
// Pure functions, no dates objects (so no timezone surprises): dates are 'YYYY-MM-DD' strings.

export type Slot = 'any' | 'early' | 'evening' | 'late';

export type House = {
  id: string;
  name: string;
  area: string;
  address: string;
  priority: boolean;
  free: Record<string, Slot>; // date -> best time
  lat?: number;
  lng?: number;
};

export type PlanDay = { date: string; area: string; houseIds: string[] };
export type PlanResult = { days: PlanDay[]; unplaced: { id: string; reason: string }[] };

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export function datesBetween(start: string, end: string, skip: string[] = []): string[] {
  const out: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));
  while (cur <= last) {
    const s = iso(cur.getUTCFullYear(), cur.getUTCMonth() + 1, cur.getUTCDate());
    if (!skip.includes(s)) out.push(s);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** First Sunday of Advent = the fourth Sunday before Christmas Day. */
export function adventStart(year: number): string {
  const xmas = new Date(Date.UTC(year, 11, 25));
  const dow = xmas.getUTCDay(); // 0 = Sunday
  const prevSunday = new Date(xmas);
  prevSunday.setUTCDate(prevSunday.getUTCDate() - (dow === 0 ? 7 : dow));
  prevSunday.setUTCDate(prevSunday.getUTCDate() - 21);
  return iso(prevSunday.getUTCFullYear(), prevSunday.getUTCMonth() + 1, prevSunday.getUTCDate());
}

function route(houses: House[]): House[] {
  const withGeo = houses.every((h) => h.lat != null && h.lng != null);
  if (!withGeo) {
    return [...houses].sort((a, b) => a.address.localeCompare(b.address, undefined, { numeric: true }));
  }
  // nearest neighbour from the first (northern-most) house
  const left = [...houses].sort((a, b) => (b.lat as number) - (a.lat as number));
  const out = [left.shift() as House];
  while (left.length) {
    const last = out[out.length - 1];
    let best = 0;
    let bd = Infinity;
    left.forEach((h, i) => {
      const d = (h.lat! - last.lat!) ** 2 + (h.lng! - last.lng!) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    out.push(left.splice(best, 1)[0]);
  }
  return out;
}

export function planSeason(houses: House[], dates: string[], maxPerEvening = 12): PlanResult {
  const left = new Map(houses.map((h) => [h.id, h]));
  const days: PlanDay[] = [];

  for (const date of dates) {
    if (left.size === 0) break;
    // for each area, who is free on this date?
    const byArea = new Map<string, House[]>();
    for (const h of left.values()) {
      if (h.free[date]) byArea.set(h.area, [...(byArea.get(h.area) || []), h]);
    }
    if (byArea.size === 0) continue;
    // pick the area where most houses (priority counts double) can be visited tonight
    const score = (hs: House[]) => hs.reduce((s, h) => s + (h.priority ? 2 : 1), 0);
    const [area, avail] = [...byArea.entries()].sort((a, b) => score(b[1]) - score(a[1]) || a[0].localeCompare(b[0]))[0];
    const chosen = [...avail].sort((a, b) => Number(b.priority) - Number(a.priority)).slice(0, maxPerEvening);
    chosen.forEach((h) => left.delete(h.id));
    days.push({ date, area, houseIds: route(chosen).map((h) => h.id) });
  }

  const unplaced = [...left.values()].map((h) => ({
    id: h.id,
    reason: Object.keys(h.free).length === 0 ? 'No free evening given. Call them.' : 'Their free evenings were full. Offer another date.',
  }));
  return { days, unplaced };
}
