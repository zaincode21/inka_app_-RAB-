import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { changePassword } from '../data/authApi';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
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
    if (currentPassword === newPassword) {
      Alert.alert('Same password', 'New password must be different from the current password.');
      return;
    }

    try {
      setSubmitting(true);
      await changePassword(currentPassword, newPassword);
      Alert.alert('Password updated', 'Your password was changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Could not update password', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[22px] font-extrabold text-white">Change Password</Text>
        <View className="w-[30px]" />
      </View>

      <KeyboardSafeScroll contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        <Text className="mb-6 text-[14px] text-[#6B7280]">
          Update the password for your account. Use at least 6 characters.
        </Text>

        <PasswordField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          visible={showCurrent}
          onToggleVisible={() => setShowCurrent((value) => !value)}
        />
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
          className="mt-4 h-[56px] items-center justify-center rounded-[12px] bg-[#E6B86F]"
        >
          <Text className="text-[16px] font-bold text-white">{submitting ? 'Saving...' : 'Update Password'}</Text>
        </Pressable>
      </KeyboardSafeScroll>

      <StatusBar style="light" />
    </View>
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
    <View className="mb-4">
      <Text className="mb-2 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <View className="h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-[#F8FAFA] px-4">
        <Feather name="lock" size={16} color="#6B7280" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder="••••••••"
          placeholderTextColor="#6B7280"
          className="ml-3 flex-1 text-[16px] text-[#1F2937]"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggleVisible} hitSlop={8}>
          <Feather name={visible ? 'eye' : 'eye-off'} size={16} color="#6B7280" />
        </Pressable>
      </View>
    </View>
  );
}
