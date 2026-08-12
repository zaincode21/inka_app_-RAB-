import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getCurrentSession } from '../data/authApi';
import { canViewFinance } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: Pick<NativeStackNavigationProp<RootStackParamList>, 'navigate' | 'replace'>;
  active?: 'home' | 'manage' | 'explore' | 'reports';
};

export function AppBottomNav({ navigation, active }: Props) {
  const { t } = useTranslation();
  const user = getCurrentSession()?.user;

  const openManage = () => {
    if (!canViewFinance(user)) {
      navigation.navigate('MilkRecords');
      return;
    }
    navigation.navigate('ManageExpenses');
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row justify-between rounded-t-[20px] bg-[#008B8B] px-2 py-2">
      <NavItem
        icon="home"
        label={t('common.home')}
        active={active === 'home'}
        onPress={() => navigation.navigate('Dashboard')}
      />
      <NavItem icon="briefcase" label={t('common.manage')} active={active === 'manage'} onPress={openManage} />
      <NavItem
        icon="compass"
        label={t('common.explore')}
        active={active === 'explore'}
        onPress={() => navigation.navigate('Events')}
      />
      <NavItem
        icon="archive"
        label={t('common.reports')}
        active={active === 'reports'}
        onPress={() => navigation.navigate('Reports')}
      />
      <NavItem
        icon="settings"
        label={t('common.settings')}
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
}

function NavItem({
  icon,
  label,
  onPress,
  active,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  onPress?: () => void;
  active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="flex-1 items-center py-1">
      <Feather name={icon} size={30} color="#FFFFFF" />
      <Text className={`mt-1 text-[10px] text-white ${active ? 'font-bold' : ''}`}>{label}</Text>
    </Pressable>
  );
}
