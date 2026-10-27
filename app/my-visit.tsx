import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BrandBar, Button, Card, Field, H, P, Screen, Title } from '../src/components/ui';
import { dayLabel } from '../src/components/EnrolForm';
import { TabBar } from '../src/components/Music';
import { useLang } from '../src/i18n';
import { Lookup, useStore } from '../src/store';

export default function MyVisit() {
  const { t } = useLang();
  const { lookup } = useStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [house, setHouse] = useState<Lookup | undefined>();
  const [tried, setTried] = useState(false);
  const visit = house?.visit;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 130, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <BrandBar />
        <View style={{ height: 14 }} />
        <Title>{t.myVisit}</Title>
        <Card>
          <Field label={t.phone} value={phone} keyboardType="phone-pad" onChangeText={setPhone} />
          <Field label={t.yourCode} value={code} keyboardType="number-pad" onChangeText={setCode} />
          <Button label={t.myVisit} onPress={async () => { try { setHouse(await lookup(phone, code)); } catch { setHouse(undefined); } setTried(true); }} />
        </Card>
        {tried && !house && <View style={{ marginTop: 14 }}><P>We could not find that phone number and code. Check them, or ask the coordinator.</P></View>}
        {house && (
          <View style={{ marginTop: 14 }}>
            <Card>
              <H size={22}>{house.name}</H>
              <P>{house.address}, {house.area}</P>
              <View style={{ height: 12 }} />
              {visit ? (
                <>
                  <P soft={false} size={18}>Carollers are coming on {dayLabel(visit.date)}</P>
                  <P>{visit.status === 'done' ? 'Finished. Thank you for having us!' : visit.status === 'missed' ? 'We tried but could not reach you. Call the coordinator for another visit.' : 'We will see you then.'}</P>
                </>
              ) : (
                <P>The visit days are not planned yet. We will message you the evening before.</P>
              )}
            </Card>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
      <TabBar active="visit" />
    </Screen>
  );
}
