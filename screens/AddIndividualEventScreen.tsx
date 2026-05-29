import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddIndividualEvent'>;

const eventTypes = ['Treated', 'Weighed', 'Breeding', 'Pregnant', 'Giving Birth', 'Vaccinated'];

export function AddIndividualEventScreen({ navigation }: Props) {
  const [eventType, setEventType] = useState('');
  const [calfGender, setCalfGender] = useState('');

  return (
    <View className="flex-1 bg-[#E5E5E5]">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">Add Individual Event</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Label text="Event Date" />
        <Input placeholder="Select event date" />

        <SelectDropdown label="Event Type" value={eventType} placeholder="Select" options={eventTypes} onSelect={setEventType} />

        {eventType === 'Treated' || eventType === 'Vaccinated' ? (
          <>
            <ConditionalInput placeholder="Symptoms" />
            <ConditionalInput placeholder="Diagnosis" />
            <ConditionalInput placeholder="Technician Name" />
            <ConditionalInput placeholder="Medicine" />
          </>
        ) : null}

        {eventType === 'Weighed' ? <ConditionalInput placeholder="Weight Result" keyboardType="decimal-pad" /> : null}

        {eventType === 'Breeding' ? (
          <>
            <ConditionalInput placeholder="Semen Used" />
            <ConditionalInput placeholder="Veterinarian Name" />
            <ConditionalInput placeholder="Estimated Return Heat Date" editable={false} />
            <ConditionalInput placeholder="Bull Responsible" />
          </>
        ) : null}

        {eventType === 'Pregnant' ? (
          <>
            <ConditionalInput placeholder="Breeding Date" editable={false} />
            <ConditionalInput placeholder="Expected Delivery Date" editable={false} />
            <ConditionalInput placeholder="Bull Responsible" />
          </>
        ) : null}

        {eventType === 'Giving Birth' ? <ConditionalInput placeholder="Giving Birth Bull Responsible" /> : null}

        <Text className="mb-3 mt-4 text-[12px] text-[#E6B86F]">Calf registration note</Text>
        <Pressable className="mb-3 items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
          <Text className="text-[16px] font-bold text-[#0A9A9D]">Tap to Register Calf</Text>
        </Pressable>

        <View className="mb-3 flex-row gap-3">
          <View className="flex-1">
            <Label text="Calf Tag No" />
            <Input placeholder="Calf tag no" />
          </View>
          <View className="flex-1">
            <SelectDropdown label="Calf Gender" value={calfGender} placeholder="Select" options={['Male', 'Female']} onSelect={setCalfGender} />
          </View>
        </View>

        <Label text="Notes" />
        <Input placeholder="Write something" multiline />

        <Pressable className="mt-5 h-32 items-center justify-center rounded-[18px] border-2 border-dashed border-[#B7D9D9] bg-white">
          <Feather name="camera" size={24} color="#0A9A9D" />
          <Text className="mt-2 text-[12px] text-[#0A9A9D]">Tap to add photo</Text>
        </Pressable>
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

function Input({ placeholder, keyboardType = 'default', multiline = false, editable = true }: { placeholder: string; keyboardType?: 'default' | 'decimal-pad'; multiline?: boolean; editable?: boolean }) {
  return (
    <View className={`${multiline ? 'min-h-[100px]' : 'h-[48px]'} justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
      <TextInput placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} multiline={multiline} editable={editable} className="text-[16px] text-[#1F2937]" />
    </View>
  );
}

function ConditionalInput({ placeholder, keyboardType = 'default', editable = true }: { placeholder: string; keyboardType?: 'default' | 'decimal-pad'; editable?: boolean }) {
  return (
    <View className="mt-3">
      <View className="h-[48px] justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
        <TextInput placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} editable={editable} className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}

