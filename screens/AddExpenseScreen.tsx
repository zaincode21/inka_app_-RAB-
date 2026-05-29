import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const expenseTypes = ['Feed', 'Vet', 'Transport', 'Other'];

export function AddExpenseScreen({ navigation }: Props) {
  const [expenseType, setExpenseType] = useState('');

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">New Expense</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Field label="Date" placeholder="Select expense date" />

        <SelectDropdown label="Expense Type" value={expenseType} placeholder="Select" options={expenseTypes} onSelect={setExpenseType} />

        {expenseType === 'Other' ? <Field label="Expense Name" placeholder="Enter name of expense" /> : null}

        <Field label="Amount" placeholder="Enter amount spent" keyboardType="decimal-pad" />
        <Field label="Receipt No" placeholder="Enter receipt number" />
        <Field label="Notes" placeholder="Write something" multiline />
      </ScrollView>

      <View className="px-6 pb-6">
        <Pressable onPress={() => navigation.navigate('ManageExpenses')} className="h-[56px] items-center justify-center rounded-[16px] bg-[#0A9A9D]">
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

function Field({ label, placeholder, keyboardType = 'default', multiline = false }: { label: string; placeholder: string; keyboardType?: 'default' | 'decimal-pad'; multiline?: boolean }) {
  return (
    <View>
      <Label text={label} />
      <View className={`${multiline ? 'min-h-[120px]' : 'h-[48px]'} justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
        <TextInput placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} multiline={multiline} className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}

