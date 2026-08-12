import { useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { SelectDropdown } from './SelectDropdown';
import { MEDICATION_ROUTES } from '../utils/eventConstants';

export type MedicationFormValues = {
  medicine: string;
  dosage: string;
  route: string;
  frequency: string;
  withdrawalDays: string;
  batchNumber: string;
  vetContact: string;
  followUpDate: string;
  treatmentCost: string;
};

type Props = {
  medicineOptions: string[];
  withdrawalByMedicine?: Record<string, number>;
  values: MedicationFormValues;
  onChange: (patch: Partial<MedicationFormValues>) => void;
  showTreatmentCost?: boolean;
};

export function MedicationFields({ medicineOptions, withdrawalByMedicine, values, onChange, showTreatmentCost = true }: Props) {
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

  const handleFollowUpChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const timestamp = event.nativeEvent.timestamp;
    const pickedDate = selectedDate ?? (timestamp ? new Date(timestamp) : undefined);
    if (event.type === 'dismissed' || !pickedDate) {
      if (Platform.OS !== 'ios') {
        setShowFollowUpPicker(false);
      }
      return;
    }
    onChange({ followUpDate: formatPickerDate(pickedDate) });
    if (Platform.OS !== 'ios') {
      setShowFollowUpPicker(false);
    }
  };

  const selectMedicine = (medicine: string) => {
    const defaultDays = withdrawalByMedicine?.[medicine];
    onChange({
      medicine,
      ...(defaultDays !== undefined ? { withdrawalDays: `${defaultDays}` } : {}),
    });
  };

  return (
    <>
      <SelectDropdown label="Medicine" value={values.medicine} placeholder="Select medicine" options={medicineOptions} onSelect={selectMedicine} />
      <Field label="Dosage" placeholder="e.g. 10 ml" value={values.dosage} onChangeText={(dosage) => onChange({ dosage })} />
      <SelectDropdown label="Route" value={values.route} placeholder="Select route" options={[...MEDICATION_ROUTES]} onSelect={(route) => onChange({ route })} />
      <Field label="Frequency" placeholder="e.g. Once daily for 3 days" value={values.frequency} onChangeText={(frequency) => onChange({ frequency })} />
      <Field label="Withdrawal Days" placeholder="Milk/meat withholding days" keyboardType="decimal-pad" value={values.withdrawalDays} onChangeText={(withdrawalDays) => onChange({ withdrawalDays })} />
      {withdrawalByMedicine && values.medicine ? (
        <Text className="mb-3 -mt-1 text-[12px] text-[#6B7280]">
          Default from Settings/Farm Setup: {withdrawalByMedicine[values.medicine] ?? 0} days (you can override).
        </Text>
      ) : null}
      <Field label="Batch / Lot Number" placeholder="Medicine batch number" value={values.batchNumber} onChangeText={(batchNumber) => onChange({ batchNumber })} />
      <Field label="Vet Contact" placeholder="Phone or clinic name" value={values.vetContact} onChangeText={(vetContact) => onChange({ vetContact })} />
      <Label text="Follow-up Date" />
      <Pressable onPress={() => setShowFollowUpPicker(true)} className="h-[48px] flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
        <Text className={values.followUpDate ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{values.followUpDate || 'Select follow-up date'}</Text>
        <Feather name="calendar" size={18} color="#6B7280" />
      </Pressable>
      {showTreatmentCost ? (
        <Field label="Treatment Cost (RWF)" placeholder="Optional vet/medicine cost" keyboardType="decimal-pad" value={values.treatmentCost} onChangeText={(treatmentCost) => onChange({ treatmentCost })} />
      ) : null}

      {showFollowUpPicker && Platform.OS !== 'ios' ? (
        <DateTimePicker value={parseDateForPicker(values.followUpDate)} mode="date" display="calendar" onChange={handleFollowUpChange} />
      ) : null}

      <Modal visible={showFollowUpPicker && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setShowFollowUpPicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowFollowUpPicker(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-[#1F2937]">Follow-up Date</Text>
              <Pressable onPress={() => setShowFollowUpPicker(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#6B7280" />
              </Pressable>
            </View>
            <DateTimePicker
              value={parseDateForPicker(values.followUpDate)}
              mode="date"
              display="spinner"
              themeVariant="light"
              onChange={handleFollowUpChange}
              style={{ height: 216, width: '100%' }}
            />
            <Pressable onPress={() => setShowFollowUpPicker(false)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">{text}</Text>;
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <>
      <Label text={label} />
      <View className="h-[48px] justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} className="text-[16px] text-[#1F2937]" />
      </View>
    </>
  );
}

function parseDateForPicker(value: string): Date {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatPickerDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyMedicationValues(source?: Partial<MedicationFormValues>): MedicationFormValues {
  return {
    medicine: source?.medicine ?? '',
    dosage: source?.dosage ?? '',
    route: source?.route ?? '',
    frequency: source?.frequency ?? '',
    withdrawalDays: source?.withdrawalDays ? `${source.withdrawalDays}` : '',
    batchNumber: source?.batchNumber ?? '',
    vetContact: source?.vetContact ?? '',
    followUpDate: source?.followUpDate ?? '',
    treatmentCost: source?.treatmentCost ?? '',
  };
}
