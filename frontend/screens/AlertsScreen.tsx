import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBottomNav } from '../components/AppBottomNav';
import { syncFarmReminders, type FarmAlert } from '../data/reminderService';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Alerts'>;

export function AlertsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        try {
          const next = await syncFarmReminders();
          if (active) {
            setAlerts(next);
          }
        } catch {
          if (active) {
            setAlerts([]);
          }
        } finally {
          if (active) {
            setLoading(false);
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

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[40px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">{t('alerts.title')}</Text>
        {alerts.length > 0 ? (
          <View className="min-w-[28px] items-center rounded-full bg-[#E6B86F] px-2 py-1">
            <Text className="text-[12px] font-bold text-white">{alerts.length}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#008B8B" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }}>
          {alerts.length === 0 ? (
            <View className="items-center pt-16">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#E0F7F7]">
                <Feather name="bell-off" size={28} color="#008B8B" />
              </View>
              <Text className="text-center text-[16px] font-bold text-[#008B8B]">{t('alerts.empty')}</Text>
              <Text className="mt-2 text-center text-[13px] text-[#6B7280]">{t('alerts.emptyHint')}</Text>
            </View>
          ) : (
            alerts.map((alert) => (
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
                  <Feather name={alert.kind === 'withdrawal' ? 'droplet' : 'bell'} size={18} color="#B45309" />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <AppBottomNav navigation={navigation} active="home" />
      <StatusBar style="light" />
    </View>
  );
}
