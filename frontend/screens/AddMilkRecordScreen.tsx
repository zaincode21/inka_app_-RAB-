import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import { type Cattle, createMilkRecord, getCattle, parseNumber, todayIsoDate, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMilkRecord'>;

const milkTypes = ['Whole Farm', 'Individual Cow Milk'];

export function AddMilkRecordScreen({ navigation }: Props) {
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const [date, setDate] = useState(todayIsoDate());
  const [milkType, setMilkType] = useState('');
  const [selectedCow, setSelectedCow] = useState<Cattle | null>(null);
  const [cowSearch, setCowSearch] = useState('');
  const [showCowPicker, setShowCowPicker] = useState(false);
  const [amTotal, setAmTotal] = useState('');
  const [pmTotal, setPmTotal] = useState('');
  const [totalUsed, setTotalUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const totalProduced = parseNumber(amTotal) + parseNumber(pmTotal);
  const cowOptions = cattle.filter((animal) => {
    const query = cowSearch.trim().toLowerCase();
    const isFemaleCow = animal.gender.toLowerCase() === 'female' || ['Cow', 'Heifer'].includes(animal.stage);
    if (!isFemaleCow) {
      return false;
    }
    if (!query) {
      return true;
    }
    return `${animal.tagNumber} ${animal.name} ${animal.breed}`.toLowerCase().includes(query);
  });

  const saveRecord = async () => {
    if (!date.trim() || !milkType) {
      Alert.alert('Missing milk details', 'Milking date and milk type are required.');
      return;
    }

    if (milkType === 'Individual Cow Milk' && !selectedCow) {
      Alert.alert('Select cow', 'Please select the cow for this individual milk record.');
      return;
    }

    if (!amTotal.trim() && !pmTotal.trim()) {
      Alert.alert('Missing milk total', 'Please enter at least one milk total.');
      return;
    }

    try {
      await createMilkRecord({
        cattleId: milkType === 'Individual Cow Milk' ? selectedCow?.id ?? '' : '',
        cattleTag: milkType === 'Individual Cow Milk' ? selectedCow?.tagNumber ?? '' : '',
        cattleName: milkType === 'Individual Cow Milk' ? selectedCow?.name ?? '' : '',
        date: date.trim(),
        milkType,
        amTotal: parseNumber(amTotal),
        noonTotal: 0,
        pmTotal: parseNumber(pmTotal),
        totalProduced,
        totalUsed: parseNumber(totalUsed),
        rejectedMilk: 0,
        destination: '',
        buyer: '',
        pricePerLiter: 0,
        fatPercent: 0,
        proteinPercent: 0,
        somaticCellCount: 0,
        notes: notes.trim(),
      });
      navigation.replace('MilkRecords');
    } catch (error) {
      Alert.alert('Could not save milk record', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const timestamp = event.nativeEvent.timestamp;
    const pickedDate = selectedDate ?? (timestamp ? new Date(timestamp) : undefined);

    if (event.type === 'dismissed' || !pickedDate) {
      if (Platform.OS !== 'ios') {
        setShowDatePicker(false);
      }
      return;
    }

    setDate(formatPickerDate(pickedDate));
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">New Milk Record</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 24 }}>
        <Label text="Milking Date" />
        <DateField value={date} placeholder="Select milking date" onPress={() => setShowDatePicker(true)} />

        <SelectDropdown
          label="Milk Type"
          value={milkType}
          placeholder="Select"
          options={milkTypes}
          onSelect={(value) => {
            setMilkType(value);
            if (value !== 'Individual Cow Milk') {
              setSelectedCow(null);
              setCowSearch('');
            }
          }}
        />

        {milkType === 'Individual Cow Milk' ? (
          <>
            <Label text="Select Cow" />
            <CowField cow={selectedCow} onPress={() => setShowCowPicker(true)} />
          </>
        ) : null}

        <Label text="AM Total" />
        <Input placeholder="0.0" keyboardType="decimal-pad" value={amTotal} onChangeText={setAmTotal} />

        <Label text="PM Total" />
        <Input placeholder="0.0" keyboardType="decimal-pad" value={pmTotal} onChangeText={setPmTotal} />

        <Label text="Total Milk Produced" />
        <Input placeholder="0.0" value={totalProduced.toFixed(1)} onChangeText={() => {}} editable={false} />

        <Label text="Total Used" />
        <Input placeholder="0.0" keyboardType="decimal-pad" value={totalUsed} onChangeText={setTotalUsed} />

        <Label text="Notes" />
        <Input placeholder="Write something" multiline value={notes} onChangeText={setNotes} />
      </ScrollView>

      <View className="flex-row bg-white px-6 py-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
          <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
        </Pressable>
        <Pressable onPress={saveRecord} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
          <Text className="text-[16px] font-bold text-white">Save</Text>
        </Pressable>
      </View>

      {showDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker value={parseDateForPicker(date)} mode="date" display="calendar" onChange={handleDateChange} />
      ) : null}

      <Modal visible={showDatePicker && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowDatePicker(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">Milking Date</Text>
              <Pressable onPress={() => setShowDatePicker(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <DateTimePicker value={parseDateForPicker(date)} mode="date" display="inline" themeVariant="light" onChange={handleDateChange} style={{ height: 330, width: '100%' }} />
            <Pressable onPress={() => setShowDatePicker(false)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCowPicker} transparent animationType="fade" onRequestClose={() => setShowCowPicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowCowPicker(false)}>
          <Pressable className="max-h-[80%] rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">Select Cow</Text>
              <Pressable onPress={() => setShowCowPicker(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <View className="mb-4 h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
              <Feather name="search" size={18} color="#6B7280" />
              <TextInput value={cowSearch} onChangeText={setCowSearch} placeholder="Search by tag, name, or breed" placeholderTextColor="#6B7280" className="ml-3 flex-1 text-[16px] text-[#1F2937]" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cowOptions.length === 0 ? (
                <Text className="py-6 text-center text-[14px] text-[#6B7280]">No cows found</Text>
              ) : (
                cowOptions.map((cow) => {
                  const selected = selectedCow?.id === cow.id;
                  return (
                    <Pressable
                      key={cow.id}
                      onPress={() => {
                        setSelectedCow(cow);
                        setCowSearch('');
                        setShowCowPicker(false);
                      }}
                      className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#008B8B] bg-[#E0F7F7]' : 'border-[#E5E7EB] bg-white'}`}
                    >
                      <View className="flex-1">
                        <Text className={`text-[16px] ${selected ? 'font-bold text-[#008B8B]' : 'font-bold text-[#1F2937]'}`}>{cow.tagNumber}</Text>
                        <Text className="mt-1 text-[13px] text-[#6B7280]">{cow.name} • {cow.breed} • {cow.stage}</Text>
                      </View>
                      {selected ? <Feather name="check" size={18} color="#008B8B" /> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
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

function CowField({ cow, onPress }: { cow: Cattle | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="h-[48px] flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
      <Text className={cow ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>
        {cow ? `${cow.tagNumber} - ${cow.name}` : 'Search and select cow'}
      </Text>
      <Feather name="search" size={18} color="#6B7280" />
    </Pressable>
  );
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

function parseDateForPicker(value: string): Date {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatPickerDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

