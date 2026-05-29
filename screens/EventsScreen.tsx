import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Events'>;

export function EventsScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Events</Text>
        <View className="flex-row gap-4">
          <Feather name="search" size={22} color="#FFFFFF" />
          <Feather name="filter" size={22} color="#FFFFFF" />
          <Feather name="more-horizontal" size={22} color="#FFFFFF" />
        </View>
      </View>

      <View className="flex-row px-6 py-4">
        <View className="mr-2 flex-1 flex-row items-center justify-center rounded-[16px] bg-[#0A9A9D] px-4 py-3">
          <Feather name="calendar" size={18} color="#FFFFFF" />
          <Text className="ml-2 text-[16px] font-bold text-white">Individual</Text>
        </View>
        <View className="ml-2 flex-1 flex-row items-center justify-center rounded-[16px] bg-[#E5F2F3] px-4 py-3">
          <Feather name="users" size={18} color="#0A9A9D" />
          <Text className="ml-2 text-[16px] font-bold text-[#0A9A9D]">Mass</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 120 }}>
        <View className="items-center justify-center pt-20">
          <Text className="text-center text-[16px] text-[#0A9A9D]">No events yet</Text>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate('Action', {
            title: 'Add Event',
            subtitle: 'Create a new event',
            saveLabel: 'Save Event',
          })
        }
        className="absolute bottom-24 right-6 rounded-full bg-[#0A9A9D] px-5 py-4 shadow-lg"
      >
        <Text className="text-[16px] font-bold text-white">+ Add</Text>
      </Pressable>

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
