import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { logout, getCurrentSession } from '../data/authApi';
import { useRequireAccess } from '../data/accessGuard';
import { formatMoney, getDashboardMetrics, getTransactions, useDatabaseQuery } from '../data/farmDatabase';
import { canViewFinance, canWriteFinance } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageExpenses'>;

export function ManageExpensesScreen({ navigation }: Props) {
  const user = getCurrentSession()?.user;
  useRequireAccess(canViewFinance(user), navigation, 'You do not have permission to view financial records.');
  const canWrite = canWriteFinance(user);
  const { data: metrics } = useDatabaseQuery(getDashboardMetrics, {
    calves: 0,
    cows: 0,
    bulls: 0,
    totalMilkToday: 0,
    healthAlerts: 0,
    incomeThisMonth: 0,
    expensesThisMonth: 0,
  });
  const { data: transactions } = useDatabaseQuery(getTransactions, []);
  const summary = [
    { id: 'costs', label: 'Total Costs', value: formatMoney(metrics.expensesThisMonth), color: '#DC2626', icon: 'arrow-down' },
    { id: 'earnings', label: 'Total Earnings', value: formatMoney(metrics.incomeThisMonth), color: '#16A34A', icon: 'arrow-up' },
  ] as const;
  const handleLogout = () => {
    void (async () => {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    })();
  };

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <View className="rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
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
          <Pressable onPress={() => navigation.navigate('Transactions')}>
            <Text className="text-[14px] text-[#008B8B]">View All</Text>
          </Pressable>
        </View>

        <FlatList
          data={transactions.slice(0, 8)}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingTop: 12 }}
          ListEmptyComponent={
            <View className="rounded-[16px] bg-white px-4 py-8">
              <Text className="text-center text-[15px] font-bold text-[#008B8B]">No financial records yet</Text>
              <Text className="mt-2 text-center text-[13px] text-[#6B7280]">Add income or expenses to populate monthly cost and earning totals.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate('Detail', {
                  title: item.title,
                  subtitle: item.kind === 'income' ? 'Income transaction' : 'Expense transaction',
                  details: [
                    { label: 'Amount', value: formatMoney(item.amount) },
                    { label: 'Type', value: item.kind },
                    { label: 'Category', value: item.category },
                    { label: 'Date', value: item.date },
                    { label: 'Payment', value: item.paymentMethod || 'Not recorded' },
                    { label: item.kind === 'income' ? 'Buyer' : 'Vendor', value: item.buyerVendor || 'Not recorded' },
                    { label: 'Receipt No', value: item.receiptNumber || 'Not recorded' },
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
                <Text className="mt-1 text-[14px] text-[#6B7280]">{item.date}</Text>
              </View>
              <Text className={`text-[16px] font-bold ${item.kind === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{formatMoney(item.amount)}</Text>
            </Pressable>
          )}
        />
      </ScrollView>

      {canWrite ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddExpense')}
          className="absolute bottom-24 right-6 rounded-[12px] bg-[#E6B86F] px-5 py-4 shadow-lg"
        >
          <Text className="text-[16px] font-bold text-white">+ Add</Text>
        </Pressable>
      ) : null}

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
