import { Feather } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import { emptyMedicationValues, MedicationFields } from '../components/MedicationFields';
import { addDays, combineDateAndTime, createHealthEvent, DEFAULT_RETURN_HEAT_DAYS, DEFAULT_RETURN_HEAT_TIME, getBirthPrefillEvent, getCattle, getCategories, getLatestBreedingEvent, getSystemConfig, parseNumber, updateHealthEvent, useDatabaseQuery, type HealthEvent } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';
import { FEMALE_ONLY_EVENT_TYPES, INDIVIDUAL_EVENT_TYPES, requiresClinicalNotes, requiresMedicationDetails, requiresMedicine } from '../utils/eventConstants';
import { getInbreedingViolation, INBREEDING_CHECK_EVENT_TYPES } from '../utils/inbreeding';

type Props = NativeStackScreenProps<RootStackParamList, 'AddIndividualEvent'>;

const breedingMethods = [
  { label: 'Gutera intanga', value: 'semen' },
  { label: 'Ikimasa', value: 'bull' },
];

export function AddIndividualEventScreen({ navigation, route }: Props) {
  const editingEvent = route.params?.event;
  const isEditing = Boolean(editingEvent);
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const { data: medicines } = useDatabaseQuery(() => getCategories('medicine'), []);
  const medicineOptions = useMemo(() => medicines.map((category) => category.name), [medicines]);
  const [latestBreedingEvent, setLatestBreedingEvent] = useState<HealthEvent | null>(null);
  const [birthPrefillEvent, setBirthPrefillEvent] = useState<HealthEvent | null>(null);
  const [eventDate, setEventDate] = useState(editingEvent?.eventDate ?? '');
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [cattleTag, setCattleTag] = useState(editingEvent?.cattleTag ?? route.params?.cattleTag ?? '');
  const [eventType, setEventType] = useState(editingEvent?.eventType ?? route.params?.presetEventType ?? '');
  const sourceEventId = editingEvent?.sourceEventId ?? route.params?.sourceEventId ?? '';
  const [breedingMethod, setBreedingMethod] = useState(inferBreedingMethod(editingEvent));
  const [calfName, setCalfName] = useState(editingEvent?.calfTag ?? '');
  const [calfGender, setCalfGender] = useState(editingEvent?.calfGender ?? '');
  const [symptoms, setSymptoms] = useState(editingEvent?.symptoms ?? '');
  const [diagnosis, setDiagnosis] = useState(editingEvent?.diagnosis ?? '');
  const [technician, setTechnician] = useState(editingEvent?.technician ?? '');
  const [vetName, setVetName] = useState(editingEvent?.vetName ?? '');
  const [weightResult, setWeightResult] = useState(editingEvent?.weightKg ? `${editingEvent.weightKg}` : '');
  const [bodyConditionScore, setBodyConditionScore] = useState(editingEvent?.bodyConditionScore ? `${editingEvent.bodyConditionScore}` : '');
  const [semenUsed, setSemenUsed] = useState(editingEvent?.semenUsed ?? '');
  const [bullResponsible, setBullResponsible] = useState(editingEvent?.bullResponsible ?? '');
  const [breedingDate, setBreedingDate] = useState(editingEvent?.breedingDate ?? '');
  const [notes, setNotes] = useState(editingEvent?.notes ?? '');
  const [returnHeatDays, setReturnHeatDays] = useState(DEFAULT_RETURN_HEAT_DAYS);
  const [returnHeatTime, setReturnHeatTime] = useState(DEFAULT_RETURN_HEAT_TIME);
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

  const cattleTagOptions = useMemo(() => {
    const eligibleCattle = FEMALE_ONLY_EVENT_TYPES.has(eventType) ? cattle.filter(isFemaleCattle) : cattle;
    return eligibleCattle.map((animal) => animal.tagNumber);
  }, [cattle, eventType]);
  const activeCattleTag = route.params?.cattleTag ?? cattleTag;
  const selectedCattle = useMemo(() => cattle.find((animal) => animal.tagNumber === activeCattleTag), [cattle, activeCattleTag]);
  const femaleOnlyEventBlocked = FEMALE_ONLY_EVENT_TYPES.has(eventType) && Boolean(selectedCattle) && !isFemaleCattle(selectedCattle!);
  const returnHeatDate =
    eventType === 'Breeding' && eventDate
      ? combineDateAndTime(addDays(eventDate, returnHeatDays), returnHeatTime)
      : '';
  const expectedDeliveryDate = eventType === 'Breeding' || eventType === 'Pregnant' || eventType === 'Pregnancy Diagnosis' ? addDays(breedingDate || eventDate, 280) : '';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const config = await getSystemConfig();
        if (!cancelled) {
          setReturnHeatDays(config.returnHeatDays);
          setReturnHeatTime(config.returnHeatTime);
        }
      } catch {
        if (!cancelled) {
          setReturnHeatDays(DEFAULT_RETURN_HEAT_DAYS);
          setReturnHeatTime(DEFAULT_RETURN_HEAT_TIME);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!FEMALE_ONLY_EVENT_TYPES.has(eventType) || !cattleTag) {
      return;
    }
    const selected = cattle.find((animal) => animal.tagNumber === cattleTag);
    if (selected && !isFemaleCattle(selected)) {
      setCattleTag('');
    }
  }, [eventType, cattle, cattleTag]);

  useEffect(() => {
    let cancelled = false;
    if (eventType !== 'Pregnant' || !cattleTag || isEditing) {
      setLatestBreedingEvent(null);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const breeding = await getLatestBreedingEvent(cattleTag);
        if (cancelled) {
          return;
        }
        setLatestBreedingEvent(breeding);
        if (breeding) {
          prefillPregnantFromBreeding(breeding, { setBreedingDate, setBullResponsible, setSemenUsed, setVetName });
        }
      } catch {
        if (!cancelled) {
          setLatestBreedingEvent(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventType, cattleTag, isEditing]);

  useEffect(() => {
    let cancelled = false;
    if (eventType !== 'Giving Birth' || !cattleTag || isEditing) {
      setBirthPrefillEvent(null);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const prefillEvent = await getBirthPrefillEvent(cattleTag);
        if (cancelled) {
          return;
        }
        setBirthPrefillEvent(prefillEvent);
        if (prefillEvent) {
          setBullResponsible(prefillEvent.bullResponsible || prefillEvent.semenUsed || '');
        }
      } catch {
        if (!cancelled) {
          setBirthPrefillEvent(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventType, cattleTag, isEditing]);

  const handleEventDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const timestamp = event.nativeEvent.timestamp;
    const pickedDate = selectedDate ?? (timestamp ? new Date(timestamp) : undefined);
    if (event.type === 'dismissed' || !pickedDate) {
      if (Platform.OS !== 'ios') {
        setShowEventDatePicker(false);
      }
      return;
    }
    setEventDate(formatPickerDate(pickedDate));
    if (Platform.OS !== 'ios') {
      setShowEventDatePicker(false);
    }
  };

  const saveEvent = async () => {
    if (!eventDate.trim() || !eventType) {
      Alert.alert('Missing event details', 'Event date and event type are required.');
      return;
    }
    if (!cattleTag) {
      Alert.alert('Select animal', 'Please select the animal for this individual event.');
      return;
    }
    const selectedAnimal = cattle.find((animal) => animal.tagNumber === cattleTag);
    if (FEMALE_ONLY_EVENT_TYPES.has(eventType) && selectedAnimal && !isFemaleCattle(selectedAnimal)) {
      Alert.alert('Female cattle only', 'This event can only be recorded for female cattle.');
      return;
    }

    let resolvedBullName = bullResponsible.trim();
    if (eventType === 'Giving Birth' && !resolvedBullName && cattleTag) {
      try {
        const prefill = birthPrefillEvent ?? (await getBirthPrefillEvent(cattleTag));
        if (prefill) {
          setBirthPrefillEvent(prefill);
          resolvedBullName = prefill.bullResponsible.trim() || prefill.semenUsed.trim();
          setBullResponsible(resolvedBullName);
        }
      } catch {
        // Validation below handles missing bull name.
      }
    }

    if (!validateEventFields(eventType, breedingMethod, { symptoms, diagnosis, technician, medicine: medication.medicine, weightResult, semenUsed, vetName, breedingDate, bullResponsible: resolvedBullName })) {
      return;
    }

    if (INBREEDING_CHECK_EVENT_TYPES.has(eventType)) {
      const selectedAnimal = cattle.find((animal) => animal.tagNumber === cattleTag);
      const bullToCheck = eventType === 'Breeding' || eventType === 'Pregnant' || eventType === 'Pregnancy Diagnosis' ? bullResponsible.trim() : resolvedBullName;
      const inbreedingError = getInbreedingViolation(selectedAnimal, bullToCheck, cattle);
      if (inbreedingError) {
        Alert.alert('Inbreeding not allowed', inbreedingError);
        return;
      }
    }

    if (eventType === 'Giving Birth' && (!calfName.trim() || !calfGender)) {
      Alert.alert('Missing calf details', 'Please enter the calf name and select gender.');
      return;
    }

    const usesMedication = requiresMedicationDetails(eventType);
    try {
      const payload = {
        scope: 'individual' as const,
        cattleTag,
        groupName: '',
        eventDate: eventDate.trim(),
        eventType,
        symptoms: eventType === 'Treated' || requiresClinicalNotes(eventType) ? symptoms.trim() : '',
        diagnosis: eventType === 'Treated' || requiresClinicalNotes(eventType) || eventType === 'Pregnancy Diagnosis' || eventType === 'Death' || eventType === 'Euthanasia' ? diagnosis.trim() : '',
        medicine: usesMedication || eventType === 'Treated' ? medication.medicine : '',
        dosage: usesMedication || eventType === 'Treated' ? medication.dosage.trim() : '',
        route: usesMedication || eventType === 'Treated' ? medication.route.trim() : '',
        frequency: usesMedication || eventType === 'Treated' ? medication.frequency.trim() : '',
        withdrawalDays: usesMedication || eventType === 'Treated' ? parseNumber(medication.withdrawalDays) : 0,
        batchNumber: usesMedication || eventType === 'Treated' ? medication.batchNumber.trim() : '',
        technician: eventType === 'Treated' ? technician.trim() : eventType === 'Hoof Trimming' ? technician.trim() : '',
        vetName:
          eventType === 'Breeding' && breedingMethod === 'semen'
            ? vetName.trim()
            : eventType === 'Pregnant' || eventType === 'Pregnancy Diagnosis'
              ? vetName.trim()
              : '',
        vetContact: usesMedication || eventType === 'Treated' ? medication.vetContact.trim() : '',
        followUpDate:
          eventType === 'Breeding'
            ? returnHeatDate
            : usesMedication || eventType === 'Treated' || eventType === 'Dry Off' || eventType === 'Mastitis'
              ? medication.followUpDate.trim()
              : '',
        weightKg: eventType === 'Weighed' ? parseNumber(weightResult) : 0,
        bodyConditionScore: eventType === 'Weighed' ? parseNumber(bodyConditionScore) : 0,
        treatmentCost: usesMedication || eventType === 'Treated' ? parseNumber(medication.treatmentCost) : 0,
        semenUsed: eventType === 'Breeding' && breedingMethod === 'semen' ? semenUsed.trim() : eventType === 'Pregnant' || eventType === 'Pregnancy Diagnosis' ? semenUsed.trim() : '',
        bullResponsible:
          eventType === 'Breeding'
            ? bullResponsible.trim()
            : eventType === 'Giving Birth'
              ? resolvedBullName
              : eventType === 'Pregnant' || eventType === 'Pregnancy Diagnosis'
                ? bullResponsible.trim()
                : '',
        returnHeatDate: eventType === 'Breeding' ? returnHeatDate : '',
        breedingDate: eventType === 'Pregnant' || eventType === 'Aborted' || eventType === 'Pregnancy Diagnosis' || eventType === 'Heat Observed' ? breedingDate.trim() : '',
        expectedDeliveryDate: ['Breeding', 'Pregnant', 'Pregnancy Diagnosis'].includes(eventType) ? expectedDeliveryDate : '',
        calfTag: eventType === 'Giving Birth' ? calfName.trim() : '',
        calfGender: eventType === 'Giving Birth' ? calfGender : '',
        sourceEventId: sourceEventId.trim(),
        notes: notes.trim(),
        photoUri: '',
      };

      if (isEditing && editingEvent) {
        await updateHealthEvent(editingEvent.id, payload);
      } else {
        await createHealthEvent(payload);
      }
      navigation.replace('Events');
    } catch (error) {
      Alert.alert(isEditing ? 'Could not update event' : 'Could not save event', error instanceof Error ? error.message : 'Please check the details and try again.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 pl-4 text-[20px] font-bold text-white">{isEditing ? 'Edit Individual Event' : 'Add Individual Event'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
        <Label text="Event Date" />
        <DateField value={eventDate} placeholder="Select event date" onPress={() => setShowEventDatePicker(true)} />

        {route.params?.cattleTag ? (
          <>
            <Label text="Selected Animal" />
            <View className="h-[48px] justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
              <Text className="text-[16px] text-[#1F2937]">{route.params.cattleTag}</Text>
            </View>
            {femaleOnlyEventBlocked ? <Text className="mb-4 mt-2 text-sm text-red-600">This event is only for female cattle.</Text> : null}
          </>
        ) : (
          <SelectDropdown label="Cattle Tag" value={cattleTag} placeholder={FEMALE_ONLY_EVENT_TYPES.has(eventType) ? 'Select female animal' : 'Select animal'} options={cattleTagOptions} onSelect={setCattleTag} />
        )}

        <SelectDropdown
          label="Event Type"
          value={eventType}
          placeholder="Select"
          options={[...INDIVIDUAL_EVENT_TYPES]}
          onSelect={(value) => {
            setEventType(value);
            if (value !== 'Breeding') {
              setBreedingMethod('');
              setSemenUsed('');
              setVetName('');
            }
          }}
        />

        {eventType === 'Treated' ? (
          <>
            <ConditionalInput placeholder="Symptoms" value={symptoms} onChangeText={setSymptoms} />
            <ConditionalInput placeholder="Diagnosis" value={diagnosis} onChangeText={setDiagnosis} />
            <ConditionalInput placeholder="Technician Name" value={technician} onChangeText={setTechnician} />
            <MedicationFields medicineOptions={medicineOptions} values={medication} onChange={(patch) => setMedication((current) => ({ ...current, ...patch }))} />
          </>
        ) : null}

        {requiresMedicine(eventType) && eventType !== 'Treated' ? (
          <>
            {requiresClinicalNotes(eventType) ? (
              <>
                <ConditionalInput placeholder={eventType === 'Mastitis' ? 'Affected quarter / signs' : 'Clinical signs'} value={symptoms} onChangeText={setSymptoms} />
                <ConditionalInput placeholder={eventType === 'Mastitis' ? 'Severity / culture result' : 'Assessment'} value={diagnosis} onChangeText={setDiagnosis} />
              </>
            ) : null}
            {eventType === 'Hoof Trimming' ? <ConditionalInput placeholder="Technician Name" value={technician} onChangeText={setTechnician} /> : null}
            <MedicationFields medicineOptions={medicineOptions} values={medication} onChange={(patch) => setMedication((current) => ({ ...current, ...patch }))} />
          </>
        ) : null}

        {eventType === 'Weighed' ? (
          <>
            <ConditionalInput placeholder="Weight (kg)" keyboardType="decimal-pad" value={weightResult} onChangeText={setWeightResult} />
            <ConditionalInput placeholder="Body Condition Score (1-5)" keyboardType="decimal-pad" value={bodyConditionScore} onChangeText={setBodyConditionScore} />
          </>
        ) : null}

        {eventType === 'Aborted' ? <ConditionalInput placeholder="Breeding Date" value={breedingDate} onChangeText={setBreedingDate} /> : null}

        {eventType === 'Heat Observed' ? (
          <>
            <Label text="Heat Date" />
            <Input placeholder="YYYY-MM-DD" value={breedingDate} onChangeText={setBreedingDate} />
          </>
        ) : null}

        {eventType === 'Pregnancy Diagnosis' ? (
          <>
            <ConditionalInput placeholder="Method (palpation, ultrasound, blood test)" value={diagnosis} onChangeText={setDiagnosis} />
            <Label text="Service / Breeding Date" />
            <Input placeholder="YYYY-MM-DD" value={breedingDate} onChangeText={setBreedingDate} />
            <Label text="Expected Delivery Date" />
            <Input placeholder="YYYY-MM-DD" value={expectedDeliveryDate} onChangeText={() => {}} editable={false} />
            <Label text="Inseminator / Vet" />
            <Input placeholder="Enter name" value={vetName} onChangeText={setVetName} />
            <Label text="Bull / Semen" />
            <Input placeholder="Enter bull or semen ID" value={bullResponsible} onChangeText={setBullResponsible} />
            <MedicationFields medicineOptions={medicineOptions} values={medication} onChange={(patch) => setMedication((current) => ({ ...current, ...patch }))} showTreatmentCost={false} />
          </>
        ) : null}

        {eventType === 'Dry Off' || eventType === 'Mastitis' ? (
          <MedicationFields medicineOptions={medicineOptions} values={medication} onChange={(patch) => setMedication((current) => ({ ...current, ...patch }))} showTreatmentCost={eventType === 'Mastitis'} />
        ) : null}

        {eventType === 'Death' || eventType === 'Euthanasia' ? (
          <>
            <ConditionalInput placeholder="Cause of death" value={diagnosis} onChangeText={setDiagnosis} />
            <ConditionalInput placeholder="Observations" value={symptoms} onChangeText={setSymptoms} />
            <Label text="Veterinarian" />
            <Input placeholder="Reporting vet" value={vetName} onChangeText={setVetName} />
          </>
        ) : null}

        {eventType === 'Breeding' ? (
          <>
            <SelectDropdown label="Breeding Type" value={breedingMethod} placeholder="Select" options={breedingMethods} onSelect={(value) => { setBreedingMethod(value); setSemenUsed(''); setVetName(''); setBullResponsible(''); }} />
            {breedingMethod === 'semen' ? (
              <>
                <Label text="Semen Used / Straw ID" />
                <Input placeholder="Enter semen or straw ID" value={semenUsed} onChangeText={setSemenUsed} />
                <Label text="Veterinarian / Inseminator Name" />
                <Input placeholder="Enter name" value={vetName} onChangeText={setVetName} />
                <Label text="Bull Name" />
                <Input placeholder="Enter bull name" value={bullResponsible} onChangeText={setBullResponsible} />
              </>
            ) : null}
            {breedingMethod === 'bull' ? (
              <>
                <Label text="Bull Name" />
                <Input placeholder="Enter bull name" value={bullResponsible} onChangeText={setBullResponsible} />
              </>
            ) : null}
            {breedingMethod ? (
              <>
                <Label text={`Estimated Return Heat (+${returnHeatDays} days at ${returnHeatTime})`} />
                <Input placeholder="YYYY-MM-DD HH:mm" value={formatReturnHeatDisplay(returnHeatDate)} onChangeText={() => {}} editable={false} />
                <Label text="Expected Delivery Date" />
                <Input placeholder="YYYY-MM-DD" value={expectedDeliveryDate} onChangeText={() => {}} editable={false} />
              </>
            ) : null}
          </>
        ) : null}

        {eventType === 'Pregnant' ? (
          <>
            {latestBreedingEvent ? (
              <Text className="mb-2 text-[12px] text-[#E6B86F]">Filled from latest breeding record on {latestBreedingEvent.eventDate}</Text>
            ) : cattleTag ? (
              <Text className="mb-2 text-[12px] text-[#6B7280]">No breeding record found for this animal. Enter details manually.</Text>
            ) : null}
            <Label text="Breeding Date" />
            <Input placeholder="YYYY-MM-DD" value={breedingDate} onChangeText={setBreedingDate} editable={!latestBreedingEvent} />
            <Label text="Expected Delivery Date" />
            <Input placeholder="YYYY-MM-DD" value={expectedDeliveryDate} onChangeText={() => {}} editable={false} />
            <Label text="Semen Used / Straw ID" />
            <Input placeholder="Enter semen or straw ID" value={semenUsed} onChangeText={setSemenUsed} editable={!latestBreedingEvent} />
            <Label text="Inseminator Name" />
            <Input placeholder="Enter inseminator name" value={vetName} onChangeText={setVetName} editable={!latestBreedingEvent} />
            <Label text="Bull Responsible" />
            <Input placeholder="Enter bull name or tag" value={bullResponsible} onChangeText={setBullResponsible} editable={!latestBreedingEvent} />
          </>
        ) : null}

        {eventType === 'Giving Birth' ? (
          <>
            <Text className="mb-3 mt-4 text-[12px] text-[#E6B86F]">The calf will be registered automatically when you save, using the selected cow as mother.</Text>
            <Label text="Calf Name" />
            <Input placeholder="Enter calf name" value={calfName} onChangeText={setCalfName} />
            <SelectDropdown label="Calf Gender" value={calfGender} placeholder="Select" options={['Male', 'Female']} onSelect={setCalfGender} />
          </>
        ) : null}

        <Label text="Notes" />
        <Input placeholder="Write something" multiline value={notes} onChangeText={setNotes} />
      </ScrollView>

      <View className="flex-row bg-white px-6 py-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
          <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
        </Pressable>
        <Pressable onPress={saveEvent} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
          <Text className="text-[16px] font-bold text-white">{isEditing ? 'Update' : 'Save'}</Text>
        </Pressable>
      </View>

      {showEventDatePicker && Platform.OS !== 'ios' ? <DateTimePicker value={parseDateForPicker(eventDate)} mode="date" display="calendar" onChange={handleEventDateChange} /> : null}

      <Modal visible={showEventDatePicker && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setShowEventDatePicker(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowEventDatePicker(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <DateTimePicker value={parseDateForPicker(eventDate)} mode="date" display="inline" onChange={handleEventDateChange} style={{ height: 330, width: '100%' }} />
            <Pressable onPress={() => setShowEventDatePicker(false)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function prefillPregnantFromBreeding(breeding: HealthEvent, setters: { setBreedingDate: (value: string) => void; setBullResponsible: (value: string) => void; setSemenUsed: (value: string) => void; setVetName: (value: string) => void }) {
  setters.setBreedingDate(breeding.eventDate);
  setters.setSemenUsed(breeding.semenUsed || '');
  setters.setVetName(breeding.vetName || '');
  setters.setBullResponsible(breeding.bullResponsible || breeding.semenUsed || '');
}

function formatReturnHeatDisplay(value: string) {
  if (!value?.trim()) {
    return '';
  }
  if (value.includes('T')) {
    const [datePart, timePart = ''] = value.split('T');
    return `${datePart} ${timePart.slice(0, 5)}`.trim();
  }
  return value.slice(0, 10);
}

function isFemaleCattle(animal: { gender: string }): boolean {
  return animal.gender.trim().toLowerCase() === 'female';
}

function inferBreedingMethod(event?: HealthEvent): string {
  if (!event || event.eventType !== 'Breeding') {
    return '';
  }
  if (event.semenUsed || event.vetName) {
    return 'semen';
  }
  if (event.bullResponsible) {
    return 'bull';
  }
  return '';
}

function validateEventFields(
  eventType: string,
  breedingMethod: string,
  values: { symptoms: string; diagnosis: string; technician: string; medicine: string; weightResult: string; semenUsed: string; vetName: string; breedingDate: string; bullResponsible: string },
): boolean {
  if (eventType === 'Treated' && (!values.symptoms.trim() || !values.diagnosis.trim() || !values.technician.trim() || !values.medicine)) {
    Alert.alert('Missing treatment details', 'Please enter symptoms, diagnosis, technician name, and medicine.');
    return false;
  }
  if (requiresMedicine(eventType) && eventType !== 'Hoof Trimming' && !values.medicine) {
    Alert.alert('Missing medicine', 'Please select medicine information.');
    return false;
  }
  if (requiresClinicalNotes(eventType) && (!values.symptoms.trim() || !values.diagnosis.trim())) {
    Alert.alert('Missing clinical details', 'Please enter clinical signs and assessment.');
    return false;
  }
  if (eventType === 'Aborted' && !values.breedingDate.trim()) {
    Alert.alert('Missing abortion details', 'Please enter the breeding date.');
    return false;
  }
  if (eventType === 'Weighed' && !values.weightResult.trim()) {
    Alert.alert('Missing weight', 'Please enter weight result.');
    return false;
  }
  if (eventType === 'Breeding') {
    if (!breedingMethod) {
      Alert.alert('Missing breeding type', 'Please select semen or bull.');
      return false;
    }
    if (breedingMethod === 'semen' && (!values.semenUsed.trim() || !values.vetName.trim() || !values.bullResponsible.trim())) {
      Alert.alert('Missing breeding details', 'Please enter semen used, veterinarian name, and bull name.');
      return false;
    }
    if (breedingMethod === 'bull' && !values.bullResponsible.trim()) {
      Alert.alert('Missing breeding details', 'Please enter bull name.');
      return false;
    }
  }
  if ((eventType === 'Pregnant' || eventType === 'Pregnancy Diagnosis') && (!values.breedingDate.trim() || !values.bullResponsible.trim())) {
    Alert.alert('Missing pregnancy details', 'Please enter breeding date and bull responsible.');
    return false;
  }
  if (eventType === 'Giving Birth' && !values.bullResponsible.trim()) {
    Alert.alert('Missing birth details', 'No bull record found for this animal. Record breeding or pregnancy first.');
    return false;
  }
  if ((eventType === 'Death' || eventType === 'Euthanasia') && !values.diagnosis.trim()) {
    Alert.alert('Missing cause', 'Please enter the cause of death.');
    return false;
  }
  return true;
}

function Label({ text }: { text: string }) {
  return <Text className="mb-2 mt-4 text-[14px] font-bold text-[#1F2937]">{text}</Text>;
}

function DateField({ value, placeholder, onPress }: { value: string; placeholder: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="h-[48px] flex-row items-center justify-between rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
      <Text className={value ? 'text-[16px] text-[#1F2937]' : 'text-[16px] text-[#6B7280]'}>{value || placeholder}</Text>
      <Feather name="calendar" size={18} color="#6B7280" />
    </Pressable>
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

function Input({ placeholder, value, onChangeText, keyboardType = 'default', multiline = false, editable = true }: { placeholder: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'decimal-pad'; multiline?: boolean; editable?: boolean }) {
  return (
    <View className={`${multiline ? 'min-h-[100px]' : 'h-[48px]'} justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3`}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} multiline={multiline} editable={editable} className="text-[16px] text-[#1F2937]" />
    </View>
  );
}

function ConditionalInput({ placeholder, value, onChangeText, keyboardType = 'default', editable = true }: { placeholder: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'decimal-pad'; editable?: boolean }) {
  return (
    <View className="mt-3">
      <View className="h-[48px] justify-center rounded-[14px] border border-[#D9E4E4] bg-white px-4 py-3">
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6B7280" keyboardType={keyboardType} editable={editable} className="text-[16px] text-[#1F2937]" />
      </View>
    </View>
  );
}
