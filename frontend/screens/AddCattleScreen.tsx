import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { createCattle, getCategories, parseNumber, todayIsoDate, updateCattle, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCattle'>;

const genderOptions = ['Male', 'Female'];
const defaultBreedOptions = ['Ayrshire', 'Friesian', 'Guernsey', 'Jersey'];
const createNewBreedOption = 'Create New Breed';
const stageOptions = ['Calf', 'Weaner', 'Steer', 'Bull'];
const obtainedOptions = ['Born on farm', 'Purchased', 'Other'];
const defaultGroupOptions = ['Milking Cows', 'Dry Cows', 'Calves', 'Bulls'];
const motherTagOptions = ['UK 722212 123 (Bessie)', 'UK 722212 124 (Daisy)', 'UK 722212 126 (Molly)'];
const fatherTagOptions = ["UK 722212 125 (Bella's Sire)", 'UK 722212 199 (Max)'];

export function AddCattleScreen({ navigation, route }: Props) {
  const editingCattle = route.params?.cattle;
  const isEditing = Boolean(editingCattle);
  const { data: categories } = useDatabaseQuery(() => getCategories(), []);
  const breedOptions = useMemo(() => {
    const categoryBreeds = categories.filter((category) => category.kind === 'breed').map((category) => category.name);
    return [...new Set([...defaultBreedOptions, ...categoryBreeds]), createNewBreedOption];
  }, [categories]);
  const groupOptions = useMemo(() => {
    const categoryGroups = categories.filter((category) => category.kind === 'group').map((category) => category.name);
    return [...new Set([...defaultGroupOptions, ...categoryGroups])];
  }, [categories]);
  const [breed, setBreed] = useState(editingCattle?.breed ?? '');
  const [gender, setGender] = useState(editingCattle?.gender ?? '');
  const [stage, setStage] = useState(editingCattle?.stage ?? '');
  const [group, setGroup] = useState(editingCattle?.groupName ?? '');
  const [obtained, setObtained] = useState(editingCattle?.source ?? '');
  const [motherTag, setMotherTag] = useState(editingCattle?.motherTag ?? '');
  const [fatherTag, setFatherTag] = useState(editingCattle?.fatherTag ?? '');
  const [tagNumber, setTagNumber] = useState(editingCattle?.tagNumber ?? '');
  const [name, setName] = useState(editingCattle?.name ?? '');
  const [weight, setWeight] = useState(editingCattle?.weightKg ? `${editingCattle.weightKg}` : '');
  const [dateOfBirth, setDateOfBirth] = useState(editingCattle?.dateOfBirth ?? '');
  const [entryDate, setEntryDate] = useState(editingCattle?.entryDate || todayIsoDate());
  const [otherSource, setOtherSource] = useState(editingCattle?.sourceDetail ?? '');
  const [notes, setNotes] = useState(editingCattle?.notes ?? '');
  const [showOtherSource, setShowOtherSource] = useState(editingCattle?.source === 'Other');
  const [newBreedName, setNewBreedName] = useState('');
  const [showCreateBreedDialog, setShowCreateBreedDialog] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState<null | 'dateOfBirth' | 'entryDate'>(null);
  const [activePicker, setActivePicker] = useState<null | {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
  }>(null);

  const otherSourceVisible = useMemo(() => obtained === 'Other' || showOtherSource, [obtained, showOtherSource]);

  const saveCattle = async () => {
    if (!tagNumber.trim() || !name.trim() || !breed || breed === createNewBreedOption || !gender || !stage || !obtained) {
      Alert.alert('Missing cattle details', 'Tag number, name, breed, gender, cattle stage, and how obtained are required.');
      return;
    }

    if (obtained === 'Other' && !otherSource.trim()) {
      Alert.alert('Missing source', 'Please specify the source.');
      return;
    }

    try {
      const cattlePayload = {
        tagNumber: tagNumber.trim(),
        name: name.trim(),
        breed,
        gender,
        stage,
        status: 'Active',
        groupName: group,
        dateOfBirth: dateOfBirth.trim(),
        entryDate: entryDate.trim() || todayIsoDate(),
        weightKg: parseNumber(weight),
        bodyConditionScore: 0,
        officialId: '',
        rfid: '',
        colorMarkings: '',
        source: obtained,
        sourceDetail: otherSource.trim(),
        purchasePrice: 0,
        paddock: '',
        lactationNumber: 0,
        parity: 0,
        reproductiveStatus: 'Not applicable',
        motherTag: motherTag.trim(),
        fatherTag: fatherTag.trim(),
        notes: notes.trim(),
        photoUri: '',
      };

      if (editingCattle) {
        await updateCattle(editingCattle.id, cattlePayload);
      } else {
        await createCattle(cattlePayload);
      }
      navigation.navigate('CattleList');
    } catch (error) {
      Alert.alert(isEditing ? 'Could not update cattle' : 'Could not save cattle', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  const saveNewBreed = async () => {
    const trimmedBreed = newBreedName.trim();
    if (!trimmedBreed) {
      Alert.alert('Missing breed name', 'Please enter breed name.');
      return;
    }

    if (breedOptions.includes(trimmedBreed)) {
      Alert.alert('Breed exists', 'Breed already exists.');
      return;
    }

    setBreed(trimmedBreed);
    setNewBreedName('');
    setShowCreateBreedDialog(false);
  };

  const selectedPickerDate = parseDateForPicker(activeDatePicker === 'dateOfBirth' ? dateOfBirth : entryDate);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const pickerField = activeDatePicker;
    const timestamp = event.nativeEvent.timestamp;
    const date = selectedDate ?? (timestamp ? new Date(timestamp) : undefined);

    if (!pickerField || event.type === 'dismissed' || !date) {
      if (Platform.OS !== 'ios') {
        setActiveDatePicker(null);
      }
      return;
    }

    const formattedDate = formatPickerDate(date);
    if (pickerField === 'dateOfBirth') {
      setDateOfBirth(formattedDate);
    } else {
      setEntryDate(formattedDate);
    }

    if (Platform.OS !== 'ios') {
      setActiveDatePicker(null);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[20px] font-bold text-white">{isEditing ? 'Edit Cattle' : 'Add Cattle'}</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <SelectField
            label="Breed"
            value={breed}
            placeholder="Select breed"
            onPress={() =>
              setActivePicker({
                label: 'Breed',
                value: breed,
                options: breedOptions,
                onSelect: (value) => {
                  if (value === createNewBreedOption) {
                    setBreed('');
                    setShowCreateBreedDialog(true);
                    return;
                  }
                  setBreed(value);
                },
              })
            }
          />
          <InputField label="Tag Number" placeholder="Enter tag number" value={tagNumber} onChangeText={setTagNumber} />
          <InputField label="Name" placeholder="Enter cattle name" value={name} onChangeText={setName} />
          <SelectField label="Gender" value={gender} placeholder="Select gender" onPress={() => setActivePicker({ label: 'Gender', value: gender, options: genderOptions, onSelect: setGender })} />
          <SelectField label="Cattle Stage" value={stage} placeholder="Select cattle stage" onPress={() => setActivePicker({ label: 'Cattle Stage', value: stage, options: stageOptions, onSelect: setStage })} />
          <InputField label="Weight" placeholder="Enter weight" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
          <DateField label="Date of Birth" value={dateOfBirth} placeholder="Enter date of birth" onPress={() => setActiveDatePicker('dateOfBirth')} />
          <DateField label="Farm Entry Date" value={entryDate} placeholder="Enter entry date" onPress={() => setActiveDatePicker('entryDate')} />
          <SelectField label="Cattle Group" value={group} placeholder="Select group (optional)" onPress={() => setActivePicker({ label: 'Cattle Group', value: group, options: groupOptions, onSelect: setGroup })} />
          <SelectField
            label="How Obtained"
            value={obtained}
            placeholder="Select how obtained"
            onPress={() =>
              setActivePicker({
                label: 'How Obtained',
                value: obtained,
                options: obtainedOptions,
                onSelect: (value) => {
                  setObtained(value);
                  setShowOtherSource(value === 'Other');
                },
              })
            }
          />

          {otherSourceVisible ? <InputField label="Other Source" placeholder="Enter source" value={otherSource} onChangeText={setOtherSource} /> : null}
          <SelectField label="Mother's Tag No" value={motherTag} placeholder="Select mother tag" onPress={() => setActivePicker({ label: "Mother's Tag No", value: motherTag, options: motherTagOptions, onSelect: setMotherTag })} />
          <SelectField label="Father's Tag No" value={fatherTag} placeholder="Select father tag" onPress={() => setActivePicker({ label: "Father's Tag No", value: fatherTag, options: fatherTagOptions, onSelect: setFatherTag })} />
          <MultilineField label="Notes" placeholder="Write something" value={notes} onChangeText={setNotes} />

          <Pressable className="mt-5 h-32 items-center justify-center rounded-[18px] border-2 border-dashed border-[#B7D9D9] bg-[#F5FBFB]">
            <Feather name="camera" size={24} color="#008B8B" />
            <Text className="mt-2 text-[12px] text-[#008B8B]">Tap to add photo</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="flex-row border-t border-[#EEF2F3] bg-white px-6 py-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3"
        >
          <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={saveCattle}
          className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3"
        >
          <Text className="text-[16px] font-bold text-white">{isEditing ? 'Update' : 'Save'}</Text>
        </Pressable>
      </View>

      <Modal visible={activePicker !== null} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setActivePicker(null)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">{activePicker?.label ?? 'Select'}</Text>
              <Pressable onPress={() => setActivePicker(null)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activePicker?.options.map((option) => {
                const selected = option === activePicker.value;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      activePicker.onSelect(option);
                      setActivePicker(null);
                    }}
                    className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#008B8B] bg-[#E0F7F7]' : 'border-[#E5E7EB] bg-white'}`}
                  >
                    <Text className={`text-[16px] ${selected ? 'font-bold text-[#008B8B]' : 'text-[#1F2937]'}`}>{option}</Text>
                    {selected ? <Feather name="check" size={18} color="#008B8B" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCreateBreedDialog} transparent animationType="fade" onRequestClose={() => setShowCreateBreedDialog(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/40 px-8" onPress={() => setShowCreateBreedDialog(false)}>
          <Pressable className="w-full rounded-[20px] bg-white p-5" onPress={() => {}}>
            <Text className="text-[18px] font-bold text-[#1F2937]">Add Cattle Breed</Text>
            <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">Cattle Breed Name</Text>
            <View className="h-12 justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
              <TextInput value={newBreedName} onChangeText={setNewBreedName} placeholder="Enter cattle breed name" placeholderTextColor="#6B7280" className="text-[16px] text-[#1F2937]" />
            </View>

            <View className="mt-5 flex-row">
              <Pressable
                onPress={() => {
                  setNewBreedName('');
                  setShowCreateBreedDialog(false);
                }}
                className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3"
              >
                <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
              </Pressable>
              <Pressable onPress={saveNewBreed} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
                <Text className="text-[16px] font-bold text-white">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {activeDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker value={selectedPickerDate} mode="date" display="calendar" onChange={handleDateChange} />
      ) : null}

      <Modal visible={activeDatePicker !== null && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setActiveDatePicker(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setActiveDatePicker(null)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">{activeDatePicker === 'dateOfBirth' ? 'Date of Birth' : 'Farm Entry Date'}</Text>
              <Pressable onPress={() => setActiveDatePicker(null)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <DateTimePicker
              value={selectedPickerDate}
              mode="date"
              display="inline"
              themeVariant="light"
              onChange={handleDateChange}
              style={{ height: 330, width: '100%' }}
            />
            <Pressable onPress={() => setActiveDatePicker(null)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <View className="h-12 justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}

function DateField({ label, value, placeholder, onPress }: { label: string; value: string; placeholder: string; onPress: () => void }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <Pressable onPress={onPress} className="h-12 flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4">
        <Text className={value ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{value || placeholder}</Text>
        <Feather name="calendar" size={18} color="#6B7280" />
      </Pressable>
    </View>
  );
}

function MultilineField({ label, placeholder, value, onChangeText }: { label: string; placeholder: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <View className="min-h-[100px] justify-start rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" multiline className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <Pressable onPress={onPress} className="h-12 flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4">
        <Text className={value ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{value || placeholder}</Text>
        <Feather name="chevron-down" size={18} color="#6B7280" />
      </Pressable>
    </View>
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
