import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { type Cattle, getCattle, useDatabaseQuery } from '../data/farmDatabase';
import { getCurrentSession } from '../data/authApi';
import { canWriteCattle } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CattleList'>;
type ListFilter = 'active' | 'exited' | 'all';

const STAGE_TITLES: Record<string, string> = {
  calf: 'Calves',
  weaner: 'Weaners',
  heifer: 'Heifers',
  cow: 'Cows',
  bull: 'Bulls',
  steer: 'Steers',
};

export function CattleListScreen({ navigation, route }: Props) {
  const { data: cattle, loading, error } = useDatabaseQuery(getCattle, []);
  const canAdd = canWriteCattle(getCurrentSession()?.user);
  const [listFilter, setListFilter] = useState<ListFilter>('active');
  const stageFilter = route.params?.stage?.trim() ?? '';
  const stageKey = stageFilter.toLowerCase();
  const title = STAGE_TITLES[stageKey] ?? 'Cattle List';

  useEffect(() => {
    setListFilter('active');
  }, [stageKey]);

  const visibleCattle = useMemo(() => {
    return cattle.filter((item) => {
      if (stageKey && item.stage.trim().toLowerCase() !== stageKey) {
        return false;
      }
      const active = isActiveCattle(item);
      if (listFilter === 'active') {
        return active;
      }
      if (listFilter === 'exited') {
        return !active;
      }
      return true;
    });
  }, [cattle, listFilter, stageKey]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">{title}</Text>
        <View className="w-[30px]" />
      </View>

      <View className="flex-row px-6 py-4">
        <FilterTab label="Active" active={listFilter === 'active'} onPress={() => setListFilter('active')} first />
        <FilterTab label="Exited" active={listFilter === 'exited'} onPress={() => setListFilter('exited')} />
        <FilterTab label="All" active={listFilter === 'all'} onPress={() => setListFilter('all')} last />
      </View>

      <FlatList
        data={visibleCattle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 pt-24">
            <Text className="text-center text-[16px] font-bold text-[#008B8B]">
              {loading
                ? 'Loading cattle...'
                : listFilter === 'exited'
                  ? stageFilter
                    ? `No exited ${title.toLowerCase()}`
                    : 'No exited cattle'
                  : stageFilter
                    ? `No ${title.toLowerCase()} yet`
                    : 'No cattle records yet'}
            </Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">
              {error ??
                (listFilter === 'exited'
                  ? 'Sold, culled, dead, or inactive animals will appear here.'
                  : 'Add your first animal to start building herd records, health history, and reports.')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const active = isActiveCattle(item);
          return (
            <Pressable
              onPress={() => navigation.navigate('CattleProfile', { cattleTag: item.tagNumber })}
              className="mx-2 mb-4 rounded-[12px] bg-[#E0F7F7] px-4 py-4 shadow"
            >
              <View className="mb-2 flex-row items-center">
                <Text className="flex-1 text-[18px] font-bold text-[#1F2937]">{item.name}</Text>
                <Text className="px-3 py-1 text-[14px] font-bold text-[#008B8B]">{item.stage}</Text>
              </View>

              <InfoRow label="Tag Number:" value={item.tagNumber} />
              <InfoRow label="Breed:" value={item.breed} />
              <InfoRow label="Group:" value={item.groupName || 'Not assigned'} />

              <View className="mt-1 flex-row flex-wrap items-center gap-y-1">
                <View className="min-w-[120px] flex-1 flex-row">
                  <Text className="text-[12px] text-[#6B7280]">Status:</Text>
                  <Text className={`pl-2 text-[12px] font-bold ${active ? 'text-[#10B981]' : 'text-[#DC2626]'}`}>{item.status}</Text>
                </View>
                <View className="flex-row flex-wrap">
                  <Text className="text-[12px] text-[#6B7280]">Date of Birth:</Text>
                  <Text className="pl-2 text-[12px] text-[#1F2937]">{item.dateOfBirth}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {canAdd ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddCattle')}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-[#E6B86F] shadow-lg"
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <StatusBar style="light" />
    </View>
  );
}

function isActiveCattle(item: Cattle) {
  return item.status.trim().toLowerCase() === 'active';
}

function FilterTab({
  label,
  active,
  onPress,
  first = false,
  last = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-12 flex-1 items-center justify-center rounded-[12px] px-3 ${first ? 'mr-2' : ''} ${last ? 'ml-2' : first || last ? '' : 'mx-1'} ${
        active ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'
      }`}
    >
      <Text className={`text-[15px] font-bold ${active ? 'text-white' : 'text-[#008B8B]'}`}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-1 flex-row">
      <Text className="text-[12px] text-[#6B7280]">{label}</Text>
      <Text className="flex-1 pl-2 text-[12px] text-[#1F2937]">{value}</Text>
    </View>
  );
}
