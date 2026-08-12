import { Feather } from '@expo/vector-icons';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { formatMoney, formatNumber, getTransactions, listAttachments, useDatabaseQuery } from '../data/farmDatabase';
import { useRequireAccess } from '../data/accessGuard';
import { getCurrentSession } from '../data/authApi';
import { canViewFinance, canWriteFinance } from '../data/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;
type TransactionTab = 'income' | 'expense';

export function TransactionsScreen({ navigation }: Props) {
  const user = getCurrentSession()?.user;
  useRequireAccess(canViewFinance(user), navigation, 'You do not have permission to view financial records.');
  const canWrite = canWriteFinance(user);
  const { data: transactions, loading, error } = useDatabaseQuery(getTransactions, []);
  const [selectedTab, setSelectedTab] = useState<TransactionTab>('income');

  const filteredTransactions = useMemo(
    () => transactions.filter((item) => item.kind === selectedTab),
    [transactions, selectedTab],
  );

  const emptyTitle =
    selectedTab === 'income'
      ? loading
        ? 'Loading income...'
        : 'No income yet'
      : loading
        ? 'Loading expenses...'
        : 'No expenses yet';
  const emptyBody =
    error ??
    (selectedTab === 'income'
      ? 'Record milk sales and other income here.'
      : 'Record feed, vet, and other expenses here.');

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center rounded-b-[50px] bg-[#008B8B] px-6 pb-6 pt-12">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-center text-[24px] font-extrabold text-white">Transactions</Text>
        <View className="w-[30px]" />
      </View>

      <View className="flex-row px-6 py-4">
        <Pressable
          onPress={() => setSelectedTab('income')}
          className={`mr-2 h-12 flex-1 flex-row items-center justify-center rounded-[12px] px-4 ${
            selectedTab === 'income' ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'
          }`}
        >
          <Feather name="dollar-sign" size={20} color={selectedTab === 'income' ? '#FFFFFF' : '#008B8B'} />
          <Text className={`ml-2 text-[16px] font-bold ${selectedTab === 'income' ? 'text-white' : 'text-[#008B8B]'}`}>
            Income
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedTab('expense')}
          className={`ml-2 h-12 flex-1 flex-row items-center justify-center rounded-[12px] px-4 ${
            selectedTab === 'expense' ? 'bg-[#E6B86F]' : 'border border-[#008B8B] bg-white'
          }`}
        >
          <Feather name="minus-circle" size={20} color={selectedTab === 'expense' ? '#FFFFFF' : '#008B8B'} />
          <Text className={`ml-2 text-[16px] font-bold ${selectedTab === 'expense' ? 'text-white' : 'text-[#008B8B]'}`}>
            Expense
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 120 }}>
        {filteredTransactions.length === 0 ? (
          <View className="items-center justify-center pt-20">
            <Text className="text-center text-[16px] font-bold leading-5 text-[#008B8B]">{emptyTitle}</Text>
            <Text className="mt-2 text-center text-[13px] text-[#6B7280]">{emptyBody}</Text>
          </View>
        ) : (
          filteredTransactions.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                void (async () => {
                  let imageUri: string | undefined;
                  try {
                    const attachments = await listAttachments({ transactionId: item.id });
                    imageUri = attachments[0]?.uri;
                  } catch {
                    imageUri = undefined;
                  }
                  navigation.navigate('Detail', {
                    title: item.title,
                    subtitle: item.kind === 'income' ? 'Income transaction' : 'Expense transaction',
                    imageUri,
                    details: [
                      { label: 'Date', value: item.date },
                      { label: 'Category', value: item.category },
                      { label: 'Amount', value: formatMoney(item.amount) },
                      {
                        label: 'Quantity / Unit Price',
                        value: `${formatNumber(item.quantity)} / ${formatMoney(item.unitPrice)}`,
                      },
                      { label: 'Payment Method', value: item.paymentMethod || 'Not recorded' },
                      {
                        label: item.kind === 'income' ? 'Buyer' : 'Vendor',
                        value: item.buyerVendor || 'Not recorded',
                      },
                      { label: 'Receipt No', value: item.receiptNumber || 'Not recorded' },
                      {
                        label: 'Tax / Discount',
                        value: `${formatMoney(item.taxAmount)} / ${formatMoney(item.discountAmount)}`,
                      },
                      { label: 'Linked Cattle', value: item.linkedCattleTag || 'Not linked' },
                      { label: 'Notes', value: item.notes || 'None' },
                      ...(item.recordedBy ? [{ label: 'Recorded by', value: item.recordedBy }] : []),
                    ],
                  });
                })();
              }}
              className="mb-3 flex-row items-center rounded-[16px] bg-[#E0F7F7] px-4 py-4"
            >
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  item.kind === 'income' ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'
                }`}
              >
                <Feather
                  name={item.kind === 'income' ? 'arrow-up-right' : 'arrow-down-right'}
                  size={18}
                  color={item.kind === 'income' ? '#16A34A' : '#DC2626'}
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[16px] font-semibold text-[#1F2937]">{item.title}</Text>
                <Text className="mt-1 text-[13px] text-[#6B7280]">
                  {item.date} · {item.category}
                </Text>
              </View>
              <Text
                className={`text-[15px] font-bold ${item.kind === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}
              >
                {formatMoney(item.amount)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {canWrite ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate(selectedTab === 'income' ? 'AddIncome' : 'AddExpense')}
          className="absolute bottom-6 right-6 flex-row items-center rounded-[12px] bg-[#E6B86F] px-5 py-[14px] shadow-lg"
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text className="ml-2 text-[16px] font-bold text-white">
            {selectedTab === 'income' ? 'Income' : 'Expense'}
          </Text>
        </Pressable>
      ) : null}

      <StatusBar style="light" />
    </View>
  );
}
