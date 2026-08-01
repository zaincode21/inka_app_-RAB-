import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { listAuditLogs, type AuditLogItem } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityLog'>;

const FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Cattle', value: 'Cattle' },
  { label: 'Milk', value: 'MilkRecord' },
  { label: 'Events', value: 'HealthEvent' },
  { label: 'Finance', value: 'Transaction' },
  { label: 'Auth', value: 'User' },
];

export function ActivityLogScreen({ navigation }: Props) {
  const [entityType, setEntityType] = useState('');
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listAuditLogs({ entityType: entityType || undefined, limit: 80 });
      setItems(result.items);
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not load activity log.');
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Activity Log</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        {FILTERS.map((filter) => {
          const active = entityType === filter.value;
          return (
            <Pressable
              key={filter.label}
              onPress={() => setEntityType(filter.value)}
              className={`mr-2 rounded-full px-4 py-2 ${active ? 'bg-[#008B8B]' : 'bg-white border border-[#D1D5DB]'}`}
            >
              <Text className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-[#374151]'}`}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#008B8B" />
          </View>
        ) : items.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-center text-[16px] font-bold text-[#008B8B]">No activity yet</Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">
              {error ?? 'Creates, updates, and deletes will appear here for your farm.'}
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} className="mb-3 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4">
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 text-[15px] font-bold text-[#1F2937]">{item.summary || `${item.action} ${item.entityType}`}</Text>
                <Text className="ml-2 text-[11px] font-semibold text-[#008B8B]">{item.action}</Text>
              </View>
              <Text className="mt-2 text-[12px] text-[#6B7280]">
                {formatWhen(item.createdAt)}
                {item.actorName ? ` · ${item.actorName}` : ''}
                {` · ${item.entityType}`}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}
