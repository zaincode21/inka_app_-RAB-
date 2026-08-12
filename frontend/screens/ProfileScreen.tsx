import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBottomNav } from '../components/AppBottomNav';
import { FarmSwitcher } from '../components/FarmSwitcher';
import { getCurrentSession, logout } from '../data/authApi';
import { roleLabel } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const session = getCurrentSession();
  const user = session?.user;

  const handleLogout = () => {
    Alert.alert(t('common.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: () => {
          void logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('dashboard.farmer');

  return (
    <View className="flex-1 bg-white">
      <View className="items-center rounded-b-[40px] bg-[#008B8B] px-6 pb-8 pt-12">
        <View className="mb-4 w-full flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="arrow-left" size={26} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 pl-4 text-[20px] font-bold text-white">{t('profile.title')}</Text>
        </View>
        <View className="h-20 w-20 items-center justify-center rounded-full bg-white/25">
          <Feather name="user" size={36} color="#FFFFFF" />
        </View>
        <Text className="mt-3 text-[22px] font-extrabold text-white">{fullName}</Text>
        {user?.role ? <Text className="mt-1 text-[13px] font-semibold text-white/85">{roleLabel(user.role)}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 140 }}>
        <InfoRow icon="mail" label={t('profile.email')} value={user?.email || '—'} />
        <InfoRow icon="phone" label={t('profile.phone')} value={user?.phone?.trim() || '—'} />
        <InfoRow icon="home" label={t('profile.farm')} value={user?.farmName?.trim() || '—'} />
        <InfoRow icon="shield" label={t('profile.role')} value={user?.role ? roleLabel(user.role) : '—'} />

        <View className="mt-4">
          <FarmSwitcher
            onSwitched={() => {
              // Session farm name updates via switch; remount by navigating back if needed.
            }}
          />
        </View>

        <Pressable
          onPress={() => navigation.navigate('ChangePassword')}
          className="mt-5 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-4"
        >
          <Feather name="lock" size={20} color="#008B8B" />
          <Text className="ml-3 flex-1 text-[15px] font-bold text-[#1F2937]">{t('settings.changePassword')}</Text>
          <Feather name="chevron-right" size={18} color="#9CA3AF" />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Settings')}
          className="mt-3 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-4"
        >
          <Feather name="settings" size={20} color="#008B8B" />
          <Text className="ml-3 flex-1 text-[15px] font-bold text-[#1F2937]">{t('common.settings')}</Text>
          <Feather name="chevron-right" size={18} color="#9CA3AF" />
        </Pressable>

        <Pressable
          onPress={handleLogout}
          accessibilityRole="button"
          className="mt-8 flex-row items-center justify-center rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] py-4"
        >
          <Feather name="log-out" size={20} color="#DC2626" />
          <Text className="ml-2 text-[16px] font-bold text-[#DC2626]">{t('common.logout')}</Text>
        </Pressable>
      </ScrollView>

      <AppBottomNav navigation={navigation} active="home" />
      <StatusBar style="light" />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View className="mb-3 flex-row items-center rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFA] px-4 py-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#E0F7F7]">
        <Feather name={icon} size={18} color="#008B8B" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[12px] font-semibold text-[#6B7280]">{label}</Text>
        <Text className="mt-0.5 text-[15px] font-bold text-[#1F2937]">{value}</Text>
      </View>
    </View>
  );
}
