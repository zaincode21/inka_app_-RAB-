import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { buildEventCardRows, EventRecordCard } from '../components/EventRecordCard';
import { logout } from '../data/authApi';
import { type HealthEvent, deleteHealthEvent, getCattle, getHealthEvents, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Events'>;

export function EventsScreen({ navigation }: Props) {
  const { data: events, loading, error, reload } = useDatabaseQuery(getHealthEvents, []);
  const { data: cattle } = useDatabaseQuery(getCattle, []);
  const [selectedScope, setSelectedScope] = useState<'individual' | 'mass'>('individual');
  const [showCattleDialog, setShowCattleDialog] = useState(false);
  const [selectedCattleTag, setSelectedCattleTag] = useState('');
  const [cattleSearch, setCattleSearch] = useState('');
  const [menuEvent, setMenuEvent] = useState<HealthEvent | null>(null);
  const visibleEvents = events.filter((item) => item.scope === selectedScope);
  const cattleByTag = useMemo(() => new Map(cattle.map((animal) => [animal.tagNumber, animal])), [cattle]);
  const cattleOptions = useMemo(() => {
    const query = cattleSearch.trim().toLowerCase();
    return cattle.filter((animal) => {
      if (!query) {
        return true;
      }
      return `${animal.tagNumber} ${animal.name} ${animal.breed}`.toLowerCase().includes(query);
    });
  }, [cattle, cattleSearch]);

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
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
    navigation.navigate('Detail', {
      title: item.eventType,
      subtitle: item.scope === 'mass' ? 'Mass herd event' : 'Individual cattle event',
      details: buildEventCardRows(item, cattleByTag).map((row) => ({ label: row.label, value: row.value })),
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
    Alert.alert('Delete event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHealthEvent(event.id);
            await reload();
          } catch (deleteError) {
            Alert.alert('Could not delete event', deleteError instanceof Error ? deleteError.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#F5F7F7]">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Events</Text>
        <View className="flex-row items-center gap-4">
          <Feather name="search" size={20} color="#FFFFFF" />
          <Feather name="filter" size={20} color="#FFFFFF" />
          <Feather name="more-vertical" size={20} color="#FFFFFF" />
        </View>
      </View>

      <View className="flex-row px-6 py-4">
        <Pressable
          onPress={() => setSelectedScope('individual')}
          className={`mr-2 h-12 flex-1 flex-row items-center justify-center rounded-[12px] px-4 ${selectedScope === 'individual' ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'}`}
        >
          <Feather name="calendar" size={20} color={selectedScope === 'individual' ? '#FFFFFF' : '#008B8B'} />
          <Text className={`ml-2 text-[16px] font-bold ${selectedScope === 'individual' ? 'text-white' : 'text-[#008B8B]'}`}>Individual</Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedScope('mass')}
          className={`ml-2 h-12 flex-1 flex-row items-center justify-center rounded-[12px] px-4 ${selectedScope === 'mass' ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'}`}
        >
          <Feather name="users" size={20} color={selectedScope === 'mass' ? '#FFFFFF' : '#008B8B'} />
          <Text className={`ml-2 text-[16px] font-bold ${selectedScope === 'mass' ? 'text-white' : 'text-[#008B8B]'}`}>Mass</Text>
        </Pressable>
      </View>

      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 }}
          onScrollBeginDrag={() => setMenuEvent(null)}
        >
          {visibleEvents.length === 0 ? (
            <View className="items-center justify-center pt-20">
              <Text className="text-center text-[16px] font-bold text-[#008B8B]">{loading ? 'Loading events...' : 'No events yet'}</Text>
              <Text className="mt-2 text-center text-[13px] text-[#6B7280]">{error ?? `No ${selectedScope} events recorded yet.`}</Text>
            </View>
          ) : (
            visibleEvents.map((item) => (
              <EventRecordCard
                key={item.id}
                item={item}
                cattleByTag={cattleByTag}
                menuOpen={menuEvent?.id === item.id}
                onPress={() => {
                  setMenuEvent(null);
                  openEventDetail(item);
                }}
                onMenuPress={() => setMenuEvent((current) => (current?.id === item.id ? null : item))}
                onEdit={() => handleEditEvent(item)}
                onViewCattle={() => handleViewCattle(item)}
                onDelete={() => handleDeleteEvent(item)}
              />
            ))
          )}
        </ScrollView>
      </View>

      <Pressable accessibilityRole="button" onPress={handleAddEvent} className="absolute bottom-[100px] right-6 flex-row items-center rounded-full bg-[#E6B86F] px-5 py-3 shadow-lg">
        <Feather name="plus" size={20} color="#FFFFFF" />
        <Text className="ml-2 text-[16px] font-bold text-white">Add</Text>
      </Pressable>

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between rounded-t-[20px] bg-[#008B8B] px-2 py-2">
        <BottomNavItem icon="home" label="Home" onPress={() => navigation.navigate('Dashboard')} />
        <BottomNavItem icon="briefcase" label="Manage" onPress={() => navigation.navigate('ManageExpenses')} />
        <BottomNavItem icon="compass" label="Explore" onPress={() => navigation.navigate('Events')} />
        <BottomNavItem icon="archive" label="Reports" onPress={() => navigation.navigate('Reports')} />
        <BottomNavItem icon="log-out" label="Logout" onPress={handleLogout} />
      </View>

      <Modal visible={showCattleDialog} transparent animationType="fade" onRequestClose={() => setShowCattleDialog(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowCattleDialog(false)}>
          <Pressable className="max-h-[80%] rounded-t-[24px] bg-white px-6 pb-8 pt-5" onPress={() => {}}>
            <Text className="mb-4 text-center text-[18px] font-bold text-[#1F2937]">Select Cattle</Text>

            <View className="mb-4 h-12 flex-row items-center rounded-[14px] border border-[#D9E4E4] bg-white px-4">
              <Feather name="search" size={18} color="#6B7280" />
              <TextInput value={cattleSearch} onChangeText={setCattleSearch} placeholder="Search cattle" placeholderTextColor="#6B7280" className="ml-3 flex-1 text-[16px] text-[#1F2937]" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {cattleOptions.length === 0 ? (
                <Text className="py-6 text-center text-[14px] text-[#6B7280]">No cattle found</Text>
              ) : (
                cattleOptions.map((animal) => {
                  const selected = selectedCattleTag === animal.tagNumber;
                  return (
                    <Pressable
                      key={animal.id}
                      onPress={() => setSelectedCattleTag(animal.tagNumber)}
                      className={`mb-3 flex-row items-center justify-between rounded-[16px] border px-4 py-4 ${selected ? 'border-[#008B8B] bg-[#E0F7F7]' : 'border-[#E5E7EB] bg-white'}`}
                    >
                      <View className="flex-1">
                        <Text className={`text-[16px] ${selected ? 'font-bold text-[#008B8B]' : 'font-bold text-[#1F2937]'}`}>{animal.name || animal.tagNumber}</Text>
                        <Text className="mt-1 text-[13px] text-[#6B7280]">{animal.tagNumber} • {animal.breed}</Text>
                      </View>
                      {selected ? <Feather name="check" size={18} color="#008B8B" /> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View className="mt-4 flex-row">
              <Pressable onPress={() => setShowCattleDialog(false)} className="mr-2 flex-1 items-center justify-center rounded-[12px] border border-[#008B8B] bg-white py-3">
                <Text className="text-[16px] font-bold text-[#008B8B]">Cancel</Text>
              </Pressable>
              <Pressable onPress={openIndividualEvent} className="ml-2 flex-1 items-center justify-center rounded-[12px] bg-[#E6B86F] py-3">
                <Text className="text-[16px] font-bold text-white">Next</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
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
