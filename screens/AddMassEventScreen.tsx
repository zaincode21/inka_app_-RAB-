import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMassEvent'>;

const eventTypes = ['Treatment', 'Vaccination', 'Deworming'];

export function AddMassEventScreen({ navigation }: Props) {
  const [eventType, setEventType] = useState('');

  return (
    <View className="flex-1 bg-[#E5E5E5]">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">Add Mass Event</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Label text="Event Date" />
        <Input placeholder="Select event date" />

        <SelectDropdown label="Event Type" value={eventType} placeholder="Select" options={eventTypes} onSelect={setEventType} />

        {eventType ? <Input placeholder="Medicine" /> : null}

        <Label text="Notes" />
        <Input placeholder="Write something" multiline />
      </ScrollView>

      <View className="flex-row bg-white px-6 py-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[14px] border border-[#0A9A9D] bg-white py-3">
          <Text className="text-[16px] font-bold text-[#0A9A9D]">Cancel</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} className="ml-2 flex-1 items-center justify-center rounded-[14px] bg-[#0A9A9D] py-3">
          <Text className="text-[16px] font-bold text-white">Save</Text>
        </Pressable>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">{text}</Text>;
}

function Input({ placeholder, multiline = false }: { placeholder: string; multiline?: boolean }) {
  return (
    <View className={`${multiline ? 'min-h-[100px]' : 'h-[48px]'} mt-3 justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
      <TextInput placeholder={placeholder} placeholderTextColor="#6B7280" multiline={multiline} className="text-[16px] text-[#1F2937]" />
    </View>
  );
}

