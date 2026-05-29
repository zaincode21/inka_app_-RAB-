import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

export function ReportsScreen({ navigation }: Props) {
  const reports = [
    { id: 'transactions', label: 'Transactions', icon: 'credit-card' },
    { id: 'milk', label: 'Milk Records', icon: 'coffee' },
    { id: 'cattle', label: 'Cattle', icon: 'shield' },
    { id: 'events', label: 'Events', icon: 'calendar' },
    { id: 'breeding', label: 'Breeding', icon: 'activity' },
    { id: 'pregnancies', label: 'Pregnancies', icon: 'heart' },
    { id: 'weight', label: 'Weight', icon: 'bar-chart-2' },
    { id: 'stages', label: 'Stage Tracking', icon: 'map' },
  ] as const;

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Text className="text-center text-[24px] font-extrabold text-white">Reports</Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable className="mb-3 flex-row items-center rounded-[16px] bg-white px-4 py-4">
            <Feather name={item.icon} size={22} color="#1F2937" />
            <Text className="ml-4 flex-1 text-[16px] text-[#1F2937]">{item.label}</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>
        )}
      />

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between rounded-t-[22px] bg-[#0A9A9D] px-4 pb-6 pt-3">
        <BottomNavItem icon="home" label="Home" onPress={() => navigation.navigate('Dashboard')} />
        <BottomNavItem icon="briefcase" label="Manage" onPress={() => navigation.navigate('ManageExpenses')} />
        <BottomNavItem icon="compass" label="Explore" onPress={() => navigation.navigate('Events')} />
        <BottomNavItem icon="archive" label="Reports" onPress={() => navigation.navigate('Reports')} />
        <BottomNavItem icon="user" label="Profile" onPress={() => navigation.navigate('SignUp')} />
      </View>

      <StatusBar style="light" />
    </View>
  );
}

function BottomNavItem({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="items-center px-2 py-2">
      <Feather name={icon} size={24} color="#FFFFFF" />
      <Text className="mt-1 text-[11px] text-white">{label}</Text>
    </Pressable>
  );
}
