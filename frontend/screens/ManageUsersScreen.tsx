import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardSafeSheet } from '../components/KeyboardSafeScroll';
import {
  createUser,
  getCurrentSession,
  listUsers,
  updateUser,
  type ManagedUser,
} from '../data/authApi';
import { canManageUsers, roleLabel } from '../data/permissions';
import { useRequireAccess } from '../data/accessGuard';
import type { RootStackParamList } from '../navigation/types';
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageUsers'>;

const STAFF_ROLES = [
  { value: 'FARM_MANAGER', label: 'Farm Manager' },
  { value: 'VETERINARIAN', label: 'Veterinarian' },
  { value: 'WORKER', label: 'Worker' },
] as const;

export function ManageUsersScreen({ navigation }: Props) {
  const session = getCurrentSession();
  useRequireAccess(canManageUsers(session?.user), navigation);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<(typeof STAFF_ROLES)[number]['value']>('FARM_MANAGER');
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers(session?.user)) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setUsers(await listUsers());
    } catch (error) {
      Alert.alert('Could not load users', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers]),
  );

  if (!canManageUsers(session?.user)) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F7F7] px-6">
        <Text className="text-center text-[16px] text-[#6B7280]">Only farm owners and super admins can manage users.</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-[16px] font-bold text-[#008B8B]">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || password.length < 6) {
      Alert.alert('Missing fields', 'Name, phone, email, and a password of at least 6 characters are required.');
      return;
    }
    if (phone.trim().length < 7) {
      Alert.alert('Invalid phone', 'Enter a valid phone number.');
      return;
    }
    setSaving(true);
    try {
      await createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });
      setModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('FARM_MANAGER');
      await loadUsers();
      showSuccessToast('User created.');
    } catch (error) {
      Alert.alert('Could not create user', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: ManagedUser) => {
    if (user.id === session?.user.id) {
      Alert.alert('Not allowed', 'You cannot deactivate your own account.');
      return;
    }
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      await loadUsers();
      showSuccessToast(user.isActive ? 'User deactivated.' : 'User activated.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Users</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}>
        <Text className="mb-4 text-[14px] text-[#6B7280]">
          Invite farm managers and staff. Farm managers can run daily herd and milk work; owners keep finance and settings control.
        </Text>
        {loading ? <Text className="text-[#6B7280]">Loading…</Text> : null}
        {users.map((user) => (
          <View key={user.id} className="mb-3 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[16px] font-bold text-[#1F2937]">
                  {user.firstName} {user.lastName}
                </Text>
                <Text className="mt-1 text-[13px] text-[#6B7280]">{user.email}</Text>
                {user.phone ? <Text className="mt-1 text-[13px] text-[#6B7280]">{user.phone}</Text> : null}
                <Text className="mt-2 text-[12px] font-semibold text-[#008B8B]">{roleLabel(user.role)}</Text>
              </View>
              <View className="items-end">
                <Text className="mb-1 text-[11px] text-[#6B7280]">{user.isActive ? 'Active' : 'Inactive'}</Text>
                <Switch
                  value={user.isActive}
                  onValueChange={() => void toggleActive(user)}
                  disabled={user.id === session?.user.id || user.role === 'FARM_OWNER' || user.role === 'SUPER_ADMIN'}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        onPress={() => setModalOpen(true)}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#E6B86F] shadow-lg"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setModalOpen(false)}>
          <KeyboardSafeSheet contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24 }}>
            <Text className="mb-4 text-[18px] font-extrabold text-[#1F2937]">Add team member</Text>
            <Text className="mb-1 text-[13px] text-[#6B7280]">Full name</Text>
            <TextInput value={fullName} onChangeText={setFullName} className="mb-3 rounded-[12px] bg-[#F3F4F6] px-4 py-3" />
            <Text className="mb-1 text-[13px] text-[#6B7280]">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="mb-3 rounded-[12px] bg-[#F3F4F6] px-4 py-3"
              placeholder="078xxxxxxx"
            />
            <Text className="mb-1 text-[13px] text-[#6B7280]">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="mb-3 rounded-[12px] bg-[#F3F4F6] px-4 py-3"
            />
            <Text className="mb-1 text-[13px] text-[#6B7280]">Temporary password</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry className="mb-3 rounded-[12px] bg-[#F3F4F6] px-4 py-3" />
            <Text className="mb-2 text-[13px] text-[#6B7280]">Role</Text>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {STAFF_ROLES.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setRole(item.value)}
                  className={`rounded-full px-3 py-2 ${role === item.value ? 'bg-[#008B8B]' : 'bg-[#E5E7EB]'}`}
                >
                  <Text className={`text-[12px] font-semibold ${role === item.value ? 'text-white' : 'text-[#374151]'}`}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setModalOpen(false)} className="flex-1 items-center rounded-[12px] bg-[#E5E7EB] py-3">
                <Text className="font-bold text-[#374151]">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void handleCreate()} disabled={saving} className="flex-1 items-center rounded-[12px] bg-[#E6B86F] py-3">
                <Text className="font-bold text-white">{saving ? 'Saving…' : 'Create'}</Text>
              </Pressable>
            </View>
          </KeyboardSafeSheet>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}
