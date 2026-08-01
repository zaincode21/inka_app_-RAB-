import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { useRequireAccess } from '../data/accessGuard';
import { getCurrentSession } from '../data/authApi';
import { formatMoney, formatNumber, parseNumber, receiveInventory, todayIsoDate } from '../data/farmDatabase';
import { canWriteInventory } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryReceive'>;

export function InventoryReceiveScreen({ navigation, route }: Props) {
  const user = getCurrentSession()?.user;
  useRequireAccess(canWriteInventory(user), navigation, 'You do not have permission to manage inventory.');
  const { itemId, itemName, unit } = route.params;
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [createExpense, setCreateExpense] = useState(true);
  const [saving, setSaving] = useState(false);

  const qty = parseNumber(quantity);
  const cost = parseNumber(unitCost);
  const total = Number((qty * cost).toFixed(2));

  const save = async () => {
    if (!(qty > 0)) {
      Alert.alert('Missing quantity', 'Enter how much you received.');
      return;
    }
    try {
      setSaving(true);
      await receiveInventory(itemId, {
        quantity: qty,
        unitCost: cost,
        date,
        notes: notes.trim() || undefined,
        vendor: vendor.trim() || undefined,
        createExpense: createExpense && total > 0,
      });
      navigation.replace('Inventory');
    } catch (error) {
      Alert.alert('Could not receive stock', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">Receive stock</Text>
        <View className="w-[30px]" />
      </View>

      <KeyboardSafeScroll
        contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
        footer={
          <View className="flex-row bg-white px-6 py-4">
            <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center rounded-[12px] border border-[#008B8B] py-3">
              <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
            </Pressable>
            <Pressable onPress={() => void save()} disabled={saving} className="ml-2 flex-1 items-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">{saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        }
      >
        <Text className="text-[16px] font-bold text-[#1F2937]">{itemName}</Text>
        <Text className="mt-1 text-[13px] text-[#6B7280]">Unit: {unit}</Text>

        <Label text="Date (YYYY-MM-DD)" />
        <TextInput value={date} onChangeText={setDate} autoCapitalize="none" className="rounded-[12px] border border-[#D1D5DB] px-3 py-3 text-[15px]" />

        <Label text={`Quantity (${unit})`} />
        <TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" className="rounded-[12px] border border-[#D1D5DB] px-3 py-3 text-[15px]" />

        <Label text="Unit cost (RWF)" />
        <TextInput value={unitCost} onChangeText={setUnitCost} keyboardType="decimal-pad" className="rounded-[12px] border border-[#D1D5DB] px-3 py-3 text-[15px]" />

        <Label text="Vendor (optional)" />
        <TextInput value={vendor} onChangeText={setVendor} className="rounded-[12px] border border-[#D1D5DB] px-3 py-3 text-[15px]" />

        <Label text="Notes (optional)" />
        <TextInput value={notes} onChangeText={setNotes} className="rounded-[12px] border border-[#D1D5DB] px-3 py-3 text-[15px]" />

        <View className="mt-4 flex-row items-center justify-between rounded-[12px] bg-[#F3F4F6] px-3 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-[14px] font-semibold text-[#1F2937]">Create Feed expense</Text>
            <Text className="mt-1 text-[12px] text-[#6B7280]">
              {total > 0 ? `Estimated ${formatMoney(total)} for ${formatNumber(qty)} ${unit}` : 'Set quantity and unit cost to enable'}
            </Text>
          </View>
          <Switch
            value={createExpense}
            onValueChange={setCreateExpense}
            trackColor={{ false: '#D1D5DB', true: '#5EEAD4' }}
            thumbColor={createExpense ? '#008B8B' : '#F9FAFB'}
          />
        </View>
      </KeyboardSafeScroll>

      <StatusBar style="light" />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-1 mt-4 text-[13px] font-semibold text-[#6B7280]">{text}</Text>;
}
