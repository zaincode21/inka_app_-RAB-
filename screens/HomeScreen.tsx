import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import Logo from '../components/Logo';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-[#111316]">
      <View className="absolute -top-[120px] left-[-60px] right-[-60px] h-[260px] rounded-b-[180px] bg-[#1F2529] opacity-95" />
      <View className="absolute top-[150px] self-center h-[260px] w-[260px] rounded-[260px] bg-[#2E3438] opacity-30" />
      <View className="absolute -bottom-[60px] left-[-20px] right-[-20px] h-[240px] rounded-t-[180px] bg-[#1A1A1A] opacity-90" />

      <View className="absolute inset-0 bg-black/35" />

      <View className="flex-1 items-center justify-between px-7 pb-9 pt-24">
        <View className="h-[190px] w-[190px] items-center justify-center rounded-full bg-black/20">
          <Logo width={150} height={150} />
        </View>

        <View className="mt-9 items-center">
          <Text className="text-center text-[42px] font-extrabold leading-[46px] tracking-[-1.3px] text-white">
            Inka <Text className="text-[#E6B86F]">App</Text>
          </Text>
          <View className="mt-[18px] items-center gap-0.5">
            <Text className="text-center text-[24px] font-bold leading-8 text-[#F6F3ED]">Your Smart Dairy & Beef</Text>
            <Text className="text-center text-[24px] font-bold leading-8 text-[#F6F3ED]">Farming Companion.</Text>
          </View>
        </View>

        <View className="w-full gap-4 pb-3">
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-[54px] items-center justify-center rounded-[18px] bg-[#0D8A8D] pressed:opacity-90 pressed:scale-[0.99]"
          >
            <Text className="text-[18px] font-bold text-white">Sign in</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-[54px] items-center justify-center rounded-[18px] bg-[#E6B86F] pressed:opacity-90 pressed:scale-[0.99]"
          >
            <Text className="text-[18px] font-bold text-white">Create account</Text>
          </Pressable>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}