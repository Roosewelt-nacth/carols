import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_HTML } from '../mapHtml';
import { HouseMapProps, payloadOf } from './HouseMap.types';

// Phones: the same map page inside a WebView.
export function HouseMap(props: HouseMapProps) {
  const ref = useRef<any>(null);
  const WV: any = WebView;
  const payload = payloadOf(props);
  const push = () => ref.current?.injectJavaScript(`window.__init(${payload});true;`);
  useEffect(push, [payload]);
  return (
    <View style={{ height: props.height || 360, borderRadius: 16, overflow: 'hidden' }}>
      <WV
        ref={ref}
        originWhitelist={['*']}
        source={{ html: MAP_HTML, baseUrl: 'https://carols.local' }}
        geolocationEnabled
        javaScriptEnabled
        onMessage={(e: any) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.type === 'ready') push();
            if (m.type === 'select') props.onSelect?.(m.id);
            if (m.type === 'pick') props.onPick?.(m.lat, m.lng);
          } catch {}
        }}
      />
    </View>
  );
}
