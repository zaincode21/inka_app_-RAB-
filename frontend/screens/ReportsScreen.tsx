import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, Text, View } from 'react-native';
import { logout } from '../data/authApi';
import { getReportSummaries, useDatabaseQuery } from '../data/farmDatabase';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

export function ReportsScreen({ navigation }: Props) {
  const { data: reports } = useDatabaseQuery(getReportSummaries, []);
  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Text className="text-center text-[24px] font-extrabold text-white">Reports</Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Detail', {
                title: item.label,
                subtitle: 'Report summary',
                details: [
                  { label: 'Value', value: item.value },
                  { label: 'Detail', value: item.detail },
                ],
              })
            }
            className="mb-3 flex-row items-center rounded-[16px] bg-white px-4 py-4"
          >
            <Feather name={item.icon} size={22} color="#1F2937" />
            <View className="ml-4 flex-1">
              <Text className="text-[16px] font-bold text-[#1F2937]">{item.label}</Text>
              <Text className="mt-1 text-[13px] text-[#6B7280]">{item.detail}</Text>
            </View>
            <Text className="mr-3 text-[15px] font-bold text-[#008B8B]">{item.value}</Text>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>
        )}
      />

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between rounded-t-[20px] bg-[#008B8B] px-2 py-2">
        <BottomNavItem icon="home" label="Home" onPress={() => navigation.navigate('Dashboard')} />
        <BottomNavItem icon="briefcase" label="Manage" onPress={() => navigation.navigate('ManageExpenses')} />
        <BottomNavItem icon="compass" label="Explore" onPress={() => navigation.navigate('Events')} />
        <BottomNavItem icon="archive" label="Reports" onPress={() => navigation.navigate('Reports')} />
        <BottomNavItem icon="log-out" label="Logout" onPress={handleLogout} />
      </View>

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
