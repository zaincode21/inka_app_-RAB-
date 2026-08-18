import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { type HealthEvent, formatNumber } from '../data/farmDatabase';
import { eventTypeLabel } from '../utils/eventConstants';
import { diseaseLabel } from '../utils/diseases';
import {
  getBreedingResolution,
  getPregnancyResolution,
  isBreedingAwaitingHeatDecision,
  isCycleStepEnded,
  isOpenPregnancy,
  isReproductiveCycleFollowUpDue,
} from '../utils/reproductiveCycle';

type EventCardRow = {
  label: string;
  value: string;
  showSearch?: boolean;
  highlight?: boolean;
};

type Props = {
  item: HealthEvent;
  allEvents?: HealthEvent[];
  cattleByTag: Map<string, { tagNumber: string; name: string }>;
  onPress: () => void;
  menuOpen?: boolean;
  onMenuPress?: () => void;
  onEdit?: () => void;
  onViewCattle?: () => void;
  onDelete?: () => void;
  onConfirmHeatReturned?: () => void;
  onConfirmGusama?: () => void;
  onConfirmKuramburura?: () => void;
  onConfirmKubyara?: () => void;
};

const ACTIVE_HEADER = '#E6B86F';
const ENDED_HEADER = '#94A3B8';
const ACTIVE_VALUE = '#008B8B';
const ENDED_VALUE = '#64748B';

export function EventRecordCard({
  item,
  allEvents = [],
  cattleByTag,
  onPress,
  menuOpen = false,
  onMenuPress,
  onEdit,
  onViewCattle,
  onDelete,
  onConfirmHeatReturned,
  onConfirmGusama,
  onConfirmKuramburura,
  onConfirmKubyara,
}: Props) {
  const { t } = useTranslation();
  const rows = buildEventCardRows(item, cattleByTag, t);
  const showViewCattle = Boolean(item.cattleTag && onViewCattle);
  const displayType = eventTypeLabel(item.eventType, t);
  const ended = isCycleStepEnded(item, allEvents);
  const nextStepLabel = getEndedNextStepLabel(item, allEvents, t);
  const headerBg = ended ? ENDED_HEADER : ACTIVE_HEADER;
  const valueColor = ended ? ENDED_VALUE : ACTIVE_VALUE;
  const showBreedingActions = Boolean(onConfirmHeatReturned && onConfirmGusama && isBreedingAwaitingHeatDecision(item, allEvents));
  const showPregnancyActions = Boolean(onConfirmKuramburura && onConfirmKubyara && isOpenPregnancy(item, allEvents));

  return (
    <View className="relative mb-5" style={{ zIndex: menuOpen ? 999 : 1, elevation: menuOpen ? 8 : 0 }}>
      {menuOpen ? (
        <View className="absolute right-2 top-[44px] z-[1000] min-w-[230px] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-lg" style={{ elevation: 10 }}>
          {onEdit ? <EventMenuItem icon="edit-2" label="Edit Event" onPress={onEdit} /> : null}
          {showViewCattle ? <EventMenuItem icon="search" label="View Cattle" onPress={onViewCattle} /> : null}
          {onDelete ? <EventMenuItem icon="trash-2" label="Delete" onPress={onDelete} destructive isLast /> : null}
        </View>
      ) : null}

      <View className={`overflow-hidden rounded-[16px] shadow-sm ${ended ? 'bg-[#F8FAFC]' : 'bg-white'}`}>
        <View className="flex-row items-center px-4 py-3" style={{ backgroundColor: headerBg }}>
          <Feather name="calendar" size={18} color="#FFFFFF" />
          <Text className="ml-2 flex-1 text-[16px] font-bold text-white">{displayType}</Text>
          {ended && nextStepLabel ? (
            <View className="mr-2 rounded-full bg-white/25 px-2.5 py-1">
              <Text className="text-[11px] font-bold text-white">→ {nextStepLabel}</Text>
            </View>
          ) : null}
          {onMenuPress ? (
            <Pressable onPress={onMenuPress} hitSlop={8}>
              <Feather name="more-vertical" size={18} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={onPress} className="px-4 py-4">
          {rows.map((row) => (
            <View key={`${item.id}-${row.label}`} className="mb-3 flex-row items-start">
              <Text className="w-[110px] text-[13px] font-semibold text-[#6B7280]">{row.label}</Text>
              <View className="flex-1 flex-row items-center">
                <Text className={`flex-1 text-[14px] font-bold ${row.highlight ? 'text-[#DC2626]' : ''}`} style={row.highlight ? undefined : { color: valueColor }}>
                  {row.value}
                </Text>
                {row.showSearch ? <Feather name="search" size={16} color={ended ? '#94A3B8' : '#E6B86F'} /> : null}
              </View>
            </View>
          ))}
        </Pressable>

        {showBreedingActions ? (
          <View className="border-t border-[#E5E7EB] bg-[#F8FAFA] px-4 py-3">
            <Text className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#64748B]">{t('events.returnHeatFollowUp')}</Text>
            <Text className="mb-2 text-[12px] text-[#6B7280]">{t('events.returnHeatHint')}</Text>
            <CycleActionRow label={t('events.heatReturned')} hint={t('events.heatReturnedHint')} onPress={onConfirmHeatReturned!} />
            <CycleActionRow label={t('events.confirmPregnant')} hint={t('events.confirmPregnantHint')} onPress={onConfirmGusama!} accent />
          </View>
        ) : null}

        {showPregnancyActions ? (
          <View className="border-t border-[#E5E7EB] bg-[#FFF7F7] px-4 py-3">
            <Text className="mb-2 text-[12px] font-bold uppercase tracking-wide text-[#64748B]">{t('events.pregnancyNextStep')}</Text>
            <View className="flex-row">
              <CycleActionColumn className="mr-1.5" label={t('events.abort')} onPress={onConfirmKuramburura!} danger />
              <CycleActionColumn className="ml-1.5" label={t('events.birth')} onPress={onConfirmKubyara!} accent />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getEndedNextStepLabel(item: HealthEvent, allEvents: HealthEvent[], t: (key: string) => string): string | null {
  const breedingNext = getBreedingResolution(item, allEvents);
  if (breedingNext) {
    return eventTypeLabel(breedingNext.eventType, t);
  }
  const pregnancyNext = getPregnancyResolution(item, allEvents);
  if (pregnancyNext) {
    return eventTypeLabel(pregnancyNext.eventType, t);
  }
  return null;
}

function CycleActionRow({
  label,
  hint,
  onPress,
  accent = false,
  danger = false,
}: {
  label: string;
  hint: string;
  onPress: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  const color = danger ? '#DC2626' : accent ? '#008B8B' : '#1F2937';
  return (
    <Pressable onPress={onPress} className="mb-2 flex-row items-start rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-3 active:bg-[#F3F4F6]">
      <View className="mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded border-2" style={{ borderColor: color }}>
        <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'transparent' }} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-bold" style={{ color }}>
          {label}
        </Text>
        <Text className="mt-0.5 text-[12px] text-[#6B7280]">{hint}</Text>
      </View>
      <Feather name="chevron-right" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

function CycleActionColumn({
  label,
  hint,
  onPress,
  className = '',
  accent = false,
  danger = false,
}: {
  label: string;
  hint?: string;
  onPress: () => void;
  className?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const color = danger ? '#DC2626' : accent ? '#008B8B' : '#1F2937';
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-3 active:bg-[#F3F4F6] ${className}`}
    >
      <Text className="text-center text-[14px] font-bold" style={{ color }}>
        {label}
      </Text>
      {hint ? <Text className="mt-1 text-center text-[11px] leading-[15px] text-[#6B7280]">{hint}</Text> : null}
    </Pressable>
  );
}

function EventMenuItem({ icon, label, onPress, destructive = false, isLast = false }: { icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void; destructive?: boolean; isLast?: boolean }) {
  const color = destructive ? '#DC2626' : '#008B8B';
  return (
    <Pressable onPress={onPress} className={`flex-row items-center px-4 py-3 active:bg-[#F9FAFB] ${isLast ? '' : 'border-b border-[#F3F4F6]'}`}>
      <Feather name={icon} size={18} color={color} />
      <Text className={`ml-3 text-[15px] font-bold ${destructive ? 'text-[#DC2626]' : 'text-[#1F2937]'}`}>{label}</Text>
    </Pressable>
  );
}

function appendMedicationRows(rows: EventCardRow[], item: HealthEvent) {
  if (item.medicine) {
    rows.push({ label: 'Medicine', value: displayValue(item.medicine) });
  }
  if (item.withdrawalDays > 0) {
    rows.push({ label: 'Withdrawal', value: `${formatNumber(item.withdrawalDays)} days` });
  }
  if (item.batchNumber) {
    rows.push({ label: 'Batch No', value: displayValue(item.batchNumber) });
  }
  if (item.followUpDate) {
    rows.push({ label: 'Follow-up', value: formatDisplayDate(item.followUpDate), highlight: isFollowUpOverdue(item.followUpDate) });
  }
  if (item.vetContact) {
    rows.push({ label: 'Vet Contact', value: displayValue(item.vetContact) });
  }
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function buildEventCardRows(
  item: HealthEvent,
  cattleByTag: Map<string, { tagNumber: string; name: string }>,
  t?: TranslateFn,
): EventCardRow[] {
  const tagLabel = formatTagLabel(item.cattleTag, cattleByTag);
  const rows: EventCardRow[] = [{ label: 'Date', value: formatDisplayDate(item.eventDate) }];
  const diagnosisValue = displayValue(t ? diseaseLabel(item.diagnosis, t) : item.diagnosis);

  if (item.scope === 'individual') {
    rows.push({ label: 'Tag No', value: tagLabel, showSearch: true });
  }

  switch (item.eventType) {
    case 'Breeding':
      rows.push(
        { label: 'Semen', value: displayValue(item.semenUsed) },
        { label: 'Technician', value: displayValue(item.vetName) },
        { label: 'Bull', value: displayValue(item.bullResponsible) },
        { label: 'Return Date', value: formatDisplayDate(item.returnHeatDate) },
      );
      break;
    case 'Pregnant':
    case 'Pregnancy Diagnosis':
      rows.push(
        { label: 'Service Date', value: formatDisplayDate(item.breedingDate || item.eventDate) },
        { label: 'Delivery Date', value: formatDisplayDate(item.expectedDeliveryDate) },
        { label: 'Semen', value: displayValue(item.semenUsed) },
        { label: 'Inseminator', value: displayValue(item.vetName) },
        { label: 'Bull Tag', value: displayValue(item.bullResponsible) },
      );
      if (item.eventType === 'Pregnancy Diagnosis' && item.diagnosis) {
        rows.push({ label: 'Method', value: displayValue(item.diagnosis) });
      }
      break;
    case 'Giving Birth':
      rows.push(
        { label: 'Bull Name', value: displayValue(item.bullResponsible) },
        { label: 'Calf Name', value: displayValue(item.calfTag) },
        { label: 'Calf Gender', value: displayValue(item.calfGender) },
      );
      break;
    case 'Treated':
      rows.push(
        { label: 'Diagnosis', value: diagnosisValue },
        { label: 'Technician', value: displayValue(item.technician) },
      );
      appendMedicationRows(rows, item);
      break;
    case 'Vaccinated':
    case 'Deworming':
    case 'Vaccination':
    case 'Dewormed':
      appendMedicationRows(rows, item);
      break;
    case 'Mastitis':
    case 'Lameness':
      rows.push(
        { label: 'Assessment', value: displayValue(item.diagnosis) },
      );
      appendMedicationRows(rows, item);
      break;
    case 'Weighed':
      rows.push(
        { label: 'Weight', value: item.weightKg ? `${formatNumber(item.weightKg)} kg` : 'Not recorded' },
        { label: 'BCS', value: item.bodyConditionScore ? `${formatNumber(item.bodyConditionScore)}` : 'Not recorded' },
      );
      break;
    case 'Aborted':
      rows.push({ label: 'Service Date', value: formatDisplayDate(item.breedingDate) });
      break;
    case 'Heat Observed':
      rows.push({ label: 'Heat Date', value: formatDisplayDate(item.breedingDate || item.eventDate) });
      break;
    case 'Dry Off':
      rows.push({ label: 'Dry Off Date', value: formatDisplayDate(item.eventDate) });
      if (item.followUpDate) {
        rows.push({ label: 'Follow-up', value: formatDisplayDate(item.followUpDate), highlight: isFollowUpOverdue(item.followUpDate) });
      }
      break;
    case 'Death':
    case 'Euthanasia':
      rows.push(
        { label: 'Cause', value: diagnosisValue },
        { label: 'Vet', value: displayValue(item.vetName) },
      );
      break;
    default:
      if (item.scope === 'mass') {
        rows.push({ label: 'Group', value: displayValue(item.groupName, 'All herd') });
        if (item.technician) {
          rows.push({ label: 'Technician', value: displayValue(item.technician) });
        }
        if (item.vetName) {
          rows.push({ label: 'Veterinarian', value: displayValue(item.vetName) });
        }
      }
      appendMedicationRows(rows, item);
      break;
  }

  rows.push({ label: 'Notes', value: displayValue(item.notes) });
  return rows;
}

function isFollowUpOverdue(followUpDate: string) {
  if (!followUpDate?.trim()) {
    return false;
  }
  const raw = followUpDate.trim();
  const due = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
  if (Number.isNaN(due.getTime())) {
    return false;
  }
  return due.getTime() <= Date.now();
}

function formatTagLabel(tag: string, cattleByTag: Map<string, { tagNumber: string; name: string }>) {
  if (!tag) {
    return 'Not recorded';
  }
  const animal = cattleByTag.get(tag);
  return animal?.name ? `${tag} (${animal.name})` : tag;
}

function displayValue(value: string, fallback = 'Not recorded') {
  return value?.trim() ? value.trim() : fallback;
}

function formatDisplayDate(value: string) {
  if (!value?.trim()) {
    return 'Not recorded';
  }
  const raw = value.trim();
  const hasTime = raw.includes('T');
  const parsed = new Date(hasTime ? raw : `${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  if (hasTime) {
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function isEventFollowUpDue(item: HealthEvent, allEvents: HealthEvent[] = []): boolean {
  // Ended Kwimisha / Gusama must leave Follow-up even if an old follow-up date remains.
  if (isCycleStepEnded(item, allEvents)) {
    return false;
  }
  if (isFollowUpOverdue(item.followUpDate)) {
    return true;
  }
  return isReproductiveCycleFollowUpDue(item, allEvents);
}
