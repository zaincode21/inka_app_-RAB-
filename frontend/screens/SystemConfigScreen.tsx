import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import {
  DEFAULT_MILK_PRICE_PER_LITER,
  DEFAULT_RETURN_HEAT_DAYS,
  DEFAULT_RETURN_HEAT_TIME,
  getSystemConfig,
  normalizeReturnHeatTime,
  updateSystemConfig,
} from '../data/farmDatabase';
import { getCurrentSession } from '../data/authApi';
import { canEditSystemConfig } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SystemConfig'>;
type SavingKey = 'returnHeat' | 'milkPrice' | 'buyerDestination' | null;

function sharedBuyerDestination(buyer: string, destination: string) {
  return buyer.trim() || destination.trim() || '';
}

export function SystemConfigScreen({ navigation }: Props) {
  const canEdit = canEditSystemConfig(getCurrentSession()?.user);
  const [returnHeatDays, setReturnHeatDays] = useState(`${DEFAULT_RETURN_HEAT_DAYS}`);
  const [returnHeatTime, setReturnHeatTime] = useState(DEFAULT_RETURN_HEAT_TIME);
  const [milkPricePerLiter, setMilkPricePerLiter] = useState(`${DEFAULT_MILK_PRICE_PER_LITER}`);
  const [defaultMilkBuyerDestination, setDefaultMilkBuyerDestination] = useState('');
  const [currency, setCurrency] = useState('RWF');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SavingKey>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const config = await getSystemConfig();
        if (!cancelled) {
          setReturnHeatDays(`${config.returnHeatDays}`);
          setReturnHeatTime(config.returnHeatTime);
          setMilkPricePerLiter(`${config.milkPricePerLiter}`);
          setDefaultMilkBuyerDestination(sharedBuyerDestination(config.defaultMilkBuyer, config.defaultMilkDestination));
          setCurrency(config.currency || 'RWF');
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

  const applySaved = (saved: Awaited<ReturnType<typeof updateSystemConfig>>) => {
    setReturnHeatDays(`${saved.returnHeatDays}`);
    setReturnHeatTime(saved.returnHeatTime);
    setMilkPricePerLiter(`${saved.milkPricePerLiter}`);
    setDefaultMilkBuyerDestination(sharedBuyerDestination(saved.defaultMilkBuyer, saved.defaultMilkDestination));
    setCurrency(saved.currency || 'RWF');
  };

  const saveReturnHeat = async () => {
    if (!canEdit) {
      Alert.alert('Read only', 'Only farm owners can change system configuration.');
      return;
    }
    const days = Number.parseInt(returnHeatDays.trim(), 10);
    if (!Number.isFinite(days) || days < 0 || days > 45) {
      Alert.alert('Invalid value', 'Estimated return heat days must be a whole number between 0 and 45.');
      return;
    }
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(returnHeatTime.trim())) {
      Alert.alert('Invalid time', 'Enter return heat time as HH:mm (24-hour), for example 08:00.');
      return;
    }

    setSavingKey('returnHeat');
    try {
      const saved = await updateSystemConfig({
        returnHeatDays: days,
        returnHeatTime: normalizeReturnHeatTime(returnHeatTime),
      });
      applySaved(saved);
      Alert.alert('Saved', 'Return heat settings updated.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const saveMilkPrice = async () => {
    if (!canEdit) {
      Alert.alert('Read only', 'Only farm owners can change system configuration.');
      return;
    }
    const price = Number.parseFloat(milkPricePerLiter.trim());
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Invalid price', 'Milk selling price per liter must be 0 or greater.');
      return;
    }

    setSavingKey('milkPrice');
    try {
      const saved = await updateSystemConfig({ milkPricePerLiter: price });
      applySaved(saved);
      Alert.alert('Saved', 'Milk selling price updated.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const saveBuyerDestination = async () => {
    if (!canEdit) {
      Alert.alert('Read only', 'Only farm owners can change system configuration.');
      return;
    }
    const value = defaultMilkBuyerDestination.trim();
    setSavingKey('buyerDestination');
    try {
      const saved = await updateSystemConfig({
        defaultMilkBuyer: value,
        defaultMilkDestination: value,
      });
      applySaved(saved);
      Alert.alert('Saved', 'Default buyer / destination updated.');
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingKey(null);
    }
  };

  const busy = loading || savingKey !== null || !canEdit;

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[20px] font-extrabold text-white">System Configuration</Text>
        <View className="w-[30px]" />
      </View>

      <KeyboardSafeScroll contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        <Text className="mb-4 text-[13px] text-[#6B7280]">
          {canEdit
            ? 'Each setting saves on its own. Changing one does not require saving the others.'
            : 'View only — ask a farm owner to change milk price or breeding defaults.'}
        </Text>

        <ConfigCard title="Estimated Return Heat Date" subtitle="Days and time after Kwimisha when the cow is expected to return to heat if not pregnant.">
          <FieldLabel text="Days after breeding" />
          <RowInput
            value={returnHeatDays}
            onChangeText={setReturnHeatDays}
            keyboardType="number-pad"
            editable={!busy}
            placeholder={`${DEFAULT_RETURN_HEAT_DAYS}`}
            suffix="days"
          />
          <FieldLabel text="Time of day" />
          <RowInput
            value={returnHeatTime}
            onChangeText={setReturnHeatTime}
            keyboardType="numbers-and-punctuation"
            editable={!busy}
            placeholder={DEFAULT_RETURN_HEAT_TIME}
            suffix="HH:mm"
            autoCapitalize="none"
          />
          <SaveButton label={savingKey === 'returnHeat' ? 'Saving...' : 'Save Return Heat'} disabled={busy} onPress={() => void saveReturnHeat()} />
        </ConfigCard>

        <ConfigCard title="Selling price per liter" subtitle={`Used for Whole Farm Milk Sale income. Currency: ${currency}.`}>
          <RowInput
            value={milkPricePerLiter}
            onChangeText={setMilkPricePerLiter}
            keyboardType="decimal-pad"
            editable={!busy}
            placeholder="0"
            suffix={`${currency}/L`}
          />
          <SaveButton label={savingKey === 'milkPrice' ? 'Saving...' : 'Save Price'} disabled={busy} onPress={() => void saveMilkPrice()} />
        </ConfigCard>

        <ConfigCard
          title="Default buyer / destination"
          subtitle="Same value prefills buyer and destination on Whole Farm milk records, and buyer on Milk Sale income."
        >
          <PlainInput
            value={defaultMilkBuyerDestination}
            onChangeText={setDefaultMilkBuyerDestination}
            editable={!busy}
            placeholder="e.g. Cooperative"
          />
          <SaveButton
            label={savingKey === 'buyerDestination' ? 'Saving...' : 'Save Buyer / Destination'}
            disabled={busy}
            onPress={() => void saveBuyerDestination()}
          />
        </ConfigCard>
      </KeyboardSafeScroll>

      <StatusBar style="light" />
    </View>
  );
}

function ConfigCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <View className="mb-4 rounded-[16px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <Text className="text-[16px] font-bold text-[#1F2937]">{title}</Text>
      <Text className="mt-2 text-[13px] leading-5 text-[#6B7280]">{subtitle}</Text>
      <View className="mt-4">{children}</View>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text className="mb-2 mt-1 text-[13px] font-semibold text-[#6B7280]">{text}</Text>;
}

function RowInput({
  value,
  onChangeText,
  placeholder,
  suffix,
  editable,
  keyboardType,
  autoCapitalize,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  suffix: string;
  editable: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View className="mb-3 h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-[#F8FAFA] px-4">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        className="flex-1 text-[16px] font-bold text-[#1F2937]"
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      <Text className="text-[14px] font-semibold text-[#008B8B]">{suffix}</Text>
    </View>
  );
}

function PlainInput({
  value,
  onChangeText,
  placeholder,
  editable,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable: boolean;
}) {
  return (
    <View className="mb-3 h-12 justify-center rounded-[14px] border border-[#D9E4E4] bg-[#F8FAFA] px-4">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        className="text-[16px] text-[#1F2937]"
      />
    </View>
  );
}

function SaveButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className="mt-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
      <Text className="text-[15px] font-bold text-white">{label}</Text>
    </Pressable>
  );
}
