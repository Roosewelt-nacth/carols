import React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store';

// A plain black-on-white page, meant to be printed (the browser Print button). Hand these out after Mass.
const line = { borderBottomWidth: 1, borderColor: '#000', height: 26, marginBottom: 8 } as const;

export default function PaperForm() {
  const { areas } = useStore();
  const router = useRouter();
  const L = ({ label }: { label: string }) => (
    <View>
      <Text style={{ fontSize: 12, color: '#333' }}>{label}</Text>
      <View style={line} />
    </View>
  );
  return (
    <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={{ padding: 28, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.replace('/')}><Text style={{ color: '#555' }}>Back</Text></Pressable>
        {Platform.OS === 'web' && (
          <Pressable onPress={() => (window as any).print()}><Text style={{ color: '#06c', fontWeight: '700' }}>Print this page</Text></Pressable>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <Image source={require('../assets/brand/victorians.png')} style={{ width: 64, height: 52 }} resizeMode="contain" />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 26, fontWeight: '800' }}>Christmas carols: enrol your home</Text>
          <Text style={{ fontSize: 13, color: '#444' }}>Victorians Youth</Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, marginBottom: 14 }}>Fill this in and give it to a youth volunteer, or hand it in at the parish office. We will visit your home with carols.</Text>
      <L label="Family name" />
      <L label="Phone number (WhatsApp if you have it)" />
      <L label="House number and street" />
      <L label={'Your anbiyam (' + areas.join(', ') + ')'} />
      <L label="Landmark or how to find the gate" />
      <L label="Carols you would like us to sing" />
      <L label="Prayer intentions (only the youth team will read this)" />
      <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Bless our home:  [  ] Yes, please        Someone is elderly or unwell:  [  ] Yes</Text>
      <L label="Evenings in Advent when nobody is home (optional)" />
      <Text style={{ fontSize: 11, color: '#444', marginTop: 2 }}>We will tell you your visit day once the plan is published.</Text>
      <Text style={{ fontSize: 11, color: '#444', marginTop: 4 }}>I agree that the parish may keep my address and phone number to plan the carol visits this season.   Signature: ____________________</Text>
    </ScrollView>
  );
}
