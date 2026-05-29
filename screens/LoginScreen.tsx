import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View className="flex-1 bg-white px-7 pt-24">
      <Pressable onPress={() => navigation.goBack()} className="self-start pb-4">
        <Text className="text-[16px] font-semibold text-[#0D8A8D]">Back</Text>
      </Pressable>

      <View className="mt-6 items-center">
        <Text className="text-center text-[34px] font-extrabold tracking-[-0.8px] text-[#111111]">Welcome Back</Text>
        <Text className="mt-3 text-center text-[18px] text-[#222222]">Login to your account</Text>
      </View>

      <View className="mt-12 gap-5">
        <View className="gap-3">
          <Text className="text-[16px] font-medium text-[#111111]">Email/Username</Text>
          <View className="h-[52px] flex-row items-center rounded-[16px] bg-[#DDEFF0] px-4">
            <Feather name="user" size={16} color="#8A8A8A" />
            <TextInput
              className="ml-3 flex-1 text-[16px] text-[#111111]"
              placeholder="Enter your email or username"
              placeholderTextColor="#8A8A8A"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email or username"
            />
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-[16px] font-medium text-[#111111]">Password</Text>
          <View className="h-[52px] flex-row items-center rounded-[16px] bg-[#DDEFF0] px-4">
            <Feather name="lock" size={16} color="#8A8A8A" />
            <TextInput
              className="ml-3 flex-1 text-[16px] text-[#111111]"
              placeholder="Enter password"
              placeholderTextColor="#8A8A8A"
              secureTextEntry={!showPassword}
              accessibilityLabel="Password"
            />
            <Pressable accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setShowPassword((s) => !s)}>
              <Feather name={showPassword ? 'eye' : 'eye-off'} size={16} color="#8A8A8A" />
            </Pressable>
          </View>
        </View>

        <Pressable accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="self-end">
          <Text className="text-[15px] font-semibold text-[#0D8A8D]">Forgot Password?</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.replace('Dashboard')}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="h-[52px] items-center justify-center rounded-[16px] bg-[#35A8AA] pressed:opacity-90 pressed:scale-[0.99]"
        >
          <Text className="text-[18px] font-bold text-white">Login</Text>
        </Pressable>

        <View className="flex-row justify-center pt-2">
          <Text className="text-[15px] text-[#222222]">Don’t have an account? </Text>
          <Pressable accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => navigation.navigate('SignUp')}>
            <Text className="text-[15px] font-bold text-[#0D8A8D]">Sign Up</Text>
          </Pressable>
        </View>
      </View>

      <StatusBar style="dark" />
    </View>
  );
}