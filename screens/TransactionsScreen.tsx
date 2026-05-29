import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

export function TransactionsScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Transactions</Text>
        <View className="flex-row gap-4">
          <Feather name="search" size={22} color="#FFFFFF" />
          <Feather name="more-horizontal" size={22} color="#FFFFFF" />
        </View>
      </View>

      <View className="flex-row px-6 py-4">
        <Pressable onPress={() => navigation.navigate('AddIncome')} className="mr-2 flex-1 flex-row items-center justify-center rounded-[16px] bg-[#0A9A9D] px-4 py-3">
          <Feather name="dollar-sign" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-[16px] font-bold text-white">Income</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('AddExpense')} className="ml-2 flex-1 flex-row items-center justify-center rounded-[16px] bg-[#E5F2F3] px-4 py-3">
          <Feather name="minus-circle" size={18} color="#0A9A9D" />
          <Text className="ml-2 text-[16px] font-bold text-[#0A9A9D]">Expense</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 140 }}>
        <View className="items-center justify-center pt-20">
          <Text className="text-center text-[16px] text-[#0A9A9D]">No income records yet</Text>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('AddIncome')}
        className="absolute bottom-24 right-6 flex-row items-center rounded-full bg-[#0A9A9D] px-5 py-4 shadow-lg"
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
        <Text className="ml-2 text-[16px] font-bold text-white">Income</Text>
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}
