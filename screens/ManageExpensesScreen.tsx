import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageExpenses'>;

export function ManageExpensesScreen({ navigation }: Props) {
  const summary = [
    { id: 'costs', label: 'Total Costs', value: '$4,250.75', color: '#DC2626', icon: 'arrow-down' },
    { id: 'earnings', label: 'Total Earnings', value: '$11,800.00', color: '#16A34A', icon: 'arrow-up' },
  ] as const;

  const transactions = [
    { id: '1', title: 'Vet supplies', amount: '$120.00', kind: 'expense' },
    { id: '2', title: 'Milk sale', amount: '$560.00', kind: 'income' },
    { id: '3', title: 'Feed purchase', amount: '$230.00', kind: 'expense' },
  ];

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="bg-[#0A9A9D] px-6 pb-5 pt-14">
        <Text className="text-center text-[24px] font-extrabold text-white">Manage Expenses</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-[#1F2937]">Quick Summary</Text>
          <View className="rounded-full border border-[#D1D5DB] px-4 py-2">
            <Text className="text-[14px] text-[#1F2937]">This Month</Text>
          </View>
        </View>

        <View className="flex-row gap-4">
          {summary.map((card) => (
            <View key={card.id} className="flex-1 rounded-[20px] bg-white p-5 shadow-sm">
              <View className={`h-10 w-10 items-center justify-center rounded-full ${card.id === 'costs' ? 'bg-[#FEE2E2]' : 'bg-[#DCFCE7]'}`}>
                <Feather name={card.icon} size={20} color={card.color} />
              </View>
              <Text className="mt-4 text-[14px] text-[#6B7280]">{card.label}</Text>
              <Text className="mt-2 text-[24px] font-extrabold" style={{ color: card.color }}>
                {card.value}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-8 flex-row items-center justify-between">
          <Text className="text-[18px] font-bold text-[#1F2937]">Recent Transactions</Text>
          <Pressable>
            <Text className="text-[14px] text-[#0A9A9D]">View All</Text>
          </Pressable>
        </View>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingTop: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('Detail', {
                  title: item.title,
                  subtitle: item.kind === 'income' ? 'Income transaction' : 'Expense transaction',
                  details: [
                    { label: 'Amount', value: item.amount },
                    { label: 'Type', value: item.kind },
                    { label: 'Date', value: 'Today' },
                  ],
                })
              }
              className="mb-3 flex-row items-center rounded-[16px] bg-white px-4 py-4"
            >
              <View className={`h-10 w-10 items-center justify-center rounded-full ${item.kind === 'income' ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                <Feather name={item.kind === 'income' ? 'arrow-up-right' : 'arrow-down-right'} size={18} color={item.kind === 'income' ? '#16A34A' : '#DC2626'} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[16px] font-semibold text-[#1F2937]">{item.title}</Text>
                <Text className="mt-1 text-[14px] text-[#6B7280]">Recorded today</Text>
              </View>
              <Text className={`text-[16px] font-bold ${item.kind === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{item.amount}</Text>
            </Pressable>
          )}
        />
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('AddExpense')}
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
