import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { logout, getCurrentSession } from '../data/authApi';
import {
  exportReportCsv,
  formatMoney,
  formatNumber,
  getPeriodReport,
  getReportSummaries,
  todayIsoDate,
  type PeriodReport,
  type ReportExportDataset,
  useDatabaseQuery,
} from '../data/farmDatabase';
import { canViewFinance } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type RangePreset = 'month' | '30' | 'custom';

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function ReportsScreen({ navigation }: Props) {
  const sessionUser = getCurrentSession()?.user;
  const showFinance = canViewFinance(sessionUser);
  const { data: reports } = useDatabaseQuery(getReportSummaries, []);
  const [preset, setPreset] = useState<RangePreset>('month');
  const [from, setFrom] = useState(startOfMonthIso);
  const [to, setTo] = useState(todayIsoDate);
  const [period, setPeriod] = useState<PeriodReport | null>(null);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ReportExportDataset | null>(null);

  const applyPreset = (next: RangePreset) => {
    setPreset(next);
    if (next === 'month') {
      setFrom(startOfMonthIso());
      setTo(todayIsoDate());
    } else if (next === '30') {
      setFrom(daysAgoIso(29));
      setTo(todayIsoDate());
    }
  };

  const reloadPeriod = useCallback(async () => {
    try {
      setPeriodLoading(true);
      setPeriodError(null);
      const result = await getPeriodReport(from.trim(), to.trim());
      setPeriod(result);
    } catch (loadError) {
      setPeriod(null);
      setPeriodError(loadError instanceof Error ? loadError.message : 'Could not load period report.');
    } finally {
      setPeriodLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void reloadPeriod();
  }, [reloadPeriod]);

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };
  const openManage = () => {
    if (!showFinance) {
      navigation.navigate('MilkRecords');
      return;
    }
    navigation.navigate('ManageExpenses');
  };

  const handleExport = async (dataset: ReportExportDataset) => {
    try {
      setExporting(dataset);
      const csv = await exportReportCsv(dataset, from.trim(), to.trim());
      const filename = `inka-${dataset}-${from.trim()}-${to.trim()}.csv`;
      const directory = FileSystem.cacheDirectory;
      if (!directory) {
        throw new Error('File storage is not available on this device.');
      }
      const path = `${directory}${filename}`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Export ready', `CSV saved at ${path}`);
        return;
      }
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: `Share ${filename}`,
        UTI: 'public.comma-separated-values-text',
      });
    } catch (exportError) {
      Alert.alert('Export failed', exportError instanceof Error ? exportError.message : 'Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const exportButtons: Array<{ dataset: ReportExportDataset; label: string; hidden?: boolean }> = [
    { dataset: 'milk', label: 'Milk CSV' },
    { dataset: 'events', label: 'Events CSV' },
    { dataset: 'cattle', label: 'Herd CSV' },
    { dataset: 'transactions', label: 'Finance CSV', hidden: !showFinance },
  ];

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Text className="text-center text-[24px] font-extrabold text-white">Reports</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 100 }}>
        <Text className="mb-3 text-[14px] font-bold text-[#1F2937]">Period</Text>
        <View className="mb-3 flex-row">
          {(
            [
              { id: 'month', label: 'This month' },
              { id: '30', label: 'Last 30 days' },
              { id: 'custom', label: 'Custom' },
            ] as const
          ).map((item) => {
            const active = preset === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => applyPreset(item.id)}
                className={`mr-2 rounded-full px-3 py-2 ${active ? 'bg-[#008B8B]' : 'border border-[#D1D5DB] bg-white'}`}
              >
                <Text className={`text-[12px] font-semibold ${active ? 'text-white' : 'text-[#374151]'}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-[12px] text-[#6B7280]">From (YYYY-MM-DD)</Text>
            <TextInput
              value={from}
              onChangeText={(value) => {
                setPreset('custom');
                setFrom(value);
              }}
              autoCapitalize="none"
              className="rounded-[12px] border border-[#D1D5DB] bg-white px-3 py-2 text-[14px] text-[#111827]"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-[12px] text-[#6B7280]">To (YYYY-MM-DD)</Text>
            <TextInput
              value={to}
              onChangeText={(value) => {
                setPreset('custom');
                setTo(value);
              }}
              autoCapitalize="none"
              className="rounded-[12px] border border-[#D1D5DB] bg-white px-3 py-2 text-[14px] text-[#111827]"
            />
          </View>
        </View>

        <Pressable onPress={() => void reloadPeriod()} className="mb-4 self-start rounded-full bg-[#008B8B] px-4 py-2">
          <Text className="text-[13px] font-semibold text-white">Refresh period</Text>
        </Pressable>

        {periodLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#008B8B" />
          </View>
        ) : periodError ? (
          <Text className="mb-4 text-[13px] text-[#B91C1C]">{periodError}</Text>
        ) : period ? (
          <View className="mb-5 rounded-[16px] bg-white px-4 py-4">
            <Text className="text-[15px] font-bold text-[#1F2937]">
              {period.from} → {period.to}
            </Text>
            <MetricRow label="Milk produced" value={`${formatNumber(period.milk.produced)} L`} />
            <MetricRow label="Milk used / rejected" value={`${formatNumber(period.milk.used)} / ${formatNumber(period.milk.rejected)} L`} />
            <MetricRow label="Sold estimate" value={`${formatNumber(period.milk.soldEstimate)} L`} />
            <MetricRow label="Events in period" value={String(period.events.total)} />
            <MetricRow label="Herd active / exited" value={`${period.herd.active} / ${period.herd.exited}`} />
            {period.finance ? (
              <>
                <MetricRow label="Income" value={formatMoney(period.finance.income)} />
                <MetricRow label="Expenses" value={formatMoney(period.finance.expenses)} />
                <MetricRow label="Net" value={formatMoney(period.finance.net)} />
              </>
            ) : null}
          </View>
        ) : null}

        <Text className="mb-3 text-[14px] font-bold text-[#1F2937]">Export CSV</Text>
        <View className="mb-6 flex-row flex-wrap">
          {exportButtons
            .filter((item) => !item.hidden)
            .map((item) => (
              <Pressable
                key={item.dataset}
                onPress={() => void handleExport(item.dataset)}
                disabled={exporting === item.dataset}
                className="mb-2 mr-2 rounded-full border border-[#008B8B] bg-white px-4 py-2"
              >
                <Text className="text-[13px] font-semibold text-[#008B8B]">
                  {exporting === item.dataset ? 'Exporting…' : item.label}
                </Text>
              </Pressable>
            ))}
        </View>

        <Text className="mb-3 text-[14px] font-bold text-[#1F2937]">All-time summaries</Text>
        {(reports ?? []).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (item.id === 'stages') {
                navigation.navigate('CowLifeCycle');
                return;
              }
              navigation.navigate('Detail', {
                title: item.label,
                subtitle: 'Report summary',
                details: [
                  { label: 'Value', value: String(item.value) },
                  { label: 'Detail', value: item.detail },
                ],
              });
            }}
            className="mb-3 flex-row items-center rounded-[16px] bg-white px-4 py-4"
          >
            <Feather name={item.icon} size={22} color="#1F2937" />
            <View className="ml-4 flex-1">
              <Text className="text-[16px] font-bold text-[#1F2937]">{item.label}</Text>
              <Text className="mt-1 text-[13px] text-[#6B7280]">{item.detail}</Text>
            </View>
            <Text className="mr-3 text-[15px] font-bold text-[#008B8B]">{item.value}</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>
        ))}
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2 flex-row items-center justify-between">
      <Text className="text-[13px] text-[#6B7280]">{label}</Text>
      <Text className="text-[13px] font-semibold text-[#1F2937]">{value}</Text>
    </View>
  );
}

function BottomNavItem({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="flex-1 items-center py-1">
      <Feather name={icon} size={30} color="#FFFFFF" />
      <Text className="mt-1 text-[10px] text-white">{label}</Text>
    </Pressable>
  );
}
