import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { login } from '../data/authApi';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('login.missingTitle'), t('login.missingBody'));
      return;
    }

    try {
      setSubmitting(true);
      await login(email.trim(), password);
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert(t('login.failedTitle'), error instanceof Error ? error.message : 'Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardSafeScroll
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 96, paddingBottom: 40 }}
    >
        <Pressable onPress={() => navigation.goBack()} className="self-start pb-4">
          <Text className="text-[16px] font-semibold text-[#0D8A8D]">{t('common.back')}</Text>
        </Pressable>

        <View className="mt-6 items-center">
          <Text className="text-center text-[24px] font-extrabold tracking-[-0.8px] text-[#111111]">{t('login.title')}</Text>
          <Text className="mt-3 text-center text-[14px] text-[#222222]">{t('login.subtitle')}</Text>
        </View>

        <View className="mt-12 gap-5">
          <View className="gap-3">
            <Text className="text-[14px] font-medium text-[#111111]">{t('login.email')}</Text>
            <View className="h-[52px] flex-row items-center rounded-[16px] bg-[#DDEFF0] px-4">
              <Feather name="user" size={16} color="#8A8A8A" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="ml-3 flex-1 text-[16px] text-[#111111]"
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor="#8A8A8A"
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email or username"
              />
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-[14px] font-medium text-[#111111]">{t('login.password')}</Text>
            <View className="h-[52px] flex-row items-center rounded-[16px] bg-[#DDEFF0] px-4">
              <Feather name="lock" size={16} color="#8A8A8A" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                className="ml-3 flex-1 text-[16px] text-[#111111]"
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor="#8A8A8A"
                secureTextEntry={!showPassword}
                accessibilityLabel="Password"
              />
              <Pressable accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setShowPassword((s) => !s)}>
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={16} color="#8A8A8A" />
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="self-end"
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text className="text-[14px] font-semibold text-[#0D8A8D]">{t('login.forgotPassword')}</Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={submitting}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="h-[52px] items-center justify-center rounded-[16px] bg-[#35A8AA] pressed:opacity-90 pressed:scale-[0.99]"
          >
            <Text className="text-[18px] font-bold text-white">{submitting ? t('login.submitting') : t('login.submit')}</Text>
          </Pressable>

          <View className="flex-row justify-center pt-2">
            <Text className="text-[14px] text-[#222222]">Don’t have an account? </Text>
            <Pressable accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => navigation.navigate('SignUp')}>
              <Text className="text-[14px] font-bold text-[#0D8A8D]">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      <StatusBar style="dark" />
    </KeyboardSafeScroll>
  );
}
