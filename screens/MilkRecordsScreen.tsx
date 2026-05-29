import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MilkRecords'>;

export function MilkRecordsScreen({ navigation }: Props) {
  const records = [
    { id: '1', cow: 'Cow 101', date: 'May 29, 2026', amount: '12.4 L' },
    { id: '2', cow: 'Cow 117', date: 'May 28, 2026', amount: '10.8 L' },
    { id: '3', cow: 'Cow 220', date: 'May 28, 2026', amount: '14.1 L' },
  ];

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Milk Records</Text>
        <View className="w-6" />
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Detail', {
                title: item.cow,
                subtitle: 'Milk record details',
                details: [
                  { label: 'Date', value: item.date },
                  { label: 'Amount', value: item.amount },
                  { label: 'Recorded By', value: 'Farm staff' },
                ],
              })
            }
            className="mb-4 rounded-[18px] bg-[#F5F7F7] px-4 py-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">{item.cow}</Text>
              <Text className="text-[15px] font-semibold text-[#0A9A9D]">{item.amount}</Text>
            </View>
            <Text className="mt-1 text-[14px] text-[#4B5563]">Recorded on {item.date}</Text>
          </Pressable>
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('AddMilkRecord')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#0A9A9D] shadow-lg"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}
