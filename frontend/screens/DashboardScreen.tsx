import type { ComponentProps, ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppBottomNav } from '../components/AppBottomNav';
import { CalvesIcon, CowsIcon, BullsIcon } from '../components/MetricIcons';
import { getCurrentSession, logout } from '../data/authApi';
import {
  canViewFinance,
  roleLabel,
} from '../data/permissions';
import { formatMoney, formatNumber, getDashboardMetrics, getInventoryItems, useDatabaseQuery } from '../data/farmDatabase';
import { flushOfflineQueue, getOfflineQueueCount } from '../data/offlineQueue';
import { syncFarmReminders, type FarmAlert } from '../data/reminderService';
import { FarmSwitcher } from '../components/FarmSwitcher';
import type { RootStackParamList } from '../navigation/types';

type MetricIconProps = {
  size?: number;
  color?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const session = getCurrentSession();
  const user = session?.user;
  const showFinance = canViewFinance(user);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { data: metrics, reload: reloadMetrics } = useDatabaseQuery(getDashboardMetrics, {
    calves: 0,
    cows: 0,
    bulls: 0,
    totalMilkToday: 0,
    healthAlerts: 0,
    incomeThisMonth: 0,
    expensesThisMonth: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const [nextAlerts, queueCount, inventory] = await Promise.all([
            syncFarmReminders(),
            getOfflineQueueCount(),
            getInventoryItems().catch(() => []),
          ]);
          if (!active) {
            return;
          }
          setAlerts(nextAlerts);
          setPendingSync(queueCount);
          setLowStockCount(inventory.filter((item) => item.lowStock).length);
          if (queueCount > 0) {
            setSyncing(true);
            const result = await flushOfflineQueue();
            if (active) {
              setPendingSync(result.remaining);
            }
          }
        } catch {
          if (active) {
            setAlerts([]);
          }
        } finally {
          if (active) {
            setSyncing(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const openAlert = (alert: FarmAlert) => {
    if (alert.cattleTag?.trim()) {
      navigation.navigate('CattleProfile', { cattleTag: alert.cattleTag.trim() });
      return;
    }
    navigation.navigate('Events');
  };

  const visibleAlerts = alerts.slice(0, 5);
  const alertCount = Math.max(alerts.length, metrics.healthAlerts);

  return (
    <View className="flex-1 bg-white">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-8 pt-12">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/30">
              <Feather name="user" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-[24px] font-extrabold leading-[28px] text-white">{t('dashboard.greeting')}</Text>
              <Text className="text-[24px] font-extrabold leading-[28px] text-white">
                {session?.user.firstName ?? t('dashboard.farmer')}
              </Text>
              {session?.user.farmName ? (
                <Text className="mt-1 text-[12px] font-semibold text-white/90">{session.user.farmName}</Text>
              ) : null}
              {session?.user.role ? (
                <Text className="mt-1 text-[12px] font-semibold text-white/80">{roleLabel(session.user.role)}</Text>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={() => {
              void logout();
              navigation.replace('Login');
            }}
            accessibilityRole="button"
            className="items-center"
            hitSlop={8}
          >
            <Feather name="log-out" size={24} color="#FFFFFF" />
            <Text className="mt-1 text-[10px] font-bold text-white">{t('common.logout')}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-5">
          <Text className="text-[18px] font-extrabold text-[#008B8B]">{t('dashboard.title')}</Text>

          <View className="mt-3">
            <FarmSwitcher
              compact
              onSwitched={() => {
                void (async () => {
                  try {
                    await reloadMetrics();
                    const [nextAlerts, queueCount] = await Promise.all([
                      syncFarmReminders(),
                      getOfflineQueueCount(),
                    ]);
                    setAlerts(nextAlerts);
                    setPendingSync(queueCount);
                  } catch {
                    setAlerts([]);
                  }
                })();
              }}
            />
          </View>

          {lowStockCount > 0 ? (
            <Pressable
              onPress={() => navigation.navigate('Inventory')}
              className="mt-4 flex-row items-center rounded-[16px] border border-[#FCD34D] bg-[#FFFBEB] px-4 py-3"
            >
              <Feather name="package" size={18} color="#B45309" />
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold text-[#92400E]">
                  {t('dashboard.lowStock', { count: lowStockCount })}
                </Text>
                <Text className="mt-1 text-[12px] text-[#A16207]">{t('dashboard.lowStockHint')}</Text>
              </View>
            </Pressable>
          ) : null}

          {pendingSync > 0 ? (
            <Pressable
              onPress={() => {
                void (async () => {
                  setSyncing(true);
                  try {
                    const result = await flushOfflineQueue();
                    setPendingSync(result.remaining);
                  } finally {
                    setSyncing(false);
                  }
                })();
              }}
              className="mt-4 flex-row items-center rounded-[16px] border border-[#93C5FD] bg-[#EFF6FF] px-4 py-3"
            >
              <Feather name="cloud-off" size={18} color="#1D4ED8" />
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold text-[#1E3A8A]">
                  {syncing ? t('dashboard.syncing') : t('dashboard.syncWaiting', { count: pendingSync })}
                </Text>
                <Text className="mt-1 text-[12px] text-[#1D4ED8]">{t('dashboard.syncRetry')}</Text>
              </View>
            </Pressable>
          ) : null}

          <View className="mt-4 flex-row justify-between gap-3">
            <MetricCard title={t('dashboard.calves')} value={`${metrics.calves}`} icon={CalvesIcon} />
            <MetricCard title={t('dashboard.cows')} value={`${metrics.cows}`} icon={CowsIcon} />
            <MetricCard title={t('dashboard.bulls')} value={`${metrics.bulls}`} icon={BullsIcon} />
          </View>

          <View className={`mt-4 gap-4 ${isNarrow ? '' : 'flex-row'}`}>
            <View className="flex-1 rounded-[20px] bg-[#E0F7F7] px-4 py-4">
              <Text className="text-center text-[16px] font-extrabold text-black/50">{formatNumber(metrics.totalMilkToday)} L</Text>
              <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">{t('dashboard.milkToday')}</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Events')}
              className="flex-1 rounded-[20px] bg-[#E0F7F7] px-4 py-4"
            >
              <Text className="text-center text-[16px] font-extrabold text-black/50">{alertCount}</Text>
              <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">{t('dashboard.healthAlerts')}</Text>
            </Pressable>
          </View>

          {visibleAlerts.length > 0 ? (
            <View className="mt-5">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-[18px] font-extrabold text-[#008B8B]">{t('dashboard.alerts')}</Text>
                <Pressable onPress={() => navigation.navigate('Events')}>
                  <Text className="text-[13px] font-semibold text-[#008B8B]">{t('dashboard.viewEvents')}</Text>
                </Pressable>
              </View>
              {visibleAlerts.map((alert) => (
                <Pressable
                  key={alert.id}
                  onPress={() => openAlert(alert)}
                  className="mb-3 rounded-[16px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="mr-3 flex-1">
                      <Text className="text-[14px] font-bold text-[#92400E]">{alert.title}</Text>
                      <Text className="mt-1 text-[13px] text-[#78350F]">{alert.detail}</Text>
                      <Text className="mt-1 text-[12px] text-[#A16207]">{alert.dueLabel}</Text>
                    </View>
                    <Feather
                      name={alert.kind === 'withdrawal' ? 'droplet' : 'bell'}
                      size={18}
                      color="#B45309"
                    />
                  </View>
                </Pressable>
              ))}
              {alerts.length > visibleAlerts.length ? (
                <Text className="text-[12px] text-[#6B7280]">
                  +{alerts.length - visibleAlerts.length} more — open Events to review
                </Text>
              ) : null}
            </View>
          ) : null}

          {showFinance ? (
            <View className={`mt-4 gap-4 ${isNarrow ? '' : 'flex-row'}`}>
              <View className="flex-1 rounded-[20px] bg-[#F0FDF4] px-4 py-4">
                <Text className="text-center text-[16px] font-extrabold text-[#16A34A]">{formatMoney(metrics.incomeThisMonth)}</Text>
                <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">{t('dashboard.incomeMonth')}</Text>
              </View>
              <View className="flex-1 rounded-[20px] bg-[#FEF2F2] px-4 py-4">
                <Text className="text-center text-[16px] font-extrabold text-[#DC2626]">{formatMoney(metrics.expensesThisMonth)}</Text>
                <Text className="mt-1 text-center text-[14px] font-semibold text-black/50">{t('dashboard.expenseMonth')}</Text>
              </View>
            </View>
          ) : null}

          <Text className="mt-8 text-[18px] font-extrabold text-[#008B8B]">{t('dashboard.quickLinks')}</Text>
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-6">
            <QuickLink icon="truck" label={t('dashboard.cattle')} onPress={() => navigation.navigate('CattleList')} />
            <QuickLink icon="repeat" label={t('dashboard.lifeCycle')} onPress={() => navigation.navigate('CowLifeCycle')} />
            <QuickLink icon="coffee" label={t('dashboard.milkRecords')} onPress={() => navigation.navigate('MilkRecords')} />
            <QuickLink icon="calendar" label={t('dashboard.events')} onPress={() => navigation.navigate('Events')} />
            <QuickLink icon="package" label={t('dashboard.inventory')} onPress={() => navigation.navigate('Inventory')} />
            {showFinance ? (
              <QuickLink icon="dollar-sign" label={t('dashboard.transactions')} onPress={() => navigation.navigate('Transactions')} />
            ) : null}
            <QuickLink icon="settings" label={t('common.settings')} onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>
      </ScrollView>

      <AppBottomNav navigation={navigation} active="home" />

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
