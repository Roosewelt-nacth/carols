import React from 'react';
import { ScrollView, View } from 'react-native';
import { BrandBar, Screen, Title } from '../src/components/ui';
import { EnrolForm } from '../src/components/EnrolForm';
import { TabBar } from '../src/components/Music';
import { useLang } from '../src/i18n';

export default function Enroll() {
  const { t } = useLang();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <BrandBar />
        <View style={{ height: 14 }} />
        <Title>{t.enrol}</Title>
        <EnrolForm />
        <View style={{ height: 30 }} />
      </ScrollView>
      <TabBar active="enrol" />
    </Screen>
  );
}
