import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { register } from '../data/authApi';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateAccount = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing account details', 'Please enter your name, email, and password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please confirm the same password.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Terms required', 'Please agree to the terms and conditions.');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert('Could not create account', error instanceof Error ? error.message : 'Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24 }} className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => navigation.goBack()} className="self-start pb-4">
        <Text className="text-[16px] font-semibold text-[#0D8A8D]">Back</Text>
      </Pressable>

      <Text className="mt-3 text-center text-[24px] font-extrabold text-[#111111]">Create Account</Text>

      <Field label="Names" icon="user" placeholder="Enter full names" value={fullName} onChangeText={setFullName} />
      <Field label="Email" icon="mail" placeholder="Enter email" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field label="Phone" icon="phone" placeholder="Enter phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Field
        label="Password"
        icon="lock"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        rightIcon={showPassword ? 'eye' : 'eye-off'}
        onRightIconPress={() => setShowPassword((value) => !value)}
      />
      <Field
        label="Confirm Password"
        icon="lock"
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        rightIcon={showConfirmPassword ? 'eye' : 'eye-off'}
        onRightIconPress={() => setShowConfirmPassword((value) => !value)}
      />

      <Pressable onPress={() => setAcceptedTerms((value) => !value)} className="mt-5 flex-row items-center gap-3">
        <View className={`h-5 w-5 items-center justify-center rounded-[4px] border ${acceptedTerms ? 'border-[#0D8A8D] bg-[#0D8A8D]' : 'border-[#B8C7C7] bg-white'}`}>
          {acceptedTerms ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
        </View>
        <Text className="flex-1 text-[14px] text-[#1F2937]">I agree to the terms and conditions</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={handleCreateAccount}
        disabled={submitting}
        className="mt-6 h-[56px] items-center justify-center rounded-[16px] bg-[#0D8A8D]"
      >
        <Text className="text-[18px] font-bold text-white">{submitting ? 'Creating...' : 'Create Account'}</Text>
      </Pressable>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-[14px] text-[#4B5563]">Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text className="text-[14px] font-bold text-[#0D8A8D]">Login</Text>
        </Pressable>
      </View>

      <StatusBar style="dark" />
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  value: string;
  onChangeText: (value: string) => void;
};

function Field({ label, icon, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, rightIcon, onRightIconPress }: FieldProps) {
  return (
    <View className="mt-5 gap-3">
      <Text className="ml-1 text-[14px] font-bold text-[#1F2937]">{label}</Text>
      <View className="h-[56px] flex-row items-center rounded-[16px] bg-[#EAF4F4] px-4">
        <Feather name={icon} size={18} color="#8A8A8A" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          className="ml-3 flex-1 text-[16px] text-[#1F2937]"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
        />
        {rightIcon ? (
          <Pressable hitSlop={8} onPress={onRightIconPress}>
            <Feather name={rightIcon} size={18} color="#8A8A8A" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
