import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import {
  type MilkRecord,
  deleteMilkRecord,
  formatMoney,
  formatNumber,
  getMilkRecords,
  useDatabaseQuery,
} from '../data/farmDatabase';
import { getCurrentSession } from '../data/authApi';
import { canDeleteMilk, canWriteMilk } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'MilkRecords'>;

export function MilkRecordsScreen({ navigation }: Props) {
  const { data: records, loading, error, reload } = useDatabaseQuery(getMilkRecords, []);
  const user = getCurrentSession()?.user;
  const canAdd = canWriteMilk(user);
  const canEdit = canWriteMilk(user);
  const canRemove = canDeleteMilk(user);
  const [menuRecord, setMenuRecord] = useState<MilkRecord | null>(null);

  const openDetail = (item: MilkRecord) => {
    setMenuRecord(null);
    navigation.navigate('Detail', {
      title: item.date,
      subtitle: 'Milk record details',
      details: buildMilkDetailRows(item),
      editMilk: canEdit || canRemove ? item : undefined,
    });
  };

  const handleEdit = (item: MilkRecord) => {
    setMenuRecord(null);
    navigation.navigate('AddMilkRecord', { milkRecord: item });
  };

  const handleDelete = (item: MilkRecord) => {
    setMenuRecord(null);
    Alert.alert(
      'Delete milk record',
      'Remove this milk record from lists? It stays in farm records and any linked Milk Sale is archived too.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilkRecord(item.id);
              await reload();
              showSuccessToast('Milk record deleted.');
            } catch (deleteError) {
              Alert.alert(
                'Could not delete milk record',
                deleteError instanceof Error ? deleteError.message : 'Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Milk Records</Text>
        <View className="w-[30px]" />
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
        onScrollBeginDrag={() => setMenuRecord(null)}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 pt-24">
            <Text className="text-center text-[16px] font-bold text-[#008B8B]">
              {loading ? 'Loading milk records...' : 'No milk records yet'}
            </Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">
              {error ?? 'Record production, rejected milk, destinations, and quality metrics here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const menuOpen = menuRecord?.id === item.id;
          const showMenu = canEdit || canRemove;
          return (
            <View className="relative mx-2 mb-4" style={{ zIndex: menuOpen ? 999 : 1, elevation: menuOpen ? 8 : 0 }}>
              {menuOpen ? (
                <View
                  className="absolute right-2 top-[44px] z-[1000] min-w-[200px] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-lg"
                  style={{ elevation: 10 }}
                >
                  {canEdit ? (
                    <MilkMenuItem
                      icon="edit-2"
                      label="Edit"
                      onPress={() => handleEdit(item)}
                      isLast={!canRemove}
                    />
                  ) : null}
                  {canRemove ? (
                    <MilkMenuItem
                      icon="trash-2"
                      label="Delete"
                      onPress={() => handleDelete(item)}
                      destructive
                      isLast
                    />
                  ) : null}
                </View>
              ) : null}

              <Pressable onPress={() => openDetail(item)} className="rounded-[12px] bg-[#E0F7F7] px-4 py-4 shadow">
                <View className="mb-3 flex-row items-center">
                  <Text className="flex-1 text-[16px] font-bold text-[#1F2937]">{item.date}</Text>
                  <Text className="px-3 py-1 text-[14px] font-bold text-[#008B8B]">{item.milkType}</Text>
                  {showMenu ? (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation?.();
                        setMenuRecord((current) => (current?.id === item.id ? null : item));
                      }}
                      hitSlop={8}
                      className="ml-1 p-1"
                    >
                      <Feather name="more-vertical" size={18} color="#008B8B" />
                    </Pressable>
                  ) : null}
                </View>
                {item.milkType === 'Individual Cow Milk' ? (
                  <Text className="mb-2 text-[13px] font-semibold text-[#1F2937]">
                    {item.cattleTag ? `${item.cattleTag} - ${item.cattleName}` : 'Cow not recorded'}
                  </Text>
                ) : null}

                <View className="mb-2 flex-row">
                  <MilkTotal label="AM Total" value={`${formatNumber(item.amTotal)} L`} />
                  <MilkTotal label="PM Total" value={`${formatNumber(item.pmTotal)} L`} />
                </View>

                <View className="mb-2 flex-row flex-wrap items-center gap-y-1">
                  <View className="min-w-[170px] flex-1 flex-row flex-wrap">
                    <Text className="text-[12px] text-[#6B7280]">Produced:</Text>
                    <Text className="pl-2 text-[14px] font-bold text-[#008B8B]">{formatNumber(item.totalProduced)} L</Text>
                  </View>
                  <View className="min-w-[100px] flex-row flex-wrap">
                    <Text className="text-[12px] text-[#6B7280]">Used:</Text>
                    <Text className="pl-2 text-[14px] font-bold text-[#1F2937]">{formatNumber(item.totalUsed)} L</Text>
                  </View>
                  <View className="min-w-[100px] flex-row flex-wrap">
                    <Text className="text-[12px] text-[#6B7280]">Calf:</Text>
                    <Text className="pl-2 text-[14px] font-bold text-[#1F2937]">{formatNumber(item.calfMilk)} L</Text>
                  </View>
                </View>

                {(() => {
                  const summary = milkFinancialSummary(item);
                  return (
                    <View className="mt-1 flex-row rounded-[10px] bg-white/70 px-2 py-2">
                      <MilkTotal label="Sold" value={`${formatNumber(summary.soldLiters)} L`} accent="#008B8B" />
                      <MilkTotal label="Income" value={formatMoney(summary.income)} accent="#059669" />
                      <MilkTotal label="Expense" value={formatMoney(summary.expense)} accent="#DC2626" />
                    </View>
                  );
                })()}
              </Pressable>
            </View>
          );
        }}
      />

      {canAdd ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddMilkRecord')}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#E6B86F] shadow-lg"
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <StatusBar style="light" />
    </View>
  );
}

function milkFinancialSummary(item: MilkRecord) {
  const soldLiters = Math.max(
    0,
    Number((item.totalProduced - item.totalUsed - item.calfMilk - item.rejectedMilk).toFixed(2)),
  );
  const price = Number(item.pricePerLiter || 0);
  const isWholeFarm = item.milkType.trim().toLowerCase() === 'whole farm';
  const income = isWholeFarm && soldLiters > 0 && price > 0 ? Number((soldLiters * price).toFixed(2)) : 0;
  const expense = item.calfMilk > 0 && price > 0 ? Number((item.calfMilk * price).toFixed(2)) : 0;
  return { soldLiters, income, expense, price };
}

function buildMilkDetailRows(item: MilkRecord) {
  const { soldLiters, income, expense, price } = milkFinancialSummary(item);

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Date', value: item.date },
    { label: 'Milk Type', value: item.milkType },
  ];

  if (item.milkType === 'Individual Cow Milk') {
    rows.push({
      label: 'Cow',
      value: item.cattleTag ? `${item.cattleTag} - ${item.cattleName}` : 'Not recorded',
    });
  }

  rows.push(
    { label: 'AM Total', value: `${formatNumber(item.amTotal)} L` },
    { label: 'PM Total', value: `${formatNumber(item.pmTotal)} L` },
    { label: 'Total Produced', value: `${formatNumber(item.totalProduced)} L` },
    { label: 'Used', value: `${formatNumber(item.totalUsed)} L` },
    { label: 'Calf milk', value: `${formatNumber(item.calfMilk)} L` },
    { label: 'Rejected', value: `${formatNumber(item.rejectedMilk)} L` },
    { label: 'Sold', value: `${formatNumber(soldLiters)} L` },
    { label: 'Price / L', value: price > 0 ? formatMoney(price) : 'Not set' },
    { label: 'Income', value: formatMoney(income) },
    { label: 'Expense', value: formatMoney(expense) },
  );

  if (item.destination?.trim()) {
    rows.push({ label: 'Destination', value: item.destination.trim() });
  }
  if (item.buyer?.trim()) {
    rows.push({ label: 'Buyer', value: item.buyer.trim() });
  }
  if (item.notes?.trim()) {
    rows.push({ label: 'Notes', value: item.notes.trim() });
  }
  if (item.recordedBy?.trim()) {
    rows.push({ label: 'Recorded by', value: item.recordedBy.trim() });
  }

  return rows;
}

function MilkMenuItem({
  icon,
  label,
  onPress,
  destructive = false,
  isLast = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const color = destructive ? '#DC2626' : '#008B8B';
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3 active:bg-[#F9FAFB] ${isLast ? '' : 'border-b border-[#F3F4F6]'}`}
    >
      <Feather name={icon} size={18} color={color} />
      <Text className={`ml-3 text-[15px] font-bold ${destructive ? 'text-[#DC2626]' : 'text-[#1F2937]'}`}>{label}</Text>
    </Pressable>
  );
}

function MilkTotal({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[12px] text-[#6B7280]">{label}</Text>
      <Text className="mt-1 text-[14px] font-bold" style={{ color: accent ?? '#1F2937' }}>
        {value}
      </Text>
    </View>
  );
}
