import React, { useEffect, useRef } from 'react';
import { MAP_HTML } from '../mapHtml';
import { HouseMapProps, payloadOf } from './HouseMap.types';

// Web: the map page runs inside an iframe and we exchange messages with it.
export function HouseMap(props: HouseMapProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const payload = payloadOf(props);
  const latest = useRef(payload);
  latest.current = payload;
  const cb = useRef(props);
  cb.current = props;

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || typeof e.data !== 'string') return;
      let m: any;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      if (m.type === 'ready') ref.current?.contentWindow?.postMessage(latest.current, '*');
      if (m.type === 'select') cb.current.onSelect?.(m.id);
      if (m.type === 'pick') cb.current.onPick?.(m.lat, m.lng);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    ref.current?.contentWindow?.postMessage(payload, '*');
  }, [payload]);

  return <iframe ref={ref} srcDoc={MAP_HTML} title="map" style={{ width: '100%', height: props.height || 360, border: 0, borderRadius: 16, background: '#0b1022' }} />;
}
