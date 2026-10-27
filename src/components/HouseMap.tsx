import React from 'react';
import { Text, View } from 'react-native';
import { HouseMapProps } from './HouseMap.types';

// Type stub. Metro uses HouseMap.web.tsx on the web and HouseMap.native.tsx on phones.
export function HouseMap(_props: HouseMapProps) {
  return (
    <View>
      <Text>Map is not available on this platform.</Text>
    </View>
  );
}
