import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { type Cattle, type HealthEvent, addDays, formatNumber, getCattle, getHealthEvents, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';
import { EventRecordCard } from '../components/EventRecordCard';
import { lifeCycleLabel, resolveLifeCyclePhase, suggestedStageLabel } from '../utils/lifecycle';

type Props = NativeStackScreenProps<RootStackParamList, 'CattleProfile'>;

export function CattleProfileScreen({ navigation, route }: Props) {
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const { data: events } = useDatabaseQuery(getHealthEvents, []);
  const [activeTab, setActiveTab] = useState<'details' | 'events'>('details');
  const animal = useMemo(() => cattle.find((item) => item.tagNumber === route.params.cattleTag), [cattle, route.params.cattleTag]);
  const cattleEvents = useMemo(
    () => events.filter((item) => item.scope === 'individual' && item.cattleTag === route.params.cattleTag),
    [events, route.params.cattleTag],
  );
  const pregnancy = useMemo(() => buildPregnancyOverview(animal, cattleEvents), [animal, cattleEvents]);

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
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="bg-[#008B8B] pb-6 pt-12">
        <View className="flex-row items-center px-6">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="arrow-left" size={26} color="#FFFFFF" />
          </Pressable>
          <View className="flex-1" />
          <Feather name="more-vertical" size={22} color="#FFFFFF" />
        </View>

        <View className="items-center px-6 pt-4">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-[20px] bg-white/20">
            <Text className="text-[48px]">🐄</Text>
          </View>
          <Text className="text-[28px] font-extrabold text-white">{animal.tagNumber}</Text>
          {animal.name ? <Text className="mt-1 text-[16px] text-white/90">{animal.name}</Text> : null}
        </View>
      </View>

      <View className="flex-row border-b border-[#E5E7EB] bg-white px-6">
        <TabButton label="Details" icon="info" active={activeTab === 'details'} onPress={() => setActiveTab('details')} />
        <TabButton label="Events" icon="calendar" active={activeTab === 'events'} onPress={() => setActiveTab('events')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        {activeTab === 'details' ? (
          <>
            <ProfileCard title="Pregnancy Overview" icon="clock" dashed>
              <ProfileRow label="Breeding date" value={pregnancy.breedingDate} />
              <ProfileRow label="Calving date" value={pregnancy.calvingDate} />
              <ProfileRow label="Days Pregnant" value={pregnancy.daysPregnant} accent />
              <ProfileRow label="Days Remaining" value={pregnancy.daysRemaining} highlight />
              <ProfileRow label="Remark" value={pregnancy.remark} />
            </ProfileCard>

            <ProfileCard title="Life Cycle" icon="repeat" onActionPress={() => navigation.navigate('CowLifeCycle', { cattleTag: animal.tagNumber })}>
              <ProfileRow label="Current phase" value={lifeCycleLabel(resolveLifeCyclePhase(animal))} />
              <ProfileRow label="Recorded stage" value={animal.stage || 'Not recorded'} />
              <ProfileRow label="Reproductive status" value={animal.reproductiveStatus || 'Not applicable'} />
              {suggestedStageLabel(animal) && suggestedStageLabel(animal) !== animal.stage ? (
                <ProfileRow label="Suggested stage" value={`${suggestedStageLabel(animal)} (by age)`} accent />
              ) : null}
            </ProfileCard>

            <ProfileCard
              title="General Details"
              icon="edit-2"
              onActionPress={() => navigation.navigate('AddCattle', { cattle: animal })}
            >
              <ProfileRow label="Tag No" value={animal.tagNumber} />
              <ProfileRow label="Name" value={animal.name || 'Not recorded'} />
              <ProfileRow label="D.O.B" value={formatDisplayDate(animal.dateOfBirth)} />
              <ProfileRow label="Age" value={formatAge(animal.dateOfBirth)} />
              <ProfileRow label="Gender" value={animal.gender || 'Not recorded'} />
              <ProfileRow label="Weight" value={animal.weightKg ? `${formatNumber(animal.weightKg)}` : 'Not recorded'} />
              <ProfileRow label="Stage" value={animal.stage || 'Not recorded'} />
              <ProfileRow label="Group" value={animal.groupName || 'Not assigned'} />
              <ProfileRow label="Breed" value={animal.breed || 'Not recorded'} />
            </ProfileCard>
          </>
        ) : (
          <>
            {cattleEvents.length === 0 ? (
              <Text className="py-10 text-center text-[14px] text-[#6B7280]">No events recorded for this animal yet.</Text>
            ) : (
              cattleEvents.map((item) => (
                <EventRecordCard
                  key={item.id}
                  item={item}
                  cattleByTag={new Map([[animal.tagNumber, animal]])}
                  onPress={() =>
                    navigation.navigate('Detail', {
                      title: item.eventType,
                      subtitle: 'Individual cattle event',
                      details: buildEventDetailRows(item, animal),
                    })
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className={`mr-6 flex-row items-center border-b-2 py-4 ${active ? 'border-[#E6B86F]' : 'border-transparent'}`}>
      <Feather name={icon} size={18} color={active ? '#E6B86F' : '#6B7280'} />
      <Text className={`ml-2 text-[16px] font-bold ${active ? 'text-[#E6B86F]' : 'text-[#6B7280]'}`}>{label}</Text>
    </Pressable>
  );
}

function ProfileCard({
  title,
  icon,
  children,
  dashed = false,
  onActionPress,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  children: ReactNode;
  dashed?: boolean;
  onActionPress?: () => void;
}) {
  return (
    <View className={`mb-5 overflow-hidden rounded-[16px] bg-white shadow-sm ${dashed ? 'border border-dashed border-[#E6B86F]' : ''}`}>
      <View className="flex-row items-center bg-[#E6B86F] px-4 py-3">
        <Text className="flex-1 text-[16px] font-bold text-white">{title}</Text>
        {onActionPress ? (
          <Pressable onPress={onActionPress} hitSlop={8}>
            <Feather name={icon} size={18} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Feather name={icon} size={18} color="#FFFFFF" />
        )}
      </View>
      <View className="px-4 py-4">{children}</View>
    </View>
  );
}

function ProfileRow({ label, value, accent = false, highlight = false }: { label: string; value: string; accent?: boolean; highlight?: boolean }) {
  return (
    <View className="mb-3 flex-row items-start">
      <Text className="w-[130px] text-[13px] font-semibold text-[#6B7280]">{label}</Text>
      <Text className={`flex-1 text-[14px] font-bold ${highlight ? 'text-[#E6B86F]' : accent ? 'text-[#008B8B]' : 'text-[#008B8B]'}`}>{value}</Text>
    </View>
  );
}

function buildPregnancyOverview(_animal: Cattle | undefined, events: HealthEvent[]) {
  const pregnantEvent = events.find((item) => item.eventType === 'Pregnant');
  const breedingEvent = events.find((item) => item.eventType === 'Breeding');
  const breedingDate = pregnantEvent?.breedingDate || breedingEvent?.eventDate || '';
  const calvingDate = pregnantEvent?.expectedDeliveryDate || breedingEvent?.expectedDeliveryDate || (breedingDate ? addDays(breedingDate, 280) : '');
  const daysPregnant = breedingDate ? Math.max(0, daysBetween(breedingDate, todayIsoDate())) : 0;
  const daysRemaining = calvingDate ? Math.max(0, daysBetween(todayIsoDate(), calvingDate)) : 0;

  return {
    breedingDate: formatDisplayDate(breedingDate),
    calvingDate: formatDisplayDate(calvingDate),
    daysPregnant: breedingDate ? `↑ ${daysPregnant}, (-)` : 'Not recorded',
    daysRemaining: calvingDate ? `↓ ${daysRemaining}, (${formatDuration(daysRemaining)})` : 'Not recorded',
    remark: pregnantEvent || breedingEvent ? 'Check breeding event records.' : 'No pregnancy records yet.',
  };
}

function buildEventDetailRows(item: HealthEvent, animal: Cattle) {
  return [
    { label: 'Date', value: formatDisplayDate(item.eventDate) },
    { label: 'Tag No', value: animal.name ? `${animal.tagNumber} (${animal.name})` : animal.tagNumber },
    { label: 'Event Type', value: item.eventType },
    { label: 'Notes', value: item.notes || 'None' },
  ];
}

function formatDisplayDate(value: string) {
  if (!value?.trim()) {
    return 'Not recorded';
  }
  const parsed = new Date(`${value.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatAge(dateOfBirth: string) {
  if (!dateOfBirth?.trim()) {
    return 'Not recorded';
  }
  const birth = new Date(`${dateOfBirth.trim()}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return 'Not recorded';
  }
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }
  return years <= 0 ? 'Less than 1 year' : `${years} year${years === 1 ? '' : 's'}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDuration(days: number) {
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  return `${months} month${months === 1 ? '' : 's'}, ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
}
