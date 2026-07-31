import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  DEFAULT_RETURN_HEAT_DAYS,
  DEFAULT_RETURN_HEAT_TIME,
  getSystemConfig,
  normalizeReturnHeatTime,
  updateSystemConfig,
} from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SystemConfig'>;

export function SystemConfigScreen({ navigation }: Props) {
  const [returnHeatDays, setReturnHeatDays] = useState(`${DEFAULT_RETURN_HEAT_DAYS}`);
  const [returnHeatTime, setReturnHeatTime] = useState(DEFAULT_RETURN_HEAT_TIME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const config = await getSystemConfig();
        if (!cancelled) {
          setReturnHeatDays(`${config.returnHeatDays}`);
          setReturnHeatTime(config.returnHeatTime);
        }
      } catch (error) {
        if (!cancelled) {
          Alert.alert('Could not load settings', error instanceof Error ? error.message : 'Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    const days = Number.parseInt(returnHeatDays.trim(), 10);
    if (!Number.isFinite(days) || days < 0 || days > 45) {
      Alert.alert('Invalid value', 'Estimated return heat days must be a whole number between 0 and 45.');
      return;
    }

    const time = normalizeReturnHeatTime(returnHeatTime);
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(returnHeatTime.trim())) {
      Alert.alert('Invalid time', 'Enter return heat time as HH:mm (24-hour), for example 08:00.');
      return;
    }

    setSaving(true);
    try {
      const saved = await updateSystemConfig({ returnHeatDays: days, returnHeatTime: time });
      setReturnHeatDays(`${saved.returnHeatDays}`);
      setReturnHeatTime(saved.returnHeatTime);
      Alert.alert('Saved', `New Kwimisha events will use return heat at +${saved.returnHeatDays} days at ${saved.returnHeatTime}.`);
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[20px] font-extrabold text-white">System Configuration</Text>
        <View className="w-[30px]" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        <View className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <Text className="text-[16px] font-bold text-[#1F2937]">Estimated Return Heat Date</Text>
          <Text className="mt-2 text-[13px] leading-5 text-[#6B7280]">
            Days and time after Kwimisha (Breeding) when the cow is expected to return to heat if not pregnant. Used for return heat and follow-up on new breeding events.
          </Text>

          <Text className="mb-2 mt-5 text-[13px] font-semibold text-[#6B7280]">Days after breeding</Text>
          <View className="h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-[#F8FAFA] px-4">
            <TextInput
              value={returnHeatDays}
              onChangeText={setReturnHeatDays}
              keyboardType="number-pad"
              editable={!loading && !saving}
              placeholder={`${DEFAULT_RETURN_HEAT_DAYS}`}
              placeholderTextColor="#6B7280"
              className="flex-1 text-[16px] font-bold text-[#1F2937]"
            />
            <Text className="text-[14px] font-semibold text-[#008B8B]">days</Text>
          </View>
          <Text className="mt-2 text-[12px] text-[#9CA3AF]">Allowed range: 0–45. Default: {DEFAULT_RETURN_HEAT_DAYS}.</Text>

          <Text className="mb-2 mt-5 text-[13px] font-semibold text-[#6B7280]">Time of day</Text>
          <View className="h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-[#F8FAFA] px-4">
            <TextInput
              value={returnHeatTime}
              onChangeText={setReturnHeatTime}
              keyboardType="numbers-and-punctuation"
              editable={!loading && !saving}
              placeholder={DEFAULT_RETURN_HEAT_TIME}
              placeholderTextColor="#6B7280"
              className="flex-1 text-[16px] font-bold text-[#1F2937]"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text className="text-[14px] font-semibold text-[#008B8B]">HH:mm</Text>
          </View>
          <Text className="mt-2 text-[12px] text-[#9CA3AF]">24-hour format. Default: {DEFAULT_RETURN_HEAT_TIME}.</Text>
        </View>

        <Pressable
          onPress={() => {
            void handleSave();
          }}
          disabled={loading || saving}
          className="mt-6 items-center justify-center rounded-[12px] bg-[#E6B86F] py-4"
        >
          <Text className="text-[16px] font-bold text-white">{saving ? 'Saving...' : loading ? 'Loading...' : 'Save Configuration'}</Text>
        </Pressable>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}
