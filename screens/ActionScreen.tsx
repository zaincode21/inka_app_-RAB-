import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Action'>;

export function ActionScreen({ navigation, route }: Props) {
  const { title, subtitle, saveLabel } = route.params;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">{title}</Text>
        <View className="w-6" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>
        {subtitle ? <Text className="text-[16px] text-[#4B5563]">{subtitle}</Text> : null}

        <View className="mt-6 gap-4">
          <Field placeholder="Title" />
          <Field placeholder="Description" multiline />
          <Field placeholder="Notes" multiline />
        </View>

        <Pressable className="mt-8 h-[56px] items-center justify-center rounded-[16px] bg-[#0A9A9D]" onPress={() => navigation.goBack()}>
          <Text className="text-[18px] font-bold text-white">{saveLabel}</Text>
        </Pressable>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}

function Field({ placeholder, multiline = false }: { placeholder: string; multiline?: boolean }) {
  return (
    <View className={`rounded-[16px] bg-[#EAF4F4] px-4 ${multiline ? 'py-4' : 'h-[56px]'} `}>
      <TextInput
        className="flex-1 text-[16px] text-[#1F2937]"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
      />
    </View>
  );
}
