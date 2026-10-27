import { colors } from '../theme';

export type MapHouse = { id: string; name: string; lat?: number; lng?: number; status: string; order?: number };

export type HouseMapProps = {
  mode?: 'view' | 'pick';
  center: [number, number];
  houses?: MapHouse[];
  selectedId?: string | null;
  route?: [number, number][];
  pin?: [number, number] | null;
  height?: number;
  onSelect?: (id: string) => void;
  onPick?: (lat: number, lng: number) => void;
};

export const payloadOf = (p: HouseMapProps) =>
  JSON.stringify({ type: 'init', mode: p.mode || 'view', dark: !colors.light, center: p.center, zoom: 15, houses: p.houses || [], selectedId: p.selectedId || null, route: p.route || [], pin: p.pin || null });
