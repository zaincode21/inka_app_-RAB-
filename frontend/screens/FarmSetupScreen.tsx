import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { KeyboardSafeScroll, KeyboardSafeSheet } from '../components/KeyboardSafeScroll';
import { useRequireAccess } from '../data/accessGuard';
import { getCurrentSession } from '../data/authApi';
import { addCategory, getCategories, parseNumber, updateCategory, useDatabaseQuery } from '../data/farmDatabase';
import { canManageFarmSetup } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmSetup'>;
type SetupKind = 'income' | 'expense' | 'breed' | 'group' | 'medicine' | 'event';

const cards = [
  { id: 'income', title: 'Income Categories', icon: 'dollar-sign' },
  { id: 'expense', title: 'Expense Categories', icon: 'trending-down' },
  { id: 'breed', title: 'Cattle Breeds', icon: 'git-branch' },
  { id: 'group', title: 'Cattle Groups', icon: 'layers' },
  { id: 'medicine', title: 'Medicines', icon: 'activity' },
  { id: 'event', title: 'Event Types', icon: 'calendar' },
] as const;

export function FarmSetupScreen({ navigation }: Props) {
  useRequireAccess(canManageFarmSetup(getCurrentSession()?.user), navigation);
  const { width } = useWindowDimensions();
  const horizontalPadding = 24;
  const gap = 10;
  const columns = 3;
  const cardWidth = (width - horizontalPadding * 2 - gap * (columns - 1)) / columns;

  const { data: categories, reload } = useDatabaseQuery(() => getCategories(), []);
  const [selectedKind, setSelectedKind] = useState<SetupKind | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newWithdrawalDays, setNewWithdrawalDays] = useState('0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWithdrawal, setEditingWithdrawal] = useState('');

  const selectedCard = cards.find((card) => card.id === selectedKind);
  const selectedCategories = useMemo(
    () => (selectedKind ? categories.filter((category) => category.kind === selectedKind) : []),
    [categories, selectedKind],
  );
  const isMedicine = selectedKind === 'medicine';
  const modalOpen = Boolean(selectedKind);

  const closeModal = () => {
    setSelectedKind(null);
    setNewCategory('');
    setNewWithdrawalDays('0');
    setEditingId(null);
    setEditingWithdrawal('');
  };

  const openCard = (kind: SetupKind) => {
    setSelectedKind(kind);
    setNewCategory('');
    setNewWithdrawalDays('0');
    setEditingId(null);
    setEditingWithdrawal('');
  };

  const saveCategory = async () => {
    if (!selectedKind) {
      return;
    }
    try {
      const withdrawal = isMedicine ? parseNumber(newWithdrawalDays) : 0;
      await addCategory(selectedKind, newCategory, withdrawal);
      setNewCategory('');
      setNewWithdrawalDays('0');
      await reload();
    } catch (error) {
      Alert.alert('Could not save category', error instanceof Error ? error.message : 'Please enter a category name.');
    }
  };

  const saveWithdrawal = async (id: string) => {
    const days = parseNumber(editingWithdrawal);
    if (days < 0) {
      Alert.alert('Invalid value', 'Withdrawal days cannot be negative.');
      return;
    }
    try {
      await updateCategory(id, { defaultWithdrawalDays: days });
      setEditingId(null);
      setEditingWithdrawal('');
      await reload();
    } catch (error) {
      Alert.alert('Could not update', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Farm Setup</Text>
        <View className="w-[30px]" />
      </View>

      <KeyboardSafeScroll contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingTop: 24, paddingBottom: 32 }}>
        <Text className="mb-4 text-[14px] text-[#6B7280]">Tap a category to manage its values.</Text>
        <View className="flex-row flex-wrap" style={{ gap }}>
          {cards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => openCard(card.id)}
              className="items-center justify-center rounded-[16px] bg-[#E0F7F7] px-2 py-4 shadow-sm"
              style={{ width: cardWidth }}
            >
              <Feather name={card.icon} size={28} color="#008B8B" />
              <Text className="mt-2 text-center text-[12px] font-bold leading-4 text-[#008B8B]">{card.title}</Text>
            </Pressable>
          ))}
        </View>
      </KeyboardSafeScroll>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={closeModal}>
          <KeyboardSafeSheet contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 20 }}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="flex-1 text-[18px] font-bold text-[#1F2937]">Manage {selectedCard?.title}</Text>
              <Pressable onPress={closeModal} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <Text className="mb-4 text-[13px] text-[#6B7280]">
              {isMedicine
                ? 'Set default milk withdrawal days for each medicine. Treatment events use this when you select the medicine.'
                : 'These values feed the professional forms, reports, and dashboards.'}
            </Text>

            <View className="rounded-[14px] border border-[#D9E4E4] bg-[#F8FAFA] px-4 py-2">
              <TextInput
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder={isMedicine ? 'Medicine name' : 'Add new category'}
                placeholderTextColor="#6B7280"
                className="h-11 text-[16px] text-[#1F2937]"
              />
              {isMedicine ? (
                <View className="mb-2 mt-1 flex-row items-center border-t border-[#E5E7EB] pt-2">
                  <Text className="mr-2 text-[13px] text-[#6B7280]">Milk withdrawal</Text>
                  <TextInput
                    value={newWithdrawalDays}
                    onChangeText={setNewWithdrawalDays}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    className="h-10 flex-1 text-[16px] font-bold text-[#1F2937]"
                  />
                  <Text className="mr-2 text-[13px] font-semibold text-[#008B8B]">days</Text>
                </View>
              ) : null}
              <Pressable onPress={() => void saveCategory()} className="mb-2 items-center rounded-[10px] bg-[#E6B86F] py-2.5">
                <Text className="font-bold text-white">Add</Text>
              </Pressable>
            </View>

            <View className="mt-4">
              {selectedCategories.length === 0 ? (
                <Text className="py-6 text-center text-[14px] text-[#6B7280]">No items yet</Text>
              ) : (
                selectedCategories.map((category) => (
                  <View key={category.id} className="mb-2 rounded-[12px] border border-[#F3F4F6] bg-white px-4 py-3">
                    <View className="flex-row items-center">
                      <Text className="flex-1 text-[15px] text-[#1F2937]">{category.name}</Text>
                      {category.isDefault ? (
                        <Text className="text-[12px] font-bold text-[#008B8B]">Default</Text>
                      ) : (
                        <Text className="text-[12px] text-[#6B7280]">Custom</Text>
                      )}
                    </View>
                    {isMedicine ? (
                      editingId === category.id ? (
                        <View className="mt-2 flex-row items-center">
                          <TextInput
                            value={editingWithdrawal}
                            onChangeText={setEditingWithdrawal}
                            keyboardType="decimal-pad"
                            className="mr-2 h-10 flex-1 rounded-[10px] border border-[#D9E4E4] px-3 text-[15px] text-[#1F2937]"
                          />
                          <Pressable onPress={() => void saveWithdrawal(category.id)} className="mr-2 rounded-[8px] bg-[#008B8B] px-3 py-2">
                            <Text className="text-[12px] font-bold text-white">Save</Text>
                          </Pressable>
                          <Pressable onPress={() => setEditingId(null)}>
                            <Text className="text-[12px] font-bold text-[#6B7280]">Cancel</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setEditingId(category.id);
                            setEditingWithdrawal(`${category.defaultWithdrawalDays}`);
                          }}
                          className="mt-2 flex-row items-center"
                        >
                          <Text className="flex-1 text-[13px] text-[#DC2626]">
                            Milk withdrawal: {category.defaultWithdrawalDays} day{category.defaultWithdrawalDays === 1 ? '' : 's'}
                          </Text>
                          <Feather name="edit-2" size={14} color="#008B8B" />
                        </Pressable>
                      )
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </KeyboardSafeSheet>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}
