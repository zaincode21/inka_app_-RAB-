import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppBottomNav } from '../components/AppBottomNav';
import { CalvesIcon, CowsIcon, BullsIcon, MilkCanIcon, LifeCycleIcon, BarnIcon, FeedSackIcon, FarmClipboardIcon, FarmReportIcon, FarmCoinsIcon } from '../components/MetricIcons';
import { getCurrentSession } from '../data/authApi';
import {
  canViewFinance,
  roleLabel,
} from '../data/permissions';
import {
  EMPTY_DASHBOARD_METRICS,
  formatMoney,
  formatNumber,
  getDashboardMetrics,
  getInventoryItems,
  useDatabaseQuery,
} from '../data/farmDatabase';
import { flushOfflineQueue, getOfflineQueueCount } from '../data/offlineQueue';
import { farmAlertIconName, syncFarmReminders, type FarmAlert } from '../data/reminderService';
import { FarmSwitcher } from '../components/FarmSwitcher';
import type { RootStackParamList } from '../navigation/types';

type MetricIconProps = {
  size?: number;
  color?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function greetingKey(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) {
    return 'dashboard.greetingMorning';
  }
  if (hour < 17) {
    return 'dashboard.greetingAfternoon';
  }
  return 'dashboard.greetingEvening';
}

export function DashboardScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const session = getCurrentSession();
  const user = session?.user;
  const showFinance = canViewFinance(user);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { data: metrics, error: metricsError, reload: reloadMetrics } = useDatabaseQuery(
    getDashboardMetrics,
    EMPTY_DASHBOARD_METRICS,
  );

  const refreshHomeExtras = useCallback(async () => {
    const [nextAlerts, queueCount, inventory] = await Promise.all([
      syncFarmReminders(),
      getOfflineQueueCount(),
      getInventoryItems().catch(() => []),
    ]);
    setAlerts(nextAlerts);
    setPendingSync(queueCount);
    setLowStockCount(inventory.filter((item) => item.lowStock).length);
    return queueCount;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const queueCount = await refreshHomeExtras();
          if (!active) {
            return;
          }
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
    }, [refreshHomeExtras]),
  );

  const openAlert = (alert: FarmAlert) => {
    if (alert.cattleTag?.trim()) {
      navigation.navigate('CattleProfile', { cattleTag: alert.cattleTag.trim() });
      return;
    }
    navigation.navigate('Alerts');
  };

  const openStage = (stage: string) => {
    navigation.navigate('CattleList', { stage });
  };

  const visibleAlerts = alerts.slice(0, 5);
  const alertCount = alerts.length;

  return (
    <View className="flex-1 bg-white">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-8 pt-12">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              className="h-14 w-14 items-center justify-center rounded-full bg-white/30"
              hitSlop={4}
            >
              <Feather name="user" size={24} color="#FFFFFF" />
            </Pressable>
            <View>
              <Text className="text-[24px] font-extrabold leading-[28px] text-white">{t(greetingKey())}</Text>
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
            onPress={() => navigation.navigate('Alerts')}
            accessibilityRole="button"
            accessibilityLabel={t('alerts.title')}
            className="relative h-12 w-12 items-center justify-center rounded-full bg-white/20"
            hitSlop={8}
          >
            <Feather name="bell" size={24} color="#FFFFFF" />
            {alerts.length > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 min-w-[18px] items-center rounded-full bg-[#DC2626] px-1 py-0.5">
                <Text className="text-[10px] font-bold text-white">{alerts.length > 99 ? '99+' : alerts.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-5">
          <Text className="text-[18px] font-extrabold text-[#008B8B]">{t('dashboard.title')}</Text>
          {metrics.totalActive > 0 ? (
            <Text className="mt-1 text-[13px] font-semibold text-[#6B7280]">
              {t('dashboard.herdTotal', { count: metrics.totalActive })}
            </Text>
          ) : null}

          <View className="mt-3">
            <FarmSwitcher
              compact
              onSwitched={() => {
                void (async () => {
                  try {
                    await reloadMetrics();
                    await refreshHomeExtras();
                  } catch {
                    setAlerts([]);
                  }
                })();
              }}
            />
          </View>

          {metricsError ? (
            <View className="mt-4 rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
              <Text className="text-[13px] font-semibold text-[#991B1B]">{t('dashboard.loadError')}</Text>
            </View>
          ) : null}

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
            <MetricCard title={t('dashboard.calves')} value={`${metrics.calves}`} icon={CalvesIcon} onPress={() => openStage('Calf')} />
            <MetricCard title={t('dashboard.weaners')} value={`${metrics.weaners}`} icon={CalvesIcon} onPress={() => openStage('Weaner')} />
            <MetricCard title={t('dashboard.heifers')} value={`${metrics.heifers}`} icon={CowsIcon} onPress={() => openStage('Heifer')} />
          </View>
          <View className="mt-3 flex-row justify-between gap-3">
            <MetricCard title={t('dashboard.cows')} value={`${metrics.cows}`} icon={CowsIcon} onPress={() => openStage('Cow')} />
            <MetricCard title={t('dashboard.bulls')} value={`${metrics.bulls}`} icon={BullsIcon} onPress={() => openStage('Bull')} />
            <MetricCard title={t('dashboard.steers')} value={`${metrics.steers}`} icon={BullsIcon} onPress={() => openStage('Steer')} />
          </View>

          <View className="mt-4 flex-row gap-3">
            <StatCard
              value={`${formatNumber(metrics.totalMilkToday)} L`}
              label={t('dashboard.milkToday')}
              onPress={() => navigation.navigate('MilkRecords')}
            />
            <StatCard
              value={`${alertCount}`}
              label={t('dashboard.healthAlerts')}
              onPress={() => navigation.navigate('Alerts')}
            />
          </View>

          {visibleAlerts.length > 0 ? (
            <View className="mt-5">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-[18px] font-extrabold text-[#008B8B]">{t('dashboard.alerts')}</Text>
                <Pressable onPress={() => navigation.navigate('Alerts')}>
                  <Text className="text-[13px] font-semibold text-[#008B8B]">{t('dashboard.viewAllAlerts')}</Text>
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
                    <Feather name={farmAlertIconName(alert.kind)} size={18} color="#B45309" />
                  </View>
                </Pressable>
              ))}
              {alerts.length > visibleAlerts.length ? (
                <Pressable onPress={() => navigation.navigate('Alerts')}>
                  <Text className="text-[12px] text-[#6B7280]">
                    {t('dashboard.moreAlerts', { count: alerts.length - visibleAlerts.length })}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {showFinance ? (
            <View className="mt-4 flex-row gap-3">
              <StatCard
                value={formatMoney(metrics.incomeThisMonth)}
                label={t('dashboard.incomeMonth')}
                valueClassName="text-[#16A34A]"
                cardClassName="bg-[#F0FDF4]"
                onPress={() => navigation.navigate('Transactions')}
              />
              <StatCard
                value={formatMoney(metrics.expensesThisMonth)}
                label={t('dashboard.expenseMonth')}
                valueClassName="text-[#DC2626]"
                cardClassName="bg-[#FEF2F2]"
                onPress={() => navigation.navigate('Transactions')}
              />
            </View>
          ) : null}

          <Text className="mt-8 text-[18px] font-extrabold text-[#008B8B]">{t('dashboard.quickLinks')}</Text>
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-6">
            <QuickLink icon={CowsIcon} label={t('dashboard.cattle')} onPress={() => navigation.navigate('CattleList', { stage: '' })} />
            <QuickLink icon={LifeCycleIcon} label={t('dashboard.lifeCycle')} onPress={() => navigation.navigate('CowLifeCycle')} />
            <QuickLink icon={MilkCanIcon} label={t('dashboard.milkRecords')} onPress={() => navigation.navigate('MilkRecords')} />
            <QuickLink icon={FarmClipboardIcon} label={t('dashboard.events')} onPress={() => navigation.navigate('Events')} />
            <QuickLink icon={FarmReportIcon} label={t('common.reports')} onPress={() => navigation.navigate('Reports')} />
            <QuickLink icon={FeedSackIcon} label={t('dashboard.inventory')} onPress={() => navigation.navigate('Inventory')} />
            {showFinance ? (
              <QuickLink icon={FarmCoinsIcon} label={t('dashboard.transactions')} onPress={() => navigation.navigate('Transactions')} />
            ) : null}
            <QuickLink icon={BarnIcon} label={t('common.settings')} onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>
      </ScrollView>

      <AppBottomNav navigation={navigation} active="home" />

      <StatusBar style="light" />
    </View>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  onPress,
}: {
  title: string;
  value: string;
  icon: ComponentType<MetricIconProps>;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} className="flex-1 rounded-[20px] bg-[#E0F7F7] px-3 py-3">
      <View className="items-center">
        <Icon size={30} color="#008B8B" />
        <Text className="mt-1 text-[14px] font-semibold text-black/50">{title}</Text>
        <Text className="text-[16px] font-extrabold text-black/50">{value}</Text>
      </View>
    </Pressable>
  );
}

function StatCard({
  value,
  label,
  onPress,
  valueClassName = 'text-black/50',
  cardClassName = 'bg-[#E0F7F7]',
}: {
  value: string;
  label: string;
  onPress?: () => void;
  valueClassName?: string;
  cardClassName?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={`min-w-0 flex-1 rounded-[20px] px-3 py-4 ${cardClassName}`}
    >
      <Text className={`text-center text-[16px] font-extrabold ${valueClassName}`}>{value}</Text>
      <Text className="mt-1 text-center text-[13px] font-semibold text-black/50">{label}</Text>
    </Pressable>
  );
}

function QuickLink({
  icon: Icon,
  label,
  onPress,
}: {
  icon: ComponentType<MetricIconProps>;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="w-[30%] items-center"
      android_ripple={{ color: 'rgba(10,154,157,0.08)' }}
    >
      <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E0F7F7]">
        <Icon size={30} color="#008B8B" />
      </View>
      <Text className="mt-2 text-center text-[15px] font-semibold text-[#23292B]">{label}</Text>
    </Pressable>
  );
}
