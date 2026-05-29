import type { ComponentProps, ComponentType } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalvesIcon, CowsIcon, BullsIcon } from '../components/MetricIcons';
import type { RootStackParamList } from '../navigation/types';

type MetricIconProps = {
  size?: number;
  color?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-[#EEF4F4]">
      <View className="rounded-b-[44px] bg-[#0A9A9D] px-6 pb-8 pt-16">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/30">
              <Feather name="user" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-[32px] font-extrabold leading-[36px] text-white">Good Morning,</Text>
              <Text className="text-[32px] font-extrabold leading-[36px] text-white">James</Text>
            </View>
          </View>
          <Feather name="bell" size={24} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-5">
          <Text className="text-[24px] font-extrabold text-[#0A9A9D]">Dashboard</Text>

          <View className="mt-4 flex-row justify-between gap-3">
            <MetricCard title="Calves" value="14" icon={CalvesIcon} />
            <MetricCard title="Cows" value="21" icon={CowsIcon} />
            <MetricCard title="Bulls" value="10" icon={BullsIcon} />
          </View>

          <View className="mt-4 flex-row gap-4">
            <View className="flex-1 rounded-[24px] bg-[#DDECEE] px-4 py-4">
              <Text className="text-center text-[26px] font-extrabold text-[#4B5A5E]">47</Text>
              <Text className="mt-1 text-center text-[18px] font-semibold text-[#5A6A6D]">Total Milk Productions</Text>
            </View>
            <View className="flex-1 rounded-[24px] bg-[#DDECEE] px-4 py-4">
              <Text className="text-center text-[26px] font-extrabold text-[#4B5A5E]">3</Text>
              <Text className="mt-1 text-center text-[18px] font-semibold text-[#5A6A6D]">Health Alerts</Text>
            </View>
          </View>

          <Text className="mt-8 text-[24px] font-extrabold text-[#0A9A9D]">Feeding</Text>
          <View className="mt-3 flex-row gap-4">
            <View className="flex-1 rounded-[18px] bg-[#D3E2E4] p-4">
              <Text className="text-[15px] text-[#4B5A5E]">Recent Feeding</Text>
              <Text className="mt-2 text-[16px] text-[#5B686B]">• Fed 70kg Hay’s</Text>
              <Text className="mt-1 text-[16px] text-[#5B686B]">• Fed 50kg Grain’s</Text>
            </View>
            <View className="flex-1 rounded-[18px] bg-[#D3E2E4] p-4">
              <Text className="text-[15px] text-[#4B5A5E]">Remaining Stock</Text>
              <View className="mt-3 h-3 rounded-full bg-white/80">
                <View className="h-3 w-4/5 rounded-full bg-[#55B7BB]" />
              </View>
              <View className="mt-3 h-3 rounded-full bg-white/80">
                <View className="h-3 w-1/3 rounded-full bg-[#55B7BB]" />
              </View>
            </View>
          </View>

          <Text className="mt-8 text-[24px] font-extrabold text-[#0A9A9D]">Quick Links</Text>
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-6">
            <QuickLink icon="truck" label="Cattle" onPress={() => navigation.navigate('CattleList')} />
            <QuickLink icon="coffee" label="Milk Records" onPress={() => navigation.navigate('MilkRecords')} />
            <QuickLink icon="calendar" label="Events" onPress={() => navigation.navigate('Events')} />
            <QuickLink icon="dollar-sign" label="Transactions" onPress={() => navigation.navigate('Transactions')} />
            <QuickLink icon="settings" label="Farm Setup" onPress={() => navigation.navigate('FarmSetup')} />
          </View>
        </View>
      </ScrollView>

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

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: ComponentType<MetricIconProps> }) {
  return (
    <View className="flex-1 rounded-[24px] bg-[#DDECEE] px-4 py-4">
      <View className="items-center">
        <Icon size={30} color="#008B8B" />
        <Text className="mt-1 text-[18px] font-semibold text-[#596A6D]">{title}</Text>
        <Text className="text-[28px] font-extrabold text-[#4B5A5E]">{value}</Text>
      </View>
    </View>
  );
}


function QuickLink({ icon, label, onPress }: { icon: ComponentProps<typeof Feather>['name']; label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="w-[30%] items-center"
      android_ripple={{ color: 'rgba(10,154,157,0.08)' }}
    >
      <View className="h-20 w-20 items-center justify-center rounded-full bg-[#CDE2E4]">
        <Feather name={icon} size={26} color="#0A9A9D" />
      </View>
      <Text className="mt-2 text-center text-[19px] font-semibold text-[#23292B]">{label}</Text>
    </Pressable>
  );
}

function BottomNavItem({ icon, label, onPress }: { icon: ComponentProps<typeof Feather>['name']; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="items-center px-2 py-2" android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
      <Feather name={icon} size={24} color="#FFFFFF" />
      <Text className="mt-1 text-[11px] text-white">{label}</Text>
    </Pressable>
  );
}