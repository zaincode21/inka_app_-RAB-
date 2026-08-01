import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { requestPasswordReset } from '../data/authApi';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter the email for your account.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await requestPasswordReset(email.trim());
      setDevToken(result.devResetToken ?? null);
      setSent(true);
    } catch (error) {
      Alert.alert('Could not send reset', error instanceof Error ? error.message : 'Please try again.');
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
        <Text className="text-[16px] font-semibold text-[#0D8A8D]">Back</Text>
      </Pressable>

      <View className="mt-6 items-center">
        <Text className="text-center text-[24px] font-extrabold tracking-[-0.8px] text-[#111111]">Forgot Password</Text>
        <Text className="mt-3 text-center text-[14px] text-[#222222]">
          {sent
            ? 'If an account exists for that email, a reset code was sent. Check your inbox or the server log in development.'
            : 'Enter your account email and we will send a one-time reset code.'}
        </Text>
      </View>

      {!sent ? (
        <View className="mt-12 gap-5">
          <View className="gap-3">
            <Text className="text-[14px] font-medium text-[#111111]">Email</Text>
            <View className="h-[52px] flex-row items-center rounded-[16px] bg-[#DDEFF0] px-4">
              <Feather name="mail" size={16} color="#8A8A8A" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="ml-3 flex-1 text-[16px] text-[#111111]"
                placeholder="you@example.com"
                placeholderTextColor="#8A8A8A"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <Pressable
            onPress={() => void handleSubmit()}
            disabled={submitting}
            className="h-[52px] items-center justify-center rounded-[16px] bg-[#35A8AA]"
          >
            <Text className="text-[18px] font-bold text-white">{submitting ? 'Sending...' : 'Send reset code'}</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-12 gap-4">
          {devToken ? (
            <View className="rounded-[16px] border border-[#E6B86F] bg-[#FFF8EB] px-4 py-4">
              <Text className="text-[13px] font-semibold text-[#92400E]">Development reset code</Text>
              <Text selectable className="mt-2 text-[12px] text-[#78350F]">
                {devToken}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() =>
              navigation.navigate('ResetPassword', {
                token: devToken ?? undefined,
                email: email.trim(),
              })
            }
            className="h-[52px] items-center justify-center rounded-[16px] bg-[#35A8AA]"
          >
            <Text className="text-[18px] font-bold text-white">Enter reset code</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')} className="items-center py-2">
            <Text className="text-[14px] font-semibold text-[#0D8A8D]">Back to Login</Text>
          </Pressable>
        </View>
      )}

      <StatusBar style="dark" />
    </KeyboardSafeScroll>
  );
}
