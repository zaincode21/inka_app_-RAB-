import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardSafeScroll, KeyboardSafeSheet } from '../components/KeyboardSafeScroll';
import { SelectDropdown } from '../components/SelectDropdown';
import { useRequireAccess } from '../data/accessGuard';
import { getCurrentSession } from '../data/authApi';
import {
  type Cattle,
  type MilkWithdrawalStatus,
  formatMoney,
  formatNumber,
  getCattle,
  getMilkWithdrawalStatus,
  getSystemConfig,
  parseNumber,
  todayIsoDate,
  updateMilkRecord,
  useDatabaseQuery,
} from '../data/farmDatabase';
import { createMilkRecordOrQueue } from '../data/offlineQueue';
import { canWriteMilk } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { showInfoToast, showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMilkRecord'>;

export function AddMilkRecordScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  useRequireAccess(canWriteMilk(getCurrentSession()?.user), navigation);
  const editing = route.params?.milkRecord;
  const milkTypeOptions = useMemo(
    () => [
      { label: t('milk.wholeFarm'), value: 'Whole Farm' },
      { label: t('milk.individualCow'), value: 'Individual Cow Milk' },
    ],
    [t],
  );
  const isEditing = Boolean(editing);
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const [date, setDate] = useState(editing?.date || todayIsoDate());
  const [milkType, setMilkType] = useState(editing?.milkType || '');
  const [selectedCow, setSelectedCow] = useState<Cattle | null>(null);
  const [cowSearch, setCowSearch] = useState('');
  const [showCowPicker, setShowCowPicker] = useState(false);
  const [amTotal, setAmTotal] = useState(editing ? String(editing.amTotal || '') : '');
  const [pmTotal, setPmTotal] = useState(editing ? String(editing.pmTotal || '') : '');
  const [totalUsed, setTotalUsed] = useState(editing ? String(editing.totalUsed || '') : '');
  const [calfMilk, setCalfMilk] = useState(editing ? String(editing.calfMilk || '') : '');
  const [rejectedMilk, setRejectedMilk] = useState(editing ? String(editing.rejectedMilk || '') : '');
  const [buyer, setBuyer] = useState(editing?.buyer || '');
  const [destination, setDestination] = useState(editing?.destination || '');
  const [milkPricePerLiter, setMilkPricePerLiter] = useState(editing?.pricePerLiter || 0);
  const [withdrawal, setWithdrawal] = useState<MilkWithdrawalStatus | null>(null);
  const [notes, setNotes] = useState(editing?.notes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalProduced = parseNumber(amTotal) + parseNumber(pmTotal);
  const underWithdrawal = Boolean(milkType === 'Individual Cow Milk' && withdrawal?.underWithdrawal);
  const usedLiters = parseNumber(totalUsed);
  const calfLiters = parseNumber(calfMilk);
  const rejectedLiters = underWithdrawal && totalProduced > 0 ? totalProduced : parseNumber(rejectedMilk);
  const soldLiters = Math.max(0, Number((totalProduced - usedLiters - calfLiters - rejectedLiters).toFixed(2)));
  const estimatedSale = Number((soldLiters * milkPricePerLiter).toFixed(2));
  const estimatedCalfExpense = Number((calfLiters * milkPricePerLiter).toFixed(2));

  const cowOptions = cattle.filter((animal) => {
    if (animal.status.trim().toLowerCase() !== 'active') {
      return false;
    }
    const query = cowSearch.trim().toLowerCase();
    const isFemaleCow = animal.gender.toLowerCase() === 'female' || ['Cow', 'Heifer'].includes(animal.stage);
    if (!isFemaleCow) {
      return false;
    }
    if (!query) {
      return true;
    }
    return `${animal.tagNumber} ${animal.name} ${animal.breed}`.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!editing || editing.milkType !== 'Individual Cow Milk' || cattle.length === 0) {
      return;
    }
    const match =
      cattle.find((animal) => animal.id === editing.cattleId) ||
      cattle.find((animal) => animal.tagNumber === editing.cattleTag);
    if (match) {
      setSelectedCow(match);
    }
  }, [editing, cattle]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const config = await getSystemConfig();
        if (!cancelled) {
          if (!isEditing || !editing?.pricePerLiter) {
            setMilkPricePerLiter(config.milkPricePerLiter);
          }
          const shared = config.defaultMilkBuyer.trim() || config.defaultMilkDestination.trim();
          setBuyer((current) => current || shared);
          setDestination((current) => current || shared);
        }
      } catch {
        // Keep defaults when settings cannot load.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing, editing?.pricePerLiter]);

  useEffect(() => {
    let cancelled = false;
    if (milkType !== 'Individual Cow Milk' || !selectedCow?.tagNumber || !date.trim()) {
      setWithdrawal(null);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const status = await getMilkWithdrawalStatus(selectedCow.tagNumber, date.trim());
        if (!cancelled) {
          setWithdrawal(status);
        }
      } catch {
        if (!cancelled) {
          setWithdrawal(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [milkType, selectedCow?.tagNumber, date]);

  useEffect(() => {
    if (underWithdrawal && totalProduced > 0) {
      setRejectedMilk(totalProduced.toFixed(1));
    }
  }, [underWithdrawal, totalProduced]);

  const buildPayload = (createMilkSale: boolean) => {
    return {
      cattleId: milkType === 'Individual Cow Milk' ? selectedCow?.id ?? '' : '',
      cattleTag: milkType === 'Individual Cow Milk' ? selectedCow?.tagNumber ?? '' : '',
      cattleName: milkType === 'Individual Cow Milk' ? selectedCow?.name ?? '' : '',
      date: date.trim(),
      milkType,
      amTotal: parseNumber(amTotal),
      noonTotal: 0,
      pmTotal: parseNumber(pmTotal),
      totalProduced,
      totalUsed: usedLiters,
      calfMilk: calfLiters,
      rejectedMilk: rejectedLiters,
      destination: destination.trim(),
      buyer: buyer.trim(),
      pricePerLiter: milkPricePerLiter,
      fatPercent: editing?.fatPercent ?? 0,
      proteinPercent: editing?.proteinPercent ?? 0,
      somaticCellCount: editing?.somaticCellCount ?? 0,
      notes: notes.trim(),
      createMilkSale,
      paymentMethod: 'Cash',
    };
  };

  const persistRecord = async (createMilkSale: boolean) => {
    setSaving(true);
    try {
      const base = buildPayload(createMilkSale);
      const withdrawalNote =
        !isEditing && underWithdrawal && withdrawal?.active
          ? `Milk withheld: ${withdrawal.active.medicine} until ${withdrawal.active.withdrawalEndsOn} (${withdrawal.active.eventType}).`
          : '';
      const payload = {
        ...base,
        notes: [base.notes, withdrawalNote].filter(Boolean).join(' '),
      };
      if (editing) {
        await updateMilkRecord(editing.id, payload);
      } else {
        const result = await createMilkRecordOrQueue(payload);
        if (result.status === 'queued') {
          showInfoToast('Milk record will sync when you are back online.', 'Saved offline');
          navigation.goBack();
          return;
        }
      }
      showSuccessToast(isEditing ? 'Milk record updated.' : 'Milk record saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        isEditing ? 'Could not update milk record' : 'Could not save milk record',
        error instanceof Error ? error.message : 'Please check the details and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const saveRecord = async () => {
    if (!date.trim() || !milkType) {
      Alert.alert('Missing milk details', 'Milking date and milk type are required.');
      return;
    }

    if (milkType === 'Individual Cow Milk' && !selectedCow) {
      Alert.alert('Select cow', 'Please select the cow for this individual milk record.');
      return;
    }

    if (!amTotal.trim() && !pmTotal.trim()) {
      Alert.alert('Missing milk total', 'Please enter at least one milk total.');
      return;
    }

    if (usedLiters + calfLiters + rejectedLiters > totalProduced + 0.0001) {
      Alert.alert('Invalid milk split', 'Used + calf milk + rejected cannot exceed total produced.');
      return;
    }

    const canOfferSale = milkType === 'Whole Farm' && soldLiters > 0 && milkPricePerLiter > 0;
    if (!canOfferSale) {
      await persistRecord(false);
      return;
    }

    Alert.alert(
      isEditing ? 'Update Milk Sale?' : 'Create Milk Sale?',
      `Sold liters: ${formatNumber(soldLiters)} L\nPrice: ${formatMoney(milkPricePerLiter)} / L\nEstimated income: ${formatMoney(estimatedSale)}\n\nRejected liters are not included in the sale.`,
      [
        { text: isEditing ? 'Save without updating sale' : 'Save without income', style: 'cancel', onPress: () => void persistRecord(false) },
        { text: isEditing ? 'Update Milk Sale' : 'Create Milk Sale', onPress: () => void persistRecord(true) },
      ],
    );
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const timestamp = event.nativeEvent.timestamp;
    const pickedDate = selectedDate ?? (timestamp ? new Date(timestamp) : undefined);

    if (event.type === 'dismissed' || !pickedDate) {
      if (Platform.OS !== 'ios') {
        setShowDatePicker(false);
      }
      return;
    }

    setDate(formatPickerDate(pickedDate));
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">
          {isEditing ? t('milk.editTitle') : t('milk.newTitle')}
        </Text>
        <View className="w-[30px]" />
      </View>

      <KeyboardSafeScroll
        contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
        footer={
          <View className="flex-row bg-white px-6 py-4">
            <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
              <Text className="text-[16px] font-bold text-[#008B8B]">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void saveRecord();
              }}
              disabled={saving}
              className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3"
            >
              <Text className="text-[16px] font-bold text-white">
                {saving ? t('common.saving') : isEditing ? t('common.update') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        }
      >
        <Label text={t('milk.milkingDate')} />
        <DateField value={date} placeholder={t('milk.selectDate')} onPress={() => setShowDatePicker(true)} />

        <SelectDropdown
          label={t('milk.milkType')}
          value={milkType}
          placeholder={t('milk.select')}
          options={milkTypeOptions}
          onSelect={(value) => {
            setMilkType(value);
            if (value !== 'Individual Cow Milk') {
              setSelectedCow(null);
              setCowSearch('');
              setWithdrawal(null);
            }
          }}
        />

        {milkType === 'Individual Cow Milk' ? (
          <>
            <Label text={t('milk.selectCow')} />
            <CowField cow={selectedCow} onPress={() => setShowCowPicker(true)} />
          </>
        ) : null}

        {underWithdrawal && withdrawal?.active ? (
          <View className="mb-4 rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
            <Text className="text-[14px] font-bold text-[#DC2626]">Milk under withdrawal</Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#7F1D1D]">
              {selectedCow?.tagNumber}: {withdrawal.active.medicine} from {withdrawal.active.eventDate}. Withhold until{' '}
              {withdrawal.active.withdrawalEndsOn}. Produced milk is auto-marked rejected (not for sale).
            </Text>
          </View>
        ) : null}

        <Label text={t('milk.amTotal')} />
        <Input placeholder="0.0" keyboardType="decimal-pad" value={amTotal} onChangeText={setAmTotal} />

        <Label text={t('milk.pmTotal')} />
        <Input placeholder="0.0" keyboardType="decimal-pad" value={pmTotal} onChangeText={setPmTotal} />

        <Label text="Total Milk Produced" />
        <Input placeholder="0.0" value={totalProduced.toFixed(1)} onChangeText={() => {}} editable={false} />

        <Label text={t('milk.used')} />
        <Input placeholder="0.0" keyboardType="decimal-pad" value={totalUsed} onChangeText={setTotalUsed} />
        <Text className="mb-3 -mt-1 text-[12px] text-[#6B7280]">Farm or household use (not for calves).</Text>

        <Label text={t('milk.calfMilk')} />
        <Input placeholder="0.0" keyboardType="decimal-pad" value={calfMilk} onChangeText={setCalfMilk} />
        <Text className="mb-3 -mt-1 text-[12px] text-[#6B7280]">Milk fed to calves.</Text>
        {calfLiters > 0 ? (
          <View className="mb-4 rounded-[14px] border border-[#D9E4E4] bg-[#FFF7ED] px-4 py-3">
            <Text className="text-[13px] font-semibold text-[#C2410C]">Calf milk expense</Text>
            <Text className="mt-1 text-[14px] text-[#9A3412]">
              Calf milk: {formatNumber(calfLiters)} L × {formatMoney(milkPricePerLiter)} / L
            </Text>
            <Text className="mt-1 text-[15px] font-bold text-[#EA580C]">
              Estimated expense: {formatMoney(estimatedCalfExpense)}
            </Text>
            {milkPricePerLiter <= 0 ? (
              <Text className="mt-2 text-[12px] text-[#DC2626]">
                Set milk price in Settings → System Configuration to post calf milk expense.
              </Text>
            ) : (
              <Text className="mt-2 text-[12px] text-[#9A3412]">Posted automatically when you save.</Text>
            )}
          </View>
        ) : null}

        <Label text={t('milk.rejected')} />
        <Input
          placeholder="0.0"
          keyboardType="decimal-pad"
          value={underWithdrawal && totalProduced > 0 ? totalProduced.toFixed(1) : rejectedMilk}
          onChangeText={setRejectedMilk}
          editable={!underWithdrawal}
        />
        {rejectedLiters > 0 ? (
          <Text className="mb-3 -mt-1 text-[12px] text-[#DC2626]">Rejected milk is not included in Milk Sale.</Text>
        ) : (
          <Text className="mb-3 -mt-1 text-[12px] text-[#6B7280]">Mastitis discard, spill, or withheld milk.</Text>
        )}

        {milkType === 'Whole Farm' ? (
          <>
            <Label text={t('milk.buyer')} />
            <Input placeholder="Cooperative / buyer" value={buyer} onChangeText={setBuyer} />
            <Label text={t('milk.destination')} />
            <Input placeholder="Processor / market" value={destination} onChangeText={setDestination} />
            <View className="mb-4 rounded-[14px] border border-[#D9E4E4] bg-[#F0FDFA] px-4 py-3">
              <Text className="text-[13px] font-semibold text-[#0F766E]">Sale preview (Whole Farm)</Text>
              <Text className="mt-1 text-[14px] text-[#134E4A]">
                Sold liters: {formatNumber(soldLiters)} L (produced − used − calf − rejected)
              </Text>
              <Text className="mt-1 text-[14px] text-[#134E4A]">
                Price: {formatMoney(milkPricePerLiter)} / L (from Settings)
              </Text>
              <Text className="mt-1 text-[15px] font-bold text-[#008B8B]">Estimated Milk Sale: {formatMoney(estimatedSale)}</Text>
              {milkPricePerLiter <= 0 ? (
                <Text className="mt-2 text-[12px] text-[#DC2626]">Set milk price in Settings → System Configuration to enable income posting.</Text>
              ) : null}
            </View>
          </>
        ) : null}

        <Label text={t('milk.notes')} />
        <Input placeholder="Write something" multiline value={notes} onChangeText={setNotes} />
      </KeyboardSafeScroll>

      {showDatePicker && Platform.OS !== 'ios' ? (
        <DateTimePicker value={parseDateForPicker(date)} mode="date" display="calendar" onChange={handleDateChange} />
      ) : null}

      <Modal visible={showDatePicker && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowDatePicker(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">{t('milk.milkingDate')}</Text>
              <Pressable onPress={() => setShowDatePicker(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <DateTimePicker value={parseDateForPicker(date)} mode="date" display="inline" themeVariant="light" onChange={handleDateChange} style={{ height: 330, width: '100%' }} />
            <Pressable onPress={() => setShowDatePicker(false)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCowPicker} transparent animationType="fade" onRequestClose={() => setShowCowPicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowCowPicker(false)}>
          <KeyboardSafeSheet
            className="max-h-[80%] rounded-t-[24px] bg-white"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 20 }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">Select Cow</Text>
              <Pressable onPress={() => setShowCowPicker(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <View className="mb-4 h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
              <Feather name="search" size={18} color="#6B7280" />
              <TextInput value={cowSearch} onChangeText={setCowSearch} placeholder="Search by tag, name, or breed" placeholderTextColor="#6B7280" className="ml-3 flex-1 text-[16px] text-[#1F2937]" />
            </View>

            <View>
              {cowOptions.length === 0 ? (
                <Text className="py-6 text-center text-[14px] text-[#6B7280]">No cows found</Text>
              ) : (
                cowOptions.map((cow) => {
                  const selected = selectedCow?.id === cow.id;
                  return (
                    <Pressable
                      key={cow.id}
                      onPress={() => {
                        setSelectedCow(cow);
                        setCowSearch('');
                        setShowCowPicker(false);
                      }}
                      className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#008B8B] bg-[#E0F7F7]' : 'border-[#E5E7EB] bg-white'}`}
                    >
                      <View className="flex-1">
                        <Text className={`text-[16px] ${selected ? 'font-bold text-[#008B8B]' : 'font-bold text-[#1F2937]'}`}>
                          {cow.name.trim() || cow.tagNumber}
                        </Text>
                        <Text className="mt-1 text-[13px] text-[#6B7280]">{cow.breed} • {cow.stage}</Text>
                      </View>
                      {selected ? <Feather name="check" size={18} color="#008B8B" /> : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          </KeyboardSafeSheet>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-1 text-[14px] font-semibold text-[#6B7280]">{text}</Text>;
}

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  multiline = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  editable?: boolean;
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#6B7280"
      keyboardType={keyboardType}
      editable={editable}
      multiline={multiline}
      className={`mb-3 rounded-[14px] border border-[#D9E4E4] bg-white px-4 text-[16px] text-[#1F2937] ${multiline ? 'min-h-[90px] py-3' : 'h-12'} ${editable ? '' : 'bg-[#F3F4F6]'}`}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

function DateField({ value, placeholder, onPress }: { value: string; placeholder: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-3 h-12 flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4">
      <Text className={value ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{value || placeholder}</Text>
      <Feather name="calendar" size={18} color="#6B7280" />
    </Pressable>
  );
}

function CowField({ cow, onPress }: { cow: Cattle | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-3 min-h-12 justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
      {cow ? (
        <Text className="text-[16px] font-bold text-[#1F2937]">{cow.name.trim() || cow.tagNumber}</Text>
      ) : (
        <Text className="text-[16px] text-[#6B7280]">Select cow</Text>
      )}
    </Pressable>
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
