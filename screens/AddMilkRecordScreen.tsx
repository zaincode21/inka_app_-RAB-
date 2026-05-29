import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMilkRecord'>;

const milkTypes = ['Morning', 'Noon', 'Evening'];

export function AddMilkRecordScreen({ navigation }: Props) {
  const [milkType, setMilkType] = useState('');

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">New Milk Record</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 24 }}>
        <Label text="Milking Date" />
        <Input placeholder="Select milking date" />

        <SelectDropdown label="Milk Type" value={milkType} placeholder="Select" options={milkTypes} onSelect={setMilkType} />

        <Label text="AM Total" />
        <Input placeholder="0.0" keyboardType="decimal-pad" />

        <Label text="Noon Total" />
        <Input placeholder="0.0" keyboardType="decimal-pad" />

        <Label text="PM Total" />
        <Input placeholder="0.0" keyboardType="decimal-pad" />

        <Label text="Total Milk Produced" />
        <Input placeholder="0.0" editable={false} />

        <Label text="Total Used" />
        <Input placeholder="0.0" keyboardType="decimal-pad" />

        <Label text="Notes" />
        <Input placeholder="Write something" multiline />
      </ScrollView>

      <View className="flex-row bg-white px-6 py-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[14px] bg-[#F1F5F5] py-3">
          <Text className="text-[16px] font-bold text-[#0A9A9D]">Cancel</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('MilkRecords')} className="ml-2 flex-1 items-center justify-center rounded-[14px] bg-[#0A9A9D] py-3">
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

