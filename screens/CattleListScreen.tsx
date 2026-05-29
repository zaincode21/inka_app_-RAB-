import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CattleList'>;

export function CattleListScreen({ navigation }: Props) {
  const cattle = [
    { id: '1', name: 'Cow 101', breed: 'Friesian', group: 'Dairy' },
    { id: '2', name: 'Cow 117', breed: 'Jersey', group: 'Calving' },
    { id: '3', name: 'Bull 12', breed: 'Ankole', group: 'Breeding' },
  ];

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Cattle List</Text>
        <View className="w-6" />
      </View>

      <FlatList
        data={cattle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Detail', {
                title: item.name,
                subtitle: 'Cattle details',
                details: [
                  { label: 'Breed', value: item.breed },
                  { label: 'Group', value: item.group },
                  { label: 'Status', value: 'Healthy' },
                ],
              })
            }
            className="mb-4 rounded-[18px] bg-[#F5F7F7] px-4 py-4"
          >
            <Text className="text-[18px] font-bold text-[#1F2937]">{item.name}</Text>
            <Text className="mt-1 text-[14px] text-[#4B5563]">Breed: {item.breed}</Text>
            <Text className="mt-1 text-[14px] text-[#4B5563]">Group: {item.group}</Text>
          </Pressable>
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate('Action', {
            title: 'Add Cattle',
            subtitle: 'Create a new cattle record',
            saveLabel: 'Save Cattle',
          })
        }
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#0A9A9D] shadow-lg"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}
