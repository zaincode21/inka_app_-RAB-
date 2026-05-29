import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmSetup'>;

export function FarmSetupScreen({ navigation }: Props) {
  const cards = [
    { id: 'income', title: 'Income Categories', icon: 'dollar-sign' },
    { id: 'expense', title: 'Expense Categories', icon: 'trending-down' },
    { id: 'breed', title: 'Cattle Breeds', icon: 'git-branch' },
    { id: 'group', title: 'Cattle Groups', icon: 'layers' },
  ] as const;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Farm Setup</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6 pt-8">
        <View className="flex-row flex-wrap justify-between gap-y-6">
          {cards.map((card) => (
            <Pressable key={card.id} className="w-[47%] items-center rounded-[18px] bg-[#F5F7F7] px-4 py-6">
              <Feather name={card.icon} size={34} color="#0A9A9D" />
              <Text className="mt-4 text-center text-[15px] font-semibold text-[#0A9A9D]">{card.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}
