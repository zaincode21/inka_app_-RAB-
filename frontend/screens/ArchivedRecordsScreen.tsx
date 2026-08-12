import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
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
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'ArchivedRecords'>;

type Filter = {
  label: string;
  value: ArchivedRecordKind;
  icon: keyof typeof Feather.glyphMap;
};

const KIND_META: Record<
  ArchivedRecordKind,
  { icon: keyof typeof Feather.glyphMap; accent: string; soft: string; label: string }
> = {
  cattle: { icon: 'tag', accent: '#008B8B', soft: '#E0F7F7', label: 'Cattle' },
  milk: { icon: 'droplet', accent: '#0EA5E9', soft: '#E0F2FE', label: 'Milk' },
  events: { icon: 'calendar', accent: '#B45309', soft: '#FEF3C7', label: 'Event' },
  transactions: { icon: 'credit-card', accent: '#047857', soft: '#D1FAE5', label: 'Finance' },
};

export function ArchivedRecordsScreen({ navigation }: Props) {
  const user = getCurrentSession()?.user;
  const filters = useMemo(() => {
    const next: Filter[] = [];
    if (canDeleteCattle(user)) {
      next.push({ label: 'Cattle', value: 'cattle', icon: 'tag' });
    }
    if (canDeleteMilk(user)) {
      next.push({ label: 'Milk', value: 'milk', icon: 'droplet' });
    }
    if (canDeleteEvents(user)) {
      next.push({ label: 'Events', value: 'events', icon: 'calendar' });
    }
    if (canDeleteTransactions(user)) {
      next.push({ label: 'Finance', value: 'transactions', icon: 'credit-card' });
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

  const activeFilter = filters.find((filter) => filter.value === kind);
  const kindMeta = KIND_META[kind];

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
            showSuccessToast('Record restored.');
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

  if (!filters.length) {
    return (
      <View className="flex-1 bg-white">
        <Header onBack={() => navigation.goBack()} />
        <EmptyState
          icon="lock"
          title="No archive access"
          body="Ask a farm owner to grant delete permissions for cattle, milk, events, or finance."
        />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Header onBack={() => navigation.goBack()} />

      <View className="px-5 pt-4">
        <View className="flex-row">
          {filters.map((filter, index) => {
            const active = kind === filter.value;
            const isFirst = index === 0;
            const isLast = index === filters.length - 1;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setKind(filter.value)}
                className={`h-12 flex-1 flex-row items-center justify-center rounded-[12px] px-2 ${
                  isFirst ? 'mr-1.5' : isLast ? 'ml-1.5' : 'mx-1'
                } ${active ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'}`}
              >
                <Feather name={filter.icon} size={15} color={active ? '#FFFFFF' : '#008B8B'} />
                <Text
                  className={`ml-1.5 text-[13px] font-bold ${active ? 'text-white' : 'text-[#008B8B]'}`}
                  numberOfLines={1}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mb-1 mt-4 flex-row items-center justify-between">
          <Text className="text-[13px] font-semibold text-[#6B7280]">
            {loading
              ? 'Loading…'
              : `${items.length} archived ${activeFilter?.label.toLowerCase() ?? 'record'}${items.length === 1 ? '' : 's'}`}
          </Text>
          <Pressable onPress={() => void reload()} hitSlop={8} className="flex-row items-center">
            <Feather name="refresh-cw" size={14} color="#008B8B" />
            <Text className="ml-1.5 text-[13px] font-bold text-[#008B8B]">Refresh</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-20">
              <ActivityIndicator color="#008B8B" size="large" />
              <Text className="mt-4 text-[14px] font-semibold text-[#6B7280]">Loading archived records…</Text>
            </View>
          ) : (
            <EmptyState
              icon="archive"
              title={error ? 'Could not load archive' : `No archived ${activeFilter?.label.toLowerCase() ?? 'records'}`}
              body={
                error ??
                'Soft-deleted records stay here until you restore them. Active lists stay clean.'
              }
            />
          )
        }
        renderItem={({ item }) => {
          const restoring = restoringId === item.id;
          return (
            <View className="mb-3 overflow-hidden rounded-[16px] border border-[#E8EEEE] bg-[#F8FAFA]">
              <View className="flex-row items-start px-4 pt-4">
                <View
                  className="mr-3 h-11 w-11 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: kindMeta.soft }}
                >
                  <Feather name={kindMeta.icon} size={20} color={kindMeta.accent} />
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center">
                    <Text className="mr-2 rounded-md bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
                      {kindMeta.label}
                    </Text>
                  </View>
                  <Text className="mt-1.5 text-[16px] font-bold leading-5 text-[#1F2937]" numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text className="mt-1 text-[13px] leading-4 text-[#6B7280]" numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  <View className="mt-2.5 flex-row items-center">
                    <Feather name="clock" size={13} color="#94A3B8" />
                    <Text className="ml-1.5 text-[12px] text-[#94A3B8]">Archived {formatWhen(item.deletedAt)}</Text>
                  </View>
                </View>
              </View>

              <View className="mt-3 flex-row border-t border-[#E8EEEE] bg-white px-3 py-3">
                <Pressable
                  onPress={() => handleRestore(item)}
                  disabled={restoring}
                  className={`flex-1 flex-row items-center justify-center rounded-[12px] py-3 ${
                    restoring ? 'bg-[#CBD5E1]' : 'bg-[#E6B86F]'
                  }`}
                >
                  {restoring ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Feather name="rotate-ccw" size={16} color="#FFFFFF" />
                  )}
                  <Text className="ml-2 text-[14px] font-bold text-white">
                    {restoring ? 'Restoring…' : 'Restore to active'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <StatusBar style="light" />
    </View>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
      <View className="flex-row items-center">
        <Pressable onPress={onBack} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Archived Records</Text>
        <View className="w-[30px]" />
      </View>
      <Text className="mt-2 px-8 text-center text-[13px] leading-4 text-white/85">
        Soft-deleted farm records. Restore anytime to put them back in active lists.
      </Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10 pt-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#E0F7F7]">
        <Feather name={icon} size={28} color="#008B8B" />
      </View>
      <Text className="text-center text-[17px] font-bold text-[#008B8B]">{title}</Text>
      <Text className="mt-2 text-center text-[13px] leading-5 text-[#6B7280]">{body}</Text>
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
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
