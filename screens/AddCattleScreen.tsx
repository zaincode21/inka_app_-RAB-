import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCattle'>;

const breedOptions = ['Friesian', 'Jersey', 'Ankole', 'Crossbreed'];
const genderOptions = ['Male', 'Female'];
const stageOptions = ['Calf', 'Heifer', 'Cow', 'Bull'];
const groupOptions = ['Dairy', 'Breeding', 'Calving', 'Young stock'];
const obtainedOptions = ['Born on farm', 'Purchased', 'Gift', 'Other'];
const tagOptions = ['Tag 001', 'Tag 002', 'Tag 003', 'Tag 004'];

export function AddCattleScreen({ navigation }: Props) {
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [stage, setStage] = useState('');
  const [group, setGroup] = useState('');
  const [obtained, setObtained] = useState('');
  const [motherTag, setMotherTag] = useState('');
  const [fatherTag, setFatherTag] = useState('');
  const [showOtherSource, setShowOtherSource] = useState(false);
  const [activePicker, setActivePicker] = useState<null | {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
  }>(null);

  const otherSourceVisible = useMemo(() => obtained === 'Other' || showOtherSource, [obtained, showOtherSource]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[20px] font-bold text-white">Add Cattle</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <SelectField label="Breed" value={breed} placeholder="Select breed" onPress={() => setActivePicker({ label: 'Breed', value: breed, options: breedOptions, onSelect: setBreed })} />
          <InputField label="Tag Number" placeholder="Enter tag number" />
          <InputField label="Name" placeholder="Enter cattle name" />
          <SelectField label="Gender" value={gender} placeholder="Select gender" onPress={() => setActivePicker({ label: 'Gender', value: gender, options: genderOptions, onSelect: setGender })} />
          <SelectField label="Cattle Stage" value={stage} placeholder="Select cattle stage" onPress={() => setActivePicker({ label: 'Cattle Stage', value: stage, options: stageOptions, onSelect: setStage })} />
          <InputField label="Weight" placeholder="Enter weight" keyboardType="decimal-pad" />
          <InputField label="Date of Birth" placeholder="Enter date of birth" />
          <InputField label="Farm Entry Date" placeholder="Enter entry date" />
          <SelectField label="Group" value={group} placeholder="Select group" onPress={() => setActivePicker({ label: 'Group', value: group, options: groupOptions, onSelect: setGroup })} />
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

          {otherSourceVisible ? <InputField label="Other Source" placeholder="Enter source" /> : null}

          <SelectField label="Mother's Tag No" value={motherTag} placeholder="Select mother tag" onPress={() => setActivePicker({ label: "Mother's Tag No", value: motherTag, options: tagOptions, onSelect: setMotherTag })} />
          <SelectField label="Father's Tag No" value={fatherTag} placeholder="Select father tag" onPress={() => setActivePicker({ label: "Father's Tag No", value: fatherTag, options: tagOptions, onSelect: setFatherTag })} />
          <MultilineField label="Notes" placeholder="Write something" />

          <Pressable className="mt-5 h-32 items-center justify-center rounded-[18px] border-2 border-dashed border-[#B7D9D9] bg-[#F5FBFB]">
            <Feather name="camera" size={24} color="#0A9A9D" />
            <Text className="mt-2 text-[12px] text-[#0A9A9D]">Tap to add photo</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="flex-row border-t border-[#EEF2F3] bg-white px-6 py-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="mr-2 flex-1 items-center justify-center rounded-[14px] border border-[#0A9A9D] bg-white py-3"
        >
          <Text className="text-[16px] font-bold text-[#0A9A9D]">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('CattleList')}
          className="ml-2 flex-1 items-center justify-center rounded-[14px] bg-[#0A9A9D] py-3"
        >
          <Text className="text-[16px] font-bold text-white">Save</Text>
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
                    className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#0A9A9D] bg-[#EAF8F8]' : 'border-[#E5E7EB] bg-white'}`}
                  >
                    <Text className={`text-[16px] ${selected ? 'font-bold text-[#0A9A9D]' : 'text-[#1F2937]'}`}>{option}</Text>
                    {selected ? <Feather name="check" size={18} color="#0A9A9D" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function InputField({ label, placeholder, keyboardType = 'default' }: { label: string; placeholder: string; keyboardType?: 'default' | 'decimal-pad' }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <View className="h-12 justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
        <TextInput placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}

function MultilineField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <View className="min-h-[100px] justify-start rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
        <TextInput placeholder={placeholder} placeholderTextColor="#6B7280" multiline className="text-[16px] text-[#1F2937]" />
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
