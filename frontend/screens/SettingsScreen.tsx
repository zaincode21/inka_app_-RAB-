import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { getCurrentSession } from '../data/authApi';
import { canManageFarmSetup, canManageUsers, canEditSystemConfig } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const user = getCurrentSession()?.user;
  const settingsItems = [
    {
      id: 'password',
      title: 'Change Password',
      subtitle: 'Update the password for your account',
      icon: 'lock' as const,
      route: 'ChangePassword' as const,
    },
    {
      id: 'system',
      title: 'System Configuration',
      subtitle: canEditSystemConfig(user)
        ? 'Return heat days, milk price, and buyers'
        : 'View breeding defaults (owner can edit)',
      icon: 'sliders' as const,
      route: 'SystemConfig' as const,
    },
    ...(canManageFarmSetup(user)
      ? [
          {
            id: 'farm-setup',
            title: 'Farm Setup',
            subtitle: 'Categories, breeds, medicines + milk withdrawal days',
            icon: 'grid' as const,
            route: 'FarmSetup' as const,
          },
        ]
      : []),
    ...(canManageUsers(user)
      ? [
          {
            id: 'users',
            title: 'Users & Privileges',
            subtitle: 'Add farm managers and activate or deactivate staff',
            icon: 'users' as const,
            route: 'ManageUsers' as const,
          },
          {
            id: 'activity',
            title: 'Activity Log',
            subtitle: 'See who created, updated, or deleted farm records',
            icon: 'activity' as const,
            route: 'ActivityLog' as const,
          },
        ]
      : []),
  ];

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Settings</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        <Text className="mb-4 text-[14px] text-[#6B7280]">Manage farm preferences and team access used across events and reports.</Text>
        {settingsItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate(item.route)}
            className="mb-4 flex-row items-center rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-sm"
          >
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-[14px] bg-[#E0F7F7]">
              <Feather name={item.icon} size={22} color="#008B8B" />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-[#1F2937]">{item.title}</Text>
              <Text className="mt-1 text-[13px] text-[#6B7280]">{item.subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>
        ))}
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}
