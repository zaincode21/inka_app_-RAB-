import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import { createHealthEvent, getCategories, todayIsoDate, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMassEvent'>;

const eventTypes = ['Vaccination', 'Herd Spraying', 'Deworming', 'Treatment', 'Hoof Trimming'];

export function AddMassEventScreen({ navigation }: Props) {
  const { data: medicines } = useDatabaseQuery(() => getCategories('medicine'), []);
  const medicineOptions = useMemo(() => medicines.map((category) => category.name), [medicines]);
  const [eventDate, setEventDate] = useState(todayIsoDate());
  const [eventType, setEventType] = useState('');
  const [medicine, setMedicine] = useState('');
  const [notes, setNotes] = useState('');

  const saveEvent = async () => {
    if (!eventDate.trim() || !eventType) {
      Alert.alert('Missing event details', 'Event date and event type are required.');
      return;
    }

    if (requiresMedicine(eventType) && !medicine) {
      Alert.alert('Missing medicine', 'Please enter medicine information.');
      return;
    }

    try {
      await createHealthEvent({
        scope: 'mass',
        cattleTag: '',
        groupName: '',
        eventDate: eventDate.trim(),
        eventType,
        symptoms: '',
        diagnosis: '',
        medicine: requiresMedicine(eventType) ? medicine : '',
        dosage: '',
        route: '',
        frequency: '',
        withdrawalDays: 0,
        batchNumber: '',
        technician: '',
        vetName: '',
        vetContact: '',
        followUpDate: '',
        weightKg: 0,
        semenUsed: '',
        bullResponsible: '',
        returnHeatDate: '',
        breedingDate: '',
        expectedDeliveryDate: '',
        calfTag: '',
        calfGender: '',
        notes: notes.trim(),
        photoUri: '',
      });
      navigation.replace('Events');
    } catch (error) {
      Alert.alert('Could not save mass event', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">Add Mass Event</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Label text="Event Date" />
        <Input placeholder="YYYY-MM-DD" value={eventDate} onChangeText={setEventDate} />

        <SelectDropdown
          label="Event Type"
          value={eventType}
          placeholder="Select"
          options={eventTypes}
          onSelect={(value) => {
            setEventType(value);
            if (!requiresMedicine(value)) {
              setMedicine('');
            }
          }}
        />

        {requiresMedicine(eventType) ? (
          <>
            <SelectDropdown label="Medicine" value={medicine} placeholder="Select medicine" options={medicineOptions} onSelect={setMedicine} />
          </>
        ) : null}

        <Label text="Notes" />
        <Input placeholder="Write something" multiline value={notes} onChangeText={setNotes} />
      </ScrollView>

      <View className="flex-row bg-white px-6 py-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
          <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
        </Pressable>
        <Pressable onPress={saveEvent} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
          <Text className="text-[16px] font-bold text-white">Save</Text>
        </Pressable>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

function requiresMedicine(eventType: string): boolean {
  return eventType === 'Treatment' || eventType === 'Vaccination' || eventType === 'Deworming';
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">{text}</Text>;
}

function Input({ placeholder, value, onChangeText, multiline = false }: { placeholder: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
  return (
    <View className={`${multiline ? 'min-h-[100px]' : 'h-[48px]'} mt-3 justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" multiline={multiline} className="text-[16px] text-[#1F2937]" />
    </View>
  );
}

