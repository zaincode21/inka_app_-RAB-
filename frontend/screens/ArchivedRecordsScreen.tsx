import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { getCurrentSession } from '../data/authApi';
import {
  getArchivedRecords,
  restoreArchivedRecord,
  type ArchivedListItem,
  type ArchivedRecordKind,
} from '../data/farmDatabase';
import {
  canDeleteCattle,
  canDeleteEvents,
  canDeleteMilk,
  canDeleteTransactions,
} from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ArchivedRecords'>;

type Filter = { label: string; value: ArchivedRecordKind };

export function ArchivedRecordsScreen({ navigation }: Props) {
  const user = getCurrentSession()?.user;
  const filters = useMemo(() => {
    const next: Filter[] = [];
    if (canDeleteCattle(user)) {
      next.push({ label: 'Cattle', value: 'cattle' });
    }
    if (canDeleteMilk(user)) {
      next.push({ label: 'Milk', value: 'milk' });
    }
    if (canDeleteEvents(user)) {
      next.push({ label: 'Events', value: 'events' });
    }
    if (canDeleteTransactions(user)) {
      next.push({ label: 'Finance', value: 'transactions' });
    }
    return next;
  }, [user]);

  const [kind, setKind] = useState<ArchivedRecordKind>(filters[0]?.value ?? 'cattle');
  const [items, setItems] = useState<ArchivedListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (filters.length && !filters.some((filter) => filter.value === kind)) {
      setKind(filters[0].value);
    }
  }, [filters, kind]);

  const reload = useCallback(async () => {
    if (!filters.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const rows = await getArchivedRecords(kind);
      setItems(rows);
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not load archived records.');
    } finally {
      setLoading(false);
    }
  }, [filters.length, kind]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRestore = (item: ArchivedListItem) => {
    Alert.alert('Restore record', `Put "${item.title}" back into active lists?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          try {
            setRestoringId(item.id);
            await restoreArchivedRecord(item.kind, item.id);
            await reload();
          } catch (restoreError) {
            Alert.alert(
              'Could not restore',
              restoreError instanceof Error ? restoreError.message : 'Please try again.',
            );
          } finally {
            setRestoringId(null);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Archived Records</Text>
        <View className="w-[30px]" />
      </View>

      {filters.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}
        >
          {filters.map((filter) => {
            const active = kind === filter.value;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setKind(filter.value)}
                className={`mr-2 rounded-full px-4 py-2 ${active ? 'bg-[#008B8B]' : 'bg-white border border-[#D1D5DB]'}`}
              >
                <Text className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-[#374151]'}`}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#008B8B" />
          </View>
        ) : items.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-center text-[16px] font-bold text-[#008B8B]">No archived records</Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">
              {error ?? 'Deleted cattle, milk, events, and finance rows appear here for restore.'}
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} className="mb-3 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4">
              <Text className="text-[15px] font-bold text-[#1F2937]">{item.title}</Text>
              {item.subtitle ? <Text className="mt-1 text-[13px] text-[#6B7280]">{item.subtitle}</Text> : null}
              <Text className="mt-2 text-[12px] text-[#9CA3AF]">
                Archived {formatWhen(item.deletedAt)}
              </Text>
              <Pressable
                onPress={() => handleRestore(item)}
                disabled={restoringId === item.id}
                className="mt-3 self-start rounded-full bg-[#008B8B] px-4 py-2"
              >
                <Text className="text-[13px] font-semibold text-white">
                  {restoringId === item.id ? 'Restoring…' : 'Restore'}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}

function formatWhen(value: string): string {
  if (!value) {
    return 'recently';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}
