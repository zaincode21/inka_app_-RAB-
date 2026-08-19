import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { SelectDropdown } from '../components/SelectDropdown';
import { useRequireAccess } from '../data/accessGuard';
import { getCurrentSession } from '../data/authApi';
import {
  exitCattle,
  getCattle,
  parseNumber,
  todayIsoDate,
  useDatabaseQuery,
} from '../data/farmDatabase';
import { canWriteCattle } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'CattleExit'>;

const exitOptions = [
  { label: 'Sold', value: 'Sold' },
  { label: 'Culled', value: 'Culled' },
  { label: 'Dead', value: 'Dead' },
  { label: 'Inactive', value: 'Inactive' },
];

export function CattleExitScreen({ navigation, route }: Props) {
  useRequireAccess(canWriteCattle(getCurrentSession()?.user), navigation);
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const animal = useMemo(
    () => cattle.find((item) => item.tagNumber === route.params.cattleTag),
    [cattle, route.params.cattleTag],
  );

  const [status, setStatus] = useState('Sold');
  const [exitDate, setExitDate] = useState(todayIsoDate());
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [buyerVendor, setBuyerVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const showSaleFields = status === 'Sold';
  const showCostFields = status === 'Culled' || status === 'Dead';

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const timestamp = event.nativeEvent.timestamp;
    const pickedDate = selectedDate ?? (timestamp ? new Date(timestamp) : undefined);
    if (event.type === 'dismissed' || !pickedDate) {
      if (Platform.OS !== 'ios') {
        setShowDatePicker(false);
      }
      return;
    }
    setExitDate(formatPickerDate(pickedDate));
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  const saveExit = async () => {
    if (!animal) {
      Alert.alert('Cattle not found', 'This animal could not be loaded.');
      return;
    }
    if (animal.status.toLowerCase() !== 'active') {
      Alert.alert('Already exited', `This animal is already marked ${animal.status}.`);
      return;
    }
    if (!exitDate.trim() || !status) {
      Alert.alert('Missing details', 'Exit type and date are required.');
      return;
    }

    const amountValue = parseNumber(amount);
    if ((showSaleFields || showCostFields) && amount.trim() && amountValue < 0) {
      Alert.alert('Invalid amount', 'Amount must be zero or greater.');
      return;
    }

    try {
      setSaving(true);
      await exitCattle(animal.id, {
        status,
        exitDate: exitDate.trim(),
        reason: reason.trim(),
        amount: amountValue,
        buyerVendor: buyerVendor.trim(),
        paymentMethod: paymentMethod.trim() || 'Cash',
      });
      showSuccessToast(`${animal.tagNumber} is now ${status}.`, 'Exit recorded');
      if (navigation.canGoBack()) {
        navigation.pop(2);
      } else {
        navigation.navigate('CattleList', { stage: '' });
      }
    } catch (error) {
      Alert.alert('Could not record exit', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!animal) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-[16px] font-bold text-[#008B8B]">Cattle not found</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4 rounded-[12px] bg-[#E6B86F] px-6 py-3">
          <Text className="font-bold text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">Record Exit</Text>
        <View className="w-[30px]" />
      </View>

      <KeyboardSafeScroll
        contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
        footer={
          <View className="flex-row bg-white px-6 py-4">
            <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
              <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void saveExit()}
              disabled={saving}
              className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3"
            >
              <Text className="text-[16px] font-bold text-white">{saving ? 'Saving...' : 'Save Exit'}</Text>
            </Pressable>
          </View>
        }
      >
        <Text className="mb-4 text-[14px] text-[#6B7280]">
          Mark {animal.tagNumber}
          {animal.name ? ` (${animal.name})` : ''} as leaving the active herd. Prefer this over deleting the animal.
        </Text>

        <SelectDropdown
          label="Exit type"
          value={status}
          placeholder="Select"
          options={exitOptions.map((item) => item.label)}
          onSelect={setStatus}
        />

        <Text className="mb-2 mt-1 text-[14px] font-semibold text-[#6B7280]">Exit date</Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="mb-3 h-12 flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4"
        >
          <Text className="text-[16px] text-[#1F2937]">{exitDate}</Text>
          <Feather name="calendar" size={18} color="#6B7280" />
        </Pressable>

        <Text className="mb-2 mt-1 text-[14px] font-semibold text-[#6B7280]">Reason / notes</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Optional reason"
          placeholderTextColor="#6B7280"
          multiline
          className="mb-3 min-h-[90px] rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3 text-[16px] text-[#1F2937]"
          textAlignVertical="top"
        />

        {showSaleFields ? (
          <>
            <Text className="mb-2 mt-1 text-[14px] font-semibold text-[#6B7280]">Sale amount (optional)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor="#6B7280"
              className="mb-3 h-12 rounded-[14px] border border-[#D9E4E4] bg-white px-4 text-[16px] text-[#1F2937]"
            />
            <Text className="mb-2 mt-1 text-[14px] font-semibold text-[#6B7280]">Buyer</Text>
            <TextInput
              value={buyerVendor}
              onChangeText={setBuyerVendor}
              placeholder="Buyer name"
              placeholderTextColor="#6B7280"
              className="mb-3 h-12 rounded-[14px] border border-[#D9E4E4] bg-white px-4 text-[16px] text-[#1F2937]"
            />
            <Text className="mb-2 mt-1 text-[14px] font-semibold text-[#6B7280]">Payment method</Text>
            <TextInput
              value={paymentMethod}
              onChangeText={setPaymentMethod}
              placeholder="Cash"
              placeholderTextColor="#6B7280"
              className="mb-3 h-12 rounded-[14px] border border-[#D9E4E4] bg-white px-4 text-[16px] text-[#1F2937]"
            />
          </>
        ) : null}

        {showCostFields ? (
          <>
            <Text className="mb-2 mt-1 text-[14px] font-semibold text-[#6B7280]">Disposal / related cost (optional)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor="#6B7280"
              className="mb-3 h-12 rounded-[14px] border border-[#D9E4E4] bg-white px-4 text-[16px] text-[#1F2937]"
            />
            <Text className="mb-3 -mt-1 text-[12px] text-[#6B7280]">Creates a Cattle Disposal expense when amount is greater than zero.</Text>
          </>
        ) : null}
      </KeyboardSafeScroll>

      {showDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker value={parseDateForPicker(exitDate)} mode="date" display="calendar" onChange={handleDateChange} />
      ) : null}

      <Modal visible={showDatePicker && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowDatePicker(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">Exit date</Text>
              <Pressable onPress={() => setShowDatePicker(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <DateTimePicker value={parseDateForPicker(exitDate)} mode="date" display="inline" themeVariant="light" onChange={handleDateChange} style={{ height: 330, width: '100%' }} />
            <Pressable onPress={() => setShowDatePicker(false)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function parseDateForPicker(value: string) {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatPickerDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
