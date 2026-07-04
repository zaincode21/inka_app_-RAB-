import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { type HealthEvent, formatNumber } from '../data/farmDatabase';

type EventCardRow = {
  label: string;
  value: string;
  showSearch?: boolean;
};

type Props = {
  item: HealthEvent;
  cattleByTag: Map<string, { tagNumber: string; name: string }>;
  onPress: () => void;
  menuOpen?: boolean;
  onMenuPress?: () => void;
  onEdit?: () => void;
  onViewCattle?: () => void;
  onDelete?: () => void;
};

export function EventRecordCard({ item, cattleByTag, onPress, menuOpen = false, onMenuPress, onEdit, onViewCattle, onDelete }: Props) {
  const rows = buildEventCardRows(item, cattleByTag);
  const showViewCattle = Boolean(item.cattleTag && onViewCattle);

  return (
    <View className="relative mb-5" style={{ zIndex: menuOpen ? 999 : 1, elevation: menuOpen ? 8 : 0 }}>
      {menuOpen ? (
        <View
          className="absolute right-2 top-[44px] z-[1000] min-w-[230px] overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-lg"
          style={{ elevation: 10 }}
        >
          <EventMenuItem icon="edit-2" label="Edit Event" onPress={onEdit} />
          {showViewCattle ? <EventMenuItem icon="search" label="View Cattle" onPress={onViewCattle} /> : null}
          <EventMenuItem icon="trash-2" label="Delete" onPress={onDelete} destructive isLast />
        </View>
      ) : null}

      <View className="overflow-hidden rounded-[16px] bg-white shadow-sm">
        <View className="flex-row items-center bg-[#E6B86F] px-4 py-3">
          <Feather name="calendar" size={18} color="#FFFFFF" />
          <Text className="ml-2 flex-1 text-[16px] font-bold text-white">{item.eventType}</Text>
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
                <Text className="flex-1 text-[14px] font-bold text-[#008B8B]">{row.value}</Text>
                {row.showSearch ? <Feather name="search" size={16} color="#E6B86F" /> : null}
              </View>
            </View>
          ))}
        </Pressable>
      </View>
    </View>
  );
}

function EventMenuItem({
  icon,
  label,
  onPress,
  destructive = false,
  isLast = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const color = destructive ? '#DC2626' : '#008B8B';

  return (
    <Pressable onPress={onPress} className={`flex-row items-center px-4 py-3 active:bg-[#F9FAFB] ${isLast ? '' : 'border-b border-[#F3F4F6]'}`}>
      <Feather name={icon} size={18} color={color} />
      <Text className={`ml-3 text-[15px] font-bold ${destructive ? 'text-[#DC2626]' : 'text-[#1F2937]'}`}>{label}</Text>
    </Pressable>
  );
}

export function buildEventCardRows(item: HealthEvent, cattleByTag: Map<string, { tagNumber: string; name: string }>): EventCardRow[] {
  const tagLabel = formatTagLabel(item.cattleTag, cattleByTag);
  const rows: EventCardRow[] = [{ label: 'Date', value: formatDisplayDate(item.eventDate) }];

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
      rows.push(
        { label: 'Service Date', value: formatDisplayDate(item.breedingDate || item.eventDate) },
        { label: 'Delivery Date', value: formatDisplayDate(item.expectedDeliveryDate) },
        { label: 'Semen', value: displayValue(item.semenUsed) },
        { label: 'Inseminator', value: displayValue(item.vetName) },
        { label: 'Bull Tag', value: displayValue(item.bullResponsible) },
      );
      break;
    case 'Giving Birth':
      rows.push(
        { label: 'Bull Name', value: displayValue(item.bullResponsible) },
        { label: 'Calf Tag', value: displayValue(item.calfTag) },
        { label: 'Calf Gender', value: displayValue(item.calfGender) },
      );
      break;
    case 'Treated':
      rows.push(
        { label: 'Symptoms', value: displayValue(item.symptoms) },
        { label: 'Diagnosis', value: displayValue(item.diagnosis) },
        { label: 'Medicine', value: displayValue(item.medicine) },
        { label: 'Technician', value: displayValue(item.technician) },
      );
      break;
    case 'Vaccinated':
    case 'Deworming':
      rows.push({ label: 'Medicine', value: displayValue(item.medicine) });
      break;
    case 'Weighed':
      rows.push({ label: 'Weight', value: item.weightKg ? `${formatNumber(item.weightKg)} kg` : 'Not recorded' });
      break;
    case 'Aborted':
      rows.push({ label: 'Service Date', value: formatDisplayDate(item.breedingDate) });
      break;
    default:
      if (item.scope === 'mass') {
        rows.push({ label: 'Group', value: displayValue(item.groupName, 'All herd') });
      }
      if (item.medicine) {
        rows.push({ label: 'Medicine', value: displayValue(item.medicine) });
      }
      if (item.technician) {
        rows.push({ label: 'Technician', value: displayValue(item.technician) });
      }
      break;
  }

  rows.push({ label: 'Notes', value: displayValue(item.notes) });
  return rows;
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

  const parsed = new Date(`${value.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}
