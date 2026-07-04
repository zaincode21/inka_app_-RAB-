import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Pressable, Text, useWindowDimensions, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import Logo from '../components/Logo';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { height, width } = useWindowDimensions();
  const isCompact = height < 700 || width < 360;
  const logoFrameSize = isCompact ? 150 : 190;
  const logoSize = isCompact ? 118 : 150;

  return (
    <ImageBackground source={require('../assets/landing-bull.png')} resizeMode="cover" className="flex-1 bg-[#111316]">
      <View className="absolute inset-0 bg-black/55" />
      <View className="absolute -bottom-[60px] left-[-20px] right-[-20px] h-[240px] rounded-t-[180px] bg-black/50" />

      <View className={`flex-1 items-center justify-between px-7 pb-9 ${isCompact ? 'pt-14' : 'pt-24'}`}>
        <View className="items-center justify-center rounded-full bg-black/20" style={{ height: logoFrameSize, width: logoFrameSize }}>
          <Logo width={logoSize} height={logoSize} />
        </View>

        <View className={`${isCompact ? 'mt-5' : 'mt-9'} items-center`}>
          <Text className={`${isCompact ? 'text-[36px] leading-[40px]' : 'text-[42px] leading-[46px]'} text-center font-extrabold tracking-[-1.3px] text-white`}>
            Inka <Text className="text-[#E6B86F]">App</Text>
          </Text>
          <View className="mt-[18px] items-center gap-0.5">
            <Text className="text-center text-[16px] font-bold leading-6 text-[#F6F3ED]">Your Smart Dairy & Beef</Text>
            <Text className="text-center text-[16px] font-bold leading-6 text-[#F6F3ED]">Farming Companion.</Text>
          </View>
        </View>

        <View className="w-full gap-4 pb-3">
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-[54px] items-center justify-center rounded-[18px] bg-[#0D8A8D] pressed:opacity-90 pressed:scale-[0.99]"
          >
            <Text className="text-[16px] font-bold text-white">Sign in</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-[54px] items-center justify-center rounded-[18px] bg-[#E6B86F] pressed:opacity-90 pressed:scale-[0.99]"
          >
            <Text className="text-[16px] font-bold text-white">Create account</Text>
          </Pressable>
        </View>
      </View>

      <StatusBar style="light" />
    </ImageBackground>
  );
}