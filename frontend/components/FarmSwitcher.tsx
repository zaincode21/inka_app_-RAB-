import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { getCurrentSession, listMyFarms, switchFarm, type MyFarm } from '../data/authApi';

type Props = {
  onSwitched?: () => void;
  compact?: boolean;
};

export function FarmSwitcher({ onSwitched, compact }: Props) {
  const session = getCurrentSession();
  const [farms, setFarms] = useState<MyFarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await listMyFarms();
      setFarms(rows);
    } catch {
      setFarms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, session?.user.farmId]);

  if (loading) {
    return (
      <View className={`${compact ? 'py-2' : 'mb-4 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4'} items-center`}>
        <ActivityIndicator color="#008B8B" />
      </View>
    );
  }

  if (farms.length <= 1) {
    if (compact) {
      return null;
    }
    const only = farms[0];
    return (
      <View className="mb-4 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4">
        <Text className="text-[16px] font-bold text-[#1F2937]">Active farm</Text>
        <Text className="mt-1 text-[13px] text-[#6B7280]">
          {only?.name || session?.user.farmName || 'No farm linked'}
        </Text>
      </View>
    );
  }

  const handleSwitch = (farm: MyFarm) => {
    if (farm.isActive || farm.farmId === session?.user.farmId) {
      return;
    }
    Alert.alert('Switch farm', `Use ${farm.name} as your active farm? Lists will reload for that farm.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          try {
            setSwitchingId(farm.farmId);
            await switchFarm(farm.farmId);
            await reload();
            onSwitched?.();
          } catch (error) {
            Alert.alert('Could not switch farm', error instanceof Error ? error.message : 'Please try again.');
          } finally {
            setSwitchingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View className={compact ? '' : 'mb-4 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4'}>
      {!compact ? (
        <>
          <Text className="text-[16px] font-bold text-[#1F2937]">Switch farm</Text>
          <Text className="mt-1 mb-3 text-[13px] text-[#6B7280]">
            Choose which farm’s cattle, milk, and finance you are working in.
          </Text>
        </>
      ) : null}
      {farms.map((farm) => {
        const active = farm.isActive || farm.farmId === session?.user.farmId;
        const busy = switchingId === farm.farmId;
        return (
          <Pressable
            key={farm.farmId}
            onPress={() => handleSwitch(farm)}
            disabled={busy || active}
            className={`mb-2 flex-row items-center rounded-[12px] border px-3 py-3 ${
              active ? 'border-[#008B8B] bg-[#E0F7F7]' : 'border-[#E5E7EB] bg-white'
            }`}
          >
            <Feather name="home" size={18} color={active ? '#008B8B' : '#6B7280'} />
            <View className="ml-3 flex-1">
              <Text className={`text-[14px] font-bold ${active ? 'text-[#0F766E]' : 'text-[#1F2937]'}`}>
                {farm.name}
              </Text>
              <Text className="mt-0.5 text-[12px] text-[#6B7280]">
                {[farm.district, farm.sector].filter(Boolean).join(', ') || farm.location}
              </Text>
            </View>
            {busy ? (
              <ActivityIndicator color="#008B8B" />
            ) : active ? (
              <Text className="text-[11px] font-semibold text-[#008B8B]">Active</Text>
            ) : (
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
