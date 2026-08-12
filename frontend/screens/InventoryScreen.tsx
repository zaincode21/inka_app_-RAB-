import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeSheet } from '../components/KeyboardSafeScroll';
import { getCurrentSession, logout } from '../data/authApi';
import {
  createInventoryItem,
  formatNumber,
  getInventoryItems,
  parseNumber,
  useDatabaseQuery,
  type InventoryItem,
} from '../data/farmDatabase';
import { canViewFinance, canWriteInventory } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Inventory'>;

export function InventoryScreen({ navigation }: Props) {
  const user = getCurrentSession()?.user;
  const canWrite = canWriteInventory(user);
  const { data: items, reload, loading } = useDatabaseQuery(getInventoryItems, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [reorderLevel, setReorderLevel] = useState('0');
  const [saving, setSaving] = useState(false);

  const lowStockCount = useMemo(() => items.filter((item) => item.lowStock).length, [items]);

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };
  const openManage = () => {
    if (!canViewFinance(user)) {
      navigation.navigate('MilkRecords');
      return;
    }
    navigation.navigate('ManageExpenses');
  };

  const openCreate = () => {
    setName('');
    setUnit('kg');
    setReorderLevel('0');
    setModalOpen(true);
  };

  const saveItem = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter a feed or inventory item name.');
      return;
    }
    try {
      setSaving(true);
      await createInventoryItem({
        name: name.trim(),
        category: 'Feed',
        unit: unit.trim() || 'kg',
        reorderLevel: parseNumber(reorderLevel),
        quantityOnHand: 0,
      });
      setModalOpen(false);
      await reload();
      showSuccessToast('Inventory item created.');
    } catch (error) {
      Alert.alert('Could not create item', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Text className="text-center text-[24px] font-extrabold text-white">Feed & Inventory</Text>
        {lowStockCount > 0 ? (
          <Text className="mt-2 text-center text-[13px] font-semibold text-[#FEF3C7]">
            {lowStockCount} item{lowStockCount === 1 ? '' : 's'} at or below reorder level
          </Text>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 }}
        ListHeaderComponent={
          canWrite ? (
            <Pressable onPress={openCreate} className="mb-4 rounded-[16px] bg-[#008B8B] px-4 py-3">
              <Text className="text-center text-[15px] font-bold text-white">Add inventory item</Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View className="rounded-[16px] bg-white px-4 py-10">
            <Text className="text-center text-[16px] font-bold text-[#008B8B]">
              {loading ? 'Loading inventory…' : 'No inventory items yet'}
            </Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">
              Add feed items, then record purchases and usage to track stock on hand.
            </Text>
          </View>
        }
        renderItem={({ item }) => <InventoryRow item={item} canWrite={canWrite} navigation={navigation} />}
      />

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between rounded-t-[20px] bg-[#008B8B] px-2 py-2">
        <BottomNavItem icon="home" label="Home" onPress={() => navigation.navigate('Dashboard')} />
        <BottomNavItem icon="briefcase" label="Manage" onPress={openManage} />
        <BottomNavItem icon="compass" label="Explore" onPress={() => navigation.navigate('Events')} />
        <BottomNavItem icon="archive" label="Reports" onPress={() => navigation.navigate('Reports')} />
        <BottomNavItem icon="log-out" label="Logout" onPress={handleLogout} />
      </View>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setModalOpen(false)}>
          <KeyboardSafeSheet contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 20 }}>
            <Pressable onPress={() => {}}>
              <Text className="text-[18px] font-bold text-[#1F2937]">New inventory item</Text>
              <Text className="mt-3 text-[13px] text-[#6B7280]">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Dairy meal"
                className="mt-1 rounded-[12px] border border-[#D1D5DB] bg-white px-3 py-3 text-[15px]"
              />
              <Text className="mt-3 text-[13px] text-[#6B7280]">Unit</Text>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="kg"
                className="mt-1 rounded-[12px] border border-[#D1D5DB] bg-white px-3 py-3 text-[15px]"
              />
              <Text className="mt-3 text-[13px] text-[#6B7280]">Reorder level</Text>
              <TextInput
                value={reorderLevel}
                onChangeText={setReorderLevel}
                keyboardType="decimal-pad"
                className="mt-1 rounded-[12px] border border-[#D1D5DB] bg-white px-3 py-3 text-[15px]"
              />
              <View className="mt-5 flex-row">
                <Pressable onPress={() => setModalOpen(false)} className="mr-2 flex-1 rounded-[12px] border border-[#008B8B] py-3">
                  <Text className="text-center text-[15px] font-bold text-[#008B8B]">Cancel</Text>
                </Pressable>
                <Pressable onPress={() => void saveItem()} disabled={saving} className="ml-2 flex-1 rounded-[12px] bg-[#E6B86F] py-3">
                  <Text className="text-center text-[15px] font-bold text-white">{saving ? 'Saving…' : 'Save'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </KeyboardSafeSheet>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function InventoryRow({
  item,
  canWrite,
  navigation,
}: {
  item: InventoryItem;
  canWrite: boolean;
  navigation: Props['navigation'];
}) {
  return (
    <View className={`mb-3 rounded-[16px] border bg-white px-4 py-4 ${item.lowStock ? 'border-[#F59E0B]' : 'border-[#E5E7EB]'}`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[16px] font-bold text-[#1F2937]">{item.name}</Text>
          <Text className="mt-1 text-[13px] text-[#6B7280]">
            {item.category} · reorder at {formatNumber(item.reorderLevel)} {item.unit}
          </Text>
        </View>
        <View className="items-end">
          <Text className={`text-[18px] font-extrabold ${item.lowStock ? 'text-[#B45309]' : 'text-[#008B8B]'}`}>
            {formatNumber(item.quantityOnHand)}
          </Text>
          <Text className="text-[12px] text-[#6B7280]">{item.unit}</Text>
        </View>
      </View>
      {item.lowStock ? (
        <Text className="mt-2 text-[12px] font-semibold text-[#B45309]">Low stock</Text>
      ) : null}
      {canWrite ? (
        <View className="mt-3 flex-row">
          <Pressable
            onPress={() => navigation.navigate('InventoryReceive', { itemId: item.id, itemName: item.name, unit: item.unit })}
            className="mr-2 flex-1 rounded-full bg-[#008B8B] px-3 py-2"
          >
            <Text className="text-center text-[13px] font-semibold text-white">Receive</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('InventoryUse', { itemId: item.id, itemName: item.name, unit: item.unit })}
            className="ml-2 flex-1 rounded-full border border-[#008B8B] px-3 py-2"
          >
            <Text className="text-center text-[13px] font-semibold text-[#008B8B]">Use</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function BottomNavItem({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="flex-1 items-center py-1">
      <Feather name={icon} size={30} color="#FFFFFF" />
      <Text className="mt-1 text-[10px] text-white">{label}</Text>
    </Pressable>
  );
}
