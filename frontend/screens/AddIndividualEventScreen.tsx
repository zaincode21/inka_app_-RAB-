import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import { addDays, createHealthEvent, getCattle, getCategories, parseNumber, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddIndividualEvent'>;

const eventTypes = [
  { label: 'Kuvurwa', value: 'Treated' },
  { label: 'Kwimisha', value: 'Breeding' },
  { label: 'Gupimwa Ibiro', value: 'Weighed' },
  { label: 'Kubyara', value: 'Giving Birth' },
  { label: 'Gukingirwa', value: 'Vaccinated' },
  { label: 'Gusama', value: 'Pregnant' },
  { label: 'Kuramburura', value: 'Aborted' },
  { label: 'Deworming', value: 'Deworming' },
  { label: 'Hoof Trimming', value: 'Hoof Trimming' },
];

const breedingMethods = [
  { label: 'Gutera intanga', value: 'semen' },
  { label: 'Ikimasa', value: 'bull' },
];

export function AddIndividualEventScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const { data: medicines } = useDatabaseQuery(() => getCategories('medicine'), []);
  const cattleTagOptions = useMemo(() => cattle.map((animal) => animal.tagNumber), [cattle]);
  const medicineOptions = useMemo(() => medicines.map((category) => category.name), [medicines]);
  const [eventDate, setEventDate] = useState('');
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [cattleTag, setCattleTag] = useState(route.params?.cattleTag ?? '');
  const [eventType, setEventType] = useState('');
  const [breedingMethod, setBreedingMethod] = useState('');
  const [calfGender, setCalfGender] = useState('');
  const [showCalfRegistration, setShowCalfRegistration] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [technician, setTechnician] = useState('');
  const [medicine, setMedicine] = useState('');
  const [vetName, setVetName] = useState('');
  const [weightResult, setWeightResult] = useState('');
  const [semenUsed, setSemenUsed] = useState('');
  const [bullResponsible, setBullResponsible] = useState('');
  const [breedingDate, setBreedingDate] = useState('');
  const [calfTag, setCalfTag] = useState('');
  const [notes, setNotes] = useState('');
  const isNarrow = width < 380;
  const returnHeatDate = eventType === 'Breeding' ? addDays(eventDate, 21) : '';
  const expectedDeliveryDate = eventType === 'Breeding' || eventType === 'Pregnant' ? addDays(breedingDate || eventDate, 280) : '';

  const handleEventDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const timestamp = event.nativeEvent.timestamp;
    const pickedDate = selectedDate ?? (timestamp ? new Date(timestamp) : undefined);

    if (event.type === 'dismissed' || !pickedDate) {
      if (Platform.OS !== 'ios') {
        setShowEventDatePicker(false);
      }
      return;
    }

    setEventDate(formatPickerDate(pickedDate));
    if (Platform.OS !== 'ios') {
      setShowEventDatePicker(false);
    }
  };

  const saveEvent = async () => {
    if (!eventDate.trim() || !eventType) {
      Alert.alert('Missing event details', 'Event date and event type are required.');
      return;
    }

    if (!cattleTag) {
      Alert.alert('Select animal', 'Please select the animal for this individual event.');
      return;
    }

    if (!validateEventFields(eventType, breedingMethod, { symptoms, diagnosis, technician, medicine, weightResult, semenUsed, vetName, breedingDate, bullResponsible })) {
      return;
    }

    if (eventType === 'Giving Birth' && showCalfRegistration && (!calfTag.trim() || !calfGender)) {
      Alert.alert('Complete calf registration', 'Please enter calf tag number and select calf gender.');
      return;
    }

    try {
      await createHealthEvent({
        scope: 'individual',
        cattleTag,
        groupName: '',
        eventDate: eventDate.trim(),
        eventType,
        symptoms: eventType === 'Treated' ? symptoms.trim() : '',
        diagnosis: eventType === 'Treated' ? diagnosis.trim() : '',
        medicine: requiresMedicine(eventType) || eventType === 'Treated' ? medicine : '',
        dosage: '',
        route: '',
        frequency: '',
        withdrawalDays: 0,
        batchNumber: '',
        technician: eventType === 'Treated' ? technician.trim() : '',
        vetName: eventType === 'Breeding' && breedingMethod === 'semen' ? vetName.trim() : '',
        vetContact: '',
        followUpDate: '',
        weightKg: eventType === 'Weighed' ? parseNumber(weightResult) : 0,
        semenUsed: eventType === 'Breeding' && breedingMethod === 'semen' ? semenUsed.trim() : '',
        bullResponsible:
          eventType === 'Breeding' && breedingMethod === 'bull'
            ? bullResponsible.trim()
            : eventType === 'Giving Birth'
              ? bullResponsible.trim()
              : eventType === 'Pregnant'
                ? bullResponsible.trim()
                : '',
        returnHeatDate: eventType === 'Breeding' ? returnHeatDate : '',
        breedingDate: eventType === 'Pregnant' || eventType === 'Aborted' ? breedingDate.trim() : '',
        expectedDeliveryDate: ['Breeding', 'Pregnant'].includes(eventType) ? expectedDeliveryDate : '',
        calfTag: showCalfRegistration ? calfTag.trim() : '',
        calfGender: showCalfRegistration ? calfGender : '',
        notes: notes.trim(),
        photoUri: '',
      });
      navigation.replace('Events');
    } catch (error) {
      Alert.alert('Could not save event', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">Add Individual Event</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Label text="Event Date" />
        <DateField value={eventDate} placeholder="Select event date" onPress={() => setShowEventDatePicker(true)} />

        {route.params?.cattleTag ? (
          <>
            <Label text="Selected Animal" />
            <View className="h-[48px] justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
              <Text className="text-[16px] text-[#1F2937]">{route.params.cattleTag}</Text>
            </View>
          </>
        ) : (
          <SelectDropdown label="Cattle Tag" value={cattleTag} placeholder="Select animal" options={cattleTagOptions} onSelect={setCattleTag} />
        )}

        <SelectDropdown
          label="Event Type"
          value={eventType}
          placeholder="Select"
          options={eventTypes}
          onSelect={(value) => {
            setEventType(value);
            if (value !== 'Breeding') {
              setBreedingMethod('');
              setSemenUsed('');
              setVetName('');
            }
          }}
        />

        {eventType === 'Treated' ? (
          <>
            <ConditionalInput placeholder="Symptoms" value={symptoms} onChangeText={setSymptoms} />
            <ConditionalInput placeholder="Diagnosis" value={diagnosis} onChangeText={setDiagnosis} />
            <ConditionalInput placeholder="Technician Name" value={technician} onChangeText={setTechnician} />
            <SelectDropdown label="Medicine" value={medicine} placeholder="Select medicine" options={medicineOptions} onSelect={setMedicine} />
          </>
        ) : null}

        {requiresMedicine(eventType) ? (
          <SelectDropdown label="Medicine" value={medicine} placeholder="Select medicine" options={medicineOptions} onSelect={setMedicine} />
        ) : null}

        {eventType === 'Weighed' ? <ConditionalInput placeholder="Weight Result" keyboardType="decimal-pad" value={weightResult} onChangeText={setWeightResult} /> : null}

        {eventType === 'Aborted' ? <ConditionalInput placeholder="Breeding Date" value={breedingDate} onChangeText={setBreedingDate} /> : null}

        {eventType === 'Breeding' ? (
          <>
            <SelectDropdown
              label="Breeding Type"
              value={breedingMethod}
              placeholder="Select"
              options={breedingMethods}
              onSelect={(value) => {
                setBreedingMethod(value);
                setSemenUsed('');
                setVetName('');
                setBullResponsible('');
              }}
            />

            {breedingMethod === 'semen' ? (
              <>
                <Label text="Semen Used / Straw ID" />
                <Input placeholder="Enter semen or straw ID" value={semenUsed} onChangeText={setSemenUsed} />
                <Label text="Veterinarian / Inseminator Name" />
                <Input placeholder="Enter name" value={vetName} onChangeText={setVetName} />
              </>
            ) : null}

            {breedingMethod === 'bull' ? (
              <>
                <Label text="Bull Name" />
                <Input placeholder="Enter bull name" value={bullResponsible} onChangeText={setBullResponsible} />
              </>
            ) : null}

            {breedingMethod ? (
              <>
                <Label text="Estimated Return Heat Date" />
                <Input placeholder="YYYY-MM-DD" value={returnHeatDate} onChangeText={() => {}} editable={false} />
                <Label text="Expected Delivery Date" />
                <Input placeholder="YYYY-MM-DD" value={expectedDeliveryDate} onChangeText={() => {}} editable={false} />
              </>
            ) : null}
          </>
        ) : null}

        {eventType === 'Pregnant' ? (
          <>
            <ConditionalInput placeholder="Breeding Date" value={breedingDate} onChangeText={setBreedingDate} />
            <ConditionalInput placeholder="Expected Delivery Date" value={expectedDeliveryDate} onChangeText={() => {}} editable={false} />
            <ConditionalInput placeholder="Bull Responsible" value={bullResponsible} onChangeText={setBullResponsible} />
          </>
        ) : null}

        {eventType === 'Giving Birth' ? (
          <>
            <ConditionalInput placeholder="Semen/tag no. of bull responsible" value={bullResponsible} onChangeText={setBullResponsible} />
            <Text className="mb-3 mt-4 text-[12px] text-[#E6B86F]">Calf registration note</Text>
            <Pressable
              onPress={() => setShowCalfRegistration((visible) => !visible)}
              className="mb-3 items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3"
            >
              <Text className="text-[16px] font-bold text-[#008B8B]">
                {showCalfRegistration ? 'Hide Calf Registration' : 'Tap to Register Calf'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {eventType === 'Giving Birth' && showCalfRegistration ? (
          <View className={`mb-3 gap-3 ${isNarrow ? '' : 'flex-row'}`}>
            <View className={isNarrow ? '' : 'flex-1'}>
              <Label text="Calf Tag No" />
              <Input placeholder="Calf tag no" value={calfTag} onChangeText={setCalfTag} />
            </View>
            <View className={isNarrow ? '' : 'flex-1'}>
              <SelectDropdown label="Calf Gender" value={calfGender} placeholder="Select" options={['Male', 'Female']} onSelect={setCalfGender} />
            </View>
          </View>
        ) : null}

        <Label text="Notes" />
        <Input placeholder="Write something" multiline value={notes} onChangeText={setNotes} />

        <Pressable className="mt-5 h-32 items-center justify-center rounded-[18px] border-2 border-dashed border-[#B7D9D9] bg-white">
          <Feather name="camera" size={24} color="#008B8B" />
          <Text className="mt-2 text-[12px] text-[#008B8B]">Tap to add photo</Text>
        </Pressable>
      </ScrollView>

      <View className="flex-row bg-white px-6 py-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
          <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
        </Pressable>
        <Pressable onPress={saveEvent} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
          <Text className="text-[16px] font-bold text-white">Save</Text>
        </Pressable>
      </View>

      {showEventDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker value={parseDateForPicker(eventDate)} mode="date" display="calendar" onChange={handleEventDateChange} />
      ) : null}

      <Modal visible={showEventDatePicker && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setShowEventDatePicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowEventDatePicker(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">Event Date</Text>
              <Pressable onPress={() => setShowEventDatePicker(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <DateTimePicker
              value={parseDateForPicker(eventDate)}
              mode="date"
              display="inline"
              themeVariant="light"
              onChange={handleEventDateChange}
              style={{ height: 330, width: '100%' }}
            />
            <Pressable onPress={() => setShowEventDatePicker(false)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function requiresMedicine(eventType: string): boolean {
  return eventType === 'Vaccinated' || eventType === 'Deworming';
}

function validateEventFields(
  eventType: string,
  breedingMethod: string,
  values: {
    symptoms: string;
    diagnosis: string;
    technician: string;
    medicine: string;
    weightResult: string;
    semenUsed: string;
    vetName: string;
    breedingDate: string;
    bullResponsible: string;
  },
): boolean {
  if (eventType === 'Treated' && (!values.symptoms.trim() || !values.diagnosis.trim() || !values.technician.trim() || !values.medicine)) {
    Alert.alert('Missing treatment details', 'Please enter symptoms, diagnosis, technician name, and medicine.');
    return false;
  }
  if (requiresMedicine(eventType) && !values.medicine) {
    Alert.alert('Missing medicine', 'Please select medicine information.');
    return false;
  }
  if (eventType === 'Aborted' && !values.breedingDate.trim()) {
    Alert.alert('Missing abortion details', 'Please enter the breeding date.');
    return false;
  }
  if (eventType === 'Weighed' && !values.weightResult.trim()) {
    Alert.alert('Missing weight', 'Please enter weight result.');
    return false;
  }
  if (eventType === 'Breeding') {
    if (!breedingMethod) {
      Alert.alert('Missing breeding type', 'Please select semen or bull.');
      return false;
    }
    if (breedingMethod === 'semen' && (!values.semenUsed.trim() || !values.vetName.trim())) {
      Alert.alert('Missing breeding details', 'Please enter semen used and veterinarian name.');
      return false;
    }
    if (breedingMethod === 'bull' && !values.bullResponsible.trim()) {
      Alert.alert('Missing breeding details', 'Please enter bull name.');
      return false;
    }
  }
  if (eventType === 'Pregnant' && (!values.breedingDate.trim() || !values.bullResponsible.trim())) {
    Alert.alert('Missing pregnancy details', 'Please enter breeding date and bull responsible.');
    return false;
  }
  if (eventType === 'Giving Birth' && !values.bullResponsible.trim()) {
    Alert.alert('Missing birth details', 'Please enter semen/tag number of bull responsible.');
    return false;
  }
  return true;
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">{text}</Text>;
}

function DateField({ value, placeholder, onPress }: { value: string; placeholder: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="h-[48px] flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
      <Text className={value ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{value || placeholder}</Text>
      <Feather name="calendar" size={18} color="#6B7280" />
    </Pressable>
  );
}

function parseDateForPicker(value: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatPickerDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function Input({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  editable = true,
}: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View className={`${multiline ? 'min-h-[100px]' : 'h-[48px]'} justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} multiline={multiline} editable={editable} className="text-[16px] text-[#1F2937]" />
    </View>
  );
}

function ConditionalInput({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  editable = true,
}: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  editable?: boolean;
}) {
  return (
    <View className="mt-3">
      <View className="h-[48px] justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} editable={editable} className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}

