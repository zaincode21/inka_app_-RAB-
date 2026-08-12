import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AppBottomNav } from '../components/AppBottomNav';
import { getCurrentSession } from '../data/authApi';
import {
  exportReportCsv,
  exportReportPdf,
  getReportDetails,
  type ReportDetailsResponse,
  type ReportExportDataset,
} from '../data/farmDatabase';
import { canViewFinance } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { downloadReportFile } from '../utils/downloadFile';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type RangePreset = 'month' | '30' | 'custom';
type ReportKind = 'milk' | 'events' | 'income' | 'expense';

function pad2(value: number) {
  return `${value}`.padStart(2, '0');
}

function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfMonthIso(): string {
  const now = new Date();
  return toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalIsoDate(date);
}

function resolveExportTarget(reportKind: ReportKind) {
  let dataset: ReportExportDataset = 'milk';
  let kind: 'INCOME' | 'EXPENSE' | undefined;
  let fileLabel = 'milk';

  if (reportKind === 'events') {
    dataset = 'events';
    fileLabel = 'events';
  } else if (reportKind === 'income') {
    dataset = 'transactions';
    kind = 'INCOME';
    fileLabel = 'income';
  } else if (reportKind === 'expense') {
    dataset = 'transactions';
    kind = 'EXPENSE';
    fileLabel = 'expense';
  }
  return { dataset, kind, fileLabel };
}

function previewFields(reportKind: ReportKind, row: Record<string, string | number>) {
  if (reportKind === 'milk') {
    return [
      { label: 'Date', value: String(row.date ?? '') },
      { label: 'Type', value: String(row.milkType ?? '') },
      { label: 'Animal', value: String(row.cattleTag || row.cattleName || 'Whole farm') },
      { label: 'Produced', value: `${row.totalProduced ?? 0} L` },
    ];
  }
  if (reportKind === 'events') {
    const eventType = String(row.eventType ?? '');
    const normalized = eventType.trim().toLowerCase();
    const pushIf = (fields: Array<{ label: string; value: string }>, label: string, raw: unknown) => {
      const value = String(raw ?? '').trim();
      if (!value || value === '—') return;
      fields.push({ label, value });
    };

    const fields: Array<{ label: string; value: string }> = [];
    pushIf(fields, 'Date', row.eventDate);
    pushIf(fields, 'Type', eventType);
    pushIf(fields, 'Animal', row.cattleTag || row.groupName);

    if (normalized === 'breeding') {
      pushIf(fields, 'Breeding Type', row.breedingType);
      pushIf(fields, 'Bull Tag', row.bullTag);
      pushIf(fields, 'Semen', row.semenUsed);
      pushIf(fields, 'Inseminator', row.inseminator);
      pushIf(fields, 'Return Heat', row.returnHeatDate);
      pushIf(fields, 'Notes', row.notes);
      return fields;
    }

    if (normalized === 'pregnant' || normalized === 'pregnancy diagnosis') {
      pushIf(fields, 'Breeding Type', row.breedingType);
      pushIf(fields, 'Bull Tag', row.bullTag);
      pushIf(fields, 'Service Date', row.breedingDate);
      pushIf(fields, 'Semen', row.semenUsed);
      pushIf(fields, 'Inseminator', row.inseminator);
      pushIf(fields, 'Delivery Date', row.expectedDeliveryDate);
      if (normalized === 'pregnancy diagnosis') {
        pushIf(fields, 'Method', row.diagnosis);
      }
      pushIf(fields, 'Notes', row.notes);
      return fields;
    }

    if (normalized === 'aborted') {
      pushIf(fields, 'Bull Tag', row.bullTag);
      pushIf(fields, 'Service Date', row.breedingDate);
      pushIf(fields, 'Notes', row.notes);
      return fields;
    }

    if (normalized === 'giving birth') {
      pushIf(fields, 'Bull Tag', row.bullTag);
      pushIf(fields, 'Calf Name', row.calfTag);
      pushIf(fields, 'Calf Gender', row.calfGender);
      pushIf(fields, 'Notes', row.notes);
      return fields;
    }

    pushIf(fields, 'Bull Tag', row.bullTag);
    pushIf(fields, 'Medicine', row.medicine);
    pushIf(fields, 'Diagnosis', row.diagnosis);
    pushIf(fields, 'Technician', row.technician || row.inseminator);
    pushIf(fields, 'Notes', row.notes);
    return fields;
  }
  return [
    { label: 'Date', value: String(row.date ?? '') },
    { label: 'Category', value: String(row.category ?? '') },
    { label: 'Title', value: String(row.title ?? '') },
    { label: 'Amount', value: String(row.amount ?? 0) },
  ];
}

export function ReportsScreen({ navigation }: Props) {
  const sessionUser = getCurrentSession()?.user;
  const showFinance = canViewFinance(sessionUser);
  const reportOptions = useMemo(() => {
    const options: Array<{ id: ReportKind; label: string; icon: keyof typeof Feather.glyphMap }> = [
      { id: 'milk', label: 'Milk', icon: 'droplet' },
      { id: 'events', label: 'Events', icon: 'calendar' },
    ];
    if (showFinance) {
      options.push(
        { id: 'income', label: 'Income', icon: 'trending-up' },
        { id: 'expense', label: 'Expense', icon: 'trending-down' },
      );
    }
    return options;
  }, [showFinance]);

  const [reportKind, setReportKind] = useState<ReportKind>('milk');
  const [preset, setPreset] = useState<RangePreset>('month');
  const [from, setFrom] = useState(startOfMonthIso);
  const [to, setTo] = useState(() => toLocalIsoDate(new Date()));
  const [details, setDetails] = useState<ReportDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    if (!showFinance && (reportKind === 'income' || reportKind === 'expense')) {
      setReportKind('milk');
    }
  }, [showFinance, reportKind]);

  const applyPreset = (next: RangePreset) => {
    setPreset(next);
    if (next === 'month') {
      setFrom(startOfMonthIso());
      setTo(toLocalIsoDate(new Date()));
    } else if (next === '30') {
      setFrom(daysAgoIso(29));
      setTo(toLocalIsoDate(new Date()));
    }
  };

  const reloadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { dataset, kind } = resolveExportTarget(reportKind);
      const result = await getReportDetails(dataset, from.trim(), to.trim(), kind ? { kind } : undefined);
      setDetails(result);
    } catch (loadError) {
      setDetails(null);
      setError(loadError instanceof Error ? loadError.message : 'Could not load report data.');
    } finally {
      setLoading(false);
    }
  }, [from, to, reportKind]);

  useEffect(() => {
    void reloadDetails();
  }, [reloadDetails]);

  const handleExportCsv = async () => {
    try {
      setExporting('csv');
      const { dataset, kind, fileLabel } = resolveExportTarget(reportKind);
      const csv = await exportReportCsv(dataset, from.trim(), to.trim(), kind ? { kind } : undefined);
      const filename = `inka-${fileLabel}-${from.trim()}-${to.trim()}.csv`;
      await downloadReportFile({
        filename,
        mimeType: 'text/csv',
        contents: csv,
        encoding: 'utf8',
        uti: 'public.comma-separated-values-text',
      });
    } catch (exportError) {
      Alert.alert('Download failed', exportError instanceof Error ? exportError.message : 'Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting('pdf');
      const { dataset, kind, fileLabel } = resolveExportTarget(reportKind);
      const base64 = await exportReportPdf(dataset, from.trim(), to.trim(), kind ? { kind } : undefined);
      const filename = `inka-${fileLabel}-${from.trim()}-${to.trim()}.pdf`;
      await downloadReportFile({
        filename,
        mimeType: 'application/pdf',
        contents: base64,
        encoding: 'base64',
        uti: 'com.adobe.pdf',
      });
    } catch (exportError) {
      Alert.alert('Download failed', exportError instanceof Error ? exportError.message : 'Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Text className="text-center text-[24px] font-extrabold text-white">Reports</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 }}>
        <Text className="mb-3 text-[14px] font-bold text-[#1F2937]">Report type</Text>
        <View className="mb-5 flex-row flex-wrap gap-2">
          {reportOptions.map((item) => {
            const active = reportKind === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setReportKind(item.id)}
                className={`w-[48%] items-center rounded-[14px] border px-2 py-3 ${
                  active ? 'border-[#008B8B] bg-[#008B8B]' : 'border-[#D1D5DB] bg-white'
                }`}
              >
                <Feather name={item.icon} size={20} color={active ? '#FFFFFF' : '#008B8B'} />
                <Text className={`mt-1 text-[13px] font-bold ${active ? 'text-white' : 'text-[#1F2937]'}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

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

        <View className="mb-4 flex-row flex-wrap gap-2">
          <Pressable onPress={() => void reloadDetails()} className="rounded-full bg-[#008B8B] px-4 py-2">
            <Text className="text-[13px] font-semibold text-white">Refresh</Text>
          </Pressable>
          <Pressable
            onPress={() => void handleExportCsv()}
            disabled={exporting !== null}
            className="rounded-full border border-[#008B8B] bg-white px-4 py-2"
          >
            <Text className="text-[13px] font-semibold text-[#008B8B]">
              {exporting === 'csv' ? 'Downloading CSV…' : 'Download CSV'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleExportPdf()}
            disabled={exporting !== null}
            className="rounded-full border border-[#E6B86F] bg-[#FFF9EE] px-4 py-2"
          >
            <Text className="text-[13px] font-semibold text-[#92400E]">
              {exporting === 'pdf' ? 'Downloading PDF…' : 'Download PDF'}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#008B8B" />
          </View>
        ) : error ? (
          <Text className="mb-4 text-[13px] text-[#B91C1C]">{error}</Text>
        ) : details ? (
          <>
            <View className="mb-4 rounded-[16px] bg-white px-4 py-4">
              <Text className="text-[15px] font-bold text-[#1F2937]">{details.reportTitle}</Text>
              <Text className="mt-1 text-[12px] text-[#6B7280]">
                {details.farm.name} · {details.from} → {details.to}
              </Text>
              {details.summaryLines.map((line) => (
                <MetricRow key={`${line.label}-${line.value}`} label={line.label} value={line.value} />
              ))}
            </View>

            <Text className="mb-2 text-[14px] font-bold text-[#1F2937]">
              Records ({details.rows.length})
            </Text>
            {details.rows.length === 0 ? (
              <View className="mb-5 rounded-[16px] bg-white px-4 py-6">
                <Text className="text-center text-[14px] font-semibold text-[#6B7280]">
                  No {reportKind} records in this period.
                </Text>
                <Text className="mt-2 text-center text-[12px] text-[#9CA3AF]">
                  Change the dates or add records, then tap Refresh.
                </Text>
              </View>
            ) : (
              details.rows.map((row, index) => {
                const fields = previewFields(reportKind, row);
                const title = fields[1]?.value || fields[0]?.value || `Row ${index + 1}`;
                return (
                  <View key={`${reportKind}-${index}`} className="mb-3 rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3">
                    <Text className="mb-2 text-[14px] font-bold text-[#008B8B]">{title}</Text>
                    {fields.map((field) => (
                      <View key={field.label} className="mb-1 flex-row justify-between">
                        <Text className="text-[12px] text-[#6B7280]">{field.label}</Text>
                        <Text className="ml-3 flex-1 text-right text-[12px] font-semibold text-[#1F2937]">{field.value || '—'}</Text>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </>
        ) : null}
      </ScrollView>

      <AppBottomNav navigation={navigation} active="reports" />
      <StatusBar style="light" />
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2 flex-row items-center justify-between">
      <Text className="mr-3 flex-1 text-[13px] text-[#6B7280]">{label}</Text>
      <Text className="text-[13px] font-semibold text-[#1F2937]">{value}</Text>
    </View>
  );
}
