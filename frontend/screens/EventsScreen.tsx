import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBottomNav } from '../components/AppBottomNav';
import { buildEventCardRows, EventRecordCard, isEventFollowUpDue } from '../components/EventRecordCard';
import { KeyboardSafeSheet } from '../components/KeyboardSafeScroll';
import { SelectDropdown } from '../components/SelectDropdown';
import { getCurrentSession } from '../data/authApi';
import {
  type HealthEvent,
  addDays,
  createHealthEvent,
  deleteHealthEvent,
  getCattle,
  getCategories,
  getHealthEvents,
  todayIsoDate,
  updateHealthEvent,
  useDatabaseQuery,
} from '../data/farmDatabase';
import { canWriteEvents } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';
import { allEventTypeFilterOptions, eventTypeLabel } from '../utils/eventConstants';
import { isActiveEvent, isEventArchived } from '../utils/eventArchive';
import { emptyEventFields } from '../utils/reproductiveCycle';
import { showSuccessToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Events'>;
type EventFilter = 'all' | 'archive' | 'followUpDue';

export function EventsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const sessionUser = getCurrentSession()?.user;
  const canMutateEvents = canWriteEvents(sessionUser);
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const { data: eventTypeCategories } = useDatabaseQuery(() => getCategories('event'), []);
  const managedEventTypeNames = useMemo(
    () => eventTypeCategories.map((category) => category.name),
    [eventTypeCategories],
  );
  const [selectedScope, setSelectedScope] = useState<'individual' | 'mass'>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [listFilter, setListFilter] = useState<EventFilter>('all');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCattleDialog, setShowCattleDialog] = useState(false);
  const [selectedCattleTag, setSelectedCattleTag] = useState('');
  const [cattleSearch, setCattleSearch] = useState('');
  const [menuEvent, setMenuEvent] = useState<HealthEvent | null>(null);
  const [abortSource, setAbortSource] = useState<HealthEvent | null>(null);
  const [abortNotes, setAbortNotes] = useState('');
  const [abortBusy, setAbortBusy] = useState(false);

  const loadEvents = useCallback(
    () =>
      getHealthEvents({
        scope: selectedScope,
        eventType: eventTypeFilter || undefined,
      }),
    [selectedScope, eventTypeFilter],
  );

  const { data: events, loading, error, reload } = useDatabaseQuery(loadEvents, []);
  const cattleByTag = useMemo(() => new Map(cattle.map((animal) => [animal.tagNumber, animal])), [cattle]);
  const scopeEvents = useMemo(() => events.filter((item) => item.scope === selectedScope), [events, selectedScope]);
  const archiveCount = useMemo(() => scopeEvents.filter((item) => isEventArchived(item)).length, [scopeEvents]);
  const followUpCount = useMemo(
    () => scopeEvents.filter((item) => isActiveEvent(item) && isEventFollowUpDue(item, scopeEvents)).length,
    [scopeEvents],
  );
  const cattleOptions = useMemo(() => {
    const query = cattleSearch.trim().toLowerCase();
    return cattle.filter((animal) => {
      if (!query) {
        return true;
      }
      return `${animal.tagNumber} ${animal.name} ${animal.breed}`.toLowerCase().includes(query);
    });
  }, [cattle, cattleSearch]);

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return scopeEvents.filter((item) => {
      if (listFilter === 'all' && !isActiveEvent(item)) {
        return false;
      }
      if (listFilter === 'archive' && !isEventArchived(item)) {
        return false;
      }
      if (listFilter === 'followUpDue' && (!isActiveEvent(item) || !isEventFollowUpDue(item, scopeEvents))) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        item.eventType,
        item.cattleTag,
        item.groupName,
        item.medicine,
        item.diagnosis,
        item.symptoms,
        item.notes,
        item.technician,
        item.vetName,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [scopeEvents, searchQuery, listFilter]);

  const emptyMessage = useMemo(() => {
    if (loading) {
      return t('events.loading');
    }
    if (listFilter === 'archive') {
      return t('events.emptyArchive');
    }
    if (listFilter === 'followUpDue') {
      return t('events.emptyFollowUp');
    }
    return t('events.empty');
  }, [loading, listFilter, t]);

  const clearSourceFollowUp = async (source: HealthEvent) => {
    if (!source.followUpDate?.trim()) {
      return;
    }
    const { id: _id, createdAt: _createdAt, ...rest } = source;
    await updateHealthEvent(source.id, { ...rest, followUpDate: '' });
  };

  const handleConfirmHeatReturned = (breeding: HealthEvent) => {
    Alert.alert(t('events.heatReturnedTitle'), t('events.heatReturnedBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.save'),
        onPress: async () => {
          try {
            await createHealthEvent(
              emptyEventFields({
                cattleTag: breeding.cattleTag,
                eventDate: todayIsoDate(),
                eventType: 'Heat Observed',
                breedingDate: breeding.eventDate,
                bullResponsible: breeding.bullResponsible,
                semenUsed: breeding.semenUsed,
                sourceEventId: breeding.id,
                notes: `Heat returned after Breeding on ${breeding.eventDate}`,
              }),
            );
            await clearSourceFollowUp(breeding);
            await reload();
            showSuccessToast(eventTypeLabel('Heat Observed', t));
          } catch (cycleError) {
            Alert.alert('Could not record heat', cycleError instanceof Error ? cycleError.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleConfirmGusama = (breeding: HealthEvent) => {
    Alert.alert(t('events.confirmPregnantTitle'), t('events.confirmPregnantBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('events.createPregnant'),
        onPress: async () => {
          try {
            const serviceDate = breeding.eventDate;
            await createHealthEvent(
              emptyEventFields({
                cattleTag: breeding.cattleTag,
                eventDate: todayIsoDate(),
                eventType: 'Pregnant',
                breedingDate: serviceDate,
                expectedDeliveryDate: addDays(serviceDate, 280),
                semenUsed: breeding.semenUsed,
                bullResponsible: breeding.bullResponsible,
                vetName: breeding.vetName,
                sourceEventId: breeding.id,
                notes: `Confirmed from Breeding ${breeding.id} — no return heat by ${breeding.returnHeatDate || 'estimated date'}`,
              }),
            );
            await clearSourceFollowUp(breeding);
            await reload();
            showSuccessToast(t('events.pregnantCreated'));
          } catch (cycleError) {
            Alert.alert(t('events.couldNotCreatePregnant'), cycleError instanceof Error ? cycleError.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleConfirmKuramburura = (pregnant: HealthEvent) => {
    setAbortNotes('');
    setAbortSource(pregnant);
  };

  const submitKuramburura = async () => {
    if (!abortSource) {
      return;
    }
    if (!abortNotes.trim()) {
      Alert.alert(t('milk.notes'), t('events.abortNotesRequired'));
      return;
    }
    setAbortBusy(true);
    try {
      await createHealthEvent(
        emptyEventFields({
          cattleTag: abortSource.cattleTag,
          eventDate: todayIsoDate(),
          eventType: 'Aborted',
          breedingDate: abortSource.breedingDate || abortSource.eventDate,
          bullResponsible: abortSource.bullResponsible,
          semenUsed: abortSource.semenUsed,
          sourceEventId: abortSource.id,
          notes: abortNotes.trim(),
        }),
      );
      setAbortSource(null);
      setAbortNotes('');
      await reload();
      showSuccessToast(t('events.abortRecorded'));
    } catch (cycleError) {
      Alert.alert(t('events.couldNotCreateAbort'), cycleError instanceof Error ? cycleError.message : 'Please try again.');
    } finally {
      setAbortBusy(false);
    }
  };

  const handleConfirmKubyara = (pregnant: HealthEvent) => {
    navigation.navigate('AddIndividualEvent', {
      cattleTag: pregnant.cattleTag,
      presetEventType: 'Giving Birth',
      sourceEventId: pregnant.id,
    });
  };

  const handleAddEvent = () => {
    if (selectedScope === 'mass') {
      navigation.navigate('AddMassEvent');
      return;
    }
    setShowCattleDialog(true);
  };

  const openIndividualEvent = () => {
    if (!selectedCattleTag) {
      Alert.alert('Select animal', 'Please select cattle before creating an individual event.');
      return;
    }
    setShowCattleDialog(false);
    setCattleSearch('');
    navigation.navigate('AddIndividualEvent', { cattleTag: selectedCattleTag });
  };

  const openEventDetail = (item: HealthEvent) => {
    const details = buildEventCardRows(item, cattleByTag, t).map((row) => ({ label: row.label, value: row.value }));
    if (item.recordedBy) {
      details.push({ label: 'Recorded by', value: item.recordedBy });
    }
    navigation.navigate('Detail', {
      title: eventTypeLabel(item.eventType, t),
      subtitle: item.scope === 'mass' ? 'Mass herd event' : 'Individual cattle event',
      details,
      imageUri: item.photoUri || undefined,
    });
  };

  const handleEditEvent = (event: HealthEvent) => {
    setMenuEvent(null);
    if (event.scope === 'mass') {
      navigation.navigate('AddMassEvent', { event });
      return;
    }
    navigation.navigate('AddIndividualEvent', { cattleTag: event.cattleTag, event });
  };

  const handleViewCattle = (event: HealthEvent) => {
    setMenuEvent(null);
    if (!event.cattleTag) {
      Alert.alert('No cattle linked', 'This event is not linked to an animal.');
      return;
    }
    navigation.navigate('CattleProfile', { cattleTag: event.cattleTag });
  };

  const handleDeleteEvent = (event: HealthEvent) => {
    setMenuEvent(null);
    Alert.alert(
      'Delete event',
      'Remove this event from lists? It stays in farm records and will no longer appear in the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHealthEvent(event.id);
              await reload();
              showSuccessToast('Event deleted.');
            } catch (deleteError) {
              Alert.alert('Could not delete event', deleteError instanceof Error ? deleteError.message : 'Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">{t('events.title')}</Text>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => setShowSearchBar((current) => !current)} hitSlop={8}>
            <Feather name="search" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={() => setShowFilterModal(true)} hitSlop={8}>
            <Feather name="filter" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {showSearchBar ? (
        <View className="mx-6 mt-4 h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder={t('events.searchPlaceholder')} placeholderTextColor="#6B7280" className="ml-3 flex-1 text-[16px] text-[#1F2937]" />
        </View>
      ) : null}

      <View className="flex-row px-6 py-4">
        <Pressable onPress={() => setSelectedScope('individual')} className={`mr-2 h-12 flex-1 flex-row items-center justify-center rounded-[12px] px-4 ${selectedScope === 'individual' ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'}`}>
          <Feather name="calendar" size={20} color={selectedScope === 'individual' ? '#FFFFFF' : '#008B8B'} />
          <Text className={`ml-2 text-[16px] font-bold ${selectedScope === 'individual' ? 'text-white' : 'text-[#008B8B]'}`}>{t('events.individual')}</Text>
        </Pressable>
        <Pressable onPress={() => setSelectedScope('mass')} className={`ml-2 h-12 flex-1 flex-row items-center justify-center rounded-[12px] px-4 ${selectedScope === 'mass' ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'}`}>
          <Feather name="users" size={20} color={selectedScope === 'mass' ? '#FFFFFF' : '#008B8B'} />
          <Text className={`ml-2 text-[16px] font-bold ${selectedScope === 'mass' ? 'text-white' : 'text-[#008B8B]'}`}>{t('events.mass')}</Text>
        </Pressable>
      </View>

      <View className="mx-6 mb-3 rounded-[16px] bg-white p-1.5 shadow-sm">
        <View className="flex-row items-stretch">
          <EventFilterTab
            label={t('events.all')}
            count={scopeEvents.filter((item) => isActiveEvent(item)).length}
            icon="layers"
            active={listFilter === 'all'}
            activeBg="#008B8B"
            activeText="#FFFFFF"
            inactiveText="#008B8B"
            onPress={() => setListFilter('all')}
          />
          <EventFilterTab
            label={t('events.archive')}
            count={archiveCount}
            icon="archive"
            active={listFilter === 'archive'}
            activeBg="#64748B"
            activeText="#FFFFFF"
            inactiveText="#64748B"
            onPress={() => setListFilter('archive')}
          />
          <EventFilterTab
            label={t('events.followUp')}
            count={followUpCount}
            icon="bell"
            active={listFilter === 'followUpDue'}
            activeBg="#DC2626"
            activeText="#FFFFFF"
            inactiveText="#DC2626"
            onPress={() => setListFilter('followUpDue')}
          />
        </View>
      </View>

      <View className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }} onScrollBeginDrag={() => setMenuEvent(null)}>
          {visibleEvents.length === 0 ? (
            <View className="items-center justify-center pt-20">
              <Text className="text-center text-[16px] font-bold text-[#008B8B]">{emptyMessage}</Text>
              <Text className="mt-2 text-center text-[13px] text-[#6B7280]">
                {error ??
                  (listFilter === 'archive'
                    ? t('events.archiveHint')
                    : listFilter === 'followUpDue'
                      ? t('events.emptyFollowUp')
                      : `No ${selectedScope} events match your filters.`)}
              </Text>
            </View>
          ) : (
            visibleEvents.map((item) => (
              <EventRecordCard
                key={item.id}
                item={item}
                allEvents={scopeEvents}
                cattleByTag={cattleByTag}
                menuOpen={menuEvent?.id === item.id}
                onPress={() => {
                  setMenuEvent(null);
                  openEventDetail(item);
                }}
                onMenuPress={
                  canMutateEvents || item.cattleTag
                    ? () => setMenuEvent((current) => (current?.id === item.id ? null : item))
                    : undefined
                }
                onEdit={canMutateEvents ? () => handleEditEvent(item) : undefined}
                onViewCattle={() => handleViewCattle(item)}
                onDelete={canMutateEvents ? () => handleDeleteEvent(item) : undefined}
                onConfirmHeatReturned={canMutateEvents ? () => handleConfirmHeatReturned(item) : undefined}
                onConfirmGusama={canMutateEvents ? () => handleConfirmGusama(item) : undefined}
                onConfirmKuramburura={canMutateEvents ? () => handleConfirmKuramburura(item) : undefined}
                onConfirmKubyara={canMutateEvents ? () => handleConfirmKubyara(item) : undefined}
              />
            ))
          )}
        </ScrollView>
      </View>

      {canMutateEvents ? (
        <Pressable accessibilityRole="button" onPress={handleAddEvent} className="absolute bottom-[100px] right-6 flex-row items-center rounded-full bg-[#E6B86F] px-5 py-3 shadow-lg">
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text className="ml-2 text-[16px] font-bold text-white">Add</Text>
        </Pressable>
      ) : null}

      <AppBottomNav navigation={navigation} active="explore" />

      <Modal visible={Boolean(abortSource)} transparent animationType="fade" onRequestClose={() => setAbortSource(null)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setAbortSource(null)}>
          <KeyboardSafeSheet contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 20 }}>
            <Text className="mb-1 text-center text-[18px] font-bold text-[#1F2937]">{t('events.abortTitle')}</Text>
            <Text className="mb-4 text-center text-[13px] text-[#6B7280]">
              {abortSource
                ? `${cattleByTag.get(abortSource.cattleTag)?.name.trim() || abortSource.cattleTag} — write reason, then submit`
                : ''}
            </Text>
            <TextInput
              value={abortNotes}
              onChangeText={setAbortNotes}
              placeholder={t('events.abortReasonPlaceholder')}
              placeholderTextColor="#6B7280"
              multiline
              className="min-h-[100px] rounded-[14px] border border-[#D9E4E4] bg-[#F8FAFA] px-4 py-3 text-[15px] text-[#1F2937]"
              textAlignVertical="top"
            />
            <View className="mt-4 flex-row">
              <Pressable onPress={() => setAbortSource(null)} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
                <Text className="text-[16px] font-bold text-[#008B8B]">{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void submitKuramburura();
                }}
                disabled={abortBusy}
                className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#DC2626] py-3"
              >
                <Text className="text-[16px] font-bold text-white">{abortBusy ? 'Saving...' : 'Submit'}</Text>
              </Pressable>
            </View>
          </KeyboardSafeSheet>
        </Pressable>
      </Modal>

      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowFilterModal(false)}>
          <Pressable className="rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <Text className="mb-4 text-center text-[18px] font-bold text-[#1F2937]">Filter Events</Text>
            <SelectDropdown label="Event Type" value={eventTypeFilter} placeholder={t('events.allEventTypes')} options={[{ label: t('events.allEventTypes'), value: '' }, ...allEventTypeFilterOptions(t, managedEventTypeNames)]} onSelect={setEventTypeFilter} />
            <Pressable onPress={() => setShowFilterModal(false)} className="mt-4 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
              <Text className="text-[16px] font-bold text-white">Apply Filters</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCattleDialog} transparent animationType="fade" onRequestClose={() => setShowCattleDialog(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowCattleDialog(false)}>
          <KeyboardSafeSheet
            className="max-h-[80%] rounded-t-[24px] bg-white"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 20 }}
          >
            <Text className="mb-4 text-center text-[18px] font-bold text-[#1F2937]">Select Cattle</Text>
            <View className="mb-4 h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
              <Feather name="search" size={18} color="#6B7280" />
              <TextInput value={cattleSearch} onChangeText={setCattleSearch} placeholder="Search cattle" placeholderTextColor="#6B7280" className="ml-3 flex-1 text-[16px] text-[#1F2937]" />
            </View>
            <View>
              {cattleOptions.length === 0 ? (
                <Text className="py-6 text-center text-[14px] text-[#6B7280]">No cattle found</Text>
              ) : (
                cattleOptions.map((animal) => {
                  const selected = selectedCattleTag === animal.tagNumber;
                  return (
                    <Pressable key={animal.id} onPress={() => setSelectedCattleTag(animal.tagNumber)} className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#008B8B] bg-[#E0F7F7]' : 'border-[#E5E7EB] bg-white'}`}>
                      <View className="flex-1">
                        <Text className={`text-[16px] ${selected ? 'font-bold text-[#008B8B]' : 'font-bold text-[#1F2937]'}`}>
                          {animal.name.trim() || animal.tagNumber}
                        </Text>
                        <Text className="mt-1 text-[13px] text-[#6B7280]">{animal.breed} • {animal.stage}</Text>
                      </View>
                      {selected ? <Feather name="check" size={18} color="#008B8B" /> : null}
                    </Pressable>
                  );
                })
              )}
            </View>
            <View className="mt-4 flex-row">
              <Pressable onPress={() => setShowCattleDialog(false)} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
                <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
              </Pressable>
              <Pressable onPress={openIndividualEvent} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
                <Text className="text-[16px] font-bold text-white">Next</Text>
              </Pressable>
            </View>
          </KeyboardSafeSheet>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

function EventFilterTab({
  label,
  count,
  icon,
  active,
  activeBg,
  activeText,
  inactiveText,
  onPress,
}: {
  label: string;
  count: number;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  activeBg: string;
  activeText: string;
  inactiveText: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="mx-0.5 flex-1 items-center justify-center rounded-[12px] py-3"
      style={{ backgroundColor: active ? activeBg : 'transparent' }}
    >
      <Feather name={icon} size={16} color={active ? activeText : inactiveText} />
      <Text className="mt-1 text-[12px] font-bold" style={{ color: active ? activeText : inactiveText }}>
        {label}
      </Text>
      <View
        className="mt-1 min-w-[22px] items-center rounded-full px-2 py-0.5"
        style={{ backgroundColor: active ? 'rgba(255,255,255,0.22)' : '#F3F4F6' }}
      >
        <Text className="text-[11px] font-extrabold" style={{ color: active ? activeText : inactiveText }}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}
