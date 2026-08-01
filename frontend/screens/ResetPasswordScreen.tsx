import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { resetPassword } from '../data/authApi';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const [token, setToken] = useState(route.params?.token ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!token.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Enter the reset code and your new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Confirm password must match the new password.');
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword(token.trim(), newPassword);
      Alert.alert('Password reset', 'You can now log in with your new password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Could not reset password', error instanceof Error ? error.message : 'Please try again.');
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
        <Text className="text-center text-[24px] font-extrabold tracking-[-0.8px] text-[#111111]">Reset Password</Text>
        <Text className="mt-3 text-center text-[14px] text-[#222222]">
          Paste the reset code from your email{route.params?.email ? ` (${route.params.email})` : ''} and choose a new
          password.
        </Text>
      </View>

      <View className="mt-12 gap-5">
        <View className="gap-3">
          <Text className="text-[14px] font-medium text-[#111111]">Reset code</Text>
          <View className="min-h-[52px] flex-row items-center rounded-[16px] bg-[#DDEFF0] px-4 py-2">
            <Feather name="key" size={16} color="#8A8A8A" />
            <TextInput
              value={token}
              onChangeText={setToken}
              className="ml-3 flex-1 text-[14px] text-[#111111]"
              placeholder="Paste reset code"
              placeholderTextColor="#8A8A8A"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
          </View>
        </View>

        <PasswordField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          visible={showNew}
          onToggleVisible={() => setShowNew((value) => !value)}
        />
        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          visible={showConfirm}
          onToggleVisible={() => setShowConfirm((value) => !value)}
        />

        <Pressable
          onPress={() => void handleSave()}
          disabled={submitting}
          className="h-[52px] items-center justify-center rounded-[16px] bg-[#35A8AA]"
        >
          <Text className="text-[18px] font-bold text-white">{submitting ? 'Saving...' : 'Reset password'}</Text>
        </Pressable>
      </View>

      <StatusBar style="dark" />
    </KeyboardSafeScroll>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisible,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <View className="gap-3">
      <Text className="text-[14px] font-medium text-[#111111]">{label}</Text>
      <View className="h-[52px] flex-row items-center rounded-[16px] bg-[#DDEFF0] px-4">
        <Feather name="lock" size={16} color="#8A8A8A" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          className="ml-3 flex-1 text-[16px] text-[#111111]"
          placeholder="••••••••"
          placeholderTextColor="#8A8A8A"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggleVisible} hitSlop={8}>
          <Feather name={visible ? 'eye' : 'eye-off'} size={16} color="#8A8A8A" />
        </Pressable>
      </View>
    </View>
  );
}
