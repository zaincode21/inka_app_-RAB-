import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardSafeScroll } from '../components/KeyboardSafeScroll';
import { SelectDropdown } from '../components/SelectDropdown';
import { emptyMedicationValues, MedicationFields } from '../components/MedicationFields';
import { useRequireAccess } from '../data/accessGuard';
import { getCurrentSession } from '../data/authApi';
import { createHealthEvent, getCategories, parseNumber, todayIsoDate, updateHealthEvent, useDatabaseQuery } from '../data/farmDatabase';
import { canWriteEvents } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { eventTypeOptionsFromNames, normalizeMassEventType, requiresMedicine } from '../utils/eventConstants';
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMassEvent'>;

export function AddMassEventScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  useRequireAccess(canWriteEvents(getCurrentSession()?.user), navigation);
  const editingEvent = route.params?.event;
  const isEditing = Boolean(editingEvent);
  const { data: medicines } = useDatabaseQuery(() => getCategories('medicine'), []);
  const { data: groups } = useDatabaseQuery(() => getCategories('group'), []);
  const { data: eventTypes } = useDatabaseQuery(() => getCategories('event'), []);
  const medicineOptions = useMemo(() => medicines.map((category) => category.name), [medicines]);
  const withdrawalByMedicine = useMemo(
    () => Object.fromEntries(medicines.map((category) => [category.name, category.defaultWithdrawalDays])),
    [medicines],
  );
  const groupOptions = useMemo(() => groups.map((category) => category.name), [groups]);
  const [eventDate, setEventDate] = useState(editingEvent?.eventDate ?? todayIsoDate());
  const [eventType, setEventType] = useState(editingEvent ? normalizeMassEventType(editingEvent.eventType) : '');
  const eventTypeOptions = useMemo(
    () => eventTypeOptionsFromNames(eventTypes.map((category) => category.name), t, eventType),
    [eventTypes, t, eventType],
  );
  const [groupName, setGroupName] = useState(editingEvent?.groupName ?? '');
  const [technician, setTechnician] = useState(editingEvent?.technician ?? '');
  const [vetName, setVetName] = useState(editingEvent?.vetName ?? '');
  const [notes, setNotes] = useState(editingEvent?.notes ?? '');
  const [medication, setMedication] = useState(
    emptyMedicationValues({
      medicine: editingEvent?.medicine,
      dosage: editingEvent?.dosage,
      route: editingEvent?.route,
      frequency: editingEvent?.frequency,
      withdrawalDays: editingEvent?.withdrawalDays ? `${editingEvent.withdrawalDays}` : undefined,
      batchNumber: editingEvent?.batchNumber,
      vetContact: editingEvent?.vetContact,
      followUpDate: editingEvent?.followUpDate,
    }),
  );

  const saveEvent = async () => {
    if (!eventDate.trim() || !eventType) {
      Alert.alert('Missing event details', 'Event date and event type are required.');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Missing group', 'Please select the cattle group or paddock treated.');
      return;
    }

    if (requiresMedicine(eventType) && !medication.medicine) {
      Alert.alert('Missing medicine', 'Please select medicine information.');
      return;
    }

    if (eventType === 'Herd Spraying' && !medication.medicine.trim() && !notes.trim()) {
      Alert.alert('Missing spray details', 'Enter the product used in medicine or notes.');
      return;
    }

    try {
      const payload = {
        scope: 'mass' as const,
        cattleTag: '',
        groupName: groupName.trim(),
        eventDate: eventDate.trim(),
        eventType,
        symptoms: '',
        diagnosis: '',
        medicine: requiresMedicine(eventType) || eventType === 'Herd Spraying' ? medication.medicine : '',
        dosage: medication.dosage.trim(),
        route: medication.route.trim(),
        frequency: medication.frequency.trim(),
        withdrawalDays: parseNumber(medication.withdrawalDays),
        batchNumber: medication.batchNumber.trim(),
        technician: technician.trim(),
        vetName: vetName.trim(),
        vetContact: medication.vetContact.trim(),
        followUpDate: medication.followUpDate.trim(),
        weightKg: 0,
        bodyConditionScore: 0,
        treatmentCost: parseNumber(medication.treatmentCost),
        semenUsed: '',
        bullResponsible: '',
        returnHeatDate: '',
        breedingDate: '',
        expectedDeliveryDate: '',
        calfTag: '',
        calfGender: '',
        sourceEventId: '',
        notes: notes.trim(),
        photoUri: '',
      };

      if (isEditing && editingEvent) {
        await updateHealthEvent(editingEvent.id, payload);
        showSuccessToast('Mass event updated.');
      } else {
        await createHealthEvent(payload);
        showSuccessToast('Mass event saved.');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(isEditing ? 'Could not update mass event' : 'Could not save mass event', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">{isEditing ? 'Edit Mass Event' : 'Add Mass Event'}</Text>
      </View>

      <KeyboardSafeScroll
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}
        footer={
          <View className="flex-row bg-white px-6 py-4">
            <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
              <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEvent} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">{isEditing ? 'Update' : 'Save'}</Text>
            </Pressable>
          </View>
        }
      >
        <Label text="Event Date" />
        <Input placeholder="YYYY-MM-DD" value={eventDate} onChangeText={setEventDate} />

        <SelectDropdown label="Event Type" value={eventType} placeholder="Select" options={eventTypeOptions} onSelect={setEventType} />

        <SelectDropdown label="Cattle Group / Paddock" value={groupName} placeholder="Select group treated" options={groupOptions} onSelect={setGroupName} />

        <Label text="Technician Name" />
        <Input placeholder="Who performed the treatment" value={technician} onChangeText={setTechnician} />

        <Label text="Veterinarian Name" />
        <Input placeholder="Optional supervising vet" value={vetName} onChangeText={setVetName} />

        {requiresMedicine(eventType) || eventType === 'Herd Spraying' ? (
          <MedicationFields medicineOptions={medicineOptions} withdrawalByMedicine={withdrawalByMedicine} values={medication} onChange={(patch) => setMedication((current) => ({ ...current, ...patch }))} />
        ) : null}

        <Label text="Notes" />
        <Input placeholder="Herd notes, product details, or observations" multiline value={notes} onChangeText={setNotes} />
      </KeyboardSafeScroll>

      <StatusBar style="light" />
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">{text}</Text>;
}

function Input({ placeholder, value, onChangeText, multiline = false }: { placeholder: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
  return (
    <View className={`${multiline ? 'min-h-[100px]' : 'h-[48px]'} mt-3 justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" multiline={multiline} className="text-[16px] text-[#1F2937]" />
    </View>
  );
}
