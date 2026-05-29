import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ navigation, route }: Props) {
  const { title, subtitle, details } = route.params;

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="bg-[#0A9A9D] px-6 pb-5 pt-14">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="arrow-left" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-center text-[24px] font-extrabold text-white">{title}</Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {subtitle ? <Text className="mb-4 text-[16px] text-[#4B5563]">{subtitle}</Text> : null}

        <View className="rounded-[20px] bg-white p-5">
          {details.map((item) => (
            <View key={item.label} className="mb-4 border-b border-[#E5E7EB] pb-4 last:border-b-0 last:pb-0">
              <Text className="text-[14px] text-[#6B7280]">{item.label}</Text>
              <Text className="mt-1 text-[18px] font-bold text-[#1F2937]">{item.value}</Text>
            </View>
          ))}
        </View>

        <Pressable className="mt-6 h-[56px] items-center justify-center rounded-[16px] bg-[#0A9A9D]" onPress={() => navigation.goBack()}>
          <Text className="text-[18px] font-bold text-white">Back</Text>
        </Pressable>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}
