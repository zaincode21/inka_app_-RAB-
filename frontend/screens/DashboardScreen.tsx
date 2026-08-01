import type { ComponentProps, ComponentType } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalvesIcon, CowsIcon, BullsIcon } from '../components/MetricIcons';
import { getCurrentSession, logout } from '../data/authApi';
import {
  canViewFinance,
  roleLabel,
} from '../data/permissions';
import { formatMoney, formatNumber, getDashboardMetrics, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type MetricIconProps = {
  size?: number;
  color?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const session = getCurrentSession();
  const user = session?.user;
  const showFinance = canViewFinance(user);
  const { data: metrics } = useDatabaseQuery(getDashboardMetrics, {
    calves: 0,
    cows: 0,
    bulls: 0,
    totalMilkToday: 0,
    healthAlerts: 0,
    incomeThisMonth: 0,
    expensesThisMonth: 0,
  });
  const handleLogout = () => {
    void logout();
    navigation.replace('Login');
  };

  const openManage = () => {
    if (!canViewFinance(user)) {
      navigation.navigate('MilkRecords');
      return;
    }
    navigation.navigate('ManageExpenses');
  };

  return (
    <View className="flex-1 bg-white">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-8 pt-12">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/30">
              <Feather name="user" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-[24px] font-extrabold leading-[28px] text-white">Good Morning,</Text>
              <Text className="text-[24px] font-extrabold leading-[28px] text-white">{session?.user.firstName ?? 'Farmer'}</Text>
              {session?.user.role ? (
                <Text className="mt-1 text-[12px] font-semibold text-white/80">{roleLabel(session.user.role)}</Text>
              ) : null}
            </View>
          </View>
          <Pressable onPress={handleLogout} accessibilityRole="button" className="items-center" hitSlop={8}>
            <Feather name="log-out" size={24} color="#FFFFFF" />
            <Text className="mt-1 text-[10px] font-bold text-white">Logout</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-5">
          <Text className="text-[18px] font-extrabold text-[#008B8B]">Dashboard</Text>

          <View className="mt-4 flex-row justify-between gap-3">
            <MetricCard title="Calves" value={`${metrics.calves}`} icon={CalvesIcon} />
            <MetricCard title="Cows" value={`${metrics.cows}`} icon={CowsIcon} />
            <MetricCard title="Bulls" value={`${metrics.bulls}`} icon={BullsIcon} />
          </View>

          <View className={`mt-4 gap-4 ${isNarrow ? '' : 'flex-row'}`}>
            <View className="flex-1 rounded-[20px] bg-[#E0F7F7] px-4 py-4">
              <Text className="text-center text-[16px] font-extrabold text-black/50">{formatNumber(metrics.totalMilkToday)} L</Text>
              <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">Total Milk Productions</Text>
            </View>
            <View className="flex-1 rounded-[20px] bg-[#E0F7F7] px-4 py-4">
              <Text className="text-center text-[16px] font-extrabold text-black/50">{metrics.healthAlerts}</Text>
              <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">Health Alerts</Text>
            </View>
          </View>

          {showFinance ? (
            <View className={`mt-4 gap-4 ${isNarrow ? '' : 'flex-row'}`}>
              <View className="flex-1 rounded-[20px] bg-[#F0FDF4] px-4 py-4">
                <Text className="text-center text-[16px] font-extrabold text-[#16A34A]">{formatMoney(metrics.incomeThisMonth)}</Text>
                <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">Income This Month</Text>
              </View>
              <View className="flex-1 rounded-[20px] bg-[#FEF2F2] px-4 py-4">
                <Text className="text-center text-[16px] font-extrabold text-[#DC2626]">{formatMoney(metrics.expensesThisMonth)}</Text>
                <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">Expenses This Month</Text>
              </View>
            </View>
          ) : null}

          <Text className="mt-8 text-[18px] font-extrabold text-[#008B8B]">Quick Links</Text>
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-6">
            <QuickLink icon="truck" label="Cattle" onPress={() => navigation.navigate('CattleList')} />
            <QuickLink icon="repeat" label="Life Cycle" onPress={() => navigation.navigate('CowLifeCycle')} />
            <QuickLink icon="coffee" label="Milk Records" onPress={() => navigation.navigate('MilkRecords')} />
            <QuickLink icon="calendar" label="Events" onPress={() => navigation.navigate('Events')} />
            {showFinance ? (
              <QuickLink icon="dollar-sign" label="Transactions" onPress={() => navigation.navigate('Transactions')} />
            ) : null}
            <QuickLink icon="settings" label="Settings" onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between rounded-t-[20px] bg-[#008B8B] px-2 py-2">
        <BottomNavItem icon="home" label="Home" onPress={() => navigation.navigate('Dashboard')} />
        <BottomNavItem icon="briefcase" label="Manage" onPress={openManage} />
        <BottomNavItem icon="compass" label="Explore" onPress={() => navigation.navigate('Events')} />
        <BottomNavItem icon="archive" label="Reports" onPress={() => navigation.navigate('Reports')} />
        <BottomNavItem icon="log-out" label="Logout" onPress={handleLogout} />
      </View>

      <StatusBar style="light" />
    </View>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: ComponentType<MetricIconProps> }) {
  return (
    <View className="flex-1 rounded-[20px] bg-[#E0F7F7] px-3 py-3">
      <View className="items-center">
        <Icon size={30} color="#008B8B" />
        <Text className="mt-1 text-[14px] font-semibold text-black/50">{title}</Text>
        <Text className="text-[16px] font-extrabold text-black/50">{value}</Text>
      </View>
    </View>
  );
}


function QuickLink({ icon, label, onPress }: { icon: ComponentProps<typeof Feather>['name']; label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="w-[30%] items-center"
      android_ripple={{ color: 'rgba(10,154,157,0.08)' }}
    >
      <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E0F7F7]">
        <Feather name={icon} size={26} color="#008B8B" />
      </View>
      <Text className="mt-2 text-center text-[15px] font-semibold text-[#23292B]">{label}</Text>
    </Pressable>
  );
}

function BottomNavItem({ icon, label, onPress }: { icon: ComponentProps<typeof Feather>['name']; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="flex-1 items-center py-1" android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
      <Feather name={icon} size={30} color="#FFFFFF" />
      <Text className="mt-1 text-[10px] text-white">{label}</Text>
    </Pressable>
  );
}
